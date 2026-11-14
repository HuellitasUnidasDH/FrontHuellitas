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
import { PetService } from '../../../core/services/pet.service';
import {
  AdoptionRequest,
  AdoptionFollowup,
  AdoptionRequestStatus,
  AdopterVerification,
  FollowupStatus,
  PublishedPetProgress,
} from '../../../core/models/adoption.model';
import { Pet } from '../../../core/models/pet.model';
import { UserRole } from '../../../core/models/user.model';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';
import {
  extractQuestionnairePills,
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
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25 flex-shrink-0">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {{ isRescuerOrAdmin() ? 'Panel del Rescatista y Evaluación' : 'Gestión de Mis Adopciones' }}
              </h1>
              <p class="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                {{
                  isRescuerOrAdmin()
                    ? 'Protocolo oficial de 4 pasos, niveles de adoptantes, publicaciones propias y seguimientos agrupados por mascota.'
                    : 'Evalúa postulantes con el protocolo oficial de 4 pasos, administra tus publicaciones en adopción y valida seguimientos.'
                }}
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
              <svg class="w-4 h-4" [class.animate-spin]="isRefreshing()" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <span>Actualizar</span>
            </button>

            <a
              routerLink="/adopciones"
              [queryParams]="{ compose: 'EN_ADOPCION' }"
              class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1 transition-colors"
            >
              <span>+</span> Publicar en Adopción
            </a>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
          <button
            (click)="activeTab.set('REQUESTS')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            [ngClass]="activeTab() === 'REQUESTS' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            Solicitudes por Mascota ({{ requests().length }})
          </button>

          <button
            (click)="activeTab.set('PUBLICATIONS')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            [ngClass]="activeTab() === 'PUBLICATIONS' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            Mis Publicaciones ({{ publishedPets().length }})
          </button>

          @if (isRescuerOrAdmin()) {
            <button
              (click)="activeTab.set('VERIFICATIONS')"
              class="px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
              [ngClass]="activeTab() === 'VERIFICATIONS' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'liquid-glass text-slate-600 dark:text-slate-300'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span>Aprobar Niveles 2 y 3</span>
              @if (pendingVerificationsCount() > 0) {
                <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {{ pendingVerificationsCount() }}
                </span>
              }
            </button>
          }

          <button
            (click)="activeTab.set('FOLLOWUPS')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            [ngClass]="activeTab() === 'FOLLOWUPS' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Seguimientos por Mascota ({{ followupGroups().length }})
          </button>

          <span class="ml-auto text-[11px] font-semibold text-slate-400 hidden sm:inline">
            Actualizado: {{ lastUpdatedFormatted() }}
          </span>
        </div>
      </section>

      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-12 text-center space-y-3">
          <div class="w-10 h-10 mx-auto rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-slate-500">Cargando módulo de rescate y adopciones...</p>
        </div>
      } @else {
        <!-- ========================================================== -->
        <!-- TAB 1: SOLICITUDES AGRUPADAS POR MASCOTA (MASTER VIEW) -->
        <!-- ========================================================== -->
        @if (activeTab() === 'REQUESTS') {
          <section class="space-y-5">
            <!-- Filtros y Búsqueda -->
            <div class="liquid-glass rounded-2xl p-4 space-y-3">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
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
                  placeholder="Buscar por nombre de mascota o candidato..."
                  class="w-full md:w-72 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              @if (isRescuerOrAdmin()) {
                <div class="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                  <span class="font-bold text-slate-500 uppercase tracking-wider mr-1">Origen:</span>
                  <button
                    type="button"
                    (click)="requestScope.set('ALL')"
                    class="px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors"
                    [ngClass]="requestScope() === 'ALL' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
                  >
                    Todas las adopciones
                  </button>
                  <button
                    type="button"
                    (click)="requestScope.set('MINE')"
                    class="px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors"
                    [ngClass]="requestScope() === 'MINE' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
                  >
                    Mis publicaciones
                  </button>
                  <button
                    type="button"
                    (click)="requestScope.set('COMMUNITY')"
                    class="px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors"
                    [ngClass]="requestScope() === 'COMMUNITY' ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/35' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
                  >
                    Apoyo comunitario (ciudadanos)
                  </button>
                </div>
              }
            </div>

            @if (filteredPetRequestGroups().length === 0) {
              <div class="liquid-glass rounded-3xl p-10 text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700">
                <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-200/70 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                  </svg>
                </div>
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
                          @if (isRescuerOrAdmin()) {
                            @if (group.pet.ownerId === authService.currentUser()?.id) {
                              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                Tu publicación
                              </span>
                            } @else {
                              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                                Apoyo comunitario{{ group.pet.owner?.fullName ? ' · ' + group.pet.owner!.fullName : '' }}
                              </span>
                            }
                          }
                          @if (group.approvedReq) {
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                              Adoptada
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
                      @let qPills = getQuestionnairePills(req);
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
                                {{ req.adopter?.colonia?.name || 'Dolores Hidalgo' }} • {{ req.createdAt | date:'dd/MM/yy' }}
                              </span>
                            </div>
                          </div>

                          <span
                            class="px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 flex-shrink-0"
                            [ngClass]="badge.badgeClass"
                            [title]="badge.subtitle"
                          >
                            <span>{{ badge.icon }}</span>
                            <span>Nivel {{ badge.level }}</span>
                          </span>
                        </div>

                        <!-- Resumen comparativo del cuestionario -->
                        @if (qPills.length > 0) {
                          <div class="flex flex-wrap gap-1.5">
                            @for (pill of qPills; track pill.label) {
                              <span
                                class="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                                [ngClass]="
                                  pill.tone === 'emerald'
                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                                    : pill.tone === 'amber'
                                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-300'
                                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                "
                              >
                                {{ pill.label }}: {{ pill.value }}
                              </span>
                            }
                          </div>
                        }

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
                            Evaluar Expediente →
                          </a>

                          <button
                            type="button"
                            (click)="contactAdopterInApp(req)"
                            class="py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold text-xs cursor-pointer"
                            title="Abrir Chat Directo"
                          >
                            Chat
                          </button>

                          @if (req.adopter?.phone) {
                            <a
                              [href]="getAdopterWhatsAppUrl(req)"
                              target="_blank"
                              rel="noopener"
                              class="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs"
                              title="WhatsApp del Postulante"
                            >
                              WhatsApp
                            </a>
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

        <!-- ========================================================== -->
        <!-- TAB: MIS PUBLICACIONES EN ADOPCIÓN (CRUD / PAUSA) -->
        <!-- ========================================================== -->
        @if (activeTab() === 'PUBLICATIONS') {
          <section class="space-y-4">
            @if (publishedPets().length === 0) {
              <div class="liquid-glass rounded-3xl p-10 text-center space-y-3 border border-dashed border-slate-300 dark:border-slate-700">
                <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </div>
                <h3 class="font-bold text-slate-900 dark:text-white text-base">Aún no tienes mascotas publicadas en adopción</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto">
                  Cuando publiques una mascota en adopción podrás editar sus datos, pausar o reactivar su visibilidad en el catálogo y monitorear tus postulantes aquí mismo.
                </p>
                <a
                  routerLink="/adopciones"
                  [queryParams]="{ compose: 'EN_ADOPCION' }"
                  class="inline-block px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:brightness-105 transition-all"
                >
                  + Publicar en Adopción
                </a>
              </div>
            } @else {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (item of publishedPets(); track item.pet.id) {
                  <article class="liquid-glass rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-lg flex flex-col justify-between gap-4">
                    <div class="space-y-3">
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-3.5 min-w-0">
                          <img
                            [src]="item.pet.photoUrl || item.pet.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80'"
                            [alt]="item.pet.name"
                            class="w-16 h-16 rounded-2xl object-cover shadow-sm flex-shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <div class="min-w-0">
                            <h2 class="text-lg font-black text-slate-900 dark:text-white truncate">{{ item.pet.name }}</h2>
                            <span class="text-xs text-slate-500 block truncate">
                              {{ item.pet.species }} • {{ item.pet.breed || 'Mestizo' }}
                            </span>
                            <span class="mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border" [ngClass]="publicationStatusBadge(item.pet.status)">
                              {{ publicationStatusLabel(item.pet.status) }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs">
                        <div class="flex items-center justify-between font-bold">
                          <span class="text-slate-700 dark:text-slate-200">{{ item.stageLabel }}</span>
                          <span class="text-emerald-600 dark:text-emerald-400 font-black">{{ item.progressPercent }}%</span>
                        </div>
                        <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            [style.width.%]="item.progressPercent"
                          ></div>
                        </div>
                        <div class="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <span>Postulaciones totales: <strong>{{ item.totalRequests }}</strong></span>
                          <span>En curso: <strong>{{ item.activeRequests }}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                      <a
                        [routerLink]="['/adopciones', item.pet.id]"
                        class="px-3 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold hover:brightness-105 transition-all"
                      >
                        Ver Ficha
                      </a>
                      <a
                        [routerLink]="['/pets/edit', item.pet.id]"
                        class="px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-700 dark:text-sky-300 font-bold transition-all"
                      >
                        Editar
                      </a>
                      <button
                        type="button"
                        (click)="copyPetLink(item.pet)"
                        class="px-3 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold cursor-pointer hover:brightness-105 transition-all"
                      >
                        Copiar enlace
                      </button>

                      @if (item.totalRequests > 0) {
                        <button
                          type="button"
                          (click)="viewPetRequests(item.pet.name)"
                          class="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold cursor-pointer transition-all"
                        >
                          Ver solicitudes
                        </button>
                      }

                      @if (item.pet.status === 'DISPONIBLE' || item.pet.status === 'EN_PROCESO') {
                        <button
                          type="button"
                          (click)="togglePublicationStatus(item, true)"
                          [disabled]="togglingPublicationId() === item.pet.id"
                          class="ml-auto px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-800 dark:text-amber-300 font-bold cursor-pointer disabled:opacity-50 transition-all"
                        >
                          {{ togglingPublicationId() === item.pet.id ? 'Actualizando...' : 'Pausar publicación' }}
                        </button>
                      } @else if (item.pet.status === 'NO_EN_ADOPCION') {
                        <button
                          type="button"
                          (click)="togglePublicationStatus(item, false)"
                          [disabled]="togglingPublicationId() === item.pet.id"
                          class="ml-auto px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black cursor-pointer disabled:opacity-50 transition-all"
                        >
                          {{ togglingPublicationId() === item.pet.id ? 'Actualizando...' : 'Reactivar en adopción' }}
                        </button>
                      }
                    </div>
                  </article>
                }
              </div>
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
                <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <h3 class="font-bold text-slate-900 dark:text-white text-base">No hay expedientes de verificación registrados aún</h3>
                <p class="text-xs text-slate-500">Cuando un usuario envíe su Cuestionario Socioambiental (Nivel 2) o Carta Compromiso (Nivel 3) aparecerá aquí.</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (ver of verifications(); track ver.id) {
                  <article class="liquid-glass rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-700/70 shadow-lg space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white font-black flex items-center justify-center text-base shadow-md flex-shrink-0">
                          {{ (ver.user?.fullName || 'U').charAt(0).toUpperCase() }}
                        </div>
                        <div class="min-w-0">
                          <h3 class="font-black text-slate-900 dark:text-white text-base truncate">
                            {{ ver.user?.fullName || 'Usuario' }}
                          </h3>
                          <span class="text-xs text-slate-500 break-all block">
                            {{ ver.user?.email }} • Tel. {{ ver.user?.phone || 'Sin teléfono' }}
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
                          Nivel 2: {{ ver.isLevel2Completed ? 'Aprobado' : ver.level2Status === 'RECHAZADO' ? 'Con Observación' : ver.level2Status || 'Pendiente' }}
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
                          Nivel 3: {{ ver.isLevel3Completed ? 'Aprobado' : ver.level3Status === 'RECHAZADO' ? 'Con Observación' : ver.level3Status || 'No solicitado' }}
                        </span>
                      </div>
                    </div>

                    @if (ver.reviewNotes && (ver.level2Status === 'RECHAZADO' || ver.level3Status === 'RECHAZADO')) {
                      <div class="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-xs flex items-start gap-2.5">
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
                          Carta Compromiso de Nivel 3 firmada digitalmente por el solicitante.
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
                          Aprobar Nivel 2
                        </button>
                        <button
                          type="button"
                          (click)="reviewAdopterLevel(ver, 2, false)"
                          class="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer"
                        >
                          Rechazar Nivel 2
                        </button>
                      } @else if (ver.isLevel2Completed && !ver.isLevel3Completed && (ver.level3Status === 'PENDIENTE' || ver.signedCommitmentLetter)) {
                        <button
                          type="button"
                          (click)="reviewAdopterLevel(ver, 3, true)"
                          class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                        >
                          Aprobar Nivel 3 (Adoptante Verificado)
                        </button>
                        <button
                          type="button"
                          (click)="reviewAdopterLevel(ver, 3, false)"
                          class="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer"
                        >
                          Rechazar Nivel 3
                        </button>
                      } @else {
                        <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Expediente verificado por completo
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
                <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
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
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <h2 class="text-xl font-black text-slate-900 dark:text-white">{{ group.pet.name }}</h2>
                          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black" [ngClass]="badge.badgeClass">
                            {{ badge.icon }} · Nivel {{ badge.level }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          Adoptante: <strong>{{ group.adopter?.fullName || 'Adoptante' }}</strong> •
                          Progreso: <strong class="text-emerald-600 dark:text-emerald-400">{{ group.completedCount }} de {{ group.totalCount }} hitos</strong>
                        </p>
                        <!-- Barra de progreso -->
                        <div class="w-full max-w-xs h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-1.5 overflow-hidden">
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
                          Chat
                        </button>
                        <a
                          [href]="firstFol.prefilledWhatsappUrl || getFollowupWhatsAppUrl(firstFol)"
                          target="_blank"
                          rel="noopener"
                          class="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5"
                        >
                          WhatsApp
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
                      <div class="text-amber-900 dark:text-amber-200">
                        <strong class="font-black block">Compromiso de Esterilización Pendiente (5 - 6 meses de edad)</strong>
                        <span>{{ group.pet.name }} fue entregada con compromiso obligatorio de esterilización. Confirma aquí cuando el adoptante entregue su comprobante médico.</span>
                      </div>
                      <button
                        type="button"
                        (click)="confirmSterilization(group.pet)"
                        class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex-shrink-0 cursor-pointer shadow-sm"
                      >
                        Confirmar Esterilización
                      </button>
                    </div>
                  } @else {
                    <div class="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
                      Mascota esterilizada — compromiso cumplido
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
                              Seguimiento {{ mLabel.label }} ({{ mLabel.badge }})
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
                                {{ fol.proofNotes }}
                              </p>
                            }
                          </div>
                        }

                        <!-- Acciones del Rescatista por Hito -->
                        <div class="flex flex-wrap items-center gap-2 pt-1">
                          <label class="flex-1 py-2 px-3 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold cursor-pointer text-center transition-colors">
                            @if (uploadingFollowupId() === fol.id) {
                              Subiendo foto...
                            } @else {
                              {{ fol.proofPhotoUrl ? 'Cambiar Foto' : 'Subir / Tomar Foto' }}
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
                              Validar
                            </button>
                          }

                          @if (fol.status !== 'ALERTA_REABANDONO') {
                            <button
                              type="button"
                              (click)="setFollowupStatus(fol, 'ALERTA_REABANDONO')"
                              class="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer"
                              title="Reportar incidencia o alerta de seguimiento"
                            >
                              Alerta
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
  private petService = inject(PetService);

  activeTab = signal<'REQUESTS' | 'PUBLICATIONS' | 'VERIFICATIONS' | 'FOLLOWUPS'>('REQUESTS');
  requestFilter = signal<'ALL' | 'ACTIVE' | 'READY' | 'CLOSED'>('ALL');
  requestScope = signal<'ALL' | 'MINE' | 'COMMUNITY'>('ALL');
  searchTerm = '';

  requests = signal<AdoptionRequest[]>([]);
  publishedPets = signal<PublishedPetProgress[]>([]);
  verifications = signal<AdopterVerification[]>([]);
  followups = signal<AdoptionFollowup[]>([]);
  isLoading = signal<boolean>(true);
  isRefreshing = signal<boolean>(false);
  uploadingFollowupId = signal<string | null>(null);
  togglingPublicationId = signal<string | null>(null);
  lastUpdated = signal<Date>(new Date());

  isRescuerOrAdmin = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === UserRole.ADMIN || role === UserRole.RESCATISTA_VERIFICADO || role === UserRole.ALBERGUE;
  });

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
    const scope = this.isRescuerOrAdmin() ? this.requestScope() : 'ALL';
    const myId = this.authService.currentUser()?.id;

    return this.petRequestGroups()
      .filter((grp) => {
        if (scope === 'MINE' && myId) return grp.pet.ownerId === myId;
        if (scope === 'COMMUNITY' && myId) return grp.pet.ownerId !== myId;
        return true;
      })
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
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'verifications' && this.isRescuerOrAdmin()) {
      this.activeTab.set('VERIFICATIONS');
    } else if (tabParam === 'followups') {
      this.activeTab.set('FOLLOWUPS');
    } else if (tabParam === 'publications') {
      this.activeTab.set('PUBLICATIONS');
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
    this.adoptionService.getMyPublishedProgress().subscribe({
      next: (pub) => this.publishedPets.set(pub || []),
      error: () => {},
    });
    if (this.isRescuerOrAdmin()) {
      this.adoptionService.getVerificationsForReview().subscribe({
        next: (vers) => this.verifications.set(vers || []),
        error: () => {},
      });
    }
  }

  refreshData(): void {
    this.isRefreshing.set(true);
    this.adoptionService.getMyPublishedProgress().subscribe({
      next: (pub) => this.publishedPets.set(pub || []),
      error: () => {},
    });
    this.adoptionService.getPublisherInbox().subscribe({
      next: (reqs) => {
        this.requests.set(reqs || []);
        if (this.isRescuerOrAdmin()) {
          this.adoptionService.getVerificationsForReview().subscribe({
            next: (vers) => this.verifications.set(vers || []),
            error: () => {},
          });
        }
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
    this.adoptionService.getMyPublishedProgress().subscribe({
      next: (pub) => this.publishedPets.set(pub || []),
      error: () => {},
    });
    this.adoptionService.getPublisherInbox().subscribe({
      next: (reqs) => {
        this.requests.set(reqs || []);
        if (this.isRescuerOrAdmin()) {
          this.adoptionService.getVerificationsForReview().subscribe({
            next: (vers) => this.verifications.set(vers || []),
            error: () => {},
          });
        }
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

  getQuestionnairePills(req: AdoptionRequest) {
    return extractQuestionnairePills(req);
  }

  publicationStatusBadge(status?: string): string {
    switch (status) {
      case 'DISPONIBLE':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'EN_PROCESO':
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
      case 'NO_EN_ADOPCION':
        return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30';
      default:
        return 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30';
    }
  }

  publicationStatusLabel(status?: string): string {
    switch (status) {
      case 'DISPONIBLE':
        return 'Disponible en catálogo';
      case 'EN_PROCESO':
        return 'En evaluación activa';
      case 'NO_EN_ADOPCION':
        return 'Publicación pausada';
      case 'ADOPTADA':
      case 'EN_SEGUIMIENTO':
        return 'Adoptada';
      default:
        return status || 'Activa';
    }
  }

  async togglePublicationStatus(item: PublishedPetProgress, pause: boolean): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: pause ? 'Pausar publicación en adopción' : 'Reactivar publicación en adopción',
      message: pause
        ? `¿Deseas ocultar temporalmente a ${item.pet.name} del catálogo público de adopciones?`
        : `¿Deseas volver a publicar a ${item.pet.name} como disponible en adopción?`,
      submessage: pause && item.activeRequests > 0
        ? `Esta mascota tiene ${item.activeRequests} solicitud(es) activa(s) que serán cerradas automáticamente al pausar.`
        : undefined,
      confirmText: pause ? 'Sí, pausar publicación' : 'Sí, reactivar en adopción',
      cancelText: 'Cancelar',
      type: pause ? 'warning' : 'success',
    });

    if (!confirmed) return;

    this.togglingPublicationId.set(item.pet.id);
    this.petService
      .update(item.pet.id, { status: pause ? 'NO_EN_ADOPCION' : 'DISPONIBLE' })
      .subscribe({
        next: () => {
          this.togglingPublicationId.set(null);
          this.notify.success(
            pause ? 'Publicación pausada' : 'Publicación reactivada',
            pause
              ? `${item.pet.name} ya no aparece en el catálogo público.`
              : `${item.pet.name} vuelve a mostrarse en el catálogo de adopciones.`,
          );
          this.loadData();
        },
        error: (err) => {
          this.togglingPublicationId.set(null);
          this.notify.error(err.error?.message || 'No se pudo actualizar el estado de la publicación');
        },
      });
  }

  copyPetLink(pet: Pet): void {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/adopciones/${pet.id}`
        : `/adopciones/${pet.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => this.notify.success('Enlace copiado', `Comparte la ficha de ${pet.name}.`),
        () => this.notify.warning('No se pudo copiar automáticamente el enlace.'),
      );
    }
  }

  viewPetRequests(petName: string): void {
    this.searchTerm = petName;
    this.requestFilter.set('ALL');
    this.activeTab.set('REQUESTS');
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
        return 'Validado';
      case 'FOTO_RECIBIDA':
        return 'Evidencia Recibida';
      case 'ALERTA_REABANDONO':
        return 'Alerta Activa';
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
