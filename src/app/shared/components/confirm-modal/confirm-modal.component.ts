import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (confirmService.state().isOpen) {
      <div
        class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl transition-all duration-300 animate-fade-in"
        (click)="onBackdropClick($event)"
      >
        <div
          class="relative w-full max-w-md bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 overflow-hidden transition-all transform scale-100 animate-scale-up"
          (click)="$event.stopPropagation()"
        >
          <!-- Ambient Decorative Glow -->
          <div
            class="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-40"
            [ngClass]="ambientGlowClass"
          ></div>

          <!-- Header with Icon & Title -->
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border shadow-inner"
              [ngClass]="iconContainerClasses"
            >
              {{ confirmService.state().options.icon }}
            </div>
            <div class="flex-1 min-w-0 pt-0.5">
              <h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {{ confirmService.state().options.title }}
              </h3>
              <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                Huellitas DH · Confirmación
              </p>
            </div>
          </div>

          <!-- Message Body -->
          <div class="space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <p class="font-medium whitespace-pre-line text-slate-800 dark:text-slate-200">
              {{ confirmService.state().options.message }}
            </p>

            <!-- Submessage / Warning explanation box if provided -->
            @if (confirmService.state().options.submessage) {
              <div
                class="p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border font-medium"
                [ngClass]="submessageClasses"
              >
                <span class="text-base leading-none mt-0.5">📌</span>
                <span class="whitespace-pre-line leading-relaxed">
                  {{ confirmService.state().options.submessage }}
                </span>
              </div>
            }

            <!-- Input prompt if required -->
            @if (confirmService.state().options.hasInput) {
              <div class="pt-2">
                @if (confirmService.state().options.inputLabel) {
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {{ confirmService.state().options.inputLabel }}
                  </label>
                }
                <input
                  type="text"
                  [placeholder]="confirmService.state().options.inputPlaceholder || 'Escribe aquí...'"
                  [ngModel]="confirmService.state().currentInputValue"
                  (ngModelChange)="confirmService.updateInputValue($event)"
                  (keydown.enter)="confirmService.handleConfirm()"
                  class="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all shadow-inner"
                  autofocus
                />
              </div>
            }
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="confirmService.handleCancel()"
              class="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
            >
              {{ confirmService.state().options.cancelText }}
            </button>

            <button
              type="button"
              (click)="confirmService.handleConfirm()"
              class="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2"
              [ngClass]="confirmButtonClasses"
            >
              {{ confirmService.state().options.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-scale-up {
      animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `],
})
export class ConfirmationModalComponent {
  confirmService = inject(ConfirmService);

  get confirmButtonClasses(): string {
    const type = this.confirmService.state().options.type || 'info';
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-red-600/40 border border-red-500/60 ring-2 ring-red-500/20';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 shadow-amber-500/40 border border-amber-400/60 ring-2 ring-amber-500/20';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/40 border border-emerald-500/60 ring-2 ring-emerald-500/20';
      default:
        return 'bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white shadow-cyan-600/40 border border-cyan-500/60 ring-2 ring-cyan-500/20';
    }
  }

  get iconContainerClasses(): string {
    const type = this.confirmService.state().options.type || 'info';
    switch (type) {
      case 'danger':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 ring-4 ring-rose-500/10';
      case 'warning':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 ring-4 ring-amber-500/10';
      case 'success':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/10';
      default:
        return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 ring-4 ring-cyan-500/10';
    }
  }

  get submessageClasses(): string {
    const type = this.confirmService.state().options.type || 'info';
    switch (type) {
      case 'danger':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300';
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300';
    }
  }

  get ambientGlowClass(): string {
    const type = this.confirmService.state().options.type || 'info';
    switch (type) {
      case 'danger':
        return 'bg-rose-500';
      case 'warning':
        return 'bg-amber-500';
      case 'success':
        return 'bg-emerald-500';
      default:
        return 'bg-cyan-500';
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmService.state().isOpen) {
      this.confirmService.handleCancel();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    this.confirmService.handleCancel();
  }
}
