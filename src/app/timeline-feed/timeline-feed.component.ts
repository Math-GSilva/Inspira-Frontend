import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import { PlyrModule } from '@atom-platform/ngx-plyr';

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

type CalculatedMediaType = 'imagem' | 'video' | 'audio';

interface ArtworkWithCalculatedMedia extends ObraDeArte {
  calculatedMediaType: CalculatedMediaType;
  plyrSourcesArray: Plyr.Source[];
  plyrMediaTypeValue: Plyr.MediaType;
  isOptionsMenuOpen?: boolean;
  canEdit: boolean;
  canDelete: boolean;
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

  playerOptions = {
    controls: [
      'play-large', 
      'play', 
      'progress', 
      'current-time', 
      'mute', 
      'volume', 
      'settings',
      'fullscreen'
    ],
    settings: ['speed'], 
    speed: { 
      selected: 1,
      options: [0.5, 0.75, 1, 1.25, 1.5, 2]
    }
  };

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
    this.currentUser = this.authService.currentUserValue;
    this.loadArtworks(true);
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
    
    this.artworks.unshift(processedArtwork);
    
    this.commentForms.set(processedArtwork.id, this.fb.group({
      texto: ['', Validators.required]
    }));
  }

  private setupIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.loadArtworks();
      }
    }, options);
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

    if (isRefresh) {
      this.nextCursor = null;
      this.hasMoreItems = true;
      this.commentForms.clear();
      this.artworks = [];
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

        this.artworks.push(...newArtworks);

        newArtworks.forEach(art => {
          this.commentForms.set(art.id, this.fb.group({
            texto: ['', Validators.required]
          }));
        });
      });
  }

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
  
  toggleOptionsMenu(artwork: ArtworkWithCalculatedMedia): void {
    const currentState = artwork.isOptionsMenuOpen;
    this.artworks.forEach(a => a.isOptionsMenuOpen = false);
    artwork.isOptionsMenuOpen = !currentState;
  }

  onEditPost(artwork: ArtworkWithCalculatedMedia): void {
  this.artworkToEdit = artwork;
  this.isEditModalOpen = true;
  artwork.isOptionsMenuOpen = false;
}

  onDeletePost(artwork: ArtworkWithCalculatedMedia): void {
    this.artworkToDeleteId = artwork.id;
    this.isConfirmModalOpen = true;
    artwork.isOptionsMenuOpen = false; 
  }

  handleConfirmDelete(): void {
    if (!this.artworkToDeleteId) return;

    const idToDelete = this.artworkToDeleteId;

    this.handleCloseConfirmModal();

    this.obraDeArteService.deleteObra(idToDelete).subscribe({
      next: () => {
        this.artworks = this.artworks.filter(a => a.id !== idToDelete);
      },
      error: (err) => {
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
  this.isEditModalOpen = false;
}
}