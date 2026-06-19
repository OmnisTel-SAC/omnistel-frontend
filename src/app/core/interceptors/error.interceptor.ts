import { HttpErrorResponse, type HttpHandlerFn, type HttpInterceptorFn, type HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

function getFriendlyMessage(status: number, error?: any): { summary: string; detail: string } {
  const serverMessage = error?.message || error?.detail || '';

  switch (status) {
    case 0:
      return {
        summary: 'Sin conexión',
        detail: 'No pudimos conectar con el servidor. Verifica tu conexión a internet.',
      };
    case 400:
      return {
        summary: 'Solicitud inválida',
        detail: serverMessage || 'Los datos enviados no son válidos. Revisa el formulario e inténtalo de nuevo.',
      };
    case 401:
      return {
        summary: 'Sesión terminada',
        detail: 'Tu sesión terminó. Te redirigiremos al inicio para que ingreses de nuevo.',
      };
    case 403:
      return {
        summary: 'Acción no permitida',
        detail: 'No tienes permiso para realizar esta acción. Si crees que es un error, contacta a soporte.',
      };
    case 404:
      return {
        summary: 'No encontrado',
        detail: serverMessage || 'No encontramos lo que buscas. Puede que se haya eliminado o que la dirección sea incorrecta.',
      };
    case 409:
      return {
        summary: 'Conflicto',
        detail: serverMessage || 'Ocurrió un conflicto al procesar tu solicitud. Inténtalo de nuevo.',
      };
    case 429:
      return {
        summary: 'Muchas solicitudes',
        detail: 'Realizaste muchas solicitudes en poco tiempo. Espera unos minutos e inténtalo de nuevo.',
      };
    case 500:
      return {
        summary: 'Error del servidor',
        detail: 'Algo salió mal en el servidor. Ya avisamos a nuestro equipo. Inténtalo más tarde.',
      };
    default:
      return {
        summary: 'Error inesperado',
        detail: serverMessage || 'Algo inesperado ocurrió. Inténtalo de nuevo.',
      };
  }
}

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;
      const { summary, detail } = getFriendlyMessage(status, error.error);
      const severity = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

      const handledAtComponent = ['responder al cliente', 'reached maximum', 'tickets abiertos', 'agente a']; // 'agente a' matches 'agente aún no ha respondido'
      const isHandledAtComponent = detail && handledAtComponent.some(m => detail.toLowerCase().includes(m));

      if (!isHandledAtComponent) {
        messageService.add({
          severity,
          summary,
          detail,
          life: 6000,
        });
      }

      return throwError(() => error);
    })
  );
};
