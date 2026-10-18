import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative">
      <div class="w-full max-w-md liquid-glass rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden transition-all border border-emerald-500/20">
        
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-2xl shadow-lg shadow-emerald-500/25 mb-3">
            🔐
          </div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Recuperar Contraseña
          </h2>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5 max-w-xs mx-auto">
            Ingresa tu correo registrado en {{ brand.name }} para recibir instrucciones seguras.
          </p>
        </div>

        @if (emailSent()) {
          <!-- Estado de Éxito / Confirmación -->
          <div class="space-y-5 text-center animate-fadeIn py-2">
            <div class="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-3xl flex items-center justify-center mx-auto border border-emerald-500/30">
              📬
            </div>

            <div class="space-y-2">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                ¡Revisa tu bandeja de entrada!
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Hemos enviado un correo a <strong class="text-slate-900 dark:text-white">{{ submittedEmail() }}</strong> con un enlace para restablecer tu contraseña.
              </p>
            </div>

            <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-300 text-left space-y-1">
              <div class="font-bold flex items-center gap-1.5">
                <span>⏱️</span> El enlace expirará en 30 minutos
              </div>
              <p class="text-[10px] text-slate-600 dark:text-slate-400">
                Si no lo encuentras en unos instantes, por favor revisa tu carpeta de <em>Correo no deseado</em> o <em>Spam</em>.
              </p>
            </div>

            <div class="pt-2 flex flex-col gap-2">
              <a
                routerLink="/auth/login"
                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <span>←</span> Volver a Iniciar Sesión
              </a>

              <button
                type="button"
                (click)="resetForm()"
                class="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer py-1"
              >
                Intentar con otro correo electrónico
              </button>
            </div>
          </div>
        } @else {
          <!-- Formulario de Solicitud -->
          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Correo Electrónico Registrado
              </label>
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">✉️</span>
                <input
                  type="email"
                  formControlName="email"
                  placeholder="ejemplo@correo.com"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  [ngClass]="{
                    '!border-rose-500 !ring-2 !ring-rose-500/20': emailField?.invalid && emailField?.touched
                  }"
                />
              </div>
              @if (emailField?.invalid && emailField?.touched) {
                <p class="text-rose-500 dark:text-rose-400 text-xs mt-1">
                  Ingresa un correo electrónico con formato válido
                </p>
              }
            </div>

            <!-- Botón de Envío -->
            <button
              type="submit"
              [disabled]="forgotForm.invalid || isLoading()"
              class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all hover:scale-101 active:scale-99 flex items-center justify-center gap-2 mt-6"
            >
              @if (isLoading()) {
                <span class="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Enviando enlace seguro...</span>
              } @else {
                <span>Enviar Enlace de Recuperación</span>
              }
            </button>
          </form>

          <div class="mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/80 text-center text-xs text-slate-600 dark:text-slate-400">
            ¿Recordaste tu contraseña?
            <a routerLink="/auth/login" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold ml-1">
              Inicia sesión aquí
            </a>
          </div>
        }

      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  brand = BRAND_CONFIG;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);

  isLoading = signal<boolean>(false);
  emailSent = signal<boolean>(false);
  submittedEmail = signal<string>('');

  forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get emailField() {
    return this.forgotForm.get('email');
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const email = this.forgotForm.getRawValue().email.trim();
    this.isLoading.set(true);

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.submittedEmail.set(email);
        this.emailSent.set(true);
        this.notify.success(res?.message || 'Enlace de recuperación generado');
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Ocurrió un error al procesar la solicitud';
        this.notify.error(msg);
      },
    });
  }

  resetForm(): void {
    this.emailSent.set(false);
    this.forgotForm.reset();
  }
}
