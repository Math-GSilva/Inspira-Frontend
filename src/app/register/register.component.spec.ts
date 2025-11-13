import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing'; // Importante
import { of, throwError, timer, switchMap } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../features/auth/auth.service';

// --- Mocks ---
const mockAuthService = jasmine.createSpyObj('AuthService', ['register']);

// Dados válidos para teste
const validFormData = {
  CompleteName: 'Teste User',
  Username: 'teste.user',
  Email: 'teste@email.com',
  Password: '123456',
  Role: '1'
};

fdescribe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router; // Referência ao Router real injetado

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent, 
        ReactiveFormsModule,
        RouterTestingModule // Fornece Router e ActivatedRoute funcionais
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
        // REMOVIDOS: ActivatedRoute e Router providers manuais.
        // Deixamos o RouterTestingModule cuidar disso para não quebrar o routerLink.
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    
    // Injetamos o Router real que o RouterTestingModule criou
    router = TestBed.inject(Router);
    
    // Criamos o espião no método navigate do router real
    spyOn(router, 'navigate');

    mockAuthService.register.calls.reset();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Validação do Formulário ---
  describe('Form Validation', () => {
    it('should initialize form as invalid', () => {
      expect(component.registerForm.invalid).toBeTrue();
    });

    it('should be valid when all fields are correct', () => {
      component.registerForm.patchValue(validFormData);
      expect(component.registerForm.valid).toBeTrue();
    });

    it('should validate required fields', () => {
      const nameControl = component.registerForm.get('CompleteName');
      nameControl?.setValue('');
      expect(nameControl?.hasError('required')).toBeTrue();

      const roleControl = component.registerForm.get('Role');
      roleControl?.setValue('');
      expect(roleControl?.hasError('required')).toBeTrue();
    });

    it('should validate email format', () => {
      const emailControl = component.registerForm.get('Email');
      emailControl?.setValue('email-invalido');
      expect(emailControl?.hasError('email')).toBeTrue();
      
      emailControl?.setValue('valido@teste.com');
      expect(emailControl?.valid).toBeTrue();
    });

    it('should validate username (no spaces)', () => {
      const userControl = component.registerForm.get('Username');
      userControl?.setValue('user name');
      expect(userControl?.hasError('pattern')).toBeTrue();
      
      userControl?.setValue('username_valido');
      expect(userControl?.valid).toBeTrue();
    });

    it('should validate password length (min 6)', () => {
      const passControl = component.registerForm.get('Password');
      passControl?.setValue('12345');
      expect(passControl?.hasError('minlength')).toBeTrue();
      
      passControl?.setValue('123456');
      expect(passControl?.valid).toBeTrue();
    });
  });

  // --- Submissão (Fluxo de Sucesso) ---
  describe('Success Submission', () => {
    it('should convert Role to integer and call AuthService', fakeAsync(() => {
      mockAuthService.register.and.returnValue(
        timer(1).pipe(switchMap(() => of({ success: true })))
      );

      component.registerForm.patchValue(validFormData);
      component.onSubmit();
      expect(component.isLoading).toBeTrue();

      const expectedPayload = { ...validFormData, Role: 1 };
      expect(mockAuthService.register).toHaveBeenCalledWith(expectedPayload);

      tick(1); 

      expect(component.isLoading).toBeFalse();
      expect(component.successMessage).toContain('Conta criada com sucesso');
      
      tick(2000);
      
      // Verifica se o spy do router foi chamado
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    }));
  });

  // --- Submissão (Fluxo de Erro) ---
  describe('Error Submission', () => {
    it('should display specific error message from API', fakeAsync(() => {
      const errorMsg = 'Email já cadastrado';
      mockAuthService.register.and.returnValue(
        timer(1).pipe(switchMap(() => throwError(() => ({ error: { message: errorMsg } }))))
      );

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(component.isLoading).toBeTrue();
      tick(1);

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe(errorMsg);
      expect(component.successMessage).toBeNull();
      expect(router.navigate).not.toHaveBeenCalled();
    }));

    it('should display default error message for generic errors', fakeAsync(() => {
      mockAuthService.register.and.returnValue(
        timer(1).pipe(switchMap(() => throwError(() => new Error('Server error'))))
      );

      component.registerForm.patchValue(validFormData);
      component.onSubmit();
      tick(1);

      expect(component.errorMessage).toContain('Não foi possível criar a conta');
    }));

    it('should NOT submit if form is invalid', () => {
      component.registerForm.patchValue({ CompleteName: '' });
      component.onSubmit();
      expect(mockAuthService.register).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });
  });
});