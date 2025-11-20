import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateCurtidaDto, CurtidaResponseDto } from '../../core/models/curtida.model';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class CurtidaService {
    private readonly apiUrl = `${environment.apiUrl}/Curtidas`;

  constructor(private http: HttpClient) { }

  curtir(obraDeArteId: string): Observable<CurtidaResponseDto> {
    const dto: CreateCurtidaDto = { obraDeArteId };
    return this.http.post<CurtidaResponseDto>(this.apiUrl, dto);
  }

  descurtir(obraDeArteId: string): Observable<CurtidaResponseDto> {
    return this.http.delete<CurtidaResponseDto>(`${this.apiUrl}/${obraDeArteId}`);
  }
}
