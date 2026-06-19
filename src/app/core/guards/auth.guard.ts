import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
