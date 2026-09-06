import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.error) {
        if (typeof error.error.message === 'string') {
          errorMessage = error.error.message;
        } else if (Array.isArray(error.error.message)) {
          errorMessage = error.error.message.join(', ');
        }
      }

      switch (error.status) {
        case 401:
          // Unauthorized: Avoid loop if failing on login/refresh
          if (!req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
            notification.error('Sesión caducada', 'Por favor inicia sesión nuevamente');
            authService.logout();
          } else {
            notification.error('Error de autenticación', errorMessage);
          }
          break;

        case 403:
          notification.error('Acceso denegado', 'No posees los permisos necesarios para esta acción');
          break;

        case 404:
          notification.warning('Recurso no encontrado', errorMessage);
          break;

        case 429:
          notification.error(
            'Límite de solicitudes superado',
            'Demasiados intentos. Por favor espera un momento antes de reintentar.',
          );
          break;

        case 500:
          notification.error('Error del servidor', 'Ocurrió una falla interna en el servidor.');
          break;

        case 0:
          notification.error(
            'Error de conexión',
            'No se pudo conectar con el servidor. Verifica tu conexión a internet o el estado del backend.',
          );
          break;

        default:
          notification.error('Error', errorMessage);
          break;
      }

      return throwError(() => error);
    }),
  );
};
