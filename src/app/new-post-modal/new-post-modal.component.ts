import { CommonModule } from "@angular/common";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { finalize, Observable } from "rxjs";
import { ObraDeArteService } from "../features/obras-de-arte/obra-de-arte.service";
import { CategoriaService } from "../features/categorias/categoria.service";
import { Categoria } from "../core/models/categoria.model";
import { PostStateService } from "../features/obras-de-arte/post-state.service";
import { ObraDeArte } from "../core/models/obra-de-arte.model";

@Component({
  selector: 'app-new-post-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-post-modal.component.html',
  styleUrls: ['./new-post-modal.component.scss'],
  providers: [CategoriaService, ObraDeArteService]
})
export class NewPostModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  postForm!: FormGroup;
  categories$!: Observable<Categoria[]>;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private obraDeArteService: ObraDeArteService,
    private postStateService: PostStateService
  ) {}

  ngOnInit(): void {
    this.postForm = this.fb.group({
      Titulo: ['', [Validators.required, Validators.maxLength(200)]],
      Descricao: ['', Validators.required],
      Midia: [null, Validators.required],
      CategoriaId: ['', Validators.required]
    });

    this.categories$ = this.categoriaService.getCategories();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.postForm.patchValue({ Midia: this.selectedFile });

      // Gerar uma pré-visualização da imagem
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit(): void {
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
          console.log('Post criado com sucesso!');
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