import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ObraDeArte, UpdateObraDeArteDto } from '../../core/models/obra-de-arte.model';

@Injectable({
  providedIn: 'root'
})
export class ObraDeArteService {
  private readonly apiUrl = `http://localhost:8000/api/ObrasDeArte`; // Ex: 'http://localhost:8000/api/ObrasDeArte'

  constructor(private http: HttpClient) { }

  /**
   * Cria uma nova obra de arte. Corresponde ao endpoint [HttpPost].
   * @param formData - Os dados do formulário, incluindo o ficheiro de mídia.
   */
  createObra(formData: FormData): Observable<ObraDeArte> {
    return this.http.post<ObraDeArte>(this.apiUrl, formData);
  }

  /**
   * Busca todas as obras de arte. Corresponde ao endpoint [HttpGet].
   */
  getAll(
    categoryId: string | null = "", // Renomeado para seguir o padrão
    username: string | null = null,   // Adicionado para perfil
    cursor: string | null = null,
    pageSize: number = 10
  ): Observable<ObraDeArte[]> { // Atualizado para retornar PaginatedResponseDto
    
    let params = new HttpParams(); // Adiciona o tamanho da página

    // Adiciona o parâmetro de categoria à query se ele existir
    if (categoryId) {
      params = params.set('categoriaId', categoryId);
    }
    // // Adiciona o parâmetro de username à query se ele existir
    // if (username) {
    //   params = params.set('username', username);
    // }
    // // Adiciona o cursor à query se ele existir
    // if (cursor) {
    //     params = params.set('cursor', cursor);
    // }

    // Envia a requisição GET com os parâmetros
    // Espera receber a estrutura PaginatedResponseDto<ObraDeArte>
    return this.http.get<ObraDeArte[]>(this.apiUrl, { params });
  }

  getAllByUser(
    userId: string, // Renomeado para seguir o padrão
    cursor: string | null = null,
    pageSize: number = 10
  ): Observable<ObraDeArte[]> { // Atualizado para retornar PaginatedResponseDto
    return this.http.get<ObraDeArte[]>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Busca uma obra de arte específica pelo seu ID. Corresponde ao [HttpGet("{id}")].
   */
  getObraById(id: string): Observable<ObraDeArte> {
    return this.http.get<ObraDeArte>(`${this.apiUrl}/${id}`);
  }

  /**
   * Busca o ficheiro de mídia (imagem/vídeo) de uma obra. Corresponde ao [HttpGet("{id}/midia")].
   * Retorna um Blob, que pode ser convertido numa URL para ser usado em tags <img> ou <video>.
   */
  getMidia(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/midia`, { responseType: 'blob' });
  }

  /**
   * Atualiza uma obra de arte. Corresponde ao [HttpPut("{id}")].
   */
  updateObra(id: string, dto: UpdateObraDeArteDto): Observable<ObraDeArte> {
    return this.http.put<ObraDeArte>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Apaga uma obra de arte. Corresponde ao [HttpDelete("{id}")].
   */
  deleteObra(id: string): Observable<void> {
    // A API retorna NoContent (204), então o tipo de retorno é 'void'.
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
