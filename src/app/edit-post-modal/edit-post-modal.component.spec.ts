import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, delay, switchMap, timer } from 'rxjs';

import { EditPostModalComponent } from './edit-post-modal.component';
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service';
import { ObraDeArte } from '../core/models/obra-de-arte.model'; 

const dummyArtwork: ObraDeArte = {
  id: 'art-123',
  titulo: 'Título Original',
  descricao: 'Descrição Original',
  dataPublicacao: '2023-11-12T10:00:00Z', 
  autorUsername: 'artista_teste',
  urlFotoPerfilAutor: 'http://avatar.com/photo.jpg',
  categoriaNome: 'Pintura',
  url: 'http://img.com/arte.jpg', 
  totalCurtidas: 42,
  curtidaPeloUsuario: true,
  showCommentBox: false,
  tipoConteudoMidia: 'IMAGE'
};

const mockObraService = jasmine.createSpyObj('ObraDeArteService', ['updateObra']);

fdescribe('EditPostModalComponent', () => {
  let component: EditPostModalComponent;
  let fixture: ComponentFixture<EditPostModalComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPostModalComponent, ReactiveFormsModule],
      providers: [
        { provide: ObraDeArteService, useValue: mockObraService }
      ]
    })
    .overrideComponent(EditPostModalComponent, {
      set: {
        providers: [
          { provide: ObraDeArteService, useValue: mockObraService }
        ]
      }
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditPostModalComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    
    mockObraService.updateObra.calls.reset();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization & Input Changes', () => {
    
    it('should initialize form with empty values if no artwork input provided', () => {
      expect(component.editForm.get('Titulo')?.value).toBe('');
      expect(component.editForm.get('Descricao')?.value).toBe('');
    });

    it('should populate form when artwork is provided via Input (ngOnChanges)', () => {
      component.artwork = dummyArtwork;
      
      component.ngOnChanges({
        artwork: {
          currentValue: dummyArtwork,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      
      fixture.detectChanges();

      expect(component.editForm.get('Titulo')?.value).toBe('Título Original');
      expect(component.editForm.get('Descricao')?.value).toBe('Descrição Original');
    });
  });

  describe('Form Submission (onSubmit)', () => {

    beforeEach(() => {
      component.artwork = dummyArtwork;
      component.ngOnChanges({
        artwork: { currentValue: dummyArtwork, previousValue: null, firstChange: true, isFirstChange: () => true }
      });
      fixture.detectChanges();
    });

    it('should NOT submit if form is invalid', () => {
      component.editForm.get('Titulo')?.setValue(''); 
      component.onSubmit();
      expect(mockObraService.updateObra).not.toHaveBeenCalled();
    });

    it('should call service with correct DTO, emit success, and close modal on valid submission', fakeAsync(() => {
      const updatedArt: ObraDeArte = { 
        ...dummyArtwork, 
        titulo: 'Título Editado', 
        descricao: 'Desc Editada' 
      };

      mockObraService.updateObra.and.returnValue(of(updatedArt).pipe(delay(1)));

      spyOn(component.saveSuccess, 'emit');
      spyOn(component, 'closeModal');

      component.editForm.patchValue({ 
        Titulo: 'Título Editado', 
        Descricao: 'Desc Editada' 
      });
      
      component.onSubmit();

      expect(component.isLoading).toBeTrue();
      
      expect(mockObraService.updateObra).toHaveBeenCalledWith('art-123', {
        titulo: 'Título Editado',
        descricao: 'Desc Editada'
      });

      tick(1);

      expect(component.isLoading).toBeFalse();
      expect(component.saveSuccess.emit).toHaveBeenCalledWith(updatedArt);
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.errorMessage).toBeNull();
    }));

    it('should handle service error correctly', fakeAsync(() => {
      mockObraService.updateObra.and.returnValue(
        timer(1).pipe(
          switchMap(() => throwError(() => new Error('Erro API')))
        )
      );
      
      spyOn(component.saveSuccess, 'emit');
      spyOn(component, 'closeModal');

      component.editForm.patchValue({ Titulo: 'Edit', Descricao: 'Desc' });
      
      component.onSubmit();

      expect(component.isLoading).toBeTrue();

      tick(1);

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBeTruthy();
      
      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
      expect(component.closeModal).not.toHaveBeenCalled();
    }));
  });

  describe('UI Interactions', () => {
    it('should emit close event when clicking cancel button', () => {
      spyOn(component.close, 'emit');
      const cancelBtn = compiled.querySelector('.btn-secondary') as HTMLButtonElement;
      cancelBtn.click();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should show loading spinner when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();
      expect(compiled.querySelector('.spinner')).toBeTruthy();
    });
  });
});