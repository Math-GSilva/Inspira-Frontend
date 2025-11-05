import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, map } from 'rxjs';

// Serviços
import { AuthService } from '../features/auth/auth.service'; // Ajuste o caminho se necessário

// Modais
import { NewPostModalComponent } from '../new-post-modal/new-post-modal.component';
import { SearchComponent } from "../search/search.component";
import { AddCategoryModalComponent } from '../add-category-modal/add-category-modal.component'; 

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NewPostModalComponent, 
    SearchComponent,
    AddCategoryModalComponent 
  ],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss'
})
export class SidebarNavComponent implements OnInit { 
  
  navLinks = [
    { name: 'Início', icon: 'home', route: '/home' },
    { name: 'Pesquisar', icon: 'search' },
  ];

  // Estado dos Modais
  isNewPostModalOpen = false;
  isSearchModalOpen = false;
  isAddCategoryModalOpen = false; 

  // Estado das Roles
  isAdmin$!: Observable<boolean>; 
  isArtist$!: Observable<boolean>; // <-- 1. Adicionar Observable para o estado de artista

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Verifica se é admin
    this.isAdmin$ = this.authService.currentUser$.pipe(
      map(user => user?.role === 'Administrador')
    );
    
    // --- 2. Verificar se é artista ---
    this.isArtist$ = this.authService.currentUser$.pipe(
      map(user => user?.role === 'Artista' || user?.role === 'Administrador') 
    );
  }

  // Métodos para o modal de Novo Post
  openNewPostModal(): void {
    this.isNewPostModalOpen = true;
  }
  closeNewPostModal(): void {
    this.isNewPostModalOpen = false;
  }

  // Métodos para o modal de Pesquisa
  openSearchModal(): void { 
    this.isSearchModalOpen = true;
  }
  closeSearchModal(): void {
    this.isSearchModalOpen = false;
  }

  // Métodos para o novo modal de Categoria
  openAddCategoryModal(): void {
    this.isAddCategoryModalOpen = true;
  }
  closeAddCategoryModal(): void {
    this.isAddCategoryModalOpen = false;
  }
}

