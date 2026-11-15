import { Component, EventEmitter, Input, Output, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ScrollLockService } from '../../../core/services/scroll-lock.service';

@Component({
  selector: 'app-privacy-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-[999] flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto overscroll-contain transition-all duration-200 animate-fade-in"
        (click)="!isMandatory ? onClose() : null"
      >
        <div
          (click)="$event.stopPropagation()"
          class="w-full max-h-[92dvh] sm:max-h-[88dvh] sm:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl flex flex-col overflow-hidden my-auto"
        >
          <!-- Header -->
          <div class="flex items-start justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center justify-center flex-shrink-0"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  />
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {{ authService.privacyPolicy().title }}
                </h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  Versión {{ authService.privacyPolicy().version }} · Cumplimiento LFPDPPP y GDPR
                </p>
              </div>
            </div>

            @if (!isMandatory) {
              <button
                type="button"
                (click)="onClose()"
                class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
                title="Cerrar ventana"
                aria-label="Cerrar aviso de privacidad"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            }
          </div>

          <!-- Status / Mandatory Banner -->
          @if (isMandatory) {
            <div class="mt-3 p-3 rounded-xl bg-amber-500/12 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              <span>
                <strong>Actualización requerida ({{ authService.privacyPolicy().version }}):</strong> Lee y acepta los términos vigentes para continuar usando tu cuenta.
              </span>
            </div>
          } @else if (authService.isAuthenticated()) {
            <div class="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>
                Ya aceptaste la versión vigente (<strong>{{ authService.privacyPolicy().version }}</strong>).
                @if (authService.currentUser()?.privacyAcceptedAt; as acceptedDate) {
                  <span class="text-emerald-700/80 dark:text-emerald-300/80">
                    · Registrado el {{ acceptedDate | date: 'mediumDate' }}
                  </span>
                }
              </span>
            </div>
          }

          <!-- Legal Content Body (Scrollable) -->
          <div class="flex-1 min-h-0 overflow-y-auto py-4 pr-1.5 space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed custom-scrollbar">
            @if (authService.privacyPolicy().introBanner) {
              <section class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                <p class="font-medium whitespace-pre-line">
                  {{ authService.privacyPolicy().introBanner }}
                </p>
              </section>
            }

            <div class="space-y-3">
              @for (block of formattedBlocks(); track block.heading + '-' + $index) {
                <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  @if (block.heading) {
                    <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1.5">
                      {{ block.heading }}
                    </h4>
                  }
                  <p class="whitespace-pre-line text-slate-600 dark:text-slate-300 leading-relaxed">{{ block.body }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            @if (isMandatory) {
              <label for="modalCheckAccept" class="flex items-start sm:items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="modalCheckAccept"
                  [checked]="isTermsCheckboxChecked"
                  (change)="isTermsCheckboxChecked = $any($event.target).checked"
                  class="mt-0.5 sm:mt-0 w-4 h-4 rounded text-emerald-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <span>He leído y acepto las cláusulas legales y el tratamiento de datos.</span>
              </label>

              <button
                type="button"
                (click)="onAccept()"
                [disabled]="!isTermsCheckboxChecked"
                class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                <span>Aceptar y Continuar</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </button>
            } @else {
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                @if (authService.isAuthenticated()) {
                  Puedes consultar este aviso en cualquier momento desde el pie de página.
                } @else {
                  Documento informativo. Al crear una cuenta o iniciar sesión confirmarás su aceptación.
                }
              </p>

              <button
                type="button"
                (click)="onClose()"
                class="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
              >
                Cerrar
              </button>
            }
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
      background: rgba(16, 185, 129, 0.35);
      border-radius: 9999px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(16, 185, 129, 0.6);
    }
  `]
})
export class PrivacyNoticeModalComponent implements OnChanges, OnDestroy {
  authService = inject(AuthService);
  private readonly scrollLock = inject(ScrollLockService);
  private readonly lockKey = `privacy-modal-${Math.random().toString(36).slice(2, 8)}`;

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
        this.isTermsCheckboxChecked = false;
        this.authService.refreshPrivacyPolicy();
        this.scrollLock.lock(this.lockKey, 'privacy');
      } else {
        this.scrollLock.unlock(this.lockKey, 'privacy');
      }
    }
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock(this.lockKey, 'privacy');
  }

  onAccept(): void {
    if (!this.isMandatory || !this.isTermsCheckboxChecked) return;
    this.accepted.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}
