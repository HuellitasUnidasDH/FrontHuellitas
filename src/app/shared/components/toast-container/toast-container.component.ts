import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastMessage } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Contenedor adaptativo: en móvil flota arriba del dock de navegación (bottom-20) centrado con márgenes simétricos (left-3 right-3) -->
    <div
      class="fixed bottom-20 sm:bottom-5 left-3 right-3 sm:left-auto sm:right-5 z-50 flex flex-col gap-2 max-w-none sm:max-w-sm pointer-events-none"
    >
      @for (toast of notificationService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto p-3 sm:p-4 rounded-2xl shadow-xl border backdrop-blur-xl transition-all duration-300 transform translate-y-0 flex items-start gap-2.5 sm:gap-3"
          [ngClass]="{
            'bg-emerald-950/92 border-emerald-500/40 text-emerald-100 shadow-emerald-500/10':
              toast.type === 'success',
            'bg-rose-950/92 border-rose-500/40 text-rose-100 shadow-rose-500/10':
              toast.type === 'error',
            'bg-amber-950/92 border-amber-500/40 text-amber-100 shadow-amber-500/10':
              toast.type === 'warning',
            'bg-slate-900/92 border-cyan-500/40 text-cyan-100 shadow-cyan-500/10':
              toast.type === 'info'
          }"
        >
          <!-- Icono estilizado y compacto -->
          <div
            class="w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black shrink-0 mt-0.5"
            [ngClass]="{
              'bg-emerald-500/20 text-emerald-300': toast.type === 'success',
              'bg-rose-500/20 text-rose-300': toast.type === 'error',
              'bg-amber-500/20 text-amber-300': toast.type === 'warning',
              'bg-cyan-500/20 text-cyan-300': toast.type === 'info'
            }"
          >
            @if (toast.type === 'success') { <span>✓</span> }
            @else if (toast.type === 'error') { <span>✕</span> }
            @else if (toast.type === 'warning') { <span>⚠</span> }
            @else { <span>ℹ</span> }
          </div>

          <!-- Título y Mensaje ajustados a la pantalla móvil sin desbordes -->
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-xs sm:text-sm tracking-tight leading-snug">
              {{ toast.title }}
            </h4>
            @if (toast.message) {
              <p class="text-[11px] sm:text-xs opacity-90 mt-0.5 leading-relaxed break-words line-clamp-3">
                {{ toast.message }}
              </p>
            }
          </div>

          <!-- Botón de Cierre -->
          <button
            type="button"
            (click)="notificationService.remove(toast.id)"
            class="w-6 h-6 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 text-xs font-bold shrink-0 ml-1 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  notificationService = inject(NotificationService);
}
