import type { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const clientRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CLIENT'] },
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'my-tickets',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CLIENT'] },
    loadComponent: () => import('./pages/my-tickets/my-tickets.component').then((m) => m.MyTicketsComponent)
  },
  {
    path: 'create-ticket',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CLIENT'] },
    loadComponent: () => import('./pages/create-ticket/create-ticket.component').then((m) => m.CreateTicketComponent)
  },
  {
    path: 'tickets/:id',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CLIENT'] },
    loadComponent: () => import('./pages/ticket-detail/ticket-detail.component').then((m) => m.TicketDetailComponent)
  }
];
