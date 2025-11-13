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
  styleUrls: ['./edit-post-modal.component.scss'], 
  providers: [ObraDeArteService] 
})
export class EditPostModalComponent implements OnInit, OnChanges {
  
  
  @Input() artwork: ObraDeArte | null = null;
  
  
  @Output() close = new EventEmitter<void>();
  
  @Output() saveSuccess = new EventEmitter<ObraDeArte>(); 

  editForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private obraDeArteService: ObraDeArteService 
  ) {}

  ngOnInit(): void {
    
    this.editForm = this.fb.group({
      Titulo: ['', [Validators.required, Validators.maxLength(200)]],
      Descricao: ['', Validators.required]
    });

    
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    
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

    
    const dto: UpdateObraDeArteDto = {
      titulo: this.editForm.get('Titulo')!.value,
      descricao: this.editForm.get('Descricao')!.value,
    };

    
    this.obraDeArteService.updateObra(this.artwork.id, dto)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedArtwork) => {
          this.saveSuccess.emit(updatedArtwork); 
          this.closeModal(); 
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
