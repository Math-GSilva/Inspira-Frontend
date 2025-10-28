import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { UsuarioProfile } from '../core/models/usuario-profile.model';
import { UsuarioService } from '../features/usuarios-search/usuario.service';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss']
})
export class EditProfileModalComponent implements OnInit {
  @Input() userProfile!: UsuarioProfile;
  @Output() close = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<UsuarioProfile>();

  editForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    // Inicializa o formulário reativo com TODOS os campos de texto
    this.editForm = this.fb.group({
      nomeCompleto: [this.userProfile.nomeCompleto, [Validators.required, Validators.maxLength(200)]],
      bio: [this.userProfile.bio || '', [Validators.maxLength(500)]],
      
      // --- CAMPOS ADICIONADOS ---
      // Usamos || '' para garantir que o valor nunca seja 'null', o que o Angular Forms não gosta
      UrlPortifolio: [this.userProfile.urlPortifolio || ''],
      UrlLinkedin: [this.userProfile.urlLinkedin || ''],
      UrlInstagram: [this.userProfile.urlInstagram || '']
    });
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];

    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // Prepara os dados de texto do formulário
    const textData = {
      nomeCompleto: this.editForm.value.nomeCompleto,
      bio: this.editForm.value.bio,

      // --- CAMPOS ADICIONADOS ---
      // Enviamos os valores do formulário (que podem ser strings vazias)
      UrlPortifolio: this.editForm.value.UrlPortifolio,
      UrlLinkedin: this.editForm.value.UrlLinkedin,
      UrlInstagram: this.editForm.value.UrlInstagram
    };

    // Chama o serviço de atualização, passando os dados de texto E o ficheiro
    this.usuarioService.updateMyProfile(textData, this.selectedFile).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (updatedProfile) => {
        this.profileUpdated.emit(updatedProfile);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Não foi possível atualizar o perfil. Tente novamente.';
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}