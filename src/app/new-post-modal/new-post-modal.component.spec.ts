import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NewPostModalComponent } from './new-post-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CategoriaService } from '../features/categorias/categoria.service';
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service';
import { PostStateService } from '../features/obras-de-arte/post-state.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';

describe('NewPostModalComponent', () => {
  let component: NewPostModalComponent;
  let fixture: ComponentFixture<NewPostModalComponent>;

  let categoriaServiceSpy: jasmine.SpyObj<CategoriaService>;
  let obraDeArteServiceSpy: jasmine.SpyObj<ObraDeArteService>;
  let postStateServiceSpy: jasmine.SpyObj<PostStateService>;

  beforeEach(async () => {
    categoriaServiceSpy = jasmine.createSpyObj('CategoriaService', ['getCategories']);
    obraDeArteServiceSpy = jasmine.createSpyObj('ObraDeArteService', ['createObra']);
    postStateServiceSpy = jasmine.createSpyObj('PostStateService', ['announceNewPost']);

    categoriaServiceSpy.getCategories.and.returnValue(of([
      { id: '1', nome: 'Pintura', descricao: 'Tintas' },
      { id: '2', nome: 'Música', descricao: 'Sons' }
    ]));

    window.URL.createObjectURL = jasmine.createSpy('createObjectURL').and.returnValue('blob:mock-url');
    window.URL.revokeObjectURL = jasmine.createSpy('revokeObjectURL');

    await TestBed.configureTestingModule({
      imports: [NewPostModalComponent, ReactiveFormsModule], 
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PostStateService, useValue: postStateServiceSpy }
      ]
    })
    .overrideComponent(NewPostModalComponent, {
      set: {
        providers: [
          { provide: CategoriaService, useValue: categoriaServiceSpy },
          { provide: ObraDeArteService, useValue: obraDeArteServiceSpy }
        ]
      }
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewPostModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', () => {
    expect(categoriaServiceSpy.getCategories).toHaveBeenCalled();
    component.categories$.subscribe(cats => {
      expect(cats.length).toBe(2);
      expect(cats[0].nome).toBe('Pintura');
    });
  });

  it('should start with an invalid form', () => {
    expect(component.postForm.valid).toBeFalse();
    expect(component.postForm.get('Titulo')?.valid).toBeFalse();
  });

  it('should handle file selection (Video)', () => {
    const file = new File([''], 'video.mp4', { type: 'video/mp4' });
    const event = { target: { files: [file] } } as unknown as Event;

    component.onFileSelected(event);

    expect(component.selectedFile).toBe(file);
    expect(component.previewType).toBe('video');
    expect(component.errorMessage).toBeNull();
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should show error for invalid file type', () => {
    const file = new File([''], 'documento.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } } as unknown as Event;

    component.onFileSelected(event);

    expect(component.selectedFile).toBeNull();
    expect(component.errorMessage).toContain('Tipo de arquivo inválido');
  });

  it('should NOT submit if form is invalid', () => {
    component.onSubmit();
    expect(obraDeArteServiceSpy.createObra).not.toHaveBeenCalled();
  });

  it('should submit data successfully', fakeAsync(() => {
    component.postForm.patchValue({
      Titulo: 'Minha Arte',
      Descricao: 'Descrição Teste',
      CategoriaId: '1'
    });

    const file = new File([''], 'img.png', { type: 'image/png' });
    component.selectedFile = file;
    component.postForm.patchValue({ Midia: file });

    const mockResponse = { id: '100', titulo: 'Minha Arte' };
    obraDeArteServiceSpy.createObra.and.returnValue(of(mockResponse as any));

    spyOn(component.closeRequest, 'emit');

    component.onSubmit();
    
    tick();

    expect(component.isLoading).toBeFalse();
    expect(obraDeArteServiceSpy.createObra).toHaveBeenCalled();
    expect(postStateServiceSpy.announceNewPost).toHaveBeenCalledWith(mockResponse as any);
    expect(component.closeRequest.emit).toHaveBeenCalled();
  }));

  it('should handle submission error', fakeAsync(() => {
    component.postForm.patchValue({ Titulo: 'X', Descricao: 'Y', CategoriaId: '1', Midia: 'fake' });
    component.selectedFile = new File([''], 't.jpg', { type: 'image/jpeg' });

    obraDeArteServiceSpy.createObra.and.returnValue(throwError(() => new Error('Server Error')));

    component.onSubmit();
    tick();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('Erro ao criar a publicação');
    expect(postStateServiceSpy.announceNewPost).not.toHaveBeenCalled();
  }));

  it('should emit close event when closeModal is called', () => {
    spyOn(component.closeRequest, 'emit');
    
    component.closeModal();
    
    expect(component.closeRequest.emit).toHaveBeenCalled();
  });

  it('should revoke object URL on destroy', () => {
    component.previewUrl = 'blob:some-url';
    component.previewType = 'video';
    
    component.ngOnDestroy();
    
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:some-url');
  });
});