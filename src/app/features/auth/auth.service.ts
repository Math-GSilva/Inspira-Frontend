import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { DecodedToken } from './decoded-token.model';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'inspira_auth_token';

  private currentUserSubject = new BehaviorSubject<DecodedToken | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.decodeAndNotify();
  }

  public get currentUserValue(): DecodedToken | null {
    return this.currentUserSubject.value;
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response && response.token) {
          this.saveAuthData(response.token, null);
          this.decodeAndNotify();
        }
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, userData);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) {
      return false; // Não há token
    }

    try {
      const decodedToken: DecodedToken = jwtDecode(token);

      const expirationDate = decodedToken.exp * 1000;
      const now = Date.now();

      return expirationDate > now;
    } catch (error) {
      console.error('Token inválido ou corrompido:', error);
      return false;
    }
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  updateCurrentUserProfilePhoto(newUrl: string): void {
  const current = this.currentUserSubject.value;
  if (current) {
    const updated = { ...current, urlPerfil: newUrl };
    this.currentUserSubject.next(updated);

    sessionStorage.setItem('currentUser', JSON.stringify(updated));
  }
}

  private decodeAndNotify(): void {
    const token = this.getToken();

    if (!token || !this.isAuthenticated()) {
      this.currentUserSubject.next(null);
      return;
    }

    try {
      const decodedPayload: any = jwtDecode(token);

      const userData: DecodedToken = {
        sub: decodedPayload.sub,
        email: decodedPayload.email,
        name: decodedPayload.name,
        role: decodedPayload[
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        ],
        exp: decodedPayload.exp,
        urlPerfil: decodedPayload.urlPerfil,
      };

      this.currentUserSubject.next(userData);
    } catch (error) {
      console.error('Erro ao decodificar o token JWT:', error);
      this.currentUserSubject.next(null);
    }
  }

  private saveAuthData(token: string, userInfo: any): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    if (userInfo) {
      sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
    }
  }
}
