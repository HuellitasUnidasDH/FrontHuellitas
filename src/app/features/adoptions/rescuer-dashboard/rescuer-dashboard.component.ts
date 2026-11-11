import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdoptionService } from '../../../core/services/adoption.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { ImageUploadService } from '../../../core/services/image-upload.service';
import {
  AdoptionRequest,
  AdoptionFollowup,
  AdoptionRequestStatus,
  AdopterVerification,
  FollowupStatus,
} from '../../../core/models/adoption.model';
import { Pet } from '../../../core/models/pet.model';
import { UserRole } from '../../../core/models/user.model';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';
import {
  getCandidateVerificationBadge,
  getMilestoneLabel,
  getStageMeta,
  groupFollowupsByPet,
} from '../shared/adoption-helpers.util';

interface PetRequestGroup {
  pet: Pet;
  requests: AdoptionRequest[];
  activeCount: number;
  approvedReq?: AdoptionRequest;
}

@Component({
  selector: 'app-rescuer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <!-- Header -->
      <section class="liquid-glass rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden border border-emerald-500/20">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4 text-center sm:text-left">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 flex-shrink-0">
              📋
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Panel del Rescatista y Evaluación
              </h1>
              <p class="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                Protocolo oficial de 4 pasos, niveles de adoptantes y seguimientos agrupados por mascota (2 semanas, 1 mes, medio año y 1 año).
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="refreshData()"
              [disabled]="isRefreshing()"
              class="px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50 border border-slate-200 dark:border-slate-700"
              title="Actualizar bandeja"
            >
              <span [class.animate-spin]="isRefreshing()">🔄</span>
              <span>Actualizar</span>
            </button>

            <a
              routerLink="/adopciones"
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1 hover:brightness-105 transition-all"
            >
              <span>+</span> Publicar en Adopción
            </a>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
          <button
            (click)="activeTab.set('REQUESTS')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
            [ngClass]="activeTab() === 'REQUESTS' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            📥 Solicitudes por Mascota ({{ requests().length }})
          </button>

          <button
            (click)="activeTab.set('VERIFICATIONS')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5"
            [ngClass]="activeTab() === 'VERIFICATIONS' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            <span>🛡️ Aprobar Niveles 2 y 3</span>
            @if (pendingVerificationsCount() > 0) {
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {{ pendingVerificationsCount() }}
              </span>
            }
          </button>

          <button
            (click)="activeTab.set('FOLLOWUPS')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
            [ngClass]="activeTab() === 'FOLLOWUPS' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            📸 Seguimientos por Mascota ({{ followupGroups().length }})
          </button>

          <span class="ml-auto text-[11px] font-semibold text-slate-400 hidden sm:inline">
            Actualizado: {{ lastUpdatedFormatted() }}
          </span>
        </div>
      </section>

      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-12 text-center space-y-3">
          <div class="text-4xl animate-bounce">🐾</div>
          <p class="text-sm font-bold text-slate-500">Cargando módulo de rescate y adopciones...</p>
        </div>
      } @else {
        <!-- ========================================================== -->
        <!-- TAB 1: SOLICITUDES AGRUPADAS POR MASCOTA (MASTER VIEW) -->
        <!-- ========================================================== -->
        @if (activeTab() === 'REQUESTS') {
          <section class="space-y-5">
            <!-- Filtros y Búsqueda -->
            <div class="liquid-glass rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  (click)="requestFilter.set('ALL')"
                  class="px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all"
                  [ngClass]="requestFilter() === 'ALL' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
                >
                  Todas
                </button>
                <button
                  type="button"
                  (click)="requestFilter.set('ACTIVE')"
                  class="px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all"
                  [ngClass]="requestFilter() === 'ACTIVE' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
                >
                  Activas / En Evaluación
                </button>
                <button
                  type="button"
                  (click)="requestFilter.set('READY')"
                  class="px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all"
                  [ngClass]="requestFilter() === 'READY' ? 'bg-indigo-600 text-white' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
                >
                  Convenio / Entrega
                </button>
                <button
                  type="button"
                  (click)="requestFilter.set('CLOSED')"
                  class="px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all"
                  [ngClass]="requestFilter() === 'CLOSED' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
                >
                  Finalizadas
                </button>
              </div>

              <input
                type="text"
                [(ngModel)]="searchTerm"
                placeholder="🔍 Buscar por nombre de mascota o candidato..."
                class="w-full md:w-72 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            @if (filteredPetRequestGroups().length === 0) {
              <div class="liquid-glass rounded-3xl p-10 text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700">
                <div class="text-4xl">📭</div>
                <h3 class="font-bold text-slate-900 dark:text-white text-base">No hay solicitudes en esta categoría</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto">
                  Las publicaciones eliminadas se depuran automáticamente. Cuando recibas una postulación activa aparecerá agrupada aquí por mascota.
                </p>
              </div>
            } @else {
              @for (group of filteredPetRequestGroups(); track group.pet.id) {
                <article class="liquid-glass rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-700/70 shadow-lg space-y-4">
                  <!-- Cabecera de Mascota -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800">
                    <div class="flex items-center gap-3.5">
                      <img
                        [src]="group.pet.photoUrl || group.pet.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80'"
                        [alt]="group.pet.name"
                        class="w-14 h-14 rounded-2xl object-cover shadow-sm flex-shrink-0"
                      />
                      <div>
                        <div class="flex items-center gap-2 flex-wrap">
                          <h2 class="text-lg font-black text-slate-900 dark:text-white">{{ group.pet.name }}</h2>
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            {{ group.pet.species }} • {{ group.pet.breed || 'Mestizo' }}
                          </span>
                          @if (group.approvedReq) {
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                              ✓ Adoptada
                            </span>
                          }
                        </div>
                        <span class="text-xs text-slate-500 block mt-0.5">
                          {{ group.requests.length }} postulación(es) registrada(s) • {{ group.activeCount }} activa(s)
                        </span>
                      </div>
                    </div>

                    <a
                      [routerLink]="['/adopciones', group.pet.id]"
                      class="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline self-start sm:self-center"
                    >
                      Ver publicación →
                    </a>
                  </div>

                  <!-- Lista limpia de Postulantes -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    @for (req of group.requests; track req.id) {
                      @let badge = candidateBadge(req.adopter);
                      @let stage = stageMeta(req.status);
                      <div class="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 hover:border-emerald-500/40 transition-colors">
                        <div class="flex items-start justify-between gap-3">
                          <div class="flex items-center gap-3 min-w-0">
                            @if (req.adopter?.profilePhotoUrl) {
                              <img
                                [src]="req.adopter!.profilePhotoUrl!"
                                [alt]="req.adopter?.fullName"
                                class="w-12 h-12 rounded-2xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                              />
                            } @else {
                              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white font-black text-lg flex items-center justify-center flex-shrink-0">
                                {{ (req.adopter?.fullName || 'A').charAt(0).toUpperCase() }}
                              </div>
                            }
                            <div class="min-w-0">
                              <h3 class="font-black text-slate-900 dark:text-white text-sm truncate">
                                {{ req.adopter?.fullName }}
                              </h3>
                              <span class="text-[11px] text-slate-500 block truncate">
                                📍 {{ req.adopter?.colonia?.name || 'Dolores Hidalgo' }} • {{ req.createdAt | date:'dd/MM/yy' }}
                              </span>
                            </div>
                          </div>

                          <span
                            class="px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 flex-shrink-0"
                            [ngClass]="badge.badgeClass"
                            [title]="badge.subtitle"
                          >
                            <span>{{ badge.icon }}</span> Nivel {{ badge.level }}
                          </span>
                        </div>

                        <!-- Progreso y Etapa -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between text-[11px] font-bold">
                            <span class="px-2 py-0.5 rounded-lg border text-[10px] font-black" [ngClass]="stage.colorClass">
                              {{ stage.label }}
                            </span>
                            <span class="text-slate-500">{{ stage.progress }}%</span>
                          </div>
                          <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              class="h-full rounded-full transition-all duration-500"
                              [ngClass]="req.status === 'RECHAZADA' || req.status === 'CANCELADA' ? 'bg-rose-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'"
                              [style.width.%]="stage.progress"
                            ></div>
                          </div>
                        </div>

                        <!-- Botones de Acción -->
                        <div class="flex items-center gap-2 pt-1">
                          <a
                            [routerLink]="['/panel-rescatista/solicitud', req.id]"
                            class="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 text-slate-950 font-black text-xs text-center shadow-sm transition-all"
                          >
                            🔎 Evaluar Expediente →
                          </a>

                          <button
                            type="button"
                            (click)="contactAdopterInApp(req)"
                            class="py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold text-xs cursor-pointer"
                            title="Abrir Chat Directo"
                          >
                            💬
                          </button>

                          <a
                            [href]="req.whatsappDirectUrl || getAdopterWhatsAppUrl(req)"
                            target="_blank"
                            class="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs"
                            title="WhatsApp Directo"
                          >
                            📲
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                </article>
              }
            }
          </section>
        }

        <!-- ========================================================== -->
        <!-- TAB 2: APROBACIÓN DE VERIFICACIÓN DE ADOPTANTES (N2 & N3) -->
        <!-- ========================================================== -->
        @if (activeTab() === 'VERIFICATIONS') {
          <section class="space-y-4">
            @if (verifications().length === 0) {
              <div class="liquid-glass rounded-3xl p-10 text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700">
                <div class="text-4xl">🛡️</div>
                <h3 class="font-bold text-slate-900 dark:text-white text-base">No hay expedientes de verificación registrados aún</h3>
                <p class="text-xs text-slate-500">Cuando un usuario envíe su Cuestionario Socioambiental (Nivel 2) o Carta Compromiso (Nivel 3) aparecerá aquí.</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (ver of verifications(); track ver.id) {
                  <article class="liquid-glass rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-700/70 shadow-lg space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                      <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white font-black flex items-center justify-center text-base shadow-md">
                          {{ (ver.user?.fullName || 'U').charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <h3 class="font-black text-slate-900 dark:text-white text-base">
                            {{ ver.user?.fullName || 'Usuario' }}
                          </h3>
                          <span class="text-xs text-slate-500">
                            {{ ver.user?.email }} • 📱 {{ ver.user?.phone || 'Sin teléfono' }}
                          </span>
                        </div>
                      </div>

                      <div class="flex flex-wrap items-center gap-2 text-[11px] font-extrabold">
                        <span
                          class="px-2.5 py-1 rounded-full border"
                          [ngClass]="
                            ver.isLevel2Completed
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : ver.level2Status === 'PENDIENTE'
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                                : ver.level2Status === 'RECHAZADO'
                                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent'
                          "
                        >
                          Nivel 2: {{ ver.isLevel2Completed ? '✓ Aprobado' : ver.level2Status === 'RECHAZADO' ? '⚠️ Con Observación' : ver.level2Status || 'Pendiente' }}
                        </span>

                        <span
                          class="px-2.5 py-1 rounded-full border"
                          [ngClass]="
                            ver.isLevel3Completed
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : ver.level3Status === 'PENDIENTE'
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                                : ver.level3Status === 'RECHAZADO'
                                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent'
                          "
                        >
                          Nivel 3: {{ ver.isLevel3Completed ? '✓ Aprobado' : ver.level3Status === 'RECHAZADO' ? '⚠️ Con Observación' : ver.level3Status || 'No solicitado' }}
                        </span>
                      </div>
                    </div>

                    @if (ver.reviewNotes && (ver.level2Status === 'RECHAZADO' || ver.level3Status === 'RECHAZADO')) {
                      <div class="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-xs flex items-start gap-2.5">
                        <span class="text-base">💬</span>
                        <div>
                          <strong class="block font-black text-amber-700 dark:text-amber-300 uppercase text-[10px]">
                            Observación activa enviada al solicitante:
                          </strong>
                          <p class="mt-0.5 text-slate-800 dark:text-slate-200">{{ ver.reviewNotes }}</p>
                        </div>
                      </div>
                    }

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                      <div>
                        <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Tipo de Vivienda</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200">{{ ver.housingType }} (Permite mascotas: {{ ver.landlordAllowsPets ? 'Sí' : 'No' }})</span>
                      </div>
                      <div>
                        <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Habitantes del Hogar</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200">{{ ver.peopleInHome || 'No especificado' }}</span>
                      </div>
                      <div>
                        <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Experiencia Previa</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200">{{ ver.previousExperience || 'No especificado' }}</span>
                      </div>
                      <div>
                        <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Plan ante Mudanza / Viajes</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200">{{ ver.relocationPlan || 'No especificado' }}</span>
                      </div>
                      <div class="sm:col-span-2">
                        <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Responsable Financiero Veterinario</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200">{{ ver.financialResponsible || 'No especificado' }}</span>
                      </div>
                      @if (ver.signedCommitmentLetter) {
                        <div class="sm:col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 font-bold">
                          📜 Carta Compromiso de Nivel 3 firmada digitalmente por el solicitante.
                        </div>
                      }
                    </div>

                    <div class="flex flex-wrap items-center justify-end gap-2 pt-2">
                      @if (!ver.isLevel2Completed) {
                        <button
                          type="button"
                          (click)="reviewAdopterLevel(ver, 2, true)"
                          class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                        >
                          ✓ Aprobar Nivel 2
                        </button>
                        <button
                          type="button"
                          (click)="reviewAdopterLevel(ver, 2, false)"
                          class="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer"
                        >
                          ✕ Rechazar Nivel 2
                        </button>
                      } @else if (ver.isLevel2Completed && !ver.isLevel3Completed && (ver.level3Status === 'PENDIENTE' || ver.signedCommitmentLetter)) {
                        <button
                          type="button"
                          (click)="reviewAdopterLevel(ver, 3, true)"
                          class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                        >
                          ✓ Aprobar Nivel 3 (Adoptante Verificado)
                        </button>
                        <button
                          type="button"
                          (click)="reviewAdopterLevel(ver, 3, false)"
                          class="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer"
                        >
                          ✕ Rechazar Nivel 3
                        </button>
                      } @else {
                        <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ Expediente verificado por completo
                        </span>
                      }
                    </div>
                  </article>
                }
              </div>
            }
          </section>
        }

        <!-- ====================================================================== -->
        <!-- TAB 3: SEGUIMIENTOS AGRUPADOS EN UNA SOLA TARJETA CONTENEDORA POR MASCOTA -->
        <!-- ====================================================================== -->
        @if (activeTab() === 'FOLLOWUPS') {
          <section class="space-y-5">
            @if (followupGroups().length === 0) {
              <div class="liquid-glass rounded-3xl p-10 text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700">
                <div class="text-4xl">🗓️</div>
                <h3 class="font-bold text-slate-900 dark:text-white text-base">No hay seguimientos programados aún</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto">
                  Cuando formalices una adopción con Convenio firmado e INE cotejado, aquí se agruparán los 4 hitos oficiales de cada mascota (2 semanas, 1 mes, medio año y 1 año).
                </p>
              </div>
            } @else {
              @for (group of followupGroups(); track group.petId + group.adopter?.id) {
                @let badge = candidateBadge(group.adopter);
                <article
                  class="liquid-glass rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 border"
                  [ngClass]="group.hasAlert ? 'border-rose-500/60' : 'border-emerald-500/25'"
                >
                  <!-- Header de la Mascota Contenedora -->
                  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                    <div class="flex items-center gap-4">
                      <img
                        [src]="group.pet.photoUrl || group.pet.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80'"
                        [alt]="group.pet.name"
                        class="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-emerald-500/30 flex-shrink-0"
                      />
                      <div>
                        <div class="flex flex-wrap items-center gap-2">
                          <h2 class="text-xl font-black text-slate-900 dark:text-white">{{ group.pet.name }}</h2>
                          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black" [ngClass]="badge.badgeClass">
                            {{ badge.icon }} Nivel {{ badge.level }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          Adoptante: <strong>{{ group.adopter?.fullName || 'Adoptante' }}</strong> •
                          Progreso: <strong class="text-emerald-600 dark:text-emerald-400">{{ group.completedCount }} de {{ group.totalCount }} hitos</strong>
                        </p>
                        <!-- Barra de progreso -->
                        <div class="w-48 sm:w-64 h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-1.5 overflow-hidden">
                          <div
                            class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            [style.width.%]="group.progressPercent"
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                      @if (group.milestones[0]; as firstFol) {
                        <button
                          type="button"
                          (click)="contactFollowupAdopterInApp(firstFol)"
                          class="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <span>💬</span> Chat
                        </button>
                        <a
                          [href]="firstFol.prefilledWhatsappUrl || getFollowupWhatsAppUrl(firstFol)"
                          target="_blank"
                          class="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5"
                        >
                          <span>📲</span> WhatsApp
                        </a>
                      }
                      <a
                        [routerLink]="['/adopciones', group.petId]"
                        class="px-3.5 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs"
                      >
                        Ver Ficha
                      </a>
                    </div>
                  </div>

                  <!-- Recordatorio de Esterilización (5-6 meses) -->
                  @if (!group.pet.isSterilized) {
                    <div class="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div class="flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
                        <span class="text-lg flex-shrink-0">🩺</span>
                        <div>
                          <strong class="font-black block">Compromiso de Esterilización Pendiente (5 - 6 meses de edad)</strong>
                          <span>{{ group.pet.name }} fue entregada con compromiso obligatorio de esterilización. Confirma aquí cuando el adoptante entregue su comprobante médico.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        (click)="confirmSterilization(group.pet)"
                        class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex-shrink-0 cursor-pointer shadow-sm"
                      >
                        ✅ Confirmar Esterilización
                      </button>
                    </div>
                  } @else {
                    <div class="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
                      <span>✓</span> Mascota esterilizada — compromiso cumplido
                    </div>
                  }

                  <!-- 4 Hitos Dentro de la Misma Tarjeta Contenedora -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    @for (fol of group.milestones; track fol.id) {
                      @let mLabel = milestoneLabel(fol.dayMilestone);
                      <div
                        class="p-4 rounded-2xl border bg-white/75 dark:bg-slate-900/70 space-y-3"
                        [ngClass]="
                          fol.status === 'COMPLETADO'
                            ? 'border-emerald-500/40'
                            : fol.status === 'ALERTA_REABANDONO'
                              ? 'border-rose-500/60 bg-rose-500/5'
                              : 'border-slate-200 dark:border-slate-800'
                        "
                      >
                        <div class="flex items-center justify-between gap-2">
                          <div>
                            <span class="text-xs font-black text-slate-900 dark:text-white block">
                              📅 Seguimiento {{ mLabel.label }} ({{ mLabel.badge }})
                            </span>
                            <span class="text-[11px] text-slate-500">
                              Fecha programada: {{ fol.scheduledDate | date:'dd/MM/yyyy' }}
                            </span>
                          </div>

                          <span
                            class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase"
                            [ngClass]="followupStatusBadge(fol.status)"
                          >
                            {{ followupStatusLabel(fol.status) }}
                          </span>
                        </div>

                        @if (fol.proofPhotoUrl) {
                          <div class="space-y-1.5">
                            <a [href]="fol.proofPhotoUrl" target="_blank" class="block">
                              <img
                                [src]="fol.proofPhotoUrl"
                                [alt]="'Evidencia ' + mLabel.label"
                                class="w-full h-36 rounded-xl object-cover border border-emerald-500/30 hover:opacity-95"
                              />
                            </a>
                            @if (fol.proofNotes) {
                              <p class="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 p-2 rounded-lg">
                                💬 {{ fol.proofNotes }}
                              </p>
                            }
                          </div>
                        }

                        <!-- Acciones del Rescatista por Hito -->
                        <div class="flex flex-wrap items-center gap-2 pt-1">
                          <label class="flex-1 py-2 px-3 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold cursor-pointer text-center transition-colors">
                            @if (uploadingFollowupId() === fol.id) {
                              ⏳ Subiendo foto...
                            } @else {
                              📷 {{ fol.proofPhotoUrl ? 'Cambiar Foto' : 'Subir / Tomar Foto' }}
                            }
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              class="hidden"
                              (change)="onUploadFollowupPhoto($event, fol)"
                              [disabled]="uploadingFollowupId() === fol.id"
                            />
                          </label>

                          @if (fol.status !== 'COMPLETADO') {
                            <button
                              type="button"
                              (click)="setFollowupStatus(fol, 'COMPLETADO')"
                              class="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                            >
                              ✓ Validar
                            </button>
                          }

                          @if (fol.status !== 'ALERTA_REABANDONO') {
                            <button
                              type="button"
                              (click)="setFollowupStatus(fol, 'ALERTA_REABANDONO')"
                              class="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer"
                              title="Reportar incidencia o alerta de seguimiento"
                            >
                              ⚠️ Alerta
                            </button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </article>
              }
            }
          </section>
        }
      }
    </div>
  `,
})
export class RescuerDashboardComponent implements OnInit, OnDestroy {
  brand = BRAND_CONFIG;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private adoptionService = inject(AdoptionService);
  public authService = inject(AuthService);
  private notify = inject(NotificationService);
  private confirmService = inject(ConfirmService);
  private dmService = inject(DirectMessageService);
  private imageUpload = inject(ImageUploadService);

  activeTab = signal<'REQUESTS' | 'VERIFICATIONS' | 'FOLLOWUPS'>('REQUESTS');
  requestFilter = signal<'ALL' | 'ACTIVE' | 'READY' | 'CLOSED'>('ALL');
  searchTerm = '';

  requests = signal<AdoptionRequest[]>([]);
  verifications = signal<AdopterVerification[]>([]);
  followups = signal<AdoptionFollowup[]>([]);
  isLoading = signal<boolean>(true);
  isRefreshing = signal<boolean>(false);
  uploadingFollowupId = signal<string | null>(null);
  lastUpdated = signal<Date>(new Date());

  pendingVerificationsCount = computed(() => {
    return this.verifications().filter(
      (v) => v.level2Status === 'PENDIENTE' || v.level3Status === 'PENDIENTE',
    ).length;
  });

  followupGroups = computed(() => groupFollowupsByPet(this.followups()));

  petRequestGroups = computed<PetRequestGroup[]>(() => {
    const map = new Map<string, PetRequestGroup>();
    for (const req of this.requests()) {
      if (!req.pet || req.pet.isDeleted) continue;
      let grp = map.get(req.petId);
      if (!grp) {
        grp = {
          pet: req.pet,
          requests: [],
          activeCount: 0,
        };
        map.set(req.petId, grp);
      }
      grp.requests.push(req);
      if (req.status === 'APROBADA') {
        grp.approvedReq = req;
      } else if (req.status !== 'RECHAZADA' && req.status !== 'CANCELADA') {
        grp.activeCount++;
      }
    }
    return Array.from(map.values());
  });

  filteredPetRequestGroups(): PetRequestGroup[] {
    const q = this.searchTerm.trim().toLowerCase();
    const filter = this.requestFilter();

    return this.petRequestGroups()
      .map((grp) => {
        const filteredReqs = grp.requests.filter((r) => {
          if (q) {
            const matchesPet = grp.pet.name?.toLowerCase().includes(q);
            const matchesAdopter = r.adopter?.fullName?.toLowerCase().includes(q);
            if (!matchesPet && !matchesAdopter) return false;
          }
          if (filter === 'ACTIVE') {
            return ['PENDIENTE', 'EN_EVALUACION', 'EN_ENTREVISTA', 'VISITA_DOMICILIARIA'].includes(r.status);
          }
          if (filter === 'READY') {
            return ['ESPERANDO_CONVENIO', 'CONVENIO_FIRMADO'].includes(r.status);
          }
          if (filter === 'CLOSED') {
            return ['APROBADA', 'RECHAZADA', 'CANCELADA'].includes(r.status);
          }
          return true;
        });
        return { ...grp, requests: filteredReqs };
      })
      .filter((grp) => grp.requests.length > 0);
  }

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const role = this.authService.currentUser()?.role;
    if (role !== UserRole.RESCATISTA_VERIFICADO && role !== UserRole.ALBERGUE && role !== UserRole.ADMIN) {
      this.notify.error('Acceso denegado', 'Esta vista es exclusiva para rescatistas verificados y administradores.');
      this.router.navigate(['/dashboard']);
      return;
    }

    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'verifications') {
      this.activeTab.set('VERIFICATIONS');
    } else if (tabParam === 'followups') {
      this.activeTab.set('FOLLOWUPS');
    }

    this.loadData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.pollTimer = setInterval(() => this.silentRefresh(), 20000);
  }

  stopAutoRefresh(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  lastUpdatedFormatted(): string {
    return this.lastUpdated().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  silentRefresh(): void {
    this.adoptionService.getPublisherInbox().subscribe({
      next: (newReqs) => {
        this.requests.set(newReqs || []);
        this.lastUpdated.set(new Date());
      },
    });
    this.adoptionService.getVerificationsForReview().subscribe({
      next: (vers) => this.verifications.set(vers || []),
      error: () => {},
    });
  }

  refreshData(): void {
    this.isRefreshing.set(true);
    this.adoptionService.getPublisherInbox().subscribe({
      next: (reqs) => {
        this.requests.set(reqs || []);
        this.adoptionService.getVerificationsForReview().subscribe({
          next: (vers) => this.verifications.set(vers || []),
          error: () => {},
        });
        this.adoptionService.getFollowups().subscribe({
          next: (fols) => {
            this.followups.set(fols || []);
            this.isRefreshing.set(false);
            this.lastUpdated.set(new Date());
            this.notify.success('Bandeja actualizada');
          },
          error: () => this.isRefreshing.set(false),
        });
      },
      error: () => this.isRefreshing.set(false),
    });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.adoptionService.getPublisherInbox().subscribe({
      next: (reqs) => {
        this.requests.set(reqs || []);
        this.adoptionService.getVerificationsForReview().subscribe({
          next: (vers) => this.verifications.set(vers || []),
          error: () => {},
        });
        this.adoptionService.getFollowups().subscribe({
          next: (fols) => {
            this.followups.set(fols || []);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false),
        });
      },
      error: () => this.isLoading.set(false),
    });
  }

  candidateBadge(user?: AdoptionRequest['adopter'] | null) {
    return getCandidateVerificationBadge(user);
  }

  stageMeta(status: AdoptionRequestStatus) {
    return getStageMeta(status);
  }

  milestoneLabel(day: number) {
    return getMilestoneLabel(day);
  }

  followupStatusBadge(status: FollowupStatus): string {
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

  followupStatusLabel(status: FollowupStatus): string {
    switch (status) {
      case 'COMPLETADO':
        return '✓ Validado';
      case 'FOTO_RECIBIDA':
        return '📷 Evidencia Recibida';
      case 'ALERTA_REABANDONO':
        return '⚠️ Alerta Activa';
      case 'SOLICITADO':
        return 'Solicitado';
      default:
        return 'Programado';
    }
  }

  async reviewAdopterLevel(ver: AdopterVerification, level: 2 | 3, approved: boolean): Promise<void> {
    let notes: string | undefined;
    if (!approved) {
      const input = await this.confirmService.prompt({
        title: `Observaciones para Nivel ${level}`,
        message: `Indica al adoptante ${ver.user?.fullName || ''} qué debe corregir o ampliar:`,
        inputPlaceholder: 'Ej: Por favor especifica quién cuidará a la mascota si sales de viaje...',
        confirmText: 'Enviar Observaciones',
        cancelText: 'Cancelar',
        type: 'warning',
        icon: '📝',
      });
      if (!input) return;
      notes = input;
    }

    this.adoptionService.reviewVerification(ver.id, { level, approved, notes }).subscribe({
      next: () => {
        this.notify.success(
          approved
            ? `¡Nivel ${level} aprobado para ${ver.user?.fullName || 'el adoptante'}!`
            : `Observaciones enviadas para Nivel ${level}`,
        );
        this.loadData();
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'No se pudo procesar la evaluación');
      },
    });
  }

  onUploadFollowupPhoto(event: Event, fol: AdoptionFollowup): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingFollowupId.set(fol.id);
    this.imageUpload.uploadImage(file, 'followups').subscribe({
      next: (url) => {
        this.adoptionService
          .registerFollowupProof(fol.id, url, 'Evidencia cargada y validada por rescatista', true)
          .subscribe({
            next: () => {
              this.uploadingFollowupId.set(null);
              this.notify.success('¡Fotografía de seguimiento registrada y validada!');
              this.loadData();
            },
            error: () => {
              this.uploadingFollowupId.set(null);
              this.notify.error('Error al guardar seguimiento');
            },
          });
      },
      error: () => {
        this.uploadingFollowupId.set(null);
        this.notify.error('No se pudo subir la imagen');
      },
    });
  }

  setFollowupStatus(fol: AdoptionFollowup, status: FollowupStatus): void {
    this.adoptionService.updateFollowupStatus(fol.id, status).subscribe({
      next: () => {
        this.notify.success('Hito de seguimiento actualizado');
        this.loadData();
      },
      error: (err) => this.notify.error(err.error?.message || 'Error al actualizar seguimiento'),
    });
  }

  confirmSterilization(pet: Pet): void {
    this.adoptionService
      .updatePetSterilization(pet.id, true, 'Comprobante de esterilización verificado por rescatista')
      .subscribe({
        next: () => {
          this.notify.success(`¡Esterilización de ${pet.name} confirmada!`);
          this.loadData();
        },
        error: (err) => this.notify.error(err.error?.message || 'No se pudo actualizar esterilización'),
      });
  }

  getAdopterWhatsAppUrl(req: AdoptionRequest): string {
    const phone = req.adopter?.phone || '';
    const text = encodeURIComponent(
      `¡Hola ${req.adopter?.fullName}! Te escribo de ${this.brand.name} respecto a tu solicitud para adoptar a ${req.pet?.name}.`,
    );
    return `https://wa.me/52${phone.replace(/\D/g, '')}?text=${text}`;
  }

  contactAdopterInApp(req: AdoptionRequest): void {
    if (!req.adopter?.id) return;
    this.dmService.openChatWithContext({
      recipientId: req.adopter.id,
      recipientName: req.adopter.fullName,
      contextType: 'ADOPTION_REQUEST',
      contextId: req.pet?.id || req.id,
      contextTitle: `Solicitud de ${req.adopter.fullName} para ${req.pet?.name || 'Mascota'}`,
      contextSubtitle: `${this.stageMeta(req.status).label}`,
      contextImageUrl: req.pet?.photoUrl || req.pet?.photos?.[0],
      contextTargetUrl: `/mis-adopciones`,
      contextWhatsappPhone: req.adopter.phone || undefined,
      prefilledDraft: `¡Hola ${req.adopter.fullName.split(' ')[0]}! Revisé tu solicitud para adoptar a ${req.pet?.name || 'nuestro peludito'}. 💚`,
    });
  }

  contactFollowupAdopterInApp(fol: AdoptionFollowup): void {
    if (!fol.adopter?.id) return;
    const m = this.milestoneLabel(fol.dayMilestone);
    this.dmService.openChatWithContext({
      recipientId: fol.adopter.id,
      recipientName: fol.adopter.fullName,
      contextType: 'FOLLOWUP',
      contextId: fol.id,
      contextTitle: `Seguimiento ${m.label}: ${fol.pet?.name || 'Mascota'}`,
      contextSubtitle: `Hito programado: ${fol.scheduledDate?.slice(0, 10)}`,
      contextImageUrl: fol.pet?.photoUrl || fol.pet?.photos?.[0],
      contextTargetUrl: '/mis-adopciones',
      contextWhatsappPhone: fol.adopter.phone || undefined,
      prefilledDraft: `¡Hola ${fol.adopter.fullName.split(' ')[0]}! Te escribo por el seguimiento de ${m.label} de ${fol.pet?.name || 'tu peludito'} 🐾 ¿Nos compartes una fotito reciente?`,
    });
  }

  getFollowupWhatsAppUrl(fol: AdoptionFollowup): string {
    const phone = fol.adopter?.phone || '';
    const m = this.milestoneLabel(fol.dayMilestone);
    const text = encodeURIComponent(
      `¡Hola! Te escribimos de ${this.brand.name} por el seguimiento de ${m.label} de ${fol.pet?.name || 'tu peludito'}. ¿Nos podrías compartir una fotito reciente para su carnet de bienestar?`,
    );
    return `https://wa.me/52${phone.replace(/\D/g, '')}?text=${text}`;
  }
}
