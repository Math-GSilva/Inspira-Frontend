import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { HomeComponent } from './home/home.component';

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
    path: 'home',
    component: HomeComponent
  },
  { 
    path: '**', 
    redirectTo: '',
    pathMatch: 'full' 
  }
];

