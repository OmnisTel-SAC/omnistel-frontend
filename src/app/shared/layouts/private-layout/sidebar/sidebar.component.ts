import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../../core/stores/auth.store';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  exact: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly authStore = inject(AuthStore);
  readonly open = input(false);
  readonly navClick = output<void>();

  readonly menuItems = computed<MenuItem[]>(() => {
    const role = this.authStore.role();
    switch (role) {
      case 'CLIENT':
        return [
          { label: 'Dashboard', icon: 'pi-home', route: '/client', exact: true },
          { label: 'Mis Tickets', icon: 'pi-ticket', route: '/client/my-tickets', exact: true },
          { label: 'Crear Ticket', icon: 'pi-plus', route: '/client/create-ticket', exact: true },
          { label: 'Notificaciones', icon: 'pi-bell', route: '/notifications', exact: true }
        ];
      case 'AGENT':
        return [
          { label: 'Dashboard', icon: 'pi-home', route: '/agent', exact: true },
          { label: 'Cola de Tickets', icon: 'pi-inbox', route: '/agent/tickets', exact: false },
          { label: 'Mis Asignados', icon: 'pi-user', route: '/agent/assigned', exact: true },
          { label: 'Notificaciones', icon: 'pi-bell', route: '/notifications', exact: true }
        ];
      case 'ADMIN':
        return [
          { label: 'Dashboard', icon: 'pi-home', route: '/admin', exact: true },
          { label: 'Cola de Tickets', icon: 'pi-inbox', route: '/admin/queue', exact: false },
          { label: 'Todos los Tickets', icon: 'pi-list', route: '/admin/tickets', exact: false },
          { label: 'Usuarios', icon: 'pi-users', route: '/admin/users', exact: false },
          { label: 'Notificaciones', icon: 'pi-bell', route: '/notifications', exact: true }
        ];
      default:
        return [];
    }
  });

  readonly userInitials = computed(() => {
    const u = this.authStore.user();
    if (!u) return '';
    return (u.firstName.charAt(0) + u.lastName.charAt(0)).toUpperCase();
  });

  readonly roleLabel = computed(() => {
    const role = this.authStore.role();
    switch (role) {
      case 'CLIENT': return 'CLIENTE';
      case 'AGENT': return 'AGENTE';
      case 'ADMIN': return 'ADMINISTRADOR';
      default: return role;
    }
  });
}
