import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service'; // Ajuste o caminho se necessário
import { AuthService } from '../features/auth/auth.service'; // Ajuste o caminho se necessário
import { ObraDeArte } from '../core/models/obra-de-arte.model';
import { UsuarioProfile } from '../core/models/usuario-profile.model';
import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav.component';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';
import { UsuarioService } from '../features/usuarios-search/usuario.service';

interface ProfileData {
  profile: UsuarioProfile;
  artworks: ObraDeArte[];
  isMyProfile: boolean;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    SidebarNavComponent,
    EditProfileModalComponent // --- 2. Adicionar o modal às importações ---
  ],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit {
  profileData$!: Observable<ProfileData>;
  isLoading = true;

  // --- 3. Adicionar variável de estado para o modal ---
  isEditModalOpen = false;

  constructor(
    private route: ActivatedRoute,
    private usuarioService: UsuarioService,
    private obraDeArteService: ObraDeArteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.profileData$ = this.route.paramMap.pipe(
      switchMap(params => {
        const username = params.get('username');
        if (!username) {
          throw new Error('Username não encontrado na rota.');
        }

        this.isLoading = true; // Ligar o loading no início de cada nova busca
        const profile$ = this.usuarioService.getProfile(username);
        const artworks$ = this.obraDeArteService.getAll();
        const myUsername$ = this.authService.currentUser$.pipe(map(user => user?.nameid));

        return combineLatest([profile$, artworks$, myUsername$]).pipe(
          map(([profile, artworks, myUsername]) => {
            this.isLoading = false; // Desligar o loading quando os dados chegam
            return {
              profile,
              artworks,
              isMyProfile: profile.username === myUsername
            };
          })
        );
      })
    );
  }

  toggleFollow(profileData: ProfileData): void {
    const originalProfile = { ...profileData.profile };

    // Atualização otimista da UI
    profileData.profile.seguidoPeloUsuarioAtual = !profileData.profile.seguidoPeloUsuarioAtual;
    profileData.profile.contagemSeguidores += profileData.profile.seguidoPeloUsuarioAtual ? 1 : -1;

    const action$ = originalProfile.seguidoPeloUsuarioAtual
      ? this.usuarioService.unfollowUser(originalProfile.id)
      : this.usuarioService.followUser(originalProfile.id);

    action$.subscribe({
      error: () => {
        // Reverte a UI em caso de erro
        profileData.profile.seguidoPeloUsuarioAtual = originalProfile.seguidoPeloUsuarioAtual;
        profileData.profile.contagemSeguidores = originalProfile.contagemSeguidores;
      }
    });
  }

  // --- 4. Adicionar métodos para controlar o modal ---
  
  /**
   * Abre o modal de edição.
   */
  openEditModal(): void {
    this.isEditModalOpen = true;
  }

  /**
   * Fecha o modal de edição.
   */
  closeEditModal(): void {
    this.isEditModalOpen = false;
  }

  /**
   * Chamado quando o modal emite o evento 'profileUpdated'.
   * Atualiza os dados do perfil na página em tempo real.
   */
  onProfileUpdated(updatedProfile: UsuarioProfile): void {
    this.profileData$ = this.profileData$.pipe(
      map(data => ({
        ...data,
        profile: updatedProfile // Substitui o perfil antigo pelo novo
      }))
    );
    this.closeEditModal();
  }
}

