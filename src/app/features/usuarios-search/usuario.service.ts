import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioSearchResultDto } from '../../core/models/usuario-search-response.model';
import { UsuarioProfile } from '../../core/models/usuario-profile.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `http://localhost:8000/api/Usuario`;

  constructor(private http: HttpClient) { }

  searchUsers(query: string, categoriaPrincipal: string): Observable<UsuarioSearchResultDto[]> {
    console.log(query);
    const params = new HttpParams().set('query', query).set('categoriaPrincipal', categoriaPrincipal);
    let result = this.http.get<UsuarioSearchResultDto[]>(`${this.apiUrl}/search`, { params });
    result.forEach(user => {
      console.log(user);
    })
    return result;
  }

  getProfile(username: string): Observable<UsuarioProfile> {
    return this.http.get<UsuarioProfile>(`${this.apiUrl}/${username}`);
  }

  followUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/follow`, {});
  }

  unfollowUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}/follow`);
  }

  updateMyProfile(
    // O seu DTO de TS agora só precisa dos campos de texto
    textData: { nomeCompleto: string; bio?: string },
    fotoPerfil: File | null
  ): Observable<UsuarioProfile> {
    
    // Criamos um FormData, que é o formato para enviar ficheiros
    const formData = new FormData();

    // Adiciona os campos de texto ao FormData
    formData.append('NomeCompleto', textData.nomeCompleto);
    
    // Verificamos se a 'bio' não é nula ou indefinida antes de adicionar
    if (textData.bio) {
      formData.append('Bio', textData.bio);
    }

    // Adiciona o ficheiro (se o utilizador selecionou um)
    // O nome 'FotoPerfil' DEVE ser igual ao da propriedade no seu DTO C#
    if (fotoPerfil) {
      formData.append('FotoPerfil', fotoPerfil, fotoPerfil.name);
    }

    // A requisição agora é um PUT com FormData. 
    // O Angular (e o interceptor) tratará dos headers (multipart/form-data).
    return this.http.put<UsuarioProfile>(`${this.apiUrl}/me`, formData);
  }

}
