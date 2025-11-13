import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { LandingPageComponent } from './landing-page.component';

fdescribe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // 1. Criar um "Spy" (espião) do Router
    // Isso cria um objeto falso que tem um método 'navigate'
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LandingPageComponent], // Componente é standalone
      providers: [
        // 2. Diz ao Angular: "Quando alguém pedir o Router, entregue este espião"
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Testes de Renderização (HTML) ---
  describe('Template Rendering', () => {
    
    it('should render the main title "Inspira"', () => {
      const titleEl = fixture.debugElement.query(By.css('.main-title')).nativeElement;
      expect(titleEl.textContent).toContain('Inspira');
    });

    it('should render the sub-headline', () => {
      const subTitleEl = fixture.debugElement.query(By.css('.sub-headline')).nativeElement;
      expect(subTitleEl.textContent).toContain('Rede Social para Artistas Independentes');
    });

    it('should render 3 feature cards', () => {
      const cards = fixture.debugElement.queryAll(By.css('.feature-card'));
      expect(cards.length).toBe(3);
    });
  });

  // --- Testes de Lógica de Navegação ---
  describe('Navigation Logic', () => {

    it('should navigate to register page when navigateToRegister is called', () => {
      component.navigateToRegister();
      // Verifica se o método .navigate foi chamado com o argumento correto
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/register']);
    });

    it('should navigate to login page when navigateToLogin is called', () => {
      component.navigateToLogin();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // --- Testes de Integração (Clique no Botão -> Ação) ---
  describe('User Interaction (Button Clicks)', () => {

    it('should call navigateToRegister when "Criar Conta" button is clicked', () => {
      // 1. Espiona o método do componente
      spyOn(component, 'navigateToRegister').and.callThrough(); // .and.callThrough() garante que a lógica interna (o router) também rode

      // 2. Encontra o botão primário (Criar Conta)
      const registerBtn = fixture.debugElement.query(By.css('.btn-primary'));
      
      // 3. Clica
      registerBtn.triggerEventHandler('click', null);

      // 4. Verifica se o método foi chamado
      expect(component.navigateToRegister).toHaveBeenCalled();
      // 5. Verifica se o router foi acionado (integração completa)
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/register']);
    });

    it('should call navigateToLogin when "Fazer Login" button is clicked', () => {
      spyOn(component, 'navigateToLogin').and.callThrough();

      // Encontra o botão secundário (Login)
      const loginBtn = fixture.debugElement.query(By.css('.btn-secondary'));
      
      loginBtn.triggerEventHandler('click', null);

      expect(component.navigateToLogin).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});