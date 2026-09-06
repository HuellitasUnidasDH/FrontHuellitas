import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastMessage } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 flex items-start gap-3"
          [ngClass]="{
            'bg-emerald-950/90 border-emerald-500/30 text-emerald-100': toast.type === 'success',
            'bg-rose-950/90 border-rose-500/30 text-rose-100': toast.type === 'error',
            'bg-amber-950/90 border-amber-500/30 text-amber-100': toast.type === 'warning',
            'bg-slate-900/90 border-cyan-500/30 text-cyan-100': toast.type === 'info'
          }"
        >
          <div class="mt-0.5 text-lg font-bold">
            @if (toast.type === 'success') { <span>✓</span> }
            @else if (toast.type === 'error') { <span>✕</span> }
            @else if (toast.type === 'warning') { <span>⚠</span> }
            @else { <span>ℹ</span> }
          </div>

          <div class="flex-1">
            <h4 class="font-semibold text-sm tracking-wide">{{ toast.title }}</h4>
            @if (toast.message) {
              <p class="text-xs opacity-85 mt-0.5 leading-relaxed">{{ toast.message }}</p>
            }
          </div>

          <button
            (click)="notificationService.remove(toast.id)"
            class="opacity-60 hover:opacity-100 text-sm font-bold ml-1 transition-opacity cursor-pointer"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  notificationService = inject(NotificationService);
}
