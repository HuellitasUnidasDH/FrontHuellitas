import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdoptionService } from '../../../core/services/adoption.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { ImageUploadService } from '../../../core/services/image-upload.service';
import {
  AdopterVerification,
  AdoptionRequest,
  AdoptionRequestStatus,
} from '../../../core/models/adoption.model';
import { UserRole } from '../../../core/models/user.model';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';
import {
  getCandidateVerificationBadge,
  getRequestStepIndex,
  getStageMeta,
} from '../shared/adoption-helpers.util';
import { AdoptionAgreementDocumentComponent } from '../shared/adoption-agreement-document.component';

interface SectionDef {
  index: number;
  code: string;
  label: string;
  shortTitle: string;
  subtitle: string;
}

@Component({
  selector: 'app-adoption-evaluation-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdoptionAgreementDocumentComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <!-- Top Return & Breadcrumb Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <a
          [routerLink]="backRoute()"
          [queryParams]="backQueryParams()"
          class="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Volver a gestión de adopciones</span>
        </a>

        @if (request(); as req) {
          <span
            class="px-3 py-1 rounded-full text-[11px] font-bold border"
            [ngClass]="getStageMeta(req.status).colorClass"
          >
            {{ getStageMeta(req.status).label }}
          </span>
        }
      </div>

      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-16 text-center space-y-3 border border-slate-200/80 dark:border-slate-800">
          <div class="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Cargando expediente de evaluación...
          </p>
        </div>
      } @else if (request(); as req) {
        @let badge = candidateBadge(req.adopter);
        @let stageMeta = getStageMeta(req.status);
        @let currentStep = activeSection();

        <!-- Compact Summary Header (Pet + Candidate + Contact + Progress) -->
        <section class="liquid-glass rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-5">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="flex items-start gap-4 min-w-0">
              <img
                [src]="req.pet?.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80'"
                [alt]="req.pet?.name || 'Mascota'"
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm"
              />
              <div class="min-w-0 space-y-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Evaluación de Solicitud • {{ req.pet?.name }} ({{ req.pet?.species }})
                </p>
                <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {{ req.adopter?.fullName || 'Postulante' }}
                </h1>
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{{ req.adopter?.phone || 'Sin teléfono' }}</span>
                  <span>•</span>
                  <span>{{ req.adopter?.colonia?.name || req.adopterAddress || 'Dolores Hidalgo' }}</span>
                  <span
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                    [ngClass]="badge.badgeClass"
                    [title]="badge.subtitle"
                  >
                    Nivel {{ badge.level }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Quick Direct Communication -->
            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                (click)="openDirectChat(req)"
                class="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Mensaje interno</span>
              </button>

              @if (req.adopter?.phone) {
                <a
                  [href]="getWhatsAppUrl(req)"
                  target="_blank"
                  class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              }
            </div>
          </div>

          <!-- Overall Progress Bar + Section Stepper Tabs -->
          <div class="space-y-3 pt-1">
            <div class="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Avance del protocolo de adopción</span>
              <span class="tabular-nums font-bold text-slate-700 dark:text-slate-200">{{ stageMeta.progress }}%</span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                [style.width.%]="stageMeta.progress"
              ></div>
            </div>

            <!-- 4-Section Interactive Stepper -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              @for (sec of sections; track sec.index) {
                @let completed = isSectionCompleted(sec.index, req);
                @let active = currentStep === sec.index;
                <button
                  type="button"
                  (click)="goToSection(sec.index)"
                  class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5"
                  [ngClass]="
                    active
                      ? 'bg-emerald-500/12 border-emerald-500 shadow-sm ring-1 ring-emerald-500/40'
                      : completed
                        ? 'bg-slate-50 dark:bg-slate-900/70 border-emerald-500/30 hover:border-emerald-500/60'
                        : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  "
                >
                  <span
                    class="w-7 h-7 rounded-xl text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums transition-colors"
                    [ngClass]="
                      active
                        ? 'bg-emerald-500 text-slate-950'
                        : completed
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    "
                  >
                    @if (completed && !active) {
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    } @else {
                      {{ sec.code }}
                    }
                  </span>
                  <div class="min-w-0">
                    <span
                      class="block text-[10px] font-bold uppercase tracking-wider truncate"
                      [ngClass]="
                        active
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : completed
                            ? 'text-emerald-600 dark:text-emerald-500'
                            : 'text-slate-400'
                      "
                    >
                      {{ completed ? 'Completado' : active ? 'En vista' : 'Etapa ' + sec.code }}
                    </span>
                    <span class="block text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {{ sec.shortTitle }}
                    </span>
                  </div>
                </button>
              }
            </div>
          </div>
        </section>

        <!-- Rejection / Closed Banner when applicable -->
        @if (req.status === 'RECHAZADA' || req.status === 'CANCELADA') {
          <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div class="text-xs space-y-1">
              <p class="font-black text-rose-700 dark:text-rose-300">
                Solicitud {{ req.status === 'RECHAZADA' ? 'no aprobada' : 'cancelada' }}
              </p>
              @if (req.rejectionReason) {
                <p class="text-slate-700 dark:text-slate-300">Motivo registrado: {{ req.rejectionReason }}</p>
              }
            </div>
          </div>
        }

        <!-- FOCUSED ACTIVE SECTION SLIDE (One clear section at a time) -->
        <section class="liquid-glass rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 animate-fadeIn">
          <!-- Active Section Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <span class="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-black text-xs flex items-center justify-center tabular-nums">
                {{ sections[currentStep].code }}
              </span>
              <div>
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {{ sections[currentStep].label }}
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ sections[currentStep].subtitle }}
                </p>
              </div>
            </div>

            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider tabular-nums">
              Sección {{ currentStep + 1 }} de {{ sections.length }}
            </span>
          </div>

          <!-- ======================================================== -->
          <!-- SECCIÓN 01: PERFIL DEL POSTULANTE Y CUESTIONARIO         -->
          <!-- ======================================================== -->
          @if (currentStep === 0) {
            <div class="space-y-6">
              <!-- Candidate Summary Grid -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Perfil y Verificación</span>
                  <p class="text-sm font-black text-slate-900 dark:text-white">{{ badge.title }}</p>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ badge.subtitle }}</p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Red Social Declarada</span>
                  <p class="text-sm font-bold text-slate-900 dark:text-white break-all">
                    {{ req.adopterSocialMedia || req.questionnaireData?.socialMedia || 'No especificada' }}
                  </p>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">Úsalo para el cotejo de identidad en la Etapa 02</p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Zona / Domicilio Aproximado</span>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">
                    {{ req.adopterAddress || req.questionnaireData?.address || req.adopter?.colonia?.name || 'No especificado' }}
                  </p>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">
                    Fecha de postulación: {{ req.createdAt | date:'dd/MM/yyyy HH:mm' }}
                  </p>
                </div>
              </div>

              <!-- Questionnaire Responses -->
              <div class="space-y-3">
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Cuestionario de Postulación
                </h3>

                @if (req.questionnaireData) {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div class="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                      <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tipo de vivienda</span>
                      <p class="font-semibold text-slate-800 dark:text-slate-100">
                        {{ req.questionnaireData.housingType || 'No especificado' }}
                      </p>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                      <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Acuerdo familiar</span>
                      <p class="font-semibold text-slate-800 dark:text-slate-100">
                        {{ req.questionnaireData.familyAgreed || 'No especificado' }}
                      </p>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                      <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mascotas actuales y salud</span>
                      <p class="font-semibold text-slate-800 dark:text-slate-100">
                        {{ req.questionnaireData.currentPets || 'No especificado' }}
                      </p>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                      <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Plan ante mudanza o viajes</span>
                      <p class="font-semibold text-slate-800 dark:text-slate-100">
                        {{ req.questionnaireData.relocationPlan || 'No especificado' }}
                      </p>
                    </div>
                    <div class="md:col-span-2 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                      <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Motivación y tiempo diario disponible</span>
                      <p class="font-medium text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                        {{ req.questionnaireData.motivation || req.adopterMessage || 'Sin comentarios adicionales.' }}
                      </p>
                    </div>
                  </div>
                } @else if (req.adopterMessage) {
                  <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {{ req.adopterMessage }}
                  </div>
                }
              </div>

              <!-- Verificación Previa del Adoptante (Nivel 2/3 y fotos de hogar) -->
              @if (verification(); as ver) {
                <div class="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <h3 class="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-400">
                      Expediente Previo del Adoptante (Niveles 2 y 3)
                    </h3>
                    <span class="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Vivienda registrada: {{ formatHousing(ver.housingType) }}
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div class="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span class="text-[10px] text-slate-400 uppercase font-bold block">Personas en casa</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-100">{{ ver.peopleInHome || 'No indicado' }}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span class="text-[10px] text-slate-400 uppercase font-bold block">Responsable económico</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-100">{{ ver.financialResponsible || 'No indicado' }}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span class="text-[10px] text-slate-400 uppercase font-bold block">Cerco / Espacio seguro</span>
                      <span class="font-semibold" [ngClass]="ver.hasSafeEnclosure ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
                        {{ ver.hasSafeEnclosure ? 'Declarado como seguro' : 'Por confirmar en visita' }}
                      </span>
                    </div>
                  </div>

                  @if (ver.homeYardPhotos && ver.homeYardPhotos.length > 0) {
                    <div class="space-y-1.5">
                      <span class="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Fotografías de hogar / patio enviadas por el postulante ({{ ver.homeYardPhotos.length }}):
                      </span>
                      <div class="flex flex-wrap gap-2.5">
                        @for (photoUrl of ver.homeYardPhotos; track $index) {
                          <a
                            [href]="photoUrl"
                            target="_blank"
                            class="w-24 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 hover:border-emerald-500 transition-colors block shadow-sm"
                          >
                            <img [src]="photoUrl" alt="Foto de espacio del hogar" class="w-full h-full object-cover" />
                          </a>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- ======================================================== -->
          <!-- SECCIÓN 02: ETAPA 1 - ENTREVISTA Y REDES SOCIALES        -->
          <!-- ======================================================== -->
          @if (currentStep === 1) {
            <div class="space-y-5">
              @if (req.adopterSocialMedia || req.questionnaireData?.socialMedia) {
                <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-400 block">Perfil a revisar</span>
                    <span class="font-bold text-slate-900 dark:text-white">{{ req.adopterSocialMedia || req.questionnaireData?.socialMedia }}</span>
                  </div>
                  @if (req.interviewCompletedAt) {
                    <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                      Entrevista registrada el {{ req.interviewCompletedAt | date:'dd/MM/yyyy HH:mm' }}
                    </span>
                  }
                </div>
              }

              <div class="space-y-2.5">
                <label class="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-500/40 transition-colors">
                  <input
                    type="checkbox"
                    [(ngModel)]="stageForm.socialMediaReviewed"
                    [disabled]="isClosed(req)"
                    class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div class="text-xs">
                    <span class="font-bold text-slate-900 dark:text-white block">Perfil de redes sociales revisado</span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">Se corroboró congruencia de identidad y ausencia de señales de riesgo.</span>
                  </div>
                </label>

                <label class="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-500/40 transition-colors">
                  <input
                    type="checkbox"
                    [(ngModel)]="stageForm.interviewCompleted"
                    [disabled]="isClosed(req)"
                    class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div class="text-xs">
                    <span class="font-bold text-slate-900 dark:text-white block">Entrevista inicial realizada</span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">Se conversó por mensaje, llamada o videollamada sobre horarios, gastos veterinarios y cuidados.</span>
                  </div>
                </label>
              </div>

              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Observaciones de la entrevista y filtro de redes
                </label>
                <textarea
                  [(ngModel)]="stageForm.interviewNotes"
                  [disabled]="isClosed(req)"
                  rows="3"
                  placeholder="Anota puntos clave sobre disponibilidad, acuerdos familiares, veterinario cercano o dudas resueltas..."
                  class="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              @if (!isClosed(req)) {
                <div class="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    (click)="saveStage('EN_ENTREVISTA')"
                    [disabled]="isSavingStage()"
                    class="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    Guardar notas de entrevista
                  </button>
                  <button
                    type="button"
                    (click)="approveInterviewAndContinue()"
                    [disabled]="isSavingStage()"
                    class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-105 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    Aprobar Entrevista y Avanzar a Visita Domiciliaria
                  </button>
                </div>
              }
            </div>
          }

          <!-- ======================================================== -->
          <!-- SECCIÓN 03: ETAPA 2 - VISITA DOMICILIARIA                -->
          <!-- ======================================================== -->
          @if (currentStep === 2) {
            <div class="space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Fecha y hora programada para visita / videollamada
                  </label>
                  <input
                    type="datetime-local"
                    [(ngModel)]="stageForm.homeVisitScheduledAt"
                    [disabled]="isClosed(req)"
                    class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">
                    Si aún no agendas fecha exacta, puedes dejarlo vacío y completarlo al coordinar por chat.
                  </p>
                </div>

                <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-center text-xs">
                  <span class="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Domicilio de referencia</span>
                  <span class="font-bold text-slate-900 dark:text-white">
                    {{ req.adopterAddress || req.questionnaireData?.address || req.adopter?.colonia?.name || 'Por confirmar en mensaje' }}
                  </span>
                </div>
              </div>

              <div class="space-y-2.5">
                <label
                  class="flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors"
                  [ngClass]="
                    visitValidationError() && !stageForm.homeVisitFamilyAccepted
                      ? 'bg-rose-500/8 border-rose-500/50'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                  "
                >
                  <input
                    type="checkbox"
                    [(ngModel)]="stageForm.homeVisitFamilyAccepted"
                    (ngModelChange)="visitValidationError.set('')"
                    [disabled]="isClosed(req)"
                    class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div class="text-xs">
                    <span class="font-bold text-slate-900 dark:text-white block">
                      Aceptación familiar confirmada <span class="text-rose-500">*</span>
                    </span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">
                      Requisito obligatorio para liberar el convenio: las personas que habitan el domicilio aceptan recibir a {{ req.pet?.name }}.
                    </span>
                  </div>
                </label>

                <label class="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-500/40 transition-colors">
                  <input
                    type="checkbox"
                    [(ngModel)]="stageForm.homeVisitSafeConditions"
                    [disabled]="isClosed(req)"
                    class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div class="text-xs">
                    <span class="font-bold text-slate-900 dark:text-white block">Espacio físico y seguridad verificados</span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">
                      Bardas, portones, protección contra escapes, sombra y área de descanso adecuados.
                    </span>
                  </div>
                </label>

                <label class="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-500/40 transition-colors">
                  <input
                    type="checkbox"
                    [(ngModel)]="stageForm.homeVisitCompleted"
                    [disabled]="isClosed(req)"
                    class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div class="text-xs">
                    <span class="font-bold text-slate-900 dark:text-white block">Visita domiciliaria concluida</span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">
                      Se realizó recorrido presencial o por videollamada en el domicilio.
                    </span>
                  </div>
                </label>
              </div>

              @if (visitValidationError()) {
                <p class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  {{ visitValidationError() }}
                </p>
              }

              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Notas de la visita domiciliaria
                </label>
                <textarea
                  [(ngModel)]="stageForm.homeVisitNotes"
                  [disabled]="isClosed(req)"
                  rows="3"
                  placeholder="Describe las condiciones del hogar, acuerdos tomados durante la visita o recomendaciones..."
                  class="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              @if (!isClosed(req)) {
                <div class="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    (click)="saveStage('VISITA_DOMICILIARIA')"
                    [disabled]="isSavingStage()"
                    class="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    Guardar / Agendar visita
                  </button>
                  <button
                    type="button"
                    (click)="approveVisitAndReleaseAgreement()"
                    [disabled]="isSavingStage()"
                    class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-105 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    Aprobar Visita y Habilitar Firma de Convenio
                  </button>
                </div>
              }
            </div>
          }

          <!-- ======================================================== -->
          <!-- SECCIÓN 04: ETAPAS 3 Y 4 - CONVENIO, INE Y CIERRE        -->
          <!-- ======================================================== -->
          @if (currentStep === 3) {
            <div class="space-y-5">
              <!-- Checklist claro de requisitos antes de formalizar -->
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Lista de Verificación para Entrega Formal
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <!-- Requirement 1: Digital Agreement Signature -->
                  <div
                    class="p-3.5 rounded-2xl border flex items-start gap-2.5"
                    [ngClass]="
                      req.agreementSignedAt
                        ? 'bg-emerald-500/8 border-emerald-500/35'
                        : 'bg-amber-500/8 border-amber-500/35'
                    "
                  >
                    <span
                      class="w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5"
                      [ngClass]="req.agreementSignedAt ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'"
                    >
                      {{ req.agreementSignedAt ? '✓' : '!' }}
                    </span>
                    <div class="space-y-1">
                      <span class="font-bold text-slate-900 dark:text-white block">
                        1. Convenio digital firmado por el adoptante
                      </span>
                      @if (req.agreementSignedAt) {
                        <span class="text-[11px] text-emerald-700 dark:text-emerald-300 block">
                          Firmado el {{ req.agreementSignedAt | date:'dd/MM/yyyy HH:mm' }}.
                        </span>
                      } @else {
                        <span class="text-[11px] text-amber-800 dark:text-amber-300 block">
                          Pendiente: el adoptante debe firmarlo desde su sección "Mis Adopciones" (una vez habilitado el convenio en la Etapa 03).
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Requirement 2: Physical INE verification -->
                  <label
                    class="p-3.5 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-colors"
                    [ngClass]="
                      formalizeValidationError() && !stageForm.ineVerifiedInPerson
                        ? 'bg-rose-500/8 border-rose-500/50'
                        : stageForm.ineVerifiedInPerson
                          ? 'bg-emerald-500/8 border-emerald-500/35'
                          : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                    "
                  >
                    <input
                      type="checkbox"
                      [(ngModel)]="stageForm.ineVerifiedInPerson"
                      (ngModelChange)="formalizeValidationError.set('')"
                      [disabled]="isClosed(req)"
                      class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <div class="space-y-0.5">
                      <span class="font-bold text-slate-900 dark:text-white block">
                        2. Cotejo físico presencial de INE <span class="text-rose-500">*</span>
                      </span>
                      <span class="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Confirmo que validé en persona la identificación oficial del adoptante al momento de la entrega (sin almacenar fotografía por LFPDPPP).
                      </span>
                    </div>
                  </label>
                </div>

                <label class="flex items-start gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    [(ngModel)]="stageForm.addressProofVerifiedInPerson"
                    [disabled]="isClosed(req)"
                    class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span class="text-slate-700 dark:text-slate-300">
                    Comprobante de domicilio cotejado en persona o validado correctamente (opcional).
                  </span>
                </label>
              </div>

              <!-- Handover Photo Upload -->
              <div class="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div class="space-y-1">
                  <span class="font-bold text-slate-900 dark:text-white block">
                    Fotografía conmemorativa de entrega (opcional)
                  </span>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Queda registrada en el expediente de adopción y en el historial de seguimiento.
                  </span>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  @if (stageForm.handoverPhotoUrl) {
                    <a [href]="stageForm.handoverPhotoUrl" target="_blank" class="block">
                      <img
                        [src]="stageForm.handoverPhotoUrl"
                        alt="Entrega de mascota"
                        class="w-12 h-12 rounded-xl object-cover border border-emerald-500/40"
                      />
                    </a>
                  }
                  @if (!isClosed(req)) {
                    <label class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold cursor-pointer transition-colors">
                      @if (isUploadingHandover()) {
                        <span>Subiendo foto...</span>
                      } @else {
                        <span>{{ stageForm.handoverPhotoUrl ? 'Cambiar foto' : 'Subir foto de entrega' }}</span>
                      }
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        (change)="onUploadHandover($event)"
                        [disabled]="isUploadingHandover()"
                      />
                    </label>
                  }
                </div>
              </div>

              <!-- Publisher Final Notes -->
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Notas del evaluador / entrega
                </label>
                <textarea
                  [(ngModel)]="stageForm.publisherNotes"
                  [disabled]="isClosed(req)"
                  rows="2"
                  placeholder="Comentarios internos o acuerdos de seguimiento (opcional)..."
                  class="w-full px-3.5 py-2 text-xs rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <!-- Explicit Validation Callout for Formalizing -->
              @if (!isClosed(req)) {
                @if (formalizeMissingRequirements(req).length > 0) {
                  <div
                    class="p-3.5 rounded-2xl border text-xs space-y-1 transition-colors"
                    [ngClass]="
                      formalizeValidationError()
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-100/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    "
                  >
                    <p class="font-bold">
                      Requisitos pendientes para formalizar la adopción:
                    </p>
                    <ul class="list-disc pl-4 space-y-0.5 text-[11px]">
                      @for (item of formalizeMissingRequirements(req); track item) {
                        <li>{{ item }}</li>
                      }
                    </ul>
                  </div>
                }

                <!-- Formalize + Save Progress Buttons -->
                <div class="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    (click)="saveStage(req.status)"
                    [disabled]="isSavingStage()"
                    class="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    Guardar avance
                  </button>

                  <button
                    type="button"
                    (click)="formalizeAdoption()"
                    [disabled]="isSavingStage()"
                    class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-105 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    Formalizar Adopción e Iniciar Seguimiento
                  </button>
                </div>
              }

              <!-- Collapsible Legal Agreement Viewer -->
              <div class="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <h4 class="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Documento del Convenio Oficial
                    </h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">
                      Visualiza, verifica o imprime el convenio generado para esta solicitud.
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="showAgreementPreview.set(!showAgreementPreview())"
                    class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                  >
                    {{ showAgreementPreview() ? 'Ocultar convenio' : 'Ver / Imprimir convenio' }}
                  </button>
                </div>

                @if (showAgreementPreview()) {
                  <app-adoption-agreement-document [request]="req" mode="view" />
                }
              </div>

              <!-- Respectful Rejection Panel -->
              @if (!isClosed(req)) {
                <div class="pt-3 border-t border-slate-200 dark:border-slate-800">
                  @if (!showRejectBox()) {
                    <button
                      type="button"
                      (click)="showRejectBox.set(true)"
                      class="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      No continuar con esta solicitud / Rechazar postulación
                    </button>
                  } @else {
                    <div class="p-4 rounded-2xl bg-rose-500/8 border border-rose-500/30 space-y-3 animate-fadeIn">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-black text-rose-700 dark:text-rose-300">
                          Registrar motivo de no aprobación
                        </span>
                        <span class="text-[11px] font-medium tabular-nums text-rose-600 dark:text-rose-400">
                          {{ rejectionReason().trim().length }}/10 mín.
                        </span>
                      </div>
                      <textarea
                        [ngModel]="rejectionReason()"
                        (ngModelChange)="rejectionReason.set($event); rejectionError.set('')"
                        rows="2"
                        placeholder="Ej: La vivienda actual no cuenta con barda segura para talla grande o se eligió otro perfil compatible..."
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-rose-400/50 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                      ></textarea>
                      @if (rejectionError()) {
                        <p class="text-[11px] font-medium text-rose-600 dark:text-rose-400">{{ rejectionError() }}</p>
                      }
                      <div class="flex flex-wrap items-center gap-2 justify-end">
                        <button
                          type="button"
                          (click)="showRejectBox.set(false); rejectionError.set('')"
                          class="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          (click)="rejectApplication()"
                          [disabled]="isSavingStage()"
                          class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer disabled:opacity-50"
                        >
                          Confirmar no aprobación
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Carousel Bottom Navigation Bar -->
          <div class="pt-4 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              (click)="prevSection()"
              [disabled]="currentStep === 0"
              class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span>{{ currentStep > 0 ? sections[currentStep - 1].shortTitle : 'Inicio' }}</span>
            </button>

            <!-- Carousel Dots -->
            <div class="flex items-center gap-1.5">
              @for (sec of sections; track sec.index) {
                <button
                  type="button"
                  (click)="goToSection(sec.index)"
                  [attr.aria-label]="'Ir a ' + sec.label"
                  class="h-2 rounded-full transition-all cursor-pointer"
                  [ngClass]="
                    currentStep === sec.index
                      ? 'w-7 bg-emerald-500'
                      : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  "
                ></button>
              }
            </div>

            <button
              type="button"
              (click)="nextSection()"
              [disabled]="currentStep === sections.length - 1"
              class="px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/12 hover:bg-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              <span>{{ currentStep < sections.length - 1 ? sections[currentStep + 1].shortTitle : 'Cierre' }}</span>
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </section>
      }
    </div>
  `,
})
export class AdoptionEvaluationDetailComponent implements OnInit {
  brand = BRAND_CONFIG;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adoptionService = inject(AdoptionService);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);
  private confirm = inject(ConfirmService);
  private dmService = inject(DirectMessageService);
  private imageUpload = inject(ImageUploadService);

  request = signal<AdoptionRequest | null>(null);
  verification = signal<AdopterVerification | null>(null);
  isLoading = signal<boolean>(true);
  isSavingStage = signal<boolean>(false);
  isUploadingHandover = signal<boolean>(false);

  activeSection = signal<number>(0);
  showAgreementPreview = signal<boolean>(false);
  showRejectBox = signal<boolean>(false);
  rejectionReason = signal<string>('');
  rejectionError = signal<string>('');
  visitValidationError = signal<string>('');
  formalizeValidationError = signal<string>('');

  readonly sections: SectionDef[] = [
    {
      index: 0,
      code: '01',
      shortTitle: 'Perfil y Cuestionario',
      label: 'Perfil del Postulante y Cuestionario',
      subtitle: 'Revisa primero las respuestas socioambientales, ubicación y verificación previa del solicitante.',
    },
    {
      index: 1,
      code: '02',
      shortTitle: 'Entrevista y Redes',
      label: 'Etapa 1: Entrevista y Validación de Redes',
      subtitle: 'Confirma el perfil de redes sociales, conversa con el interesado y registra observaciones.',
    },
    {
      index: 2,
      code: '03',
      shortTitle: 'Visita Domiciliaria',
      label: 'Etapa 2: Visita Domiciliaria y Entorno',
      subtitle: 'Programa la visita o videollamada, confirma el acuerdo familiar y aprueba el paso a convenio.',
    },
    {
      index: 3,
      code: '04',
      shortTitle: 'Convenio y Entrega',
      label: 'Etapas 3 y 4: Convenio, Cotejo INE y Formalización',
      subtitle: 'Verifica el convenio firmado, realiza el cotejo presencial de INE y concluye la entrega.',
    },
  ];

  stageForm = {
    socialMediaReviewed: false,
    interviewCompleted: false,
    interviewNotes: '',
    homeVisitScheduledAt: '',
    homeVisitFamilyAccepted: false,
    homeVisitSafeConditions: false,
    homeVisitCompleted: false,
    homeVisitNotes: '',
    ineVerifiedInPerson: false,
    addressProofVerifiedInPerson: false,
    handoverPhotoUrl: '',
    publisherNotes: '',
  };

  backRoute = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === UserRole.RESCATISTA_VERIFICADO || role === UserRole.ADMIN
      ? ['/panel-rescatista']
      : ['/mis-adopciones'];
  });

  backQueryParams = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === UserRole.RESCATISTA_VERIFICADO || role === UserRole.ADMIN
      ? {}
      : { tab: 'published' };
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDetail(id);
    }
  }

  getStageMeta(status: AdoptionRequestStatus) {
    return getStageMeta(status);
  }

  candidateBadge(user?: AdoptionRequest['adopter'] | null) {
    return getCandidateVerificationBadge(user);
  }

  isClosed(req: AdoptionRequest): boolean {
    return req.status === 'APROBADA' || req.status === 'RECHAZADA' || req.status === 'CANCELADA';
  }

  isSectionCompleted(sectionIdx: number, req: AdoptionRequest): boolean {
    if (sectionIdx === 0) return true;
    const step = getRequestStepIndex(req);
    if (sectionIdx === 1) return req.interviewCompleted || step >= 2;
    if (sectionIdx === 2) return req.homeVisitCompleted || step >= 3;
    if (sectionIdx === 3) return req.status === 'APROBADA';
    return false;
  }

  private resolveInitialSection(req: AdoptionRequest): number {
    switch (req.status) {
      case 'EN_EVALUACION':
      case 'EN_ENTREVISTA':
        return 1;
      case 'VISITA_DOMICILIARIA':
        return 2;
      case 'ESPERANDO_CONVENIO':
      case 'CONVENIO_FIRMADO':
      case 'APROBADA':
      case 'RECHAZADA':
      case 'CANCELADA':
        return 3;
      default:
        return 0;
    }
  }

  goToSection(index: number): void {
    if (index >= 0 && index < this.sections.length) {
      this.activeSection.set(index);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  prevSection(): void {
    if (this.activeSection() > 0) {
      this.goToSection(this.activeSection() - 1);
    }
  }

  nextSection(): void {
    if (this.activeSection() < this.sections.length - 1) {
      this.goToSection(this.activeSection() + 1);
    }
  }

  formatHousing(h?: string): string {
    if (h === 'CASA_PROPIA') return 'Casa propia';
    if (h === 'CASA_RENTADA') return 'Casa rentada';
    if (h === 'DEPARTAMENTO') return 'Departamento';
    return h || 'No especificado';
  }

  private toDatetimeLocal(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private syncFormFromRequest(req: AdoptionRequest): void {
    this.stageForm = {
      socialMediaReviewed: !!req.socialMediaReviewed,
      interviewCompleted: !!req.interviewCompleted,
      interviewNotes: req.interviewNotes || '',
      homeVisitScheduledAt: this.toDatetimeLocal(req.homeVisitScheduledAt),
      homeVisitFamilyAccepted: !!req.homeVisitFamilyAccepted,
      homeVisitSafeConditions: !!req.homeVisitSafeConditions,
      homeVisitCompleted: !!req.homeVisitCompleted,
      homeVisitNotes: req.homeVisitNotes || '',
      ineVerifiedInPerson: !!req.ineVerifiedInPerson,
      addressProofVerifiedInPerson: !!req.addressProofVerifiedInPerson,
      handoverPhotoUrl: req.handoverPhotoUrl || '',
      publisherNotes: req.publisherNotes || '',
    };
  }

  loadDetail(id: string, preserveActiveSection = false): void {
    this.isLoading.set(!preserveActiveSection);
    this.adoptionService.getRequestDetail(id).subscribe({
      next: ({ request, verification }) => {
        this.request.set(request);
        this.verification.set(verification);
        this.syncFormFromRequest(request);
        if (!preserveActiveSection) {
          this.activeSection.set(this.resolveInitialSection(request));
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notify.error(err?.error?.message || 'No se pudo cargar la solicitud de adopción.');
        this.router.navigate(this.backRoute(), { queryParams: this.backQueryParams() });
      },
    });
  }

  private buildStagePayload(status: AdoptionRequestStatus) {
    return {
      status,
      publisherNotes: this.stageForm.publisherNotes || undefined,
      socialMediaReviewed: this.stageForm.socialMediaReviewed,
      interviewCompleted: this.stageForm.interviewCompleted,
      interviewNotes: this.stageForm.interviewNotes || undefined,
      homeVisitScheduledAt: this.stageForm.homeVisitScheduledAt
        ? new Date(this.stageForm.homeVisitScheduledAt).toISOString()
        : undefined,
      homeVisitFamilyAccepted: this.stageForm.homeVisitFamilyAccepted,
      homeVisitSafeConditions: this.stageForm.homeVisitSafeConditions,
      homeVisitCompleted: this.stageForm.homeVisitCompleted,
      homeVisitNotes: this.stageForm.homeVisitNotes || undefined,
      ineVerifiedInPerson: this.stageForm.ineVerifiedInPerson,
      addressProofVerifiedInPerson: this.stageForm.addressProofVerifiedInPerson,
      handoverPhotoUrl: this.stageForm.handoverPhotoUrl || undefined,
    };
  }

  saveStage(nextStatus: AdoptionRequestStatus, advanceToSection?: number, successMessage?: string): void {
    const req = this.request();
    if (!req) return;

    this.isSavingStage.set(true);
    this.adoptionService.advanceStage(req.id, this.buildStagePayload(nextStatus)).subscribe({
      next: (updated) => {
        this.request.set(updated);
        this.syncFormFromRequest(updated);
        this.isSavingStage.set(false);
        this.notify.success(successMessage || 'Avance guardado', getStageMeta(updated.status).label);
        if (advanceToSection !== undefined) {
          this.goToSection(advanceToSection);
        }
      },
      error: (err) => {
        this.isSavingStage.set(false);
        this.notify.error(err?.error?.message || 'No se pudo actualizar la etapa.');
      },
    });
  }

  approveInterviewAndContinue(): void {
    this.stageForm.interviewCompleted = true;
    this.saveStage(
      'VISITA_DOMICILIARIA',
      2,
      'Entrevista aprobada. Ahora coordina la Visita Domiciliaria.',
    );
  }

  approveVisitAndReleaseAgreement(): void {
    if (!this.stageForm.homeVisitFamilyAccepted) {
      this.visitValidationError.set(
        'Requisito obligatorio: marca la casilla de aceptación familiar antes de habilitar el Convenio de Adopción.',
      );
      return;
    }
    this.visitValidationError.set('');
    this.stageForm.homeVisitCompleted = true;
    this.saveStage(
      'ESPERANDO_CONVENIO',
      3,
      'Visita aprobada. Ya se notificó al adoptante para firmar el Convenio.',
    );
  }

  formalizeMissingRequirements(req: AdoptionRequest): string[] {
    const missing: string[] = [];
    if (!req.agreementAccepted || !req.agreementSignedAt) {
      missing.push('El adoptante debe firmar digitalmente el Convenio de Adopción desde Mis Adopciones.');
    }
    if (!this.stageForm.ineVerifiedInPerson) {
      missing.push('Marca la casilla "Cotejo físico presencial de INE" tras revisar su identificación en la entrega.');
    }
    return missing;
  }

  async formalizeAdoption(): Promise<void> {
    const req = this.request();
    if (!req) return;

    const missing = this.formalizeMissingRequirements(req);
    if (missing.length > 0) {
      this.formalizeValidationError.set(missing[0]);
      return;
    }
    this.formalizeValidationError.set('');

    const confirmed = await this.confirm.confirm({
      title: `Formalizar adopción de ${req.pet?.name}`,
      message: `¿Confirmas la entrega de ${req.pet?.name} a ${req.adopter?.fullName}?`,
      submessage:
        'Al confirmar se generará el calendario oficial de seguimiento (2 semanas, 1 mes, 6 meses y 1 año).',
      confirmText: 'Confirmar formalización',
      cancelText: 'Volver',
      type: 'success',
      icon: '✓',
    });
    if (!confirmed) return;

    this.saveStage(
      'APROBADA',
      3,
      `Adopción de ${req.pet?.name} formalizada correctamente.`,
    );
  }

  rejectApplication(): void {
    const req = this.request();
    if (!req) return;

    const reason = this.rejectionReason().trim();
    if (reason.length < 10) {
      this.rejectionError.set(
        reason.length === 0
          ? 'Escribe el motivo para informar al candidato (mínimo 10 caracteres).'
          : `Agrega ${10 - reason.length} caracteres más para enviar un motivo claro.`,
      );
      return;
    }

    this.isSavingStage.set(true);
    this.adoptionService
      .advanceStage(req.id, {
        ...this.buildStagePayload('RECHAZADA'),
        rejectionReason: reason,
      })
      .subscribe({
        next: (updated) => {
          this.request.set(updated);
          this.showRejectBox.set(false);
          this.isSavingStage.set(false);
          this.notify.info('Solicitud cerrada', 'Se notificó el dictamen al postulante.');
        },
        error: (err) => {
          this.isSavingStage.set(false);
          this.notify.error(err?.error?.message || 'No se pudo registrar el rechazo.');
        },
      });
  }

  onUploadHandover(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;

    this.isUploadingHandover.set(true);
    this.imageUpload.uploadImage(file, 'adoption-handovers').subscribe({
      next: (url) => {
        this.stageForm.handoverPhotoUrl = url;
        this.isUploadingHandover.set(false);
        this.notify.success('Fotografía de entrega cargada');
      },
      error: () => {
        this.isUploadingHandover.set(false);
        this.notify.error('No se pudo subir la fotografía');
      },
    });
  }

  openDirectChat(req: AdoptionRequest): void {
    const recipientId = req.adopterId || req.adopter?.id;
    if (!recipientId) return;
    this.dmService.openChatWithContext({
      recipientId,
      recipientName: req.adopter?.fullName,
      contextType: 'ADOPTION_REQUEST',
      contextId: req.id,
      contextTitle: `Adopción de ${req.pet?.name || 'Mascota'}`,
      contextSubtitle: `Etapa: ${getStageMeta(req.status).label}`,
      contextImageUrl: req.pet?.photoUrl || req.pet?.photos?.[0],
      contextTargetUrl: `/panel-rescatista/solicitud/${req.id}`,
      contextWhatsappPhone: req.adopter?.phone || undefined,
      prefilledDraft: `Hola ${req.adopter?.fullName || ''}, revisé tu solicitud para adoptar a ${req.pet?.name || 'nuestra mascota'}. ¿En qué horario podemos platicar?`,
    });
  }

  getWhatsAppUrl(req: AdoptionRequest): string {
    const cleanPhone = (req.adopter?.phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hola ${req.adopter?.fullName || ''}, te contacto de ${this.brand.name} sobre tu solicitud para adoptar a ${req.pet?.name || ''}.`,
    );
    return `https://wa.me/52${cleanPhone}?text=${text}`;
  }
}
