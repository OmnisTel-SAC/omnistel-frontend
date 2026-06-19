import { Component, computed, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/stores/auth.store';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-topbar',
  imports: [NotificationBellComponent, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly menuToggle = output<void>();
  dropdownOpen = false;

  readonly userInitials = computed(() => {
    const u = this.authStore.user();
    if (!u) return '';
    return (u.firstName.charAt(0) + u.lastName.charAt(0)).toUpperCase();
  });

  readonly userName = computed(() => {
    const u = this.authStore.user();
    if (!u) return '';
    return `${u.firstName} ${u.lastName}`;
  });

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout(): void {
    this.dropdownOpen = false;
    this.authStore.logout();
  }

}
