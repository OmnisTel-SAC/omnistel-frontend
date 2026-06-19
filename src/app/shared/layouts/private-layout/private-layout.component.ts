import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss'
})
export class PrivateLayoutComponent {
  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
