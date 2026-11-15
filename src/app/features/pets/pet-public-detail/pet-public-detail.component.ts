import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../../core/services/pet.service';
import { AdoptionService } from '../../../core/services/adoption.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { ScrollLockService } from '../../../core/services/scroll-lock.service';
import { NavigationHistoryService } from '../../../core/services/navigation-history.service';
import { Pet } from '../../../core/models/pet.model';
import { PublicationComment } from '../../../core/models/lost-pet.model';
import { UserRole } from '../../../core/models/user.model';
import { AdoptionRequest, CreateAdoptionRequestPayload } from '../../../core/models/adoption.model';
import { ConfirmService } from '../../../core/services/confirm.service';
import { getStageMeta } from '../../adoptions/shared/adoption-helpers.util';
import { AdoptionRequestFormComponent } from '../../adoptions/shared/adoption-request-form.component';
import { ReportContentModalComponent } from '../../../shared/components/report-content-modal/report-content-modal.component';
import {
  PosterQrModalComponent,
  PosterQrPayload,
} from '../../../shared/components/poster-qr-modal/poster-qr-modal.component';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';
import {
  buildFacebookShareUrl,
  buildWhatsAppUrl,
  formatExactDateTime,
  formatPetEnergyLabel,
  formatPetGenderLabel,
  formatPetSizeLabel,
  openExternalSafe,
} from '../../../core/utils/app-helpers.util';

@Component({
  selector: 'app-pet-public-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterModule,
    FormsModule,
    AdoptionRequestFormComponent,
    ReportContentModalComponent,
    PosterQrModalComponent,
  ],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <!-- Navigation & Back Link -->
      <div class="flex items-center justify-between">
        <button
          type="button"
          (click)="goBack()"
          class="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          {{ navHistory.getBackLabel('Volver a Adopciones') }}
        </button>

        <!-- Share Actions & Report -->
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            (click)="openPosterModal()"
            class="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Crear cartel imprimible con Código QR"
          >
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
              <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
              <path d="M21 21v.01" />
              <path d="M12 7v3a2 2 0 0 1-2 2H7" />
              <path d="M3 12h.01" />
              <path d="M12 3h.01" />
            </svg>
            Cartel QR
          </button>
          <button
            (click)="shareToWhatsApp()"
            class="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Compartir
          </button>
          <button
            (click)="shareToFacebook()"
            class="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            Facebook
          </button>
          @if (pet() && !isOwnPet()) {
            <button
              type="button"
              (click)="openReportModal()"
              class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Reportar esta publicación ante moderación"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              <span>Reportar</span>
            </button>
          }
        </div>
      </div>

      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-16 text-center space-y-4">
          <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400">
            Cargando expediente de adopción...
          </p>
        </div>
      } @else if (pet()) {
        <div class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-8 border border-emerald-500/20">

          <!-- 1. Header & Main Photo Gallery -->
          <div class="space-y-4">
            <!-- Active Featured Image with Badge Overlays -->
            <div class="relative w-full h-80 sm:h-[26rem] rounded-2xl overflow-hidden bg-slate-950/30 shadow-lg">
              <img
                [src]="activePhoto() || pet()!.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80'"
                [alt]="pet()!.name"
                class="w-full h-full object-cover transition-all duration-300"
              />

              <!-- Top Floating Pills -->
              <div class="absolute top-4 left-4 flex flex-wrap gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500 text-slate-950 shadow-md inline-flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                  En Adopción
                </span>
                @if (formatGender(pet()!.gender); as genderLabel) {
                  <span
                    class="px-3 py-1 rounded-full text-xs font-bold uppercase shadow-md border"
                    [ngClass]="pet()!.gender === 'FEMALE' ? 'bg-pink-500/90 text-white border-pink-400' : pet()!.gender === 'MALE' ? 'bg-sky-500/90 text-white border-sky-400' : 'bg-slate-800/90 text-white border-slate-600'"
                  >
                    {{ genderLabel }}
                  </span>
                }
              </div>

              <!-- Location Tag -->
              <div class="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-xl bg-slate-950/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {{ pet()!.colonia?.name || 'Dolores Hidalgo' }}, Guanajuato
              </div>
            </div>

            <!-- Thumbnail Gallery Strip -->
            @if (pet()!.photos && pet()!.photos!.length > 1) {
              <div class="flex items-center gap-2 overflow-x-auto pb-1">
                @for (photo of pet()!.photos; track $index) {
                  <button
                    (click)="setActivePhoto(photo)"
                    class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0"
                    [ngClass]="activePhoto() === photo ? 'border-emerald-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'"
                  >
                    <img [src]="photo" alt="Foto adicional" class="w-full h-full object-cover" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- 2. Pet Title & Quick Identity -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
            <div>
              <div class="flex items-center gap-3 flex-wrap">
                <h1 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {{ pet()!.name }}
                </h1>
                <span class="px-3 py-1 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {{ pet()!.species }}
                </span>
              </div>
              @if (getPetIdentitySummary(pet()!); as summaryText) {
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                  {{ summaryText }}
                </p>
              }
            </div>

            <!-- Floating CTA: Quiero Adoptar / Estado -->
            @if (isOwnPet()) {
              <a
                [routerLink]="['/panel-rescatista']"
                [queryParams]="{ tab: 'publications' }"
                class="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-700 dark:text-sky-300 font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20V10" />
                  <path d="M18 20V4" />
                  <path d="M6 20v-4" />
                </svg>
                <span>Gestionar Publicación de {{ pet()!.name }}</span>
              </a>
            } @else if (existingApplication(); as existing) {
              <a
                routerLink="/mis-adopciones"
                class="w-full sm:w-auto px-5 py-3 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-800 dark:text-sky-300 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Ya te postulaste · {{ getStageMeta(existing.status).label }}</span>
              </a>
            } @else if (!isPetAdoptable()) {
              <span class="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 font-black text-xs sm:text-sm text-center">
                {{ pet()!.status === 'ADOPTADA' || pet()!.status === 'EN_SEGUIMIENTO' ? 'Esta mascota ya encontró hogar' : 'No disponible en adopción' }}
              </span>
            } @else {
              <button
                (click)="openAdoptionModal()"
                class="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                <span>Quiero Adoptar a {{ pet()!.name }}</span>
              </button>
            }
          </div>

          <!-- 3. Medical & Health Passport (Semáforo de Salud) -->
          <div class="space-y-3">
            <h2 class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Expediente Clínico y de Salud
            </h2>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <!-- Esterilización -->
              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Esterilización</span>
                <span
                  class="text-xs font-black flex items-center gap-1.5"
                  [ngClass]="pet()!.isSterilized ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'"
                >
                  @if (pet()!.isSterilized) {
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  } @else {
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  }
                  <span>{{ pet()!.isSterilized ? 'Esterilizado(a)' : 'Pendiente / Compromiso' }}</span>
                </span>
              </div>

              <!-- Desparasitación -->
              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Desparasitación</span>
                <span
                  class="text-xs font-black flex items-center gap-1.5"
                  [ngClass]="pet()!.isDewormed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'"
                >
                  @if (pet()!.isDewormed) {
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  }
                  <span>{{ pet()!.isDewormed ? 'Al corriente' : 'No registrada' }}</span>
                </span>
              </div>

              <!-- Peso Aproximado -->
              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Peso Actual</span>
                <span class="text-xs font-black text-slate-800 dark:text-white">
                  {{ pet()!.weightKg ? pet()!.weightKg + ' kg' : 'No especificado' }}
                </span>
              </div>

              <!-- Microchip -->
              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Identificación</span>
                <span class="text-xs font-black text-slate-800 dark:text-white inline-flex items-center gap-1.5">
                  @if (pet()!.microchipNumber) {
                    <svg class="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <rect x="9" y="9" width="6" height="6" />
                      <path d="M15 2v2M15 20v2M9 2v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2" />
                    </svg>
                    <span>Chip: {{ pet()!.microchipNumber }}</span>
                  } @else {
                    <span>No registrado</span>
                  }
                </span>
              </div>
            </div>

            <!-- Listado de Vacunas -->
            @if (pet()!.vaccinesList && pet()!.vaccinesList!.length > 0) {
              <div class="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
                <span class="font-bold text-emerald-700 dark:text-emerald-400 mb-2 inline-flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m18 2 4 4" />
                    <path d="m17 7 3-3" />
                    <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
                    <path d="m9 11 4 4" />
                    <path d="m5 19-3 3" />
                  </svg>
                  <span>Vacunas Registradas:</span>
                </span>
                <div class="flex flex-wrap gap-2">
                  @for (v of pet()!.vaccinesList; track $index) {
                    <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                      • {{ v }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>

          <!-- 4. Behavioral & Temperament Radar -->
          <div class="space-y-3">
            <h2 class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <span>Temperamento y Convivencia</span>
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Con Niños</span>
                  @if (pet()!.goodWithKids === true) {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      Apto
                    </span>
                  } @else if (pet()!.goodWithKids === false) {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                      No recomendado
                    </span>
                  } @else {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      No especificado
                    </span>
                  }
                </div>
                <p class="text-[11px] text-slate-500 mt-1">
                  @if (pet()!.goodWithKids === true) {
                    El responsable indicó buena convivencia con niños.
                  } @else if (pet()!.goodWithKids === false) {
                    El responsable indicó no recomendado para hogares con niños pequeños.
                  } @else {
                    Pregunta al responsable sobre su convivencia con niños.
                  }
                </p>
              </div>

              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Con Otras Mascotas</span>
                  @if (pet()!.goodWithOtherPets === true) {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      Sociable
                    </span>
                  } @else if (pet()!.goodWithOtherPets === false) {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                      No sociable
                    </span>
                  } @else {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      No especificado
                    </span>
                  }
                </div>
                <p class="text-[11px] text-slate-500 mt-1">
                  @if (pet()!.goodWithOtherPets === true) {
                    El responsable indicó buena convivencia con otras mascotas.
                  } @else if (pet()!.goodWithOtherPets === false) {
                    El responsable indicó preferencia por hogar sin otras mascotas.
                  } @else {
                    Consulta con el responsable sobre su convivencia con otros animales.
                  }
                </p>
              </div>

              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Nivel de Energía</span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    [ngClass]="pet()!.energyLevel ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
                  >
                    {{ formatEnergy(pet()!.energyLevel) || 'No especificado' }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">
                  @if (pet()!.energyLevel === 'ALTO') {
                    Requiere paseos activos y juegos diarios.
                  } @else if (pet()!.energyLevel === 'MEDIO') {
                    Energía equilibrada para paseos y descanso en casa.
                  } @else if (pet()!.energyLevel === 'BAJO') {
                    Rutina tranquila y paseos suaves.
                  } @else {
                    Pregunta al responsable sobre su nivel de actividad diaria.
                  }
                </p>
              </div>
            </div>

            @if (pet()!.temperamentTags && pet()!.temperamentTags!.length > 0) {
              <div class="flex flex-wrap gap-1.5 pt-1">
                @for (tag of pet()!.temperamentTags; track tag) {
                  <span class="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
                    {{ tag }}
                  </span>
                }
              </div>
            }
          </div>

          <!-- 5. Rescue Story & Physical Marks -->
          <div class="space-y-3">
            <h2 class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              Historia de Rescate y Señas Particulares
            </h2>
            <div class="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line space-y-2">
              @if (pet()!.rescueStory) {
                <p>{{ pet()!.rescueStory }}</p>
              } @else if (!pet()!.color && !pet()!.specialMarks) {
                <p class="text-slate-500 dark:text-slate-400 italic text-xs">
                  El responsable aún no ha agregado una historia de rescate o señas adicionales.
                </p>
              }
              @if (pet()!.color || pet()!.specialMarks) {
                <div class="pt-2 border-t border-slate-200/70 dark:border-slate-800 text-xs flex flex-wrap gap-4">
                  @if (pet()!.color) {
                    <span class="inline-flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                      </svg>
                      <strong>Color:</strong> {{ pet()!.color }}
                    </span>
                  }
                  @if (pet()!.specialMarks) {
                    <span class="inline-flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      <strong>Señas particulares:</strong> {{ pet()!.specialMarks }}
                    </span>
                  }
                </div>
              }
            </div>
          </div>

          <!-- 6. Rescuer Contact & Trust Badge -->
          <div class="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3 text-center sm:text-left">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  Resguardo Responsable
                </span>
                <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ pet()!.owner?.fullName || 'Red de Rescatistas Huellitas DH' }}
                </h4>
                <p class="text-[11px] text-slate-500 flex items-center gap-1">
                  {{ pet()!.colonia?.name || 'Dolores Hidalgo' }} • Adopción con Carta Compromiso
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              @if (canMessageOwner() && authService.isAuthenticated()) {
                <button
                  type="button"
                  (click)="contactOwnerInApp()"
                  class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 shadow-md hover:from-teal-400 hover:to-emerald-300 cursor-pointer"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  Mensaje Directo
                </button>
                @if (getAuthorizedWhatsAppUrl(); as waUrl) {
                  <a
                    [href]="waUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                    title="WhatsApp habilitado tras avanzar a entrevista"
                  >
                    WhatsApp
                  </a>
                }
              }
              @if (isOwnPet()) {
                <a
                  [routerLink]="['/panel-rescatista']"
                  [queryParams]="{ tab: 'publications' }"
                  class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Gestionar
                </a>
              } @else if (existingApplication(); as existing) {
                <a
                  routerLink="/mis-adopciones"
                  class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Ya te postulaste
                </a>
              } @else if (isPetAdoptable()) {
                <button
                  (click)="openAdoptionModal()"
                  class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  Postularme
                </button>
              } @else {
                <span class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold text-center">
                  {{ pet()!.status === 'ADOPTADA' || pet()!.status === 'EN_SEGUIMIENTO' ? 'Adoptada' : 'No disponible' }}
                </span>
              }
            </div>
          </div>

          <!-- 7. Preguntas y Comentarios sobre Adopción -->
          <div class="space-y-4 pt-4 border-t border-slate-200/70 dark:border-slate-800">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
                <span>Preguntas y Comentarios ({{ comments().length }})</span>
              </h2>
            </div>

            @if (isLoadingComments()) {
              <div class="p-4 text-xs text-slate-500 dark:text-slate-400">
                Cargando comentarios...
              </div>
            } @else {
              @if (comments().length === 0) {
                <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  Aún no hay preguntas públicas sobre {{ pet()!.name }}. Si tienes alguna duda antes de postularte, escríbela aquí.
                </div>
              } @else {
                <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  @for (c of comments(); track c.id) {
                    <div class="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1 space-y-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-xs font-bold text-slate-900 dark:text-white">
                            {{ c.author?.fullName || 'Usuario de Huellitas' }}
                          </span>
                          <span class="text-[10px] text-slate-400">
                            {{ formatCommentDate(c.createdAt) }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words">
                          {{ c.content }}
                        </p>
                      </div>
                      @if (canDeleteComment(c)) {
                        <button
                          type="button"
                          (click)="deleteComment(c)"
                          title="Eliminar comentario"
                          class="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/25 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        >
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      }
                    </div>
                  }
                </div>
              }
            }

            @if (authService.isAuthenticated()) {
              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  [ngModel]="newCommentText()"
                  (ngModelChange)="newCommentText.set($event)"
                  (keyup.enter)="submitComment()"
                  [disabled]="isSubmittingComment()"
                  maxlength="500"
                  placeholder="Haz una pregunta sobre cuidados, convivencia o entrega..."
                  class="flex-1 px-4 py-2.5 rounded-xl liquid-glass-input text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  (click)="submitComment()"
                  [disabled]="isSubmittingComment() || newCommentText().trim().length < 2"
                  class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black transition-all cursor-pointer shrink-0"
                >
                  {{ isSubmittingComment() ? 'Enviando...' : 'Publicar pregunta' }}
                </button>
              </div>
            } @else {
              <div class="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs">
                <span class="text-slate-600 dark:text-slate-300">
                  Inicia sesión para hacer preguntas o dejar comentarios en esta ficha.
                </span>
                <a
                  routerLink="/auth/login"
                  [queryParams]="{ returnUrl: '/adopciones/' + pet()!.id }"
                  class="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black whitespace-nowrap"
                >
                  Iniciar sesión
                </a>
              </div>
            }
          </div>
        </div>
      }

      <!-- ITEM #2 ADOPTION MODAL (REUSED FOR DETAIL VIEW) -->
      @if (showAdoptionModal()) {
        <div
          class="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fadeIn overflow-y-auto overscroll-contain"
          (click)="closeAdoptionModal()"
        >
          <div
            class="liquid-glass rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative border border-emerald-500/30 my-auto max-h-[88dvh] overflow-y-auto overscroll-contain space-y-5"
            (click)="$event.stopPropagation()"
          >
            <button
              (click)="closeAdoptionModal()"
              class="sticky top-0 ml-auto -mt-1 w-8 h-8 rounded-full bg-slate-200/90 dark:bg-slate-800/90 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer z-10 shadow-sm"
              title="Cerrar ventana"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            @if (adoptionSubmitted()) {
              <div class="text-center py-6 space-y-4 animate-scaleUp">
                <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h4 class="text-lg font-black text-slate-900 dark:text-white">
                  Solicitud enviada para {{ pet()!.name }}
                </h4>
                <p class="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                  Tu postulación está registrada en el protocolo oficial. Escribe un mensaje directo al responsable en Huellitas o revisa el avance en tu panel.
                </p>
                <div class="space-y-2">
                  <button
                    type="button"
                    (click)="contactOwnerInAppPostAdoption()"
                    class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Enviar Mensaje Directo en Huellitas
                  </button>
                  <a
                    routerLink="/mis-adopciones"
                    (click)="closeAdoptionModal()"
                    class="w-full py-2.5 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Seguir Progreso en Mis Adopciones →
                  </a>
                </div>
              </div>
            } @else {
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      Postular para Adoptar a {{ pet()!.name }}
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Adopción responsable en {{ brand.city }}</p>
                  </div>
                </div>

                @if (!authService.isAuthenticated()) {
                  <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3 text-xs">
                    <p class="text-amber-900 dark:text-amber-200 leading-relaxed">
                      Para proteger el bienestar de {{ pet()!.name }} y la privacidad del responsable, inicia sesión o crea una cuenta para enviar tu postulación formal y dar seguimiento en tiempo real.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-2">
                      <a
                        routerLink="/auth/login"
                        [queryParams]="{ returnUrl: '/adopciones/' + pet()!.id }"
                        (click)="closeAdoptionModal()"
                        class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-center font-black shadow-sm"
                      >
                        Iniciar sesión
                      </a>
                      <a
                        routerLink="/auth/register"
                        [queryParams]="{ returnUrl: '/adopciones/' + pet()!.id }"
                        (click)="closeAdoptionModal()"
                        class="flex-1 py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-center font-bold"
                      >
                        Registrarme
                      </a>
                    </div>
                  </div>
                } @else {
                  <app-adoption-request-form
                    [pet]="pet()!"
                    [isSubmitting]="isSending()"
                    (submitted)="sendAdoption($event)"
                    (cancelled)="closeAdoptionModal()"
                  />
                }
              </div>
            }
          </div>
        </div>
      }

      @if (showReportModal() && pet()) {
        <app-report-content-modal
          [targetType]="'PET_POST'"
          [targetId]="pet()!.id"
          [targetTitle]="pet()!.name + ' (' + pet()!.species + ')'"
          [targetSubtitle]="(pet()!.colonia?.name || 'Dolores Hidalgo') + ' • Publicación de adopción'"
          (closed)="closeReportModal()"
        />
      }

      @if (showPosterModal() && getPetPosterPayload(); as posterPayload) {
        <app-poster-qr-modal
          [data]="posterPayload"
          (closed)="closePosterModal()"
        />
      }

    </div>
  `,
})
export class PetPublicDetailComponent implements OnInit, OnDestroy {
  brand = BRAND_CONFIG;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private petService = inject(PetService);
  private adoptionService = inject(AdoptionService);
  public authService = inject(AuthService);
  private notify = inject(NotificationService);
  private dmService = inject(DirectMessageService);
  private scrollLock = inject(ScrollLockService);
  private confirmService = inject(ConfirmService);
  navHistory = inject(NavigationHistoryService);

  pet = signal<Pet | null>(null);
  activePhoto = signal<string>('');
  isLoading = signal<boolean>(true);
  comments = signal<PublicationComment[]>([]);
  isLoadingComments = signal<boolean>(false);
  newCommentText = signal<string>('');
  isSubmittingComment = signal<boolean>(false);

  // Adoption modal
  showAdoptionModal = signal<boolean>(false);
  adoptionSubmitted = signal<boolean>(false);
  isSending = signal<boolean>(false);
  existingApplication = signal<AdoptionRequest | null>(null);
  getStageMeta = getStageMeta;

  // Report modal
  showReportModal = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPet(id);
    }
  }

  loadPet(id: string): void {
    this.isLoading.set(true);
    this.petService.getPublicById(id).subscribe({
      next: (data) => {
        this.pet.set(data);
        this.activePhoto.set(data.photoUrl || (data.photos && data.photos[0]) || '');
        this.isLoading.set(false);
        this.checkExistingApplication(id);
        this.loadComments(id);
      },
      error: () => {
        this.isLoading.set(false);
        this.notify.error('No se pudo cargar la información de la mascota');
      },
    });
  }

  formatGender(gender?: string | null): string {
    return formatPetGenderLabel(gender, '');
  }

  formatSize(size?: string | null): string {
    return formatPetSizeLabel(size, '');
  }

  formatEnergy(energy?: string | null): string {
    return formatPetEnergyLabel(energy, '');
  }

  getPetIdentitySummary(p: Pet): string {
    const parts: string[] = [];
    if (p.breed) parts.push(p.breed);
    if (p.approximateAge) parts.push(p.approximateAge);
    const sizeLabel = this.formatSize(p.size);
    if (sizeLabel) parts.push(`Talla ${sizeLabel}`);
    return parts.join(' • ');
  }

  formatCommentDate(dateStr?: string): string {
    return dateStr ? formatExactDateTime(dateStr) : '';
  }

  loadComments(petId: string): void {
    this.isLoadingComments.set(true);
    this.petService.getComments(petId).subscribe({
      next: (list) => {
        this.comments.set(list || []);
        this.isLoadingComments.set(false);
      },
      error: () => {
        this.isLoadingComments.set(false);
      },
    });
  }

  submitComment(): void {
    const p = this.pet();
    const content = this.newCommentText().trim();
    if (!p || !content || content.length < 2 || this.isSubmittingComment()) return;

    this.isSubmittingComment.set(true);
    this.petService.addComment(p.id, content).subscribe({
      next: (created) => {
        this.isSubmittingComment.set(false);
        this.newCommentText.set('');
        this.comments.update((curr) => [...curr, created]);
      },
      error: (err) => {
        this.isSubmittingComment.set(false);
        this.notify.error(err?.error?.message || 'No se pudo publicar tu comentario');
      },
    });
  }

  canDeleteComment(comment: PublicationComment): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true;
    const authorId = comment.authorId || comment.author?.id;
    return Boolean(authorId && authorId === user.id);
  }

  async deleteComment(comment: PublicationComment): Promise<void> {
    const p = this.pet();
    if (!p || !comment?.id) return;

    const confirmed = await this.confirmService.confirm({
      title: '¿Eliminar comentario?',
      message: 'Este comentario se borrará de la ficha de forma permanente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'trash',
    });
    if (!confirmed) return;

    this.petService.deleteComment(p.id, comment.id).subscribe({
      next: () => {
        this.comments.update((curr) => curr.filter((c) => c.id !== comment.id));
        this.notify.success('Comentario eliminado');
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'No se pudo eliminar el comentario');
      },
    });
  }

  private checkExistingApplication(petId: string): void {
    if (!this.authService.isAuthenticated()) {
      this.existingApplication.set(null);
      return;
    }
    this.adoptionService.getMyApplications().subscribe({
      next: (apps) => {
        const active = apps.find(
          (r) =>
            r.petId === petId &&
            r.status !== 'RECHAZADA' &&
            r.status !== 'CANCELADA',
        );
        this.existingApplication.set(active || null);
      },
      error: () => {},
    });
  }

  setActivePhoto(url: string): void {
    this.activePhoto.set(url);
  }

  goBack(): void {
    this.navHistory.goBack(['/adopciones']);
  }

  ngOnDestroy(): void {
    this.scrollLock.unlockPrefix('pet-public-');
  }

  isOwnPet(): boolean {
    const p = this.pet();
    const myId = this.authService.currentUser()?.id;
    const ownerId = p?.ownerId || p?.owner?.id;
    return !!myId && !!ownerId && myId === ownerId;
  }

  isPetAdoptable(): boolean {
    const status = this.pet()?.status;
    return !status || status === 'DISPONIBLE' || status === 'EN_PROCESO';
  }

  isRescuerOrAdmin(): boolean {
    const role = this.authService.currentUser()?.role;
    return (
      role === UserRole.RESCATISTA_VERIFICADO ||
      role === UserRole.ALBERGUE ||
      role === UserRole.ADMIN
    );
  }

  openAdoptionModal(): void {
    if (!this.isPetAdoptable()) {
      this.notify.warning('Esta mascota ya no se encuentra disponible para nuevas postulaciones.');
      return;
    }
    if (this.isOwnPet()) {
      this.notify.warning('No puedes postularte a tu propia publicación.');
      return;
    }
    this.scrollLock.lock('pet-public-adoption');
    this.showAdoptionModal.set(true);
    this.adoptionSubmitted.set(false);
  }

  closeAdoptionModal(): void {
    this.scrollLock.unlock('pet-public-adoption');
    this.showAdoptionModal.set(false);
  }

  openReportModal(): void {
    const p = this.pet();
    if (!p) return;
    if (!this.authService.isAuthenticated()) {
      this.notify.warning('Inicia sesión para poder enviar un reporte a moderación.');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: `/adopciones/${p.id}` } });
      return;
    }
    this.scrollLock.lock('pet-public-report');
    this.showReportModal.set(true);
  }

  closeReportModal(): void {
    this.scrollLock.unlock('pet-public-report');
    this.showReportModal.set(false);
  }

  showPosterModal = signal<boolean>(false);

  openPosterModal(): void {
    if (!this.pet()) return;
    this.showPosterModal.set(true);
  }

  closePosterModal(): void {
    this.showPosterModal.set(false);
  }

  getPetPosterPayload(): PosterQrPayload | null {
    const p = this.pet();
    if (!p) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const sizeLabel = this.formatSize(p.size);
    return {
      id: p.id,
      category: 'EN_ADOPCION',
      petName: p.name,
      species: p.species,
      gender: this.formatGender(p.gender) || undefined,
      approxAge: p.approximateAge || undefined,
      coloniaName: p.colonia?.name || BRAND_CONFIG.city,
      locationDetail: p.colonia?.name || BRAND_CONFIG.city,
      description:
        p.rescueStory ||
        `${p.name} (${p.species}${sizeLabel ? ', talla ' + sizeLabel.toLowerCase() : ''}) en adopción responsable en ${BRAND_CONFIG.city}.`,
      photoUrl: p.photoUrl || p.photos?.[0] || '',
      contactPhone: p.owner?.phone,
      rewardOffered: false,
      directUrl: `${origin}/adopciones/${p.id}`,
      city: BRAND_CONFIG.city,
      brandName: BRAND_CONFIG.name,
    };
  }

  sendAdoption(payload: CreateAdoptionRequestPayload): void {
    const p = this.pet();
    if (!p) return;

    this.isSending.set(true);
    this.adoptionService.createRequest(p.id, payload).subscribe({
      next: (created) => {
        this.isSending.set(false);
        this.adoptionSubmitted.set(true);
        this.existingApplication.set(created);
        this.notify.success('¡Solicitud enviada al responsable!');
      },
      error: (err) => {
        this.isSending.set(false);
        this.notify.error(err.error?.message || 'Error al enviar solicitud');
      },
    });
  }

  getAuthorizedWhatsAppUrl(): string | null {
    const existing = this.existingApplication();
    const p = this.pet();
    if (!existing || !p) return null;
    if (existing.whatsappDirectUrl) return existing.whatsappDirectUrl;
    const rawPhone = existing.pet?.owner?.phone;
    if (!rawPhone) return null;
    const clean = rawPhone.replace(/\D/g, '');
    if (clean.length < 10) return null;
    const text = `Hola, doy seguimiento a mi solicitud formal para adoptar a ${p.name} en ${this.brand.name}.`;
    return buildWhatsAppUrl(rawPhone, text);
  }

  shareToWhatsApp(): void {
    const p = this.pet();
    if (!p) return;
    const text = `Adopta a *${p.name}* en ${this.brand.city}. Conoce su ficha en ${this.brand.name}: ${window.location.href}`;
    openExternalSafe(buildWhatsAppUrl(undefined, text));
  }

  shareToFacebook(): void {
    openExternalSafe(buildFacebookShareUrl(window.location.href));
  }

  canMessageOwner(): boolean {
    const p = this.pet();
    const ownerId = p?.ownerId || p?.owner?.id;
    if (!ownerId) return false;
    const myId = this.authService.currentUser()?.id;
    return !myId || ownerId !== myId;
  }

  contactOwnerInApp(): void {
    const p = this.pet();
    if (!p) return;
    const recipientId = p.ownerId || p.owner?.id;
    if (!recipientId) return;

    this.dmService.openChatWithContext({
      recipientId,
      recipientName: p.owner?.fullName,
      contextType: 'PET',
      contextId: p.id,
      contextTitle: `Adopción de ${p.name}`,
      contextSubtitle: `${p.species} • ${p.colonia?.name || 'Dolores Hidalgo'}`,
      contextImageUrl: p.photoUrl || p.photos?.[0],
      contextTargetUrl: `/adopciones/${p.id}`,
      prefilledDraft: `¡Hola! Vi la ficha de ${p.name} en Huellitas Dolores Hidalgo y me gustaría platicar sobre los requisitos de adopción.`,
    });
  }

  contactOwnerInAppPostAdoption(): void {
    const p = this.pet();
    this.closeAdoptionModal();
    if (!p) return;
    const recipientId = p.ownerId || p.owner?.id;
    if (!recipientId) return;

    this.dmService.openChatWithContext({
      recipientId,
      recipientName: p.owner?.fullName,
      contextType: 'ADOPTION_REQUEST',
      contextId: p.id,
      contextTitle: `Solicitud de Adopción: ${p.name}`,
      contextSubtitle: `${p.species} • ${p.colonia?.name || 'Dolores Hidalgo'}`,
      contextImageUrl: p.photoUrl || p.photos?.[0],
      contextTargetUrl: `/adopciones/${p.id}`,
      prefilledDraft: `¡Hola! Acabo de registrar mi postulación para adoptar a ${p.name}. Me gustaría coordinar una entrevista para avanzar con el proceso.`,
    });
  }
}
