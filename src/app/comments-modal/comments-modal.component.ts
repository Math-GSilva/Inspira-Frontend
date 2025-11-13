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
  @Input() obraDeArteId!: string;
  @Output() close = new EventEmitter<void>();

  comments$!: Observable<Comentario[]>;

  constructor(private comentarioService: ComentarioService) {}

  ngOnInit(): void {
    this.comments$ = this.comentarioService.getComentarios(this.obraDeArteId);
  }

  closeModal(): void {
    this.close.emit();
  }
}
