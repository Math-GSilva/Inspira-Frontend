import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { UsuarioService } from '../features/usuarios-search/usuario.service';
import { ObraDeArteService } from '../features/obras-de-arte/obra-de-arte.service';
import { AuthService } from '../features/auth/auth.service';
import { ObraDeArte } from '../core/models/obra-de-arte.model';
import { UsuarioProfile } from '../core/models/usuario-profile.model';
import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav.component';

interface ProfileData {
  profile: UsuarioProfile;
  artworks: ObraDeArte[];
  isMyProfile: boolean;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarNavComponent],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit {
  profileData$!: Observable<ProfileData>;
  isLoading = true;

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

        const profile$ = this.usuarioService.getProfile(username);
        const artworks$ = this.obraDeArteService.getAllObras();
        const myUsername$ = this.authService.currentUser$.pipe(map(user => user?.nameid));

        return combineLatest([profile$, artworks$, myUsername$]).pipe(
          map(([profile, artworks, myUsername]) => {
            this.isLoading = false;
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

    profileData.profile.seguidoPeloUsuarioAtual = !profileData.profile.seguidoPeloUsuarioAtual;
    profileData.profile.contagemSeguidores += profileData.profile.seguidoPeloUsuarioAtual ? 1 : -1;

    const action$ = originalProfile.seguidoPeloUsuarioAtual
      ? this.usuarioService.unfollowUser(originalProfile.id)
      : this.usuarioService.followUser(originalProfile.id);

    action$.subscribe({
      error: () => {
        profileData.profile.seguidoPeloUsuarioAtual = originalProfile.seguidoPeloUsuarioAtual;
        profileData.profile.contagemSeguidores = originalProfile.contagemSeguidores;
      }
    });
  }
}

