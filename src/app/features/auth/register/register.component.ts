import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PrivacyNoticeModalComponent } from '../../../shared/components/privacy-modal/privacy-modal.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PrivacyNoticeModalComponent],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative">
      <div class="w-full max-w-lg liquid-glass rounded-3xl p-6 sm:p-9 shadow-2xl relative overflow-hidden transition-all">
        
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 font-bold text-xl shadow-lg shadow-emerald-500/25 mb-3">
            🐾
          </div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Crear Cuenta</h2>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">Completa los datos para registrar a tus mascotas de forma segura</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
          
          <!-- Nombre Completo -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Nombre Completo *
              </label>
              @if (fullNameField?.valid && fullNameField?.touched) {
                <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  ✓ Válido
                </span>
              }
            </div>

            <div class="relative">
              <input
                type="text"
                formControlName="fullName"
                placeholder="Ej. Ana Lucía Morales"
                class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none transition-all"
                [ngClass]="{
                  '!border-rose-500 !ring-2 !ring-rose-500/20': fullNameField?.invalid && fullNameField?.touched,
                  '!border-emerald-500': fullNameField?.valid && fullNameField?.touched
                }"
              />
            </div>

            @if (fullNameField?.invalid && fullNameField?.touched) {
              <p class="mt-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium">
                @if (fullNameField?.hasError('required')) {
                  El nombre completo es obligatorio (mínimo 3 caracteres).
                } @else {
                  Te faltan {{ 3 - (fullNameField?.value || '').trim().length }} caracteres para el mínimo de 3.
                }
              </p>
            }
          </div>

          <!-- Correo Electrónico -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Correo Electrónico *
              </label>
              @if (emailField?.valid && emailField?.touched) {
                <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  ✓ Formato correcto
                </span>
              }
            </div>

            <div class="relative">
              <input
                type="email"
                formControlName="email"
                placeholder="ana@ejemplo.com"
                class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none transition-all"
                [ngClass]="{
                  '!border-rose-500 !ring-2 !ring-rose-500/20': emailField?.invalid && emailField?.touched,
                  '!border-emerald-500': emailField?.valid && emailField?.touched
                }"
              />
            </div>

            @if (emailField?.invalid && emailField?.touched) {
              <p class="mt-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium">
                @if (emailField?.hasError('required')) {
                  El correo electrónico es obligatorio.
                } @else {
                  Ingresa un correo electrónico válido (ejemplo&#64;dominio.com).
                }
              </p>
            }
          </div>

          <!-- Teléfono (Estrictamente 10 números) -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Teléfono Celular *
              </label>
              <span
                class="text-[11px] font-mono font-semibold"
                [ngClass]="{
                  'text-emerald-600 dark:text-emerald-400': phoneLength() === 10,
                  'text-slate-500 dark:text-slate-400': phoneLength() < 10
                }"
              >
                {{ phoneLength() }}/10 dígitos
              </span>
            </div>

            <div class="relative">
              <input
                type="text"
                formControlName="phone"
                maxlength="10"
                inputmode="numeric"
                (input)="onPhoneInput($event)"
                placeholder="5512345678"
                class="w-full px-4 py-2.5 rounded-xl liquid-glass-input font-mono text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none transition-all"
                [ngClass]="{
                  '!border-rose-500 !ring-2 !ring-rose-500/20': phoneField?.invalid && phoneField?.touched,
                  '!border-emerald-500': phoneField?.valid && phoneField?.touched
                }"
              />
            </div>

            @if (phoneField?.invalid && phoneField?.touched) {
              <p class="mt-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium">
                @if (phoneLength() === 0) {
                  El teléfono celular de 10 dígitos es obligatorio.
                } @else {
                  Faltan {{ 10 - phoneLength() }} dígitos para completar los 10 números requeridos.
                }
              </p>
            }
          </div>

          <!-- Contraseña con Ojito y Lista Dinámica de Requisitos -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Contraseña de Acceso *
              </label>
              <span
                class="text-[11px] font-semibold"
                [ngClass]="strengthLabelColor()"
              >
                {{ strengthLabel() }}
              </span>
            </div>

            <!-- Input con Botón del Ojito -->
            <div class="relative flex items-center">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                (input)="onPasswordInput()"
                placeholder="Ingresa una clave segura"
                class="w-full pl-4 pr-11 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none transition-all"
                [ngClass]="{
                  '!border-rose-500 !ring-2 !ring-rose-500/20': passwordField?.invalid && passwordField?.touched,
                  '!border-emerald-500': passwordField?.valid && passwordField?.touched
                }"
              />

              <!-- Botón del Ojito (Ver / Ocultar Contraseña) -->
              <button
                type="button"
                (click)="togglePasswordVisibility()"
                class="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                [title]="showPassword() ? 'Ocultar contraseña' : 'Ver contraseña'"
              >
                @if (showPassword()) {
                  <!-- Eye Off SVG -->
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                } @else {
                  <!-- Eye SVG -->
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              </button>
            </div>

            <!-- Barra de Progreso de Fortaleza -->
            <div class="w-full bg-slate-200/80 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                class="h-full transition-all duration-300 rounded-full"
                [style.width.%]="passwordScore() * 25"
                [ngClass]="strengthBarColor()"
              ></div>
            </div>

            <!-- Lista Visual de Requisitos de la Contraseña -->
            <div class="mt-3 p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 text-xs">
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Requisitos de seguridad:
              </span>

              <!-- Requisito 1: Mínimo 8 caracteres -->
              <div
                class="flex items-center gap-2 transition-colors"
                [ngClass]="hasMinLength() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'"
              >
                <span class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  [ngClass]="hasMinLength() ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-300/50 dark:bg-slate-800 text-slate-400'"
                >
                  {{ hasMinLength() ? '✓' : '○' }}
                </span>
                <span>Mínimo 8 caracteres</span>
              </div>

              <!-- Requisito 2: Al menos una mayúscula -->
              <div
                class="flex items-center gap-2 transition-colors"
                [ngClass]="hasUppercase() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'"
              >
                <span class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  [ngClass]="hasUppercase() ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-300/50 dark:bg-slate-800 text-slate-400'"
                >
                  {{ hasUppercase() ? '✓' : '○' }}
                </span>
                <span>Al menos una letra mayúscula (A-Z)</span>
              </div>

              <!-- Requisito 3: Al menos una minúscula -->
              <div
                class="flex items-center gap-2 transition-colors"
                [ngClass]="hasLowercase() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'"
              >
                <span class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  [ngClass]="hasLowercase() ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-300/50 dark:bg-slate-800 text-slate-400'"
                >
                  {{ hasLowercase() ? '✓' : '○' }}
                </span>
                <span>Al menos una letra minúscula (a-z)</span>
              </div>

              <!-- Requisito 4: Al menos un número o símbolo -->
              <div
                class="flex items-center gap-2 transition-colors"
                [ngClass]="hasNumberOrSymbol() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'"
              >
                <span class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  [ngClass]="hasNumberOrSymbol() ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-300/50 dark:bg-slate-800 text-slate-400'"
                >
                  {{ hasNumberOrSymbol() ? '✓' : '○' }}
                </span>
                <span>Al menos un número (0-9) o símbolo especial</span>
              </div>
            </div>

            @if (passwordField?.invalid && passwordField?.touched) {
              <p class="mt-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium">
                @if (passwordField?.hasError('required')) {
                  La contraseña de acceso es obligatoria.
                } @else {
                  Completa los requisitos marcados arriba antes de continuar.
                }
              </p>
            }
          </div>

          <!-- Aceptación Obligatoria del Aviso de Privacidad -->
          <div
            class="p-3.5 rounded-2xl liquid-glass border transition-all"
            [ngClass]="{
              '!border-rose-500 !ring-2 !ring-rose-500/20': acceptPrivacyField?.invalid && acceptPrivacyField?.touched,
              'border-slate-200/80 dark:border-slate-800/80': !(acceptPrivacyField?.invalid && acceptPrivacyField?.touched)
            }"
          >
            <div class="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="registerPrivacyCheckbox"
                formControlName="acceptPrivacy"
                class="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <label for="registerPrivacyCheckbox" class="text-xs text-slate-700 dark:text-slate-300 leading-snug cursor-pointer select-none">
                He leído y acepto expresamente el
                <button
                  type="button"
                  (click)="openPrivacyModal()"
                  class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                >
                  <span>Aviso de Privacidad y Términos Legales</span>
                  <span>↗</span>
                </button>
                para el tratamiento de mis datos personales y el expediente de mis mascotas.
              </label>
            </div>
            @if (acceptPrivacyField?.invalid && acceptPrivacyField?.touched) {
              <p class="mt-2 text-xs text-rose-500 dark:text-rose-400 font-medium">
                Debes marcar la casilla del Aviso de Privacidad para poder crear tu cuenta.
              </p>
            }
          </div>

          <!-- Botón de Registro -->
          <button
            type="submit"
            [disabled]="isLoading()"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all hover:scale-101 active:scale-99 flex items-center justify-center gap-2 mt-6"
          >
            @if (isLoading()) {
              <span class="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              <span>Creando cuenta segura...</span>
            } @else {
              <span>Registrarse Ahora</span>
            }
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-slate-300/50 dark:border-slate-800/80 text-center text-xs text-slate-600 dark:text-slate-400">
          ¿Ya tienes cuenta?
          <a routerLink="/auth/login" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold ml-1">
            Inicia sesión
          </a>
        </div>
      </div>

      <!-- Modal Reutilizable de Aviso de Privacidad -->
      <app-privacy-modal
        [isOpen]="isPrivacyModalOpen()"
        (accepted)="onPrivacyAccepted()"
        (closed)="isPrivacyModalOpen.set(false)"
      />
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  showPassword = signal(false);
  isPrivacyModalOpen = signal(false);

  // Live password evaluation signals
  passwordValue = signal('');
  phoneLength = signal(0);

  hasMinLength = computed(() => this.passwordValue().length >= 8);
  hasUppercase = computed(() => /[A-Z]/.test(this.passwordValue()));
  hasLowercase = computed(() => /[a-z]/.test(this.passwordValue()));
  hasNumberOrSymbol = computed(() => /((?=.*\d)|(?=.*\W+))/.test(this.passwordValue()));

  passwordScore = computed(() => {
    let score = 0;
    if (this.hasMinLength()) score++;
    if (this.hasUppercase()) score++;
    if (this.hasLowercase()) score++;
    if (this.hasNumberOrSymbol()) score++;
    return score;
  });

  strengthLabel = computed(() => {
    switch (this.passwordScore()) {
      case 1:
        return 'Muy débil';
      case 2:
        return 'Regular';
      case 3:
        return 'Buena';
      case 4:
        return 'Excelente y Segura ✓';
      default:
        return 'Sin ingresar';
    }
  });

  strengthLabelColor = computed(() => {
    switch (this.passwordScore()) {
      case 1:
        return 'text-rose-500';
      case 2:
        return 'text-amber-500';
      case 3:
        return 'text-teal-500';
      case 4:
        return 'text-emerald-500';
      default:
        return 'text-slate-400';
    }
  });

  strengthBarColor = computed(() => {
    switch (this.passwordScore()) {
      case 1:
        return 'bg-rose-500';
      case 2:
        return 'bg-amber-500';
      case 3:
        return 'bg-teal-500';
      case 4:
        return 'bg-emerald-500 shadow-sm shadow-emerald-500/50';
      default:
        return 'bg-transparent';
    }
  });

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/),
      ],
    ],
    acceptPrivacy: [false, [Validators.requiredTrue]],
  });

  get fullNameField() {
    return this.registerForm.get('fullName');
  }

  get emailField() {
    return this.registerForm.get('email');
  }

  get phoneField() {
    return this.registerForm.get('phone');
  }

  get passwordField() {
    return this.registerForm.get('password');
  }

  get acceptPrivacyField() {
    return this.registerForm.get('acceptPrivacy');
  }

  openPrivacyModal(): void {
    this.isPrivacyModalOpen.set(true);
  }

  onPrivacyAccepted(): void {
    this.acceptPrivacyField?.setValue(true);
    this.acceptPrivacyField?.markAsTouched();
    this.isPrivacyModalOpen.set(false);
    localStorage.setItem('vet_privacy_accepted', new Date().toISOString());
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  onPhoneInput(event: any): void {
    const input = event.target as HTMLInputElement;
    // Strictly filter out any non-numeric character
    const cleaned = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = cleaned;
    this.phoneField?.setValue(cleaned);
    this.phoneLength.set(cleaned.length);
  }

  onPasswordInput(): void {
    const pwd = this.passwordField?.value || '';
    this.passwordValue.set(pwd);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formVal = this.registerForm.value;

    this.authService
      .register({
        fullName: formVal.fullName!.trim(),
        email: formVal.email!.trim().toLowerCase(),
        phone: formVal.phone!.trim(),
        password: formVal.password!,
      })
      .subscribe({
        next: () => {
          localStorage.setItem('vet_privacy_accepted', new Date().toISOString());
          this.isLoading.set(false);
          this.router.navigate(['/']);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }
}
