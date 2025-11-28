import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
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
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    NgSelectModule
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  @Output() closeRequest = new EventEmitter<void>();

  searchControl = new FormControl('');
  categoryControl = new FormControl<string | null>(null);
  
  results$!: Observable<UsuarioSearchResultDto[]>;
  categories$!: Observable<Categoria[]>;

  isLoading = false;
  hasSearched = false;

  constructor(
    private usuarioService: UsuarioService,
    private categoriaService: CategoriaService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.categories$ = this.categoriaService.getCategories();

    this.results$ = combineLatest([
      this.searchControl.valueChanges.pipe(startWith('')),
      this.categoryControl.valueChanges.pipe(startWith('')) 
    ]).pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(([query, categoryId]) => {
        const hasQuery = query && query.trim().length >= 2;
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
        const hasCategory = !!categoryId;
        
        if (!hasQuery && !hasCategory) {
          return of([]);
        }

        const finalQuery = hasQuery ? query.trim() : "";
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
    this.closeRequest.emit();
  }

  goToProfile(username: string): void {
    this.router.navigate([`profile/${username}`]).then(() => {
      this.closeModal();
    });
  }
}
