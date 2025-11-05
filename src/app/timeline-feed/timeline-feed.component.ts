import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

// Importações do Plyr e tipos
import { PlyrModule } from '@atom-platform/ngx-plyr';

// Componentes e Serviços
import { CommentsModalComponent } from '../comments-modal/comments-modal.component';
import { ObraDeArte } from '../core/models/obra-de-arte.model'; 
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service';
import { CurtidaService } from '../features/curtidas/curtida.service';
import { ComentarioService } from '../features/comentarios/comentario.service';
import { CreateComentarioDto } from '../core/models/comentario.model';
import { AuthService } from '../features/auth/auth.service';
import { DecodedToken } from '../features/auth/decoded-token.model';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { EditPostModalComponent } from '../edit-post-modal/edit-post-modal.component';
import { PostStateService } from '../features/obras-de-arte/post-state.service';


// Tipo auxiliar nosso
type CalculatedMediaType = 'imagem' | 'video' | 'audio';

// Interface auxiliar (sem mudanças)
interface ArtworkWithCalculatedMedia extends ObraDeArte {
  calculatedMediaType: CalculatedMediaType;
  plyrSourcesArray: Plyr.Source[];
  plyrMediaTypeValue: Plyr.MediaType;
  isOptionsMenuOpen?: boolean; 
  canEdit: boolean;   // Permissão para editar
  canDelete: boolean; // Permissão para remover
}


@Component({
  selector: 'app-timeline-feed',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommentsModalComponent,
    RouterLink,
    PlyrModule,
    ConfirmationModalComponent,
    EditPostModalComponent
  ],
  templateUrl: './timeline-feed.component.html',
  styleUrl: './timeline-feed.component.scss'
})
export class TimelineFeedComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() categoryId: string | null = "";

  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef;
  private observer!: IntersectionObserver;

  artworks: ArtworkWithCalculatedMedia[] = [];
  isLoading = false;
  isCommentsModalOpen = false;
  selectedArtworkIdForModal: string | null = null;
  commentForms = new Map<string, FormGroup>();

  isConfirmModalOpen = false;
  private artworkToDeleteId: string | null = null;

  isEditModalOpen = false;
  artworkToEdit: ArtworkWithCalculatedMedia | null = null;

  private postStateSubscription?: Subscription;
  private currentUser: DecodedToken | null = null;

  private nextCursor: string | null = null;
  hasMoreItems: boolean = true;
  private readonly PAGE_SIZE = 10;

  constructor(
    private obraDeArteService: ObraDeArteService,
    private curtidaService: CurtidaService,
    private comentarioService: ComentarioService,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private postStateService: PostStateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue; // Guarda o usuário
    this.loadArtworks(true); // <-- Carga inicial
    this.postStateSubscription = this.postStateService.newPost$.subscribe(newPost => {
      this.prependNewArtwork(newPost);
    });
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.postStateSubscription) {
      this.postStateSubscription.unsubscribe();
    }
  }

  private prependNewArtwork(newPost: ObraDeArte): void {
    const isAdmin = this.currentUser?.role === 'Administrador';
    const currentUsername = this.currentUser?.name;
    
    const isOwner = newPost.autorUsername === currentUsername; 
    const calculatedType = this.calculateMediaTypeFromMime(newPost.tipoConteudoMidia);
    const plyrSources = this.calculatePlyrSources(newPost.url, calculatedType, newPost.tipoConteudoMidia);
    const plyrType = this.calculatePlyrMediaType(calculatedType);

    const processedArtwork: ArtworkWithCalculatedMedia = {
      ...newPost, 
      calculatedMediaType: calculatedType,
      plyrSourcesArray: plyrSources,
      plyrMediaTypeValue: plyrType,
      isOptionsMenuOpen: false,             
      canEdit: isOwner,
      canDelete: isOwner || isAdmin
    };
    
    // Adiciona o novo post no INÍCIO (topo) da lista
    this.artworks.unshift(processedArtwork);
    
    // Adiciona o formulário de comentário para o novo post
    this.commentForms.set(processedArtwork.id, this.fb.group({
      texto: ['', Validators.required]
    }));
  }

  private setupIntersectionObserver(): void {
    const options = {
      root: null, // Observa em relação ao viewport
      rootMargin: '0px',
      threshold: 0.1 // Dispara quando 10% do sentinela estiver visível
    };

    this.observer = new IntersectionObserver(([entry]) => {
      // Se o sentinela estiver visível (intersecting) e não estivermos carregando
      if (entry.isIntersecting) {
        this.loadArtworks(); // Carrega mais itens (não é um reset)
      }
    }, options);

    // Começa a observar o elemento sentinela
    this.observer.observe(this.scrollSentinel.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryId'] && !changes['categoryId'].firstChange) {
      this.loadArtworks(true);
    }
  }

  loadArtworks(isRefresh: boolean = false): void {
    if (this.isLoading || (!this.hasMoreItems && !isRefresh)) {
      return;
    }

    this.isLoading = true;

    // 2. Se for um "refresh" (nova categoria ou carga inicial), reseta o estado.
    if (isRefresh) {
      this.nextCursor = null;
      this.hasMoreItems = true;
      this.artworks = []; // Limpa o array
      this.commentForms.clear();
    }

    const currentUser: DecodedToken | null = this.authService.currentUserValue;
    const isAdmin = currentUser?.role === 'Administrador';
    const currentUsername = currentUser?.name; 

    this.obraDeArteService.getAll(this.categoryId, null, this.nextCursor, this.PAGE_SIZE)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(response => { 
        this.nextCursor = response.nextCursor;
        this.hasMoreItems = response.hasMoreItems;

        const newArtworks = response.items.map(art => {
          const isOwner = art.autorUsername === currentUsername; 
          const calculatedType = this.calculateMediaTypeFromMime(art.tipoConteudoMidia);
          const plyrSources = this.calculatePlyrSources(art.url, calculatedType, art.tipoConteudoMidia);
          const plyrType = this.calculatePlyrMediaType(calculatedType);

          return {
            ...art, 
            calculatedMediaType: calculatedType,
            plyrSourcesArray: plyrSources,
            plyrMediaTypeValue: plyrType,
            isOptionsMenuOpen: false,             
            canEdit: isOwner,
            canDelete: isOwner || isAdmin
          };
        });

        // 6. Anexa os novos itens à lista (em vez de substituir)
        this.artworks.push(...newArtworks);

        // 7. Configura os formulários de comentário para os novos itens
        newArtworks.forEach(art => {
          this.commentForms.set(art.id, this.fb.group({
            texto: ['', Validators.required]
          }));
        });
      });
  }

  // --- Funções auxiliares de mídia (sem mudanças) ---
  private calculateMediaTypeFromMime(mimeType?: string): CalculatedMediaType {
    if (!mimeType) return 'imagem';
    const type = mimeType.split('/')[0].toLowerCase();
    if (type === 'video') return 'video';
    if (type === 'audio') return 'audio';
    return 'imagem';
  }

  private calculatePlyrSources(url: string | undefined, calculatedType: CalculatedMediaType, mimeType?: string): Plyr.Source[] {
    if (!url || calculatedType === 'imagem') {
      return [];
    }
    const source: Plyr.Source = { src: url };
    if (mimeType) {
      source.type = mimeType; 
    }
    return [source];
  }

  private calculatePlyrMediaType(calculatedType: CalculatedMediaType): Plyr.MediaType {
    if (calculatedType === 'video') return 'video';
    return 'audio'; 
  }


  // --- Funções de interação (sem mudanças) ---
  toggleLike(artwork: ObraDeArte): void { 
    const action = artwork.curtidaPeloUsuario
      ? this.curtidaService.descurtir(artwork.id)
      : this.curtidaService.curtir(artwork.id);

    action.subscribe(response => {
      const artToUpdate = this.artworks.find(a => a.id === artwork.id);
      if (artToUpdate) {
        artToUpdate.totalCurtidas = response.totalCurtidas;
        artToUpdate.curtidaPeloUsuario = response.curtiu;
      }
    });
  }

  toggleCommentBox(artwork: ObraDeArte): void { 
     const artToUpdate = this.artworks.find(a => a.id === artwork.id);
      if (artToUpdate) {
        artToUpdate.showCommentBox = !artToUpdate.showCommentBox;
      }
  }

  submitComment(artwork: ObraDeArte): void { 
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
  
  // --- Funções do menu de opções (sem mudanças) ---
  toggleOptionsMenu(artwork: ArtworkWithCalculatedMedia): void {
    const currentState = artwork.isOptionsMenuOpen;
    this.artworks.forEach(a => a.isOptionsMenuOpen = false);
    artwork.isOptionsMenuOpen = !currentState;
  }

  onEditPost(artwork: ArtworkWithCalculatedMedia): void {
  this.artworkToEdit = artwork;
  this.isEditModalOpen = true;
  artwork.isOptionsMenuOpen = false; // Fecha o menu de 3 pontinhos
}

  onDeletePost(artwork: ArtworkWithCalculatedMedia): void {
    // 1. Guarda o ID do post que o usuário quer deletar
    this.artworkToDeleteId = artwork.id;
    
    // 2. Abre o modal de confirmação
    this.isConfirmModalOpen = true;
    
    // 3. Fecha o menu de 3 pontinhos
    artwork.isOptionsMenuOpen = false; 
  }

  handleConfirmDelete(): void {
    if (!this.artworkToDeleteId) return; // Segurança, caso o ID não esteja definido

    const idToDelete = this.artworkToDeleteId;

    // Fecha o modal e limpa o ID
    this.handleCloseConfirmModal();

    // Chama o serviço para deletar
    this.obraDeArteService.deleteObra(idToDelete).subscribe({
      next: () => {
        this.artworks = this.artworks.filter(a => a.id !== idToDelete);
      },
      error: (err) => {
        // Erro: Informa o usuário
        console.error('Erro ao remover o post', err);
        alert('Não foi possível remover o post. Tente novamente mais tarde.');
      }
    });
  }

  handleCloseConfirmModal(): void {
    this.isConfirmModalOpen = false;
    this.artworkToDeleteId = null;
  }

  handleUpdateSuccess(updatedArtwork: ObraDeArte): void {
  const index = this.artworks.findIndex(a => a.id === updatedArtwork.id);
  if (index !== -1) {
    this.artworks[index].titulo = updatedArtwork.titulo;
    this.artworks[index].descricao = updatedArtwork.descricao;
  }
  this.isEditModalOpen = false; // Fecha o modal
}
}