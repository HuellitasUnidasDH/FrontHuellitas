import { Component, ElementRef, OnInit, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { AdoptionService } from '../../../core/services/adoption.service';
import { AuthService } from '../../../core/services/auth.service';
import { CreateAdoptionRequestPayload, HousingType } from '../../../core/models/adoption.model';
import { Pet } from '../../../core/models/pet.model';

type FormFieldKey =
  | 'currentPets'
  | 'relocationPlan'
  | 'reason'
  | 'socialMedia'
  | 'address'
  | 'agreements';

interface MissingFieldIssue {
  key: FormFieldKey;
  anchorId: string;
  label: string;
}

@Component({
  selector: 'app-adoption-request-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4 text-xs">
      <!-- Institutional privacy notice -->
      <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
        <div class="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div class="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong class="text-emerald-700 dark:text-emerald-400">Protocolo de Adopción (4 Etapas):</strong>
          Completa este cuestionario para iniciar la entrevista. Por protección de datos (LFPDPPP), <strong>no se solicita subir fotografía de identificación oficial</strong> en línea.
        </div>
      </div>

      @if (prefilledSource()) {
        <div class="px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-between gap-2 text-[11px] text-sky-800 dark:text-sky-300">
          <span class="flex items-center gap-1.5 font-medium">
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Respuestas base precargadas desde {{ prefilledSource() }}. Revísalas antes de enviar.
          </span>
        </div>
      }

      <!-- 1. Tipo de Vivienda -->
      <div>
        <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
          1. ¿En qué tipo de vivienda vivirá la mascota? <span class="text-rose-500">*</span>
        </label>
        <select
          [(ngModel)]="form.housingType"
          class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
        >
          <option value="CASA_PROPIA_PATIO">Casa propia con patio o jardín cercado</option>
          <option value="CASA_PROPIA_SIN_PATIO">Casa propia sin patio (espacio interior)</option>
          <option value="RENTA_CON_PERMISO">Casa o departamento en renta (con permiso del arrendador)</option>
        </select>
      </div>

      <!-- 2. Acuerdo Familiar -->
      <div>
        <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
          2. ¿Toda la familia o personas en casa aceptan la adopción? <span class="text-rose-500">*</span>
        </label>
        <select
          [(ngModel)]="form.familyAgreed"
          class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
        >
          <option value="SI_FAMILIA">Sí, toda la familia está de acuerdo y asume la responsabilidad</option>
          <option value="VIVO_SOLO">Vivo solo(a) y asumo la total responsabilidad del cuidado</option>
        </select>
      </div>

      <!-- 3. Mascotas Actuales -->
      <div id="arf-currentPets">
        <div class="flex items-center justify-between gap-2 mb-1">
          <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            3. ¿Tienes otras mascotas? ¿Vacunadas / esterilizadas? <span class="text-rose-500">*</span>
          </label>
          <span
            class="text-[11px] font-medium tabular-nums shrink-0"
            [ngClass]="isFieldMinMet('currentPets', 3) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
          >
            {{ trimmedLen('currentPets') }}/3 mín.
          </span>
        </div>
        <input
          type="text"
          [(ngModel)]="form.currentPets"
          (blur)="markTouched('currentPets')"
          placeholder="Ej: Ninguna actualmente / 1 perro criollo de 3 años esterilizado"
          class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border text-slate-800 dark:text-white focus:outline-none transition-colors"
          [ngClass]="
            shouldShowError('currentPets', 3)
              ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5'
              : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'
          "
        />
        @if (shouldShowError('currentPets', 3)) {
          <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {{ minLengthMessage('currentPets', 3, 'Indica si convives con otras mascotas (ej. "Ninguna" o "1 perro").') }}
          </p>
        }
      </div>

      <!-- 4. Plan de Mudanza o Imprevistos -->
      <div id="arf-relocationPlan">
        <div class="flex items-center justify-between gap-2 mb-1">
          <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            4. En caso de mudanza o viaje, ¿cuál es tu plan? <span class="text-rose-500">*</span>
          </label>
          <span
            class="text-[11px] font-medium tabular-nums shrink-0"
            [ngClass]="isFieldMinMet('relocationPlan', 4) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
          >
            {{ trimmedLen('relocationPlan') }}/4 mín.
          </span>
        </div>
        <input
          type="text"
          [(ngModel)]="form.relocationPlan"
          (blur)="markTouched('relocationPlan')"
          placeholder="Ej: Se muda conmigo siempre / Apoyo de familiares directos"
          class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border text-slate-800 dark:text-white focus:outline-none transition-colors"
          [ngClass]="
            shouldShowError('relocationPlan', 4)
              ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5'
              : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'
          "
        />
        @if (shouldShowError('relocationPlan', 4)) {
          <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {{ minLengthMessage('relocationPlan', 4, 'Describe brevemente tu plan ante cambios de domicilio o viajes.') }}
          </p>
        }
      </div>

      <!-- 5. Motivo y Tiempo Diario -->
      <div id="arf-reason">
        <div class="flex items-center justify-between gap-2 mb-1">
          <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            5. Motivo para adoptar a {{ pet().name }} y tiempo diario <span class="text-rose-500">*</span>
          </label>
          <span
            class="text-[11px] font-medium tabular-nums shrink-0"
            [ngClass]="isFieldMinMet('reason', 10) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
          >
            {{ trimmedLen('reason') }}/10 mín.
          </span>
        </div>
        <textarea
          [(ngModel)]="form.reason"
          (blur)="markTouched('reason')"
          rows="2"
          placeholder="Describe tu rutina diaria, paseos y el espacio o cuidados que le brindarás..."
          class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border text-slate-800 dark:text-white focus:outline-none transition-colors"
          [ngClass]="
            shouldShowError('reason', 10)
              ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5'
              : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'
          "
        ></textarea>
        @if (shouldShowError('reason', 10)) {
          <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {{ minLengthMessage('reason', 10, 'Platícanos un poco más sobre el motivo y tiempo disponible.') }}
          </p>
        }
      </div>

      <!-- 6 y 7. Redes Sociales y Domicilio -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div id="arf-socialMedia">
          <div class="flex items-center justify-between gap-2 mb-1">
            <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              6. Perfil de Facebook / IG <span class="text-rose-500">*</span>
            </label>
            <span
              class="text-[11px] font-medium tabular-nums shrink-0"
              [ngClass]="isFieldMinMet('socialMedia', 3) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
            >
              {{ trimmedLen('socialMedia') }}/3 mín.
            </span>
          </div>
          <input
            type="text"
            [(ngModel)]="form.socialMedia"
            (blur)="markTouched('socialMedia')"
            placeholder="Ej: fb.com/tu.perfil o @usuario"
            class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border text-slate-800 dark:text-white focus:outline-none transition-colors"
            [ngClass]="
              shouldShowError('socialMedia', 3)
                ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5'
                : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'
            "
          />
          @if (shouldShowError('socialMedia', 3)) {
            <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              {{ minLengthMessage('socialMedia', 3, 'Ingresa tu usuario o enlace de red social para validación.') }}
            </p>
          }
        </div>

        <div id="arf-address">
          <div class="flex items-center justify-between gap-2 mb-1">
            <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              7. Colonia o Zona <span class="text-rose-500">*</span>
            </label>
            <span
              class="text-[11px] font-medium tabular-nums shrink-0"
              [ngClass]="isFieldMinMet('address', 4) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
            >
              {{ trimmedLen('address') }}/4 mín.
            </span>
          </div>
          <input
            type="text"
            [(ngModel)]="form.address"
            (blur)="markTouched('address')"
            placeholder="Ej: Col. Centro, calle Hidalgo"
            class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border text-slate-800 dark:text-white focus:outline-none transition-colors"
            [ngClass]="
              shouldShowError('address', 4)
                ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5'
                : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'
            "
          />
          @if (shouldShowError('address', 4)) {
            <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              {{ minLengthMessage('address', 4, 'Especifica tu colonia o zona aproximada.') }}
            </p>
          }
        </div>
      </div>

      <!-- Perfil Socioambiental Unificado (Nivel 2) -->
      @if (!level2AlreadyDone()) {
        <div class="p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-2.5">
          <div class="flex items-center justify-between gap-2">
            <div>
              <span class="text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-400 block">
                Perfil de Adoptante Unificado (Nivel 2 opcional)
              </span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                Si completas estos 3 campos extra, también enviaremos tu Verificación Nivel 2 para agilizar futuras adopciones.
              </p>
            </div>
            <button
              type="button"
              (click)="showExtraProfileFields.set(!showExtraProfileFields())"
              class="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 font-bold text-[11px] shrink-0 cursor-pointer transition-colors"
            >
              {{ showExtraProfileFields() ? 'Ocultar' : 'Completar Nivel 2' }}
            </button>
          </div>

          @if (showExtraProfileFields()) {
            <div class="space-y-2.5 pt-1 animate-fadeIn">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Personas en el hogar
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="form.peopleInHome"
                    placeholder="Ej: 2 adultos, 1 adolescente"
                    class="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Responsable económico
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="form.financialResponsible"
                    placeholder="Ej: Yo mismo / empleo fijo"
                    class="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Experiencia previa con mascotas
                </label>
                <textarea
                  [(ngModel)]="form.previousExperience"
                  rows="2"
                  placeholder="Cuéntanos brevemente si has cuidado perros o gatos antes..."
                  class="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-sky-500"
                ></textarea>
              </div>
              <label class="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="form.syncToLevel2"
                  class="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                />
                <span>Guardar y enviar automáticamente a revisión de Verificación Nivel 2</span>
              </label>
            </div>
          }
        </div>
      }

      <!-- Compromisos Obligatorios -->
      <div
        id="arf-agreements"
        class="p-3.5 rounded-2xl border space-y-2.5 transition-colors"
        [ngClass]="
          submittedAttempt() && missingAgreementsCount() > 0
            ? 'bg-rose-500/5 border-rose-500/40'
            : 'bg-slate-100/90 dark:bg-slate-900/80 border-slate-300/80 dark:border-slate-700/80'
        "
      >
        <div class="flex items-center justify-between gap-2">
          <span class="block text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Compromisos obligatorios del convenio
          </span>
          <span
            class="text-[11px] font-bold"
            [ngClass]="
              missingAgreementsCount() === 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : submittedAttempt()
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
            "
          >
            {{ 3 - missingAgreementsCount() }}/3 aceptados
          </span>
        </div>

        <label
          class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 p-1.5 rounded-xl transition-colors"
          [ngClass]="submittedAttempt() && !form.agreeNoAbandon ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : ''"
        >
          <input
            type="checkbox"
            [(ngModel)]="form.agreeNoAbandon"
            class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span class="text-[11px] leading-snug">
            <strong>Trato digno e integrante familiar:</strong> Tendrá agua, alimento, resguardo y atención veterinaria. No estará amarrado ni en azoteas, ni será regalado o vendido sin aviso previo.
          </span>
        </label>

        <label
          class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 p-1.5 rounded-xl transition-colors"
          [ngClass]="submittedAttempt() && !form.agreeSterilization ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : ''"
        >
          <input
            type="checkbox"
            [(ngModel)]="form.agreeSterilization"
            class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span class="text-[11px] leading-snug">
            <strong>Esterilización y salud:</strong> Me comprometo a su esterilización obligatoria (a los 5-6 meses si aún no se realiza) y a mantener sus vacunas al día.
          </span>
        </label>

        <label
          class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 p-1.5 rounded-xl transition-colors"
          [ngClass]="submittedAttempt() && !form.agreeFollowup ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : ''"
        >
          <input
            type="checkbox"
            [(ngModel)]="form.agreeFollowup"
            class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span class="text-[11px] leading-snug">
            <strong>Seguimiento de bienestar:</strong> Acepto compartir evidencia fotográfica a las <strong>2 semanas, 1 mes, 6 meses y 1 año</strong> para validar su adaptación.
          </span>
        </label>
      </div>

      <!-- Subtle actionable validation checklist only when incomplete after submit attempt -->
      @if (submittedAttempt() && missingIssues().length > 0) {
        <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 animate-fadeIn">
          <p class="text-[11px] font-bold text-rose-700 dark:text-rose-300">
            Para enviar tu solicitud, completa los siguientes puntos ({{ missingIssues().length }}):
          </p>
          <ul class="space-y-0.5 text-[11px] text-rose-700/90 dark:text-rose-300/90 list-disc pl-4">
            @for (issue of missingIssues(); track issue.key) {
              <li>{{ issue.label }}</li>
            }
          </ul>
        </div>
      } @else if (!isValid()) {
        <p class="text-[11px] text-slate-500 dark:text-slate-400 text-center">
          Campos pendientes: {{ missingIssues().length }} de 6 secciones requeridas.
        </p>
      }

      <div class="pt-1 flex gap-2">
        <button
          type="button"
          (click)="submit()"
          [disabled]="isSubmitting()"
          class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-105 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
        >
          @if (isSubmitting()) {
            <div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            <span>Enviando solicitud...</span>
          } @else {
            <span>Enviar Solicitud Formal</span>
          }
        </button>

        <button
          type="button"
          (click)="cancelled.emit()"
          class="py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  `,
})
export class AdoptionRequestFormComponent implements OnInit {
  private adoptionService = inject(AdoptionService);
  private authService = inject(AuthService);
  private hostRef = inject(ElementRef<HTMLElement>);

  pet = input.required<Pet>();
  isSubmitting = input<boolean>(false);
  submitted = output<CreateAdoptionRequestPayload>();
  cancelled = output<void>();

  touched = signal<Record<string, boolean>>({});
  submittedAttempt = signal<boolean>(false);
  prefilledSource = signal<string>('');
  level2AlreadyDone = signal<boolean>(false);
  showExtraProfileFields = signal<boolean>(false);

  form = {
    housingType: 'CASA_PROPIA_PATIO',
    familyAgreed: 'SI_FAMILIA',
    currentPets: '',
    relocationPlan: '',
    reason: '',
    socialMedia: '',
    address: '',
    peopleInHome: '',
    previousExperience: '',
    financialResponsible: '',
    syncToLevel2: true,
    agreeNoAbandon: false,
    agreeSterilization: false,
    agreeFollowup: false,
  };

  ngOnInit(): void {
    const userColonia = this.authService.currentUser()?.colonia?.name;
    if (userColonia && !this.form.address) {
      this.form.address = `Col. ${userColonia}, Dolores Hidalgo`;
    }

    forkJoin({
      ver: this.adoptionService.getMyVerification().pipe(catchError(() => of(null))),
      apps: this.adoptionService.getMyApplications().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ ver, apps }) => {
        const sources: string[] = [];

        if (ver) {
          this.level2AlreadyDone.set(
            Boolean(ver.isLevel2Completed || ver.level2Status === 'PENDIENTE' || ver.level2Status === 'APROBADO'),
          );
          if (ver.housingType === 'CASA_RENTADA') {
            this.form.housingType = 'RENTA_CON_PERMISO';
          } else if (ver.housingType === 'DEPARTAMENTO') {
            this.form.housingType = 'CASA_PROPIA_SIN_PATIO';
          } else if (ver.housingType === 'CASA_PROPIA') {
            this.form.housingType = 'CASA_PROPIA_PATIO';
          }
          if (ver.relocationPlan && !this.form.relocationPlan) {
            this.form.relocationPlan = ver.relocationPlan;
            sources.push('tu Verificación Nivel 2');
          }
          if (ver.peopleInHome && !this.form.peopleInHome) this.form.peopleInHome = ver.peopleInHome;
          if (ver.previousExperience && !this.form.previousExperience) {
            this.form.previousExperience = ver.previousExperience;
          }
          if (ver.financialResponsible && !this.form.financialResponsible) {
            this.form.financialResponsible = ver.financialResponsible;
          }
        }

        const latest = apps?.[0];
        if (latest) {
          const q = latest.questionnaireData;
          if (latest.adopterSocialMedia && !this.form.socialMedia) {
            this.form.socialMedia = latest.adopterSocialMedia;
            if (!sources.includes('tu postulación anterior')) sources.push('tu postulación anterior');
          }
          if (latest.adopterAddress) {
            this.form.address = latest.adopterAddress;
          }
          if (q?.currentPets && !this.form.currentPets) {
            this.form.currentPets = q.currentPets;
          }
          if (q?.relocationPlan && !this.form.relocationPlan) {
            this.form.relocationPlan = q.relocationPlan;
            if (!sources.includes('tu postulación anterior')) sources.push('tu postulación anterior');
          }
          if (q?.peopleInHome && !this.form.peopleInHome) this.form.peopleInHome = q.peopleInHome;
          if (q?.previousExperience && !this.form.previousExperience) {
            this.form.previousExperience = q.previousExperience;
          }
          if (q?.financialResponsible && !this.form.financialResponsible) {
            this.form.financialResponsible = q.financialResponsible;
          }
        }

        if (sources.length > 0) {
          this.prefilledSource.set(sources.join(' y '));
        }
      },
    });
  }

  markTouched(field: string): void {
    this.touched.update((prev) => ({ ...prev, [field]: true }));
  }

  trimmedLen(
    field: 'currentPets' | 'relocationPlan' | 'reason' | 'socialMedia' | 'address',
  ): number {
    return (this.form[field] || '').trim().length;
  }

  isFieldMinMet(
    field: 'currentPets' | 'relocationPlan' | 'reason' | 'socialMedia' | 'address',
    min: number,
  ): boolean {
    return this.trimmedLen(field) >= min;
  }

  shouldShowError(
    field: 'currentPets' | 'relocationPlan' | 'reason' | 'socialMedia' | 'address',
    min: number,
  ): boolean {
    return (this.touched()[field] || this.submittedAttempt()) && !this.isFieldMinMet(field, min);
  }

  minLengthMessage(
    field: 'currentPets' | 'relocationPlan' | 'reason' | 'socialMedia' | 'address',
    min: number,
    emptyMessage: string,
  ): string {
    const len = this.trimmedLen(field);
    if (len === 0) return `${emptyMessage} (mínimo ${min} caracteres).`;
    const missing = min - len;
    return `Tu respuesta es muy breve (${len}/${min}): agrega ${missing} ${missing === 1 ? 'carácter más' : 'caracteres más'}.`;
  }

  missingAgreementsCount(): number {
    let missing = 0;
    if (!this.form.agreeNoAbandon) missing++;
    if (!this.form.agreeSterilization) missing++;
    if (!this.form.agreeFollowup) missing++;
    return missing;
  }

  missingIssues(): MissingFieldIssue[] {
    const issues: MissingFieldIssue[] = [];
    if (!this.isFieldMinMet('currentPets', 3)) {
      const len = this.trimmedLen('currentPets');
      issues.push({
        key: 'currentPets',
        anchorId: 'arf-currentPets',
        label:
          len === 0
            ? 'Pregunta 3 (Mascotas actuales): falta responder (mín. 3 caracteres).'
            : `Pregunta 3 (Mascotas actuales): faltan ${3 - len} caracteres (${len}/3).`,
      });
    }
    if (!this.isFieldMinMet('relocationPlan', 4)) {
      const len = this.trimmedLen('relocationPlan');
      issues.push({
        key: 'relocationPlan',
        anchorId: 'arf-relocationPlan',
        label:
          len === 0
            ? 'Pregunta 4 (Plan de mudanza): falta responder (mín. 4 caracteres).'
            : `Pregunta 4 (Plan de mudanza): faltan ${4 - len} caracteres (${len}/4).`,
      });
    }
    if (!this.isFieldMinMet('reason', 10)) {
      const len = this.trimmedLen('reason');
      issues.push({
        key: 'reason',
        anchorId: 'arf-reason',
        label:
          len === 0
            ? 'Pregunta 5 (Motivo y tiempo): falta responder (mín. 10 caracteres).'
            : `Pregunta 5 (Motivo y tiempo): faltan ${10 - len} caracteres (${len}/10).`,
      });
    }
    if (!this.isFieldMinMet('socialMedia', 3)) {
      const len = this.trimmedLen('socialMedia');
      issues.push({
        key: 'socialMedia',
        anchorId: 'arf-socialMedia',
        label:
          len === 0
            ? 'Pregunta 6 (Facebook / Instagram): falta indicar perfil o usuario (mín. 3 caracteres).'
            : `Pregunta 6 (Facebook / Instagram): faltan ${3 - len} caracteres (${len}/3).`,
      });
    }
    if (!this.isFieldMinMet('address', 4)) {
      const len = this.trimmedLen('address');
      issues.push({
        key: 'address',
        anchorId: 'arf-address',
        label:
          len === 0
            ? 'Pregunta 7 (Colonia o zona): falta indicar ubicación (mín. 4 caracteres).'
            : `Pregunta 7 (Colonia o zona): faltan ${4 - len} caracteres (${len}/4).`,
      });
    }
    const missingChecks = this.missingAgreementsCount();
    if (missingChecks > 0) {
      issues.push({
        key: 'agreements',
        anchorId: 'arf-agreements',
        label: `Compromisos del convenio: falta marcar ${missingChecks} de los 3 puntos obligatorios.`,
      });
    }
    return issues;
  }

  isValid(): boolean {
    return (
      !!this.form.housingType &&
      (this.form.familyAgreed === 'SI_FAMILIA' || this.form.familyAgreed === 'VIVO_SOLO') &&
      this.missingIssues().length === 0
    );
  }

  submit(): void {
    this.submittedAttempt.set(true);
    const issues = this.missingIssues();
    if (issues.length > 0 || !this.form.housingType) {
      const firstEl = this.hostRef.nativeElement.querySelector(`#${issues[0]?.anchorId}`) as HTMLElement | null;
      firstEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const housingLabel =
      this.form.housingType === 'CASA_PROPIA_PATIO'
        ? 'Casa propia con patio o jardín cercado'
        : this.form.housingType === 'CASA_PROPIA_SIN_PATIO'
          ? 'Casa propia sin patio (espacio interior)'
          : 'En renta (con permiso confirmado del arrendador)';

    const familyLabel =
      this.form.familyAgreed === 'SI_FAMILIA'
        ? 'Toda la familia acepta y asume la responsabilidad'
        : 'Vive solo(a) y asume la total responsabilidad';

    const message = `SOLICITUD DE ADOPCIÓN RESPONSABLE (Protocolo 4 Etapas)
Vivienda: ${housingLabel}
Acuerdo familiar: ${familyLabel}
Mascotas actuales: ${this.form.currentPets.trim()}
Plan mudanza/viajes: ${this.form.relocationPlan.trim()}
Motivo y tiempo: ${this.form.reason.trim()}
Redes sociales: ${this.form.socialMedia.trim()}
Dirección/Zona: ${this.form.address.trim()}`;

    if (
      !this.level2AlreadyDone() &&
      this.form.syncToLevel2 &&
      this.form.peopleInHome.trim().length >= 3 &&
      this.form.previousExperience.trim().length >= 5 &&
      this.form.financialResponsible.trim().length >= 3
    ) {
      const mappedHousing: HousingType =
        this.form.housingType === 'RENTA_CON_PERMISO'
          ? 'CASA_RENTADA'
          : this.form.housingType === 'CASA_PROPIA_SIN_PATIO'
            ? 'DEPARTAMENTO'
            : 'CASA_PROPIA';
      this.adoptionService
        .submitLevel2({
          housingType: mappedHousing,
          landlordAllowsPets: true,
          peopleInHome: this.form.peopleInHome.trim(),
          previousExperience: this.form.previousExperience.trim(),
          relocationPlan: this.form.relocationPlan.trim(),
          financialResponsible: this.form.financialResponsible.trim(),
        })
        .subscribe({ error: () => {} });
    }

    this.submitted.emit({
      message,
      socialMedia: this.form.socialMedia.trim(),
      address: this.form.address.trim(),
      questionnaire: {
        housingType: housingLabel,
        landlordAllowsPets: true,
        familyAgreed: familyLabel,
        currentPets: this.form.currentPets.trim(),
        relocationPlan: this.form.relocationPlan.trim(),
        motivation: this.form.reason.trim(),
        socialMedia: this.form.socialMedia.trim(),
        address: this.form.address.trim(),
        ...(this.form.peopleInHome.trim() ? { peopleInHome: this.form.peopleInHome.trim() } : {}),
        ...(this.form.previousExperience.trim() ? { previousExperience: this.form.previousExperience.trim() } : {}),
        ...(this.form.financialResponsible.trim() ? { financialResponsible: this.form.financialResponsible.trim() } : {}),
      },
    });
  }
}
