import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateCurtidaDto, CurtidaResponseDto } from '../../core/models/curtida.model';
@Injectable({
  providedIn: 'root'
})
export class CurtidaService {
  private apiUrl = `http://localhost:8000/api/Curtidas`;

  constructor(private http: HttpClient) { }

  /**
   * Envia uma curtida para uma obra de arte.
   * Corresponde a: POST /api/curtidas
   * @param obraDeArteId - O ID da obra a ser curtida.
   */
  curtir(obraDeArteId: string): Observable<CurtidaResponseDto> {
    const dto: CreateCurtidaDto = { obraDeArteId };
    return this.http.post<CurtidaResponseDto>(this.apiUrl, dto);
  }

  /**
   * Remove uma curtida de uma obra de arte.
   * Corresponde a: DELETE /api/curtidas/{obraDeArteId}
   * @param obraDeArteId - O ID da obra a ser descurtida.
   */
  descurtir(obraDeArteId: string): Observable<CurtidaResponseDto> {
    return this.http.delete<CurtidaResponseDto>(`${this.apiUrl}/${obraDeArteId}`);
  }
}
