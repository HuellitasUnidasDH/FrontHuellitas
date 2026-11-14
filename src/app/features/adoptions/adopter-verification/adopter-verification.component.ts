import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdoptionService } from '../../../core/services/adoption.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AdopterVerification } from '../../../core/models/adoption.model';
import { UserRole } from '../../../core/models/user.model';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';

@Component({
  selector: 'app-adopter-verification',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <!-- Header -->
      <section class="liquid-glass rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden border border-emerald-500/20">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5 sm:gap-4">
            <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-emerald-500/25 flex-shrink-0">
              🛡️
            </div>
            <div>
              <h1 class="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Verificación de Adoptante
              </h1>
              <p class="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                Los niveles 2 y 3 son revisados y autorizados por un Rescatista Verificado o Administrador de Dolores Hidalgo.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-center">
            @if (isRescuerOrAdmin()) {
              <a
                routerLink="/panel-rescatista"
                [queryParams]="{ tab: 'verifications' }"
                class="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md flex items-center gap-1.5"
              >
                <span>📋</span> Evaluar Solicitudes
              </a>
            }
            <a
              routerLink="/"
              class="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              ← Volver
            </a>
          </div>
        </div>

        <!-- Levels Progress Bar -->
        <div class="mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/60">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-xs">
            <div
              class="p-3 rounded-2xl border transition-all flex sm:flex-col items-center justify-between sm:justify-center gap-2"
              [ngClass]="hasLevel1() ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold'"
            >
              <span class="text-lg">📱</span>
              <div>
                <span class="block">Nivel 1: Teléfono</span>
                <span class="text-[10px] uppercase font-extrabold">
                  {{ hasLevel1() ? '✓ Confirmado' : '⚠️ Falta teléfono (10 dígitos)' }}
                </span>
              </div>
            </div>

            <div
              class="p-3 rounded-2xl border transition-all flex sm:flex-col items-center justify-between sm:justify-center gap-2"
              [ngClass]="
                verification()?.isLevel2Completed
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold'
                  : verification()?.level2Status === 'PENDIENTE'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400'
              "
            >
              <span class="text-lg">📋</span>
              <div>
                <span class="block">Nivel 2: Cuestionario</span>
                <span class="text-[10px] uppercase font-extrabold">
                  @if (verification()?.isLevel2Completed) {
                    ✓ Aprobado por Rescatista
                  } @else if (verification()?.level2Status === 'PENDIENTE') {
                    ⏳ En Revisión
                  } @else if (verification()?.level2Status === 'RECHAZADO') {
                    ⚠️ Con Observaciones
                  } @else {
                    Pendiente de envío
                  }
                </span>
              </div>
            </div>

            <div
              class="p-3 rounded-2xl border transition-all flex sm:flex-col items-center justify-between sm:justify-center gap-2"
              [ngClass]="
                verification()?.isLevel3Completed
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold'
                  : verification()?.level3Status === 'PENDIENTE'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold'
                    : verification()?.level3Status === 'RECHAZADO'
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold'
                      : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400'
              "
            >
              <span class="text-lg">🏡</span>
              <div>
                <span class="block">Nivel 3: Compromiso</span>
                <span class="text-[10px] uppercase font-extrabold">
                  @if (verification()?.isLevel3Completed) {
                    ✓ Adoptante Verificado
                  } @else if (verification()?.level3Status === 'PENDIENTE') {
                    ⏳ En Revisión
                  } @else if (verification()?.level3Status === 'RECHAZADO') {
                    ⚠️ Con Observaciones
                  } @else if (!verification()?.isLevel2Completed) {
                    🔒 Requiere Nivel 2 Aprobado
                  } @else {
                    Disponible para solicitar
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      @if (isRescuerOrAdmin()) {
        <div class="p-4 sm:p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-xs text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div class="flex items-start gap-3">
            <span class="text-2xl flex-shrink-0">🛡️</span>
            <div>
              <strong class="block font-black text-emerald-700 dark:text-emerald-300 uppercase text-[11px]">
                Rol de Rescatista / Administrador Activo
              </strong>
              <p class="mt-0.5 leading-relaxed text-slate-700 dark:text-slate-300">
                Como Administrador o Rescatista Verificado puedes revisar, aprobar, rechazar o actualizar las solicitudes de Nivel 2 y Nivel 3 de los ciudadanos desde el Panel de Evaluación.
              </p>
            </div>
          </div>
          <a
            routerLink="/panel-rescatista"
            [queryParams]="{ tab: 'verifications' }"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md whitespace-nowrap text-center"
          >
            Ir a Evaluar Solicitudes →
          </a>
        </div>
      }

      @if (verification()?.reviewNotes && (verification()?.level2Status === 'RECHAZADO' || verification()?.level3Status === 'RECHAZADO')) {
        <div class="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-xs text-slate-800 dark:text-slate-100 flex items-start gap-3 shadow-md">
          <span class="text-xl flex-shrink-0">💬</span>
          <div>
            <strong class="block font-black text-amber-700 dark:text-amber-300 uppercase text-[11px]">
              Observaciones del Rescatista / Administrador para corregir tu solicitud:
            </strong>
            <p class="mt-0.5 leading-relaxed">{{ verification()!.reviewNotes }}</p>
          </div>
        </div>
      }

      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-16 text-center space-y-3">
          <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-xs font-bold text-slate-500">Cargando expediente de verificación...</p>
        </div>
      } @else {
        <!-- STEP 1: Phone verification notification -->
        <section class="liquid-glass rounded-3xl p-5 sm:p-6 shadow-xl space-y-3 border border-slate-200/80 dark:border-slate-800">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📱</span>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Nivel 1: Teléfono de Contacto</h3>
                <p class="text-xs text-slate-500">
                  Teléfono registrado: <strong>{{ authService.currentUser()?.phone || 'Sin registrar' }}</strong>
                </p>
              </div>
            </div>
            @if (hasLevel1()) {
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                ✓ Confirmado
              </span>
            } @else {
              <a
                routerLink="/perfil"
                class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:underline"
              >
                Registrar en Mi Perfil →
              </a>
            }
          </div>
        </section>

        <!-- STEP 2: Socio-environmental questionnaire -->
        <section class="liquid-glass rounded-3xl p-5 sm:p-8 shadow-xl space-y-5 border border-slate-200/80 dark:border-slate-800">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📋</span>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  Nivel 2: Cuestionario Socioambiental
                </h3>
                <p class="text-xs text-slate-500">
                  Tus respuestas serán revisadas y aprobadas por un Rescatista Verificado o Administrador.
                </p>
              </div>
            </div>

            @if (verification()?.isLevel2Completed) {
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                ✓ Aprobado por Rescatista/Admin
              </span>
            } @else if (verification()?.level2Status === 'PENDIENTE') {
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                ⏳ En Revisión por Rescatista/Admin
              </span>
            } @else if (verification()?.level2Status === 'RECHAZADO') {
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                ⚠️ Requiere Corrección
              </span>
            }
          </div>

          <div class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tipo de vivienda</label>
                <select
                  [(ngModel)]="level2Form.housingType"
                  [disabled]="!!verification()?.isLevel2Completed"
                  class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white disabled:opacity-60"
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
                  [disabled]="!!verification()?.isLevel2Completed"
                  class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white disabled:opacity-60"
                >
                  <option [ngValue]="true">Sí, está totalmente permitido</option>
                  <option [ngValue]="false">No / Con restricciones</option>
                </select>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between gap-2 mb-1">
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                  ¿Quiénes habitan el hogar? (adultos, niños y edades) *
                </label>
                <span class="text-[11px] font-medium tabular-nums" [ngClass]="l2Len('peopleInHome') >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
                  {{ l2Len('peopleInHome') }}/3 mín.
                </span>
              </div>
              <input
                type="text"
                [(ngModel)]="level2Form.peopleInHome"
                (blur)="markL2Touched('peopleInHome')"
                [disabled]="!!verification()?.isLevel2Completed"
                placeholder="Ej: 2 adultos (30 y 32 años) y 1 niño de 7 años"
                class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border text-slate-800 dark:text-white disabled:opacity-60 focus:outline-none transition-colors"
                [ngClass]="l2ShouldShowError('peopleInHome') ? 'border-rose-500 bg-rose-500/5' : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'"
              />
              @if (l2ShouldShowError('peopleInHome')) {
                <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {{ l2MinMsg('peopleInHome', 'Indica cuántas personas viven en tu domicilio y sus edades aproximadas.') }}
                </p>
              }
            </div>

            <div>
              <div class="flex items-center justify-between gap-2 mb-1">
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Experiencia previa con animales de compañía *
                </label>
                <span class="text-[11px] font-medium tabular-nums" [ngClass]="l2Len('previousExperience') >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
                  {{ l2Len('previousExperience') }}/3 mín.
                </span>
              </div>
              <textarea
                [(ngModel)]="level2Form.previousExperience"
                (blur)="markL2Touched('previousExperience')"
                [disabled]="!!verification()?.isLevel2Completed"
                rows="2"
                placeholder="He tenido perros mestizos antes, vivieron conmigo hasta su vejez..."
                class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border text-slate-800 dark:text-white disabled:opacity-60 focus:outline-none transition-colors"
                [ngClass]="l2ShouldShowError('previousExperience') ? 'border-rose-500 bg-rose-500/5' : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'"
              ></textarea>
              @if (l2ShouldShowError('previousExperience')) {
                <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {{ l2MinMsg('previousExperience', 'Describe brevemente tu experiencia previa o si será tu primera mascota.') }}
                </p>
              }
            </div>

            <div>
              <div class="flex items-center justify-between gap-2 mb-1">
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Plan en caso de mudanza, cambio de trabajo o viaje largo *
                </label>
                <span class="text-[11px] font-medium tabular-nums" [ngClass]="l2Len('relocationPlan') >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
                  {{ l2Len('relocationPlan') }}/3 mín.
                </span>
              </div>
              <input
                type="text"
                [(ngModel)]="level2Form.relocationPlan"
                (blur)="markL2Touched('relocationPlan')"
                [disabled]="!!verification()?.isLevel2Completed"
                placeholder="La mascota se mudará conmigo a donde vaya o se queda con familia de confianza"
                class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border text-slate-800 dark:text-white disabled:opacity-60 focus:outline-none transition-colors"
                [ngClass]="l2ShouldShowError('relocationPlan') ? 'border-rose-500 bg-rose-500/5' : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'"
              />
              @if (l2ShouldShowError('relocationPlan')) {
                <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {{ l2MinMsg('relocationPlan', 'Explica quién cuidará o cómo trasladarás a la mascota ante cambios.') }}
                </p>
              }
            </div>

            <div>
              <div class="flex items-center justify-between gap-2 mb-1">
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                  ¿Quién solventará gastos veterinarios, vacunas y alimento? *
                </label>
                <span class="text-[11px] font-medium tabular-nums" [ngClass]="l2Len('financialResponsible') >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
                  {{ l2Len('financialResponsible') }}/3 mín.
                </span>
              </div>
              <input
                type="text"
                [(ngModel)]="level2Form.financialResponsible"
                (blur)="markL2Touched('financialResponsible')"
                [disabled]="!!verification()?.isLevel2Completed"
                placeholder="Ej: Yo mismo(a) mediante mis ingresos fijos"
                class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border text-slate-800 dark:text-white disabled:opacity-60 focus:outline-none transition-colors"
                [ngClass]="l2ShouldShowError('financialResponsible') ? 'border-rose-500 bg-rose-500/5' : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'"
              />
              @if (l2ShouldShowError('financialResponsible')) {
                <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {{ l2MinMsg('financialResponsible', 'Indica quién cubrirá alimentación y consultas médicas.') }}
                </p>
              }
            </div>

            @if (!verification()?.isLevel2Completed) {
              @if (level2Attempted() && l2MissingItems().length > 0) {
                <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-700 dark:text-rose-300 space-y-1">
                  <p class="font-bold">Completa los siguientes campos para enviar Nivel 2:</p>
                  <ul class="list-disc pl-4 space-y-0.5">
                    @for (item of l2MissingItems(); track item) {
                      <li>{{ item }}</li>
                    }
                  </ul>
                </div>
              }
              <button
                (click)="submitLevel2()"
                [disabled]="isSavingLevel2()"
                class="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md cursor-pointer disabled:opacity-50 transition-all"
              >
                @if (isSavingLevel2()) {
                  Enviando a revisión...
                } @else if (verification()?.level2Status === 'PENDIENTE') {
                  🔄 Actualizar Respuestas en Revisión
                } @else {
                  📤 Enviar Cuestionario Nivel 2 a Revisión
                }
              </button>
            }
          </div>
        </section>

        <!-- STEP 3: Commitment letter and yard photos (STRICTLY REQUIRES LEVEL 2 APPROVED) -->
        <section
          class="liquid-glass rounded-3xl p-5 sm:p-8 shadow-xl space-y-5 border border-slate-200/80 dark:border-slate-800 transition-opacity"
          [ngClass]="{ 'opacity-65': !verification()?.isLevel2Completed }"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🏡</span>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  Nivel 3: Carta Compromiso y Espacio Digno
                </h3>
                <p class="text-xs text-slate-500">
                  Requiere Nivel 2 aprobado y autorización final por un Rescatista o Administrador.
                </p>
              </div>
            </div>

            @if (verification()?.isLevel3Completed) {
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                ✓ Nivel 3 Aprobado (Adoptante Verificado)
              </span>
            } @else if (verification()?.level3Status === 'PENDIENTE') {
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                ⏳ En Revisión por Rescatista/Admin
              </span>
            } @else if (verification()?.level3Status === 'RECHAZADO') {
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                ⚠️ Requiere Corrección
              </span>
            } @else if (!verification()?.isLevel2Completed) {
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                🔒 Bloqueado hasta aprobar Nivel 2
              </span>
            }
          </div>

          @if (!verification()?.isLevel2Completed) {
            <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-3">
              <span class="text-xl">🔒</span>
              <span>
                Para solicitar el <strong>Nivel 3</strong>, primero debes enviar el Cuestionario de <strong>Nivel 2</strong> y esperar a que un <strong>Rescatista Verificado o Administrador</strong> lo apruebe.
              </span>
            </div>
          }

          <div class="space-y-4 text-xs">
            <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-slate-700 dark:text-slate-200 leading-relaxed">
              <span class="font-black text-emerald-700 dark:text-emerald-400 block">
                📜 Decálogo de Adopción Responsable Huellitas Dolores Hidalgo:
              </span>
              <ul class="list-disc pl-5 space-y-1 text-[11px]">
                <li>No mantener al animal en azoteas desprotegidas, balcones peligrosos ni atado a cadenas.</li>
                <li>Brindarle alimento digno, agua limpia y resguardo de la lluvia y frío.</li>
                <li>Mantener al día su cuadro de vacunación anual y esterilización.</li>
                <li>Aceptar el seguimiento preventivo a las 2 semanas, 1 mes, medio año y 1 año enviando evidencia fotográfica de su bienestar al rescatista.</li>
                <li>Prohibición estricta de reventa, cruza lucrativa o abandono.</li>
              </ul>
            </div>

            <label
              class="flex items-start gap-2.5"
              [ngClass]="verification()?.isLevel2Completed && !verification()?.isLevel3Completed ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'"
            >
              <input
                type="checkbox"
                [(ngModel)]="level3Form.signedCommitmentLetter"
                [disabled]="!verification()?.isLevel2Completed || !!verification()?.isLevel3Completed"
                class="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span class="text-slate-800 dark:text-white font-semibold">
                He leído y acepto formalmente la Carta Compromiso de Bienestar Animal de Huellitas Dolores Hidalgo.
              </span>
            </label>

            @if (level3Attempted() && !level3Form.signedCommitmentLetter && verification()?.isLevel2Completed) {
              <p class="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                Debes marcar la casilla de aceptación de la Carta Compromiso para enviar tu solicitud de Nivel 3.
              </p>
            }

            @if (!verification()?.isLevel3Completed) {
              <button
                (click)="submitLevel3()"
                [disabled]="
                  isSavingLevel3() ||
                  !verification()?.isLevel2Completed ||
                  verification()?.level3Status === 'PENDIENTE'
                "
                class="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                @if (isSavingLevel3()) {
                  Enviando solicitud...
                } @else if (verification()?.level3Status === 'PENDIENTE') {
                  ⏳ Solicitud de Nivel 3 en Revisión por Rescatista/Admin
                } @else {
                  📤 Firmar y Solicitar Aprobación de Nivel 3
                }
              </button>
            }
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
  level2Touched = signal<Record<string, boolean>>({});
  level2Attempted = signal<boolean>(false);
  level3Attempted = signal<boolean>(false);

  isRescuerOrAdmin = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === UserRole.ADMIN || role === UserRole.RESCATISTA_VERIFICADO || role === UserRole.ALBERGUE;
  });

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

  hasLevel1 = computed(() => {
    const u = this.authService.currentUser();
    if (!u) return false;
    if (this.isRescuerOrAdmin()) return true;
    if ((u.verificationLevel ?? 0) >= 1 || u.isPhoneVerified) return true;
    return (u.phone || '').replace(/\D/g, '').length >= 10;
  });

  currentLevel(): number {
    const v = this.verification();
    if (v?.isLevel3Completed) return 3;
    if (v?.isLevel2Completed) return 2;
    return this.hasLevel1() ? 1 : 0;
  }

  markL2Touched(field: string): void {
    this.level2Touched.update((prev) => ({ ...prev, [field]: true }));
  }

  l2Len(field: 'peopleInHome' | 'previousExperience' | 'relocationPlan' | 'financialResponsible'): number {
    return (this.level2Form[field] || '').trim().length;
  }

  l2ShouldShowError(field: 'peopleInHome' | 'previousExperience' | 'relocationPlan' | 'financialResponsible'): boolean {
    return (this.level2Touched()[field] || this.level2Attempted()) && this.l2Len(field) < 3;
  }

  l2MinMsg(
    field: 'peopleInHome' | 'previousExperience' | 'relocationPlan' | 'financialResponsible',
    emptyMsg: string,
  ): string {
    const len = this.l2Len(field);
    if (len === 0) return `${emptyMsg} (mínimo 3 caracteres).`;
    const missing = 3 - len;
    return `Respuesta muy corta (${len}/3): agrega ${missing} ${missing === 1 ? 'carácter más' : 'caracteres más'}.`;
  }

  l2MissingItems(): string[] {
    const items: string[] = [];
    if (this.l2Len('peopleInHome') < 3) items.push(`Habitantes del hogar (${this.l2Len('peopleInHome')}/3 caracteres mín.)`);
    if (this.l2Len('previousExperience') < 3) items.push(`Experiencia previa (${this.l2Len('previousExperience')}/3 caracteres mín.)`);
    if (this.l2Len('relocationPlan') < 3) items.push(`Plan ante mudanza o viaje (${this.l2Len('relocationPlan')}/3 caracteres mín.)`);
    if (this.l2Len('financialResponsible') < 3) items.push(`Responsable económico (${this.l2Len('financialResponsible')}/3 caracteres mín.)`);
    return items;
  }

  isLevel2FormValid(): boolean {
    return this.l2MissingItems().length === 0;
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
    this.level2Attempted.set(true);
    if (!this.isLevel2FormValid()) {
      return;
    }
    this.isSavingLevel2.set(true);
    this.adoptionService.submitLevel2(this.level2Form as any).subscribe({
      next: (updated) => {
        this.isSavingLevel2.set(false);
        this.verification.set(updated);
        this.notify.success(
          'Cuestionario enviado a revisión',
          'Un Rescatista Verificado o Administrador revisará tus respuestas para aprobar tu Nivel 2.',
        );
      },
      error: (err) => {
        this.isSavingLevel2.set(false);
        this.notify.error(err.error?.message || 'Error al enviar cuestionario');
      },
    });
  }

  submitLevel3(): void {
    this.level3Attempted.set(true);
    if (!this.verification()?.isLevel2Completed) {
      this.notify.warning('Un Rescatista o Administrador debe aprobar primero tu Nivel 2.');
      return;
    }
    if (!this.level3Form.signedCommitmentLetter) {
      return;
    }
    this.isSavingLevel3.set(true);
    this.adoptionService.submitLevel3(this.level3Form as any).subscribe({
      next: (updated) => {
        this.isSavingLevel3.set(false);
        this.verification.set(updated);
        this.notify.success(
          'Solicitud de Nivel 3 enviada',
          'Un Rescatista Verificado o Administrador validará tu Carta Compromiso para otorgarte el Nivel 3.',
        );
      },
      error: (err) => {
        this.isSavingLevel3.set(false);
        this.notify.error(err.error?.message || 'Error al solicitar Nivel 3');
      },
    });
  }
}
