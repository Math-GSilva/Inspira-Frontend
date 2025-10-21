import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, startWith, finalize, tap } from 'rxjs/operators';
import { UsuarioSearchResultDto } from '../core/models/usuario-search-response.model';
import { UsuarioService } from '../features/usuarios-search/usuario.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  searchControl = new FormControl('');
  results$!: Observable<UsuarioSearchResultDto[]>;
  isLoading = false;
  hasSearched = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.results$ = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      // Usamos `tap` para efeitos colaterais como mudar o estado de loading.
      // Isso garante que o estado mude antes da chamada assíncrona.
      tap(query => {
        if (query && query.trim().length >= 2) {
          this.isLoading = true;
          this.hasSearched = true;
        } else {
          this.hasSearched = false;
        }
      }),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          return of([]); // Retorna um array vazio se a busca for inválida
        }
        // A chamada de serviço agora só se preocupa em buscar os dados.
        return this.usuarioService.searchUsers(query).pipe(
          // `finalize` é ótimo porque é executado na conclusão ou erro.
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

