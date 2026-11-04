import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  /** Indica si el navegador tiene listo el prompt nativo de instalación (Chrome/Edge/Android) */
  canPromptNatively = signal<boolean>(false);

  /** Indica si la aplicación ya está instalada y corriendo como App independiente */
  isStandalone = signal<boolean>(false);

  /** Indica si el usuario ocultó temporalmente el banner flotante */
  bannerDismissed = signal<boolean>(false);

  /** Controla el modal de instrucciones paso a paso (para iOS Safari o navegadores de escritorio) */
  showInstructionsModal = signal<boolean>(false);

  /** Detecta si es iPhone / iPad */
  isIos = signal<boolean>(false);

  private deferredPrompt: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkStandaloneMode();
      this.detectPlatform();
      this.initListeners();
    }
  }

  private checkStandaloneMode(): void {
    const isStandaloneMatch =
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as any)?.standalone === true;
    this.isStandalone.set(isStandaloneMatch);

    try {
      const dismissed =
        typeof sessionStorage !== 'undefined' &&
        typeof sessionStorage?.getItem === 'function' &&
        sessionStorage.getItem('huellitas_pwa_banner_dismissed') === '1';
      this.bannerDismissed.set(dismissed);
    } catch {
      this.bannerDismissed.set(false);
    }
  }

  private detectPlatform(): void {
    const ua = (window.navigator?.userAgent || '').toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    this.isIos.set(isIosDevice);
  }

  private initListeners(): void {
    // 1. Verificar si index.html ya capturó el evento antes de inicializar Angular
    const globalPrompt = (window as any).__deferredPwaPrompt;
    if (globalPrompt) {
      this.deferredPrompt = globalPrompt;
      this.canPromptNatively.set(true);
    }

    // 2. Escuchar eventos posteriores
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      (window as any).__deferredPwaPrompt = e;
      this.deferredPrompt = e;
      this.canPromptNatively.set(true);
    });

    window.addEventListener('huellitas-pwa-ready', () => {
      const prompt = (window as any).__deferredPwaPrompt;
      if (prompt) {
        this.deferredPrompt = prompt;
        this.canPromptNatively.set(true);
      }
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      (window as any).__deferredPwaPrompt = null;
      this.canPromptNatively.set(false);
      this.isStandalone.set(true);
      this.showInstructionsModal.set(false);
    });
  }

  /**
   * Dispara la ventana nativa de instalación (si está disponible) o abre la guía interactiva
   */
  async installPwa(): Promise<void> {
    const promptEvent = this.deferredPrompt || (window as any).__deferredPwaPrompt;

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult?.outcome === 'accepted') {
          this.deferredPrompt = null;
          (window as any).__deferredPwaPrompt = null;
          this.canPromptNatively.set(false);
        }
      } catch {
        this.showInstructionsModal.set(true);
      }
    } else {
      // En iOS (Safari) o cuando el navegador muestra el ícono en la barra de direcciones
      this.showInstructionsModal.set(true);
    }
  }

  dismissBanner(): void {
    this.bannerDismissed.set(true);
    try {
      if (typeof sessionStorage !== 'undefined' && typeof sessionStorage?.setItem === 'function') {
        sessionStorage.setItem('huellitas_pwa_banner_dismissed', '1');
      }
    } catch {
      // Ignore storage error
    }
  }

  closeInstructionsModal(): void {
    this.showInstructionsModal.set(false);
  }
}
