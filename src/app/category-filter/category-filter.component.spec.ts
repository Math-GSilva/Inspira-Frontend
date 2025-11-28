import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { CategoryFilterComponent } from './category-filter.component';
import { CategoriaService } from '../features/categorias/categoria.service';
import { Categoria } from '../core/models/categoria.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const dummyCategories: Categoria[] = [
  { id: 'cat-1', nome: 'Pintura', descricao: '' },
  { id: 'cat-2', nome: 'Escultura', descricao: '' }
];

const mockCategoriaService = {
  getCategories: jasmine.createSpy('getCategories').and.returnValue(of(dummyCategories)),
  categoriesUpdated$: new Subject<void>() 
};

describe('CategoryFilterComponent', () => {
  let component: CategoryFilterComponent;
  let fixture: ComponentFixture<CategoryFilterComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryFilterComponent, NoopAnimationsModule],
      providers: [
        { provide: CategoriaService, useValue: mockCategoriaService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CategoryFilterComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    
    mockCategoriaService.getCategories.calls.reset();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization and Rendering', () => {

    it('should call getCategories on init', () => {
      expect(mockCategoriaService.getCategories).toHaveBeenCalledTimes(1);
    });

    it('should render all categories + "Todas" button', () => {
      const buttons = compiled.querySelectorAll('.category-btn');
      
      expect(buttons.length).toBe(3);
      expect(buttons[0].textContent).toContain('Todas');
      expect(buttons[1].textContent).toContain('Pintura');
      expect(buttons[2].textContent).toContain('Escultura');
    });

    it('should have "Todas" button active by default', () => {
      expect(component.activeCategoryId).toBeNull();
      
      const activeButton = compiled.querySelector('.category-btn.active');
      expect(activeButton).toBeTruthy();
      expect(activeButton?.textContent).toContain('Todas');
    });
  });

  describe('Method: selectCategory', () => {

    it('should set activeCategoryId and emit categorySelected event', () => {
      spyOn(component.categorySelected, 'emit');
      
      const testId = 'cat-1';
      component.selectCategory(testId);

      expect(component.activeCategoryId).toBe(testId);
      expect(component.categorySelected.emit).toHaveBeenCalledWith(testId);
    });

    it('should emit null when selecting "Todas" (when another category was active)', () => {
      component.activeCategoryId = 'cat-1';

      spyOn(component.categorySelected, 'emit');
      component.selectCategory(null);

      expect(component.activeCategoryId).toBeNull();
      expect(component.categorySelected.emit).toHaveBeenCalledWith(null);
    });

    it('should NOT emit event if the same category is selected twice (Branch Test)', () => {
      const testId = 'cat-1';
      
      component.selectCategory(testId);
      
      spyOn(component.categorySelected, 'emit');
      
      component.selectCategory(testId);
      
      expect(component.categorySelected.emit).not.toHaveBeenCalled();
    });
  });

  describe('HTML User Interaction (Clicks)', () => {

    it('should call selectCategory(null) when "Todas" button is clicked', () => {
      spyOn(component, 'selectCategory');
      
      const todasButton = compiled.querySelector('.category-btn') as HTMLButtonElement;
      todasButton.click();

      expect(component.selectCategory).toHaveBeenCalledWith(null);
    });

    it('should call selectCategory(id) when "Pintura" button is clicked', () => {
      spyOn(component, 'selectCategory');

      const pinturaButton = compiled.querySelectorAll('.category-btn')[1] as HTMLButtonElement;
      pinturaButton.click();

      expect(component.selectCategory).toHaveBeenCalledWith(dummyCategories[0].id);
    });

    it('should update active class in HTML after clicking a category', () => {
      let activeButton = compiled.querySelector('.category-btn.active');
      expect(activeButton?.textContent).toContain('Todas');

      const pinturaButton = compiled.querySelectorAll('.category-btn')[1] as HTMLButtonElement;
      pinturaButton.click();
      
      fixture.detectChanges(); 

      activeButton = compiled.querySelector('.category-btn.active');
      expect(activeButton?.textContent).toContain('Pintura');
    });
  });
});