import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
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
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-timeline-feed',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,     
    CommentsModalComponent,
    RouterLink
  ],
  templateUrl: './timeline-feed.component.html',
  styleUrl: './timeline-feed.component.scss'
})
export class TimelineFeedComponent implements OnInit {
  @Input() categoryId: string | null = "";

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
  // --- 6. Adicionar ngOnChanges para reagir a mudanças no filtro ---
  /**
   * Chamado pelo Angular sempre que um Input (@Input) do componente muda.
   * @param changes Um objeto que contém as propriedades que mudaram.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Verificamos se a propriedade 'categoryId' mudou E se não é a primeira mudança
    // (a primeira mudança acontece durante a inicialização, já tratada pelo ngOnInit)
    if (changes['categoryId'] && !changes['categoryId'].firstChange) {
      this.loadArtworks(); // Recarrega as obras com o novo filtro
    }
  }

  // --- 7. Modificar loadArtworks para usar o categoryId ---
  loadArtworks(): void {
    this.isLoading = true;
    // Passamos o this.categoryId (que pode ser null) para o serviço
    this.obraDeArteService.getAll(this.categoryId) // Assumindo que o serviço foi atualizado (ver Passo 4)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(data => {
        this.artworks = data;
        this.commentForms.clear(); // Limpa formulários antigos
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

