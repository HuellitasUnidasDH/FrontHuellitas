import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const notification = inject(NotificationService);

    const user = authService.currentUser();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    notification.error('Acceso restringido', 'No tienes los permisos requeridos');
    router.navigate(['/']);
    return false;
  };
};
