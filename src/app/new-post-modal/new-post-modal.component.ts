import { CommonModule } from "@angular/common";
import { Component, EventEmitter, OnInit, Output, OnDestroy } from "@angular/core"; // 1. Importar OnDestroy
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { finalize, Observable } from "rxjs";
import { ObraDeArteService } from "../features/obras-de-arte/obra-de-arte.service";
import { CategoriaService } from "../features/categorias/categoria.service";
import { Categoria } from "../core/models/categoria.model";
import { PostStateService } from "../features/obras-de-arte/post-state.service";
import { ObraDeArte } from "../core/models/obra-de-arte.model";
import { PlyrModule } from "@atom-platform/ngx-plyr";
import { NgSelectModule } from "@ng-select/ng-select";

@Component({
  selector: 'app-new-post-modal',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    PlyrModule, // <-- 3. ADICIONAR PLYR AOS IMPORTS,
    NgSelectModule 
  ],
  templateUrl: './new-post-modal.component.html',
  styleUrls: ['./new-post-modal.component.scss'],
  providers: [CategoriaService, ObraDeArteService]
})
export class NewPostModalComponent implements OnInit, OnDestroy { // 4. Implementar OnDestroy
  @Output() close = new EventEmitter<void>();

  postForm!: FormGroup;
  categories$!: Observable<Categoria[]>;
  selectedFile: File | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  // --- 5. NOVAS PROPRIEDADES DE PREVIEW ---
  previewType: 'image' | 'video' | 'audio' | null = null;
  previewUrl: string | null = null; // Agora será string (DataURL ou ObjectURL)
  
  // Estado do Plyr
  plyrSources: Plyr.Source[] = [];
  plyrType: Plyr.MediaType = 'video';

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private obraDeArteService: ObraDeArteService,
    private postStateService: PostStateService
  ) {}

  ngOnInit(): void {
      document.body.style.overflow = 'hidden'; // trava o scroll da página

    this.postForm = this.fb.group({
      Titulo: ['', [Validators.required, Validators.maxLength(200)]],
      Descricao: ['', Validators.required],
      Midia: [null, Validators.required],
      CategoriaId: ['', Validators.required]
    });

    this.categories$ = this.categoriaService.getCategories();
  }

  ngOnDestroy(): void {
      document.body.style.overflow = ''; // restaura quando fechar

    // 6. Limpa o ObjectURL para evitar vazamento de memória
    if (this.previewUrl && this.previewType !== 'image') {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  // --- 7. MÉTODO onFileSelected TOTALMENTE ATUALIZADO ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // --- Validação de Tipo ---
    const fileType = file.type;
    const isValid = fileType.startsWith('image/') || fileType.startsWith('video/') || fileType.startsWith('audio/');

    if (!isValid) {
      this.errorMessage = 'Tipo de arquivo inválido. Apenas imagens, vídeos ou áudios são permitidos.';
      this.postForm.get('Midia')?.reset();
      this.clearPreview();
      return;
    }

    // --- Limpeza do preview anterior ---
    this.clearPreview();

    // --- Configuração do novo preview ---
    this.selectedFile = file;
    this.postForm.patchValue({ Midia: this.selectedFile });
    this.errorMessage = null;

    // Gerar URLs de preview
    if (fileType.startsWith('image/')) {
      // 7.1. Imagens usam FileReader (como antes)
      this.previewType = 'image';
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // 7.2. Vídeo e Áudio usam ObjectURL (Blob URL) para o Plyr
      this.previewUrl = URL.createObjectURL(file);
      this.plyrSources = [{
        src: this.previewUrl,
        type: file.type
      }];

      if (fileType.startsWith('video/')) {
        this.previewType = 'video';
        this.plyrType = 'video';
      } else {
        this.previewType = 'audio';
        this.plyrType = 'audio';
      }
    }
  }

  private clearPreview(): void {
    // Limpa o ObjectURL anterior (se existir)
    if (this.previewUrl && this.previewType !== 'image') {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
    this.previewType = null;
    this.plyrSources = [];
    this.selectedFile = null;
  }

  onSubmit(): void {
    // ... (Lógica de submit não muda) ...
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const formData = new FormData();
    formData.append('Titulo', this.postForm.get('Titulo')!.value);
    formData.append('Descricao', this.postForm.get('Descricao')!.value);
    formData.append('CategoriaId', this.postForm.get('CategoriaId')!.value);
    formData.append('Midia', this.selectedFile!);

    this.obraDeArteService.createObra(formData)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (newPost: ObraDeArte) => {
          this.postStateService.announceNewPost(newPost); // Anuncia o novo post
          this.closeModal();
        },
        error: (err: any) => {
          this.errorMessage = 'Erro ao criar a publicação. Tente novamente.';
          console.error(err);
        }
      });
  }

  closeModal(): void {
    this.close.emit();
  }
}