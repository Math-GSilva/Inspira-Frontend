import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { LandingPageComponent } from './landing-page.component';

fdescribe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [
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

  describe('Navigation Logic', () => {

    it('should navigate to register page when navigateToRegister is called', () => {
      component.navigateToRegister();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/register']);
    });

    it('should navigate to login page when navigateToLogin is called', () => {
      component.navigateToLogin();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('User Interaction (Button Clicks)', () => {

    it('should call navigateToRegister when "Criar Conta" button is clicked', () => {
      spyOn(component, 'navigateToRegister').and.callThrough();

      const registerBtn = fixture.debugElement.query(By.css('.btn-primary'));
      
      registerBtn.triggerEventHandler('click', null);

      expect(component.navigateToRegister).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/register']);
    });

    it('should call navigateToLogin when "Fazer Login" button is clicked', () => {
      spyOn(component, 'navigateToLogin').and.callThrough();

      const loginBtn = fixture.debugElement.query(By.css('.btn-secondary'));
      
      loginBtn.triggerEventHandler('click', null);

      expect(component.navigateToLogin).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});