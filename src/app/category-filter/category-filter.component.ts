import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { Categoria } from '../core/models/categoria.model';
import { CategoriaService } from '../features/categorias/categoria.service';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss']
})
export class CategoryFilterComponent implements OnInit {
  @Output() categorySelected = new EventEmitter<string | null>();

  categories$!: Observable<Categoria[]>;
  activeCategoryId: string | null = null; // Guarda o ID da categoria ativa

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit(): void {
    // Busca as categorias ao iniciar
    this.categories$ = this.categoriaService.getCategories();
  }
  selectCategory(categoryId: string | null): void {
    if (this.activeCategoryId !== categoryId) {
      this.activeCategoryId = categoryId;
      this.categorySelected.emit(this.activeCategoryId);
    }
  }
}