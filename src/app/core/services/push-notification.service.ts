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
  readonly testing = signal<boolean>(false);
  readonly lastError = signal<string | null>(null);
  readonly serverEnabled = signal<boolean | null>(true);
  readonly preferences = signal<PushPreferences | null>(null);
  readonly stateReady = signal<boolean>(false);
  readonly promptDismissedVersion = signal<number>(0);

  /** En iPhone/iPad solo funciona si la PWA está instalada en la pantalla de inicio */
  readonly needsIosInstall = computed(() => this.pwa.isIos() && !this.pwa.isStandalone());

  readonly status = computed<PushStatus>(() => {
    if (!this.supported() || this.needsIosInstall()) return 'unsupported';
    if (this.permission() === 'denied') return 'blocked';
    return this.subscribed() ? 'on' : 'off';
  });

  /** Se muestra la invitación en el muro principal si no tiene alertas activadas ni guardó preferencia de rechazo */
  readonly shouldShowWallModal = computed(() => {
    this.promptDismissedVersion(); // reactividad al rechazar o confirmar
    const user = this.auth.currentUser();
    if (!this.auth.isAuthenticated() || !user?.id) return false;
    if (!this.stateReady()) return false;
    if (!this.supported() || this.needsIosInstall()) return false;
    if (this.subscribed()) return false;
    return !this.isPromptSuppressed(user.id);
  });

  private listenersAttached = false;

  constructor() {
    this.detectSupport();

    effect(() => {
      const authenticated = this.auth.isAuthenticated();
      const userId = this.auth.currentUser()?.id;
      untracked(() => {
        if (authenticated && userId) {
          void this.refreshState();
        } else {
          this.subscribed.set(false);
          this.preferences.set(null);
          this.stateReady.set(false);
        }
      });
    });
  }

  public isConfirmedByUser(userId?: string): boolean {
    try {
      const uid = userId || this.auth.currentUser()?.id;
      if (!uid || typeof window === 'undefined') return false;
      return localStorage.getItem(`huellitas_push_confirmed_${uid}`) === 'true';
    } catch {
      return false;
    }
  }

  private markConfirmedByUser(confirmed: boolean): void {
    try {
      const uid = this.auth.currentUser()?.id;
      if (!uid || typeof window === 'undefined') return;
      if (confirmed) {
        localStorage.setItem(`huellitas_push_confirmed_${uid}`, 'true');
      } else {
        localStorage.removeItem(`huellitas_push_confirmed_${uid}`);
      }
      this.promptDismissedVersion.update((v) => v + 1);
    } catch {
      // Ignorar
    }
  }

  public isPromptSuppressed(userId?: string): boolean {
    try {
      const uid = userId || this.auth.currentUser()?.id;
      if (!uid || typeof window === 'undefined') return true;
      const permanentKey = `huellitas_push_declined_${uid}`;
      const sessionKey = `huellitas_push_session_dismissed_${uid}`;
      if (localStorage.getItem(permanentKey) === 'true') return true;
      if (sessionStorage.getItem(sessionKey) === 'true') return true;
      return false;
    } catch {
      return false;
    }
  }

  public declinePrompt(savePreference: boolean): void {
    try {
      const uid = this.auth.currentUser()?.id;
      if (!uid || typeof window === 'undefined') return;
      const permanentKey = `huellitas_push_declined_${uid}`;
      const sessionKey = `huellitas_push_session_dismissed_${uid}`;
      sessionStorage.setItem(sessionKey, 'true');
      if (savePreference) {
        localStorage.setItem(permanentKey, 'true');
        this.toast.info(
          'Preferencia guardada',
          'No volveremos a preguntarte. Puedes activar las alertas cuando quieras desde Notificaciones.',
        );
      }
      this.promptDismissedVersion.update((v) => v + 1);
    } catch {
      this.promptDismissedVersion.update((v) => v + 1);
    }
  }

  private clearSavedDeclinePreference(): void {
    try {
      const uid = this.auth.currentUser()?.id;
      if (!uid || typeof window === 'undefined') return;
      localStorage.removeItem(`huellitas_push_declined_${uid}`);
      sessionStorage.removeItem(`huellitas_push_session_dismissed_${uid}`);
      this.promptDismissedVersion.update((v) => v + 1);
    } catch {
      // Ignorar
    }
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
          if (typeof window !== 'undefined') {
            (window as any).__lastHuellitasSwPushTs = Date.now();
          }
          if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
            this.toast.info(data.title || 'Huellitas', data.body || '');
            this.playNotificationSound();
          }
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

  /** Campana estilo iPhone para notificaciones entrantes */
  public playNotificationSound(): void {
    try {
      if (typeof window === 'undefined') return;
      const audio = new Audio('/sounds/iphone-bell.wav');
      audio.volume = 0.85;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          this.playSynthesizedBell();
        });
      }
    } catch {
      this.playSynthesizedBell();
    }
  }

  /** Síntesis armónica de la campana de 3 notas de iPhone (G#5 -> B5 -> E6) */
  private playSynthesizedBell(): void {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();

      // Notas armónicas de campana cristalina (estilo iOS Tri-tone)
      const notes = [
        { freq: 830.61, time: 0.0, dur: 0.18, vol: 0.22 },  // Sol#5
        { freq: 987.77, time: 0.11, dur: 0.18, vol: 0.25 }, // Si5
        { freq: 1318.51, time: 0.22, dur: 0.65, vol: 0.32 }, // Mi6 (campana brillante)
      ];

      for (const n of notes) {
        const start = ctx.currentTime + n.time;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(n.freq, start);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(n.freq * 2, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(n.vol, start + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(start);
        osc1.stop(start + n.dur);
        osc2.start(start);
        osc2.stop(start + n.dur);
      }

      setTimeout(() => ctx.close().catch(() => {}), 1100);
    } catch {
      // Ignorar: el audio es decorativo
    }
  }

  /**
   * Sincroniza el estado real del navegador con el servidor.
   * Si ya existe una suscripción en este dispositivo la re-asocia al usuario actual
   * (cubre el caso de cambiar de cuenta en un dispositivo compartido).
   */
  async refreshState(): Promise<void> {
    if (!this.supported()) {
      this.stateReady.set(true);
      return;
    }
    try {
      this.permission.set(Notification.permission);
      const reg = await this.getRegistration();
      const existing = reg ? await reg.pushManager.getSubscription() : null;

      if (existing && Notification.permission === 'granted' && this.isConfirmedByUser()) {
        try {
          await this.sendSubscriptionToServer(existing);
        } catch {
          // Continuar aunque el servidor tarde en responder
        }
        this.subscribed.set(true);
        void this.loadPreferences();
      } else {
        this.subscribed.set(false);
      }

      try {
        const keyRes = await firstValueFrom(
          this.http.get<ApiResponse<{ enabled: boolean; publicKey: string | null }>>(
            `${this.apiUrl}/public-key`,
          ),
        );
        this.serverEnabled.set(keyRes?.data?.enabled !== false);
      } catch {
        this.serverEnabled.set(true);
      }
    } catch {
      // Silencioso: el push es una mejora opcional
    } finally {
      this.stateReady.set(true);
    }
  }

  private async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }
      if (reg.active) return reg;

      // Esperar a que el Service Worker termine de instalarse y quede activo antes de usar PushManager
      const worker = reg.installing || reg.waiting;
      if (worker) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 6000);
          const check = () => {
            if (worker.state === 'activated' || worker.state === 'redundant' || reg?.active) {
              clearTimeout(timeout);
              worker.removeEventListener('statechange', check);
              resolve();
            }
          };
          worker.addEventListener('statechange', check);
          check();
        });
      }

      if (reg.active) return reg;

      const readyReg = await Promise.race<ServiceWorkerRegistration | null>([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      return readyReg || reg;
    } catch {
      return null;
    }
  }

  private diagnosePushError(err: any): { title: string; detail: string } {
    const status = err?.status;
    const name = String(err?.name || '');
    const msg = String(err?.error?.message || err?.message || err || '').toLowerCase();

    if (status === 401 || status === 403) {
      return {
        title: 'Sesión requerida',
        detail: 'Vuelve a iniciar sesión para vincular este dispositivo.',
      };
    }
    if (status === 0 || status >= 500) {
      return {
        title: 'Servidor temporalmente no disponible',
        detail: 'El servidor está iniciando o sin conexión. Espera unos segundos y reintenta.',
      };
    }
    if (name === 'NotAllowedError' || msg.includes('denied') || msg.includes('permission')) {
      return {
        title: 'Permiso denegado',
        detail: 'Habilita «Notificaciones» en el candado 🔒 junto a la dirección web.',
      };
    }
    if (msg.includes('no active service worker')) {
      return {
        title: 'Servicio en preparación',
        detail: 'Recarga la página una vez para activar el Service Worker e intenta de nuevo.',
      };
    }
    if (
      name === 'AbortError' ||
      msg.includes('push service') ||
      msg.includes('registration failed') ||
      msg.includes('gcm') ||
      msg.includes('fcm')
    ) {
      return {
        title: 'Navegador bloqueando alertas push',
        detail:
          'Si usas Brave activa «Usar servicios de Google para mensajería push» en Configuración → Privacidad; tampoco funciona en ventanas de incógnito.',
      };
    }
    if (msg.includes('atob') || msg.includes('applicationserverkey')) {
      return {
        title: 'Llave VAPID mal configurada',
        detail: 'La llave pública del servidor tiene un formato inválido o espacios extra.',
      };
    }
    return {
      title: 'No se pudo activar',
      detail: 'Revisa que no estés en modo incógnito, que el servidor esté encendido e intenta de nuevo.',
    };
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
    this.lastError.set(null);
    try {
      const result = await Notification.requestPermission();
      this.permission.set(result);
      if (result !== 'granted') {
        if (result === 'denied') {
          const msg =
            'Haz clic en el icono de ajustes/candado 🔒 junto a la dirección web arriba y permite «Notificaciones».';
          this.lastError.set(msg);
          this.toast.warning('Notificaciones bloqueadas en el navegador', msg);
        }
        return false;
      }

      const keyRes = await firstValueFrom(
        this.http.get<ApiResponse<{ enabled: boolean; publicKey: string | null }>>(
          `${this.apiUrl}/public-key`,
        ),
      );
      const publicKey = keyRes?.data?.publicKey?.trim();
      this.serverEnabled.set(!!keyRes?.data?.enabled);
      if (!keyRes?.data?.enabled || !publicKey) {
        const msg =
          'El servidor aún no tiene cargadas las llaves VAPID (reinicia el backend local o agrégalas en Render).';
        this.lastError.set(msg);
        this.toast.warning('Alertas no disponibles', msg);
        return false;
      }

      const reg = await this.getRegistration();
      if (!reg || !reg.active) {
        const msg =
          'El Service Worker aún se está instalando. Recarga la página e intenta de nuevo.';
        this.lastError.set(msg);
        this.toast.error('No se pudo activar', msg);
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
      this.markConfirmedByUser(true);
      this.clearSavedDeclinePreference();
      this.lastError.set(null);
      this.subscribed.set(true);
      void this.loadPreferences();
      this.toast.success('¡Alertas activadas!', 'Te avisaremos aunque cierres Huellitas.');
      return true;
    } catch (err) {
      const diagnosed = this.diagnosePushError(err);
      this.lastError.set(diagnosed.detail);
      this.toast.error(diagnosed.title, diagnosed.detail);
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
      this.markConfirmedByUser(false);
      this.clearSavedDeclinePreference();
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
    if (this.testing()) return;
    this.testing.set(true);
    try {
      this.playNotificationSound();
      const res = await firstValueFrom(
        this.http.post<ApiResponse<{ sent: number }>>(`${this.apiUrl}/test`, {}),
      );
      if (!res?.data?.sent) {
        this.toast.warning(
          'Sin dispositivos activos',
          'Re-vincula este dispositivo desactivando y volviendo a activar las alertas.',
        );
      } else {
        this.toast.info(
          'Prueba enviada',
          `Se envió a ${res.data.sent} dispositivo(s). Minimiza o cambia de pestaña para ver el aviso del sistema.`,
        );
      }
    } catch {
      this.toast.error('No se pudo enviar la prueba', 'Intenta de nuevo.');
    } finally {
      this.testing.set(false);
    }
  }
}

