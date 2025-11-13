import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // <-- Importe o HttpClient
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

fdescribe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const TOKEN_KEY = 'inspira_auth_token';
  const API_URL = `${environment.apiUrl}/auth`;

  // --- Helper para criar Tokens JWT Falsos (Base64URL Safe) ---
  function createMockToken(expirationInSeconds: number): string {
    const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
    const payload = JSON.stringify({
      sub: '123',
      email: 'test@test.com',
      name: 'Tester',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Artista',
      urlPerfil: 'http://img.com/foto.jpg',
      exp: expirationInSeconds
    });

    // Função auxiliar para converter para Base64Url (sem padding, +, /)
    const base64Url = (str: string) => {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    return `${base64Url(header)}.${base64Url(payload)}.fake-signature`;
  }

  beforeEach(() => {
    sessionStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    // Injeta o serviço padrão (inicia com storage vazio)
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  // --- Testes de Login ---
  describe('login', () => {
    it('deve fazer POST para /login, salvar token e atualizar estado do usuário', () => {
      const mockCredentials = { email: 'test@test.com', password: '123' };
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const mockToken = createMockToken(futureExp);
      const mockResponse = { token: mockToken };

      service.login(mockCredentials).subscribe(() => {
        expect(sessionStorage.getItem(TOKEN_KEY)).toBe(mockToken);
        const currentUser = service.currentUserValue;
        expect(currentUser).toBeTruthy();
        expect(currentUser?.email).toBe('test@test.com');
      });

      const req = httpMock.expectOne(`${API_URL}/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  // --- Testes de Logout ---
  describe('logout', () => {
    it('deve limpar token, estado do usuário e navegar para login', () => {
      sessionStorage.setItem(TOKEN_KEY, 'token-falso');
      service.logout();
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(service.currentUserValue).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // --- Testes de Registro ---
  describe('register', () => {
    it('deve fazer POST para /register', () => {
      const userData = { name: 'Novo' };
      service.register(userData).subscribe();
      const req = httpMock.expectOne(`${API_URL}/register`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  // --- Testes de Validação ---
  describe('isAuthenticated', () => {
    it('deve retornar FALSE se não houver token', () => {
      sessionStorage.removeItem(TOKEN_KEY);
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('deve retornar TRUE se o token for válido', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createMockToken(futureExp);
      sessionStorage.setItem(TOKEN_KEY, validToken);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('deve retornar FALSE se o token estiver expirado', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createMockToken(pastExp);
      sessionStorage.setItem(TOKEN_KEY, expiredToken);
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  // --- Teste de Inicialização (Construtor) ---
  describe('Constructor (decodeAndNotify)', () => {
    
    it('deve carregar o usuário automaticamente se houver um token válido no storage ao iniciar', () => {
      // 1. Prepara o cenário (Token válido no storage)
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createMockToken(futureExp);
      sessionStorage.setItem(TOKEN_KEY, validToken);

      // 2. SOLUÇÃO: Instanciar MANUALMENTE o serviço
      // Isso força o construtor a rodar AGORA, lendo o storage que acabamos de preencher
      const http = TestBed.inject(HttpClient);
      const router = TestBed.inject(Router);
      const newService = new AuthService(http, router);

      // 3. Verifica a nova instância
      expect(newService.currentUserValue).toBeTruthy();
      expect(newService.currentUserValue?.name).toBe('Tester');
    });

    it('deve limpar o usuário se o token no storage estiver expirado ao iniciar', () => {
      // 1. Token expirado
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createMockToken(pastExp);
      sessionStorage.setItem(TOKEN_KEY, expiredToken);

      // 2. Instancia manualmente
      const http = TestBed.inject(HttpClient);
      const router = TestBed.inject(Router);
      const newService = new AuthService(http, router);

      // 3. Verifica
      expect(newService.currentUserValue).toBeNull();
    });
  });

  // --- Atualização de Foto ---
  describe('updateCurrentUserProfilePhoto', () => {
    it('deve atualizar a URL da foto', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = createMockToken(futureExp);
      sessionStorage.setItem(TOKEN_KEY, token);
      
      // Precisamos de um serviço "logado"
      const http = TestBed.inject(HttpClient);
      const router = TestBed.inject(Router);
      const loggedService = new AuthService(http, router);

      loggedService.updateCurrentUserProfilePhoto('nova-url.jpg');

      expect(loggedService.currentUserValue?.urlPerfil).toBe('nova-url.jpg');
    });
  });
});