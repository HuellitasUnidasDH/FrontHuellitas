import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ContentReportReason,
  ModerationService,
  ReportTargetType,
} from '../../../core/services/moderation.service';
import { NotificationService } from '../../../core/services/notification.service';

interface ReasonOption {
  value: ContentReportReason;
  label: string;
  hint: string;
}

@Component({
  selector: 'app-report-content-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn overscroll-contain"
      (click)="closed.emit()"
    >
      <div
        class="liquid-glass rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-rose-500/25 space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </div>
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                Moderación Comunitaria
              </p>
              <h3 class="text-base font-black text-slate-900 dark:text-white leading-tight">
                Reportar contenido
              </h3>
            </div>
          </div>

          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800/80 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <!-- Target context summary -->
        <div class="px-3.5 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
          <p class="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
            {{ targetTitle() }}
          </p>
          @if (targetSubtitle()) {
            <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {{ targetSubtitle() }}
            </p>
          }
        </div>

        <!-- Reason selection -->
        <div class="space-y-2">
          <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Motivo del reporte <span class="text-rose-500">*</span>
          </label>
          <div class="space-y-1.5">
            @for (opt of reasonOptions; track opt.value) {
              <label
                class="flex items-start gap-2.5 p-2.5 rounded-2xl border cursor-pointer transition-all"
                [ngClass]="
                  selectedReason() === opt.value
                    ? 'bg-rose-500/10 border-rose-500/40 text-slate-900 dark:text-white'
                    : 'bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                "
              >
                <input
                  type="radio"
                  name="reportReason"
                  [value]="opt.value"
                  [checked]="selectedReason() === opt.value"
                  (change)="selectedReason.set(opt.value)"
                  class="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div class="min-w-0">
                  <span class="block text-xs font-bold leading-snug">{{ opt.label }}</span>
                  <span class="block text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{{ opt.hint }}</span>
                </div>
              </label>
            }
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Detalles para revisión <span class="text-rose-500">*</span>
            </label>
            <span
              class="text-[11px] font-medium tabular-nums"
              [ngClass]="
                trimmedDescription().length >= 10
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              "
            >
              {{ trimmedDescription().length }}/10 min.
            </span>
          </div>
          <textarea
            [ngModel]="description()"
            (ngModelChange)="description.set($event); apiError.set('')"
            (blur)="descriptionTouched.set(true)"
            rows="3"
            maxlength="1000"
            placeholder="Describe qué observaste en la publicación o conversación (ej. solicitan transferencia o datos falsos)..."
            class="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border text-slate-800 dark:text-white focus:outline-none transition-colors"
            [ngClass]="
              showDescriptionError()
                ? 'border-rose-500 focus:border-rose-500'
                : 'border-slate-300 dark:border-slate-700 focus:border-rose-500'
            "
          ></textarea>
          @if (showDescriptionError()) {
            <p class="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              @if (trimmedDescription().length === 0) {
                Explica brevemente el motivo del reporte (faltan 10 caracteres).
              } @else {
                Agrega {{ 10 - trimmedDescription().length }} {{ 10 - trimmedDescription().length === 1 ? 'carácter más' : 'caracteres más' }} para enviar el reporte.
              }
            </p>
          } @else {
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              Tu identidad permanece confidencial para el autor; solo el equipo administrador revisará el caso.
            </p>
          }
        </div>

        @if (apiError()) {
          <div class="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {{ apiError() }}
          </div>
        }

        <!-- Actions -->
        <div class="flex items-center gap-2 pt-1">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="submit()"
            [disabled]="isSubmitting()"
            class="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            @if (isSubmitting()) {
              <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Enviando reporte...</span>
            } @else {
              <span>Enviar reporte a revisión</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ReportContentModalComponent implements OnInit {
  private moderationService = inject(ModerationService);
  private notify = inject(NotificationService);

  targetType = input.required<ReportTargetType>();
  targetId = input.required<string>();
  targetTitle = input.required<string>();
  targetSubtitle = input<string>('');

  closed = output<void>();
  submitted = output<void>();

  selectedReason = signal<ContentReportReason>('INTENTO_DE_COBRO');
  description = signal<string>('');
  descriptionTouched = signal<boolean>(false);
  attemptedSubmit = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  apiError = signal<string>('');

  readonly reasonOptions: ReasonOption[] = [
    {
      value: 'INTENTO_DE_COBRO',
      label: 'Intento de cobro o venta',
      hint: 'Piden dinero, cuota obligatoria o venta disfrazada de adopción.',
    },
    {
      value: 'MALTRATO_ANIMAL',
      label: 'Posible maltrato o negligencia animal',
      hint: 'Imágenes o prácticas que ponen en riesgo el bienestar de la mascota.',
    },
    {
      value: 'DATOS_FALSOS',
      label: 'Información falsa o suplantación',
      hint: 'Fotos ajenas, ubicación inexistente o datos engañosos.',
    },
    {
      value: 'SPAM',
      label: 'Spam o publicidad ajena a Huellitas',
      hint: 'Publicaciones repetitivas o promoción comercial no autorizada.',
    },
    {
      value: 'OTRO',
      label: 'Otro incumplimiento a las normas',
      hint: 'Contenido ofensivo, fraude o situación irregular.',
    },
  ];

  ngOnInit(): void {
    this.apiError.set('');
  }

  trimmedDescription(): string {
    return this.description().trim();
  }

  showDescriptionError(): boolean {
    return (
      (this.descriptionTouched() || this.attemptedSubmit()) &&
      this.trimmedDescription().length < 10
    );
  }

  submit(): void {
    this.attemptedSubmit.set(true);
    this.descriptionTouched.set(true);
    this.apiError.set('');

    if (this.trimmedDescription().length < 10) {
      return;
    }

    this.isSubmitting.set(true);
    this.moderationService
      .createReport({
        targetType: this.targetType(),
        targetId: this.targetId(),
        reason: this.selectedReason(),
        description: this.trimmedDescription(),
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.notify.success(
            'Reporte enviado',
            'Nuestro equipo de administración revisará la publicación a la brevedad.',
          );
          this.submitted.emit();
          this.closed.emit();
        },
        error: (err: { error?: { message?: string | string[] } }) => {
          this.isSubmitting.set(false);
          const rawMsg = err?.error?.message;
          const msg = Array.isArray(rawMsg)
            ? rawMsg[0]
            : rawMsg || 'No se pudo enviar el reporte. Intenta nuevamente.';
          this.apiError.set(msg);
        },
      });
  }
}
