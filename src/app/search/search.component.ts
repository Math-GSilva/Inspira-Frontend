import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, startWith, finalize, tap } from 'rxjs/operators';
import { UsuarioSearchResultDto } from '../core/models/usuario-search-response.model';
import { UsuarioService } from '../features/usuarios-search/usuario.service';
import { CategoriaService } from '../features/categorias/categoria.service';
import { Categoria } from '../core/models/categoria.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  // Controles para os dois campos de filtro
  searchControl = new FormControl('');
  // ALTERADO: FormControl agora é do tipo string e inicia com uma string vazia.
  categoryControl = new FormControl<string>(''); 
  
  // Observables para resultados e categorias
  results$!: Observable<UsuarioSearchResultDto[]>;
  categories$!: Observable<Categoria[]>;

  // Estado da UI
  isLoading = false;
  hasSearched = false;

  constructor(
    private usuarioService: UsuarioService,
    private categoriaService: CategoriaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Busca as categorias para popular o dropdown
    this.categories$ = this.categoriaService.getCategories();

    // Combina os valueChanges dos dois controles para acionar a busca
    this.results$ = combineLatest([
      this.searchControl.valueChanges.pipe(startWith('')),
      // ALTERADO: Inicia com uma string vazia para corresponder ao novo tipo.
      this.categoryControl.valueChanges.pipe(startWith('')) 
    ]).pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(([query, categoryId]) => {
        const hasQuery = query && query.trim().length >= 2;
        // ALTERADO: A verificação agora é se a string categoryId não está vazia.
        const hasCategory = !!categoryId; 
        if (hasQuery || hasCategory) {
          this.isLoading = true;
          this.hasSearched = true;
        } else {
          this.hasSearched = false;
        }
      }),
      switchMap(([query, categoryId]) => {
        const hasQuery = query && query.trim().length >= 2;
        // ALTERADO: A verificação agora é se a string categoryId não está vazia.
        const hasCategory = !!categoryId;
        
        if (!hasQuery && !hasCategory) {
          return of([]); // Se nenhum filtro for válido, retorna array vazio
        }

        // Passa os valores (ou string vazia) para o serviço
        const finalQuery = hasQuery ? query.trim() : "";
        // ALTERADO: Simplificado, pois categoryId já é uma string ou uma string vazia.
        const finalCategory = categoryId || "";

        return this.usuarioService.searchUsers(finalQuery, finalCategory).pipe(
          finalize(() => this.isLoading = false),
          catchError(() => of([]))
        );
      }),
      startWith([])
    );
  }

  toggleFollow(user: UsuarioSearchResultDto): void {
    const action$ = user.seguidoPeloUsuarioAtual
      ? this.usuarioService.unfollowUser(user.id)
      : this.usuarioService.followUser(user.id);

    action$.subscribe(() => {
      user.seguidoPeloUsuarioAtual = !user.seguidoPeloUsuarioAtual;
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  goToProfile(username: string): void {
    this.router.navigate(['/profile', username]);
    this.closeModal();
  }
}
