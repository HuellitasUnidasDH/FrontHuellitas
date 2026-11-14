import { Injectable } from '@angular/core';

export type ScrollLockChannel = 'modal' | 'privacy' | 'drawer';

/**
 * Servicio centralizado y con conteo de referencias para bloquear el scroll
 * del documento de fondo cuando se abren modales o el menú móvil.
 * Evita conflictos entre modales anidados (ej. modal de confirmación sobre otro modal).
 */
@Injectable({
  providedIn: 'root',
})
export class ScrollLockService {
  private readonly modalKeys = new Set<string>();
  private readonly privacyKeys = new Set<string>();
  private readonly drawerKeys = new Set<string>();

  lock(key: string, channel: ScrollLockChannel = 'modal'): void {
    this.getSet(channel).add(key);
    this.syncDom();
  }

  unlock(key: string, channel: ScrollLockChannel = 'modal'): void {
    this.getSet(channel).delete(key);
    this.syncDom();
  }

  setLocked(key: string, locked: boolean, channel: ScrollLockChannel = 'modal'): void {
    if (locked) {
      this.lock(key, channel);
    } else {
      this.unlock(key, channel);
    }
  }

  unlockPrefix(prefix: string, channel?: ScrollLockChannel): void {
    const channels: ScrollLockChannel[] = channel ? [channel] : ['modal', 'privacy', 'drawer'];
    for (const ch of channels) {
      const set = this.getSet(ch);
      for (const item of Array.from(set)) {
        if (item.startsWith(prefix)) {
          set.delete(item);
        }
      }
    }
    this.syncDom();
  }

  private getSet(channel: ScrollLockChannel): Set<string> {
    if (channel === 'privacy') return this.privacyKeys;
    if (channel === 'drawer') return this.drawerKeys;
    return this.modalKeys;
  }

  private syncDom(): void {
    if (typeof document === 'undefined') return;

    const hasModal = this.modalKeys.size > 0;
    const hasPrivacy = this.privacyKeys.size > 0;
    const hasDrawer = this.drawerKeys.size > 0;
    const anyLocked = hasModal || hasPrivacy || hasDrawer;

    document.body.classList.toggle('modal-open', hasModal);
    document.body.classList.toggle('privacy-modal-active', hasPrivacy);
    document.body.classList.toggle('mobile-drawer-open', hasDrawer);
    document.documentElement.classList.toggle('modal-scroll-lock', anyLocked);

    // Clear inline locks previously set on body so class-driven styles stay consistent
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }
}
