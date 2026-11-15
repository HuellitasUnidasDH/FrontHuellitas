import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PushNotificationService,
  PushPreferenceKey,
} from '../../core/services/push-notification.service';

@Component({
  selector: 'app-push-settings-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (push.supported()) {
      <section
        class="liquid-glass rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 border transition-colors"
        [ngClass]="
          push.status() === 'on'
            ? 'border-emerald-500/25 dark:border-emerald-500/30'
            : 'border-slate-200/80 dark:border-slate-800/80'
        "
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-start sm:items-center gap-3 min-w-0">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
              [ngClass]="
                push.status() === 'on'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80'
              "
            >
              @if (push.status() === 'on') {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  />
                </svg>
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.596m10.245 10.179L6.53 6.596M3 3l3.53 3.596"
                  />
                </svg>
              }
            </div>

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Alertas en tu dispositivo
                </h3>

                @if (push.status() === 'on') {
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Activas
                  </span>
                  @if (push.preferences(); as prefs) {
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">
                      · {{ prefs.devices || 1 }}
                      {{ (prefs.devices || 1) === 1 ? 'dispositivo' : 'dispositivos' }}
                    </span>
                  }
                } @else if (push.serverEnabled() === false) {
                  <span
                    class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/12 text-amber-700 dark:text-amber-300"
                  >
                    Pendiente en servidor
                  </span>
                }
              </div>

              @switch (push.status()) {
                @case ('on') {
                  <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Recibes avisos en tiempo real aunque cierres Huellitas.
                  </p>
                }
                @case ('blocked') {
                  <p class="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Permiso bloqueado en el navegador. Toca el ícono junto a la URL para permitir
                    notificaciones.
                  </p>
                }
                @case ('unsupported') {
                  <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    @if (push.needsIosInstall()) {
                      En iPhone/iPad agrega Huellitas a tu pantalla de inicio (Compartir → Agregar a
                      inicio) para activar alertas.
                    } @else {
                      Este navegador no admite notificaciones push.
                    }
                  </p>
                }
                @default {
                  <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Actívalas para enterarte de mensajes directos, comentarios y avances de adopción.
                  </p>
                }
              }
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 self-start sm:self-center flex-shrink-0">
            @if (push.status() === 'off') {
              <button
                type="button"
                (click)="push.enable()"
                [disabled]="push.busy()"
                class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-50 text-white dark:text-slate-950 text-xs font-bold shadow-sm cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  />
                </svg>
                <span>{{ push.busy() ? 'Activando…' : 'Activar alertas' }}</span>
              </button>
            } @else if (push.status() === 'blocked') {
              <button
                type="button"
                (click)="push.refreshState()"
                class="px-3 py-1.5 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/25 text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                  />
                </svg>
                <span>Verificar permiso</span>
              </button>
            } @else if (push.status() === 'on') {
              <button
                type="button"
                (click)="showPreferences.set(!showPreferences())"
                [attr.aria-expanded]="showPreferences()"
                class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                  />
                </svg>
                <span>{{ showPreferences() ? 'Ocultar' : 'Preferencias' }}</span>
              </button>
              <button
                type="button"
                (click)="push.disable()"
                [disabled]="push.busy()"
                class="px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
              >
                Desactivar
              </button>
            }
          </div>
        </div>

        @if (push.lastError(); as errMsg) {
          <div
            class="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2"
          >
            <div class="flex items-center gap-2 min-w-0">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              <span class="truncate">{{ errMsg }}</span>
            </div>
            <button
              type="button"
              (click)="push.lastError.set(null)"
              class="p-1 rounded-lg text-rose-600 dark:text-rose-300 hover:bg-rose-500/15 cursor-pointer flex-shrink-0"
              aria-label="Cerrar aviso"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        }

        @if (push.status() === 'on' && showPreferences() && push.preferences(); as prefs) {
          <div class="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
            <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Recibir alertas de:
            </span>
            <div class="flex flex-wrap gap-1.5">
              @for (opt of options; track opt.key) {
                <button
                  type="button"
                  (click)="toggle(opt.key, prefs[opt.key])"
                  class="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer"
                  [ngClass]="
                    prefs[opt.key]
                      ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/70 opacity-75'
                  "
                  [attr.aria-pressed]="prefs[opt.key]"
                >
                  @switch (opt.key) {
                    @case ('messages') {
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                      </svg>
                    }
                    @case ('comments') {
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                    }
                    @case ('adoptions') {
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                    }
                    @default {
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                    }
                  }
                  <span>{{ opt.label }}</span>
                </button>
              }
            </div>
          </div>
        }
      </section>
    }
  `,
})
export class PushSettingsCardComponent {
  readonly push = inject(PushNotificationService);
  readonly showPreferences = signal(false);

  readonly options: { key: PushPreferenceKey; label: string }[] = [
    { key: 'messages', label: 'Mensajes' },
    { key: 'comments', label: 'Comentarios' },
    { key: 'adoptions', label: 'Adopciones' },
    { key: 'community', label: 'Comunidad' },
  ];

  toggle(key: PushPreferenceKey, current: boolean): void {
    void this.push.updatePreference(key, !current);
  }
}
