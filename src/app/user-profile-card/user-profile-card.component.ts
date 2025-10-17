import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from '../features/auth/auth.service';
import { DecodedToken } from '../features/auth/decoded-token.model';

@Component({
  selector: 'app-user-profile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile-card.component.html',
  styleUrl: './user-profile-card.component.scss'
})
export class UserProfileCardComponent {
  currentUser$: Observable<DecodedToken | null>;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  logout(): void {
    this.authService.logout();
  }
}

