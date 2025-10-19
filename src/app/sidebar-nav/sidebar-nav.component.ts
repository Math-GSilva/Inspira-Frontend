import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewPostModalComponent } from '../new-post-modal/new-post-modal.component';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, NewPostModalComponent],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss'
})
export class SidebarNavComponent {
  activeLink = 'Início'; 
  
  navLinks = [
    { name: 'Início', icon: 'home' },
    { name: 'Pesquisar', icon: 'search' },
    { name: 'Notificações', icon: 'notifications' },
  ];

  isModalOpen = false;

  openNewPostModal(): void {
    this.isModalOpen = true;
  }

  closeNewPostModal(): void {
    this.isModalOpen = false;
  }
}

