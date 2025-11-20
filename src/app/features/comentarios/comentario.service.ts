import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comentario, CreateComentarioDto } from '../../core/models/comentario.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComentarioService {
    private readonly apiUrl = `${environment.apiUrl}/Comentarios`;

  constructor(private http: HttpClient) { }

  getComentarios(obraDeArteId: string): Observable<Comentario[]> {
    const params = new HttpParams().set('obraDeArteId', obraDeArteId);
    return this.http.get<Comentario[]>(this.apiUrl, { params });
  }

  criarComentario(dto: CreateComentarioDto): Observable<Comentario> {
    return this.http.post<Comentario>(this.apiUrl, dto);
  }

  deletarComentario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
