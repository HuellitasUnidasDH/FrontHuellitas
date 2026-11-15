import { Injectable, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, NavigationExtras, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Rastrea el historial de navegación dentro de la SPA para que todos los botones
 * "Volver / Regresar" vuelvan al contexto real del usuario con un fallback seguro.
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationHistoryService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  private readonly historyStack = signal<string[]>([]);
  private pendingPopstate = false;

  public readonly currentUrl = computed(() => {
    const stack = this.historyStack();
    return stack.length > 0 ? stack[stack.length - 1] : this.router.url || '/';
  });

  public readonly previousUrl = computed(() => {
    const stack = this.historyStack();
    return stack.length > 1 ? stack[stack.length - 2] : null;
  });

  public readonly canGoBack = computed(() => {
    const prev = this.previousUrl();
    return !!prev && !prev.startsWith('/auth/');
  });

  constructor() {
    const initial = this.router.url;
    if (initial) {
      this.historyStack.set([initial]);
    }

    this.router.events
      .pipe(filter((event): event is NavigationStart => event instanceof NavigationStart))
      .subscribe((event) => {
        this.pendingPopstate = event.navigationTrigger === 'popstate';
      });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nextUrl = event.urlAfterRedirects || event.url;
        const isPop = this.pendingPopstate;
        this.pendingPopstate = false;

        this.historyStack.update((stack) => {
          if (isPop && stack.length > 1) {
            const matchIdx = stack.lastIndexOf(nextUrl, stack.length - 2);
            if (matchIdx >= 0) {
              return stack.slice(0, matchIdx + 1);
            }
          }
          if (stack[stack.length - 1] === nextUrl) {
            return stack;
          }
          const next = [...stack, nextUrl];
          return next.length > 30 ? next.slice(next.length - 30) : next;
        });
      });
  }

  getBackLabel(fallbackLabel = 'Volver'): string {
    const prev = this.previousUrl();
    if (!prev || prev.startsWith('/auth/')) {
      return `← ${fallbackLabel.replace(/^←\s*/, '')}`;
    }

    const cleanPath = prev.split('?')[0].split('#')[0] || '/';
    if (cleanPath === '/') return '← Volver al Muro Principal';
    if (cleanPath === '/adopciones') return '← Volver a Adopciones';
    if (cleanPath === '/perdidas') return '← Volver a Perdidos';
    if (cleanPath === '/mis-adopciones') return '← Volver a Mis Adopciones';
    if (cleanPath === '/panel-rescatista') return '← Volver a Gestión de Adopciones';
    if (cleanPath === '/perfil') return '← Volver a Mi Perfil';
    if (cleanPath === '/pets') return '← Volver a Mis Mascotas';
    if (cleanPath.startsWith('/pets/')) return '← Volver al Expediente';
    if (cleanPath === '/dashboard') return '← Volver al Panel';
    if (cleanPath === '/admin') return '← Volver al Admin';
    if (cleanPath === '/notificaciones') return '← Volver a Notificaciones';
    if (cleanPath === '/mensajes') return '← Volver a Mensajes';
    if (cleanPath === '/groups') return '← Volver a Familias';
    return '← Volver';
  }

  goBack(fallbackCommands: unknown[] = ['/'], extras?: NavigationExtras): void {
    if (this.canGoBack()) {
      this.location.back();
      return;
    }
    void this.router.navigate(fallbackCommands, extras);
  }
}
