import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
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

  private readonly API_URL = `${environment.apiUrl}/auth`;
  public static readonly CURRENT_PRIVACY_VERSION = '2026-v1.0';

  // Reactive state with Signals
  private currentUserSignal = signal<User | null>(this.loadStoredUser());
  public currentUser = this.currentUserSignal.asReadonly();

  public isAuthenticated = computed(() => !!this.currentUserSignal());
  public userRole = computed(() => this.currentUserSignal()?.role ?? null);
  public isAdmin = computed(() => this.userRole() === UserRole.ADMIN);
  public isVeterinarian = computed(
    () => this.userRole() === UserRole.VETERINARIAN || this.isAdmin(),
  );

  public needsPrivacyAcceptance = computed(() => {
    const user = this.currentUserSignal();
    if (!user) return false;
    return user.acceptedPrivacyVersion !== AuthService.CURRENT_PRIVACY_VERSION;
  });

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
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, credentials)
      .pipe(
        map((res) => res.data),
        tap((data) => {
          this.handleAuthSuccess(data);
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
          this.handleAuthSuccess(data);
          this.notification.success(
            '¡Registro exitoso!',
            'Tu cuenta ha sido creada y configurada correctamente.',
          );
        }),
      );
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
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
          this.logout();
          return throwError(() => err);
        }),
      );
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

  logout(): void {
    const token = this.getAccessToken();
    if (token) {
      this.http.post(`${this.API_URL}/logout`, {}).subscribe({
        error: () => {}, // Ignore server error on logout
      });
    }

    this.storage.clear();
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
    this.notification.info('Sesión finalizada', 'Hasta pronto');
  }

  getAccessToken(): string | null {
    return this.storage.getItem('token');
  }

  getRefreshToken(): string | null {
    return this.storage.getItem('refresh_token');
  }

  private handleAuthSuccess(authData: AuthResponse): void {
    this.storage.setItem('token', authData.accessToken);
    if (authData.refreshToken) {
      this.storage.setItem('refresh_token', authData.refreshToken);
    }
    this.storage.setItem('user', JSON.stringify(authData.user));
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
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}
