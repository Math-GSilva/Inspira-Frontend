import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent {
  // --- Entradas (Inputs) ---
  @Input() isOpen = false;
  @Input() title = 'Confirmar Ação';
  @Input() message = 'Você tem certeza?';
  @Input() confirmButtonText = 'Confirmar';
  @Input() cancelButtonText = 'Cancelar';
  
  /**
   * Define o estilo do botão de confirmação.
   * 'primary' (azul) ou 'danger' (vermelho).
   */
  @Input() confirmButtonClass: 'primary' | 'danger' = 'primary';

  // --- Saídas (Outputs) ---
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  /**
   * Emitido quando o usuário clica no botão de confirmação.
   */
  onConfirm(): void {
    this.confirm.emit();
  }

  /**
   * Emitido quando o usuário clica em "Cancelar", no 'X' ou no overlay.
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Permite fechar o modal ao clicar no fundo (overlay).
   */
  onOverlayClick(event: MouseEvent): void {
    // Garante que o clique foi no overlay e não no conteúdo do modal
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }
}