import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. Importe o RouterModule para ter acesso às diretivas de roteamento
import { RouterModule } from '@angular/router';
import { NewPostModalComponent } from '../new-post-modal/new-post-modal.component';
import { SearchComponent } from "../search/search.component";

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  // 2. Adicione o RouterModule ao array de 'imports'
  imports: [CommonModule, NewPostModalComponent, RouterModule, SearchComponent],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss'
})
export class SidebarNavComponent {
  navLinks = [
    { name: 'Início', icon: 'home', route: '/home' },
    { name: 'Pesquisar', icon: 'search'},
  ];

  isNewPostModalOpen = false;
  isSearchModalOpen = false;
  
  openNewPostModal(): void {
    this.isNewPostModalOpen = true;
  }

  closeNewPostModal(): void {
    this.isNewPostModalOpen = false;
  }

  openSearcModal(): void {
    this.isSearchModalOpen = true;
  }

  closeSearchModal(): void {
    this.isSearchModalOpen = false;
  }
}

