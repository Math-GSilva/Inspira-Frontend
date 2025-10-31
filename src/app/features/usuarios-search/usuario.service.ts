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
    const params = new HttpParams().set('query', query).set('categoriaPrincipal', categoriaPrincipal);
    let result = this.http.get<UsuarioSearchResultDto[]>(`${this.apiUrl}/search`, { params });

    return result;
  }

  getProfile(username: string): Observable<UsuarioProfile> {
    let retorno = this.http.get<UsuarioProfile>(`${this.apiUrl}/${username}`);
    return retorno;
  }

  followUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/follow`, {});
  }

  unfollowUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}/follow`);
  }

  updateMyProfile(
    // 1. ATUALIZADO: 'textData' agora aceita o novo ID
    textData: { 
      bio?: string | null;
      UrlPortifolio?: string | null;
      UrlLinkedin?: string | null;
      UrlInstagram?: string | null;
      categoriaPrincipalId?: string | null; // <-- ADICIONADO
    },
    fotoPerfil: File | null
  ): Observable<UsuarioProfile> {
    
    const formData = new FormData();

    // 2. Adiciona os campos (incluindo o novo)
    if (textData.bio) {
      formData.append('Bio', textData.bio);
    }
    if (textData.UrlPortifolio) {
      formData.append('UrlPortifolio', textData.UrlPortifolio);
    }
    if (textData.UrlLinkedin) {
      formData.append('UrlLinkedin', textData.UrlLinkedin);
    }
    if (textData.UrlInstagram) {
      formData.append('UrlInstagram', textData.UrlInstagram);
    }
    // --- ADICIONADO ---
    if (textData.categoriaPrincipalId) {
      formData.append('CategoriaPrincipalId', textData.categoriaPrincipalId);
    }
    // --- FIM ---
    
    if (fotoPerfil) {
      formData.append('FotoPerfil', fotoPerfil, fotoPerfil.name);
    }

    return this.http.put<UsuarioProfile>(`${this.apiUrl}/me`, formData);
  }
}
