import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { By } from '@angular/platform-browser';

import { HomeComponent } from './home.component';
import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav.component';
import { TimelineFeedComponent } from '../timeline-feed/timeline-feed.component';
import { UserProfileCardComponent } from '../user-profile-card/user-profile-card.component';
import { CategoryFilterComponent } from '../category-filter/category-filter.component';

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
  @Output() categorySelected = new EventEmitter<string | null>();
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent]
    })
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

  it('should initialize selectedCategoryId as null', () => {
    expect(component.selectedCategoryId).toBeNull();
  });

  it('should update selectedCategoryId when onCategoryFilterChange is called', () => {
    component.onCategoryFilterChange('cat-123');
    expect(component.selectedCategoryId).toBe('cat-123');
    
    component.onCategoryFilterChange(null);
    expect(component.selectedCategoryId).toBeNull();
  });

  it('should update state and pass correct ID to Timeline when Filter emits event', () => {
    const filterDebugEl = fixture.debugElement.query(By.directive(MockCategoryFilterComponent));
    const filterComponent = filterDebugEl.componentInstance as MockCategoryFilterComponent;

    filterComponent.categorySelected.emit('categoria-teste-id');
    
    fixture.detectChanges();

    expect(component.selectedCategoryId).toBe('categoria-teste-id');

    const timelineDebugEl = fixture.debugElement.query(By.directive(MockTimelineFeedComponent));
    const timelineComponent = timelineDebugEl.componentInstance as MockTimelineFeedComponent;

    expect(timelineComponent.categoryId).toBe('categoria-teste-id');
  });
});