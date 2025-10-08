import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../features/auth/auth.service';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      CompleteName: ['', [Validators.required, Validators.maxLength(50)]],
      Username: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^\S*$/)]],
      Email: ['', [Validators.required, Validators.email]],
      Password: ['', [Validators.required, Validators.minLength(6)]],
      Role: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const payload = { ...this.registerForm.value };
    payload.Role = parseInt(payload.Role, 10);

    this.authService.register(payload).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        this.successMessage = 'Conta criada com sucesso! Redirecionando para o login...';
        
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        console.error('Erro ao registrar:', err);
        if (err.error && err.error.message) {
            this.errorMessage = err.error.message;
        } else {
            this.errorMessage = 'Não foi possível criar a conta. Tente novamente mais tarde.';
        }
      }
    });
  }
}

