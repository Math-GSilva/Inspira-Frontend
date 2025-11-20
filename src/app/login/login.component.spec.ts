import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, timer, switchMap } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { PlyrModule } from '@atom-platform/ngx-plyr';

import { CategoriaService } from '../features/categorias/categoria.service';
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service';
import { PostStateService } from '../features/obras-de-arte/post-state.service';
import { Categoria } from '../core/models/categoria.model';
import { ObraDeArte } from '../core/models/obra-de-arte.model';
import { NewPostModalComponent } from '../new-post-modal/new-post-modal.component';

const dummyCategories: Categoria[] = [
  { id: 'cat-1', nome: 'Pintura', descricao: '' },
  { id: 'cat-2', nome: 'Digital', descricao: '' }
];

const dummyPost: ObraDeArte = {
  id: 'art-1',
  titulo: 'Nova Arte',
  descricao: 'Desc',
  url: 'img.jpg',
  autorUsername: 'user',
  dataPublicacao: new Date().toISOString(),
  totalCurtidas: 0,
  urlFotoPerfilAutor: '',
  categoriaNome: 'Pintura'
};

const mockCategoriaService = jasmine.createSpyObj('CategoriaService', ['getCategories']);
const mockObraService = jasmine.createSpyObj('ObraDeArteService', ['createObra']);
const mockPostStateService = jasmine.createSpyObj('PostStateService', ['announceNewPost']);

describe('NewPostModalComponent', () => {
  let component: NewPostModalComponent;
  let fixture: ComponentFixture<NewPostModalComponent>;

  const mockUrl = {
    createObjectURL: jasmine.createSpy('createObjectURL').and.returnValue('blob:fake-url'),
    revokeObjectURL: jasmine.createSpy('revokeObjectURL')
  };

  beforeEach(async () => {
    window.URL.createObjectURL = mockUrl.createObjectURL;
    window.URL.revokeObjectURL = mockUrl.revokeObjectURL;

    await TestBed.configureTestingModule({
      imports: [
        NewPostModalComponent,
        ReactiveFormsModule,
        NgSelectModule,
        PlyrModule
      ],
      providers: [
        { provide: CategoriaService, useValue: mockCategoriaService },
        { provide: ObraDeArteService, useValue: mockObraService },
        { provide: PostStateService, useValue: mockPostStateService }
      ]
    })
    .overrideComponent(NewPostModalComponent, {
      set: {
        providers: [
          { provide: CategoriaService, useValue: mockCategoriaService },
          { provide: ObraDeArteService, useValue: mockObraService }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewPostModalComponent);
    component = fixture.componentInstance;
    
    mockCategoriaService.getCategories.and.returnValue(of(dummyCategories));
    mockObraService.createObra.calls.reset();
    mockUrl.createObjectURL.calls.reset();
    mockUrl.revokeObjectURL.calls.reset();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization & Validation', () => {
    it('should initialize form as invalid', () => {
      expect(component.postForm.invalid).toBeTrue();
    });

    it('should load categories on init', () => {
      expect(mockCategoriaService.getCategories).toHaveBeenCalled();
      component.categories$.subscribe((cats: string | any[]) => {
        expect(cats.length).toBe(2);
      });
    });

    it('should lock body scroll on init and restore on destroy', () => {
      expect(document.body.style.overflow).toBe('hidden');
      component.ngOnDestroy();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('File Upload (onFileSelected)', () => {
    
    const createFileEvent = (fileType: string) => {
      const file = new File(['content'], 'test-file', { type: fileType });
      return { 
        target: { files: [file] },
        file: file 
      } as any;
    };

    it('should handle IMAGE upload (FileReader)', (done) => {
      const evt = createFileEvent('image/png');
      
      const mockReader = {
        readAsDataURL: jasmine.createSpy('readAsDataURL'),
        result: 'data:image/png;base64,fake',
        onload: null as any
      };
      spyOn(window, 'FileReader').and.returnValue(mockReader as any);

      component.onFileSelected(evt);

      expect(component.selectedFile).toBe(evt.file);
      expect(component.previewType).toBe('image');
      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(evt.file);

      mockReader.onload();
      
      expect(component.previewUrl).toBe('data:image/png;base64,fake');
      done();
    });

    it('should handle VIDEO upload (Plyr/ObjectURL)', () => {
      const evt = createFileEvent('video/mp4');
      component.onFileSelected(evt);

      expect(component.selectedFile).toBe(evt.file);
      expect(component.previewType).toBe('video');
      expect(component.plyrType).toBe('video');
      
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(evt.file);
      expect(component.previewUrl).toBe('blob:fake-url');
      expect(component.plyrSources[0].src).toBe('blob:fake-url');
    });

    it('should handle AUDIO upload (Plyr/ObjectURL)', () => {
      const evt = createFileEvent('audio/mp3');
      component.onFileSelected(evt);

      expect(component.selectedFile).toBe(evt.file);
      expect(component.previewType).toBe('audio');
      expect(component.plyrType).toBe('audio');
      
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(evt.file);
    });

    it('should reject invalid file types', () => {
      const evt = createFileEvent('application/pdf');
      component.onFileSelected(evt);

      expect(component.selectedFile).toBeNull();
      expect(component.errorMessage).toContain('Tipo de arquivo inválido');
      expect(component.previewUrl).toBeNull();
    });

    it('should clear previous preview when selecting new file', () => {
      component.previewUrl = 'blob:old-url';
      component.previewType = 'video';
      
      const evt = createFileEvent('image/jpeg');
      component.onFileSelected(evt);

      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:old-url');
    });
  });

  describe('Memory Management (ngOnDestroy)', () => {
    it('should revoke ObjectURL on destroy if preview was video/audio', () => {
      component.previewUrl = 'blob:some-video';
      component.previewType = 'video';
      
      component.ngOnDestroy();
      
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:some-video');
    });

    it('should NOT revoke ObjectURL if preview was image (DataURL)', () => {
      component.previewUrl = 'data:image/png...';
      component.previewType = 'image';
      
      component.ngOnDestroy();
      
      expect(window.URL.revokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission (onSubmit)', () => {
    
    it('should NOT submit if form is invalid', () => {
      component.postForm.patchValue({ Titulo: '' }); // Inválido
      component.onSubmit();
      expect(mockObraService.createObra).not.toHaveBeenCalled();
    });

    it('should create FormData and submit correctly', fakeAsync(() => {
      mockObraService.createObra.and.returnValue(
        of(dummyPost).pipe(switchMap(p => timer(1).pipe(switchMap(() => of(p)))))
      );
      
      spyOn(component, 'closeModal');

      const file = new File(['a'], 'v.mp4', { type: 'video/mp4' });
      component.selectedFile = file;
      
      component.postForm.patchValue({
        Titulo: 'Meu Vídeo',
        Descricao: 'Descrição',
        CategoriaId: 'cat-1',
        Midia: file
      });

      component.onSubmit();
      expect(component.isLoading).toBeTrue();

      const args = mockObraService.createObra.calls.mostRecent().args[0] as FormData;
      expect(args instanceof FormData).toBeTrue();
      expect(args.get('Titulo')).toBe('Meu Vídeo');
      expect(args.get('Descricao')).toBe('Descrição');
      expect(args.get('CategoriaId')).toBe('cat-1');
      expect(args.get('Midia')).toBe(file);

      tick(1);

      expect(component.isLoading).toBeFalse();
      expect(mockPostStateService.announceNewPost).toHaveBeenCalledWith(dummyPost);
      expect(component.closeModal).toHaveBeenCalled();
    }));

    it('should handle API error', fakeAsync(() => {
      mockObraService.createObra.and.returnValue(
        timer(1).pipe(switchMap(() => throwError(() => new Error('Erro'))))
      );
      
      spyOn(component, 'closeModal');
      component.selectedFile = new File([''], 'img.png');
      component.postForm.patchValue({ Titulo: 'T', Descricao: 'D', CategoriaId: 'C', Midia: 'ok' });

      component.onSubmit();
      
      tick(1);

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toContain('Erro ao criar a publicação');
      expect(component.closeModal).not.toHaveBeenCalled();
    }));
  });
});