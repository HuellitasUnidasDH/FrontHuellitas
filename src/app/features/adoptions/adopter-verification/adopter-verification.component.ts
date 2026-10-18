import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdoptionService } from '../../../core/services/adoption.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AdopterVerification } from '../../../core/models/adoption.model';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';

@Component({
  selector: 'app-adopter-verification',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <!-- Header -->
      <section class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-emerald-500/20">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25">
              🛡️
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Verificación de Adoptante
              </h1>
              <p class="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                Garantiza una adopción segura, responsable y de por vida en Dolores Hidalgo.
              </p>
            </div>
          </div>
          <a
            routerLink="/"
            class="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            ← Volver
          </a>
        </div>

        <!-- Levels Progress Bar -->
        <div class="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div
              class="p-2.5 rounded-xl border transition-all"
              [ngClass]="currentLevel() >= 1 ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold' : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400'"
            >
              <span class="block text-base">📱</span>
              <span>Nivel 1: Teléfono</span>
            </div>

            <div
              class="p-2.5 rounded-xl border transition-all"
              [ngClass]="currentLevel() >= 2 ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold' : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400'"
            >
              <span class="block text-base">📋</span>
              <span>Nivel 2: Cuestionario</span>
            </div>

            <div
              class="p-2.5 rounded-xl border transition-all"
              [ngClass]="currentLevel() >= 3 ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold' : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400'"
            >
              <span class="block text-base">🏡</span>
              <span>Nivel 3: Compromiso</span>
            </div>
          </div>
        </div>
      </section>

      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-16 text-center space-y-3">
          <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-xs font-bold text-slate-500">Cargando expediente de verificación...</p>
        </div>
      } @else {
        <!-- STEP 1: Phone verification notification -->
        <section class="liquid-glass rounded-3xl p-6 shadow-xl space-y-3 border border-slate-200/80 dark:border-slate-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📱</span>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Nivel 1: Teléfono de Contacto</h3>
                <p class="text-xs text-slate-500">
                  Teléfono registrado: <strong>{{ authService.currentUser()?.phone || 'Sin registrar' }}</strong>
                </p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              ✓ Confirmado
            </span>
          </div>
        </section>

        <!-- STEP 2: Socio-environmental questionnaire -->
        <section class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 border border-slate-200/80 dark:border-slate-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📋</span>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  Nivel 2: Cuestionario Socioambiental
                </h3>
                <p class="text-xs text-slate-500">
                  Evaluación de entorno para asegurar que la mascota cuente con las condiciones adecuadas.
                </p>
              </div>
            </div>

            @if (verification()?.isLevel2Completed) {
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                ✓ Aprobado
              </span>
            }
          </div>

          <div class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tipo de vivienda</label>
                <select
                  [(ngModel)]="level2Form.housingType"
                  class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white"
                >
                  <option value="CASA_PROPIA">Casa propia con patio cercado</option>
                  <option value="CASA_RENTADA">Casa en renta</option>
                  <option value="DEPARTAMENTO">Departamento / Interior</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  ¿El dueño o arrendador permite mascotas?
                </label>
                <select
                  [(ngModel)]="level2Form.landlordAllowsPets"
                  class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white"
                >
                  <option [ngValue]="true">Sí, está totalmente permitido</option>
                  <option [ngValue]="false">No / Con restricciones</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                ¿Quiénes habitan el hogar? (adultos, niños y edades)
              </label>
              <input
                type="text"
                [(ngModel)]="level2Form.peopleInHome"
                placeholder="Ej: 2 adultos (30 y 32 años) y 1 niño de 7 años"
                class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Experiencia previa con animales de compañía
              </label>
              <textarea
                [(ngModel)]="level2Form.previousExperience"
                rows="2"
                placeholder="He tenido perros mestizos antes, vivieron conmigo hasta su vejez..."
                class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white"
              ></textarea>
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Plan en caso de mudanza, cambio de trabajo o viaje largo
              </label>
              <input
                type="text"
                [(ngModel)]="level2Form.relocationPlan"
                placeholder="La mascota se mudará conmigo a donde vaya o se queda con familia de confianza"
                class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                ¿Quién solventará gastos veterinarios, vacunas y alimento?
              </label>
              <input
                type="text"
                [(ngModel)]="level2Form.financialResponsible"
                placeholder="Ej: Yo mismo(a) mediante mis ingresos fijos"
                class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>

            <button
              (click)="submitLevel2()"
              [disabled]="isSavingLevel2()"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 transition-all"
            >
              @if (isSavingLevel2()) { Guardando... } @else { Guardar Cuestionario Nivel 2 }
            </button>
          </div>
        </section>

        <!-- STEP 3: Commitment letter and yard photos -->
        <section class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 border border-slate-200/80 dark:border-slate-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🏡</span>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  Nivel 3: Carta Compromiso y Espacio Digno
                </h3>
                <p class="text-xs text-slate-500">
                  Aceptación formal legal para garantizar que no permanezca en azoteas ni encadenado.
                </p>
              </div>
            </div>

            @if (verification()?.isLevel3Completed) {
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                ✓ Compromiso Activo
              </span>
            }
          </div>

          <div class="space-y-4 text-xs">
            <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-slate-700 dark:text-slate-200 leading-relaxed">
              <span class="font-black text-emerald-700 dark:text-emerald-400 block">
                📜 Decálogo de Adopción Responsable Huellitas Dolores Hidalgo:
              </span>
              <ul class="list-disc pl-5 space-y-1 text-[11px]">
                <li>No mantener al animal en azoteas desprotegidas, balcones peligrosos ni atado a cadenas.</li>
                <li>Brindarle alimento digno, agua limpia y resguardo de la lluvia y frío.</li>
                <li>Mantener al día su cuadro de vacunación anual y esterilización.</li>
                <li>Aceptar el seguimiento preventivo a los 7, 30 y 90 días enviando una fotografía de su estado al rescatista.</li>
                <li>Prohibición estricta de reventa, cruza lucrativa o abandono.</li>
              </ul>
            </div>

            <label class="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="level3Form.signedCommitmentLetter"
                class="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span class="text-slate-800 dark:text-white font-semibold">
                He leído y acepto formalmente la Carta Compromiso de Bienestar Animal de Huellitas Dolores Hidalgo.
              </span>
            </label>

            <button
              (click)="submitLevel3()"
              [disabled]="isSavingLevel3() || !level3Form.signedCommitmentLetter"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 transition-all"
            >
              @if (isSavingLevel3()) { Guardando... } @else { Firmar y Activar Nivel 3 }
            </button>
          </div>
        </section>
      }

    </div>
  `,
})
export class AdopterVerificationComponent implements OnInit {
  brand = BRAND_CONFIG;
  private adoptionService = inject(AdoptionService);
  public authService = inject(AuthService);
  private notify = inject(NotificationService);

  verification = signal<AdopterVerification | null>(null);
  isLoading = signal<boolean>(true);
  isSavingLevel2 = signal<boolean>(false);
  isSavingLevel3 = signal<boolean>(false);

  level2Form = {
    housingType: 'CASA_PROPIA',
    landlordAllowsPets: true,
    peopleInHome: '',
    previousExperience: '',
    relocationPlan: '',
    financialResponsible: '',
  };

  level3Form = {
    hasSafeEnclosure: true,
    signedCommitmentLetter: false,
  };

  currentLevel(): number {
    const v = this.verification();
    if (v?.isLevel3Completed) return 3;
    if (v?.isLevel2Completed) return 2;
    return 1;
  }

  ngOnInit(): void {
    this.loadVerification();
  }

  loadVerification(): void {
    this.isLoading.set(true);
    this.adoptionService.getMyVerification().subscribe({
      next: (data) => {
        this.verification.set(data);
        if (data) {
          this.level2Form = {
            housingType: (data.housingType as any) || 'CASA_PROPIA',
            landlordAllowsPets: data.landlordAllowsPets ?? true,
            peopleInHome: data.peopleInHome || '',
            previousExperience: data.previousExperience || '',
            relocationPlan: data.relocationPlan || '',
            financialResponsible: data.financialResponsible || '',
          };
          this.level3Form.signedCommitmentLetter = Boolean(data.signedCommitmentLetter);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  submitLevel2(): void {
    this.isSavingLevel2.set(true);
    this.adoptionService.submitLevel2(this.level2Form as any).subscribe({
      next: (updated) => {
        this.isSavingLevel2.set(false);
        this.verification.set(updated);
        this.notify.success('¡Cuestionario Nivel 2 aprobado y guardado!');
      },
      error: (err) => {
        this.isSavingLevel2.set(false);
        this.notify.error(err.error?.message || 'Error al guardar cuestionario');
      },
    });
  }

  submitLevel3(): void {
    this.isSavingLevel3.set(true);
    this.adoptionService.submitLevel3(this.level3Form as any).subscribe({
      next: (updated) => {
        this.isSavingLevel3.set(false);
        this.verification.set(updated);
        this.notify.success('¡Felicidades! Nivel 3 completado y verificado.');
      },
      error: (err) => {
        this.isSavingLevel3.set(false);
        this.notify.error(err.error?.message || 'Error al registrar compromiso');
      },
    });
  }
}
