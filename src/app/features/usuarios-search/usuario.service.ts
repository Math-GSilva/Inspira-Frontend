import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioSearchResultDto } from '../../core/models/usuario-search-response.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `http://localhost:8000/api/Usuario`;

  constructor(private http: HttpClient) { }

  // Corresponde a GET /api/Usuario/search?query={query}
  searchUsers(query: string): Observable<UsuarioSearchResultDto[]> {
    console.log(query);
    const params = new HttpParams().set('query', query);
    let result = this.http.get<UsuarioSearchResultDto[]>(`${this.apiUrl}/search`, { params });
    result.forEach(user => {
      console.log(user);
    })
    return result;
  }

  // Corresponde a POST /api/Usuario/{id}/follow
  followUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/follow`, {});
  }

  // Corresponde a DELETE /api/Usuario/{id}/follow
  unfollowUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}/follow`);
  }

  // Poderia adicionar aqui os outros métodos (getProfile, updateMyProfile) quando precisar deles
}
