import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

// O modal de comentários que criámos
import { CommentsModalComponent } from '../comments-modal/comments-modal.component';
import { ObraDeArte } from '../core/models/obra-de-arte.model';
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service';
import { CurtidaService } from '../features/curtidas/curtida.service';
import { ComentarioService } from '../features/comentarios/comentario.service';
import { CreateComentarioDto } from '../core/models/comentario.model';

@Component({
  selector: 'app-timeline-feed',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,      // Importar para o formulário de comentário
    CommentsModalComponent    // Importar o novo modal de comentários
  ],
  templateUrl: './timeline-feed.component.html',
  styleUrl: './timeline-feed.component.scss'
})
export class TimelineFeedComponent implements OnInit {
  // Usaremos um array simples para facilitar a manipulação do estado
  artworks: ObraDeArte[] = [];
  isLoading = true;

  // Estado para controlar o modal de comentários
  isCommentsModalOpen = false;
  selectedArtworkIdForModal: string | null = null;
  
  // Um Map para gerir um formulário de comentário separado para cada post
  commentForms = new Map<string, FormGroup>();

  constructor(
    private obraDeArteService: ObraDeArteService,
    private curtidaService: CurtidaService,
    private comentarioService: ComentarioService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadArtworks();
  }

  // Busca os dados e preenche o nosso array local
  loadArtworks(): void {
    this.isLoading = true;
    this.obraDeArteService.getAllObras()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(data => {
        this.artworks = data;
        this.artworks.forEach(art => {
          this.commentForms.set(art.id, this.fb.group({
            texto: ['', Validators.required]
          }));
        });
      });
  }

  toggleLike(artwork: ObraDeArte): void {
    const action = artwork.curtidaPeloUsuario 
      ? this.curtidaService.descurtir(artwork.id)
      : this.curtidaService.curtir(artwork.id);

    action.subscribe(response => {
      console.log(response)
      artwork.totalCurtidas = response.totalCurtidas;
      artwork.curtidaPeloUsuario = response.curtiu;
    });
  }
  
  // Mostra ou esconde a caixa para digitar um novo comentário
  toggleCommentBox(artwork: ObraDeArte): void {
    artwork.showCommentBox = !artwork.showCommentBox;
  }

  // Envia um novo comentário para a API
  submitComment(artwork: ObraDeArte): void {
    const form = this.commentForms.get(artwork.id);
    if (!form || form.invalid) {
      return;
    }

    const dto: CreateComentarioDto = {
      obraDeArteId: artwork.id,
      conteudo: form.get('texto')?.value
    };

    console.log(dto);
    this.comentarioService.criarComentario(dto).subscribe(() => {
      form.reset(); // Limpa o campo de texto
      artwork.showCommentBox = false; // Esconde a caixa de comentário
      // Numa aplicação real, você poderia aqui recarregar os comentários ou adicionar o novo à lista
    });
  }
  
  // Lógica para abrir o modal com todos os comentários
  openCommentsModal(artworkId: string): void {
    this.selectedArtworkIdForModal = artworkId;
    this.isCommentsModalOpen = true;
  }
  
  // Lógica para fechar o modal
  closeCommentsModal(): void {
    this.isCommentsModalOpen = false;
    this.selectedArtworkIdForModal = null;
  }
}

