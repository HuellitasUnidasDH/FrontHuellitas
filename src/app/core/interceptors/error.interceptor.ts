import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, retry, timer } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

let lastConnectionErrorToastTs = 0;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notification = inject(NotificationService);

  return next(req).pipe(
    // Reintento automático transparente (auto-healing): si el celular estaba dormido y la antena
    // apenas está levantando el socket, o si Render tiene un retardo de arranque en frío (502/503/504),
    // reintentar automáticamente 2 veces antes de dar por fallida la llamada.
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        const isTransientNetworkOrColdStart =
          error.status === 0 ||
          error.status === 502 ||
          error.status === 503 ||
          error.status === 504;

        if (isTransientNetworkOrColdStart) {
          return timer(retryCount * 1200);
        }
        return throwError(() => error);
      },
    }),
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.error) {
        if (typeof error.error.message === 'string') {
          errorMessage = error.error.message;
        } else if (Array.isArray(error.error.message)) {
          errorMessage = error.error.message.join(', ');
        }
      }

      if (error.status === 401) {
        const isAuthEndpoint =
          req.url.includes('/auth/login') ||
          req.url.includes('/auth/register') ||
          req.url.includes('/auth/refresh') ||
          req.url.includes('/auth/logout');

        if (!isAuthEndpoint) {
          // Intentar renovación transparente (Silent Refresh) si el usuario tiene refreshToken válido
          if (authService.canAttemptRefresh()) {
            return authService.refreshToken().pipe(
              switchMap((tokens) => {
                const retriedReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${tokens.accessToken}`,
                  },
                });
                return next(retriedReq);
              }),
              catchError((refreshErr) => {
                // Solo cerrar sesión si el servidor rechazó el refresh token (401/403), no por corte momentáneo de red
                if (refreshErr?.status === 401 || refreshErr?.status === 403) {
                  notification.error('Sesión caducada', 'Por favor inicia sesión nuevamente');
                  authService.logout(false);
                }
                return throwError(() => refreshErr);
              }),
            );
          }

          notification.error('Sesión caducada', 'Por favor inicia sesión nuevamente');
          authService.logout(false);
        } else if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
          notification.error('Error de autenticación', errorMessage);
        }
        return throwError(() => error);
      }

      // Identificar si es una consulta automática en segundo plano / polling para no interrumpir la UX
      const isBackgroundPolling =
        req.url.includes('/unread-count') ||
        req.url.includes('/public-key') ||
        req.url.includes('/preferences') ||
        req.headers.has('X-Silent') ||
        (req.method === 'GET' &&
          (req.url.includes('/notifications') ||
            req.url.includes('/comments') ||
            req.url.includes('/messages')));

      switch (error.status) {
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
        case 502:
        case 503:
        case 504:
          // Si es un polling de fondo, no interrumpir con avisos ruidosos
          if (!isBackgroundPolling) {
            notification.error('Error del servidor', 'Ocurrió una falla interna en el servidor.');
          }
          break;

        case 0: {
          // Status 0 ocurre habitualmente cuando el móvil entra en reposo y corta los sockets.
          // Si es un polling de fondo, la app mantiene los datos existentes sin alarmar al usuario.
          // Si es una acción del usuario (guardar, enviar, etc.), mostrar aviso con anti-spam.
          const now = Date.now();
          if (!isBackgroundPolling && now - lastConnectionErrorToastTs > 6000) {
            lastConnectionErrorToastTs = now;
            notification.error(
              'Sin conexión',
              'Verifica tu señal de internet o conexión de datos e intenta de nuevo.',
            );
          }
          break;
        }

        default:
          if (!isBackgroundPolling) {
            notification.error('Error', errorMessage);
          }
          break;
      }

      return throwError(() => error);
    }),
  );
};
