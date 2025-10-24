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
  // Event emitters to communicate with the parent component
  @Output() close = new EventEmitter<void>();
  @Output() categoryAdded = new EventEmitter<Categoria>(); // Notify parent when successful

  categoryForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService
  ) {}

  ngOnInit(): void {
    // Initialize the form based on CreateCategoriaDto
    this.categoryForm = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      descricao: ['', [Validators.maxLength(500)]]
    });
  }

  // Getter for easier access to form controls in the template
  get f() { return this.categoryForm.controls; }

  /**
   * Handles form submission.
   */
  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // Prepare the DTO from form values
    const dto: CreateCategoriaDto = {
      nome: this.f['nome'].value,
      descricao: this.f['descricao'].value || null // Send null if empty
    };

    // Call the service to create the category
    this.categoriaService.createCategory(dto).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (newCategory) => {
        this.categoryAdded.emit(newCategory);
        this.closeModal();
      },
      error: (err) => {
        // Handle potential errors from the API
        this.errorMessage = err.error?.message || 'Erro ao criar a categoria. Tente novamente.';
        console.error('Error creating category:', err);
      }
    });
  }

  /**
   * Emits the close event.
   */
  closeModal(): void {
    this.close.emit();
  }
}