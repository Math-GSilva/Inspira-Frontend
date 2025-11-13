import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Imports do Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { SearchComponent } from './search.component';
import { UsuarioService } from '../features/usuarios-search/usuario.service';
import { CategoriaService } from '../features/categorias/categoria.service';
import { UsuarioSearchResultDto } from '../core/models/usuario-search-response.model';
import { Categoria } from '../core/models/categoria.model';

// --- Mocks ---
const mockResults: UsuarioSearchResultDto[] = [
  { id: 'u1', username: 'user1', nomeCompleto: 'User Um', urlFotoPerfil: 'img1.jpg', seguidoPeloUsuarioAtual: false },
  { id: 'u2', username: 'user2', nomeCompleto: 'User Dois', urlFotoPerfil: '', seguidoPeloUsuarioAtual: true }
];

const mockCategories: Categoria[] = [
  { id: 'c1', nome: 'Cat 1', descricao: '' },
  { id: 'c2', nome: 'Cat 2', descricao: '' }
];

const mockUsuarioService = jasmine.createSpyObj('UsuarioService', ['searchUsers', 'followUser', 'unfollowUser']);
const mockCategoriaService = jasmine.createSpyObj('CategoriaService', ['getCategories']);
const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

fdescribe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SearchComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule
      ],
      providers: [
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: CategoriaService, useValue: mockCategoriaService },
        { provide: Router, useValue: mockRouter }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    
    mockCategoriaService.getCategories.and.returnValue(of(mockCategories));
    mockUsuarioService.searchUsers.and.returnValue(of(mockResults));
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Inicialização ---
  describe('Initialization', () => {
    it('should load categories on init', () => {
      expect(mockCategoriaService.getCategories).toHaveBeenCalled();
      component.categories$.subscribe(cats => {
        expect(cats.length).toBe(2);
      });
    });

    it('should lock body scroll on init and restore on destroy', () => {
      expect(document.body.style.overflow).toBe('hidden');
      component.ngOnDestroy();
      expect(document.body.style.overflow).toBe('');
    });
  });

  // --- Lógica de Busca (Filtros) ---
  describe('Search Logic', () => {
    
    it('should not search if query is too short and no category selected', fakeAsync(() => {
      // Assinar manualmente para ativar o pipeline
      const sub = component.results$.subscribe();
      
      mockUsuarioService.searchUsers.calls.reset();
      
      // 1. Digita algo curto
      component.searchControl.setValue('a');
      
      // Avança o tempo (debounce)
      tick(300);

      expect(component.isLoading).toBeFalse();
      expect(mockUsuarioService.searchUsers).not.toHaveBeenCalled();
      
      sub.unsubscribe(); // Limpa timers pendentes
    }));

    it('should search when query length >= 2', fakeAsync(() => {
      const sub = component.results$.subscribe(); // Ativa o observable

      component.searchControl.setValue('ab');
      
      tick(300); // Espera o debounceTime(300)

      expect(mockUsuarioService.searchUsers).toHaveBeenCalledWith('ab', '');
      expect(component.isLoading).toBeFalse(); 
      
      sub.unsubscribe();
    }));

    it('should search when category is selected (even without text)', fakeAsync(() => {
      const sub = component.results$.subscribe();

      component.categoryControl.setValue('c1');
      
      tick(300);

      expect(mockUsuarioService.searchUsers).toHaveBeenCalledWith('', 'c1');
      
      sub.unsubscribe();
    }));

    it('should combine text and category filters', fakeAsync(() => {
      const sub = component.results$.subscribe();

      component.searchControl.setValue('test');
      component.categoryControl.setValue('c2');
      
      tick(300); // Debounce reinicia a cada valor, então 300ms após o último basta

      expect(mockUsuarioService.searchUsers).toHaveBeenCalledWith('test', 'c2');
      
      sub.unsubscribe();
    }));

    it('should handle search error gracefully', fakeAsync(() => {
      const sub = component.results$.subscribe();
      
      mockUsuarioService.searchUsers.and.returnValue(throwError(() => new Error('Erro')));
      
      component.searchControl.setValue('erro');
      
      tick(300); // Dispara a busca

      // Não deve quebrar o observable (graças ao catchError -> of([]))
      // O subscribe acima continuaria vivo
      expect(component.isLoading).toBeFalse();
      
      sub.unsubscribe(); // Mata o debounceTime pendente
      
      // Garante que nenhum timer extra sobrou (segurança extra para o erro "1 periodic timer")
      discardPeriodicTasks(); 
    }));
  });

  // --- Interações de Usuário ---
  describe('User Interaction', () => {
    
    it('should toggle follow status (Follow)', () => {
      const user = mockResults[0];
      mockUsuarioService.followUser.and.returnValue(of({}));

      component.toggleFollow(user);

      expect(mockUsuarioService.followUser).toHaveBeenCalledWith(user.id);
      expect(user.seguidoPeloUsuarioAtual).toBeTrue();
    });

    it('should toggle follow status (Unfollow)', () => {
      const user = mockResults[1];
      mockUsuarioService.unfollowUser.and.returnValue(of({}));

      component.toggleFollow(user);

      expect(mockUsuarioService.unfollowUser).toHaveBeenCalledWith(user.id);
      expect(user.seguidoPeloUsuarioAtual).toBeFalse();
    });

    it('should emit close event when closeModal is called', () => {
      spyOn(component.close, 'emit');
      component.closeModal();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should navigate to profile and then close modal', fakeAsync(() => {
      spyOn(component, 'closeModal');
      
      component.goToProfile('user1');
      
      tick(); 

      expect(mockRouter.navigate).toHaveBeenCalledWith(['profile/user1']);
      expect(component.closeModal).toHaveBeenCalled();
    }));
  });
});