import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export const roleGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const allowedRoles = route.data?.['roles'] as string[];

  if (!allowedRoles?.length) {
    return true;
  }

  const userRole = authStore.role();
  if (!userRole || !allowedRoles.includes(userRole)) {
    router.navigate([`/${userRole?.toLowerCase() || 'login'}`]);
    return false;
  }
  return true;
};
