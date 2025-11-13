import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { delay, of, switchMap, throwError, timer } from 'rxjs';

import { AddCategoryModalComponent } from './add-category-modal.component';
import { CategoriaService } from '../features/categorias/categoria.service';
import { Categoria } from '../core/models/categoria.model';

const mockCategoriaService = jasmine.createSpyObj('CategoriaService', ['createCategory']);

fdescribe('AddCategoryModalComponent', () => {
  let component: AddCategoryModalComponent;
  let fixture: ComponentFixture<AddCategoryModalComponent>;
  let compiled: HTMLElement;
  let dummyCategory: Categoria;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCategoryModalComponent, ReactiveFormsModule],
      providers: [
        { provide: CategoriaService, useValue: mockCategoriaService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCategoryModalComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;

    mockCategoriaService.createCategory.calls.reset();

    dummyCategory = { id: 'uuid-123', nome: 'Categoria Teste', descricao: 'Desc Teste' };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization (ngOnInit)', () => {
    it('should initialize the categoryForm', () => {
      expect(component.categoryForm).toBeDefined();
      expect(component.f['nome']).toBeDefined();
      expect(component.f['descricao']).toBeDefined();
    });

    it('should make "nome" field required', () => {
      component.f['nome'].setValue('');
      expect(component.f['nome'].hasError('required')).toBeTrue();
    });

    it('should validate "nome" maxlength (100)', () => {
      component.f['nome'].setValue('a'.repeat(101));
      expect(component.f['nome'].hasError('maxlength')).toBeTrue();
    });

    it('should validate "descricao" maxlength (500)', () => {
      component.f['descricao'].setValue('a'.repeat(501));
      expect(component.f['descricao'].hasError('maxlength')).toBeTrue();
    });

    it('should be invalid when "nome" is empty', () => {
      expect(component.categoryForm.valid).toBeFalse();
    });

    it('should be valid when "nome" is filled and "descricao" is empty', () => {
      component.f['nome'].setValue('Pintura Digital');
      expect(component.categoryForm.valid).toBeTrue();
    });
  });

  describe('Modal Close Events', () => {
    it('should emit "close" when closeModal() is called', () => {
      spyOn(component.close, 'emit');
      component.closeModal();
      expect(component.close.emit).toHaveBeenCalledTimes(1);
    });

    it('should call closeModal() when overlay is clicked', () => {
      spyOn(component, 'closeModal');
      const overlay = compiled.querySelector('.modal-overlay') as HTMLElement;
      overlay.click();
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should NOT call closeModal() when modal card is clicked (due to stopPropagation)', () => {
      spyOn(component, 'closeModal');
      const card = compiled.querySelector('.modal-card') as HTMLElement;
      card.click();
      expect(component.closeModal).not.toHaveBeenCalled();
    });

    it('should call closeModal() when cancel button is clicked', () => {
      spyOn(component, 'closeModal');
      const cancelButton = compiled.querySelector('.btn-secondary') as HTMLButtonElement;
      cancelButton.click();
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should call closeModal() when X button is clicked', () => {
      spyOn(component, 'closeModal');
      const closeButton = compiled.querySelector('.close-button') as HTMLButtonElement;
      closeButton.click();
      expect(component.closeModal).toHaveBeenCalled();
    });
  });

  describe('Form Submission (onSubmit)', () => {

    it('should not submit if form is invalid', () => {
      component.f['nome'].setValue('');
      component.onSubmit();
      expect(mockCategoriaService.createCategory).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched if submitted invalid', () => {
      spyOn(component.categoryForm, 'markAllAsTouched');
      component.f['nome'].setValue('');
      component.onSubmit();
      expect(component.categoryForm.markAllAsTouched).toHaveBeenCalled();
    });

    it('should call createCategory, emit categoryAdded, and close modal on valid submission', fakeAsync(() => {
      mockCategoriaService.createCategory.and.returnValue(of(dummyCategory).pipe(delay(1)));
      
      spyOn(component.categoryAdded, 'emit');
      spyOn(component, 'closeModal');
      
      component.f['nome'].setValue('Categoria Teste');
      component.f['descricao'].setValue('Desc Teste');
      
      component.onSubmit();

      tick(1);

      expect(mockCategoriaService.createCategory).toHaveBeenCalledWith({
        nome: 'Categoria Teste',
        descricao: 'Desc Teste'
      });

      expect(component.categoryAdded.emit).toHaveBeenCalledWith(dummyCategory);
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.errorMessage).toBeNull();
    }));

    it('should set errorMessage and not close modal on service error', fakeAsync(() => {
      const errorMsg = 'Erro na API';
      const errorResponse = { error: { message: errorMsg } };

      mockCategoriaService.createCategory.and.returnValue(
        timer(1).pipe(
          switchMap(() => throwError(() => errorResponse))
        )
      );

      spyOn(component.categoryAdded, 'emit');
      spyOn(component, 'closeModal');

      component.f['nome'].setValue('Categoria Teste');
      component.onSubmit();

      expect(component.isLoading).toBeTrue();

      tick(1);

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe(errorMsg);
      expect(component.categoryAdded.emit).not.toHaveBeenCalled();
      expect(component.closeModal).not.toHaveBeenCalled();
    }));

    it('should set isLoading to true during submission and false after (on success)', fakeAsync(() => {
      mockCategoriaService.createCategory.and.returnValue(of(dummyCategory).pipe(delay(1)));
      
      component.f['nome'].setValue('Teste');
      component.onSubmit();

      expect(component.isLoading).toBeTrue();
      
      tick(1);
      
      expect(component.isLoading).toBeFalse();
    }));

    it('should set isLoading to true during submission and false after (on error)', fakeAsync(() => {
      const errorResponse = { error: { message: 'Erro de Teste' } };
      mockCategoriaService.createCategory.and.returnValue(
        timer(1).pipe(
          switchMap(() => throwError(() => errorResponse))
        )
      );
      
      component.f['nome'].setValue('Teste');
      component.onSubmit();

      expect(component.isLoading).toBeTrue();
      
      tick(1);
      
      expect(component.isLoading).toBeFalse();
    }));

  });

  describe('HTML Rendering and Bindings', () => {

    it('should show "nome" required error message when touched', () => {
      component.f['nome'].markAsTouched();
      fixture.detectChanges();
      
      const errorEl = compiled.querySelector('.error-message-inline span');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.textContent).toContain('O nome é obrigatório.');
    });

    it('should show "descricao" maxlength error message', () => {
      component.f['descricao'].setValue('a'.repeat(501));
      component.f['descricao'].markAsTouched();
      fixture.detectChanges();
      
      const errorEl = compiled.querySelector('.form-group:nth-child(2) .error-message-inline span');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.textContent).toContain('Máximo de 500 caracteres.');
    });

    it('should show general error message when "errorMessage" is set', () => {
      component.errorMessage = 'Erro de Teste';
      fixture.detectChanges();
      
      const errorEl = compiled.querySelector('.general-error');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.textContent).toContain('Erro de Teste');
    });

    it('should disable submit button when form is invalid', () => {
      component.f['nome'].setValue('');
      fixture.detectChanges();
      const submitButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;
      expect(submitButton.disabled).toBeTrue();
    });

    it('should disable submit button when isLoading is true', () => {
      component.f['nome'].setValue('Válido');
      component.isLoading = true;
      fixture.detectChanges();
      
      const submitButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;
      expect(submitButton.disabled).toBeTrue();
    });

    it('should enable submit button when form is valid and not loading', () => {
      component.f['nome'].setValue('Válido');
      component.isLoading = false;
      fixture.detectChanges();
      
      const submitButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;
      expect(submitButton.disabled).toBeFalse();
    });

    it('should show loading overlay when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();
      const overlay = compiled.querySelector('.loading-overlay');
      expect(overlay).toBeTruthy();
    });

    it('should hide loading overlay when isLoading is false', () => {
      component.isLoading = false;
      fixture.detectChanges();
      const overlay = compiled.querySelector('.loading-overlay');
      expect(overlay).toBeFalsy();
    });

  });
});