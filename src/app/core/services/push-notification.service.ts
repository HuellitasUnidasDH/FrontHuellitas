import { Injectable, inject, signal, computed, effect, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { PwaService } from './pwa.service';
import { NotificationService } from './notification.service';
import { SocialNotificationService } from './social-notification.service';
import { DirectMessageService } from './direct-message.service';
import { ApiResponse } from '../models/api-response.model';

export type PushStatus =
  | 'unsupported'
  | 'blocked'
  | 'off'
  | 'on';

export interface PushPreferences {
  messages: boolean;
  comments: boolean;
  adoptions: boolean;
  community: boolean;
  devices: number;
}

export type PushPreferenceKey = 'messages' | 'comments' | 'adoptions' | 'community';

/**
 * Gestiona las notificaciones push (Web Push / VAPID) del dispositivo actual.
 * Todo está aislado con try/catch: un fallo aquí jamás afecta al resto de la app.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly pwa = inject(PwaService);
  private readonly toast = inject(NotificationService);
  private readonly social = inject(SocialNotificationService);
  private readonly dm = inject(DirectMessageService);
  private readonly apiUrl = `${environment.apiUrl}/push`;

  readonly supported = signal<boolean>(false);
  readonly permission = signal<NotificationPermission>('default');
  readonly subscribed = signal<boolean>(false);
  readonly busy = signal<boolean>(false);
  readonly serverEnabled = signal<boolean | null>(null);
  readonly preferences = signal<PushPreferences | null>(null);

  /** En iPhone/iPad solo funciona si la PWA está instalada en la pantalla de inicio */
  readonly needsIosInstall = computed(() => this.pwa.isIos() && !this.pwa.isStandalone());

  readonly status = computed<PushStatus>(() => {
    if (!this.supported() || this.needsIosInstall()) return 'unsupported';
    if (this.permission() === 'denied') return 'blocked';
    return this.subscribed() ? 'on' : 'off';
  });

  /** Se muestra la invitación discreta solo si tiene sentido pedir el permiso */
  readonly canInvite = computed(
    () =>
      this.auth.isAuthenticated() &&
      this.supported() &&
      !this.needsIosInstall() &&
      this.permission() === 'default' &&
      !this.subscribed() &&
      this.serverEnabled() !== false,
  );

  private listenersAttached = false;

  constructor() {
    this.detectSupport();

    effect(() => {
      const authenticated = this.auth.isAuthenticated();
      untracked(() => {
        if (authenticated) {
          void this.refreshState();
        } else {
          this.subscribed.set(false);
          this.preferences.set(null);
        }
      });
    });
  }

  private detectSupport(): void {
    try {
      const ok =
        typeof window !== 'undefined' &&
        typeof navigator !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      this.supported.set(ok);
      if (ok) {
        this.permission.set(Notification.permission);
        this.attachServiceWorkerListeners();
      }
    } catch {
      this.supported.set(false);
    }
  }

  /** Escucha mensajes del Service Worker (app abierta / clic en la notificación) */
  private attachServiceWorkerListeners(): void {
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
      const data = event.data || {};
      try {
        if (data.type === 'PUSH_NAVIGATE' && typeof data.url === 'string') {
          this.router.navigateByUrl(this.safeInternalUrl(data.url));
        } else if (data.type === 'PUSH_FOREGROUND') {
          this.toast.info(data.title || 'Huellitas', data.body || '');
          this.playPing();
          this.social.loadNotifications().subscribe({ error: () => {} });
          this.dm.loadConversations(true).subscribe({ error: () => {} });
        }
      } catch {
        // Nunca romper la app por un mensaje del SW
      }
    });
  }

  /** Evita redirecciones externas: solo rutas internas de la app */
  private safeInternalUrl(url: string): string {
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin !== window.location.origin) return '/';
      return parsed.pathname + parsed.search + parsed.hash;
    } catch {
      return '/';
    }
  }

  /** Ping corto opcional (puede ser bloqueado por el navegador hasta la primera interacción) */
  private playPing(): void {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      setTimeout(() => ctx.close().catch(() => {}), 500);
    } catch {
      // Ignorar: el sonido es opcional
    }
  }

  /**
   * Sincroniza el estado real del navegador con el servidor.
   * Si ya existe una suscripción en este dispositivo la re-asocia al usuario actual
   * (cubre el caso de cambiar de cuenta en un dispositivo compartido).
   */
  async refreshState(): Promise<void> {
    if (!this.supported()) return;
    try {
      this.permission.set(Notification.permission);
      const reg = await this.getRegistration();
      const existing = reg ? await reg.pushManager.getSubscription() : null;

      if (existing && Notification.permission === 'granted') {
        await this.sendSubscriptionToServer(existing);
        this.subscribed.set(true);
        void this.loadPreferences();
      } else {
        this.subscribed.set(false);
      }

      const keyRes = await firstValueFrom(
        this.http.get<ApiResponse<{ enabled: boolean; publicKey: string | null }>>(
          `${this.apiUrl}/public-key`,
        ),
      );
      this.serverEnabled.set(!!keyRes?.data?.enabled);
    } catch {
      // Silencioso: el push es una mejora opcional
    }
  }

  private async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    try {
      const existing = await navigator.serviceWorker.getRegistration();
      if (existing) return existing;
      return await navigator.serviceWorker.register('/sw.js');
    } catch {
      return null;
    }
  }

  private urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(normalized);
    const out = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  private async sendSubscriptionToServer(sub: PushSubscription): Promise<void> {
    const json = sub.toJSON();
    const p256dh = json.keys ? json.keys['p256dh'] : undefined;
    const auth = json.keys ? json.keys['auth'] : undefined;
    if (!json.endpoint || !p256dh || !auth) return;
    // Solo campos declarados en el DTO del backend (forbidNonWhitelisted)
    await firstValueFrom(
      this.http.post(`${this.apiUrl}/subscribe`, {
        endpoint: json.endpoint,
        keys: { p256dh, auth },
        userAgent: (navigator.userAgent || '').slice(0, 300),
      }),
    );
  }

  /** Activa las alertas push en este dispositivo (se llama solo desde un clic del usuario) */
  async enable(): Promise<boolean> {
    if (!this.supported() || this.busy()) return false;
    this.busy.set(true);
    try {
      const result = await Notification.requestPermission();
      this.permission.set(result);
      if (result !== 'granted') {
        if (result === 'denied') {
          this.toast.warning(
            'Notificaciones bloqueadas',
            'Puedes reactivarlas desde los permisos del sitio en tu navegador.',
          );
        }
        return false;
      }

      const keyRes = await firstValueFrom(
        this.http.get<ApiResponse<{ enabled: boolean; publicKey: string | null }>>(
          `${this.apiUrl}/public-key`,
        ),
      );
      const publicKey = keyRes?.data?.publicKey;
      this.serverEnabled.set(!!keyRes?.data?.enabled);
      if (!keyRes?.data?.enabled || !publicKey) {
        this.toast.warning(
          'Alertas no disponibles',
          'El servidor aún no tiene activadas las notificaciones push.',
        );
        return false;
      }

      const reg = await this.getRegistration();
      if (!reg) {
        this.toast.error('No se pudo activar', 'El navegador no permitió registrar el servicio de alertas.');
        return false;
      }

      const applicationServerKey = this.urlBase64ToUint8Array(publicKey);
      let sub: PushSubscription;
      try {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      } catch {
        // Suscripción previa con otra llave: limpiar y reintentar una vez
        const old = await reg.pushManager.getSubscription();
        if (old) await old.unsubscribe();
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      }

      await this.sendSubscriptionToServer(sub);
      this.subscribed.set(true);
      void this.loadPreferences();
      this.toast.success('¡Alertas activadas!', 'Te avisaremos aunque cierres Huellitas.');
      return true;
    } catch {
      this.toast.error('No se pudo activar', 'Intenta de nuevo en unos segundos.');
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  /** Desactiva las alertas push en este dispositivo */
  async disable(): Promise<void> {
    if (!this.supported() || this.busy()) return;
    this.busy.set(true);
    try {
      const reg = await this.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        try {
          await firstValueFrom(
            this.http.delete(`${this.apiUrl}/subscribe`, { body: { endpoint: sub.endpoint } }),
          );
        } catch {
          // Si el servidor falla, igualmente se quita del navegador
        }
        await sub.unsubscribe();
      }
      this.subscribed.set(false);
      this.toast.info('Alertas desactivadas', 'Este dispositivo ya no recibirá notificaciones push.');
    } catch {
      this.toast.error('No se pudo desactivar', 'Intenta de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * Se invoca justo ANTES de cerrar sesión para que un dispositivo compartido
   * no siga recibiendo alertas de la cuenta anterior.
   */
  unsubscribeBeforeLogout(): void {
    if (!this.supported()) return;
    try {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.pushManager.getSubscription().then((sub) => {
          if (!sub) return;
          this.http
            .delete(`${this.apiUrl}/subscribe`, { body: { endpoint: sub.endpoint } })
            .subscribe({ error: () => {} });
          sub.unsubscribe().catch(() => {});
        });
      });
      this.subscribed.set(false);
    } catch {
      // Ignorar
    }
  }

  async loadPreferences(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<PushPreferences>>(`${this.apiUrl}/preferences`),
      );
      if (res?.data) this.preferences.set(res.data);
    } catch {
      // Silencioso
    }
  }

  async updatePreference(key: PushPreferenceKey, value: boolean): Promise<void> {
    const prev = this.preferences();
    if (prev) this.preferences.set({ ...prev, [key]: value });
    try {
      const res = await firstValueFrom(
        this.http.patch<ApiResponse<PushPreferences>>(`${this.apiUrl}/preferences`, { [key]: value }),
      );
      if (res?.data) this.preferences.set(res.data);
    } catch {
      if (prev) this.preferences.set(prev);
      this.toast.error('No se pudo guardar', 'Revisa tu conexión e intenta de nuevo.');
    }
  }

  async sendTest(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<{ sent: number }>>(`${this.apiUrl}/test`, {}),
      );
      if (!res?.data?.sent) {
        this.toast.warning('Sin dispositivos', 'No se encontró ningún dispositivo activo para la prueba.');
      } else {
        this.toast.info('Prueba enviada', 'Cierra o minimiza esta pestaña para ver la alerta del sistema.');
      }
    } catch {
      this.toast.error('No se pudo enviar la prueba', 'Intenta de nuevo.');
    }
  }
}

