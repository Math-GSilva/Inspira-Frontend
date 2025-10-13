import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';

export const routes: Routes = [
  { 
    path: '', 
    component: LandingPageComponent, 
    title: 'ArtConnect | Bem-vindo' 
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  
  { 
    path: '**', 
    redirectTo: '',
    pathMatch: 'full' 
  }
];

