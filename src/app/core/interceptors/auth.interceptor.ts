import { HttpErrorResponse, type HttpHandlerFn, type HttpInterceptorFn, type HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStore } from '../stores/auth.store';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authStore = inject(AuthStore);

  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  const token = authStore.token();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authStore.logout();
      }
      return throwError(() => error);
    })
  );
};
