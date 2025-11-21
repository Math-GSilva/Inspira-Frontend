import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ConfirmationModalComponent } from './confirmation-modal.component';

describe('ConfirmationModalComponent', () => {
  let component: ConfirmationModalComponent;
  let fixture: ComponentFixture<ConfirmationModalComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationModalComponent] 
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfirmationModalComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  
  describe('Visibility (isOpen)', () => {
    
    it('should NOT render modal content when isOpen is false (default)', () => {
      const overlay = compiled.querySelector('.modal-overlay');
      expect(overlay).toBeNull(); 
    });

    it('should render modal content when isOpen is true', () => {
      component.isOpen = true;
      fixture.detectChanges(); 

      const overlay = compiled.querySelector('.modal-overlay');
      const container = compiled.querySelector('.modal-container');
      
      expect(overlay).toBeTruthy();
      expect(container).toBeTruthy();
    });
  });

  
  describe('Inputs and Content Binding', () => {
    
    beforeEach(() => {
      
      component.isOpen = true;
      fixture.detectChanges();
    });

    it('should display correct title and message', () => {
      component.title = 'Título de Teste';
      component.message = 'Mensagem de perigo';
      fixture.detectChanges();

      const header = compiled.querySelector('.modal-header h2');
      const body = compiled.querySelector('.modal-body p');

      expect(header?.textContent).toContain('Título de Teste');
      expect(body?.textContent).toContain('Mensagem de perigo');
    });

    it('should display correct button texts', () => {
      component.confirmButtonText = 'Sim, deletar';
      component.cancelButtonText = 'Não, voltar';
      fixture.detectChanges();

      const confirmBtn = compiled.querySelector('.modal-footer .btn:not(.btn-secondary)');
      const cancelBtn = compiled.querySelector('.modal-footer .btn-secondary');

      expect(confirmBtn?.textContent).toContain('Sim, deletar');
      expect(cancelBtn?.textContent).toContain('Não, voltar');
    });
  });

  
  describe('Styling Logic', () => {
    
    beforeEach(() => {
      component.isOpen = true;
    });

    it('should apply "btn-primary" class by default or when set explicitly', () => {
      component.confirmButtonClass = 'primary';
      fixture.detectChanges();

      
      const confirmBtn = fixture.debugElement.queryAll(By.css('button'))[2].nativeElement;
      
      expect(confirmBtn.classList).toContain('btn-primary');
      expect(confirmBtn.classList).not.toContain('btn-danger');
    });

    it('should apply "btn-danger" class when confirmButtonClass is "danger"', () => {
      component.confirmButtonClass = 'danger';
      fixture.detectChanges();

      const confirmBtn = fixture.debugElement.queryAll(By.css('button'))[2].nativeElement;
      
      expect(confirmBtn.classList).toContain('btn-danger');
      expect(confirmBtn.classList).not.toContain('btn-primary');
    });
  });

  
  describe('User Interactions (Outputs)', () => {
    
    beforeEach(() => {
      component.isOpen = true;
      fixture.detectChanges();
    });

    it('should emit "confirm" event when confirm button is clicked', () => {
      spyOn(component.confirm, 'emit');
      
      
      const confirmBtn = compiled.querySelector('.modal-footer .btn:not(.btn-secondary)') as HTMLButtonElement;
      confirmBtn.click();

      expect(component.confirm.emit).toHaveBeenCalled();
    });

    it('should emit "close" event when cancel button is clicked', () => {
      spyOn(component.closeRequest, 'emit');
      
      const cancelBtn = compiled.querySelector('.btn-secondary') as HTMLButtonElement;
      cancelBtn.click();

      expect(component.closeRequest.emit).toHaveBeenCalled();
    });

    it('should emit "close" event when "X" button is clicked', () => {
      spyOn(component.closeRequest, 'emit');
      
      const closeIconBtn = compiled.querySelector('.close-btn') as HTMLButtonElement;
      closeIconBtn.click();

      expect(component.closeRequest.emit).toHaveBeenCalled();
    });
  });

  
  describe('Overlay vs Content Click Logic', () => {
    
    beforeEach(() => {
      component.isOpen = true;
      fixture.detectChanges();
    });

    it('should emit "close" when clicking specifically on the overlay (background)', () => {
      spyOn(component, 'onClose'); 
      
      const overlay = compiled.querySelector('.modal-overlay') as HTMLElement;
      
      
      const event = new MouseEvent('mousedown', { bubbles: true });
      overlay.dispatchEvent(event);

      expect(component.onClose).toHaveBeenCalled();
    });

    it('should NOT emit "close" when clicking inside the modal container', () => {
      spyOn(component, 'onClose');
      
      const container = compiled.querySelector('.modal-container') as HTMLElement;
      
      
      const event = new MouseEvent('mousedown', { bubbles: true });
      container.dispatchEvent(event);

      
      
      expect(component.onClose).not.toHaveBeenCalled();
    });
  });
});
