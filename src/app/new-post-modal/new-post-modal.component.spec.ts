import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPostModalComponent } from './new-post-modal.component';
import { HttpClient } from '@angular/common/http';

describe('NewPostModalComponent', () => {
  let component: NewPostModalComponent;
  let fixture: ComponentFixture<NewPostModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPostModalComponent, HttpClient]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewPostModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
