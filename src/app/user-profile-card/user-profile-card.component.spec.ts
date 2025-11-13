import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { UserProfileCardComponent } from './user-profile-card.component';
import { AuthService } from '../features/auth/auth.service';
import { DecodedToken } from '../features/auth/decoded-token.model';

// --- Mock de Dados ---
const mockUser: DecodedToken = {
  sub: '1',
  name: 'UsuarioTeste',
  email: 'teste@email.com',
  role: 'Artista',
  exp: 123456,
  urlPerfil: 'http://minha-foto.com/avatar.jpg',
  iss: 'issuer',
  aud: 'audience'
};

fdescribe('UserProfileCardComponent', () => {
  let component: UserProfileCardComponent;
  let fixture: ComponentFixture<UserProfileCardComponent>;

  // Usamos BehaviorSubject para controlar o estado do usuário durante os testes
  // Isso nos permite emitir 'null' ou um usuário e ver como o HTML reage.
  const currentUserSubject = new BehaviorSubject<DecodedToken | null>(mockUser);

  const mockAuthService = {
    currentUser$: currentUserSubject.asObservable(),
    logout: jasmine.createSpy('logout')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UserProfileCardComponent, // Standalone
        RouterTestingModule // Necessário para o [routerLink] funcionar sem erros
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserProfileCardComponent);
    component = fixture.componentInstance;
    
    // Resetar o estado para o padrão antes de cada teste
    currentUserSubject.next(mockUser);
    mockAuthService.logout.calls.reset();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Testes de Renderização (Com Usuário Logado) ---
  describe('When user is logged in', () => {
    
    it('should render user information correctly', () => {
      const nameEl = fixture.debugElement.query(By.css('.profile-name')).nativeElement;
      const emailEl = fixture.debugElement.query(By.css('.profile-username')).nativeElement;
      const roleEl = fixture.debugElement.query(By.css('.profile-role')).nativeElement;

      expect(nameEl.textContent).toContain('UsuarioTeste');
      expect(emailEl.textContent).toContain('teste@email.com');
      expect(roleEl.textContent).toContain('(Artista)');
    });

    it('should render profile image if urlPerfil exists', () => {
      const imgEl = fixture.debugElement.query(By.css('.profile-avatar')).nativeElement as HTMLImageElement;
      expect(imgEl.src).toContain('http://minha-foto.com/avatar.jpg');
    });

    it('should use fallback image if urlPerfil is null', () => {
      // Simula usuário sem foto
      const userNoPhoto = { ...mockUser, urlPerfil: '' };
      currentUserSubject.next(userNoPhoto); // Emite novo estado
      fixture.detectChanges(); // Atualiza HTML

      const imgEl = fixture.debugElement.query(By.css('.profile-avatar')).nativeElement as HTMLImageElement;
      
      // Verifica se usou o placehold.co e a inicial do nome ('U')
      expect(imgEl.src).toContain('placehold.co');
      expect(imgEl.src).toContain('text=U');
    });

    it('should have correct router links to profile', () => {
      // Procura todos os links (imagem e nome)
      const links = fixture.debugElement.queryAll(By.css('a'));
      
      // Verifica se o atributo href (gerado pelo RouterLink) contém o nome do usuário
      // Nota: RouterTestingModule gera o href, mas em testes unitários geralmente verificamos
      // se a diretiva recebeu os parâmetros corretos. 
      // Simplificando: verificamos se o atributo reflete a intenção.
      const linkToProfile = links[0]; 
      expect(linkToProfile.attributes['ng-reflect-router-link']).toContain('UsuarioTeste');
    });
  });

  // --- Teste de Estado Vazio (Sem Usuário) ---
  describe('When user is NOT logged in', () => {
    it('should NOT render the card content', () => {
      currentUserSubject.next(null); // Simula logout/sem sessão
      fixture.detectChanges();

      const card = fixture.debugElement.query(By.css('.user-profile-card'));
      // Como tem um *ngIf na raiz, o elemento não deve existir no DOM
      expect(card).toBeNull();
    });
  });

  // --- Teste de Interação ---
  describe('Actions', () => {
    it('should call AuthService.logout when logout button is clicked', () => {
      const logoutBtn = fixture.debugElement.query(By.css('.logout-button'));
      
      logoutBtn.triggerEventHandler('click', null);

      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });
});