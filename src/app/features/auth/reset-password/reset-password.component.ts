import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative">
      <div class="w-full max-w-md liquid-glass rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden transition-all border border-emerald-500/20">

        <!-- Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-2xl shadow-lg shadow-emerald-500/25 mb-3">
            🔑
          </div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Restablecer Contraseña
          </h2>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Crea una nueva contraseña segura para tu cuenta de {{ brand.name }}.
          </p>
        </div>

        @if (!token()) {
          <!-- Error: Falta el token -->
          <div class="text-center space-y-4 py-4 animate-fadeIn">
            <div class="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 text-2xl flex items-center justify-center mx-auto border border-rose-500/30">
              ⚠️
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              Enlace de Recuperación Incompleto
            </h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              No se detectó el código de seguridad en el enlace. Asegúrate de abrir el enlace completo que recibiste en tu correo electrónico.
            </p>
            <div class="pt-2">
              <a
                routerLink="/auth/forgot-password"
                class="inline-block py-2.5 px-5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
              >
                Solicitar un nuevo enlace
              </a>
            </div>
          </div>
        } @else if (resetSuccess()) {
          <!-- Estado de Éxito -->
          <div class="text-center space-y-5 py-3 animate-fadeIn">
            <div class="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-3xl flex items-center justify-center mx-auto border border-emerald-500/30">
              🎉
            </div>
            <div class="space-y-2">
              <h3 class="text-lg font-black text-slate-900 dark:text-white">
                ¡Contraseña Actualizada!
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tu contraseña ha sido restablecida con éxito. Tus sesiones anteriores se cerraron por protección.
              </p>
            </div>
            <div class="pt-2">
              <a
                routerLink="/auth/login"
                class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>🚀</span> Iniciar Sesión Ahora
              </a>
            </div>
          </div>
        } @else {
          <!-- Formulario de Cambio de Contraseña -->
          <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Nueva Contraseña -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nueva Contraseña
              </label>
              <div class="relative flex items-center">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="newPassword"
                  placeholder="Mínimo 6 caracteres"
                  class="w-full pl-4 pr-11 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  [ngClass]="{
                    '!border-rose-500 !ring-2 !ring-rose-500/20': newPasswordField?.invalid && newPasswordField?.touched
                  }"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  [title]="showPassword() ? 'Ocultar' : 'Ver'"
                >
                  @if (showPassword()) {
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                </button>
              </div>
              @if (newPasswordField?.invalid && newPasswordField?.touched) {
                <p class="text-rose-500 dark:text-rose-400 text-xs mt-1">
                  @if (newPasswordField?.hasError('required')) {
                    Ingresa una nueva contraseña (mínimo 6 caracteres).
                  } @else {
                    Tu contraseña es muy corta ({{ (newPasswordField?.value || '').length }}/6): agrega {{ 6 - (newPasswordField?.value || '').length }} más.
                  }
                </p>
              }
            </div>

            <!-- Confirmar Contraseña -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                formControlName="confirmPassword"
                placeholder="Repite tu nueva contraseña"
                class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                [ngClass]="{
                  '!border-rose-500 !ring-2 !ring-rose-500/20': passwordsMismatch() || (confirmPasswordField?.hasError('required') && confirmPasswordField?.touched)
                }"
              />
              @if (confirmPasswordField?.hasError('required') && confirmPasswordField?.touched) {
                <p class="text-rose-500 dark:text-rose-400 text-xs mt-1">
                  Confirma tu nueva contraseña repitiéndola aquí.
                </p>
              } @else if (passwordsMismatch()) {
                <p class="text-rose-500 dark:text-rose-400 text-xs mt-1">
                  Las contraseñas no coinciden.
                </p>
              }
            </div>

            <!-- Botón de Envío -->
            <button
              type="submit"
              [disabled]="isLoading()"
              class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all hover:scale-101 active:scale-99 flex items-center justify-center gap-2 mt-6"
            >
              @if (isLoading()) {
                <span class="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Actualizando contraseña...</span>
              } @else {
                <span>Guardar Nueva Contraseña</span>
              }
            </button>
          </form>

          <div class="mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/80 text-center text-xs text-slate-600 dark:text-slate-400">
            ¿Recordaste tu contraseña actual?
            <a routerLink="/auth/login" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold ml-1">
              Volver al Login
            </a>
          </div>
        }

      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  brand = BRAND_CONFIG;
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);

  token = signal<string>('');
  isLoading = signal<boolean>(false);
  resetSuccess = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  resetForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    if (tokenParam) {
      this.token.set(tokenParam);
    }
  }

  get newPasswordField() {
    return this.resetForm.get('newPassword');
  }

  get confirmPasswordField() {
    return this.resetForm.get('confirmPassword');
  }

  passwordsMismatch(): boolean {
    const p1 = this.newPasswordField?.value;
    const p2 = this.confirmPasswordField?.value;
    return Boolean(p1 && p2 && p1 !== p2 && this.confirmPasswordField?.touched);
  }

  onSubmit(): void {
    if (this.resetForm.invalid || this.passwordsMismatch() || !this.token()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { newPassword } = this.resetForm.getRawValue();
    this.isLoading.set(true);

    this.authService.resetPassword(this.token(), newPassword).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.resetSuccess.set(true);
        this.notify.success(res?.message || 'Contraseña restablecida exitosamente');
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'El enlace es inválido o ha expirado';
        this.notify.error(msg);
      },
    });
  }
}
