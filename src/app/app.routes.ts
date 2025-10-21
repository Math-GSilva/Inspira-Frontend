import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { HomeComponent } from './home/home.component';
import { publicGuard } from './features/auth/public-guard';
import { authGuard } from './features/auth/auth-guard';

export const routes: Routes = [
  { 
    path: '', 
    component: LandingPageComponent, 
    title: 'ArtConnect | Bem-vindo',
    canActivate: [publicGuard]
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
    canActivate: [publicGuard]
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard]
  },

  { 
    path: '**', 
    redirectTo: '',
    pathMatch: 'full' 
  }
];

