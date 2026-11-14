import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdoptionService } from '../../../core/services/adoption.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ImageUploadService } from '../../../core/services/image-upload.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ScrollLockService } from '../../../core/services/scroll-lock.service';
import {
  AdoptionFollowup,
  AdoptionRequest,
  FollowupStatus,
  PublishedPetProgress,
  SignAdoptionAgreementPayload,
} from '../../../core/models/adoption.model';
import { AdoptionAgreementDocumentComponent } from '../shared/adoption-agreement-document.component';
import {
  getMilestoneLabel,
  getRequestStepIndex,
  getStageMeta,
  groupFollowupsByPet,
} from '../shared/adoption-helpers.util';

@Component({
  selector: 'app-my-adoptions',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AdoptionAgreementDocumentComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <!-- Header -->
      <section class="liquid-glass rounded-3xl p-5 sm:p-7 border border-emerald-500/20 shadow-xl space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25 flex-shrink-0">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Mis Adopciones y Progreso
              </h1>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                Consulta el avance paso a paso de tus postulaciones, firma tu Convenio Digital y envía tus seguimientos en un solo lugar.
              </p>
            </div>
          </div>

          <a
            routerLink="/verificacion"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-100 hover:brightness-105 transition-all self-start sm:self-center"
          >
            <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            Mi Verificación de Adoptante
          </a>
        </div>

        <!-- Tabs -->
        <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-200/70 dark:border-slate-800 text-xs">
          <button
            type="button"
            (click)="activeTab.set('APPLICATIONS')"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-all"
            [ngClass]="activeTab() === 'APPLICATIONS' ? 'bg-emerald-500 text-slate-950 font-black shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Mis Postulaciones ({{ applications().length }})
          </button>

          <button
            type="button"
            (click)="activeTab.set('FOLLOWUPS')"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-all"
            [ngClass]="activeTab() === 'FOLLOWUPS' ? 'bg-emerald-500 text-slate-950 font-black shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Seguimientos de mis Mascotas ({{ followupGroups().length }})
          </button>

          <button
            type="button"
            (click)="activeTab.set('PUBLISHED')"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-all"
            [ngClass]="activeTab() === 'PUBLISHED' ? 'bg-emerald-500 text-slate-950 font-black shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Progreso como Dueño ({{ publishedProgress().length }})
          </button>
        </div>
      </section>

      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-12 text-center space-y-3">
          <div class="w-10 h-10 mx-auto rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-slate-500">Cargando tu historial y progreso de adopción...</p>
        </div>
      } @else {
        <!-- ========================================================== -->
        <!-- TAB 1: MIS POSTULACIONES CON BARRA DE PROGRESO + CONVENIO -->
        <!-- ========================================================== -->
        @if (activeTab() === 'APPLICATIONS') {
          <section class="space-y-4">
            @if (applications().length === 0) {
              <div class="liquid-glass rounded-3xl p-10 text-center space-y-3 border border-dashed border-slate-300 dark:border-slate-700">
                <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <h3 class="font-black text-slate-900 dark:text-white text-base">Aún no has enviado solicitudes de adopción</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto">
                  Explora las mascotas disponibles en el catálogo de adopciones y envía tu solicitud para iniciar el protocolo oficial de 4 pasos.
                </p>
                <a routerLink="/adopciones" class="inline-block px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:brightness-105 transition-all">
                  Ver Mascotas en Adopción
                </a>
              </div>
            } @else {
              @for (req of applications(); track req.id) {
                @let stage = stageMeta(req.status);
                @let stepIdx = stepIndex(req);
                <article class="liquid-glass rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-lg space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                      <img
                        [src]="req.pet?.photoUrl || req.pet?.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80'"
                        [alt]="req.pet?.name"
                        class="w-16 h-16 rounded-2xl object-cover shadow-md border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                      <div>
                        <div class="flex flex-wrap items-center gap-2">
                          <h2 class="text-lg font-black text-slate-900 dark:text-white">{{ req.pet?.name }}</h2>
                          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border" [ngClass]="stage.colorClass">
                            {{ stage.label }}
                          </span>
                        </div>
                        <span class="text-xs text-slate-500 block mt-0.5">
                          {{ req.pet?.species }} • {{ req.pet?.breed || 'Mestizo' }} • Enviada el {{ req.createdAt | date:'dd/MM/yyyy' }}
                        </span>
                        @if (req.evaluatedByRescuer) {
                          <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                            Rescatista evaluador: {{ req.evaluatedByRescuer.fullName }}
                          </span>
                        }
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                      @if (req.status === 'ESPERANDO_CONVENIO') {
                        <button
                          type="button"
                          (click)="openAgreementModal(req, 'sign')"
                          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-indigo-500/30 cursor-pointer animate-pulse"
                        >
                          Revisar y Firmar Convenio
                        </button>
                      } @else if (req.agreementSignedAt) {
                        <button
                          type="button"
                          (click)="openAgreementModal(req, 'view')"
                          class="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 font-black text-xs cursor-pointer"
                        >
                          Ver / Descargar Convenio PDF
                        </button>
                      }
                      <a
                        [routerLink]="['/adopciones', req.petId]"
                        class="px-3.5 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:brightness-105 transition-all"
                      >
                        Ver Ficha
                      </a>
                      @if (canWithdraw(req)) {
                        <button
                          type="button"
                          (click)="withdrawApplication(req)"
                          [disabled]="withdrawingRequestId() === req.id"
                          class="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs cursor-pointer disabled:opacity-50 transition-all"
                        >
                          {{ withdrawingRequestId() === req.id ? 'Retirando...' : 'Retirar solicitud' }}
                        </button>
                      }
                    </div>
                  </div>

                  <!-- BARRA DE PROGRESO DE 4 PASOS -->
                  <div class="space-y-2 pt-2">
                    <div class="flex items-center justify-between text-xs font-bold">
                      <span class="text-slate-600 dark:text-slate-300">Avance del Protocolo Oficial</span>
                      <span class="font-black text-emerald-600 dark:text-emerald-400">{{ stage.progress }}%</span>
                    </div>
                    <div class="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        [ngClass]="req.status === 'RECHAZADA' || req.status === 'CANCELADA' ? 'bg-rose-400' : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'"
                        [style.width.%]="stage.progress"
                      ></div>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] sm:text-[11px] font-bold">
                      @for (s of stepLabels; track s.num) {
                        <div
                          class="p-2 rounded-xl text-center border"
                          [ngClass]="
                            stepIdx >= s.num
                              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-800 dark:text-emerald-300'
                              : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                          "
                        >
                          <span class="block text-[9px] uppercase tracking-wider font-black opacity-75">Paso {{ s.code }}</span>
                          <span class="block truncate">{{ s.title }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Detalles o notas del rescatista -->
                  @if (req.homeVisitScheduledAt && req.status === 'VISITA_DOMICILIARIA') {
                    <div class="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-900 dark:text-sky-200">
                      <strong>Visita domiciliaria programada:</strong> {{ req.homeVisitScheduledAt | date:'dd/MM/yyyy HH:mm' }}
                    </div>
                  }
                  @if (req.status === 'ESPERANDO_CONVENIO') {
                    <div class="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-200">
                      <strong>Visita domiciliaria aprobada:</strong> Haz clic en <strong>"Revisar y Firmar Convenio"</strong> para firmar digitalmente. El cotejo de tu INE será físico y presencial el día de entrega (no subas foto de INE).
                    </div>
                  }
                  @if (req.status === 'CONVENIO_FIRMADO') {
                    <div class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-900 dark:text-purple-200">
                      <strong>Convenio enviado al evaluador:</strong> Presenta tu INE físicamente el día de la entrega para completar la adopción oficial.
                    </div>
                  }
                  @if (req.publisherNotes) {
                    <div class="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-200">
                      <strong>Nota del evaluador:</strong> {{ req.publisherNotes }}
                    </div>
                  }
                  @if (req.rejectionReason && (req.status === 'RECHAZADA' || req.status === 'CANCELADA')) {
                    <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
                      <strong>{{ req.status === 'CANCELADA' ? 'Motivo de cierre:' : 'Resolución:' }}</strong> {{ req.rejectionReason }}
                    </div>
                  }
                </article>
              }
            }
          </section>
        }

        <!-- ================================================================== -->
        <!-- TAB 2: SEGUIMIENTOS UNIFICADOS POR MASCOTA (TARJETA CONTENEDORA) -->
        <!-- ================================================================== -->
        @if (activeTab() === 'FOLLOWUPS') {
          <section class="space-y-5">
            @if (followupGroups().length === 0) {
              <div class="liquid-glass rounded-3xl p-10 text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700">
                <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3 class="font-bold text-slate-900 dark:text-white text-base">No tienes seguimientos activos</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto">
                  Cuando formalices una adopción verás aquí una tarjeta por cada mascota con tus hitos de 2 semanas, 1 mes, medio año y 1 año para enviar tu evidencia fotográfica.
                </p>
              </div>
            } @else {
              @for (group of followupGroups(); track group.petId) {
                <article class="liquid-glass rounded-3xl p-5 sm:p-6 border border-emerald-500/25 shadow-xl space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                    <div class="flex items-center gap-4">
                      <img
                        [src]="group.pet.photoUrl || group.pet.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80'"
                        [alt]="group.pet.name"
                        class="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-emerald-500/30 flex-shrink-0"
                      />
                      <div class="min-w-0 flex-1">
                        <h2 class="text-xl font-black text-slate-900 dark:text-white">{{ group.pet.name }}</h2>
                        <span class="text-xs text-slate-500 block">
                          Avance del seguimiento: <strong class="text-emerald-600 dark:text-emerald-400">{{ group.completedCount }} de {{ group.totalCount }} hitos validados</strong>
                        </span>
                        <div class="w-full max-w-xs h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-1.5 overflow-hidden">
                          <div
                            class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            [style.width.%]="group.progressPercent"
                          ></div>
                        </div>
                      </div>
                    </div>

                    <a
                      [routerLink]="['/adopciones', group.petId]"
                      class="px-3.5 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold self-start sm:self-center"
                    >
                      Ver Ficha de {{ group.pet.name }}
                    </a>
                  </div>

                  @if (!group.pet.isSterilized) {
                    <div class="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-xs text-amber-900 dark:text-amber-200">
                      <strong>Recordatorio de Esterilización Obligatoria:</strong> Por convenio, {{ group.pet.name }} debe ser esterilizada entre los <strong>5 y 6 meses de edad</strong>. Comparte el comprobante con tu evaluador o rescatista.
                    </div>
                  }

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    @for (fol of group.milestones; track fol.id) {
                      @let mLabel = milestoneLabel(fol.dayMilestone);
                      @let draftPreview = pendingProofPreviews()[fol.id];
                      <div class="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div class="flex items-center justify-between gap-2">
                          <div>
                            <span class="text-xs font-black text-slate-900 dark:text-white block">
                              Seguimiento {{ mLabel.label }} ({{ mLabel.badge }})
                            </span>
                            <span class="text-[11px] text-slate-500">
                              Fecha sugerida: {{ fol.scheduledDate | date:'dd/MM/yyyy' }}
                            </span>
                          </div>
                          <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase" [ngClass]="followupBadge(fol.status)">
                            {{ followupLabel(fol.status) }}
                          </span>
                        </div>

                        @if (fol.proofPhotoUrl) {
                          <a [href]="fol.proofPhotoUrl" target="_blank" class="block">
                            <img [src]="fol.proofPhotoUrl" [alt]="'Seguimiento ' + mLabel.label" class="w-full h-36 rounded-xl object-cover border border-emerald-500/30" />
                          </a>
                          @if (fol.proofNotes) {
                            <p class="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 p-2 rounded-lg">
                              {{ fol.proofNotes }}
                            </p>
                          }
                        }

                        @if (fol.status !== 'COMPLETADO') {
                          <div class="space-y-2.5 pt-1">
                            @if (draftPreview) {
                              <div class="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950/5">
                                <img [src]="draftPreview" [alt]="'Vista previa ' + mLabel.label" class="w-full h-36 object-cover" />
                                <button
                                  type="button"
                                  (click)="clearPendingFollowupPhoto(fol.id)"
                                  [disabled]="uploadingFollowupId() === fol.id"
                                  class="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-950/80 text-white text-[10px] font-bold hover:bg-rose-600 transition-colors cursor-pointer"
                                >
                                  Quitar foto
                                </button>
                                <span class="block px-2.5 py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                  Vista previa lista. Escribe un comentario opcional y presiona Enviar evidencia.
                                </span>
                              </div>
                            }

                            <input
                              type="text"
                              [(ngModel)]="proofNotesByFollowup[fol.id]"
                              placeholder="¿Cómo sigue? Ej: Muy feliz, comiendo bien y jugando..."
                              class="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                            />

                            <div class="flex flex-col sm:flex-row gap-2">
                              <label class="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                {{ draftPreview ? 'Cambiar foto' : (fol.proofPhotoUrl ? 'Elegir nueva foto' : 'Seleccionar fotografía') }}
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  class="hidden"
                                  (change)="onSelectFollowupPhoto($event, fol)"
                                  [disabled]="uploadingFollowupId() === fol.id"
                                />
                              </label>

                              @if (draftPreview) {
                                <button
                                  type="button"
                                  (click)="submitFollowupProof(fol)"
                                  [disabled]="uploadingFollowupId() === fol.id"
                                  class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50 shadow-sm transition-all"
                                >
                                  {{ uploadingFollowupId() === fol.id ? 'Enviando evidencia...' : 'Enviar evidencia' }}
                                </button>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </article>
              }
            }
          </section>
        }

        <!-- ========================================================== -->
        <!-- TAB 3: BARRA DE PROGRESO PARA DUEÑO DE MASCOTA (OPCIÓN 2) -->
        <!-- ========================================================== -->
        @if (activeTab() === 'PUBLISHED') {
          <section class="space-y-4">
            <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <div>
                  <strong class="block font-black">Gestiona tus Adopciones Publicadas</strong>
                  <span>Desde el Centro de Adopciones puedes revisar postulantes, pausar o editar tus publicaciones, firmar convenios y validar seguimientos.</span>
                </div>
              </div>
              <a
                routerLink="/panel-rescatista"
                [queryParams]="{ tab: 'publications' }"
                class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-sm whitespace-nowrap text-center hover:brightness-105 transition-all"
              >
                Gestionar Solicitudes →
              </a>
            </div>

            @if (publishedProgress().length === 0) {
              <div class="liquid-glass rounded-3xl p-10 text-center space-y-3 border border-dashed border-slate-300 dark:border-slate-700">
                <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </div>
                <h3 class="font-bold text-slate-900 dark:text-white text-base">Sin publicaciones en proceso de adopción</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto">
                  Con tu verificación Nivel 1 (teléfono de contacto) puedes publicar una mascota en adopción responsable y coordinar personalmente o con apoyo de un rescatista cada paso del protocolo.
                </p>
                <a
                  routerLink="/adopciones"
                  [queryParams]="{ compose: 'EN_ADOPCION' }"
                  class="inline-block px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:brightness-105 transition-all"
                >
                  Publicar Mascota en Adopción
                </a>
              </div>
            } @else {
              @for (item of publishedProgress(); track item.pet.id) {
                <article class="liquid-glass rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-lg space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                      <img
                        [src]="item.pet.photoUrl || item.pet.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80'"
                        [alt]="item.pet.name"
                        class="w-16 h-16 rounded-2xl object-cover shadow-md flex-shrink-0"
                      />
                      <div>
                        <h2 class="text-lg font-black text-slate-900 dark:text-white">{{ item.pet.name }}</h2>
                        <span class="text-xs text-slate-500 block">
                          Postulantes recibidos: <strong>{{ item.totalRequests }}</strong> ({{ item.activeRequests }} en evaluación activa)
                        </span>
                        @if (item.supervisingRescuerName) {
                          <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                            Rescatista supervisor: {{ item.supervisingRescuerName }}
                          </span>
                        }
                      </div>
                    </div>

                    <a
                      [routerLink]="['/adopciones', item.pet.id]"
                      class="px-3.5 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold self-start sm:self-center"
                    >
                      Ver Ficha →
                    </a>
                  </div>

                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-xs font-bold">
                      <span class="text-slate-700 dark:text-slate-200">{{ item.stageLabel }}</span>
                      <span class="text-emerald-600 dark:text-emerald-400 font-black">{{ item.progressPercent }}%</span>
                    </div>
                    <div class="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        [style.width.%]="item.progressPercent"
                      ></div>
                    </div>
                  </div>
                </article>
              }
            }
          </section>
        }
      }

      <!-- MODAL CONVENIO DIGITAL -->
      @if (selectedAgreementReq()) {
        <div
          class="fixed inset-0 z-[80] bg-slate-950/75 backdrop-blur-sm overflow-y-auto overscroll-contain p-3 sm:p-6 flex items-start justify-center"
          (click)="closeAgreementModal()"
        >
          <div class="w-full max-w-4xl my-2 sm:my-4 relative" (click)="$event.stopPropagation()">
            <button
              type="button"
              (click)="closeAgreementModal()"
              class="sticky top-2 z-20 mb-2 ml-auto flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-black text-xs shadow-lg cursor-pointer"
            >
              ✕ Cerrar Convenio
            </button>

            <app-adoption-agreement-document
              [request]="selectedAgreementReq()!"
              [mode]="agreementMode()"
              [isSubmitting]="isSigningAgreement()"
              (signed)="handleSignAgreement($event)"
            />
          </div>
        </div>
      }
    </div>
  `,
})
export class MyAdoptionsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private adoptionService = inject(AdoptionService);
  private notify = inject(NotificationService);
  private imageUpload = inject(ImageUploadService);
  private confirmService = inject(ConfirmService);
  private scrollLock = inject(ScrollLockService);

  activeTab = signal<'APPLICATIONS' | 'FOLLOWUPS' | 'PUBLISHED'>('APPLICATIONS');
  applications = signal<AdoptionRequest[]>([]);
  myFollowups = signal<AdoptionFollowup[]>([]);
  publishedProgress = signal<PublishedPetProgress[]>([]);
  isLoading = signal(true);

  selectedAgreementReq = signal<AdoptionRequest | null>(null);
  agreementMode = signal<'sign' | 'view'>('view');
  isSigningAgreement = signal(false);
  withdrawingRequestId = signal<string | null>(null);

  uploadingFollowupId = signal<string | null>(null);
  pendingProofFiles = signal<Record<string, File>>({});
  pendingProofPreviews = signal<Record<string, string>>({});
  proofNotesByFollowup: Record<string, string> = {};

  stepLabels = [
    { num: 1, code: '01', title: 'Entrevista' },
    { num: 2, code: '02', title: 'Visita' },
    { num: 3, code: '03', title: 'Convenio' },
    { num: 4, code: '04', title: 'Adoptada' },
  ];

  followupGroups = computed(() => groupFollowupsByPet(this.myFollowups()));

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'followups') this.activeTab.set('FOLLOWUPS');
    else if (tab === 'published') this.activeTab.set('PUBLISHED');

    this.loadAll();
  }

  loadAll(): void {
    this.isLoading.set(true);
    let pending = 3;
    const done = () => {
      pending--;
      if (pending <= 0) this.isLoading.set(false);
    };

    this.adoptionService.getMyApplications().subscribe({
      next: (apps) => {
        this.applications.set(apps || []);
        done();
      },
      error: () => done(),
    });

    this.adoptionService.getMyFollowups().subscribe({
      next: (fols) => {
        this.myFollowups.set(fols || []);
        done();
      },
      error: () => done(),
    });

    this.adoptionService.getMyPublishedProgress().subscribe({
      next: (pub) => {
        this.publishedProgress.set(pub || []);
        done();
      },
      error: () => done(),
    });
  }

  stageMeta(status: AdoptionRequest['status']) {
    return getStageMeta(status);
  }

  stepIndex(req: AdoptionRequest): number {
    return getRequestStepIndex(req);
  }

  milestoneLabel(day: number) {
    return getMilestoneLabel(day);
  }

  followupBadge(status: FollowupStatus): string {
    switch (status) {
      case 'COMPLETADO':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
      case 'FOTO_RECIBIDA':
        return 'bg-sky-500/20 text-sky-700 dark:text-sky-300';
      case 'ALERTA_REABANDONO':
        return 'bg-rose-500 text-white';
      default:
        return 'bg-amber-500/20 text-amber-800 dark:text-amber-300';
    }
  }

  followupLabel(status: FollowupStatus): string {
    switch (status) {
      case 'COMPLETADO':
        return 'Validado';
      case 'FOTO_RECIBIDA':
        return 'Evidencia enviada';
      case 'ALERTA_REABANDONO':
        return 'En revisión';
      default:
        return 'Pendiente';
    }
  }

  canWithdraw(req: AdoptionRequest): boolean {
    return !['APROBADA', 'RECHAZADA', 'CANCELADA'].includes(req.status);
  }

  async withdrawApplication(req: AdoptionRequest): Promise<void> {
    const reason = await this.confirmService.prompt({
      title: 'Retirar solicitud de adopción',
      message: `¿Deseas retirar tu postulación para adoptar a ${req.pet?.name || 'esta mascota'}?`,
      submessage: 'Si eres el único postulante activo, la mascota volverá a mostrarse disponible para otros adoptantes.',
      inputLabel: 'Motivo (opcional)',
      inputPlaceholder: 'Ej. Ya adopté otra mascota o cambió mi disponibilidad',
      confirmText: 'Sí, retirar solicitud',
      cancelText: 'Conservar solicitud',
      type: 'warning',
    });

    if (reason === null) return;

    this.withdrawingRequestId.set(req.id);
    this.adoptionService.withdrawRequest(req.id, reason || undefined).subscribe({
      next: () => {
        this.withdrawingRequestId.set(null);
        this.notify.success('Solicitud retirada', 'El dueño de la mascota fue notificado correctamente.');
        this.loadAll();
      },
      error: (err) => {
        this.withdrawingRequestId.set(null);
        this.notify.error(err.error?.message || 'No se pudo retirar tu solicitud');
      },
    });
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock('my-adoptions-agreement');
    if (typeof URL !== 'undefined') {
      Object.values(this.pendingProofPreviews()).forEach((url) => URL.revokeObjectURL(url));
    }
  }

  openAgreementModal(req: AdoptionRequest, mode: 'sign' | 'view'): void {
    this.scrollLock.lock('my-adoptions-agreement');
    this.agreementMode.set(mode);
    this.selectedAgreementReq.set(req);
  }

  closeAgreementModal(): void {
    this.scrollLock.unlock('my-adoptions-agreement');
    this.selectedAgreementReq.set(null);
  }

  handleSignAgreement(payload: SignAdoptionAgreementPayload): void {
    const req = this.selectedAgreementReq();
    if (!req) return;

    this.isSigningAgreement.set(true);
    this.adoptionService.signAgreement(req.id, payload).subscribe({
      next: () => {
        this.isSigningAgreement.set(false);
        this.closeAgreementModal();
        this.notify.success(
          '¡Convenio firmado con éxito!',
          'El rescatista recibió notificación. Presenta tu INE físicamente el día de entrega.',
        );
        this.loadAll();
      },
      error: (err) => {
        this.isSigningAgreement.set(false);
        this.notify.error(err.error?.message || 'No se pudo firmar el Convenio');
      },
    });
  }

  onSelectFollowupPhoto(event: Event, fol: AdoptionFollowup): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notify.warning('Selecciona únicamente un archivo de imagen (JPG, PNG o WEBP).');
      return;
    }

    const prevUrls = this.pendingProofPreviews();
    if (prevUrls[fol.id] && typeof URL !== 'undefined') {
      URL.revokeObjectURL(prevUrls[fol.id]);
    }

    const previewUrl = typeof URL !== 'undefined' ? URL.createObjectURL(file) : '';
    this.pendingProofFiles.update((curr) => ({ ...curr, [fol.id]: file }));
    if (previewUrl) {
      this.pendingProofPreviews.update((curr) => ({ ...curr, [fol.id]: previewUrl }));
    }
  }

  clearPendingFollowupPhoto(followupId: string): void {
    const prevUrl = this.pendingProofPreviews()[followupId];
    if (prevUrl && typeof URL !== 'undefined') {
      URL.revokeObjectURL(prevUrl);
    }
    this.pendingProofFiles.update((curr) => {
      const next = { ...curr };
      delete next[followupId];
      return next;
    });
    this.pendingProofPreviews.update((curr) => {
      const next = { ...curr };
      delete next[followupId];
      return next;
    });
  }

  submitFollowupProof(fol: AdoptionFollowup): void {
    const file = this.pendingProofFiles()[fol.id];
    if (!file) {
      this.notify.warning('Selecciona primero una fotografía para enviar tu evidencia.');
      return;
    }

    const note = this.proofNotesByFollowup[fol.id]?.trim() || 'Evidencia de bienestar enviada por el adoptante';
    this.uploadingFollowupId.set(fol.id);

    this.imageUpload.uploadImage(file, 'followups').subscribe({
      next: (url) => {
        this.adoptionService.registerFollowupProof(fol.id, url, note).subscribe({
          next: () => {
            this.uploadingFollowupId.set(null);
            this.clearPendingFollowupPhoto(fol.id);
            this.notify.success('Evidencia enviada', 'Tu seguimiento quedó registrado para validación.');
            this.loadAll();
          },
          error: () => {
            this.uploadingFollowupId.set(null);
            this.notify.error('No se pudo registrar el seguimiento');
          },
        });
      },
      error: () => {
        this.uploadingFollowupId.set(null);
        this.notify.error('Error al subir imagen');
      },
    });
  }
}

