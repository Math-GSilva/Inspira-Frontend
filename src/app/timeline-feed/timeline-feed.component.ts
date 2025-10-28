import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';

// Importações do Plyr e tipos
import { PlyrModule } from '@atom-platform/ngx-plyr';

// Componentes e Serviços
import { CommentsModalComponent } from '../comments-modal/comments-modal.component';
import { ObraDeArte } from '../core/models/obra-de-arte.model'; // Com TipoConteudoMidia
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service';
import { CurtidaService } from '../features/curtidas/curtida.service';
import { ComentarioService } from '../features/comentarios/comentario.service';
import { CreateComentarioDto } from '../core/models/comentario.model';

// Tipo auxiliar nosso
type CalculatedMediaType = 'imagem' | 'video' | 'audio';

// --- NOVA INTERFACE AUXILIAR ---
// Estende ObraDeArte com as propriedades calculadas
interface ArtworkWithCalculatedMedia extends ObraDeArte {
  calculatedMediaType: CalculatedMediaType;
  plyrSourcesArray: Plyr.Source[];
  plyrMediaTypeValue: Plyr.MediaType;
}


@Component({
  selector: 'app-timeline-feed',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommentsModalComponent,
    RouterLink,
    PlyrModule
  ],
  templateUrl: './timeline-feed.component.html',
  styleUrl: './timeline-feed.component.scss'
})
export class TimelineFeedComponent implements OnInit {
  @Input() categoryId: string | null = "";

  // --- MUDANÇA AQUI ---
  // Usamos a nova interface que inclui as propriedades calculadas
  artworks: ArtworkWithCalculatedMedia[] = [];
  isLoading = true;
  isCommentsModalOpen = false;
  selectedArtworkIdForModal: string | null = null;
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryId'] && !changes['categoryId'].firstChange) {
      this.loadArtworks();
    }
  }

  loadArtworks(): void {
    this.isLoading = true;
    this.obraDeArteService.getAll(this.categoryId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(data => {
        // --- MUDANÇA PRINCIPAL AQUI ---
        // Calculamos TUDO dentro do map e armazenamos no objeto
        this.artworks = data.map(art => {
          const calculatedType = this.calculateMediaTypeFromMime(art.tipoConteudoMidia);
          const plyrSources = this.calculatePlyrSources(art.url, calculatedType, art.tipoConteudoMidia);
          const plyrType = this.calculatePlyrMediaType(calculatedType);

          return {
            ...art, // Copia propriedades originais
            calculatedMediaType: calculatedType,
            plyrSourcesArray: plyrSources,
            plyrMediaTypeValue: plyrType
          };
        });

        this.commentForms.clear();
        this.artworks.forEach(art => {
          this.commentForms.set(art.id, this.fb.group({
            texto: ['', Validators.required]
          }));
        });
      });
  }

  // --- RENOMEADO --- Função pura para calcular o tipo interno
  private calculateMediaTypeFromMime(mimeType?: string): CalculatedMediaType {
    if (!mimeType) return 'imagem';
    const type = mimeType.split('/')[0].toLowerCase();
    if (type === 'video') return 'video';
    if (type === 'audio') return 'audio';
    return 'imagem';
  }

  // --- NOVA FUNÇÃO --- Função pura para calcular as sources do Plyr
  private calculatePlyrSources(url: string | undefined, calculatedType: CalculatedMediaType, mimeType?: string): Plyr.Source[] {
    if (!url || calculatedType === 'imagem') {
      return [];
    }
    const source: Plyr.Source = { src: url };
    if (mimeType) {
      source.type = mimeType; // Adiciona o MIME type se disponível
    }
    return [source];
  }

  // --- NOVA FUNÇÃO --- Função pura para calcular o tipo do Plyr
  private calculatePlyrMediaType(calculatedType: CalculatedMediaType): Plyr.MediaType {
    if (calculatedType === 'video') return 'video';
    // Se não for imagem (já tratado no calculatePlyrSources), só pode ser audio
    // Ou definimos um padrão seguro caso precise (ex: video)
    return 'audio'; // Padrão se não for vídeo (já filtramos imagem antes)
  }


  // Funções de interação (toggleLike, etc.) não precisam mudar
  toggleLike(artwork: ObraDeArte): void { // Pode usar ObraDeArte aqui ainda
    const action = artwork.curtidaPeloUsuario
      ? this.curtidaService.descurtir(artwork.id)
      : this.curtidaService.curtir(artwork.id);

    action.subscribe(response => {
      // É importante atualizar o objeto no array this.artworks se a referência importar
      const artToUpdate = this.artworks.find(a => a.id === artwork.id);
      if (artToUpdate) {
        artToUpdate.totalCurtidas = response.totalCurtidas;
        artToUpdate.curtidaPeloUsuario = response.curtiu;
      }
    });
  }

  toggleCommentBox(artwork: ObraDeArte): void { // Pode usar ObraDeArte aqui ainda
    // É importante atualizar o objeto no array this.artworks se a referência importar
     const artToUpdate = this.artworks.find(a => a.id === artwork.id);
      if (artToUpdate) {
        artToUpdate.showCommentBox = !artToUpdate.showCommentBox;
      }
  }

  submitComment(artwork: ObraDeArte): void { // Pode usar ObraDeArte aqui ainda
    const form = this.commentForms.get(artwork.id);
    if (!form || form.invalid) {
      return;
    }

    const dto: CreateComentarioDto = {
      obraDeArteId: artwork.id,
      conteudo: form.get('texto')?.value
    };

    this.comentarioService.criarComentario(dto).subscribe(() => {
      form.reset();
      // É importante atualizar o objeto no array this.artworks se a referência importar
      const artToUpdate = this.artworks.find(a => a.id === artwork.id);
      if (artToUpdate) {
         artToUpdate.showCommentBox = false;
      }
    });
  }

  openCommentsModal(artworkId: string): void {
    this.selectedArtworkIdForModal = artworkId;
    this.isCommentsModalOpen = true;
  }

  closeCommentsModal(): void {
    this.isCommentsModalOpen = false;
    this.selectedArtworkIdForModal = null;
  }
}