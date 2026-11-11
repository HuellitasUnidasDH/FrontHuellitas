import { Component, inject } from '@angular/core';
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
        class="liquid-glass rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border relative overflow-hidden transition-all"
        [ngClass]="
          push.status() === 'on'
            ? 'border-emerald-500/40'
            : 'border-slate-200/70 dark:border-slate-700/60'
        "
      >
        <div
          class="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-gradient-to-br from-teal-400/20 via-emerald-400/10 to-transparent blur-2xl pointer-events-none"
        ></div>

        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-3.5">
          <div class="flex items-start gap-2.5 sm:gap-3 min-w-0">
            <div
              class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0 shadow-md"
              [ngClass]="
                push.status() === 'on'
                  ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              "
            >
              {{ push.status() === 'on' ? '🔔' : '🔕' }}
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 class="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  Alertas en tu dispositivo
                </h3>
                @if (push.status() === 'on') {
                  <span
                    class="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                  >
                    Activadas ✓
                  </span>
                }
              </div>

              @switch (push.status()) {
                @case ('on') {
                  <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Te avisaremos de mensajes y novedades aunque cierres Huellitas.
                  </p>
                }
                @case ('blocked') {
                  <p class="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Bloqueaste las notificaciones. Para reactivarlas, toca el candado 🔒 junto a la
                    dirección del sitio y permite «Notificaciones».
                  </p>
                }
                @case ('unsupported') {
                  <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    @if (push.needsIosInstall()) {
                      En iPhone/iPad instala Huellitas en tu pantalla de inicio (Compartir → «Agregar a
                      inicio») para recibir alertas.
                    } @else {
                      Este navegador no admite alertas push.
                    }
                  </p>
                }
                @default {
                  <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Recibe un aviso en tu celular o PC cuando te escriban o comenten tus publicaciones,
                    incluso con la app cerrada.
                  </p>
                }
              }
            </div>
          </div>

          <div class="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
            @if (push.status() === 'off') {
              <button
                type="button"
                (click)="push.enable()"
                [disabled]="push.busy()"
                class="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/25 cursor-pointer transition-all active:scale-95"
              >
                {{ push.busy() ? 'Activando…' : '🔔 Activar alertas' }}
              </button>
            } @else if (push.status() === 'on') {
              <button
                type="button"
                (click)="push.disable()"
                [disabled]="push.busy()"
                class="px-3 py-1.5 sm:py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-rose-500/15 hover:text-rose-600 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
              >
                Desactivar
              </button>
            }
          </div>
        </div>

        @if (push.status() === 'on' && push.preferences(); as prefs) {
          <div
            class="relative z-10 mt-3.5 pt-3.5 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap gap-2"
          >
            @for (opt of options; track opt.key) {
              <button
                type="button"
                (click)="toggle(opt.key, prefs[opt.key])"
                class="px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer"
                [ngClass]="
                  prefs[opt.key]
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-500 border-slate-200 dark:border-slate-700 line-through opacity-70'
                "
                [attr.aria-pressed]="prefs[opt.key]"
              >
                <span>{{ opt.icon }}</span>
                <span>{{ opt.label }}</span>
              </button>
            }
          </div>
        }
      </section>
    }
  `,
})
export class PushSettingsCardComponent {
  readonly push = inject(PushNotificationService);

  readonly options: { key: PushPreferenceKey; label: string; icon: string }[] = [
    { key: 'messages', label: 'Mensajes', icon: '💬' },
    { key: 'comments', label: 'Comentarios', icon: '🐾' },
    { key: 'adoptions', label: 'Adopciones', icon: '🏠' },
    { key: 'community', label: 'Comunidad', icon: '🚨' },
  ];

  toggle(key: PushPreferenceKey, current: boolean): void {
    void this.push.updatePreference(key, !current);
  }
}

