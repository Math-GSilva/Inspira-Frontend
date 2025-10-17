import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ComentarioService } from '../features/comentarios/comentario.service';
import { Comentario } from '../core/models/comentario.model';

@Component({
  selector: 'app-comments-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comments-modal.component.html',
  styleUrls: ['./comments-modal.component.scss']
})
export class CommentsModalComponent implements OnInit {
  @Input() obraDeArteId!: string; // Recebe o ID da obra do componente pai
  @Output() close = new EventEmitter<void>(); // Emite um evento para se fechar

  comments$!: Observable<Comentario[]>;

  constructor(private comentarioService: ComentarioService) {}

  ngOnInit(): void {
    // Busca os comentários assim que o modal é inicializado
    this.comments$ = this.comentarioService.getComentarios(this.obraDeArteId);
    console.log(this.comments$);
  }

  closeModal(): void {
    this.close.emit();
  }
}
