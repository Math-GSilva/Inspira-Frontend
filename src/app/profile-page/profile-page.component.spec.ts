import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { PlyrModule } from '@atom-platform/ngx-plyr';

import { ProfilePageComponent } from './profile-page.component';
import { UsuarioService } from '../features/usuarios-search/usuario.service';
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service';
import { AuthService } from '../features/auth/auth.service';
import { CurtidaService } from '../features/curtidas/curtida.service';
import { ComentarioService } from '../features/comentarios/comentario.service';

import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav.component';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';
import { CommentsModalComponent } from '../comments-modal/comments-modal.component';

import { UsuarioProfile } from '../core/models/usuario-profile.model';
import { ObraDeArte } from '../core/models/obra-de-arte.model';

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DecodedToken } from '../features/auth/decoded-token.model';

@Component({ selector: 'app-sidebar-nav', standalone: true, template: '' })
class MockSidebarNavComponent {}

@Component({ selector: 'app-edit-profile-modal', standalone: true, template: '' })
class MockEditProfileModalComponent {
  @Input() userProfile: any;
  @Input() userRole: any;
  @Output() close = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<any>();
}

@Component({ selector: 'app-comments-modal', standalone: true, template: '' })
class MockCommentsModalComponent {
  @Input() obraDeArteId: any;
  @Output() close = new EventEmitter<void>();
}

const dummyProfile: UsuarioProfile = {
  id: 'u1',
  username: 'artist',
  nomeCompleto: 'Artista Teste',
  bio: 'Bio',
  urlFotoPerfil: 'img.jpg',
  contagemSeguidores: 10,
  contagemSeguindo: 5,
  seguidoPeloUsuarioAtual: false,
  categoriaPrincipalNome: 'Pintura',
  categoriaPrincipalId: 'cat-1'
};

const dummyCurrentUser: DecodedToken = {
  sub: 'u2',
  email: 'v@test.com',
  name: 'visitor',
  role: 'Comum',
  exp: 1234567890,
  urlPerfil: 'http://img.com/u2.jpg'
};

const dummyArtwork: ObraDeArte = {
  id: 'art-1',
  titulo: 'Arte 1',
  descricao: 'Desc',
  url: 'http://video.mp4',
  autorUsername: 'artist',
  tipoConteudoMidia: 'video/mp4',
  dataPublicacao: new Date().toISOString(),
  totalCurtidas: 5,
  curtidaPeloUsuario: false,
  urlFotoPerfilAutor: '',
  categoriaNome: 'Pintura'
};

const mockUsuarioService = jasmine.createSpyObj('UsuarioService', ['getProfile', 'followUser', 'unfollowUser']);
const mockObraService = jasmine.createSpyObj('ObraDeArteService', ['getAllByUser']);
const mockCurtidaService = jasmine.createSpyObj('CurtidaService', ['curtir', 'descurtir']);
const mockComentarioService = jasmine.createSpyObj('ComentarioService', ['criarComentario']);

const currentUserSubject = new BehaviorSubject<DecodedToken | null>(dummyCurrentUser);
const mockAuthService = {
  currentUser$: currentUserSubject.asObservable(),
  updateCurrentUserProfilePhoto: jasmine.createSpy('updateCurrentUserProfilePhoto')
};

const mockActivatedRoute = {
  paramMap: of({ get: (key: string) => 'artist' })
};

fdescribe('ProfilePageComponent', () => {
  let component: ProfilePageComponent;
  let fixture: ComponentFixture<ProfilePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProfilePageComponent,
        ReactiveFormsModule,
        PlyrModule
      ],
      providers: [
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: ObraDeArteService, useValue: mockObraService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: CurtidaService, useValue: mockCurtidaService },
        { provide: ComentarioService, useValue: mockComentarioService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .overrideComponent(ProfilePageComponent, {
      remove: { 
        imports: [SidebarNavComponent, EditProfileModalComponent, CommentsModalComponent] 
      },
      add: { 
        imports: [MockSidebarNavComponent, MockEditProfileModalComponent, MockCommentsModalComponent] 
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilePageComponent);
    component = fixture.componentInstance;

    mockUsuarioService.getProfile.calls.reset();
    mockUsuarioService.followUser.calls.reset();
    mockUsuarioService.unfollowUser.calls.reset();
    mockObraService.getAllByUser.calls.reset();
    mockCurtidaService.curtir.calls.reset();
    mockCurtidaService.descurtir.calls.reset();
    mockComentarioService.criarComentario.calls.reset();
    mockAuthService.updateCurrentUserProfilePhoto.calls.reset();

    mockUsuarioService.getProfile.and.returnValue(of(dummyProfile));
    mockObraService.getAllByUser.and.returnValue(of([dummyArtwork]));
    mockCurtidaService.curtir.and.returnValue(of({ curtiu: true, totalCurtidas: 6 }));
    mockCurtidaService.descurtir.and.returnValue(of({ curtiu: false, totalCurtidas: 5 }));
    mockComentarioService.criarComentario.and.returnValue(of({}));
    currentUserSubject.next(dummyCurrentUser);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load profile and artworks on init', () => {
      expect(mockUsuarioService.getProfile).toHaveBeenCalledWith('artist');
      expect(mockObraService.getAllByUser).toHaveBeenCalledWith(dummyProfile.id);
    });

    it('should determine isMyProfile correctly (FALSE case)', (done) => {
      component.profileData$.pipe(take(1)).subscribe(data => {
        expect(data.isMyProfile).toBeFalse();
        done();
      });
    });

    it('should determine isMyProfile correctly (TRUE case)', (done) => {
      const ownerUser: DecodedToken = { ...dummyCurrentUser, name: 'artist' };
      currentUserSubject.next(ownerUser);
      
      component.profileData$.pipe(take(1)).subscribe(data => {
        if (data.profile.username === 'artist' && data.isMyProfile === true) {
            expect(data.isMyProfile).toBeTrue();
            done();
        }
      });
    });
    
    it('should calculate media types correctly', (done) => {
        currentUserSubject.next(dummyCurrentUser);
        component.profileData$.pipe(take(1)).subscribe(data => {
            const artwork = data.artworks[0];
            expect(artwork.calculatedMediaType).toBe('video');
            expect(component.commentForms.get(artwork.id)).toBeDefined();
            done();
        });
    });
  });

  describe('Follow Logic', () => {
    it('should call followUser', (done) => {
      mockUsuarioService.followUser.and.returnValue(of({}));
      component.profileData$.pipe(take(1)).subscribe(data => {
        data.profile.seguidoPeloUsuarioAtual = false;
        component.toggleFollow(data);
        expect(mockUsuarioService.followUser).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Like Logic', () => {
    it('should call curtir', (done) => {
      component.profileData$.pipe(take(1)).subscribe(data => {
        const artwork = data.artworks[0];
        artwork.curtidaPeloUsuario = false;
        component.toggleLike(artwork);
        expect(mockCurtidaService.curtir).toHaveBeenCalledWith(artwork.id);
        done();
      });
    });
  });

  describe('Comment Logic', () => {
    it('should submit comment validly', (done) => {
      component.profileData$.pipe(take(1)).subscribe(data => {
        const artwork = data.artworks[0];
        const form = component.commentForms.get(artwork.id);
        
        expect(form).toBeTruthy();
        form?.setValue({ texto: 'Teste' });
        
        component.submitComment(artwork);
        
        expect(mockComentarioService.criarComentario).toHaveBeenCalled();
        done();
      });
    });

    it('should NOT submit invalid comment', (done) => {
        component.profileData$.pipe(take(1)).subscribe(data => {
          const artwork = data.artworks[0];
          const form = component.commentForms.get(artwork.id);
          
          form?.setValue({ texto: '' });
          
          component.submitComment(artwork);
          
          expect(mockComentarioService.criarComentario).not.toHaveBeenCalled();
          done();
        });
      });
  });
});