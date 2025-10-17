import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria, CreateCategoriaDto, UpdateCategoriaDto } from '../../core/models/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly apiUrl = `http://localhost:8000/api/Categorias`;
  constructor(private http: HttpClient) { }

  getCategories(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl);
  }

  getCategoryById(id: string): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${id}`);
  }

  createCategory(dto: CreateCategoriaDto): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, dto);
  }

  updateCategory(id: string, dto: UpdateCategoriaDto): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, dto);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

