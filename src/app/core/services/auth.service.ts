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
import { PrivacyPolicyConfig } from './user.service';

export const DEFAULT_PRIVACY_POLICY_CONFIG: PrivacyPolicyConfig = {
  version: '2026-v1.0',
  title: 'Aviso de Privacidad Integral y Términos Legales',
  introBanner:
    '🛡️ Al registrarse y hacer uso de la plataforma Huellitas Dolores Hidalgo (VetRegistro), el usuario otorga su consentimiento expreso e informado para la recopilación, almacenamiento seguro y tratamiento de sus datos personales y de sus animales de compañía bajo las normas legales vigentes.',
  content: `1. Identidad y Domicilio del Responsable
Huellitas Dolores Hidalgo / VetRegistro Enterprise Systems S.A.P.I. de C.V. (en adelante "El Responsable"), con domicilio legal y plataformas digitales autorizadas, es el responsable del uso, confidencialidad, integridad y protección de los datos personales proporcionados por los usuarios en estricto cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y estándares internacionales (GDPR).

2. Datos Personales Recabados
Para la prestación de los servicios del sistema, se recopilan de manera directa y lícita:
• Datos de Identificación del Titular: Nombre completo, correo electrónico, número telefónico celular verificado de 10 dígitos y colonia de residencia.
• Datos de Identificación Animal: Nombre de la mascota, especie, raza, peso, edad, número de microchip de identificación única, fotografías y datos biológicos.
• Historial Clínico Veterinario: Vacunas, desparasitaciones, diagnósticos médicos, tratamientos farmacológicos y prescripciones expedidas por profesionales autorizados.
• Datos Técnicos de Seguridad y Auditoría: Dirección IP, registros de acceso (timestamps), tipo de navegador y registros inmutables de auditoría forense para prevenir accesos no autorizados.

3. Finalidades del Tratamiento de Datos
Los datos recabados serán utilizados para las siguientes finalidades primarias y necesarias:
• Creación, autenticación y administración segura de su cuenta de usuario con tecnología de cifrado JWT y hashing criptográfico.
• Emisión, consulta y resguardo del expediente médico, adopciones responsables, reportes de extravío y cartilla digital de vacunación de sus animales de compañía.
• Verificación y asignación de controles de acceso basados en roles (Dueño, Adoptante, Rescatista, Médico Veterinario o Administrador).
• Seguridad y defensa perimetral: Detección y bloqueo automático de ciberataques, denegación de servicio (DoS) e intentos maliciosos de intrusión.

4. Medidas de Seguridad y Cifrado
El Responsable implementa medidas de seguridad técnicas, físicas y administrativas reconocidas por la industria, que incluyen: cifrado de contraseñas con algoritmo Bcrypt (factor de costo 12), protección de cabeceras HTTP mediante Helmet CSP/HSTS, prevención de inyecciones SQL mediante consultas parametrizadas tipadas y limitación de tasa de solicitudes (Rate Limiting).

5. Deslinde de Responsabilidad Médica Veterinaria
La plataforma opera exclusivamente como un medio tecnológico de vinculación comunitaria, registro y gestión de información. La veracidad, precisión y consecuencias de los diagnósticos, prescripciones, tratamientos médicos o procesos de adopción son responsabilidad única y exclusiva del Médico Veterinario tratante, rescatista o usuario que los registre.

6. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
Usted tiene el derecho constitucional de acceder a sus datos personales en nuestra posesión, rectificarlos en caso de inexactitud, solicitar su cancelación cuando considere que no se requieren para las finalidades señaladas, u oponerse al tratamiento de los mismos para fines específicos mediante solicitud formal al oficial de privacidad en privacidad@vetregistro.com.

7. Transferencia de Datos
Se hace constar expresamente que El Responsable NO vende, arrienda, comercializa ni transfiere datos personales o historiales médicos a terceros con fines publicitarios o lucrativos. Únicamente se transferirán datos cuando sea requerido formalmente por mandato judicial o autoridad sanitaria competente en materia de bienestar animal.`,
};

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

  private privacyPolicySignal = signal<PrivacyPolicyConfig>({ ...DEFAULT_PRIVACY_POLICY_CONFIG });
  public privacyPolicy = this.privacyPolicySignal.asReadonly();

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
    const activeVersion = this.privacyPolicySignal().version || AuthService.CURRENT_PRIVACY_VERSION;
    return !user.acceptedPrivacyVersion || user.acceptedPrivacyVersion === 'OUTDATED' || user.acceptedPrivacyVersion !== activeVersion;
  });

  constructor() {
    this.validateSessionOnStartup();
    this.refreshPrivacyPolicy();
  }

  public refreshPrivacyPolicy(): void {
    this.http.get<ApiResponse<PrivacyPolicyConfig>>(`${environment.apiUrl}/users/privacy-policy`).subscribe({
      next: (res) => {
        if (res?.data?.version) {
          this.privacyPolicySignal.set(res.data);
        }
      },
      error: () => {
        // Fallback to default policy
      },
    });
  }

  public applyUpdatedPrivacyPolicy(policy: PrivacyPolicyConfig): void {
    this.privacyPolicySignal.set(policy);
    const user = this.currentUserSignal();
    if (user) {
      const updatedUser: User = {
        ...user,
        acceptedPrivacyVersion: policy.version,
        privacyAcceptedAt: new Date().toISOString(),
      };
      this.storage.setItem('user', JSON.stringify(updatedUser));
      this.currentUserSignal.set(updatedUser);
    }
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
        // Renovar silenciosamente al arrancar la app.
        // Solo limpiar sesión si el servidor rechaza el token (401/403), nunca por microcorte de red en el celular.
        this.refreshToken().subscribe({
          error: (err) => {
            if (err?.status === 401 || err?.status === 403) {
              this.clearSessionSilent();
            }
          },
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

  acceptPrivacy(version?: string): Observable<any> {
    const targetVersion = version || this.privacyPolicySignal().version || AuthService.CURRENT_PRIVACY_VERSION;
    return this.http
      .post<ApiResponse<any>>(`${environment.apiUrl}/users/accept-privacy`, { version: targetVersion })
      .pipe(
        map((res) => res.data),
        tap((data) => {
          const user = this.currentUserSignal();
          if (user) {
            const updatedUser: User = {
              ...user,
              acceptedPrivacyVersion: data?.acceptedPrivacyVersion || targetVersion,
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
          // Solo borrar sesión si el servidor rechazó el refresh token explícitamente (401/403).
          // Jamás cerrar sesión en el celular por un arranque en frío del servidor o cambio de red móvil (status 0 / 5xx).
          if (err?.status === 401 || err?.status === 403) {
            this.clearSessionSilent();
          }
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
