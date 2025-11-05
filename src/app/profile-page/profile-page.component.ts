import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { switchMap, map, finalize } from 'rxjs/operators';
import { PlyrModule } from '@atom-platform/ngx-plyr';
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service';
import { AuthService } from '../features/auth/auth.service';
import { UsuarioService } from '../features/usuarios-search/usuario.service';
import { CurtidaService } from '../features/curtidas/curtida.service'; // Importado
import { ComentarioService } from '../features/comentarios/comentario.service'; // Importado
import { ObraDeArte } from '../core/models/obra-de-arte.model';
import { UsuarioProfile } from '../core/models/usuario-profile.model';
import { CreateComentarioDto } from '../core/models/comentario.model'; // Importado
import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav.component';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';
import { CommentsModalComponent } from '../comments-modal/comments-modal.component'; // Importado

type CalculatedMediaType = 'imagem' | 'video' | 'audio';

interface ArtworkWithCalculatedMedia extends ObraDeArte {
  calculatedMediaType: CalculatedMediaType;
  plyrSourcesArray: Plyr.Source[];
  plyrMediaTypeValue: Plyr.MediaType;
}

interface ProfileData {
  profile: UsuarioProfile;
  artworks: ArtworkWithCalculatedMedia[];
  isMyProfile: boolean;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SidebarNavComponent,
    EditProfileModalComponent,
    ReactiveFormsModule, // Adicionado
    PlyrModule,          // Adicionado
    CommentsModalComponent // Adicionado
  ],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit {
  profileData$!: Observable<ProfileData>;
  isLoading = true;
  isEditModalOpen = false;

  // --- Lógica de Comentários (copiado do timeline-feed) ---
  commentForms = new Map<string, FormGroup>();
  isCommentsModalOpen = false;
  selectedArtworkIdForModal: string | null = null;
  // --------------------------------------------------------

  currentUserRole: string | null = null;


  constructor(
    private route: ActivatedRoute,
    private usuarioService: UsuarioService,
    private obraDeArteService: ObraDeArteService,
    private authService: AuthService,
    // --- Serviços Injetados (copiado do timeline-feed) ---
    private curtidaService: CurtidaService,
    private comentarioService: ComentarioService,
    private fb: FormBuilder
    // -----------------------------------------------------
  ) {}

  ngOnInit(): void {
    this.profileData$ = this.route.paramMap.pipe(
      switchMap(params => {
        const username = params.get('username');
        if (!username) {
          throw new Error('Username não encontrado na rota.');
        }

        this.isLoading = true;
        this.commentForms.clear(); 

        // 2. ATUALIZADO: Busca o objeto currentUser COMPLETO
        const profile$ = this.usuarioService.getProfile(username);
        const currentUser$ = this.authService.currentUser$; // <-- MUDANÇA (era .pipe(map...)) [cite: 17, line 85]

        return profile$.pipe(
          switchMap(profile => {

            const artworks$ = this.obraDeArteService.getAllByUser(profile.id);

            // 3. ATUALIZADO: Combina com o objeto currentUser completo
            return combineLatest([artworks$, currentUser$]).pipe( // <-- MUDANÇA (era myUsername$) [cite: 17, line 90]
              map(([profileArtworks, currentUser]) => { // <-- MUDANÇA (era myUsername) [cite: 17, line 91]
                
                const calculatedArtworks = profileArtworks.map(art => {
                  // ... (lógica de 'calculatedArtworks') ... [cite: 17, lines 94-114]
                  const calculatedType = this.calculateMediaTypeFromMime(art.tipoConteudoMidia);
                  const plyrSources = this.calculatePlyrSources(art.url, calculatedType, art.tipoConteudoMidia);
                  const plyrType = this.calculatePlyrMediaType(calculatedType);

                  this.commentForms.set(art.id, this.fb.group({
                    texto: ['', Validators.required]
                  }));

                  return {
                    ...art,
                    calculatedMediaType: calculatedType,
                    plyrSourcesArray: plyrSources,
                    plyrMediaTypeValue: plyrType
                  };
                });
                
                this.isLoading = false;
                
                this.currentUserRole = currentUser?.role || null;
                
                return {
                  profile, 
                  artworks: calculatedArtworks,
                  // 5. ATUALIZADO: Compara com o 'nameid' do usuário
                  isMyProfile: profile.username === currentUser?.name
                };
              })
            );
          })
        );
      })
    );
  }

  // --- Métodos de Cálculo de Mídia (copiado do timeline-feed) ---
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
  // ----------------------------------------------------------------

  // --- Métodos de Interação (copiado do timeline-feed) ---
  toggleLike(artwork: ArtworkWithCalculatedMedia): void {
    const action = artwork.curtidaPeloUsuario
      ? this.curtidaService.descurtir(artwork.id)
      : this.curtidaService.curtir(artwork.id);

    // Atualiza a UI otimistamente (opcional, mas bom)
    artwork.curtidaPeloUsuario = !artwork.curtidaPeloUsuario;
    artwork.totalCurtidas += artwork.curtidaPeloUsuario ? 1 : -1;

    action.subscribe({
      next: response => {
        // Confirma a atualização com dados do backend
        artwork.totalCurtidas = response.totalCurtidas;
        artwork.curtidaPeloUsuario = response.curtiu;
      },
      error: () => {
         // Reverte em caso de erro
         artwork.curtidaPeloUsuario = !artwork.curtidaPeloUsuario;
         artwork.totalCurtidas += artwork.curtidaPeloUsuario ? 1 : -1;
      }
    });
  }

  toggleCommentBox(artwork: ArtworkWithCalculatedMedia): void {
    artwork.showCommentBox = !artwork.showCommentBox;
  }

  submitComment(artwork: ArtworkWithCalculatedMedia): void {
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
      artwork.showCommentBox = false;
      // Idealmente, você também incrementaria a contagem de comentários aqui
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
  // --------------------------------------------------------------

  // --- Métodos de Seguir/Modal (já existentes) ---
  toggleFollow(data: ProfileData): void {
    // ... (lógica original do toggleFollow) ...
     const originalProfile = { ...data.profile };
     data.profile.seguidoPeloUsuarioAtual = !data.profile.seguidoPeloUsuarioAtual;
     data.profile.contagemSeguidores += data.profile.seguidoPeloUsuarioAtual ? 1 : -1;
     const action$ = originalProfile.seguidoPeloUsuarioAtual
       ? this.usuarioService.unfollowUser(originalProfile.id)
       : this.usuarioService.followUser(originalProfile.id);
     action$.subscribe({
       error: () => {
         data.profile.seguidoPeloUsuarioAtual = originalProfile.seguidoPeloUsuarioAtual;
         data.profile.contagemSeguidores = originalProfile.contagemSeguidores;
       }
     });
  }

  openEditModal(): void {
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
  }

  onProfileUpdated(updatedProfile: UsuarioProfile): void {
    this.profileData$ = this.profileData$.pipe(
      map(data => ({
        ...data,
        profile: updatedProfile
      }))
    );
    this.authService.updateCurrentUserProfilePhoto(updatedProfile.urlFotoPerfil)
    this.closeEditModal();
  }
}