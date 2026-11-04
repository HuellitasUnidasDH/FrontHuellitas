import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PrivacyNoticeModalComponent } from '../../../shared/components/privacy-modal/privacy-modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PrivacyNoticeModalComponent],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative">
      <div class="w-full max-w-md liquid-glass rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-2xl shadow-lg shadow-emerald-500/25 mb-3">
            🐾
          </div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Acceso Seguro</h2>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">Ingresa tus credenciales para administrar tus mascotas</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Correo -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              formControlName="email"
              placeholder="tu@email.com"
              class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              [ngClass]="{
                '!border-rose-500 !ring-2 !ring-rose-500/20': emailField?.invalid && emailField?.touched
              }"
            />
            @if (emailField?.invalid && emailField?.touched) {
              <p class="text-rose-500 dark:text-rose-400 text-xs mt-1">Ingresa un correo electrónico válido</p>
            }
          </div>

          <!-- Contraseña con Ojito -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div class="relative flex items-center">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                class="w-full pl-4 pr-11 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                [ngClass]="{
                  '!border-rose-500 !ring-2 !ring-rose-500/20': passwordField?.invalid && passwordField?.touched
                }"
              />
              <button
                type="button"
                (click)="togglePasswordVisibility()"
                class="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                [title]="showPassword() ? 'Ocultar contraseña' : 'Ver contraseña'"
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
            @if (passwordField?.invalid && passwordField?.touched) {
              <p class="text-rose-500 dark:text-rose-400 text-xs mt-1">La contraseña es requerida</p>
            }

            <!-- Fila Recuérdame + Olvidaste tu contraseña -->
            <div class="flex items-center justify-between gap-2 pt-2.5">
              <label class="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  formControlName="rememberMe"
                  class="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Recuérdame (No cerrar sesión)
                </span>
              </label>

              <a
                routerLink="/auth/forgot-password"
                class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:underline transition-colors cursor-pointer flex-shrink-0"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
              Si no activas "Recuérdame", tu sesión se cerrará automáticamente al salir de la aplicación.
            </p>
          </div>

          <!-- Botón de Envío -->
          <button
            type="submit"
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all hover:scale-101 active:scale-99 flex items-center justify-center gap-2 mt-6"
          >
            @if (isLoading()) {
              <span class="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              <span>Validando credenciales...</span>
            } @else {
              <span>Ingresar al Sistema</span>
            }
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-slate-300/50 dark:border-slate-800/80 text-center text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div>
            ¿No tienes una cuenta?
            <a routerLink="/auth/register" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold ml-1">
              Regístrate aquí
            </a>
          </div>

          <div class="text-[11px] text-slate-400">
            Al acceder, confirmas tu apego al
            <button
              type="button"
              (click)="openPrivacyModal()"
              class="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-500 cursor-pointer ml-1"
            >
              Aviso de Privacidad
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Reutilizable de Aviso de Privacidad -->
      <app-privacy-modal
        [isOpen]="isPrivacyModalOpen()"
        (accepted)="isPrivacyModalOpen.set(false)"
        (closed)="isPrivacyModalOpen.set(false)"
      />
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  showPassword = signal(false);
  isPrivacyModalOpen = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [true],
  });

  get emailField() {
    return this.loginForm.get('email');
  }

  get passwordField() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  openPrivacyModal(): void {
    this.isPrivacyModalOpen.set(true);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password, rememberMe } = this.loginForm.value;

    this.authService
      .login({ email: email!, password: password!, rememberMe: Boolean(rememberMe) })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }
}
