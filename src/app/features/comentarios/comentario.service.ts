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

  /**
   * Busca todos os comentários de uma obra de arte específica.
   * Corresponde a: GET /api/comentarios?obraDeArteId={id}
   * @param obraDeArteId - O ID da obra de arte.
   */
  getComentarios(obraDeArteId: string): Observable<Comentario[]> {
    const params = new HttpParams().set('obraDeArteId', obraDeArteId);
    return this.http.get<Comentario[]>(this.apiUrl, { params });
  }

  /**
   * Cria um novo comentário.
   * Corresponde a: POST /api/comentarios
   * @param dto - O objeto com o ID da obra e o texto do comentário.
   */
  criarComentario(dto: CreateComentarioDto): Observable<Comentario> {
    return this.http.post<Comentario>(this.apiUrl, dto);
  }

  /**
   * Elimina um comentário.
   * Corresponde a: DELETE /api/comentarios/{id}
   * @param id - O ID do comentário a ser eliminado.
   */
  deletarComentario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
