import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { By } from '@angular/platform-browser';

import { HomeComponent } from './home.component';
import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav.component';
import { TimelineFeedComponent } from '../timeline-feed/timeline-feed.component';
import { UserProfileCardComponent } from '../user-profile-card/user-profile-card.component';
import { CategoryFilterComponent } from '../category-filter/category-filter.component';

// --- 1. Mocks dos Componentes Filhos ---
// Criamos versões "falsas" e leves dos componentes para não precisar de HttpClient ou Serviços

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  template: '<div>Mock Sidebar</div>'
})
class MockSidebarNavComponent {}

@Component({
  selector: 'app-timeline-feed',
  standalone: true,
  template: '<div>Mock Timeline</div>'
})
class MockTimelineFeedComponent {
  // Precisamos simular o Input para testar se o Home está passando o dado
  @Input() categoryId: string | null = null;
}

@Component({
  selector: 'app-user-profile-card',
  standalone: true,
  template: '<div>Mock Profile</div>'
})
class MockUserProfileCardComponent {}

@Component({
  selector: 'app-category-filter',
  standalone: true,
  template: '<div>Mock Filter</div>'
})
class MockCategoryFilterComponent {
  // Precisamos simular o Output para testar o evento de clique
  @Output() categorySelected = new EventEmitter<string | null>();
}

fdescribe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent] // Importa o componente real
    })
    // AQUI ESTÁ O TRUQUE:
    // Substituímos os componentes reais pelos Mocks na configuração do teste.
    // Isso evita erros de "No provider for HttpClient" vindos dos filhos.
    .overrideComponent(HomeComponent, {
      remove: { 
        imports: [
          SidebarNavComponent, 
          TimelineFeedComponent, 
          UserProfileCardComponent, 
          CategoryFilterComponent
        ] 
      },
      add: { 
        imports: [
          MockSidebarNavComponent, 
          MockTimelineFeedComponent, 
          MockUserProfileCardComponent, 
          MockCategoryFilterComponent
        ] 
      }
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Teste de Lógica Simples ---
  it('should initialize selectedCategoryId as null', () => {
    expect(component.selectedCategoryId).toBeNull();
  });

  it('should update selectedCategoryId when onCategoryFilterChange is called', () => {
    component.onCategoryFilterChange('cat-123');
    expect(component.selectedCategoryId).toBe('cat-123');
    
    component.onCategoryFilterChange(null);
    expect(component.selectedCategoryId).toBeNull();
  });

  // --- Teste de Integração do Template (Comunicação entre Componentes) ---
  it('should update state and pass correct ID to Timeline when Filter emits event', () => {
    // 1. Localiza o componente de Filtro (Mock) no HTML
    const filterDebugEl = fixture.debugElement.query(By.directive(MockCategoryFilterComponent));
    const filterComponent = filterDebugEl.componentInstance as MockCategoryFilterComponent;

    // 2. Simula o Filtro emitindo uma categoria
    filterComponent.categorySelected.emit('categoria-teste-id');
    
    // 3. Atualiza o HTML
    fixture.detectChanges();

    // 4. Verifica se a variável do Home mudou
    expect(component.selectedCategoryId).toBe('categoria-teste-id');

    // 5. Localiza o componente de Timeline (Mock) no HTML
    const timelineDebugEl = fixture.debugElement.query(By.directive(MockTimelineFeedComponent));
    const timelineComponent = timelineDebugEl.componentInstance as MockTimelineFeedComponent;

    // 6. Verifica se a Timeline recebeu o ID correto via @Input
    expect(timelineComponent.categoryId).toBe('categoria-teste-id');
  });
});