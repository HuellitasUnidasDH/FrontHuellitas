import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdoptionService } from '../../../core/services/adoption.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { ImageUploadService } from '../../../core/services/image-upload.service';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';
import {
  AdoptionRequestDetailResponse,
  AdvanceAdoptionStagePayload,
} from '../../../core/models/adoption.model';
import { AdoptionAgreementDocumentComponent } from '../shared/adoption-agreement-document.component';
import {
  getCandidateVerificationBadge,
  getRequestStepIndex,
  getStageMeta,
} from '../shared/adoption-helpers.util';

@Component({
  selector: 'app-adoption-evaluation-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AdoptionAgreementDocumentComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <!-- Top Breadcrumb / Back -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <a
          routerLink="/panel-rescatista"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl liquid-glass text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-all"
        >
          <span>←</span> Volver al Panel del Rescatista
        </a>

        @if (detail()?.request; as req) {
          <span
            class="px-3.5 py-1.5 rounded-full text-xs font-black border"
            [ngClass]="stageMeta(req.status).colorClass"
          >
            {{ stageMeta(req.status).label }} ({{ stageMeta(req.status).progress }}%)
          </span>
        }
      </div>

      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-12 text-center space-y-3">
          <div class="text-4xl animate-bounce">🐾</div>
          <p class="text-sm font-bold text-slate-500">Cargando expediente completo de evaluación...</p>
        </div>
      } @else if (!detail()) {
        <div class="liquid-glass rounded-3xl p-10 text-center space-y-3">
          <div class="text-4xl">😕</div>
          <h2 class="text-lg font-black text-slate-900 dark:text-white">Expediente no disponible</h2>
          <p class="text-xs text-slate-500">La solicitud no existe o la publicación de la mascota fue eliminada.</p>
          <a routerLink="/panel-rescatista" class="inline-block px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">
            Volver al Panel
          </a>
        </div>
      } @else {
        @let req = detail()!.request;
        @let ver = detail()!.verification;
        @let badge = candidateBadge();

        <!-- HERO CARD: Mascota + Paso Actual -->
        <section class="liquid-glass rounded-3xl p-5 sm:p-7 border border-emerald-500/20 shadow-xl space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div class="flex items-center gap-4">
              <img
                [src]="req.pet?.photoUrl || req.pet?.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80'"
                [alt]="req.pet?.name"
                class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md border-2 border-white dark:border-slate-800 flex-shrink-0"
              />
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Evaluación de Candidato • Protocolo Oficial
                </span>
                <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  Mascota: {{ req.pet?.name }}
                </h1>
                <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {{ req.pet?.species }} • {{ req.pet?.breed || 'Mestizo' }} • {{ req.pet?.approximateAge || 'Edad N/D' }} •
                  <strong [ngClass]="req.pet?.isSterilized ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
                    {{ req.pet?.isSterilized ? 'Esterilizada' : 'Sin esterilizar (Compromiso 5-6m)' }}
                  </strong>
                </p>
                <a
                  [routerLink]="['/adopciones', req.petId]"
                  class="inline-block mt-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Ver ficha pública de {{ req.pet?.name }} →
                </a>
              </div>
            </div>

            <div class="text-left md:text-right text-xs space-y-1">
              <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Solicitud recibida el</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">{{ req.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              @if (req.evaluatedByRescuer) {
                <span class="block text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Rescatista asignado: {{ req.evaluatedByRescuer.fullName }}
                </span>
              }
            </div>
          </div>

          <!-- Stepper Visual 4 Pasos -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-200/70 dark:border-slate-800">
            @for (step of protocolSteps; track step.num) {
              <div
                class="p-3 rounded-2xl border text-xs transition-all"
                [ngClass]="
                  currentStepIndex() >= step.num
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500'
                "
              >
                <div class="flex items-center justify-between font-black">
                  <span>{{ step.icon }} Paso {{ step.num }}</span>
                  @if (currentStepIndex() > step.num || req.status === 'APROBADA') {
                    <span class="text-emerald-600 dark:text-emerald-400">✓</span>
                  }
                </div>
                <span class="block font-bold mt-0.5 text-[11px]">{{ step.title }}</span>
              </div>
            }
          </div>
        </section>

        <!-- TARJETA GIGANTE DEL CANDIDATO (Solicitud visual clave del usuario) -->
        <section class="liquid-glass rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-700/80 shadow-xl space-y-5">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div class="flex items-center gap-4 sm:gap-5">
              @if (req.adopter?.profilePhotoUrl) {
                <img
                  [src]="req.adopter!.profilePhotoUrl!"
                  [alt]="req.adopter?.fullName"
                  class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover shadow-lg border-2 border-emerald-500/40 flex-shrink-0"
                />
              } @else {
                <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-lg flex-shrink-0">
                  {{ (req.adopter?.fullName || 'A').charAt(0).toUpperCase() }}
                </div>
              }

              <div class="space-y-1.5">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Candidato a Adoptante
                </span>
                <h2 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {{ req.adopter?.fullName }}
                </h2>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>📞 {{ req.adopter?.phone || 'Sin teléfono' }}</span>
                  <span>✉️ {{ req.adopter?.email }}</span>
                  <span>📍 {{ req.adopter?.colonia?.name || 'Dolores Hidalgo' }}</span>
                </div>
              </div>
            </div>

            <!-- Badge GIGANTE de Nivel de Verificación -->
            <div class="rounded-2xl p-4 sm:px-6 sm:py-4 flex items-center gap-3.5 max-w-md" [ngClass]="badge.badgeClass">
              <div class="text-3xl sm:text-4xl flex-shrink-0">{{ badge.icon }}</div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider opacity-80 block">
                  Nivel de Confianza del Candidato
                </span>
                <strong class="text-base sm:text-lg font-black block leading-tight">{{ badge.title }}</strong>
                <span class="text-[11px] opacity-90 block mt-0.5">{{ badge.subtitle }}</span>
              </div>
            </div>
          </div>

          <!-- Barra de Redes Sociales y Contacto Rápido -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-slate-200/70 dark:border-slate-800">
            <div class="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <span class="text-[10px] font-black uppercase text-slate-400 block">Redes Sociales para Revisión (Paso 1)</span>
                <span class="text-xs font-bold text-slate-900 dark:text-white break-all block mt-0.5">
                  {{ socialMediaDisplay() || 'No proporcionadas en el formulario' }}
                </span>
              </div>
              @if (socialMediaUrl(); as url) {
                <a
                  [href]="url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3.5 py-2 rounded-xl bg-sky-500 text-white font-black text-xs flex-shrink-0 hover:brightness-110 transition-all"
                >
                  Abrir Perfil ↗
                </a>
              }
            </div>

            <div class="flex flex-wrap items-center gap-2 justify-start md:justify-end">
              <button
                type="button"
                (click)="contactInApp(req)"
                class="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span>💬</span> Chat Directo Huellitas
              </button>
              <a
                [href]="getWhatsAppUrl(req)"
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center gap-1.5"
              >
                <span>📲</span> Contactar por WhatsApp
              </a>
            </div>
          </div>
        </section>

        <!-- GRID PRINCIPAL: Respuestas Estructuradas (Izq) + Acciones de Protocolo (Der) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- COLUMNA IZQUIERDA: Cuestionario + Verificación Cruzada -->
          <div class="lg:col-span-6 space-y-6">
            <section class="liquid-glass rounded-3xl p-5 sm:p-6 space-y-4 border border-slate-200/70 dark:border-slate-700/70">
              <h3 class="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>📝</span> Información Recabada del Candidato
              </h3>

              @if (req.questionnaireData) {
                @let q = req.questionnaireData;
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[10px] font-black uppercase text-slate-400 block">Tipo de Vivienda</span>
                    <span class="font-bold text-slate-900 dark:text-white mt-0.5 block">
                      {{ q.housingType || 'No especificado' }}
                      @if (q.landlordAllowsPets !== undefined) {
                        <span class="text-[11px] font-normal text-slate-500 block">
                          Casero/Reglamento permite mascotas: {{ q.landlordAllowsPets ? 'Sí' : 'No especificado / No' }}
                        </span>
                      }
                    </span>
                  </div>

                  <div class="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[10px] font-black uppercase text-slate-400 block">Acuerdo Familiar</span>
                    <span class="font-bold text-slate-900 dark:text-white mt-0.5 block">{{ q.familyAgreed || 'No especificado' }}</span>
                  </div>

                  <div class="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[10px] font-black uppercase text-slate-400 block">Personas en Casa</span>
                    <span class="font-bold text-slate-900 dark:text-white mt-0.5 block">{{ q.peopleInHome || 'No especificado' }}</span>
                  </div>

                  <div class="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[10px] font-black uppercase text-slate-400 block">Otras Mascotas Actuales</span>
                    <span class="font-bold text-slate-900 dark:text-white mt-0.5 block">{{ q.currentPets || 'Ninguna / N/D' }}</span>
                  </div>

                  <div class="sm:col-span-2 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[10px] font-black uppercase text-slate-400 block">Experiencia Previa</span>
                    <span class="font-bold text-slate-900 dark:text-white mt-0.5 block">{{ q.previousExperience || 'No especificada' }}</span>
                  </div>

                  <div class="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[10px] font-black uppercase text-slate-400 block">Plan ante Mudanza / Viaje</span>
                    <span class="font-bold text-slate-900 dark:text-white mt-0.5 block">{{ q.relocationPlan || 'No especificado' }}</span>
                  </div>

                  <div class="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[10px] font-black uppercase text-slate-400 block">Responsable Veterinario</span>
                    <span class="font-bold text-slate-900 dark:text-white mt-0.5 block">{{ q.financialResponsible || 'No especificado' }}</span>
                  </div>

                  <div class="sm:col-span-2 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[10px] font-black uppercase text-slate-400 block">Motivación y Tiempo Disponible</span>
                    <span class="font-bold text-slate-900 dark:text-white mt-0.5 block whitespace-pre-line">
                      {{ q.motivation || req.adopterMessage || 'Sin comentario adicional' }}
                    </span>
                  </div>

                  @if (req.adopterAddress || q.address) {
                    <div class="sm:col-span-2 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                      <span class="text-[10px] font-black uppercase text-slate-400 block">Domicilio Declarado</span>
                      <span class="font-bold text-slate-900 dark:text-white mt-0.5 block">{{ req.adopterAddress || q.address }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs whitespace-pre-line text-slate-800 dark:text-slate-200 leading-relaxed">
                  {{ req.adopterMessage || 'Sin mensaje descriptivo registrado.' }}
                </div>
              }
            </section>

            <!-- Expediente Cruzado AdopterVerification -->
            <section class="liquid-glass rounded-3xl p-5 sm:p-6 space-y-4 border border-slate-200/70 dark:border-slate-700/70">
              <h3 class="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🛡️</span> Historial de Verificación del Candidato (Niveles 2 y 3)
              </h3>

              @if (!ver) {
                <p class="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl">
                  Este candidato aún no ha completado su expediente global de Verificación Nivel 2 / Nivel 3.
                </p>
              } @else {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="p-3 rounded-2xl border" [ngClass]="ver.isLevel2Completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'">
                    <span class="font-black block">Nivel 2 (Cuestionario Hogar)</span>
                    <span class="text-[11px] font-bold">{{ ver.isLevel2Completed ? '✓ Aprobado' : ver.level2Status || 'Pendiente' }}</span>
                  </div>
                  <div class="p-3 rounded-2xl border" [ngClass]="ver.isLevel3Completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-500/10 border-slate-500/20'">
                    <span class="font-black block">Nivel 3 (Carta Compromiso)</span>
                    <span class="text-[11px] font-bold">{{ ver.isLevel3Completed ? '✓ Aprobado' : ver.level3Status || 'No solicitado' }}</span>
                  </div>
                  <div class="sm:col-span-2 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span class="font-bold block">Vivienda: {{ ver.housingType }} • Permiso casero: {{ ver.landlordAllowsPets ? 'Sí' : 'No' }}</span>
                    <span class="block text-slate-600 dark:text-slate-300">Responsable económico: {{ ver.financialResponsible || 'N/D' }}</span>
                    <span class="block text-slate-600 dark:text-slate-300">Plan ante mudanza: {{ ver.relocationPlan || 'N/D' }}</span>
                  </div>
                </div>

                @if (ver.homeYardPhotos?.length) {
                  <div>
                    <span class="text-[10px] font-black uppercase text-slate-400 block mb-2">Fotos del Hogar/Patio Subidas por el Candidato</span>
                    <div class="flex flex-wrap gap-2">
                      @for (photo of ver.homeYardPhotos; track photo) {
                        <a [href]="photo" target="_blank">
                          <img [src]="photo" alt="Espacio del hogar" class="w-20 h-20 rounded-xl object-cover border border-slate-300 dark:border-slate-700 hover:scale-105 transition-transform" />
                        </a>
                      }
                    </div>
                  </div>
                }
              }
            </section>
          </div>

          <!-- COLUMNA DERECHA: Flujo Interactivo 4 Pasos (Control Rescatista) -->
          <div class="lg:col-span-6 space-y-5">
            <!-- PASO 1: Entrevista y Redes -->
            <section class="liquid-glass rounded-3xl p-5 space-y-3 border border-amber-500/25">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-black text-slate-900 dark:text-white">
                  1️⃣ Paso 1: Entrevista y Revisión de Redes Sociales
                </h3>
                @if (req.interviewCompleted) {
                  <span class="text-[11px] font-black text-emerald-600 dark:text-emerald-400">✓ Completado</span>
                }
              </div>

              <div class="space-y-2 text-xs">
                <label class="flex items-center gap-2 cursor-pointer font-semibold">
                  <input type="checkbox" [(ngModel)]="stageForm.socialMediaReviewed" class="rounded text-emerald-600" />
                  <span>Redes sociales revisadas y perfil confiable</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer font-semibold">
                  <input type="checkbox" [(ngModel)]="stageForm.interviewCompleted" class="rounded text-emerald-600" />
                  <span>Entrevista inicial realizada con el postulante</span>
                </label>
                <textarea
                  rows="2"
                  [(ngModel)]="stageForm.interviewNotes"
                  placeholder="Anotaciones de la entrevista (horarios, actitud, respuestas)..."
                  class="w-full p-3 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <button
                type="button"
                (click)="saveStage('EN_ENTREVISTA')"
                [disabled]="isSavingStage() || req.status === 'APROBADA' || req.status === 'RECHAZADA'"
                class="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-black text-xs cursor-pointer disabled:opacity-40 transition-all"
              >
                Guardar Evaluación de Entrevista (Paso 1)
              </button>
            </section>

            <!-- PASO 2: Visita Domiciliaria -->
            <section class="liquid-glass rounded-3xl p-5 space-y-3 border border-sky-500/25">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-black text-slate-900 dark:text-white">
                  2️⃣ Paso 2: Visita Domiciliaria y Acuerdo Familiar
                </h3>
                @if (req.homeVisitCompleted) {
                  <span class="text-[11px] font-black text-emerald-600 dark:text-emerald-400">✓ Completado</span>
                }
              </div>

              <div class="space-y-2.5 text-xs">
                <div>
                  <label class="text-[11px] font-bold block mb-1">Fecha / Hora programada para visita:</label>
                  <input
                    type="datetime-local"
                    [(ngModel)]="stageForm.homeVisitScheduledAt"
                    class="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <label class="flex items-center gap-2 cursor-pointer font-semibold">
                  <input type="checkbox" [(ngModel)]="stageForm.homeVisitFamilyAccepted" class="rounded text-sky-600" />
                  <span>Toda la familia en el domicilio está de acuerdo con la adopción</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer font-semibold">
                  <input type="checkbox" [(ngModel)]="stageForm.homeVisitSafeConditions" class="rounded text-sky-600" />
                  <span>Espacio seguro comprobado (bardas, sombra, agua, sin riesgos de fuga)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer font-semibold">
                  <input type="checkbox" [(ngModel)]="stageForm.homeVisitCompleted" class="rounded text-sky-600" />
                  <span>Visita domiciliaria presencial concluida satisfactoriamente</span>
                </label>
                <textarea
                  rows="2"
                  [(ngModel)]="stageForm.homeVisitNotes"
                  placeholder="Observaciones del domicilio, patio, entorno..."
                  class="w-full p-3 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  (click)="saveStage('VISITA_DOMICILIARIA')"
                  [disabled]="isSavingStage() || req.status === 'APROBADA' || req.status === 'RECHAZADA'"
                  class="py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-800 dark:text-sky-300 border border-sky-500/40 font-black text-xs cursor-pointer disabled:opacity-40 transition-all"
                >
                  Programar / Guardar Visita
                </button>
                <button
                  type="button"
                  (click)="saveStage('ESPERANDO_CONVENIO')"
                  [disabled]="isSavingStage() || req.status === 'APROBADA' || req.status === 'RECHAZADA'"
                  class="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md cursor-pointer disabled:opacity-40 transition-all"
                >
                  ✓ Visita Aprobada → Liberar Convenio
                </button>
              </div>
            </section>

            <!-- PASO 3 y 4: Convenio, Cotejo INE Físico, Foto de Entrega y Formalización -->
            <section class="liquid-glass rounded-3xl p-5 space-y-4 border border-emerald-500/35">
              <h3 class="text-sm font-black text-slate-900 dark:text-white">
                3️⃣ & 4️⃣ Convenio, Cotejo Presencial de INE y Entrega Oficial
              </h3>

              <div class="p-3 rounded-2xl text-xs" [ngClass]="req.agreementSignedAt ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200' : 'bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200'">
                @if (req.agreementSignedAt) {
                  <strong>✓ Convenio firmado digitalmente por {{ req.adopterAgreementFullName || req.adopter?.fullName }}</strong>
                  <span class="block text-[11px] mt-0.5">El adoptante ya firmó el Convenio Oficial en su portal "Mis Adopciones". Revisa abajo y valida el cotejo presencial en entrega.</span>
                } @else {
                  <strong>⏳ Firma del Convenio pendiente por parte del adoptante</strong>
                  <span class="block text-[11px] mt-0.5">Una vez liberes el Convenio en el Paso 2, el adoptante recibirá notificación para firmarlo digitalmente desde "Mis Adopciones".</span>
                }
              </div>

              <div class="space-y-2.5 text-xs">
                <label class="flex items-start gap-2.5 p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 cursor-pointer font-bold">
                  <input type="checkbox" [(ngModel)]="stageForm.ineVerifiedInPerson" class="mt-0.5 rounded text-emerald-600" />
                  <span>
                    🪪 Confirmo que cotejé FÍSICAMENTE la identificación oficial (INE) del adoptante el día de la entrega
                    <span class="block text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      Obligatorio para formalizar adopción. No se sube fotografía de INE para proteger datos personales (LFPDPPP).
                    </span>
                  </span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer font-semibold">
                  <input type="checkbox" [(ngModel)]="stageForm.addressProofVerifiedInPerson" class="rounded text-emerald-600" />
                  <span>Comprobante de domicilio verificado (opcional / presencial)</span>
                </label>

                <!-- Foto de entrega -->
                <div class="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-bold">📸 Foto Oficial de Entrega (con su nuevo hogar)</span>
                    <label class="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold cursor-pointer hover:bg-slate-100">
                      @if (isUploadingHandover()) {
                        ⏳ Subiendo...
                      } @else {
                        📷 Subir / Tomar Foto
                      }
                      <input type="file" accept="image/*" capture="environment" class="hidden" (change)="onUploadHandover($event)" [disabled]="isUploadingHandover()" />
                    </label>
                  </div>
                  @if (stageForm.handoverPhotoUrl) {
                    <img [src]="stageForm.handoverPhotoUrl" alt="Foto de entrega" class="w-full max-h-48 rounded-xl object-cover border border-emerald-500/30" />
                  }
                </div>

                <div>
                  <label class="text-[11px] font-bold block mb-1">Notas generales visibles para el adoptante:</label>
                  <textarea
                    rows="2"
                    [(ngModel)]="stageForm.publisherNotes"
                    placeholder="Indicaciones de entrega, fecha, horario o seguimiento..."
                    class="w-full p-3 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  ></textarea>
                </div>
              </div>

              @if (req.status !== 'APROBADA' && req.status !== 'RECHAZADA' && req.status !== 'CANCELADA') {
                <div class="space-y-2 pt-2">
                  <button
                    type="button"
                    (click)="formalizeAdoption()"
                    [disabled]="isSavingStage() || !req.agreementSignedAt || !stageForm.ineVerifiedInPerson"
                    class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    🏡 Formalizar Adopción + Activar Seguimientos (14d / 1m / 6m / 1a)
                  </button>

                  @if (!req.agreementSignedAt || !stageForm.ineVerifiedInPerson) {
                    <p class="text-[11px] text-center text-amber-600 dark:text-amber-400 font-bold">
                      Requisito para formalizar: Convenio firmado digitalmente por el adoptante + casilla de cotejo físico de INE marcada.
                    </p>
                  }

                  <button
                    type="button"
                    (click)="rejectApplication()"
                    [disabled]="isSavingStage()"
                    class="w-full py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer transition-all"
                  >
                    ✕ No Aprobar / Cerrar Solicitud
                  </button>
                </div>
              }
            </section>
          </div>
        </div>

        <!-- VISTA DEL CONVENIO DIGITAL -->
        <section class="pt-2">
          <app-adoption-agreement-document [request]="req" mode="view" />
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
  private notify = inject(NotificationService);
  private confirmService = inject(ConfirmService);
  private dmService = inject(DirectMessageService);
  private imageUpload = inject(ImageUploadService);

  detail = signal<AdoptionRequestDetailResponse | null>(null);
  isLoading = signal(true);
  isSavingStage = signal(false);
  isUploadingHandover = signal(false);

  protocolSteps = [
    { num: 1, icon: '🗣️', title: 'Entrevista y Redes' },
    { num: 2, icon: '🏠', title: 'Visita Domiciliaria' },
    { num: 3, icon: '📜', title: 'Convenio e INE Físico' },
    { num: 4, icon: '📅', title: 'Adopción y Seguimiento' },
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

  candidateBadge = computed(() =>
    getCandidateVerificationBadge(this.detail()?.request?.adopter),
  );

  currentStepIndex = computed(() => {
    const req = this.detail()?.request;
    return req ? getRequestStepIndex(req) : 0;
  });

  socialMediaDisplay = computed(() => {
    const req = this.detail()?.request;
    return req?.adopterSocialMedia || req?.questionnaireData?.socialMedia || '';
  });

  socialMediaUrl = computed(() => {
    const raw = this.socialMediaDisplay().trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.includes('facebook.com') || raw.includes('instagram.com') || raw.includes('tiktok.com')) {
      return `https://${raw}`;
    }
    return null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.isLoading.set(false);
      return;
    }
    this.loadDetail(id);
  }

  stageMeta(status: AdoptionRequestDetailResponse['request']['status']) {
    return getStageMeta(status);
  }

  loadDetail(id: string): void {
    this.isLoading.set(true);
    this.adoptionService.getRequestDetail(id).subscribe({
      next: (res) => {
        this.detail.set(res);
        const r = res.request;
        this.stageForm = {
          socialMediaReviewed: !!r.socialMediaReviewed,
          interviewCompleted: !!r.interviewCompleted,
          interviewNotes: r.interviewNotes || '',
          homeVisitScheduledAt: r.homeVisitScheduledAt ? r.homeVisitScheduledAt.slice(0, 16) : '',
          homeVisitFamilyAccepted: !!r.homeVisitFamilyAccepted,
          homeVisitSafeConditions: !!r.homeVisitSafeConditions,
          homeVisitCompleted: !!r.homeVisitCompleted,
          homeVisitNotes: r.homeVisitNotes || '',
          ineVerifiedInPerson: !!r.ineVerifiedInPerson,
          addressProofVerifiedInPerson: !!r.addressProofVerifiedInPerson,
          handoverPhotoUrl: r.handoverPhotoUrl || '',
          publisherNotes: r.publisherNotes || '',
        };
        this.isLoading.set(false);
      },
      error: () => {
        this.detail.set(null);
        this.isLoading.set(false);
      },
    });
  }

  saveStage(targetStatus: AdvanceAdoptionStagePayload['status']): void {
    const req = this.detail()?.request;
    if (!req) return;

    this.isSavingStage.set(true);
    const payload: AdvanceAdoptionStagePayload = {
      status: targetStatus,
      socialMediaReviewed: this.stageForm.socialMediaReviewed,
      interviewCompleted: this.stageForm.interviewCompleted,
      interviewNotes: this.stageForm.interviewNotes || undefined,
      homeVisitFamilyAccepted: this.stageForm.homeVisitFamilyAccepted,
      homeVisitSafeConditions: this.stageForm.homeVisitSafeConditions,
      homeVisitCompleted: this.stageForm.homeVisitCompleted,
      homeVisitNotes: this.stageForm.homeVisitNotes || undefined,
      ineVerifiedInPerson: this.stageForm.ineVerifiedInPerson,
      addressProofVerifiedInPerson: this.stageForm.addressProofVerifiedInPerson,
      handoverPhotoUrl: this.stageForm.handoverPhotoUrl || undefined,
      publisherNotes: this.stageForm.publisherNotes || undefined,
      ...(this.stageForm.homeVisitScheduledAt
        ? { homeVisitScheduledAt: new Date(this.stageForm.homeVisitScheduledAt).toISOString() }
        : {}),
    };

    this.adoptionService.advanceStage(req.id, payload).subscribe({
      next: () => {
        this.isSavingStage.set(false);
        this.notify.success('Etapa actualizada', `La solicitud avanzó a ${this.stageMeta(targetStatus).label}.`);
        this.loadDetail(req.id);
      },
      error: (err) => {
        this.isSavingStage.set(false);
        this.notify.error(err.error?.message || 'No se pudo actualizar la etapa');
      },
    });
  }

  formalizeAdoption(): void {
    this.saveStage('APROBADA');
  }

  async rejectApplication(): Promise<void> {
    const req = this.detail()?.request;
    if (!req) return;

    const reason = await this.confirmService.prompt({
      title: 'Cerrar o Rechazar Solicitud',
      message: `Indica brevemente a ${req.adopter?.fullName} el motivo de la resolución:`,
      inputPlaceholder: 'Ej: Se seleccionó un hogar con patio cerrado más adecuado para su energía...',
      confirmText: 'Confirmar Resolución',
      cancelText: 'Cancelar',
      type: 'warning',
      icon: '📋',
    });

    if (!reason) return;
    this.isSavingStage.set(true);
    this.adoptionService
      .updateRequestStatus(req.id, 'RECHAZADA', this.stageForm.publisherNotes || undefined, reason)
      .subscribe({
        next: () => {
          this.isSavingStage.set(false);
          this.notify.success('Solicitud cerrada');
          this.router.navigate(['/panel-rescatista']);
        },
        error: (err) => {
          this.isSavingStage.set(false);
          this.notify.error(err.error?.message || 'No se pudo rechazar');
        },
      });
  }

  onUploadHandover(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingHandover.set(true);
    this.imageUpload.uploadImage(file, 'handovers').subscribe({
      next: (url) => {
        this.stageForm.handoverPhotoUrl = url;
        this.isUploadingHandover.set(false);
        this.notify.success('Foto de entrega cargada');
      },
      error: () => {
        this.isUploadingHandover.set(false);
        this.notify.error('No se pudo subir la foto');
      },
    });
  }

  contactInApp(req: AdoptionRequestDetailResponse['request']): void {
    if (!req.adopter?.id) return;
    this.dmService.openChatWithContext({
      recipientId: req.adopter.id,
      recipientName: req.adopter.fullName,
      contextType: 'ADOPTION_REQUEST',
      contextId: req.pet?.id || req.id,
      contextTitle: `Solicitud de ${req.adopter.fullName} para ${req.pet?.name || 'Mascota'}`,
      contextSubtitle: this.stageMeta(req.status).label,
      contextImageUrl: req.pet?.photoUrl || req.pet?.photos?.[0],
      contextTargetUrl: `/mis-adopciones`,
      contextWhatsappPhone: req.adopter.phone || undefined,
      prefilledDraft: `¡Hola ${req.adopter.fullName.split(' ')[0]}! Te escribo sobre el proceso de adopción de ${req.pet?.name}.`,
    });
  }

  getWhatsAppUrl(req: AdoptionRequestDetailResponse['request']): string {
    const phone = req.adopter?.phone || '';
    const text = encodeURIComponent(
      `¡Hola ${req.adopter?.fullName}! Te escribo de ${this.brand.name} respecto a tu proceso de adopción para ${req.pet?.name}.`,
    );
    return `https://wa.me/52${phone.replace(/\D/g, '')}?text=${text}`;
  }
}

