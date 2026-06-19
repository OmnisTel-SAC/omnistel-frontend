import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/public/public.routes').then((m) => m.publicRoutes)
  },
  {
    path: '',
    loadComponent: () => import('./shared/layouts/private-layout/private-layout.component').then((m) => m.PrivateLayoutComponent),
    children: [
      {
        path: 'client',
        loadChildren: () => import('./features/client/client.routes').then((m) => m.clientRoutes)
      },
      {
        path: 'agent',
        loadChildren: () => import('./features/agent/agent.routes').then((m) => m.agentRoutes)
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes)
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notifications.routes').then((m) => m.notificationsRoutes)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
  }
];
