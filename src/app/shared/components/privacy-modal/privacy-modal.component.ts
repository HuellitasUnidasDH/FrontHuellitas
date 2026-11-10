import { Component, EventEmitter, Input, Output, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-privacy-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <!-- Super-layer overlay (z-[999]) with full backdrop blur and dimming to completely cover everything including floating navbar -->
      <div class="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-2xl overflow-hidden transition-all duration-300 animate-fade-in">
        <div
          class="w-full h-full max-h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col overflow-hidden transition-all my-auto"
        >
          <!-- Header -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/80">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                📜
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {{ authService.privacyPolicy().title }}
                </h3>
                <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Versión: {{ authService.privacyPolicy().version }} · Cumplimiento LFPDPPP & GDPR
                </span>
              </div>
            </div>

            <!-- Solo mostrar botón de cerrar si NO es de aceptación obligatoria -->
            @if (!isMandatory) {
              <button
                type="button"
                (click)="onClose()"
                class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                ✕
              </button>
            }
          </div>

          <!-- Alerta de aceptación mandatoria si aplica -->
          @if (isMandatory) {
            <div class="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <span class="text-base">⚠️</span>
              <span>
                <strong>Actualización de Términos Requerida ({{ authService.privacyPolicy().version }}):</strong> Hemos actualizado nuestro Aviso de Privacidad. Debes leer y aceptar los términos para continuar utilizando la aplicación.
              </span>
            </div>
          }

          <!-- Legal Content Body (Scrollable) -->
          <div class="flex-1 overflow-y-auto py-4 pr-2 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar">
            
            @if (authService.privacyPolicy().introBanner) {
              <section class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <p class="font-semibold whitespace-pre-line">
                  {{ authService.privacyPolicy().introBanner }}
                </p>
              </section>
            }

            <div class="space-y-4">
              @for (block of formattedBlocks(); track $index) {
                <div class="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                  @if (block.heading) {
                    <h4 class="font-bold text-sm text-white mb-1.5">
                      {{ block.heading }}
                    </h4>
                  }
                  <p class="whitespace-pre-line text-slate-300 leading-relaxed">{{ block.body }}</p>
                </div>
              }
            </div>

          </div>

          <!-- Footer Actions -->
          <div class="pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                id="modalCheckAccept"
                [(ngModel)]="isTermsCheckboxChecked"
                class="w-4 h-4 rounded text-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <label for="modalCheckAccept" class="cursor-pointer select-none">
                He leído y acepto las cláusulas legales y el tratamiento de datos.
              </label>
            </div>

            <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              @if (!isMandatory) {
                <button
                  type="button"
                  (click)="onClose()"
                  class="px-4 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              }

              <button
                type="button"
                (click)="onAccept()"
                [disabled]="!isTermsCheckboxChecked"
                class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all hover:scale-102 active:scale-98 flex items-center gap-1.5"
              >
                <span>Aceptar y Continuar</span>
                <span>✓</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(16, 185, 129, 0.3);
      border-radius: 9999px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(16, 185, 129, 0.6);
    }
  `]
})
export class PrivacyNoticeModalComponent implements OnChanges, OnDestroy {
  authService = inject(AuthService);

  @Input() isOpen = false;
  @Input() isMandatory = false;
  @Output() accepted = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isTermsCheckboxChecked = false;

  formattedBlocks(): Array<{ heading: string; body: string }> {
    const raw = (this.authService.privacyPolicy().content || '').trim();
    if (!raw) return [];
    const sections = raw.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    return sections.map((section) => {
      const lines = section.split('\n');
      if (lines.length > 1 && lines[0].trim().length <= 95 && !lines[0].trim().startsWith('•')) {
        return {
          heading: lines[0].trim(),
          body: lines.slice(1).join('\n').trim(),
        };
      }
      return {
        heading: '',
        body: section,
      };
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.authService.refreshPrivacyPolicy();
      }
      if (typeof document !== 'undefined') {
        if (this.isOpen) {
          document.body.classList.add('privacy-modal-active');
          document.body.style.overflow = 'hidden';
          document.body.style.touchAction = 'none';
        } else {
          document.body.classList.remove('privacy-modal-active');
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('privacy-modal-active');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  }

  onAccept(): void {
    this.accepted.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}
