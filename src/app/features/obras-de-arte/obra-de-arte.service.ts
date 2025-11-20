import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ObraDeArte, UpdateObraDeArteDto } from '../../core/models/obra-de-arte.model';
import { PaginatedResponse } from '../../core/models/paginated-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ObraDeArteService {
    private readonly apiUrl = `${environment.apiUrl}/ObrasDeArte`;

  constructor(private http: HttpClient) { }

  createObra(formData: FormData): Observable<ObraDeArte> {
    return this.http.post<ObraDeArte>(this.apiUrl, formData);
  }

  getAll(
    categoryId: string | null = "",
    username: string | null = null,   
    cursor: string | null = null,
    pageSize: number = 10
  ): Observable<PaginatedResponse<ObraDeArte>> {
    
    let params = new HttpParams();
    params = params.set('pageSize', pageSize.toString());

    if (categoryId) {
      params = params.set('categoriaId', categoryId);
    }
 
    if (cursor) {
        params = params.set('cursor', cursor);
    }

    let retorno = this.http.get<PaginatedResponse<ObraDeArte>>(this.apiUrl, { params });
    return retorno;
  }

  getAllByUser(
    userId: string,
    cursor: string | null = null,
    pageSize: number = 10
  ): Observable<ObraDeArte[]> {
    return this.http.get<ObraDeArte[]>(`${this.apiUrl}/user/${userId}`);
  }

  getObraById(id: string): Observable<ObraDeArte> {
    return this.http.get<ObraDeArte>(`${this.apiUrl}/${id}`);
  }

  updateObra(id: string, dto: UpdateObraDeArteDto): Observable<ObraDeArte> {
    return this.http.put<ObraDeArte>(`${this.apiUrl}/${id}`, dto);
  }

  deleteObra(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}