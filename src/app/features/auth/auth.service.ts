// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { DecodedToken } from './decoded-token.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8000/api/auth';

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
      tap(response => {
        if (response && response.token) {
          this.saveAuthData(response.token, null); // userInfo pode ser removido se o JWT tem tudo
          this.decodeAndNotify(); // <-- 4. Descodifica e notifica os subscritores após o login
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, userData);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private decodeAndNotify(): void {
    const token = localStorage.getItem('authToken');

    if (!token) {
      this.currentUserSubject.next(null);
      return;
    }

    try {
      // O payload é a segunda parte do token (entre os dois '.')
      const payloadBase64 = token.split('.')[1];
      // atob() descodifica uma string Base64
      const decodedPayload = JSON.parse(atob(payloadBase64));

      // 6. Mapear os claims do token para o nosso interface DecodedToken
      const userData: DecodedToken = {
        sub: decodedPayload.sub,
        email: decodedPayload.email,
        nameid: decodedPayload.nameid,
        // Usamos a notação de brackets para aceder à chave com caracteres especiais
        role: decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
        exp: decodedPayload.exp
      };
      
      this.currentUserSubject.next(userData);

    } catch (error) {
      console.error("Erro ao descodificar o token JWT:", error);
      this.currentUserSubject.next(null);
    }
  }

  private saveAuthData(token: string, userInfo: any): void {
    localStorage.setItem('authToken', token);
    if (userInfo) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }
  }
}