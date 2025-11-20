import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Categoria, CreateCategoriaDto } from '../core/models/categoria.model';
import { CategoriaService } from '../features/categorias/categoria.service';

@Component({
  selector: 'app-add-category-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-category-modal.component.html',
  styleUrls: ['./add-category-modal.component.scss']
})
export class AddCategoryModalComponent implements OnInit {
  @Output() closeRequest = new EventEmitter<void>();
  @Output() categoryAdded = new EventEmitter<Categoria>();

  categoryForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService
  ) {}

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      descricao: ['', [Validators.maxLength(500)]]
    });
  }

  get f() { return this.categoryForm.controls; }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const dto: CreateCategoriaDto = {
      nome: this.f['nome'].value,
      descricao: this.f['descricao'].value || null
    };

    this.categoriaService.createCategory(dto).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (newCategory) => {
        this.categoryAdded.emit(newCategory);
        this.closeModal();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erro ao criar a categoria. Tente novamente.';
        console.error('Error creating category:', err);
      }
    });
  }

  closeModal(): void {
    this.closeRequest.emit();
  }
}