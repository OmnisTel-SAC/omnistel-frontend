import type { Routes } from '@angular/router';
import { PublicLayoutComponent } from '../../shared/layouts/public-layout/public-layout.component';

export const publicRoutes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/landing/landing.component').then((m) => m.LandingComponent)
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent)
      }
    ]
  }
];
