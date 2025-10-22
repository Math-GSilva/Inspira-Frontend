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
  // Recebe o perfil atual do componente pai (profile-page)
  @Input() userProfile!: UsuarioProfile;
  
  // Emite eventos para o componente pai
  @Output() close = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<UsuarioProfile>();

  editForm!: FormGroup; // O '!' diz ao TypeScript que vamos inicializá-lo no ngOnInit
  isLoading = false;
  errorMessage: string | null = null;
  
  // Variáveis para gerir o upload do ficheiro
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    // Inicializa o formulário reativo APENAS com os campos de texto
    this.editForm = this.fb.group({
      nomeCompleto: [this.userProfile.nomeCompleto, [Validators.required, Validators.maxLength(200)]],
      bio: [this.userProfile.bio || '', [Validators.maxLength(500)]],
      // O campo de ficheiro não é um FormControl, pois é gerido separadamente
    });
  }

  /**
   * Chamado quando um ficheiro é selecionado no input.
   */
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];

    if (file) {
      this.selectedFile = file;

      // Cria uma URL de pré-visualização para a imagem selecionada
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Chamado quando o formulário é enviado.
   */
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
      bio: this.editForm.value.bio
    };

    // Chama o serviço de atualização, passando os dados de texto E o ficheiro
    this.usuarioService.updateMyProfile(textData, this.selectedFile).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (updatedProfile) => {
        // Sucesso! Emite o perfil atualizado para o componente pai
        this.profileUpdated.emit(updatedProfile);
      },
      error: (err) => {
        // Lida com erros da API
        this.errorMessage = err.error?.message || 'Não foi possível atualizar o perfil. Tente novamente.';
      }
    });
  }

  /**
   * Emite o evento para fechar o modal.
   */
  closeModal(): void {
    this.close.emit();
  }
}

