import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdoptionService } from '../../../core/services/adoption.service';
import { CreateAdoptionRequestPayload } from '../../../core/models/adoption.model';
import { Pet } from '../../../core/models/pet.model';

@Component({
  selector: 'app-adoption-request-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-3.5 text-xs">
      <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
        <span class="text-base sm:text-lg">📋</span>
        <div class="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
          <strong class="text-emerald-700 dark:text-emerald-400">Protocolo Oficial de Adopción (4 Pasos):</strong>
          Responde este cuestionario para iniciar el Paso 1 (Entrevista). Por tu privacidad (LFPDPPP), <strong>no se te pedirá subir foto de INE</strong> en línea.
        </div>
      </div>

      <!-- 1. Tipo de Vivienda -->
      <div>
        <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
          1. ¿En qué tipo de vivienda vivirá la mascota? <span class="text-rose-500">*</span>
        </label>
        <select
          [(ngModel)]="form.housingType"
          class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="CASA_PROPIA_PATIO">🏡 Casa propia con patio o jardín cercado y seguro</option>
          <option value="CASA_PROPIA_SIN_PATIO">🏠 Casa propia sin patio (espacio interior)</option>
          <option value="RENTA_CON_PERMISO">🏢 Casa o departamento en renta (con permiso del casero)</option>
        </select>
      </div>

      <!-- 2. Acuerdo Familiar -->
      <div>
        <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
          2. ¿Toda la familia o personas en casa aceptan la adopción? <span class="text-rose-500">*</span>
        </label>
        <select
          [(ngModel)]="form.familyAgreed"
          class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="SI_FAMILIA">👨‍👩‍👧‍👦 Sí, toda la familia acepta y asumirá la responsabilidad</option>
          <option value="VIVO_SOLO">👤 Vivo solo(a) y asumo la total responsabilidad del cuidado</option>
        </select>
      </div>

      <!-- 3. Mascotas Actuales y Esterilización -->
      <div>
        <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
          3. ¿Tienes otras mascotas en casa? ¿Están esterilizadas y vacunadas? <span class="text-rose-500">*</span>
        </label>
        <input
          type="text"
          [(ngModel)]="form.currentPets"
          placeholder="Ej: 1 perrito criollo de 3 años esterilizado / Ninguna mascota actualmente"
          class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      <!-- 4. Plan de Mudanza o Imprevistos -->
      <div>
        <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
          4. En caso de mudanza, viaje o cambio laboral, ¿cuál es tu plan? <span class="text-rose-500">*</span>
        </label>
        <input
          type="text"
          [(ngModel)]="form.relocationPlan"
          placeholder="Ej: La mascota siempre se muda con nosotros / Familiares directos de apoyo"
          class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      <!-- 5. Motivo y Tiempo Diario -->
      <div>
        <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
          5. ¿Por qué deseas adoptar a {{ pet().name }} y cuánto tiempo le dedicarás? <span class="text-rose-500">*</span>
        </label>
        <textarea
          [(ngModel)]="form.reason"
          rows="2"
          placeholder="Platícanos sobre tu rutina diaria, paseos y el cariño que recibirá en tu hogar..."
          class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
        ></textarea>
      </div>

      <!-- 6 y 7. Redes Sociales y Domicilio (Protocolo Oficial Paso 1 y 2) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
            6. Tu perfil de Facebook / Instagram <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            [(ngModel)]="form.socialMedia"
            placeholder="Ej: fb.com/tu.perfil o @usuario"
            class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
            7. Colonia o Dirección aproximada <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            [(ngModel)]="form.address"
            placeholder="Ej: Col. Centro, calle Hidalgo..."
            class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <!-- Compromisos Obligatorios -->
      <div class="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-300/80 dark:border-slate-700/80 space-y-2.5">
        <span class="block text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          📜 Compromisos Obligatorios del Convenio de Adopción:
        </span>

        <label class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            [(ngModel)]="form.agreeNoAbandon"
            class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span class="text-[11px] leading-tight">
            <strong>Miembro de la familia:</strong> Tendrá agua, alimento, cariño y atención médica. Jamás estará amarrado, en azoteas, ni será regalado, vendido o reubicado sin consentimiento previo.
          </span>
        </label>

        <label class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            [(ngModel)]="form.agreeSterilization"
            class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span class="text-[11px] leading-tight">
            <strong>Esterilización y salud:</strong> Me comprometo a su esterilización obligatoria (a los 5-6 meses si aún no está esterilizada) y a mantener su cuadro de vacunas al día.
          </span>
        </label>

        <label class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            [(ngModel)]="form.agreeFollowup"
            class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span class="text-[11px] leading-tight">
            <strong>Seguimiento de bienestar:</strong> Acepto enviar fotos periódicas a las <strong>2 semanas, 1 mes, medio año y 1 año</strong> para validar su adaptación.
          </span>
        </label>
      </div>

      @if (!isValid()) {
        <p class="text-[11px] text-amber-600 dark:text-amber-400 font-medium text-center bg-amber-500/10 rounded-xl p-2 border border-amber-500/20">
          ⚠️ Completa las 7 respuestas (incluyendo redes sociales y zona) y marca los 3 compromisos del convenio.
        </p>
      }

      <div class="pt-1 flex gap-2">
        <button
          type="button"
          (click)="submit()"
          [disabled]="isSubmitting() || !isValid()"
          class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-105 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          @if (isSubmitting()) {
            <div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            <span>Enviando solicitud...</span>
          } @else {
            <span>🐾 Enviar Solicitud Formal</span>
          }
        </button>

        <button
          type="button"
          (click)="cancelled.emit()"
          class="py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  `,
})
export class AdoptionRequestFormComponent implements OnInit {
  private adoptionService = inject(AdoptionService);

  pet = input.required<Pet>();
  isSubmitting = input<boolean>(false);
  submitted = output<CreateAdoptionRequestPayload>();
  cancelled = output<void>();

  form = {
    housingType: 'CASA_PROPIA_PATIO',
    familyAgreed: 'SI_FAMILIA',
    currentPets: '',
    relocationPlan: '',
    reason: '',
    socialMedia: '',
    address: '',
    agreeNoAbandon: false,
    agreeSterilization: false,
    agreeFollowup: false,
  };

  ngOnInit(): void {
    this.adoptionService.getMyVerification().subscribe({
      next: (ver) => {
        if (!ver) return;
        if (ver.housingType === 'CASA_RENTADA') {
          this.form.housingType = 'RENTA_CON_PERMISO';
        } else if (ver.housingType === 'DEPARTAMENTO') {
          this.form.housingType = 'CASA_PROPIA_SIN_PATIO';
        }
        if (ver.relocationPlan && !this.form.relocationPlan) {
          this.form.relocationPlan = ver.relocationPlan;
        }
      },
      error: () => {},
    });
  }

  isValid(): boolean {
    return (
      !!this.form.housingType &&
      (this.form.familyAgreed === 'SI_FAMILIA' || this.form.familyAgreed === 'VIVO_SOLO') &&
      this.form.currentPets.trim().length >= 3 &&
      this.form.relocationPlan.trim().length >= 4 &&
      this.form.reason.trim().length >= 10 &&
      this.form.socialMedia.trim().length >= 3 &&
      this.form.address.trim().length >= 4 &&
      this.form.agreeNoAbandon &&
      this.form.agreeSterilization &&
      this.form.agreeFollowup
    );
  }

  submit(): void {
    if (!this.isValid()) return;

    const housingLabel =
      this.form.housingType === 'CASA_PROPIA_PATIO'
        ? 'Casa propia con patio o jardín cercado y seguro'
        : this.form.housingType === 'CASA_PROPIA_SIN_PATIO'
          ? 'Casa propia sin patio (espacio interior)'
          : 'En renta (con permiso explícito confirmado del arrendador)';

    const familyLabel =
      this.form.familyAgreed === 'SI_FAMILIA'
        ? 'Toda la familia acepta y asume la responsabilidad'
        : 'Vive solo(a) y asume la total responsabilidad';

    const message = `📋 SOLICITUD DE ADOPCIÓN RESPONSABLE (Protocolo 4 Pasos)
🏠 Vivienda: ${housingLabel}
👨‍👩‍👧‍👦 Acuerdo familiar: ${familyLabel}
🐾 Mascotas actuales: ${this.form.currentPets.trim()}
📦 Plan mudanza/viajes: ${this.form.relocationPlan.trim()}
❤️ Motivo y tiempo: ${this.form.reason.trim()}
🌐 Redes sociales: ${this.form.socialMedia.trim()}
📍 Dirección/Zona: ${this.form.address.trim()}`;

    this.submitted.emit({
      message,
      socialMedia: this.form.socialMedia.trim(),
      address: this.form.address.trim(),
      questionnaire: {
        housingType: housingLabel,
        landlordAllowsPets: this.form.housingType !== 'RENTA_CON_PERMISO' || true,
        familyAgreed: familyLabel,
        currentPets: this.form.currentPets.trim(),
        relocationPlan: this.form.relocationPlan.trim(),
        motivation: this.form.reason.trim(),
        socialMedia: this.form.socialMedia.trim(),
        address: this.form.address.trim(),
      },
    });
  }
}

