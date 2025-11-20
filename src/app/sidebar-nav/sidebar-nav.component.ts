import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../features/auth/auth.service';
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

  isNewPostModalOpen = false;
  isSearchModalOpen = false;
  isAddCategoryModalOpen = false;

  isAdmin$!: Observable<boolean>;
  isArtist$!: Observable<boolean>;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isAdmin$ = this.authService.currentUser$.pipe(
      map(user => user?.role === 'Administrador')
    );
    
    this.isArtist$ = this.authService.currentUser$.pipe(
      map(user => user?.role === 'Artista' || user?.role === 'Administrador')
    );
  }

  openNewPostModal(): void {
    this.isNewPostModalOpen = true;
  }
  closeNewPostModal(): void {
    this.isNewPostModalOpen = false;
  }

  openSearchModal(): void {
    this.isSearchModalOpen = true;
  }
  closeSearchModal(): void {
    this.isSearchModalOpen = false;
  }

  openAddCategoryModal(): void {
    this.isAddCategoryModalOpen = true;
  }
  closeAddCategoryModal(): void {
    this.isAddCategoryModalOpen = false;
  }
}
