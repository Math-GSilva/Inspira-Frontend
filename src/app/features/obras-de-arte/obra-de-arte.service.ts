import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ObraDeArte, UpdateObraDeArteDto } from '../../core/models/obra-de-arte.model';
// --- ADICIONADO ---
import { PaginatedResponse } from '../../core/models/paginated-response.model';
import { environment } from '../../../envirorments/environment';

@Injectable({
  providedIn: 'root'
})
export class ObraDeArteService {
    private readonly apiUrl = `${environment.apiUrl}/ObrasDeArte`;

  constructor(private http: HttpClient) { }

  /**
   * Cria uma nova obra de arte. Corresponde ao endpoint [HttpPost].
   */
  createObra(formData: FormData): Observable<ObraDeArte> {
    return this.http.post<ObraDeArte>(this.apiUrl, formData);
  }

  /**
   * Busca todas as obras de arte de forma paginada.
   */
  getAll(
    categoryId: string | null = "",
    username: string | null = null,   
    cursor: string | null = null,
    pageSize: number = 10
  ): Observable<PaginatedResponse<ObraDeArte>> { // <-- 1. TIPO DE RETORNO ATUALIZADO
    
    let params = new HttpParams();
    params = params.set('pageSize', pageSize.toString()); // <-- 2. PARÂMETRO ADICIONADO

    if (categoryId) {
      params = params.set('categoriaId', categoryId);
    }
 
    if (cursor) {
        params = params.set('cursor', cursor); // O back-end espera um DateTime string
    }

    let retorno = this.http.get<PaginatedResponse<ObraDeArte>>(this.apiUrl, { params });
    return retorno;
  }

  // ... (método getAllByUser - pode ser atualizado da mesma forma depois) ...
  getAllByUser(
    userId: string,
    cursor: string | null = null,
    pageSize: number = 10
  ): Observable<ObraDeArte[]> {
    return this.http.get<ObraDeArte[]>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Busca uma obra de arte específica pelo seu ID.
   */
  getObraById(id: string): Observable<ObraDeArte> {
    return this.http.get<ObraDeArte>(`${this.apiUrl}/${id}`);
  }

  /**
   * Atualiza uma obra de arte.
   */
  updateObra(id: string, dto: UpdateObraDeArteDto): Observable<ObraDeArte> {
    return this.http.put<ObraDeArte>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Apaga uma obra de arte.
   */
  deleteObra(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}