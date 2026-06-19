import type { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const agentRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['AGENT'] },
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'tickets',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['AGENT'] },
    loadComponent: () => import('./pages/tickets/tickets.component').then((m) => m.TicketsComponent)
  },
  {
    path: 'assigned',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['AGENT'] },
    loadComponent: () => import('./pages/assigned-tickets/assigned-tickets.component').then((m) => m.AssignedTicketsComponent)
  },
  {
    path: 'tickets/:id',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['AGENT'] },
    loadComponent: () => import('./pages/ticket-detail/ticket-detail.component').then((m) => m.TicketDetailComponent)
  }
];
