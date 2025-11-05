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

  // --- ADICIONADO ---
  // Definir os prefixos como constantes públicas para usar no template
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
    document.body.style.overflow = ''; // restaura quando fechar
  }

  ngOnInit(): void {
    document.body.style.overflow = 'hidden'; // trava o scroll da página

    // Função auxiliar para extrair o "handle" da URL completa
    const extractHandle = (url: string | null | undefined, prefix: string): string => {
      if (url && url.toLowerCase().startsWith(prefix.toLowerCase())) {
        // Pega 'username' de '.../prefixo/username/outracoisa'
        return url.substring(prefix.length).split('/')[0]; 
      }
      return ''; // Retorna string vazia se nulo ou não começar com o prefixo
    };

    // Inicializa o formulário
    this.editForm = this.fb.group({
      bio: [this.userProfile.bio || '', [Validators.maxLength(500)]],

      categoriaPrincipalId: [{
        value: this.userProfile.categoriaPrincipalId || '', 
        disabled: !this.isArtistaOuAdmin // Só artistas podem mudar
      }],
      
      // Portfólio continua sendo uma URL completa.
      UrlPortifolio: [
        this.userProfile.urlPortifolio || '', 
        [Validators.pattern(this.urlRegex)] // <-- A VALIDAÇÃO
      ],
      
      // Novos campos de "handle" com validação de pattern
      linkedinHandle: [
        extractHandle(this.userProfile.urlLinkedin, this.linkedInPrefix),
        // Regex: permite letras, números, hífen e underscore
        [Validators.pattern(/^[a-zA-Z0-9_-]+$/)] 
      ],
      instagramHandle: [
        extractHandle(this.userProfile.urlInstagram, this.instagramPrefix),
        // Regex: permite letras, números, ponto e underscore
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
      // --- 1. VALIDAÇÃO ADICIONADA ---
      // Verifica se o tipo de arquivo começa com "image/"
      if (!file.type.startsWith('image/')) {
        this.showTemporaryError('Arquivo inválido. Por favor, selecione apenas imagens.');
        element.value = ''; // Limpa o input
        return;
      }
      // --- Fim da Validação ---

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // --- NOVO MÉTODO ---
  /**
   * Intercepta o evento 'paste' (colar) nos inputs de redes sociais.
   * Tenta extrair o "handle" de uma URL completa colada.
   */
  handleSocialPaste(event: ClipboardEvent, fieldName: 'linkedinHandle' | 'instagramHandle'): void {
    event.preventDefault(); // Impede a colagem padrão
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
      // Tenta analisar como uma URL
      const url = new URL(pastedText);

      if (url.hostname.includes(expectedHost)) {
        if (fieldName === 'linkedinHandle' && url.pathname.startsWith(expectedPathPrefix)) {
          handle = url.pathname.substring(expectedPathPrefix.length).split('/')[0];
          isValidPaste = true;
        } else if (fieldName === 'instagramHandle' && url.pathname.length > 1) { // > 1 para ignorar apenas "/"
          handle = url.pathname.substring(expectedPathPrefix.length).split('/')[0];
          isValidPaste = true;
        }
      }
    } catch (e) {
      // Não é uma URL, pode ser um handle.
      // Deixa o 'handle' como o texto colado para o validador de pattern pegar
      handle = pastedText;
      isValidPaste = true; // É válido colar um handle
    }

    if (isValidPaste) {
      this.editForm.get(fieldName)?.setValue(handle);
      this.editForm.get(fieldName)?.markAsDirty();
      // this.toastService.success('Link adaptado com sucesso!');
    } else {
      // Colou algo que não é um link válido (ex: google.com)
      this.showTemporaryError(`Link inválido. Cole um link do ${fieldName === 'linkedinHandle' ? 'LinkedIn' : 'Instagram'}.`);
      // this.toastService.error('Link inválido. Cole um link do LinkedIn.');
    }
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // --- ATUALIZADO ---
    // Reconstrói as URLs completas a partir dos "handles" antes de enviar
    const { bio, UrlPortifolio, linkedinHandle, instagramHandle } = this.editForm.value;

    const textData = {
      bio,
      // Envia nulo (ou string vazia) se o campo estiver vazio
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
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Não foi possível atualizar o perfil. Tente novamente.';
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  // --- NOVO MÉTODO (AUXILIAR) ---
  /** Mostra uma mensagem de erro que desaparece sozinha. */
  private showTemporaryError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      // Só limpa a mensagem se for a mesma (evita apagar um erro de API)
      if (this.errorMessage === message) {
        this.errorMessage = null;
      }
    }, 3000); // 3 segundos
  }
}