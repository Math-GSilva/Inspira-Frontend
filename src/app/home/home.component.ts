import { Component } from '@angular/core';
import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav.component';
import { TimelineFeedComponent } from '../timeline-feed/timeline-feed.component';
import { UserProfileCardComponent } from '../user-profile-card/user-profile-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  // Importamos os 3 componentes filhos para que possam ser usados no template.
  imports: [
    SidebarNavComponent,
    TimelineFeedComponent,
    UserProfileCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  // Este componente não precisa de lógica, a sua única função é estruturar a página.
}
