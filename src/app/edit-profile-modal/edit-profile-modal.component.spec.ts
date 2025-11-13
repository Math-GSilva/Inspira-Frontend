import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, timer, switchMap } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';

import { EditProfileModalComponent } from './edit-profile-modal.component';
import { UsuarioService } from '../features/usuarios-search/usuario.service';
import { CategoriaService } from '../features/categorias/categoria.service';
import { UsuarioProfile } from '../core/models/usuario-profile.model';
import { Categoria } from '../core/models/categoria.model';

const dummyUser: UsuarioProfile = {
  id: 'u1',
  username: 'tester',
  nomeCompleto: 'Tester da Silva',
  bio: 'Bio original',
  urlFotoPerfil: 'http://foto.com/u1.jpg',
  categoriaPrincipalId: 'cat-1',
  categoriaPrincipalNome: 'Pintura',
  contagemSeguidores: 100,
  contagemSeguindo: 50,
  seguidoPeloUsuarioAtual: false,
  urlPortifolio: 'http://portifolio.com',
  urlLinkedin: 'https://www.linkedin.com/in/tester-linkedin',
  urlInstagram: 'https://www.instagram.com/tester.insta'
};

const dummyCategories: Categoria[] = [
  { id: 'cat-1', nome: 'Pintura', descricao: '' },
  { id: 'cat-2', nome: 'Fotografia', descricao: '' }
];

const mockUsuarioService = jasmine.createSpyObj('UsuarioService', ['updateMyProfile']);
const mockCategoriaService = jasmine.createSpyObj('CategoriaService', ['getCategories']);

fdescribe('EditProfileModalComponent', () => {
  let component: EditProfileModalComponent;
  let fixture: ComponentFixture<EditProfileModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditProfileModalComponent,
        ReactiveFormsModule,
        NgSelectModule
      ],
      providers: [
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: CategoriaService, useValue: mockCategoriaService }
      ]
    })
    .overrideComponent(EditProfileModalComponent, {
      set: {
        providers: [
          { provide: CategoriaService, useValue: mockCategoriaService }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProfileModalComponent);
    component = fixture.componentInstance;

    component.userProfile = dummyUser;
    component.userRole = 'Artista';
    
    mockCategoriaService.getCategories.and.returnValue(of(dummyCategories));
    mockUsuarioService.updateMyProfile.calls.reset();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Lifecycle Hooks', () => {
    it('should populate form and extract handles correctly on init', () => {
      expect(component.editForm.get('bio')?.value).toBe('Bio original');
      expect(component.editForm.get('linkedinHandle')?.value).toBe('tester-linkedin');
      expect(component.editForm.get('instagramHandle')?.value).toBe('tester.insta');
    });

    it('should handle empty or non-matching URLs in profile on init', () => {
      const fixtureEmpty = TestBed.createComponent(EditProfileModalComponent);
      const compEmpty = fixtureEmpty.componentInstance;
      compEmpty.userProfile = { 
        ...dummyUser, 
        urlLinkedin: null, 
        urlInstagram: 'https://other-site.com/user' 
      };
      compEmpty.userRole = 'Comum';
      
      fixtureEmpty.detectChanges();

      expect(compEmpty.editForm.get('linkedinHandle')?.value).toBe('');
      expect(compEmpty.editForm.get('instagramHandle')?.value).toBe('');
    });

    it('should lock body scroll on init and restore on destroy', () => {
      expect(document.body.style.overflow).toBe('hidden');
      component.ngOnDestroy();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Role Logic (isArtistaOuAdmin)', () => {
    it('should return true for Artista', () => {
      component.userRole = 'Artista';
      expect(component.isArtistaOuAdmin).toBeTrue();
    });

    it('should return true for Administrador', () => {
      component.userRole = 'Administrador';
      expect(component.isArtistaOuAdmin).toBeTrue();
    });

    it('should return false for Comum', () => {
      component.userRole = 'Comum';
      expect(component.isArtistaOuAdmin).toBeFalse();
    });

    it('should return false if role is null', () => {
      component.userRole = null;
      expect(component.isArtistaOuAdmin).toBeFalse();
    });

    it('should load categories only if Artista or Admin', () => {
      expect(mockCategoriaService.getCategories).toHaveBeenCalled();
    });

    it('should NOT load categories if Comum', () => {
      const fixtureComum = TestBed.createComponent(EditProfileModalComponent);
      const compComum = fixtureComum.componentInstance;
      compComum.userProfile = dummyUser;
      compComum.userRole = 'Comum';
      
      mockCategoriaService.getCategories.calls.reset();
      fixtureComum.detectChanges();

      expect(mockCategoriaService.getCategories).not.toHaveBeenCalled();
    });
  });

  describe('Getters', () => {
    it('should access bio control', () => {
      expect(component.bio).toBeTruthy();
      expect(component.bio?.value).toBe('Bio original');
    });

    it('should access urlPortifolio control', () => {
      expect(component.urlPortifolio).toBeTruthy();
      expect(component.urlPortifolio?.value).toBe('http://portifolio.com');
    });
  });

  describe('File Upload (onFileSelected)', () => {
    it('should accept valid image file', (done) => {
      const file = new File(['(img)'], 'avatar.png', { type: 'image/png' });
      const event = { target: { files: [file] } } as unknown as Event;

      component.onFileSelected(event);
      expect(component.selectedFile).toBe(file);
      
      setTimeout(() => {
        expect(component.previewUrl).toContain('data:image/png');
        done();
      }, 100);
    });

    it('should show temporary error and clear input for non-image file', fakeAsync(() => {
      const file = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
      const inputEl = { files: [file], value: 'path/doc.pdf' }; 
      const event = { target: inputEl } as unknown as Event;

      component.onFileSelected(event);

      expect(component.selectedFile).toBeNull();
      expect(inputEl.value).toBe('');
      expect(component.errorMessage).toContain('Arquivo inválido');

      tick(3000);
      expect(component.errorMessage).toBeNull();
    }));

    it('should do nothing if no file is selected (cancel action)', () => {
      const inputEl = { files: [] }; 
      const event = { target: inputEl } as unknown as Event;

      component.onFileSelected(event);

      expect(component.selectedFile).toBeNull();
      expect(component.previewUrl).toBeNull();
    });
  });

  describe('Paste Logic (handleSocialPaste)', () => {
    const createPasteEvent = (text: string) => ({
      preventDefault: jasmine.createSpy('preventDefault'),
      clipboardData: { getData: () => text }
    } as unknown as ClipboardEvent);

    it('should ignore empty paste', () => {
      const event = createPasteEvent('');
      component.handleSocialPaste(event, 'linkedinHandle');
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.editForm.get('linkedinHandle')?.value).toBe('tester-linkedin'); 
    });

    it('should extract handle from LinkedIn URL', () => {
      const event = createPasteEvent('https://www.linkedin.com/in/novo-user/');
      component.handleSocialPaste(event, 'linkedinHandle');
      expect(component.editForm.get('linkedinHandle')?.value).toBe('novo-user');
    });

    it('should extract handle from Instagram URL', () => {
      const event = createPasteEvent('https://instagram.com/novo.user');
      component.handleSocialPaste(event, 'instagramHandle');
      expect(component.editForm.get('instagramHandle')?.value).toBe('novo.user');
    });

    it('should treat plain text as handle', () => {
      const event = createPasteEvent('plain-user');
      component.handleSocialPaste(event, 'instagramHandle');
      expect(component.editForm.get('instagramHandle')?.value).toBe('plain-user');
    });

    it('should show error for invalid domain', () => {
      const event = createPasteEvent('https://facebook.com/user');
      component.handleSocialPaste(event, 'linkedinHandle');
      expect(component.errorMessage).toContain('Link inválido');
    });

    it('should show error for Instagram root URL (edge case)', () => {
      const event = createPasteEvent('https://instagram.com/');
      component.handleSocialPaste(event, 'instagramHandle');
      expect(component.errorMessage).toContain('Link inválido');
      expect(component.editForm.get('instagramHandle')?.value).toBe('tester.insta'); 
    });

    it('should clear temporary error message if same message triggers timeout', fakeAsync(() => {
      const event = createPasteEvent('https://bad-url.com');
      component.handleSocialPaste(event, 'linkedinHandle');
      
      expect(component.errorMessage).toBeTruthy();
      const msg = component.errorMessage;

      tick(3000);
      expect(component.errorMessage).toBeNull();
    }));

    it('should NOT clear error message if it changed during timeout', fakeAsync(() => {
      const event1 = createPasteEvent('https://bad-url-1.com');
      component.handleSocialPaste(event1, 'linkedinHandle');
      expect(component.errorMessage).toContain('Link inválido');

      tick(1500);

      component.errorMessage = 'Outro erro'; 

      tick(1500); 
      expect(component.errorMessage).toBe('Outro erro'); 
    }));
  });

  describe('Form Submission (onSubmit)', () => {
    it('should NOT submit if form is invalid', () => {
      component.editForm.get('bio')?.setValue('a'.repeat(501));
      component.onSubmit();
      expect(component.editForm.invalid).toBeTrue();
      expect(mockUsuarioService.updateMyProfile).not.toHaveBeenCalled();
    });

    it('should submit correct data with nulls for empty fields', fakeAsync(() => {
      mockUsuarioService.updateMyProfile.and.returnValue(
        of(dummyUser).pipe(switchMap(u => timer(1).pipe(switchMap(() => of(u)))))
      );

      spyOn(component.profileUpdated, 'emit');
      spyOn(component, 'closeModal');

      component.editForm.patchValue({
        bio: 'Nova bio',
        linkedinHandle: '', 
        instagramHandle: '',
        UrlPortifolio: ''
      });

      component.onSubmit();
      expect(component.isLoading).toBeTrue();

      const expectedTextData = {
        bio: 'Nova bio',
        UrlPortifolio: null,
        UrlLinkedin: null,
        UrlInstagram: null,
        categoriaPrincipalId: 'cat-1'
      };

      expect(mockUsuarioService.updateMyProfile).toHaveBeenCalledWith(
        jasmine.objectContaining(expectedTextData), 
        null
      );

      tick(1);

      expect(component.isLoading).toBeFalse();
      expect(component.profileUpdated.emit).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
    }));

    it('should submit correct data with constructed URLs', fakeAsync(() => {
      mockUsuarioService.updateMyProfile.and.returnValue(of(dummyUser));
      spyOn(component, 'closeModal');

      component.editForm.patchValue({
        bio: 'Bio',
        linkedinHandle: 'link-user',
        instagramHandle: 'insta.user',
        UrlPortifolio: 'https://port.com'
      });

      component.onSubmit();

      const expectedTextData = {
        bio: 'Bio',
        UrlPortifolio: 'https://port.com',
        UrlLinkedin: 'https://www.linkedin.com/in/link-user',
        UrlInstagram: 'https://www.instagram.com/insta.user',
        categoriaPrincipalId: 'cat-1'
      };

      expect(mockUsuarioService.updateMyProfile).toHaveBeenCalledWith(
        jasmine.objectContaining(expectedTextData), 
        null
      );
    }));

    it('should handle API error correctly', fakeAsync(() => {
      mockUsuarioService.updateMyProfile.and.returnValue(
        timer(1).pipe(switchMap(() => throwError(() => ({ error: { message: 'Erro backend' } }))))
      );

      spyOn(component.profileUpdated, 'emit'); 

      component.onSubmit();
      expect(component.isLoading).toBeTrue();
      
      tick(1);

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Erro backend');
      expect(component.profileUpdated.emit).not.toHaveBeenCalled(); 
    }));
  });
});