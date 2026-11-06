import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map, shareReplay, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import {
  User,
  UserRole,
  AuthResponse,
  LoginDto,
  RegisterDto,
} from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);
  private notification = inject(NotificationService);
  private injector = inject(Injector);

  private readonly API_URL = `${environment.apiUrl}/auth`;
  public static readonly CURRENT_PRIVACY_VERSION = '2026-v1.0';

  // Shared observable to deduplicate concurrent token refresh calls
  private refreshInProgress$: Observable<{ accessToken: string; refreshToken: string }> | null = null;

  // Reactive state with Signals
  private currentUserSignal = signal<User | null>(this.loadStoredUser());
  public currentUser = this.currentUserSignal.asReadonly();

  public isAuthenticated = computed(() => !!this.currentUserSignal());
  public userRole = computed(() => this.currentUserSignal()?.role ?? null);
  public isAdmin = computed(() => this.userRole() === UserRole.ADMIN);
  public isVeterinarian = computed(
    () => this.userRole() === UserRole.VETERINARIAN || this.isAdmin(),
  );

  /**
   * Límite de fotografías por publicación según rol:
   * - Rescatistas, Albergues, Veterinarios, Clínicas Aliadas y Admin: hasta 6 fotos.
   * - Usuarios generales / Dueños / Adoptantes: hasta 3 fotos.
   */
  public maxPhotosAllowed = computed(() => {
    const role = this.userRole();
    if (!role) return 3;
    const privilegedRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.RESCATISTA_VERIFICADO,
      UserRole.ALBERGUE,
      UserRole.VETERINARIAN,
      UserRole.CLINICA_ALIADA,
    ];
    return privilegedRoles.includes(role) ? 6 : 3;
  });

  public needsPrivacyAcceptance = computed(() => {
    const user = this.currentUserSignal();
    if (!user) return false;
    return user.acceptedPrivacyVersion !== AuthService.CURRENT_PRIVACY_VERSION;
  });

  constructor() {
    this.validateSessionOnStartup();
  }

  /**
   * Decodifica el payload de un JWT y comprueba si ya expiró (o está por expirar en bufferSeconds).
   */
  public isTokenExpired(token: string | null, bufferSeconds = 15): boolean {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const payload = JSON.parse(jsonPayload);
      if (!payload.exp) return false;
      const expiresAtMs = payload.exp * 1000;
      return Date.now() >= expiresAtMs - bufferSeconds * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Verifica al iniciar la aplicación si el token sigue vigente.
   * - Si el accessToken venció pero hay un refreshToken válido, renueva en silencio.
   * - Si ambos vencieron (o no hay tokens válidos), limpia la sesión de inmediato
   *   para evitar que aparezca como "sesión iniciada" cuando ya caducó.
   */
  private validateSessionOnStartup(): void {
    const storedUser = this.currentUserSignal();
    if (!storedUser) return;

    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    // Si no hay tokens o el refreshToken ya caducó definitivamente, cerrar sesión silenciosamente
    if (!accessToken && !refreshToken) {
      this.clearSessionSilent();
      return;
    }

    if (this.isTokenExpired(accessToken, 60)) {
      if (refreshToken && !this.isTokenExpired(refreshToken, 10)) {
        // Renovar silenciosamente al arrancar la app
        this.refreshToken().subscribe({
          error: () => this.clearSessionSilent(),
        });
      } else {
        // El token ya caducó y no hay refresh token válido -> limpiar estado inmediatamente
        this.clearSessionSilent();
      }
    }
  }

  public canAttemptRefresh(): boolean {
    const refreshToken = this.getRefreshToken();
    return Boolean(refreshToken && !this.isTokenExpired(refreshToken, 5));
  }

  public clearSessionSilent(): void {
    this.storage.clear();
    this.currentUserSignal.set(null);
  }

  acceptPrivacy(version: string = AuthService.CURRENT_PRIVACY_VERSION): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${environment.apiUrl}/users/accept-privacy`, { version })
      .pipe(
        map((res) => res.data),
        tap(() => {
          const user = this.currentUserSignal();
          if (user) {
            const updatedUser: User = {
              ...user,
              acceptedPrivacyVersion: version,
              privacyAcceptedAt: new Date().toISOString(),
            };
            this.storage.setItem('user', JSON.stringify(updatedUser));
            this.currentUserSignal.set(updatedUser);
            this.notification.success('Términos Aceptados', 'Gracias por mantener tu cuenta actualizada.');
          }
        }),
      );
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    const rememberMe = Boolean(credentials.rememberMe);
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, credentials)
      .pipe(
        map((res) => res.data),
        tap((data) => {
          this.handleAuthSuccess(data, rememberMe);
          this.notification.success(
            '¡Bienvenido!',
            `Sesión iniciada como ${data.user.fullName}`,
          );
        }),
      );
  }

  register(payload: RegisterDto): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.API_URL}/register`, payload)
      .pipe(
        map((res) => res.data),
        tap((data) => {
          this.handleAuthSuccess(data, true);
          this.notification.success(
            '¡Registro exitoso!',
            'Tu cuenta ha sido creada y configurada correctamente.',
          );
        }),
      );
  }

  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken || this.isTokenExpired(refreshToken, 5)) {
      this.clearSessionSilent();
      return throwError(() => new Error('No valid refresh token available'));
    }

    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    this.refreshInProgress$ = this.http
      .post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${this.API_URL}/refresh`,
        { refreshToken },
      )
      .pipe(
        map((res) => res.data),
        tap((tokens) => {
          this.storage.setItem('token', tokens.accessToken);
          if (tokens.refreshToken) {
            this.storage.setItem('refresh_token', tokens.refreshToken);
          }
        }),
        catchError((err) => {
          this.clearSessionSilent();
          return throwError(() => err);
        }),
        finalize(() => {
          this.refreshInProgress$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshInProgress$;
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${this.API_URL}/forgot-password`, { email })
      .pipe(map((res) => res.data));
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${this.API_URL}/reset-password`, { token, newPassword })
      .pipe(map((res) => res.data));
  }

  logout(showNotification = true): void {
    // Gracefully unsubscribe Web Push from backend before clearing session tokens
    try {
      const pushService = this.injector.get(PushNotificationService, null);
      if (pushService) {
        pushService.unsubscribeBeforeLogout();
      }
    } catch {
      // Ignored: fail-safe
    }

    const token = this.getAccessToken();
    if (token && !this.isTokenExpired(token, 0)) {
      this.http.post(`${this.API_URL}/logout`, {}).subscribe({
        error: () => {}, // Ignore server error on logout
      });
    }

    this.storage.clear();
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
    if (showNotification) {
      this.notification.info('Sesión finalizada', 'Hasta pronto');
    }
  }

  getAccessToken(): string | null {
    return this.storage.getItem('token');
  }

  getRefreshToken(): string | null {
    return this.storage.getItem('refresh_token');
  }

  private handleAuthSuccess(authData: AuthResponse, rememberMe = false): void {
    this.storage.setPersistenceMode(rememberMe);
    this.storage.setItem('token', authData.accessToken, rememberMe);
    if (authData.refreshToken) {
      this.storage.setItem('refresh_token', authData.refreshToken, rememberMe);
    }
    this.storage.setItem('user', JSON.stringify(authData.user), rememberMe);
    this.currentUserSignal.set(authData.user);
  }

  updateCurrentUser(user: User): void {
    this.storage.setItem('user', JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private loadStoredUser(): User | null {
    const userStr = this.storage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      const accessToken = this.storage.getItem('token');
      const refreshToken = this.storage.getItem('refresh_token');
      // Si no existe ningún token o ambos están expirados desde el inicio, no cargar sesión fantasma
      if (!accessToken && !refreshToken) {
        this.storage.clear();
        return null;
      }
      if (this.isTokenExpired(accessToken, 0) && this.isTokenExpired(refreshToken, 0)) {
        this.storage.clear();
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }
}
