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

}
