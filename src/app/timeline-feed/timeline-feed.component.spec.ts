import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, BehaviorSubject, Subject } from 'rxjs';
import { PlyrModule } from '@atom-platform/ngx-plyr';

import { TimelineFeedComponent } from './timeline-feed.component';
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service';
import { CurtidaService } from '../features/curtidas/curtida.service';
import { ComentarioService } from '../features/comentarios/comentario.service';
import { AuthService } from '../features/auth/auth.service';
import { PostStateService } from '../features/obras-de-arte/post-state.service';

import { ObraDeArte } from '../core/models/obra-de-arte.model';
import { DecodedToken } from '../features/auth/decoded-token.model';

import { CommentsModalComponent } from '../comments-modal/comments-modal.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { EditPostModalComponent } from '../edit-post-modal/edit-post-modal.component';

import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({ selector: 'app-comments-modal', standalone: true, template: '' })
class MockCommentsModalComponent {
  @Input() obraDeArteId: any;
  @Output() close = new EventEmitter<void>();
}

@Component({ selector: 'app-confirmation-modal', standalone: true, template: '' })
class MockConfirmationModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() message = '';
  @Input() confirmButtonText = '';
  @Input() confirmButtonClass = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
}

@Component({ selector: 'app-edit-post-modal', standalone: true, template: '' })
class MockEditPostModalComponent {
  @Input() artwork: any;
  @Output() close = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<any>();
}

const dummyUser: DecodedToken = {
  sub: '1',
  name: 'Tester',
  email: 'test@test.com',
  role: 'Artista',
  exp: 1234567890,
  urlPerfil: ''
};

const dummyArtwork: ObraDeArte = {
  id: 'art-1',
  titulo: 'Arte Teste',
  descricao: 'Desc',
  url: 'http://img.jpg',
  autorUsername: 'Tester',
  tipoConteudoMidia: 'image/jpeg',
  dataPublicacao: new Date().toISOString(),
  totalCurtidas: 10,
  curtidaPeloUsuario: false,
  urlFotoPerfilAutor: '',
  categoriaNome: 'Pintura'
};

const paginatedResponse = {
  items: [dummyArtwork],
  nextCursor: 'cursor-123',
  hasMoreItems: true
};

const mockObraService = jasmine.createSpyObj('ObraDeArteService', ['getAll', 'deleteObra']);
const mockCurtidaService = jasmine.createSpyObj('CurtidaService', ['curtir', 'descurtir']);
const mockComentarioService = jasmine.createSpyObj('ComentarioService', ['criarComentario']);

const mockAuthService = {
  currentUserValue: dummyUser
};

const newPostSubject = new Subject<ObraDeArte>();
const mockPostStateService = {
  newPost$: newPostSubject.asObservable()
};

describe('TimelineFeedComponent', () => {
  let component: TimelineFeedComponent;
  let fixture: ComponentFixture<TimelineFeedComponent>;

  const mockIntersectionObserver = jasmine.createSpyObj('IntersectionObserver', ['observe', 'disconnect']);

  beforeEach(async () => {
    window.IntersectionObserver = jasmine.createSpy().and.returnValue(mockIntersectionObserver) as any;

    await TestBed.configureTestingModule({
      imports: [
        TimelineFeedComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        PlyrModule
      ],
      providers: [
        { provide: ObraDeArteService, useValue: mockObraService },
        { provide: CurtidaService, useValue: mockCurtidaService },
        { provide: ComentarioService, useValue: mockComentarioService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PostStateService, useValue: mockPostStateService }
      ]
    })
    .overrideComponent(TimelineFeedComponent, {
      remove: { 
        imports: [
          CommentsModalComponent, 
          ConfirmationModalComponent, 
          EditPostModalComponent
        ] 
      },
      add: { 
        imports: [
          MockCommentsModalComponent, 
          MockConfirmationModalComponent, 
          MockEditPostModalComponent
        ] 
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimelineFeedComponent);
    component = fixture.componentInstance;

    mockObraService.getAll.calls.reset();
    mockObraService.getAll.and.returnValue(of(paginatedResponse));
    mockObraService.deleteObra.calls.reset();
    mockCurtidaService.curtir.and.returnValue(of({ curtiu: true, totalCurtidas: 11 }));
    mockCurtidaService.descurtir.and.returnValue(of({ curtiu: false, totalCurtidas: 9 }));
    mockComentarioService.criarComentario.and.returnValue(of({}));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization & Loading', () => {
    it('should load artworks on init', () => {
      expect(mockObraService.getAll).toHaveBeenCalled();
      expect(component.artworks.length).toBe(1);
      expect(component.artworks[0].id).toBe('art-1');
    });

    it('should setup IntersectionObserver', () => {
      expect(window.IntersectionObserver).toHaveBeenCalled();
      expect(mockIntersectionObserver.observe).toHaveBeenCalled();
    });

    it('should disconnect observer on destroy', () => {
      component.ngOnDestroy();
      expect(mockIntersectionObserver.disconnect).toHaveBeenCalled();
    });

    it('should load more artworks when loadArtworks is called (pagination)', () => {
      mockObraService.getAll.and.returnValue(of({
        items: [{ ...dummyArtwork, id: 'art-2' }],
        nextCursor: 'cursor-456',
        hasMoreItems: false
      }));

      component.loadArtworks();

      expect(component.artworks.length).toBe(2);
      expect(component.artworks[1].id).toBe('art-2');
      expect(component.hasMoreItems).toBeFalse();
    });
  });

  describe('Real-time Updates', () => {
    it('should prepend new post when PostStateService emits', () => {
      const newPost = { ...dummyArtwork, id: 'art-new', titulo: 'Novo Post' };
      newPostSubject.next(newPost);

      expect(component.artworks.length).toBe(2);
      expect(component.artworks[0].id).toBe('art-new');
      expect(component.commentForms.has('art-new')).toBeTrue();
    });
  });

  describe('Permissions & Options Menu', () => {
    it('should allow edit/delete for owner', () => {
      const art = component.artworks[0];
      expect(art.canEdit).toBeTrue();
      expect(art.canDelete).toBeTrue();
    });

    it('should toggle options menu visibility', () => {
      const art = component.artworks[0];
      art.isOptionsMenuOpen = false;

      component.toggleOptionsMenu(art);
      expect(art.isOptionsMenuOpen).toBeTrue();

      component.toggleOptionsMenu(art);
      expect(art.isOptionsMenuOpen).toBeFalse();
    });
  });

  describe('Interactions', () => {
    it('should toggle like status', () => {
      const art = component.artworks[0];
      art.curtidaPeloUsuario = false;

      component.toggleLike(art);

      expect(mockCurtidaService.curtir).toHaveBeenCalledWith(art.id);
      expect(art.curtidaPeloUsuario).toBeTrue();
      expect(art.totalCurtidas).toBe(11);
    });

    it('should submit comment', () => {
      const art = component.artworks[0];
      const form = component.commentForms.get(art.id);
      form?.setValue({ texto: 'Comentário' });

      component.submitComment(art);

      expect(mockComentarioService.criarComentario).toHaveBeenCalled();
      expect(form?.value.texto).toBeNull();
    });
  });

  describe('Modals Logic', () => {
    it('should open/close comments modal', () => {
      component.openCommentsModal('art-1');
      expect(component.isCommentsModalOpen).toBeTrue();
      expect(component.selectedArtworkIdForModal).toBe('art-1');

      component.closeCommentsModal();
      expect(component.isCommentsModalOpen).toBeFalse();
    });

    it('should open edit modal and handle update success', () => {
      const art = component.artworks[0];
      component.onEditPost(art);
      
      expect(component.isEditModalOpen).toBeTrue();
      expect(component.artworkToEdit).toBe(art);

      const updatedArt = { ...art, titulo: 'Título Editado' };
      component.handleUpdateSuccess(updatedArt);

      expect(component.isEditModalOpen).toBeFalse();
      expect(component.artworks[0].titulo).toBe('Título Editado');
    });

    it('should open confirm modal, delete post on confirm and remove from list', () => {
      const art = component.artworks[0];
      mockObraService.deleteObra.and.returnValue(of({}));

      component.onDeletePost(art);
      expect(component.isConfirmModalOpen).toBeTrue();

      component.handleConfirmDelete();

      expect(component.isConfirmModalOpen).toBeFalse();
      expect(mockObraService.deleteObra).toHaveBeenCalledWith(art.id);
      
      expect(component.artworks.length).toBe(0);
    });
  });
});