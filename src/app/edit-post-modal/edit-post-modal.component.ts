import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service';
import { ObraDeArte, UpdateObraDeArteDto } from '../core/models/obra-de-arte.model';

@Component({
  selector: 'app-edit-post-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-post-modal.component.html',
  styleUrls: ['./edit-post-modal.component.scss'], // Usando o SCSS do new-post-modal
  providers: [ObraDeArteService] // Adiciona o serviço
})
export class EditPostModalComponent implements OnInit, OnChanges {
  
  // --- ENTRADA ---
  // Recebe a obra de arte que será editada
  @Input() artwork: ObraDeArte | null = null;
  
  // --- SAÍDAS ---
  @Output() close = new EventEmitter<void>();
  // Emite a obra de arte atualizada para o componente pai (timeline)
  @Output() saveSuccess = new EventEmitter<ObraDeArte>(); 

  editForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private obraDeArteService: ObraDeArteService // Apenas o service de ObraDeArte é necessário
  ) {}

  ngOnInit(): void {
    // 1. O formulário só precisa de Título e Descrição
    this.editForm = this.fb.group({
      Titulo: ['', [Validators.required, Validators.maxLength(200)]],
      Descricao: ['', Validators.required]
    });

    // 2. Preenche o formulário se o 'artwork' já estiver disponível no init
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // 3. Garante que o formulário seja preenchido se o 'artwork' chegar depois
    if (changes['artwork'] && this.artwork) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (this.artwork && this.editForm) {
      this.editForm.patchValue({
        Titulo: this.artwork.titulo,
        Descricao: this.artwork.descricao
      });
    }
  }

  onSubmit(): void {
    if (this.editForm.invalid || !this.artwork) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // 4. Cria o DTO de atualização apenas com os campos permitidos
    const dto: UpdateObraDeArteDto = {
      titulo: this.editForm.get('Titulo')!.value,
      descricao: this.editForm.get('Descricao')!.value,
    };

    // 5. Chama o método 'updateObra' do serviço
    this.obraDeArteService.updateObra(this.artwork.id, dto)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedArtwork) => {
          this.saveSuccess.emit(updatedArtwork); // Emite a obra atualizada
          this.closeModal(); // Fecha o modal
        },
        error: (err: any) => {
          this.errorMessage = 'Erro ao salvar as alterações. Tente novamente.';
          console.error(err);
        }
      });
  }

  closeModal(): void {
    this.close.emit();
  }
}