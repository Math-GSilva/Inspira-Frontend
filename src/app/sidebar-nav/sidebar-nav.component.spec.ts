import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { Component, EventEmitter, Output } from '@angular/core';

import { SidebarNavComponent } from './sidebar-nav.component';
import { AuthService } from '../features/auth/auth.service';

import { NewPostModalComponent } from '../new-post-modal/new-post-modal.component';
import { SearchComponent } from '../search/search.component';
import { AddCategoryModalComponent } from '../add-category-modal/add-category-modal.component';
import { DecodedToken } from '../features/auth/decoded-token.model';

@Component({ selector: 'app-new-post-modal', standalone: true, template: '' })
class MockNewPostModalComponent { @Output() close = new EventEmitter<void>(); }

@Component({ selector: 'app-search', standalone: true, template: '' })
class MockSearchComponent { @Output() close = new EventEmitter<void>(); }

@Component({ selector: 'app-add-category-modal', standalone: true, template: '' })
class MockAddCategoryModalComponent { @Output() close = new EventEmitter<void>(); }

const mockUserAdmin: DecodedToken = { 
  sub: '1', name: 'Admin', email: 'admin@test.com', role: 'Administrador', exp: 123, urlPerfil: '' 
};
const mockUserArtist: DecodedToken = { 
  sub: '2', name: 'Artist', email: 'art@test.com', role: 'Artista', exp: 123, urlPerfil: '' 
};
const mockUserCommon: DecodedToken = { 
  sub: '3', name: 'Common', email: 'comum@test.com', role: 'Comum', exp: 123, urlPerfil: '' 
};

const currentUserSubject = new BehaviorSubject<DecodedToken | null>(null);
const mockAuthService = {
  currentUser$: currentUserSubject.asObservable()
};

fdescribe('SidebarNavComponent', () => {
  let component: SidebarNavComponent;
  let fixture: ComponentFixture<SidebarNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SidebarNavComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
    .overrideComponent(SidebarNavComponent, {
      remove: { 
        imports: [
          NewPostModalComponent, 
          SearchComponent, 
          AddCategoryModalComponent
        ] 
      },
      add: { 
        imports: [
          MockNewPostModalComponent, 
          MockSearchComponent, 
          MockAddCategoryModalComponent
        ] 
      }
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SidebarNavComponent);
    component = fixture.componentInstance;
    
    currentUserSubject.next(null);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Navigation Links', () => {
    it('should render "Início" link', () => {
      const links = fixture.debugElement.queryAll(By.css('ul li a'));
      const homeLink = links.find(el => el.nativeElement.textContent.includes('Início'));
      expect(homeLink).toBeTruthy();
      expect(homeLink?.attributes['ng-reflect-router-link']).toBe('/home');
    });

    it('should render "Pesquisar" link and open modal on click', () => {
      const links = fixture.debugElement.queryAll(By.css('ul li a'));
      const searchLink = links.find(el => el.nativeElement.textContent.includes('Pesquisar'));
      expect(searchLink).toBeTruthy();

      searchLink?.triggerEventHandler('click', null);
      expect(component.isSearchModalOpen).toBeTrue();
    });
  });

  describe('Permissions & Buttons', () => {
    it('should NOT show buttons for Common user', () => {
      currentUserSubject.next(mockUserCommon);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.btn-new-post'))).toBeNull();
      expect(fixture.debugElement.query(By.css('.btn-admin-action'))).toBeNull();
    });

    it('should show "Publicar Nova Obra" for Artist', () => {
      currentUserSubject.next(mockUserArtist);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.btn-new-post'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.btn-admin-action'))).toBeNull();
    });

    it('should show BOTH buttons for Administrator', () => {
      currentUserSubject.next(mockUserAdmin);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.btn-new-post'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.btn-admin-action'))).toBeTruthy();
    });
  });

  describe('Modals Interaction', () => {
    it('should toggle New Post Modal', () => {
      component.openNewPostModal();
      expect(component.isNewPostModalOpen).toBeTrue();
      component.closeNewPostModal();
      expect(component.isNewPostModalOpen).toBeFalse();
    });

    it('should toggle Search Modal', () => {
      component.openSearchModal();
      expect(component.isSearchModalOpen).toBeTrue();
      component.closeSearchModal();
      expect(component.isSearchModalOpen).toBeFalse();
    });

    it('should toggle Add Category Modal', () => {
      component.openAddCategoryModal();
      expect(component.isAddCategoryModalOpen).toBeTrue();
      component.closeAddCategoryModal();
      expect(component.isAddCategoryModalOpen).toBeFalse();
    });
  });

  describe('Template Integration (Child Components)', () => {
    
    it('should display <app-new-post-modal> when open', () => {
      component.isNewPostModalOpen = true;
      fixture.detectChanges();
      
      const modal = fixture.debugElement.query(By.css('app-new-post-modal'));
      expect(modal).toBeTruthy();
    });

    it('should close New Post Modal when child emits close event', () => {
      component.isNewPostModalOpen = true;
      fixture.detectChanges();

      const modalDebugEl = fixture.debugElement.query(By.directive(MockNewPostModalComponent));
      const modalComponent = modalDebugEl.componentInstance as MockNewPostModalComponent;

      modalComponent.close.emit();
      
      expect(component.isNewPostModalOpen).toBeFalse();
    });
  });
});