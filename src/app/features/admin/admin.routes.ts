import type { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'queue',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./pages/queue/queue.component').then((m) => m.QueueComponent)
  },
  {
    path: 'tickets',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./pages/tickets/tickets.component').then((m) => m.TicketsComponent)
  },
  {
    path: 'tickets/:id',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./pages/ticket-detail/ticket-detail.component').then((m) => m.TicketDetailComponent)
  },
  {
    path: 'users',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./pages/users/users.component').then((m) => m.UsersComponent)
  }
];
