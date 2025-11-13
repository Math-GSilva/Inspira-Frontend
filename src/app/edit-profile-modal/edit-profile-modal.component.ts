import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Observable } from 'rxjs';
import { UsuarioProfile } from '../core/models/usuario-profile.model';
import { UsuarioService } from '../features/usuarios-search/usuario.service';
import { CategoriaService } from '../features/categorias/categoria.service';
import { Categoria } from '../core/models/categoria.model';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule
  ],
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
  providers: [CategoriaService]
})
export class EditProfileModalComponent implements OnInit, OnDestroy {
  @Input() userProfile!: UsuarioProfile;
  @Output() close = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<UsuarioProfile>();

  @Input() userRole: string | null = null;

  editForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  public readonly linkedInPrefix = 'https://www.linkedin.com/in/';
  public readonly instagramPrefix = 'https://www.instagram.com/';

  private urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}([\/\w\.-]*)*\/?$/;

  categories$!: Observable<Categoria[]>;

  get isArtistaOuAdmin(): boolean {
    if (!this.userRole) return false;
    return this.userRole === 'Artista' || this.userRole === 'Administrador';
  }


  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private categoriaService: CategoriaService
  ) {}

  
  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';

    const extractHandle = (url: string | null | undefined, prefix: string): string => {
      if (url && url.toLowerCase().startsWith(prefix.toLowerCase())) {
        return url.substring(prefix.length).split('/')[0]; 
      }
      return '';
    };

    this.editForm = this.fb.group({
      bio: [this.userProfile.bio || '', [Validators.maxLength(500)]],

      categoriaPrincipalId: [{
        value: this.userProfile.categoriaPrincipalId || '', 
        disabled: !this.isArtistaOuAdmin
      }],
      
      UrlPortifolio: [
        this.userProfile.urlPortifolio || '', 
        [Validators.pattern(this.urlRegex)]
      ],
      
      linkedinHandle: [
        extractHandle(this.userProfile.urlLinkedin, this.linkedInPrefix),
        [Validators.pattern(/^[a-zA-Z0-9_-]+$/)] 
      ],
      instagramHandle: [
        extractHandle(this.userProfile.urlInstagram, this.instagramPrefix),
        [Validators.pattern(/^[a-zA-Z0-9_.]+$/)]
      ]
    });

    if (this.isArtistaOuAdmin) {
      this.categories$ = this.categoriaService.getCategories();
    }
  }

  get bio() {
    return this.editForm.get('bio');
  }

  get urlPortifolio() {
    return this.editForm.get('UrlPortifolio');
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        this.showTemporaryError('Arquivo inválido. Por favor, selecione apenas imagens.');
        element.value = '';
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  handleSocialPaste(event: ClipboardEvent, fieldName: 'linkedinHandle' | 'instagramHandle'): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!pastedText) return;

    let handle = '';
    let isValidPaste = false;
    let expectedHost = '';
    let expectedPathPrefix = '';

    if (fieldName === 'linkedinHandle') {
      expectedHost = 'linkedin.com';
      expectedPathPrefix = '/in/';
    } else {
      expectedHost = 'instagram.com';
      expectedPathPrefix = '/';
    }

    try {
      const url = new URL(pastedText);

      if (url.hostname.includes(expectedHost)) {
        if (fieldName === 'linkedinHandle' && url.pathname.startsWith(expectedPathPrefix)) {
          handle = url.pathname.substring(expectedPathPrefix.length).split('/')[0];
          isValidPaste = true;
        } else if (fieldName === 'instagramHandle' && url.pathname.length > 1) {
          handle = url.pathname.substring(expectedPathPrefix.length).split('/')[0];
          isValidPaste = true;
        }
      }
    } catch (e) {
      handle = pastedText;
      isValidPaste = true;
    }

    if (isValidPaste) {
      this.editForm.get(fieldName)?.setValue(handle);
      this.editForm.get(fieldName)?.markAsDirty();
    } else {
      this.showTemporaryError(`Link inválido. Cole um link do ${fieldName === 'linkedinHandle' ? 'LinkedIn' : 'Instagram'}.`);
    }
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { bio, UrlPortifolio, linkedinHandle, instagramHandle } = this.editForm.value;

    const textData = {
      bio,
      UrlPortifolio: UrlPortifolio || null, 
      UrlLinkedin: linkedinHandle ? this.linkedInPrefix + linkedinHandle : null,
      UrlInstagram: instagramHandle ? this.instagramPrefix + instagramHandle : null,
      categoriaPrincipalId: this.isArtistaOuAdmin ? this.editForm.get('categoriaPrincipalId')?.value || null : undefined
    };

    this.usuarioService.updateMyProfile(textData, this.selectedFile).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (updatedProfile) => {
        this.profileUpdated.emit(updatedProfile);
        this.closeModal();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Não foi possível atualizar o perfil. Tente novamente.';
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  private showTemporaryError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = null;
      }
    }, 3000);
  }
}