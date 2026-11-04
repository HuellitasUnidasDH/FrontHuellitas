import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../core/services/pet.service';
import { LostPetService } from '../../core/services/lost-pet.service';
import { ColoniaService } from '../../core/services/colonia.service';
import { AdoptionService } from '../../core/services/adoption.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ImageUploadService } from '../../core/services/image-upload.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Pet, AdoptionStatus } from '../../core/models/pet.model';
import { LostPetReport, LostPetStatus, LostPetType, PetSighting, PublicationComment } from '../../core/models/lost-pet.model';
import { Colonia } from '../../core/models/colonia.model';
import { BRAND_CONFIG } from '../../core/constants/brand.constants';

type FeedFilterType = 'ALL' | 'ANIMAL_HERIDO' | 'EN_RESGUARDO' | 'EN_ADOPCION' | 'SE_BUSCA' | 'CAMPANA_COMUNITARIA' | 'ADOPTION' | 'LOST' | 'FOUND';

export interface FormCategoryConfig {
  titleLabel: string;
  titlePlaceholder: string;
  showSpeciesAndGender: boolean;
  locationLabel: string;
  locationPlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  showTemperamentTags: boolean;
  showInjuredCheckbox: boolean;
  isInjuredLocked: boolean;
  showRewardOption: boolean;
  photoLabel: string;
  photoPlaceholder: string;
  submitButtonText: string;
  submitButtonGradient: string;
  submitButtonIcon: string;
}

interface FeedPost {
  id: string;
  kind: 'PET_ADOPTION' | 'LOST_PET';
  postType?: LostPetType;
  title: string;
  authorName: string;
  authorPhotoUrl?: string;
  authorRole: string;
  authorColonia: string;
  createdAt: string;
  timeAgo: string;
  typeBadge: string;
  badgeClass: string;
  description: string;
  photoUrl: string;
  photos: string[];
  species: string;
  breed?: string;
  approxAge?: string;
  size?: string;
  gender?: string;
  coloniaName?: string;
  temperamentTags?: string[];
  // Adoption specifics
  isSterilized?: boolean;
  isVaccinated?: boolean;
  goodWithKids?: boolean;
  goodWithOtherPets?: boolean;
  petData?: Pet;
  // Lost / community post specifics
  lostData?: LostPetReport;
  lastSeenLocation?: string;
  contactPhone?: string;
  rewardOffered?: boolean;
  rewardDetails?: string;
  isInjured?: boolean;
  reportsCount?: number;
  sightings?: PetSighting[];
  comments?: PublicationComment[];
  showComments?: boolean;
  newCommentText?: string;
  isSubmittingComment?: boolean;
  activePhotoIndex?: number;
}

@Component({
  selector: 'app-community-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-3.5 sm:px-6 py-5 space-y-6">

      <!-- ======================================================== -->
      <!-- Píldora Flotante FIJA en Pantalla (Visible aunque bajes) -->
      <!-- ======================================================== -->
      @if (pendingNewPostsCount() > 0) {
        <div class="fixed top-[4.5rem] sm:top-20 inset-x-0 z-40 flex justify-center px-3 pointer-events-none animate-fadeIn">
          <button
            type="button"
            (click)="applyPendingFeedRefresh()"
            class="pointer-events-auto px-4 sm:px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-2xl shadow-emerald-500/40 border-2 border-white/70 dark:border-slate-900/60 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 max-w-full"
          >
            <span class="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
            </span>
            <span class="truncate">🐾 {{ pendingNewPostsCount() }} nueva(s) publicación(es) — Toca para actualizar</span>
            <span class="flex-shrink-0">🔄</span>
          </button>
        </div>
      }

      <!-- ======================================================== -->
      <!-- Botón Flotante Inferior para Subir al Inicio del Muro    -->
      <!-- ======================================================== -->
      @if (isScrolledDown()) {
        <div class="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 animate-fadeIn">
          <button
            type="button"
            (click)="scrollToTop()"
            class="w-10 h-10 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-emerald-400 font-black text-sm shadow-2xl border border-emerald-500/40 dark:border-emerald-500/40 backdrop-blur-xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all"
            title="Volver arriba"
          >
            ↑
          </button>
        </div>
      }

      <!-- ======================================================== -->
      <!-- Top Hero Header / Dolores Hidalgo Brand Banner           -->
      <!-- ======================================================== -->
      <section class="liquid-glass rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden transition-all border border-emerald-500/20">
        <div class="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-400/10 to-transparent blur-2xl pointer-events-none"></div>

        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div class="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-emerald-500/25 flex-shrink-0 animate-bounce duration-1000">
              🐾
            </div>
            <div>
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 class="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Muro {{ brand.name }}
                </h1>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  {{ brand.city }}
                </span>
              </div>
              <p class="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                Red ciudadana de adopción responsable, reporte de extravíos y bienestar animal en Cuna de la Independencia Nacional.
              </p>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
            <button
              (click)="refreshFeedSilently(true)"
              [disabled]="isRefreshingFeed()"
              title="Actualizar publicaciones manteniendo tu posición en el muro"
              class="px-3 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span [ngClass]="{ 'animate-spin': isRefreshingFeed() }">🔄</span>
              <span>Actualizar</span>
            </button>

            @if (authService.isAuthenticated()) {
              <button
                (click)="openPublicationModal()"
                class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>✍️</span> Crear Publicación
              </button>

              <a
                routerLink="/pets/new"
                class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>🐾</span> Mis Mascotas
              </a>
            } @else {
              <a
                routerLink="/auth/login"
                class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>🔑</span> Iniciar Sesión para Publicar
              </a>

              <a
                routerLink="/auth/register"
                class="flex-1 sm:flex-none justify-center px-3.5 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>✨</span> Registrarme
              </a>
            }
          </div>
        </div>
      </section>

      <!-- ======================================================== -->
      <!-- Stories / Quick Filters Bar (5 Publication Types)        -->
      <!-- ======================================================== -->
      <section class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        <!-- 1: Todos -->
        <button
          (click)="setFilter('ALL')"
          class="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none"
        >
          <div
            class="w-16 h-16 rounded-2xl p-0.5 transition-all duration-300"
            [ngClass]="activeFilter() === 'ALL' ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 scale-105 shadow-md shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-800 hover:scale-105'"
          >
            <div class="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🌐
            </div>
          </div>
          <span class="text-[11px] font-bold" [ngClass]="activeFilter() === 'ALL' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'">
            Todo el Muro
          </span>
        </button>

        <!-- 2: Animal Herido -->
        <button
          (click)="setFilter('ANIMAL_HERIDO')"
          class="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none"
        >
          <div
            class="w-16 h-16 rounded-2xl p-0.5 transition-all duration-300 relative"
            [ngClass]="activeFilter() === 'ANIMAL_HERIDO' ? 'bg-gradient-to-tr from-rose-600 to-red-500 scale-105 shadow-md shadow-rose-600/30' : 'bg-slate-300 dark:bg-slate-800 hover:scale-105'"
          >
            <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 text-[8px] text-white font-bold items-center justify-center">!</span>
            </span>
            <div class="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🚨
            </div>
          </div>
          <span class="text-[11px] font-bold" [ngClass]="activeFilter() === 'ANIMAL_HERIDO' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'">
            Animal Herido
          </span>
        </button>

        <!-- 3: En Resguardo -->
        <button
          (click)="setFilter('EN_RESGUARDO')"
          class="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none"
        >
          <div
            class="w-16 h-16 rounded-2xl p-0.5 transition-all duration-300"
            [ngClass]="activeFilter() === 'EN_RESGUARDO' ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 scale-105 shadow-md shadow-amber-500/30' : 'bg-slate-300 dark:bg-slate-800 hover:scale-105'"
          >
            <div class="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🏠
            </div>
          </div>
          <span class="text-[11px] font-bold" [ngClass]="activeFilter() === 'EN_RESGUARDO' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'">
            En Resguardo
          </span>
        </button>

        <!-- 4: En Adopción -->
        <button
          (click)="setFilter('EN_ADOPCION')"
          class="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none"
        >
          <div
            class="w-16 h-16 rounded-2xl p-0.5 transition-all duration-300"
            [ngClass]="activeFilter() === 'EN_ADOPCION' || activeFilter() === 'ADOPTION' ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 scale-105 shadow-md shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-800 hover:scale-105'"
          >
            <div class="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              💚
            </div>
          </div>
          <span class="text-[11px] font-bold" [ngClass]="activeFilter() === 'EN_ADOPCION' || activeFilter() === 'ADOPTION' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'">
            En Adopción
          </span>
        </button>

        <!-- 5: Se Busca -->
        <button
          (click)="setFilter('SE_BUSCA')"
          class="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none"
        >
          <div
            class="w-16 h-16 rounded-2xl p-0.5 transition-all duration-300"
            [ngClass]="activeFilter() === 'SE_BUSCA' || activeFilter() === 'LOST' ? 'bg-gradient-to-tr from-rose-500 to-amber-500 scale-105 shadow-md shadow-rose-500/30' : 'bg-slate-300 dark:bg-slate-800 hover:scale-105'"
          >
            <div class="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🔍
            </div>
          </div>
          <span class="text-[11px] font-bold" [ngClass]="activeFilter() === 'SE_BUSCA' || activeFilter() === 'LOST' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'">
            Se Busca
          </span>
        </button>

        <!-- 6: Campañas Comunitarias -->
        <button
          (click)="setFilter('CAMPANA_COMUNITARIA')"
          class="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none"
        >
          <div
            class="w-16 h-16 rounded-2xl p-0.5 transition-all duration-300"
            [ngClass]="activeFilter() === 'CAMPANA_COMUNITARIA' ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 scale-105 shadow-md shadow-purple-500/30' : 'bg-slate-300 dark:bg-slate-800 hover:scale-105'"
          >
            <div class="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📢
            </div>
          </div>
          <span class="text-[11px] font-bold" [ngClass]="activeFilter() === 'CAMPANA_COMUNITARIA' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'">
            Campañas
          </span>
        </button>
      </section>

      <!-- ======================================================== -->
      <!-- Interactive Composer Box (Solo Visible con Sesión Iniciada) -->
      <!-- ======================================================== -->
      @if (authService.isAuthenticated()) {
        <section class="liquid-glass rounded-2xl p-4 shadow-xl border border-slate-200/80 dark:border-slate-800/80 animate-fadeIn">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full overflow-hidden shadow-sm bg-slate-200 dark:bg-slate-800 flex-shrink-0">
              @if (authService.currentUser()?.profilePhotoUrl) {
                <img [src]="authService.currentUser()?.profilePhotoUrl" [alt]="authService.currentUser()?.fullName" class="w-full h-full object-cover" />
              } @else {
                <div class="w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-sm">
                  {{ authService.currentUser()?.fullName ? authService.currentUser()?.fullName?.charAt(0)?.toUpperCase() : '🐾' }}
                </div>
              }
            </div>

            <div
              (click)="openPublicationModal()"
              class="flex-1 bg-slate-100 dark:bg-slate-950/60 hover:bg-slate-200/80 dark:hover:bg-slate-900 px-4 py-2.5 rounded-full text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-pointer transition-colors border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
            >
              <span>¿Viste un animal herido, en resguardo o buscas a tu mascota en Dolores Hidalgo?</span>
              <span class="text-emerald-500 font-bold text-xs hidden sm:inline">Publicar ✍️</span>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
            <button
              (click)="openPublicationModal('ANIMAL_HERIDO')"
              class="py-1.5 px-2 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition-colors cursor-pointer rounded-lg hover:bg-rose-500/10"
            >
              <span>🚨</span>
              <span class="truncate">Animal Herido</span>
            </button>

            <button
              (click)="openPublicationModal('EN_RESGUARDO')"
              class="py-1.5 px-2 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition-colors cursor-pointer rounded-lg hover:bg-amber-500/10"
            >
              <span>🏠</span>
              <span class="truncate">En Resguardo</span>
            </button>

            <button
              (click)="openPublicationModal('EN_ADOPCION')"
              class="py-1.5 px-2 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors cursor-pointer rounded-lg hover:bg-emerald-500/10"
            >
              <span>💚</span>
              <span class="truncate">Dar en Adopción</span>
            </button>

            <button
              (click)="openPublicationModal('SE_BUSCA')"
              class="py-1.5 px-2 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition-colors cursor-pointer rounded-lg hover:bg-rose-500/10"
            >
              <span>🔍</span>
              <span class="truncate">Se Busca</span>
            </button>
          </div>
        </section>
      }

      <!-- ======================================================== -->
      <!-- Botón Móvil para Mostrar/Ocultar Búsqueda y Colonias     -->
      <!-- ======================================================== -->
      <div class="sm:hidden flex items-center justify-between gap-2">
        <button
          type="button"
          (click)="toggleFiltersPanel()"
          class="flex-1 py-2.5 px-3.5 rounded-xl liquid-glass text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between border border-slate-300/60 dark:border-slate-700/60 cursor-pointer"
        >
          <span class="flex items-center gap-2">
            <span>🔍</span>
            <span>Buscar por nombre, colonia o especie</span>
          </span>
          <span class="text-emerald-600 dark:text-emerald-400 font-black">
            {{ showFiltersPanel() ? 'Ocultar ▲' : 'Abrir ▼' }}
          </span>
        </button>
      </div>

      <!-- ======================================================== -->
      <!-- Tactical Search & Colonias Filter Row                    -->
      <!-- ======================================================== -->
      <section
        class="liquid-glass rounded-2xl p-4 shadow-lg space-y-3 transition-all"
        [ngClass]="{'block': showFiltersPanel(), 'hidden sm:block': !showFiltersPanel()}"
      >
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Text Search -->
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Buscar por nombre, raza, colonia, C.P. o seña..."
              class="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <!-- Colonia Filter (Dolores Hidalgo) -->
          <div class="relative">
            <select
              [ngModel]="selectedColoniaId()"
              (ngModelChange)="selectedColoniaId.set($event)"
              class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="">📍 Todas las colonias de Dolores Hgo.</option>
              @for (colonia of colonias(); track colonia.id) {
                <option [value]="colonia.id">{{ colonia.postalCode ? '[' + colonia.postalCode + '] ' : '' }}{{ colonia.name }} ({{ colonia.zoneType }})</option>
              }
            </select>
          </div>

          <!-- Species Filter -->
          <div class="relative">
            <select
              [ngModel]="selectedSpecies()"
              (ngModelChange)="selectedSpecies.set($event)"
              class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="">🐾 Todas las especies</option>
              <option value="Perro">🐕 Perros</option>
              <option value="Gato">🐈 Gatos</option>
            </select>
          </div>
        </div>

        <!-- Quick Tag Toggles -->
        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px]">
          <span class="text-slate-400 font-semibold mr-1">Filtros rápidos:</span>

          <button
            (click)="toggleGoodWithKids()"
            [ngClass]="filterGoodWithKids() ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
            class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            👶 Bueno con niños
          </button>

          <button
            (click)="toggleGoodWithPets()"
            [ngClass]="filterGoodWithPets() ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
            class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            🐕 Convive con mascotas
          </button>

          @if (hasActiveFilters()) {
            <button
              (click)="clearFilters()"
              class="px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 font-bold transition-colors cursor-pointer ml-auto"
            >
              ✕ Limpiar filtros
            </button>
          }
        </div>
      </section>

      <!-- ======================================================== -->
      <!-- FEED POSTS (Facebook Style Cards)                        -->
      <!-- ======================================================== -->
      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-12 text-center space-y-3">
          <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400 animate-pulse">
            Cargando publicaciones de Dolores Hidalgo...
          </p>
        </div>
      } @else if (filteredPosts().length === 0) {
        <div class="liquid-glass rounded-3xl p-12 text-center space-y-4">
          <span class="text-5xl">🐾</span>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            No hay publicaciones con estos filtros
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Intenta cambiar de colonia o selecciona "Todo el Muro" para ver a todos los peluditos de Dolores Hidalgo.
          </p>
          <button
            (click)="clearFilters()"
            class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-all"
          >
            Ver todas las publicaciones
          </button>
        </div>
      } @else {
        <section class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          @for (post of filteredPosts(); track post.id) {
            <article
              [id]="'post-' + post.id"
              [ngClass]="highlightedPostId() === post.id ? 'ring-4 ring-emerald-500 border-emerald-500 shadow-2xl shadow-emerald-500/30' : 'border-slate-200/80 dark:border-white/10'"
              class="liquid-glass-card liquid-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg hover:shadow-2xl flex flex-col justify-between border transition-all duration-300 hover:-translate-y-1"
            >
              
              <!-- 1. Post Header (Author, Badge, Timestamp) -->
              <div class="flex items-start justify-between gap-2.5">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-white/20 flex-shrink-0 bg-slate-200 dark:bg-slate-800">
                    @if (post.authorPhotoUrl) {
                      <img [src]="post.authorPhotoUrl" [alt]="post.authorName" class="w-full h-full object-cover" />
                    } @else {
                      <div class="w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-base font-black text-slate-950">
                        {{ post.authorName ? post.authorName.charAt(0).toUpperCase() : '🐾' }}
                      </div>
                    }
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {{ post.authorName }}
                      </span>
                      <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                        • {{ post.authorRole }}
                      </span>
                    </div>

                    <div class="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <span class="truncate">📍 {{ post.authorColonia || 'Dolores Hgo.' }}</span>
                      <span>•</span>
                      <span class="flex-shrink-0">{{ post.timeAgo }}</span>
                    </div>
                  </div>
                </div>

                <!-- Post Kind Badge & Injured Badge -->
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                  @if (post.isInjured) {
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm shadow-rose-600/30 flex items-center gap-1 animate-pulse">
                      <span>🚨</span> Herido
                    </span>
                  }
                  <span
                    class="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider border shadow-sm"
                    [ngClass]="post.badgeClass"
                  >
                    {{ post.typeBadge }}
                  </span>
                </div>
              </div>

              <!-- 2. Post Body / Title & Story (Compact & High Contrast, sin cortar título en móvil) -->
              <div class="mt-2.5 space-y-1">
                <h2 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-snug break-words hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {{ post.title }}
                </h2>
                <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {{ post.description }}
                </p>
              </div>

              <!-- 3. Post Image Gallery (Interactive Carousel + Click to Open Fullscreen Lightbox) -->
              @if (post.photoUrl || (post.photos && post.photos.length > 0)) {
                <div class="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-slate-950/20 group my-2.5 flex-shrink-0 border border-black/5 dark:border-white/10">
                  <img
                    [src]="getPostCurrentPhoto(post)"
                    [alt]="post.title"
                    (click)="openLightbox(post, post.activePhotoIndex || 0)"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                    loading="lazy"
                    title="Toca para ver la imagen completa"
                  />

                  <!-- Top-Right Photo Counter & Zoom Pill -->
                  <button
                    type="button"
                    (click)="openLightbox(post, post.activePhotoIndex || 0)"
                    class="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-950/75 hover:bg-slate-950/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-md cursor-pointer transition-all"
                    title="Ampliar galería fotográfica"
                  >
                    <span>🔍</span>
                    @if (post.photos && post.photos.length > 1) {
                      <span>{{ (post.activePhotoIndex || 0) + 1 }} / {{ post.photos.length }} fotos</span>
                    } @else {
                      <span>Ver foto</span>
                    }
                  </button>

                  <!-- Multi-photo Navigation Arrows on Card -->
                  @if (post.photos && post.photos.length > 1) {
                    <button
                      type="button"
                      (click)="prevPostPhoto(post, $event)"
                      class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-emerald-500 text-white hover:text-slate-950 flex items-center justify-center text-sm font-black shadow-lg transition-all cursor-pointer opacity-85 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Foto anterior"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      (click)="nextPostPhoto(post, $event)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-emerald-500 text-white hover:text-slate-950 flex items-center justify-center text-sm font-black shadow-lg transition-all cursor-pointer opacity-85 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Siguiente foto"
                    >
                      ›
                    </button>
                  }

                  <!-- Floating attributes badge overlay on image -->
                  <div class="absolute bottom-2 inset-x-2 flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-slate-950/75 backdrop-blur-md text-white text-[10px] pointer-events-none">
                    @if (post.postType !== 'CAMPANA_COMUNITARIA') {
                      <span class="font-bold">🐾 {{ post.species }}</span>
                      @if (post.breed) {
                        <span class="truncate max-w-[110px]">• {{ post.breed }}</span>
                      }
                      @if (post.approxAge) {
                        <span class="bg-white/20 px-1.5 py-0.5 rounded">🎂 {{ post.approxAge }}</span>
                      }
                      @if (post.size) {
                        <span class="bg-white/20 px-1.5 py-0.5 rounded">📏 {{ post.size }}</span>
                      }
                    } @else {
                      <span class="font-bold text-purple-300">📢 Aviso / Campaña</span>
                    }
                    @if (post.coloniaName) {
                      <span class="ml-auto text-emerald-300 font-bold truncate max-w-[120px]">📍 {{ post.coloniaName }}</span>
                    }
                  </div>
                </div>

                <!-- Mini Thumbnail Strip when post has multiple photos -->
                @if (post.photos && post.photos.length > 1) {
                  <div class="flex items-center gap-1.5 overflow-x-auto pb-1 mb-1.5 scrollbar-none">
                    @for (imgUrl of post.photos; track $index) {
                      <button
                        type="button"
                        (click)="selectPostPhoto(post, $index, $event)"
                        (dblclick)="openLightbox(post, $index)"
                        class="w-11 h-11 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0"
                        [ngClass]="(post.activePhotoIndex || 0) === $index ? 'border-emerald-500 scale-105 shadow-sm' : 'border-transparent opacity-65 hover:opacity-100'"
                      >
                        <img [src]="imgUrl" alt="Miniatura" class="w-full h-full object-cover" />
                      </button>
                    }
                  </div>
                }
              }

              <!-- 4. Tactical Attribute Tags (Health, Behavior, Rewards) -->
              <div class="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] my-1.5">
                <!-- User-selected temperament & coexistence tags -->
                @if (post.postType !== 'CAMPANA_COMUNITARIA' && post.temperamentTags && post.temperamentTags.length > 0) {
                  @for (tag of post.temperamentTags; track tag) {
                    <span class="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-semibold text-[10px]">
                      🏷️ {{ tag }}
                    </span>
                  }
                }

                @if (post.kind === 'PET_ADOPTION') {
                  @if (post.isSterilized && !post.temperamentTags?.includes('Esterilizado(a)')) {
                    <span class="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                      ✂️ Esterilizado
                    </span>
                  }
                  @if (post.isVaccinated && !post.temperamentTags?.includes('Vacunado(a)')) {
                    <span class="px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30 font-semibold">
                      💉 Vacunado
                    </span>
                  }
                  @if (post.goodWithKids && !post.temperamentTags?.includes('Bueno con niños')) {
                    <span class="px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 font-semibold">
                      👶 Niños OK
                    </span>
                  }
                  @if (post.goodWithOtherPets && !post.temperamentTags?.includes('Sociable con perros') && !post.temperamentTags?.includes('Convive con gatos')) {
                    <span class="px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 font-semibold">
                      🐕 Mascotas OK
                    </span>
                  }
                } @else if (post.kind === 'LOST_PET') {
                  @if (post.rewardOffered) {
                    <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 font-bold animate-pulse">
                      🎁 Recompensa: {{ post.rewardDetails || 'Ofrecida' }}
                    </span>
                  }
                  @if (post.lostData?.status === 'REENCONTRADA') {
                    <span class="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-black">
                      ✅ Caso Resuelto / Reencontrado
                    </span>
                  }
                  @if (post.lastSeenLocation) {
                    <span
                      class="px-2 py-0.5 rounded-lg font-semibold truncate max-w-full border"
                      [ngClass]="post.postType === 'CAMPANA_COMUNITARIA'
                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                        : post.postType === 'EN_ADOPCION'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'"
                    >
                      @if (post.postType === 'CAMPANA_COMUNITARIA') {
                        📍 Sede: {{ post.lastSeenLocation }}
                      } @else if (post.postType === 'EN_ADOPCION' || post.postType === 'EN_RESGUARDO') {
                        📍 Zona: {{ post.lastSeenLocation }}
                      } @else if (post.postType === 'ANIMAL_HERIDO') {
                        🚨 Ubicación: {{ post.lastSeenLocation }}
                      } @else {
                        📍 Visto en: {{ post.lastSeenLocation }}
                      }
                    </span>
                  }
                  @if (post.postType === 'ANIMAL_HERIDO' && post.reportsCount && post.reportsCount > 1) {
                    <span class="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold">
                      📑 {{ post.reportsCount }} reportes de urgencia agrupados
                    </span>
                  }
                }
              </div>

              <!-- 4.1. Cascading Incident Reports (Solo para Animal Herido o Avistamientos de Extravío) -->
              @if (post.kind === 'LOST_PET' && (post.postType === 'ANIMAL_HERIDO' || post.postType === 'SE_BUSCA' || post.postType === 'EXTRAVIADA') && post.sightings && post.sightings.length > 0) {
                <div class="rounded-xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 p-2.5 my-1.5 space-y-2">
                  <div class="flex items-center justify-between gap-1 text-[11px]">
                    <span class="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <span>📍</span>
                      <span>{{ post.postType === 'ANIMAL_HERIDO' ? 'Cascada vecinal de urgencia' : 'Avistamientos reportados' }} ({{ post.sightings.length }})</span>
                    </span>
                    <span class="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400">
                      {{ post.postType === 'ANIMAL_HERIDO' ? 'Consolidado' : 'Seguimiento' }}
                    </span>
                  </div>
                  <div class="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    @for (sighting of post.sightings; track sighting.id) {
                      <div class="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 text-[10px]">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {{ sighting.notifier?.fullName || 'Vecino solidario' }}
                          </span>
                          <span class="text-slate-400">{{ formatRelativeTime(sighting.createdAt) }}</span>
                        </div>
                        <p class="text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                          <span class="text-rose-500 font-bold">Ubicación:</span> {{ sighting.locationDescription }}
                        </p>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- 5. Social Actions & CTA Buttons -->
              <div class="mt-auto pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-1 min-w-[140px]">
                  @if (post.kind === 'PET_ADOPTION' && post.petData) {
                    <!-- Main CTA: Quiero Adoptar -->
                    <button
                      (click)="openAdoptionModal(post.petData)"
                      class="flex-1 justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>💚</span>
                      <span>Adoptar</span>
                    </button>

                    <!-- Ver Ficha Completa -->
                    <a
                      [routerLink]="['/adopciones', post.petData.id]"
                      class="px-2.5 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>👁️</span>
                      <span class="hidden sm:inline">Ficha</span>
                    </a>
                  } @else if (post.kind === 'LOST_PET' && post.lostData) {
                    @if (post.postType === 'CAMPANA_COMUNITARIA') {
                      <!-- CTA para Campaña Comunitaria -->
                      @if (post.contactPhone) {
                        <a
                          [href]="getDirectWhatsAppUrl(post.contactPhone, 'Hola, me gustaría solicitar informes sobre la campaña: ' + post.title)"
                          target="_blank"
                          class="flex-1 justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>📲</span>
                          <span>Solicitar Informes</span>
                        </a>
                      } @else {
                        <button
                          (click)="toggleComments(post)"
                          class="flex-1 justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>📢</span>
                          <span>Ver Detalles / Preguntar</span>
                        </button>
                      }
                    } @else if (post.postType === 'EN_ADOPCION') {
                      <!-- CTA para Mascota en Adopción reportada en muro -->
                      @if (post.contactPhone) {
                        <a
                          [href]="getDirectWhatsAppUrl(post.contactPhone, 'Hola, me interesa adoptar a ' + (post.lostData.petName || 'este peludito') + ' publicado en Huellitas Dolores Hidalgo')"
                          target="_blank"
                          class="flex-1 justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>💚</span>
                          <span>Quiero Adoptar</span>
                        </a>
                      }
                    } @else if (post.postType === 'ANIMAL_HERIDO') {
                      <!-- CTA para Animal Herido -->
                      <button
                        (click)="openSightingModal(post.lostData)"
                        class="flex-1 justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white text-xs font-black shadow-md shadow-rose-600/25 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>🚑</span>
                        <span>Brindar Ayuda / Reportar</span>
                      </button>

                      @if (post.contactPhone) {
                        <a
                          [href]="getDirectWhatsAppUrl(post.contactPhone, 'Hola, vi la alerta de urgencia de ' + post.title + ' en Huellitas Dolores Hidalgo')"
                          target="_blank"
                          class="px-2.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>📲</span>
                          <span class="hidden sm:inline">WhatsApp</span>
                        </a>
                      }
                    } @else if (post.postType === 'EN_RESGUARDO') {
                      <!-- CTA para Animal en Resguardo -->
                      <button
                        (click)="openSightingModal(post.lostData)"
                        class="flex-1 justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>🏠</span>
                        <span>Es mío / Apoyar</span>
                      </button>

                      @if (post.contactPhone) {
                        <a
                          [href]="getDirectWhatsAppUrl(post.contactPhone, 'Hola, vi tu publicación de resguardo de ' + post.title + ' en Huellitas Dolores Hidalgo')"
                          target="_blank"
                          class="px-2.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>📲</span>
                          <span class="hidden sm:inline">WhatsApp</span>
                        </a>
                      }
                    } @else {
                      <!-- CTA para Mascota Extraviada (Se Busca) -->
                      <button
                        (click)="openSightingModal(post.lostData)"
                        class="flex-1 justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 active:scale-95 text-white text-xs font-black shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>👀</span>
                        <span>¡Lo vi!</span>
                      </button>

                      @if (post.contactPhone) {
                        <a
                          [href]="getDirectWhatsAppUrl(post.contactPhone, 'Hola, vi la publicación de ' + post.title + ' en Huellitas Dolores Hidalgo')"
                          target="_blank"
                          class="px-2.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>📲</span>
                          <span class="hidden sm:inline">WhatsApp</span>
                        </a>
                      }
                    }
                  }
                </div>

                <!-- Secondary Share Actions & Comments Button -->
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    (click)="toggleComments(post)"
                    class="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                    title="Ver y escribir comentarios"
                  >
                    <span>💬</span>
                    <span>{{ (post.comments?.length || 0) }}</span>
                  </button>

                  @if (canDeletePost(post)) {
                    @if (post.kind === 'LOST_PET' && post.lostData && post.postType !== 'CAMPANA_COMUNITARIA' && post.lostData.status !== 'REENCONTRADA') {
                      <button
                        (click)="markPostResolved(post)"
                        class="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-500 hover:text-white border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs transition-colors cursor-pointer"
                        title="Marcar caso como Resuelto / Reencontrado"
                      >
                        <span>✅</span>
                      </button>
                    }

                    <button
                      (click)="openEditPostModal(post)"
                      class="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-500 hover:text-slate-950 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 text-xs transition-colors cursor-pointer"
                      title="Editar mi publicación"
                    >
                      <span>✏️</span>
                    </button>

                    <button
                      (click)="confirmDeactivatePost(post)"
                      class="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 hover:text-white border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs transition-colors cursor-pointer"
                      title="Desactivar y archivar mi publicación"
                    >
                      <span>🗑️</span>
                    </button>
                  }

                  <button
                    (click)="shareToWhatsApp(post)"
                    class="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-500/20 hover:text-emerald-500 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                    title="Compartir en grupos de WhatsApp"
                  >
                    <span>📱</span>
                  </button>

                  <button
                    (click)="shareToFacebook(post)"
                    class="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-sky-500/20 hover:text-sky-500 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                    title="Compartir en Facebook"
                  >
                    <span>🌐</span>
                  </button>

                  <button
                    (click)="copyPostLink(post)"
                    class="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                    title="Copiar enlace"
                  >
                    🔗
                  </button>
                </div>
              </div>

              <!-- 6. Expandable Community Comments Section -->
              @if (post.showComments) {
                <div class="pt-2.5 mt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2.5 animate-fadeIn">
                  <div class="flex items-center justify-between text-[11px]">
                    <h4 class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <span>💬</span>
                      <span>Comentarios ({{ post.comments?.length || 0 }})</span>
                    </h4>
                  </div>

                  <!-- Comments List -->
                  @if (post.comments && post.comments.length > 0) {
                    <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      @for (comment of post.comments; track comment.id) {
                        <div class="flex items-start gap-2 p-2 rounded-xl bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                          <div class="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800">
                            @if (comment.author?.profilePhotoUrl) {
                              <img [src]="comment.author?.profilePhotoUrl" [alt]="comment.author?.fullName" class="w-full h-full object-cover" />
                            } @else {
                              <div class="w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-[9px]">
                                {{ comment.author?.fullName ? comment.author?.fullName?.charAt(0)?.toUpperCase() : '👤' }}
                              </div>
                            }
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-1">
                              <span class="font-bold text-slate-900 dark:text-white text-[10px] truncate">
                                {{ comment.author?.fullName || 'Vecino solidario' }}
                              </span>
                              <span class="text-[9px] text-slate-400 font-medium flex-shrink-0">
                                {{ formatExactDateTime(comment.createdAt) }}
                              </span>
                            </div>
                            <p class="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed break-words text-[10px]">
                              {{ comment.content }}
                            </p>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                      <p class="text-[11px] text-slate-500 dark:text-slate-400">
                        Aún no hay comentarios. ¡Sé el primero en aportar información!
                      </p>
                    </div>
                  }

                  <!-- Comment Input Box -->
                  @if (authService.isAuthenticated()) {
                    <div class="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        [(ngModel)]="post.newCommentText"
                        (keyup.enter)="submitComment(post)"
                        placeholder="Escribe un comentario..."
                        class="flex-1 px-2.5 py-1.5 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        (click)="submitComment(post)"
                        [disabled]="post.isSubmittingComment || !post.newCommentText?.trim()"
                        class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1"
                      >
                        @if (post.isSubmittingComment) {
                          <span class="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                        } @else {
                          <span>Enviar</span>
                        }
                      </button>
                    </div>
                  } @else {
                    <div class="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-center text-[10px] text-slate-500">
                      <a routerLink="/auth/login" class="text-emerald-500 font-bold hover:underline">Inicia sesión</a> para comentar.
                    </div>
                  }
                </div>
              }
            </article>
          }
        </section>
      }

      <!-- ======================================================== -->
      <!-- MODAL ITEM #2: FLUJO INTELIGENTE "QUIERO ADOPTAR"        -->
      <!-- ======================================================== -->
      @if (selectedPetForAdoption()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div class="liquid-glass rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-emerald-500/30 overflow-hidden space-y-5 max-h-[90vh] overflow-y-auto">
            
            <!-- Close Button -->
            <button
              (click)="closeAdoptionModal()"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>

            <!-- Pet Summary Header -->
            <div class="flex items-center gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
              <img
                [src]="selectedPetForAdoption()!.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80'"
                [alt]="selectedPetForAdoption()!.name"
                class="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-emerald-500/30"
              />
              <div>
                <span class="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Solicitud de Adopción Responsable
                </span>
                <h3 class="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  Adoptar a {{ selectedPetForAdoption()!.name }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ selectedPetForAdoption()!.species }} • {{ selectedPetForAdoption()!.approximateAge || 'Joven' }} • Dolores Hidalgo
                </p>
              </div>
            </div>

            <!-- SUCCESS STATE: Si ya se postuló -->
            @if (adoptionSubmittedSuccess()) {
              <div class="text-center py-6 space-y-4 animate-scaleUp">
                <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 text-3xl flex items-center justify-center mx-auto border-2 border-emerald-500">
                  🎉
                </div>
                <h4 class="text-lg font-black text-slate-900 dark:text-white">
                  ¡Solicitud Enviada con Éxito!
                </h4>
                <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                  Tu interés por <strong class="text-emerald-500">{{ selectedPetForAdoption()!.name }}</strong> ha sido registrado. Para agilizar el proceso y conocerlo(a) en persona, envíale un mensaje directo por WhatsApp al rescatista.
                </p>

                <!-- WhatsApp Button prefilled -->
                <a
                  [href]="getAdoptionWhatsAppUrl()"
                  target="_blank"
                  (click)="closeAdoptionModal()"
                  class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>💬</span>
                  <span>Abrir WhatsApp con el Rescatista</span>
                </a>

                <button
                  (click)="closeAdoptionModal()"
                  class="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                >
                  Volver al Muro
                </button>
              </div>
            } @else {
              <!-- ADOPTION FORM STEP -->
              <div class="space-y-4">
                @if (!authService.isAuthenticated()) {
                  <!-- Guest State: Quick options -->
                  <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div class="flex items-start gap-2.5">
                      <span class="text-lg">💡</span>
                      <p class="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        Puedes contactar directamente al rescatista por WhatsApp, o registrarte gratis para llevar el seguimiento oficial de vacunación y cartilla digital en {{ brand.name }}.
                      </p>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-2 pt-1">
                      <a
                        [href]="getAdoptionWhatsAppUrl()"
                        target="_blank"
                        class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <span>💬</span> Contactar por WhatsApp
                      </a>
                      <a
                        routerLink="/auth/register"
                        (click)="closeAdoptionModal()"
                        class="flex-1 py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold text-center cursor-pointer"
                      >
                        Registrarme
                      </a>
                    </div>
                  </div>
                } @else {
                  <!-- Authenticated Form -->
                  <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                    <span class="text-base sm:text-lg">📋</span>
                    <div class="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                      <strong class="text-emerald-700 dark:text-emerald-400">Protocolo de Adopción Responsable:</strong>
                      Responde este cuestionario para que el rescatista evalúe tu solicitud. Todas las preguntas y compromisos son obligatorios.
                    </div>
                  </div>

                  <div class="space-y-3.5">
                    <!-- 1. Tipo de Vivienda -->
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        1. ¿En qué tipo de vivienda vivirá la mascota? <span class="text-rose-500">*</span>
                      </label>
                      <select
                        [(ngModel)]="adoptionForm.housingType"
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
                        [(ngModel)]="adoptionForm.familyAgreed"
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
                        [(ngModel)]="adoptionForm.currentPets"
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
                        [(ngModel)]="adoptionForm.relocationPlan"
                        placeholder="Ej: La mascota siempre se muda con nosotros / Familiares directos de apoyo"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <!-- 5. Motivo y Tiempo Diario -->
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        5. ¿Por qué deseas adoptar a {{ selectedPetForAdoption()!.name }} y cuánto tiempo le dedicarás? <span class="text-rose-500">*</span>
                      </label>
                      <textarea
                        [(ngModel)]="adoptionForm.reason"
                        rows="2"
                        placeholder="Platícanos sobre tu rutina diaria, paseos y el cariño que recibirá en tu hogar..."
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      ></textarea>
                    </div>

                    <!-- 6. Compromisos Obligatorios del Convenio (Checkboxes) -->
                    <div class="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-300/80 dark:border-slate-700/80 space-y-2.5">
                      <span class="block text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        📜 Compromisos Obligatorios del Convenio de Adopción:
                      </span>

                      <label class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          [(ngModel)]="adoptionForm.agreeNoAbandon"
                          class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span class="text-[11px] leading-tight">
                          <strong>Miembro de la familia:</strong> Tendrá agua, alimento, cariño y atención médica. Jamás estará amarrado, en azoteas, ni será regalado, vendido o reubicado sin consentimiento previo.
                        </span>
                      </label>

                      <label class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          [(ngModel)]="adoptionForm.agreeSterilization"
                          class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span class="text-[11px] leading-tight">
                          <strong>Esterilización y salud:</strong> Me comprometo a su esterilización obligatoria (a los 5-6 meses si es cachorro) y a mantener su cuadro de vacunas y desparasitación al día.
                        </span>
                      </label>

                      <label class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          [(ngModel)]="adoptionForm.agreeFollowup"
                          class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span class="text-[11px] leading-tight">
                          <strong>Seguimiento de bienestar:</strong> Acepto compartir fotos y recibir seguimiento periódico (a las 2 semanas, 1 mes, 6 meses y al año) para constatar su adaptación.
                        </span>
                      </label>
                    </div>
                  </div>

                  @if (!isAdoptionFormValid()) {
                    <p class="text-[11px] text-amber-600 dark:text-amber-400 font-medium text-center bg-amber-500/10 rounded-xl p-2 border border-amber-500/20">
                      ⚠️ Responde las 5 preguntas y marca los 3 compromisos del convenio para habilitar el envío.
                    </p>
                  }

                  <!-- Submit Action -->
                  <div class="pt-2 flex gap-2">
                    <button
                      (click)="submitAdoptionRequest()"
                      [disabled]="isSubmittingAdoption() || !isAdoptionFormValid()"
                      class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      @if (isSubmittingAdoption()) {
                        <div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>Enviando solicitud...</span>
                      } @else {
                        <span>🐾 Enviar Solicitud Formal</span>
                      }
                    </button>
                    <button
                      (click)="closeAdoptionModal()"
                      class="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL: REPORTAR AVISTAMIENTO ("¡LO HE VISTO!")           -->
      <!-- ======================================================== -->
      @if (selectedLostPetForSighting()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div class="liquid-glass rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-rose-500/30 overflow-hidden space-y-5">
            <button
              (click)="closeSightingModal()"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>

            <div class="flex items-center gap-3">
              <span class="text-3xl">👀</span>
              <div>
                <h3 class="text-lg font-black text-slate-900 dark:text-white">
                  Reportar Avistamiento de {{ selectedLostPetForSighting()!.petName }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Ayuda a la familia en Dolores Hidalgo indicando dónde y cuándo lo viste.
                </p>
              </div>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  ¿Dónde lo viste? (Colonia o punto de referencia en Dolores Hgo.)
                </label>
                <input
                  type="text"
                  [(ngModel)]="sightingForm.locationDescription"
                  placeholder="Ej: Pasando la glorieta de la Alameda, cerca de la tienda..."
                  class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Notas adicionales (¿En qué estado iba? ¿Tenía compañía?)
                </label>
                <textarea
                  [(ngModel)]="sightingForm.additionalNotes"
                  rows="3"
                  placeholder="Iba caminando despacio en dirección al mercado..."
                  class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Foto del avistamiento (Opcional)
                </label>
                <div class="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 mb-2 gap-1 text-xs font-bold max-w-sm">
                  <button
                    type="button"
                    (click)="sightingPhotoSource.set('FILE')"
                    [ngClass]="{ 'bg-rose-500 text-white shadow': sightingPhotoSource() === 'FILE', 'text-slate-600 dark:text-slate-400': sightingPhotoSource() !== 'FILE' }"
                    class="flex-1 py-1 rounded-lg transition-all cursor-pointer text-center"
                  >
                    📁 Desde mi dispositivo
                  </button>
                  <button
                    type="button"
                    (click)="sightingPhotoSource.set('URL')"
                    [ngClass]="{ 'bg-rose-500 text-white shadow': sightingPhotoSource() === 'URL', 'text-slate-600 dark:text-slate-400': sightingPhotoSource() !== 'URL' }"
                    class="flex-1 py-1 rounded-lg transition-all cursor-pointer text-center"
                  >
                    🔗 Pegar enlace URL
                  </button>
                </div>

                @if (sightingPhotoSource() === 'FILE') {
                  <label class="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 rounded-2xl p-3 cursor-pointer bg-white/40 dark:bg-slate-900/40 text-center">
                    <span class="text-xl mb-0.5">📷</span>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Seleccionar foto desde celular o PC</span>
                    <input
                      type="file"
                      accept="image/*"
                      (change)="onSightingFileSelected($event)"
                      class="hidden"
                    />
                  </label>
                } @else {
                  <input
                    type="url"
                    [(ngModel)]="sightingForm.photoUrl"
                    (ngModelChange)="sightingPhotoPreview.set($event)"
                    placeholder="https://... o enlace directo"
                    class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                }

                @if (sightingPhotoPreview() || sightingForm.photoUrl) {
                  <div class="mt-2 p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-rose-500/30 flex items-center gap-2">
                    <img
                      [src]="sightingPhotoPreview() || sightingForm.photoUrl"
                      alt="Foto avistamiento"
                      class="w-12 h-12 rounded-lg object-cover"
                    />
                    <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Foto lista</span>
                  </div>
                }
              </div>

              <div class="pt-2 flex gap-2">
                <button
                  (click)="submitSighting()"
                  [disabled]="isSubmittingSighting() || !sightingForm.locationDescription.trim()"
                  class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  @if (isSubmittingSighting()) {
                    <span>Enviando avistamiento...</span>
                  } @else {
                    <span>🚨 Enviar Aviso a la Familia</span>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL: REPORTAR MASCOTA EXTRAVIADA / ENCONTRADA EN DH    -->
      <!-- ======================================================== -->
      @if (isReportLostModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 animate-fadeIn">
          <div class="bg-white/95 dark:bg-slate-900/95 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl relative border border-rose-500/30 overflow-hidden space-y-4 max-h-[92vh] overflow-y-auto">
            
            <button
              (click)="closeReportLostModal()"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>

            @if (reportLostSuccess()) {
              <!-- SUCCESS STATE WITH DIRECT WHATSAPP BROADCAST BUTTON -->
              <div class="text-center py-6 space-y-4 animate-scaleUp">
                <div class="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 text-3xl flex items-center justify-center mx-auto border-2 border-rose-500">
                  🚨
                </div>
                <h4 class="text-lg font-black text-slate-900 dark:text-white">
                  ¡Alerta Registrada con Éxito!
                </h4>
                <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                  El reporte de <strong>{{ reportLostSuccess()!.petName || 'la mascota' }}</strong> ya está publicado en el Muro de Dolores Hidalgo. Difúndelo ahora mismo en tus grupos y redes:
                </p>

                <!-- WhatsApp Broadcast Button -->
                <a
                  [href]="getLostBroadcastWhatsAppUrl(reportLostSuccess()!)"
                  target="_blank"
                  (click)="closeReportLostModal()"
                  class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>📢</span>
                  <span>Difundir Alerta por WhatsApp</span>
                </a>

                <button
                  (click)="closeReportLostModal()"
                  class="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                >
                  Ver reporte en el Muro
                </button>
              </div>
            } @else {
              <!-- REPORT FORM -->
              <div class="space-y-4">
                <div class="flex items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div class="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                    ✍️
                  </div>
                  <div>
                    <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {{ editingReportId() ? 'Editar Publicación del Muro' : 'Crear Publicación en el Muro Comunitario' }}
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      Bienestar animal, reportes y solidaridad en Dolores Hidalgo
                    </p>
                  </div>
                </div>

                <!-- Publication Type Selector (5 Distinct Types) -->
                <div>
                  <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px] mb-1.5">
                    ¿Qué deseas publicar hoy? *
                  </label>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <!-- 1. Animal Herido -->
                    <button
                      type="button"
                      (click)="setModalPublicationType('ANIMAL_HERIDO')"
                      [ngClass]="reportLostForm.type === 'ANIMAL_HERIDO' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold' : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'"
                      class="p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1 border border-transparent"
                    >
                      <span class="text-base">🚨</span>
                      <span class="text-xs leading-tight">1. Animal Herido</span>
                      <span class="text-[9px] opacity-80 leading-tight">Urgencia en la calle</span>
                    </button>

                    <!-- 2. En Resguardo -->
                    <button
                      type="button"
                      (click)="setModalPublicationType('EN_RESGUARDO')"
                      [ngClass]="reportLostForm.type === 'EN_RESGUARDO' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-bold' : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'"
                      class="p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1 border border-transparent"
                    >
                      <span class="text-base">🏠</span>
                      <span class="text-xs leading-tight">2. En Resguardo</span>
                      <span class="text-[9px] opacity-80 leading-tight">Lo tengo bajo resguardo</span>
                    </button>

                    <!-- 3. Dar en Adopción -->
                    <button
                      type="button"
                      (click)="setModalPublicationType('EN_ADOPCION')"
                      [ngClass]="reportLostForm.type === 'EN_ADOPCION' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-bold' : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'"
                      class="p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1 border border-transparent"
                    >
                      <span class="text-base">💚</span>
                      <span class="text-xs leading-tight">3. Dar en Adopción</span>
                      <span class="text-[9px] opacity-80 leading-tight">Busco hogar adoptivo</span>
                    </button>

                    <!-- 4. Se Busca -->
                    <button
                      type="button"
                      (click)="setModalPublicationType('SE_BUSCA')"
                      [ngClass]="reportLostForm.type === 'SE_BUSCA' || reportLostForm.type === 'EXTRAVIADA' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 font-bold' : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'"
                      class="p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1 border border-transparent"
                    >
                      <span class="text-base">🔍</span>
                      <span class="text-xs leading-tight">4. Se Busca</span>
                      <span class="text-[9px] opacity-80 leading-tight">Mascota extraviada</span>
                    </button>

                    <!-- 5. Campaña Comunitaria -->
                    <button
                      type="button"
                      (click)="setModalPublicationType('CAMPANA_COMUNITARIA')"
                      [ngClass]="reportLostForm.type === 'CAMPANA_COMUNITARIA' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold' : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'"
                      class="p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1 border border-transparent col-span-2 sm:col-span-2"
                    >
                      <span class="text-base">📢</span>
                      <span class="text-xs leading-tight">5. Campaña o Aviso Comunitario</span>
                      <span class="text-[9px] opacity-80 leading-tight">Esterilización, vacunas, colecta o aviso para rescatistas</span>
                    </button>
                  </div>

                  <!-- Type explanation card -->
                  <div class="mt-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    @if (reportLostForm.type === 'ANIMAL_HERIDO') {
                      <span>🚨 <strong>Animal Herido:</strong> Reportas para informar sobre un animalito lastimado o en peligro en la calle para que quien pueda o esté cerca acuda a ayudarlo.</span>
                    } @else if (reportLostForm.type === 'EN_RESGUARDO') {
                      <span>🏠 <strong>En Resguardo Temporal:</strong> Encontraste a un animal y le diste resguardo temporal esperando a que aparezca su dueño, o para orientarte y buscarle adopción.</span>
                    } @else if (reportLostForm.type === 'EN_ADOPCION') {
                      <span>💚 <strong>Dar en Adopción:</strong> Estás dando en adopción a un animal (rescatado o bajo tu tutela) para que una familia responsable lo adopte.</span>
                    } @else if (reportLostForm.type === 'SE_BUSCA' || reportLostForm.type === 'EXTRAVIADA') {
                      <span>🔍 <strong>Se Busca Mascota:</strong> Estás buscando a tu mascota porque se te extravió; activa la búsqueda vecinal con opción a recompensa.</span>
                    } @else if (reportLostForm.type === 'CAMPANA_COMUNITARIA') {
                      <span>📢 <strong>Campaña / Aviso:</strong> Para rescatistas y ciudadanos que organizan campañas de salud, esterilización o colectas solidarias en Dolores Hidalgo.</span>
                    }
                  </div>
                </div>

                <!-- Form Fields Grid (Adaptativo y Contextual) -->
                <div class="space-y-3 text-xs">
                  <div class="grid grid-cols-1" [ngClass]="currentCategoryConfig.showSpeciesAndGender ? 'sm:grid-cols-2 gap-3' : 'gap-0'">
                    <div>
                      <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        {{ currentCategoryConfig.titleLabel }}
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="reportLostForm.petName"
                        [placeholder]="currentCategoryConfig.titlePlaceholder"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    @if (currentCategoryConfig.showSpeciesAndGender) {
                      <div>
                        <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Especie y Género
                        </label>
                        <div class="grid grid-cols-2 gap-2">
                          <select
                            [(ngModel)]="reportLostForm.species"
                            class="w-full px-2 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="Perro">🐕 Perro</option>
                            <option value="Gato">🐈 Gato</option>
                            <option value="Otro">🐾 Otro</option>
                          </select>
                          <select
                            [(ngModel)]="reportLostForm.gender"
                            class="w-full px-2 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="Macho">Macho</option>
                            <option value="Hembra">Hembra</option>
                            <option value="Desconocido">Desconocido</option>
                          </select>
                        </div>
                      </div>
                    }
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div class="flex items-center justify-between gap-1 mb-1">
                        <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                          Colonia en Dolores Hidalgo
                        </label>
                        <input
                          type="text"
                          [ngModel]="modalPostalFilter()"
                          (ngModelChange)="modalPostalFilter.set($event)"
                          placeholder="Filtrar C.P. (ej. 37800)"
                          class="w-32 px-2 py-0.5 text-[10px] rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <select
                        [(ngModel)]="reportLostForm.coloniaId"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="">Selecciona la colonia...</option>
                        @for (col of filteredModalColonias(); track col.id) {
                          <option [value]="col.id">{{ col.postalCode ? '[' + col.postalCode + '] ' : '' }}{{ col.name }}</option>
                        }
                      </select>
                    </div>

                    <div>
                      <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Teléfono de Contacto (WhatsApp)
                      </label>
                      <input
                        type="tel"
                        [(ngModel)]="reportLostForm.contactPhone"
                        placeholder="Ej: 4181234567"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      {{ currentCategoryConfig.locationLabel }}
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="reportLostForm.lastSeenLocation"
                      [placeholder]="currentCategoryConfig.locationPlaceholder"
                      class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      {{ currentCategoryConfig.descriptionLabel }}
                    </label>
                    <textarea
                      [(ngModel)]="reportLostForm.distinctiveFeatures"
                      rows="2"
                      [placeholder]="currentCategoryConfig.descriptionPlaceholder"
                      class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                    ></textarea>
                  </div>

                  <!-- Temperamento y Convivencia (Condicional) -->
                  @if (currentCategoryConfig.showTemperamentTags) {
                    <div class="p-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div class="flex items-center justify-between">
                        <label class="block font-bold text-slate-800 dark:text-slate-200 uppercase text-[11px] flex items-center gap-1.5">
                          <span>🏷️</span> Temperamento y Convivencia
                        </label>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          {{ reportLostForm.temperamentTags.length }} seleccionada(s)
                        </span>
                      </div>
                      <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                        Elige únicamente los rasgos observados. No asumimos conductas automáticas para evitar confusiones al adoptante.
                      </p>
                      <div class="flex flex-wrap gap-1.5 pt-1">
                        @for (tag of availableTemperamentTags; track tag) {
                          <button
                            type="button"
                            (click)="toggleTemperamentTag(tag)"
                            [ngClass]="isTagSelected(tag)
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                              : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'"
                            class="px-2.5 py-1 rounded-xl text-[11px] border transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                          >
                            <span>{{ isTagSelected(tag) ? '✓' : '+' }}</span>
                            <span>{{ tag }}</span>
                          </button>
                        }
                      </div>
                    </div>
                  }

                  <!-- Fotografía / Galería Multi-Imagen (Límite por Rol: 3 Usuario / 6 Rescatista-Admin) -->
                  <div class="p-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                        {{ currentCategoryConfig.photoLabel }}
                      </label>
                      <span
                        class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border"
                        [ngClass]="reportLostPhotosList().length >= authService.maxPhotosAllowed()
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'"
                      >
                        📷 {{ reportLostPhotosList().length }} / {{ authService.maxPhotosAllowed() }} fotos
                      </span>
                    </div>

                    <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Puedes subir hasta <strong>{{ authService.maxPhotosAllowed() }} fotografías</strong> ({{ authService.maxPhotosAllowed() === 6 ? 'Límite ampliado para Rescatistas / Admin' : 'Hasta 3 fotos para usuarios y 6 para rescatistas/admin' }}).
                    </p>

                    @if (reportLostPhotosList().length < authService.maxPhotosAllowed()) {
                      <div class="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 gap-1 text-xs font-bold max-w-sm">
                        <button
                          type="button"
                          (click)="reportLostPhotoSource.set('FILE')"
                          [ngClass]="{ 'bg-emerald-600 text-white shadow': reportLostPhotoSource() === 'FILE', 'text-slate-600 dark:text-slate-400': reportLostPhotoSource() !== 'FILE' }"
                          class="flex-1 py-1 rounded-lg transition-all cursor-pointer text-center"
                        >
                          📁 Desde mi dispositivo
                        </button>
                        <button
                          type="button"
                          (click)="reportLostPhotoSource.set('URL')"
                          [ngClass]="{ 'bg-emerald-600 text-white shadow': reportLostPhotoSource() === 'URL', 'text-slate-600 dark:text-slate-400': reportLostPhotoSource() !== 'URL' }"
                          class="flex-1 py-1 rounded-lg transition-all cursor-pointer text-center"
                        >
                          🔗 Pegar enlace URL
                        </button>
                      </div>

                      @if (reportLostPhotoSource() === 'FILE') {
                        <label class="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-4 cursor-pointer bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all text-center">
                          <span class="text-2xl mb-1">📷</span>
                          <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Toca para agregar {{ reportLostPhotosList().length > 0 ? 'más fotos' : 'imágenes' }} desde celular o PC
                          </span>
                          <span class="text-[10px] text-slate-500 dark:text-slate-400">
                            Disponibles: {{ authService.maxPhotosAllowed() - reportLostPhotosList().length }} foto(s) más
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            (change)="onReportLostFileSelected($event)"
                            class="hidden"
                          />
                        </label>
                      } @else {
                        <div class="flex items-center gap-2">
                          <input
                            type="url"
                            [(ngModel)]="reportLostForm.photoUrl"
                            (keyup.enter)="addPhotoUrlToList()"
                            placeholder="https://... pega el enlace de la imagen"
                            class="flex-1 px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            (click)="addPhotoUrlToList()"
                            [disabled]="!reportLostForm.photoUrl.trim()"
                            class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40 cursor-pointer transition-all"
                          >
                            + Agregar
                          </button>
                        </div>
                      }
                    } @else {
                      <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 font-semibold text-center">
                        Has alcanzado el límite máximo de {{ authService.maxPhotosAllowed() }} fotografías para esta publicación.
                      </div>
                    }

                    <!-- Cuadrícula de Miniaturas Cargadas -->
                    @if (reportLostPhotosList().length > 0) {
                      <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                        @for (item of reportLostPhotosList(); track item.previewUrl) {
                          <div class="relative group rounded-xl overflow-hidden aspect-square border-2 border-emerald-500/40 bg-slate-900/40 shadow-sm">
                            <img
                              [src]="item.previewUrl"
                              alt="Foto cargada"
                              decoding="async"
                              class="w-full h-full object-cover"
                            />
                            @if ($index === 0) {
                              <span class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[8px] uppercase shadow">
                                Portada
                              </span>
                            }
                            <button
                              type="button"
                              (click)="removeReportLostPhoto($index)"
                              class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow cursor-pointer"
                              title="Quitar esta foto"
                            >
                              ✕
                            </button>
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- Recompensa (Opcional, solo extravíos) -->
                  @if (currentCategoryConfig.showRewardOption) {
                    <div class="flex items-center gap-3 pt-1">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          [(ngModel)]="reportLostForm.rewardOffered"
                          class="rounded text-rose-500 focus:ring-rose-400"
                        />
                        <span class="font-bold text-slate-700 dark:text-slate-300">Ofrecer gratificación o recompensa</span>
                      </label>
                      @if (reportLostForm.rewardOffered) {
                        <input
                          type="text"
                          [(ngModel)]="reportLostForm.rewardDetails"
                          placeholder="Monto o gratificación..."
                          class="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-amber-400 text-slate-800 dark:text-white focus:outline-none"
                        />
                      }
                    </div>
                  }

                  <!-- Checkbox Mascota Herida / En Peligro Urgente -->
                  @if (currentCategoryConfig.showInjuredCheckbox) {
                    <div
                      class="p-3 rounded-2xl border flex items-start gap-2.5 transition-all"
                      [ngClass]="currentCategoryConfig.isInjuredLocked
                        ? 'bg-rose-500/15 border-rose-500/40 ring-2 ring-rose-500/20'
                        : 'bg-rose-500/10 border-rose-500/25'"
                    >
                      <input
                        type="checkbox"
                        id="isInjuredCheckbox"
                        [(ngModel)]="reportLostForm.isInjured"
                        [disabled]="!!currentCategoryConfig.isInjuredLocked"
                        class="rounded text-rose-600 focus:ring-rose-500 mt-0.5 h-4 w-4 cursor-pointer disabled:opacity-80"
                      />
                      <label for="isInjuredCheckbox" class="text-xs cursor-pointer select-none">
                        <span class="font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                          <span>🚨</span> ¿La mascota está herida o requiere atención médica urgente?
                          @if (currentCategoryConfig.isInjuredLocked) {
                            <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">
                              Prioridad Máxima
                            </span>
                          }
                        </span>
                        <span class="text-slate-600 dark:text-slate-400 text-[11px] block mt-0.5 leading-tight">
                          Al tratarse de un Animal Herido, se eleva la prioridad comunitaria y solo se agrupará en cascada si otro vecino reporta exactamente al mismo animal herido (misma colonia, especie, género, ubicación y señas).
                        </span>
                      </label>
                    </div>
                  }

                  <div class="pt-3 flex gap-2">
                    <button
                      (click)="submitReportLost()"
                      [disabled]="isSubmittingReportLost() || !reportLostForm.petName.trim() || !reportLostForm.lastSeenLocation.trim() || !reportLostForm.distinctiveFeatures.trim()"
                      class="flex-1 py-3 px-4 rounded-xl text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all bg-gradient-to-r"
                      [ngClass]="currentCategoryConfig.submitButtonGradient"
                    >
                      @if (isSubmittingReportLost()) {
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Publicando...</span>
                      } @else {
                        <span>{{ editingReportId() ? '💾 Guardar Cambios' : currentCategoryConfig.submitButtonIcon + ' ' + currentCategoryConfig.submitButtonText }}</span>
                      }
                    </button>
                    <button
                      (click)="closeReportLostModal()"
                      class="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL LIGHTBOX: VISOR DE IMÁGENES A PANTALLA COMPLETA    -->
      <!-- ======================================================== -->
      @if (lightboxPost()) {
        <div
          class="fixed inset-0 z-[70] bg-slate-950/92 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 animate-fadeIn select-none"
          (click)="closeLightbox()"
        >
          <!-- Top Bar -->
          <div class="w-full max-w-5xl flex items-center justify-between gap-4 text-white z-10" (click)="$event.stopPropagation()">
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-black truncate">{{ lightboxPost()!.title }}</h3>
              <p class="text-[11px] text-slate-300 truncate">
                📍 {{ lightboxPost()!.coloniaName || 'Dolores Hidalgo' }} • Foto {{ lightboxIndex() + 1 }} de {{ lightboxPost()!.photos.length }}
              </p>
            </div>
            <button
              type="button"
              (click)="closeLightbox()"
              class="w-9 h-9 rounded-full bg-white/15 hover:bg-rose-600 text-white flex items-center justify-center text-sm font-black transition-colors cursor-pointer flex-shrink-0"
              title="Cerrar visor"
            >
              ✕
            </button>
          </div>

          <!-- Main Fullscreen Image Area -->
          <div class="relative flex-1 w-full max-w-5xl flex items-center justify-center my-2 overflow-hidden" (click)="$event.stopPropagation()">
            @if (lightboxPost()!.photos.length > 1) {
              <button
                type="button"
                (click)="prevLightboxPhoto()"
                class="absolute left-2 sm:left-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-emerald-500 text-white hover:text-slate-950 flex items-center justify-center text-xl font-black shadow-xl transition-all cursor-pointer"
                title="Foto anterior"
              >
                ‹
              </button>
            }

            <img
              [src]="lightboxPost()!.photos[lightboxIndex()]"
              [alt]="lightboxPost()!.title"
              class="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 transition-all"
            />

            @if (lightboxPost()!.photos.length > 1) {
              <button
                type="button"
                (click)="nextLightboxPhoto()"
                class="absolute right-2 sm:right-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-emerald-500 text-white hover:text-slate-950 flex items-center justify-center text-xl font-black shadow-xl transition-all cursor-pointer"
                title="Siguiente foto"
              >
                ›
              </button>
            }
          </div>

          <!-- Bottom Thumbnails Strip -->
          @if (lightboxPost()!.photos.length > 1) {
            <div class="flex items-center justify-center gap-2 overflow-x-auto max-w-full py-1 z-10" (click)="$event.stopPropagation()">
              @for (img of lightboxPost()!.photos; track $index) {
                <button
                  type="button"
                  (click)="lightboxIndex.set($index)"
                  class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0"
                  [ngClass]="lightboxIndex() === $index ? 'border-emerald-400 scale-105 shadow-lg' : 'border-transparent opacity-50 hover:opacity-90'"
                >
                  <img [src]="img" alt="Miniatura galería" class="w-full h-full object-cover" />
                </button>
              }
            </div>
          }
        </div>
      }

    </div>
  `,
})
export class CommunityFeedComponent implements OnInit, OnDestroy {
  brand = BRAND_CONFIG;

  get currentCategoryConfig(): FormCategoryConfig {
    switch (this.reportLostForm.type) {
      case 'ANIMAL_HERIDO':
        return {
          titleLabel: 'Apodo o referencia del animal herido',
          titlePlaceholder: 'Ej: Cachorrito atropellado, Gato lastimado...',
          showSpeciesAndGender: true,
          locationLabel: 'Ubicación exacta donde se encuentra el animal *',
          locationPlaceholder: 'Ej: Av. José Alfredo Jiménez, esquina con C. Guanajuato (frente a la gasolinera)...',
          descriptionLabel: 'Descripción de la emergencia y lesiones visibles *',
          descriptionPlaceholder: 'Ej: Tiene herida visible en patita, no puede caminar, requiere auxilio veterinario urgente...',
          showTemperamentTags: false,
          showInjuredCheckbox: true,
          isInjuredLocked: true,
          showRewardOption: false,
          photoLabel: 'Fotografía de la urgencia (Muy recomendada para ubicarlo)',
          photoPlaceholder: 'Foto del animalito para que los rescatistas lo reconozcan rápidamente',
          submitButtonText: 'Publicar Alerta de Urgencia',
          submitButtonGradient: 'from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30',
          submitButtonIcon: '🚨',
        };
      case 'EN_RESGUARDO':
        return {
          titleLabel: 'Nombre o apodo temporal del animal',
          titlePlaceholder: 'Ej: Canelo, Manchas, Güero...',
          showSpeciesAndGender: true,
          locationLabel: 'Colonia o lugar donde fue encontrado / donde se resguarda *',
          locationPlaceholder: 'Ej: Encontrado en La Alameda, actualmente bajo resguardo en Col. Lindavista...',
          descriptionLabel: 'Señas particulares para identificar a su dueño o adoptante *',
          descriptionPlaceholder: 'Ej: Traía collar rojo sin placa, pecho blanco, ojos miel, tamaño mediano...',
          showTemperamentTags: true,
          showInjuredCheckbox: true,
          isInjuredLocked: false,
          showRewardOption: false,
          photoLabel: 'Fotografía del animal bajo resguardo',
          photoPlaceholder: 'Foto clara para que su familia o adoptante lo reconozca',
          submitButtonText: 'Publicar Animal en Resguardo',
          submitButtonGradient: 'from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/30',
          submitButtonIcon: '🏠',
        };
      case 'EN_ADOPCION':
        return {
          titleLabel: 'Nombre de la mascota en adopción *',
          titlePlaceholder: 'Ej: Rocky, Luna, Milo...',
          showSpeciesAndGender: true,
          locationLabel: 'Colonia o zona de referencia en Dolores Hidalgo *',
          locationPlaceholder: 'Ej: Col. Lindavista, Centro Histórico, La Morera...',
          descriptionLabel: 'Historia de la mascota y requisitos de adopción *',
          descriptionPlaceholder: 'Ej: Rescatado hace un mes, sociable, cariñoso, busca hogar amoroso y responsable con espacio seguro...',
          showTemperamentTags: true,
          showInjuredCheckbox: false,
          isInjuredLocked: false,
          showRewardOption: false,
          photoLabel: 'Fotografía de la mascota (Indispensable para adopción)',
          photoPlaceholder: 'Sube una foto bonita donde se aprecie su carita y cuerpo completo',
          submitButtonText: 'Publicar en Adopción',
          submitButtonGradient: 'from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30',
          submitButtonIcon: '💚',
        };
      case 'CAMPANA_COMUNITARIA':
        return {
          titleLabel: 'Título de la campaña, evento o aviso comunitario *',
          titlePlaceholder: 'Ej: Campaña de Esterilización Gratuita en La Morera',
          showSpeciesAndGender: false,
          locationLabel: 'Lugar, sede o dirección del evento *',
          locationPlaceholder: 'Ej: Centro Comunitario La Alameda, Calle Hidalgo #123...',
          descriptionLabel: 'Descripción, fechas, horarios y requisitos del evento *',
          descriptionPlaceholder: 'Ej: Sábado 15 de Noviembre a las 9:00 AM. Requisitos: 8 horas de ayuno previo, traer manta limpia, cuota de recuperación de $150 para insumos...',
          showTemperamentTags: false,
          showInjuredCheckbox: false,
          isInjuredLocked: false,
          showRewardOption: false,
          photoLabel: 'Afiche, volante o imagen informativa del evento',
          photoPlaceholder: 'Cartel promocional o fotografía informativa del evento',
          submitButtonText: 'Publicar Campaña o Aviso',
          submitButtonGradient: 'from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30',
          submitButtonIcon: '📢',
        };
      case 'SE_BUSCA':
      default:
        return {
          titleLabel: 'Nombre de tu mascota extraviada *',
          titlePlaceholder: 'Ej: Bobby, Milaneso, Nube...',
          showSpeciesAndGender: true,
          locationLabel: 'Lugar exacto o punto donde se extravió / vio por última vez *',
          locationPlaceholder: 'Ej: Se salió de la casa en Col. La Presita, visto por última vez cerca del Parque...',
          descriptionLabel: 'Señas particulares para reconocerlo *',
          descriptionPlaceholder: 'Ej: Collar café con cascabel, cicatriz en oreja izquierda, mancha negra en el lomo, es tímido...',
          showTemperamentTags: true,
          showInjuredCheckbox: true,
          isInjuredLocked: false,
          showRewardOption: true,
          photoLabel: 'Fotografía reciente de tu mascota',
          photoPlaceholder: 'Foto clara donde se aprecien sus señas para que los vecinos lo identifiquen',
          submitButtonText: 'Publicar Alerta de Búsqueda',
          submitButtonGradient: 'from-rose-500 via-pink-600 to-rose-600 hover:from-rose-400 hover:to-pink-500 shadow-rose-500/30',
          submitButtonIcon: '🔍',
        };
    }
  }
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private petService = inject(PetService);
  private lostPetService = inject(LostPetService);
  private coloniaService = inject(ColoniaService);
  private adoptionService = inject(AdoptionService);
  public authService = inject(AuthService);
  private notify = inject(NotificationService);
  private imageUploadService = inject(ImageUploadService);
  private confirmService = inject(ConfirmService);

  // Data signals
  allPosts = signal<FeedPost[]>([]);
  colonias = signal<Colonia[]>([]);
  isLoading = signal<boolean>(true);
  isRefreshingFeed = signal<boolean>(false);
  pendingNewPostsCount = signal<number>(0);
  isScrolledDown = signal<boolean>(false);
  private bufferedFreshPosts: FeedPost[] | null = null;
  private commentsPollingTimer: any = null;
  private feedPollingTimer: any = null;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.isScrolledDown.set(window.scrollY > 280);
    }
  }

  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Lightbox Gallery state
  lightboxPost = signal<FeedPost | null>(null);
  lightboxIndex = signal<number>(0);

  // Multi-photo upload list for publication modal
  reportLostPhotosList = signal<Array<{ previewUrl: string; file?: File; existingUrl?: string }>>([]);

  // Filters (Signals reactivos para Zoneless Angular 22)
  activeFilter = signal<FeedFilterType>('ALL');
  searchQuery = signal<string>('');
  selectedColoniaId = signal<string>('');
  selectedSpecies = signal<string>('');
  modalPostalFilter = signal<string>('');
  highlightedPostId = signal<string | null>(null);
  filterGoodWithKids = signal<boolean>(false);
  filterGoodWithPets = signal<boolean>(false);
  showFiltersPanel = signal<boolean>(false);

  filteredModalColonias = computed(() => {
    const q = this.normalizeText(this.modalPostalFilter());
    const all = this.colonias();
    if (!q) return all;
    return all.filter(
      (c) =>
        this.normalizeText(c.name).includes(q) ||
        (c.postalCode || '').includes(q),
    );
  });

  private normalizeText(value?: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Adoption modal state (Item #2)
  selectedPetForAdoption = signal<Pet | null>(null);
  adoptionSubmittedSuccess = signal<boolean>(false);
  isSubmittingAdoption = signal<boolean>(false);
  adoptionForm = {
    housingType: 'CASA_PROPIA_PATIO',
    familyAgreed: 'SI_FAMILIA',
    currentPets: '',
    relocationPlan: '',
    reason: '',
    agreeNoAbandon: false,
    agreeSterilization: false,
    agreeFollowup: false,
  };

  // Sighting modal state
  selectedLostPetForSighting = signal<LostPetReport | null>(null);
  isSubmittingSighting = signal<boolean>(false);
  sightingPhotoSource = signal<'FILE' | 'URL'>('FILE');
  sightingPhotoPreview = signal<string | null>(null);
  sightingSelectedFile = signal<File | null>(null);
  sightingForm = {
    locationDescription: '',
    photoUrl: '',
    additionalNotes: '',
  };

  // Computed filtered posts
  filteredPosts = computed(() => {
    let posts = this.allPosts();
    const filter = this.activeFilter();
    const query = this.normalizeText(this.searchQuery());
    const coloniaId = this.selectedColoniaId();
    const species = this.normalizeText(this.selectedSpecies());
    const kids = this.filterGoodWithKids();
    const pets = this.filterGoodWithPets();

    // 1. Kind/Type filter
    if (filter === 'ANIMAL_HERIDO') {
      posts = posts.filter((p) => p.postType === 'ANIMAL_HERIDO' || (p.kind === 'LOST_PET' && p.isInjured));
    } else if (filter === 'EN_RESGUARDO') {
      posts = posts.filter((p) => p.postType === 'EN_RESGUARDO' || p.postType === 'ENCONTRADA_EN_CALLE');
    } else if (filter === 'EN_ADOPCION' || filter === 'ADOPTION') {
      posts = posts.filter((p) => p.kind === 'PET_ADOPTION' || p.postType === 'EN_ADOPCION');
    } else if (filter === 'SE_BUSCA' || filter === 'LOST') {
      posts = posts.filter((p) => p.postType === 'SE_BUSCA' || p.postType === 'EXTRAVIADA');
    } else if (filter === 'CAMPANA_COMUNITARIA') {
      posts = posts.filter((p) => p.postType === 'CAMPANA_COMUNITARIA');
    } else if (filter === 'FOUND') {
      posts = posts.filter((p) => p.postType === 'EN_RESGUARDO' || p.postType === 'ENCONTRADA_EN_CALLE');
    }

    // 2. Search query (busca en título, descripción, especie, raza, colonia, ubicación, autor y temperamento)
    if (query) {
      posts = posts.filter((p) => {
        const haystack = [
          p.title,
          p.description,
          p.species,
          p.breed,
          p.coloniaName,
          p.lastSeenLocation,
          p.authorName,
          ...(p.temperamentTags || []),
        ]
          .map((item) => this.normalizeText(item))
          .join(' ');
        return haystack.includes(query);
      });
    }

    // 3. Colonia
    if (coloniaId) {
      posts = posts.filter((p) => {
        if (p.kind === 'PET_ADOPTION') {
          return p.petData?.coloniaId === coloniaId;
        } else {
          return p.lostData?.coloniaId === coloniaId;
        }
      });
    }

    // 4. Species
    if (species) {
      posts = posts.filter((p) => this.normalizeText(p.species) === species);
    }

    // 5. Behavioral / Quick filters (aplica tanto a adopciones como a reportes con etiquetas de temperamento)
    if (kids) {
      posts = posts.filter(
        (p) =>
          p.goodWithKids === true ||
          (p.temperamentTags || []).some((t) => this.normalizeText(t).includes('ninos')),
      );
    }
    if (pets) {
      posts = posts.filter(
        (p) =>
          p.goodWithOtherPets === true ||
          (p.temperamentTags || []).some(
            (t) =>
              this.normalizeText(t).includes('perros') ||
              this.normalizeText(t).includes('gatos') ||
              this.normalizeText(t).includes('mascotas'),
          ),
      );
    }

    return posts;
  });

  // Report lost modal state
  isReportLostModalOpen = signal<boolean>(false);
  reportLostSuccess = signal<LostPetReport | null>(null);
  isSubmittingReportLost = signal<boolean>(false);
  reportLostPhotoSource = signal<'FILE' | 'URL'>('FILE');
  reportLostPhotoPreview = signal<string | null>(null);
  reportLostSelectedFile = signal<File | null>(null);
  reportLostForm = {
    type: 'ANIMAL_HERIDO' as LostPetType,
    species: 'Perro',
    petName: '',
    gender: 'Macho',
    coloniaId: '',
    lastSeenLocation: '',
    incidentDate: new Date().toISOString().split('T')[0],
    distinctiveFeatures: '',
    contactPhone: '',
    rewardOffered: false,
    rewardDetails: '',
    photoUrl: '',
    isInjured: false,
    temperamentTags: [] as string[],
  };

  availableTemperamentTags: string[] = [
    'Bueno con niños',
    'Sociable con perros',
    'Convive con gatos',
    'Tranquilo / Calmo',
    'Juguetón / Activo',
    'Protector / Guardián',
    'Tímido / Requiere paciencia',
    'Apto para departamento',
    'Requiere patio o jardín',
    'Esterilizado(a)',
    'Vacunado(a)',
    'Acostumbrado a pasear con correa',
    'Entrenado para hacer afuera',
  ];

  toggleTemperamentTag(tag: string): void {
    const index = this.reportLostForm.temperamentTags.indexOf(tag);
    if (index > -1) {
      this.reportLostForm.temperamentTags.splice(index, 1);
    } else {
      this.reportLostForm.temperamentTags.push(tag);
    }
  }

  isTagSelected(tag: string): boolean {
    return this.reportLostForm.temperamentTags.includes(tag);
  }

  canDeletePost(post: FeedPost): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (post.kind === 'PET_ADOPTION' && post.petData) {
      return post.petData.ownerId === user.id;
    }
    if (post.kind === 'LOST_PET' && post.lostData) {
      return post.lostData.reporterId === user.id;
    }
    return false;
  }

  async confirmDeactivatePost(post: FeedPost): Promise<void> {
    const isPet = post.kind === 'PET_ADOPTION';
    const petName = post.title || (isPet ? 'esta mascota' : 'este reporte');

    const confirmed = await this.confirmService.confirm({
      title: 'Dar de baja publicación',
      message: `¿Deseas dar de baja y desactivar la publicación "${petName}"?`,
      submessage: 'Dejará de mostrarse en el muro comunitario y búsquedas activas. El registro permanecerá resguardado de forma segura en la base de datos como evidencia y respaldo administrativo.',
      confirmText: 'Sí, dar de baja',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: '🗑️',
    });
    if (!confirmed) return;

    if (post.kind === 'PET_ADOPTION' && post.petData) {
      this.petService.delete(post.petData.id).subscribe({
        next: () => {
          this.allPosts.update((posts) => posts.filter((p) => p.id !== post.id));
          this.notify.success('Publicación desactivada y archivada correctamente');
        },
        error: (err) => {
          this.notify.error(err.error?.message || 'Error al desactivar la publicación');
        },
      });
    } else if (post.kind === 'LOST_PET' && post.lostData) {
      this.lostPetService.delete(post.lostData.id).subscribe({
        next: () => {
          this.allPosts.update((posts) => posts.filter((p) => p.id !== post.id));
          this.notify.success('Publicación desactivada y archivada correctamente');
        },
        error: (err) => {
          this.notify.error(err.error?.message || 'Error al desactivar la publicación');
        },
      });
    }
  }

  ngOnInit(): void {
    this.syncFilterFromRoute();
    this.loadColonias();
    this.loadFeed();
    this.startAutoPolling();
    this.route.queryParamMap.subscribe((params) => {
      const postId = params.get('postId');
      if (postId && this.allPosts().length > 0) {
        this.focusTargetPost(postId);
      }
    });
  }

  private startAutoPolling(): void {
    if (typeof window === 'undefined') return;

    // 1. Recarga automática EXCLUSIVA para comentarios de publicaciones que tengan abierta su sección de comentarios (cada 8s)
    this.commentsPollingTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      this.pollOpenComments();
    }, 8000);

    // 2. Verificación silenciosa en segundo plano para avisar si hay nuevas publicaciones sin recargar ni mover el scroll (cada 35s)
    this.feedPollingTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      this.checkForNewPostsSilently();
    }, 35000);
  }

  private pollOpenComments(): void {
    const openPosts = this.allPosts().filter((p) => p.showComments && !p.isSubmittingComment);
    if (openPosts.length === 0) return;

    for (const post of openPosts) {
      this.refreshPostComments(post);
    }
  }

  refreshPostComments(post: FeedPost): void {
    const obs =
      post.kind === 'LOST_PET' && post.lostData
        ? this.lostPetService.getComments(post.lostData.id)
        : post.kind === 'PET_ADOPTION' && post.petData
        ? this.petService.getComments(post.petData.id)
        : null;

    if (!obs) return;

    obs.subscribe({
      next: (freshComments) => {
        if (!Array.isArray(freshComments)) return;
        this.allPosts.update((posts) =>
          posts.map((p) => {
            if (p.id !== post.id) return p;
            const currentIds = (p.comments || []).map((c) => c.id).join(',');
            const freshIds = freshComments.map((c) => c.id).join(',');
            if (currentIds === freshIds && (p.comments || []).length === freshComments.length) {
              return p;
            }
            return {
              ...p,
              comments: freshComments,
            };
          }),
        );
      },
      error: () => {},
    });
  }

  syncFilterFromRoute(): void {
    const postId = this.route.snapshot.queryParamMap.get('postId');
    if (postId) {
      this.activeFilter.set('ALL');
      return;
    }
    const url = this.router.url;
    if (url.includes('perdidas')) {
      this.activeFilter.set('SE_BUSCA');
    } else if (url.includes('adopciones')) {
      this.activeFilter.set('EN_ADOPCION');
    } else {
      this.activeFilter.set('ALL');
    }
  }

  private focusTargetPost(rawPostId: string): void {
    const cleanId = rawPostId.trim();
    if (!cleanId) return;

    const posts = this.allPosts();
    const matched = posts.find(
      (p) =>
        p.id === cleanId ||
        p.id === `lost-${cleanId}` ||
        p.id === `pet-${cleanId}` ||
        p.lostData?.id === cleanId ||
        p.petData?.id === cleanId,
    );

    if (!matched) return;

    // Mostrar todo el muro y limpiar filtros para garantizar que la publicación sea visible
    this.activeFilter.set('ALL');
    this.searchQuery.set('');
    this.selectedColoniaId.set('');
    this.selectedSpecies.set('');
    this.filterGoodWithKids.set(false);
    this.filterGoodWithPets.set(false);

    // Abrir sección de comentarios y resaltarla
    this.highlightedPostId.set(matched.id);
    this.allPosts.update((list) =>
      list.map((p) => (p.id === matched.id ? { ...p, showComments: true } : p)),
    );
    this.refreshPostComments(matched);

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById(`post-${matched.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      setTimeout(() => {
        if (this.highlightedPostId() === matched.id) {
          this.highlightedPostId.set(null);
        }
      }, 6500);
    }
  }

  loadColonias(): void {
    this.coloniaService.getAll().subscribe({
      next: (list) => this.colonias.set(list),
      error: () => {},
    });
  }

  getPostTypeMetadata(rep: LostPetReport): { title: string; authorRole: string; typeBadge: string; badgeClass: string } {
    switch (rep.type) {
      case 'ANIMAL_HERIDO':
        return {
          title: `🚨 Animal Herido / Emergencia: ${rep.petName || 'En peligro'}`,
          authorRole: 'Alerta Ciudadana',
          typeBadge: '🚨 Animal Herido',
          badgeClass: 'bg-rose-600/20 text-rose-600 dark:text-rose-400 border-rose-600/40',
        };
      case 'EN_RESGUARDO':
        return {
          title: `🏠 Encontrado y En Resguardo: ${rep.petName || 'Peludito'}`,
          authorRole: 'Hogar de Paso Temporal',
          typeBadge: '🏠 En Resguardo',
          badgeClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      case 'EN_ADOPCION':
        return {
          title: `💚 En Adopción Responsable: ${rep.petName || 'Peludito'}`,
          authorRole: 'Rescatista / Ciudadano',
          typeBadge: '💚 En Adopción',
          badgeClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'SE_BUSCA':
      case 'EXTRAVIADA':
        return {
          title: `🔍 Se Busca a ${rep.petName || 'Mascota'} (Extraviado)`,
          authorRole: 'Familia en Búsqueda',
          typeBadge: '🔍 Se Busca',
          badgeClass: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      case 'CAMPANA_COMUNITARIA':
        return {
          title: `📢 Campaña / Aviso Comunitario: ${rep.petName || 'Dolores Hidalgo'}`,
          authorRole: 'Rescatista / Difusión',
          typeBadge: '📢 Campaña',
          badgeClass: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
        };
      case 'ENCONTRADA_EN_CALLE':
      default:
        return {
          title: `📍 Encontrado en calle: ${rep.petName || 'Peludito'}`,
          authorRole: 'Resguardo Temporal',
          typeBadge: '📍 Encontrado',
          badgeClass: 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
        };
    }
  }

  private normalizePhotosList(primaryUrl?: string, photosArr?: string[]): string[] {
    const set = new Set<string>();
    if (primaryUrl && primaryUrl.trim()) set.add(primaryUrl.trim());
    if (Array.isArray(photosArr)) {
      for (const p of photosArr) {
        if (p && p.trim()) set.add(p.trim());
      }
    }
    return Array.from(set);
  }

  private buildFeedPosts(pets: Pet[], reports: LostPetReport[]): FeedPost[] {
    const existingMap = new Map<string, FeedPost>();
    for (const oldPost of this.allPosts()) {
      existingMap.set(oldPost.id, oldPost);
    }

    const petPosts: FeedPost[] = (pets || []).map((pet) => {
      const id = `pet-${pet.id}`;
      const prev = existingMap.get(id);
      const photos = this.normalizePhotosList(pet.photoUrl, pet.photos);
      return {
        id,
        kind: 'PET_ADOPTION',
        postType: 'EN_ADOPCION',
        title: `${pet.name} busca una familia amorosa`,
        authorName: pet.owner?.fullName || 'Rescatista Huellitas',
        authorPhotoUrl: pet.owner?.profilePhotoUrl,
        authorRole: 'Rescatista Verificado',
        authorColonia: pet.colonia?.name || 'Dolores Hidalgo',
        createdAt: pet.createdAt,
        timeAgo: this.formatExactDateTime(pet.createdAt),
        temperamentTags: pet.temperamentTags || [],
        typeBadge: '💚 En Adopción',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        description:
          pet.rescueStory ||
          `Conoce a ${pet.name}, un hermoso peludito de talla ${pet.size || 'mediana'} que está listo para llenar tu hogar de amor en Dolores Hidalgo.`,
        photoUrl: photos[0] || '',
        photos,
        activePhotoIndex: prev?.activePhotoIndex || 0,
        species: pet.species,
        breed: pet.breed,
        approxAge: pet.approximateAge,
        size: pet.size,
        gender: pet.gender === 'FEMALE' ? 'Hembra' : 'Macho',
        coloniaName: pet.colonia?.name,
        isSterilized: pet.isSterilized,
        isVaccinated: Boolean(pet.vaccinesList && pet.vaccinesList.length > 0),
        goodWithKids: pet.goodWithKids,
        goodWithOtherPets: pet.goodWithOtherPets,
        petData: pet,
        comments: pet.comments || prev?.comments || [],
        showComments: prev?.showComments ?? false,
        newCommentText: prev?.newCommentText ?? '',
        isSubmittingComment: prev?.isSubmittingComment ?? false,
      };
    });

    const lostPosts: FeedPost[] = (reports || []).map((rep) => {
      const id = `lost-${rep.id}`;
      const prev = existingMap.get(id);
      const meta = this.getPostTypeMetadata(rep);
      const photos = this.normalizePhotosList(rep.photos?.[0], rep.photos);
      return {
        id,
        kind: 'LOST_PET',
        postType: rep.type,
        title: meta.title,
        authorName: rep.reporter?.fullName || 'Ciudadano Solidario',
        authorPhotoUrl: rep.reporter?.profilePhotoUrl,
        authorRole: meta.authorRole,
        authorColonia: rep.colonia?.name || 'Dolores Hidalgo',
        createdAt: rep.createdAt,
        timeAgo: this.formatExactDateTime(rep.createdAt),
        temperamentTags: rep.temperamentTags || [],
        typeBadge: meta.typeBadge,
        badgeClass: meta.badgeClass,
        description: rep.distinctiveFeatures || `Visto en ${rep.lastSeenLocation}. Por favor ayuda compartiendo este reporte.`,
        photoUrl: photos[0] || '',
        photos,
        activePhotoIndex: prev?.activePhotoIndex || 0,
        species: rep.species,
        gender: rep.gender,
        coloniaName: rep.colonia?.name,
        lostData: rep,
        lastSeenLocation: rep.lastSeenLocation,
        contactPhone: rep.contactPhone,
        rewardOffered: rep.rewardOffered,
        rewardDetails: rep.rewardDetails,
        isInjured: rep.isInjured,
        reportsCount: rep.reportsCount || (rep.sightings ? rep.sightings.length : 1),
        sightings: rep.sightings || [],
        comments: rep.comments || prev?.comments || [],
        showComments: prev?.showComments ?? false,
        newCommentText: prev?.newCommentText ?? '',
        isSubmittingComment: prev?.isSubmittingComment ?? false,
      };
    });

    return [...petPosts, ...lostPosts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  loadFeed(): void {
    this.isLoading.set(true);

    this.petService.getAdoptionCatalog().subscribe({
      next: (pets) => {
        this.lostPetService.getAll().subscribe({
          next: (reports) => {
            const combined = this.buildFeedPosts(pets || [], reports || []);
            this.allPosts.set(combined);
            this.pendingNewPostsCount.set(0);
            this.bufferedFreshPosts = null;
            this.isLoading.set(false);

            const targetPostId = this.route.snapshot.queryParamMap.get('postId');
            if (targetPostId) {
              this.focusTargetPost(targetPostId);
            }
          },
          error: () => {
            this.isLoading.set(false);
          },
        });
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private checkForNewPostsSilently(): void {
    if (this.isLoading() || this.isRefreshingFeed()) return;

    this.petService.getAdoptionCatalog().subscribe({
      next: (pets) => {
        this.lostPetService.getAll().subscribe({
          next: (reports) => {
            const fresh = this.buildFeedPosts(pets || [], reports || []);
            const currentIds = new Set(this.allPosts().map((p) => p.id));
            const newCount = fresh.filter((p) => !currentIds.has(p.id)).length;
            if (newCount > 0) {
              this.bufferedFreshPosts = fresh;
              this.pendingNewPostsCount.set(newCount);
            } else {
              // Actualiza contadores de cascada/avistamientos sin alterar scroll ni cerrar comentarios
              this.allPosts.set(fresh);
            }
          },
          error: () => {},
        });
      },
      error: () => {},
    });
  }

  applyPendingFeedRefresh(): void {
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    if (this.bufferedFreshPosts) {
      this.allPosts.set(this.bufferedFreshPosts);
      this.bufferedFreshPosts = null;
      this.pendingNewPostsCount.set(0);
      if (typeof window !== 'undefined') {
        requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior }));
      }
      this.notify.info('Muro actualizado con las publicaciones más recientes');
    } else {
      this.refreshFeedSilently(true);
    }
  }

  refreshFeedSilently(showToast = false): void {
    if (this.isRefreshingFeed()) return;
    this.isRefreshingFeed.set(true);
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

    this.petService.getAdoptionCatalog().subscribe({
      next: (pets) => {
        this.lostPetService.getAll().subscribe({
          next: (reports) => {
            const fresh = this.buildFeedPosts(pets || [], reports || []);
            this.allPosts.set(fresh);
            this.bufferedFreshPosts = null;
            this.pendingNewPostsCount.set(0);
            this.isRefreshingFeed.set(false);
            if (typeof window !== 'undefined') {
              requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior }));
            }
            if (showToast) {
              this.notify.success('Muro actualizado sin perder tu posición');
            }
          },
          error: () => {
            this.isRefreshingFeed.set(false);
          },
        });
      },
      error: () => {
        this.isRefreshingFeed.set(false);
      },
    });
  }

  // ==========================================
  // MULTI-PHOTO CARD CAROUSEL & LIGHTBOX
  // ==========================================
  getPostCurrentPhoto(post: FeedPost): string {
    if (post.photos && post.photos.length > 0) {
      const idx = post.activePhotoIndex || 0;
      return post.photos[idx] || post.photos[0] || post.photoUrl;
    }
    return post.photoUrl;
  }

  prevPostPhoto(post: FeedPost, event: Event): void {
    event.stopPropagation();
    if (!post.photos || post.photos.length <= 1) return;
    const current = post.activePhotoIndex || 0;
    const nextIdx = (current - 1 + post.photos.length) % post.photos.length;
    this.allPosts.update((posts) =>
      posts.map((p) => (p.id === post.id ? { ...p, activePhotoIndex: nextIdx } : p)),
    );
  }

  nextPostPhoto(post: FeedPost, event: Event): void {
    event.stopPropagation();
    if (!post.photos || post.photos.length <= 1) return;
    const current = post.activePhotoIndex || 0;
    const nextIdx = (current + 1) % post.photos.length;
    this.allPosts.update((posts) =>
      posts.map((p) => (p.id === post.id ? { ...p, activePhotoIndex: nextIdx } : p)),
    );
  }

  selectPostPhoto(post: FeedPost, index: number, event: Event): void {
    event.stopPropagation();
    this.allPosts.update((posts) =>
      posts.map((p) => (p.id === post.id ? { ...p, activePhotoIndex: index } : p)),
    );
  }

  openLightbox(post: FeedPost, index = 0): void {
    const photos = post.photos && post.photos.length > 0 ? post.photos : post.photoUrl ? [post.photoUrl] : [];
    if (photos.length === 0) return;
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.lightboxPost.set({ ...post, photos });
    this.lightboxIndex.set(Math.max(0, Math.min(index, photos.length - 1)));
  }

  closeLightbox(): void {
    if (typeof document !== 'undefined' && !this.isReportLostModalOpen() && !this.selectedPetForAdoption() && !this.selectedLostPetForSighting()) {
      document.body.classList.remove('modal-open');
    }
    this.lightboxPost.set(null);
    this.lightboxIndex.set(0);
  }

  prevLightboxPhoto(): void {
    const post = this.lightboxPost();
    if (!post || !post.photos || post.photos.length <= 1) return;
    this.lightboxIndex.update((i) => (i - 1 + post.photos.length) % post.photos.length);
  }

  nextLightboxPhoto(): void {
    const post = this.lightboxPost();
    if (!post || !post.photos || post.photos.length <= 1) return;
    this.lightboxIndex.update((i) => (i + 1) % post.photos.length);
  }

  setFilter(filter: FeedFilterType): void {
    this.activeFilter.set(filter);
    if (filter === 'SE_BUSCA' || filter === 'LOST') {
      this.router.navigate([], { queryParams: { tab: 'perdidos' }, replaceUrl: true });
    } else if (filter === 'EN_ADOPCION' || filter === 'ADOPTION') {
      this.router.navigate([], { queryParams: { tab: 'adopciones' }, replaceUrl: true });
    } else if (filter === 'ANIMAL_HERIDO') {
      this.router.navigate([], { queryParams: { tab: 'heridos' }, replaceUrl: true });
    } else if (filter === 'EN_RESGUARDO') {
      this.router.navigate([], { queryParams: { tab: 'resguardo' }, replaceUrl: true });
    } else if (filter === 'CAMPANA_COMUNITARIA') {
      this.router.navigate([], { queryParams: { tab: 'campanas' }, replaceUrl: true });
    } else {
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  toggleFiltersPanel(): void {
    this.showFiltersPanel.update((v) => !v);
  }

  toggleGoodWithKids(): void {
    this.filterGoodWithKids.update((v) => !v);
  }

  toggleGoodWithPets(): void {
    this.filterGoodWithPets.update((v) => !v);
  }

  hasActiveFilters(): boolean {
    return (
      Boolean(this.searchQuery().trim()) ||
      Boolean(this.selectedColoniaId()) ||
      Boolean(this.selectedSpecies()) ||
      this.filterGoodWithKids() ||
      this.filterGoodWithPets()
    );
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedColoniaId.set('');
    this.selectedSpecies.set('');
    this.filterGoodWithKids.set(false);
    this.filterGoodWithPets.set(false);
    this.activeFilter.set('ALL');
  }

  onSearchChange(): void {}
  onColoniaChange(): void {}
  onSpeciesChange(): void {}

  onComposerClick(): void {
    if (!this.authService.isAuthenticated()) {
      this.notify.warning('Inicia sesión para crear una publicación en el muro');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/' } });
      return;
    }
    this.openPublicationModal();
  }

  setModalPublicationType(type: LostPetType): void {
    const prevType = this.reportLostForm.type;
    this.reportLostForm.type = type;

    if (type === 'ANIMAL_HERIDO') {
      this.reportLostForm.isInjured = true;
      if (prevType === 'CAMPANA_COMUNITARIA' && this.reportLostForm.petName === 'Campaña Comunitaria') {
        this.reportLostForm.petName = '';
      }
    } else if (type === 'CAMPANA_COMUNITARIA') {
      this.reportLostForm.isInjured = false;
      this.reportLostForm.species = 'Otro';
      this.reportLostForm.gender = 'Desconocido';
      this.reportLostForm.temperamentTags = [];
      this.reportLostForm.rewardOffered = false;
      this.reportLostForm.rewardDetails = '';
      if (!this.reportLostForm.petName || this.reportLostForm.petName === 'Peludito comunitario' || this.reportLostForm.petName === 'Campaña Comunitaria') {
        this.reportLostForm.petName = '';
      }
    } else if (type === 'EN_ADOPCION') {
      this.reportLostForm.isInjured = false;
      this.reportLostForm.rewardOffered = false;
      this.reportLostForm.rewardDetails = '';
      if (this.reportLostForm.petName === 'Campaña Comunitaria') {
        this.reportLostForm.petName = '';
      }
    } else if (type === 'EN_RESGUARDO') {
      this.reportLostForm.isInjured = false;
      this.reportLostForm.rewardOffered = false;
      this.reportLostForm.rewardDetails = '';
      if (this.reportLostForm.petName === 'Campaña Comunitaria') {
        this.reportLostForm.petName = '';
      }
    } else {
      if (this.reportLostForm.petName === 'Campaña Comunitaria') {
        this.reportLostForm.petName = '';
      }
    }
  }

  editingReportId = signal<string | null>(null);

  openPublicationModal(defaultType?: LostPetType): void {
    if (!this.authService.isAuthenticated()) {
      this.notify.warning('Inicia sesión para crear una publicación en el muro');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/' } });
      return;
    }
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.editingReportId.set(null);
    this.isReportLostModalOpen.set(true);
    this.reportLostSuccess.set(null);
    this.reportLostPhotoSource.set('FILE');
    this.reportLostPhotoPreview.set(null);
    this.reportLostSelectedFile.set(null);
    this.reportLostPhotosList.set([]);
    this.reportLostForm.petName = '';
    this.reportLostForm.lastSeenLocation = '';
    this.reportLostForm.distinctiveFeatures = '';
    this.reportLostForm.photoUrl = '';
    this.reportLostForm.temperamentTags = [];
    this.reportLostForm.contactPhone = this.authService.currentUser()?.phone || '';
    if (defaultType) {
      this.setModalPublicationType(defaultType);
    } else {
      this.setModalPublicationType('ANIMAL_HERIDO');
    }
  }

  openEditPostModal(post: FeedPost): void {
    if (post.kind === 'PET_ADOPTION' && post.petData) {
      this.router.navigate(['/pets/edit', post.petData.id]);
      return;
    }
    if (post.kind === 'LOST_PET' && post.lostData) {
      const rep = post.lostData;
      if (typeof document !== 'undefined') {
        document.body.classList.add('modal-open');
      }
      this.editingReportId.set(rep.id);
      this.reportLostSuccess.set(null);
      this.reportLostForm.type = rep.type;
      this.reportLostForm.petName = rep.petName || '';
      this.reportLostForm.species = (rep.species as any) || 'Perro';
      this.reportLostForm.gender = (rep.gender as any) || 'Desconocido';
      this.reportLostForm.coloniaId = rep.coloniaId || '';
      this.reportLostForm.lastSeenLocation = rep.lastSeenLocation || '';
      this.reportLostForm.distinctiveFeatures = rep.distinctiveFeatures || '';
      this.reportLostForm.contactPhone = rep.contactPhone || '';
      this.reportLostForm.rewardOffered = !!rep.rewardOffered;
      this.reportLostForm.rewardDetails = rep.rewardDetails || '';
      this.reportLostForm.isInjured = !!rep.isInjured;
      this.reportLostForm.temperamentTags = [...(rep.temperamentTags || [])];
      const existingPhotos = rep.photos && rep.photos.length > 0 ? rep.photos : [];
      this.reportLostForm.photoUrl = '';
      this.reportLostPhotosList.set(
        existingPhotos.map((url) => ({ previewUrl: url, existingUrl: url })),
      );
      this.reportLostPhotoPreview.set(existingPhotos[0] || null);
      this.reportLostPhotoSource.set('FILE');
      this.reportLostSelectedFile.set(null);
      this.isReportLostModalOpen.set(true);
    }
  }

  async markPostResolved(post: FeedPost): Promise<void> {
    if (!post.lostData) return;
    const confirmed = await this.confirmService.confirm({
      title: '¿Marcar caso como Resuelto?',
      message: `¿Confirmas que el caso de "${post.lostData.petName || post.title}" ya fue resuelto o reencontrado?`,
      submessage: 'Se mostrará una insignia de Caso Resuelto en el muro para compartir la buena noticia con la comunidad.',
      confirmText: 'Sí, marcar resuelto',
      cancelText: 'Cancelar',
      type: 'success',
      icon: '✅',
    });
    if (!confirmed) return;

    this.lostPetService.updateStatus(post.lostData.id, 'REENCONTRADA' as any).subscribe({
      next: (updated) => {
        this.allPosts.update((posts) =>
          posts.map((p) =>
            p.id === post.id
              ? { ...p, lostData: { ...p.lostData!, status: updated.status } }
              : p,
          ),
        );
        this.notify.success('¡Excelente noticia! Caso marcado como resuelto');
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'No se pudo actualizar el estado');
      },
    });
  }

  openReportLostModal(): void {
    this.openPublicationModal('SE_BUSCA');
  }

  closeReportLostModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
    this.revokeObjectUrls(this.reportLostPhotosList());
    this.isReportLostModalOpen.set(false);
    this.reportLostSuccess.set(null);
    this.reportLostPhotosList.set([]);
    this.modalPostalFilter.set('');
  }

  private revokeObjectUrls(items: Array<{ previewUrl: string; file?: File }>): void {
    if (typeof URL === 'undefined' || !URL.revokeObjectURL) return;
    for (const item of items) {
      if (item.file && item.previewUrl && item.previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {
          // ignore
        }
      }
    }
  }

  toggleComments(post: FeedPost): void {
    const willOpen = !post.showComments;
    this.allPosts.update((posts) =>
      posts.map((p) => (p.id === post.id ? { ...p, showComments: willOpen } : p)),
    );
    if (willOpen) {
      this.refreshPostComments(post);
    }
  }

  submitComment(post: FeedPost): void {
    const rawText = post.newCommentText || '';
    if (!rawText.trim()) return;
    if (!this.authService.isAuthenticated()) {
      this.notify.warning('Inicia sesión para dejar un comentario');
      return;
    }

    const text = rawText.trim();
    const commentObs =
      post.kind === 'LOST_PET' && post.lostData
        ? this.lostPetService.addComment(post.lostData.id, text)
        : post.kind === 'PET_ADOPTION' && post.petData
        ? this.petService.addComment(post.petData.id, text)
        : null;

    if (!commentObs) {
      this.notify.error('No se pudo identificar la publicación');
      return;
    }

    // UI Optimista e inmutable con Signals:
    // Limpiamos de inmediato el input y mostramos el comentario en 0ms sin dejar animación colgada
    const tempId = `temp-${Date.now()}`;
    const currentUser = this.authService.currentUser();
    const optimisticComment: PublicationComment = {
      id: tempId,
      reportId: post.id,
      authorId: currentUser?.id || 'me',
      author: currentUser || undefined,
      content: text,
      createdAt: new Date().toISOString(),
    };

    this.allPosts.update((posts) =>
      posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              newCommentText: '',
              isSubmittingComment: false,
              showComments: true,
              comments: [...(p.comments || []), optimisticComment],
            }
          : p,
      ),
    );

    commentObs.subscribe({
      next: (comment) => {
        const enrichedComment: PublicationComment = {
          id: comment.id,
          reportId: (comment as any).reportId || (comment as any).petId || post.id,
          authorId: comment.authorId,
          author: comment.author || currentUser || undefined,
          content: comment.content,
          createdAt: comment.createdAt || new Date().toISOString(),
        };

        this.allPosts.update((posts) =>
          posts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  isSubmittingComment: false,
                  comments: (p.comments || []).map((c) => (c.id === tempId ? enrichedComment : c)),
                }
              : p,
          ),
        );
      },
      error: (err) => {
        // Revertir el comentario optimista y restaurar el texto para que no se pierda
        this.allPosts.update((posts) =>
          posts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  isSubmittingComment: false,
                  newCommentText: text,
                  comments: (p.comments || []).filter((c) => c.id !== tempId),
                }
              : p,
          ),
        );
        const msg = err.error?.message || 'Error al enviar el comentario';
        this.notify.error(msg);
      },
    });
  }

  onReportLostFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const maxAllowed = this.authService.maxPhotosAllowed();
    const currentList = this.reportLostPhotosList();
    const remainingSlots = maxAllowed - currentList.length;

    if (remainingSlots <= 0) {
      this.notify.warning(
        `Has alcanzado el límite máximo de ${maxAllowed} fotos para tu cuenta.`,
      );
      input.value = '';
      return;
    }

    const selectedFiles = Array.from(input.files);
    if (selectedFiles.length > remainingSlots) {
      this.notify.info(
        `Solo se agregaron ${remainingSlots} foto(s) para respetar el límite de ${maxAllowed} fotos según tu rol.`,
      );
    }

    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    const newEntries = filesToAdd.map((file) => ({
      previewUrl: typeof URL !== 'undefined' ? URL.createObjectURL(file) : '',
      file,
    }));

    // Actualización atómica única con ObjectURL en 0ms sin bloquear memoria ni CPU en móviles
    this.reportLostPhotosList.update((list) => [...list, ...newEntries].slice(0, maxAllowed));

    input.value = '';
  }

  addPhotoUrlToList(): void {
    const url = (this.reportLostForm.photoUrl || '').trim();
    if (!url) return;

    const maxAllowed = this.authService.maxPhotosAllowed();
    if (this.reportLostPhotosList().length >= maxAllowed) {
      this.notify.warning(`Solo puedes adjuntar hasta ${maxAllowed} fotos.`);
      return;
    }

    this.reportLostPhotosList.update((list) => [...list, { previewUrl: url, existingUrl: url }]);
    this.reportLostForm.photoUrl = '';
  }

  removeReportLostPhoto(index: number): void {
    const current = this.reportLostPhotosList();
    const removed = current[index];
    if (removed) {
      this.revokeObjectUrls([removed]);
    }
    this.reportLostPhotosList.update((list) => list.filter((_, idx) => idx !== index));
  }

  submitReportLost(): void {
    if (
      !this.reportLostForm.petName.trim() ||
      !this.reportLostForm.lastSeenLocation.trim() ||
      !this.reportLostForm.distinctiveFeatures.trim()
    ) {
      const isCampana = this.reportLostForm.type === 'CAMPANA_COMUNITARIA';
      this.notify.warning(
        isCampana
          ? 'Por favor ingresa el título de la campaña, la sede y la descripción/requisitos.'
          : 'Por favor indica el nombre/apodo, la ubicación y las señas particulares.',
      );
      return;
    }

    // Si escribió una URL en el input pero no pulsó "+ Agregar", agregarla automáticamente si hay espacio
    if (
      this.reportLostPhotoSource() === 'URL' &&
      this.reportLostForm.photoUrl.trim() &&
      this.reportLostPhotosList().length < this.authService.maxPhotosAllowed()
    ) {
      this.addPhotoUrlToList();
    }

    const maxAllowed = this.authService.maxPhotosAllowed();
    const photoItems = this.reportLostPhotosList().slice(0, maxAllowed);

    this.isSubmittingReportLost.set(true);

    const executeCreation = (finalPhotos: string[]) => {
      const editId = this.editingReportId();
      const primaryPhoto = finalPhotos[0] || undefined;
      const payload = {
        type: this.reportLostForm.type,
        species: this.reportLostForm.species,
        petName: this.reportLostForm.petName.trim() || 'Peludito comunitario',
        gender: this.reportLostForm.gender,
        coloniaId: this.reportLostForm.coloniaId || undefined,
        lastSeenLocation: this.reportLostForm.lastSeenLocation.trim(),
        incidentDate: this.reportLostForm.incidentDate || new Date().toISOString().split('T')[0],
        distinctiveFeatures: this.reportLostForm.distinctiveFeatures.trim(),
        contactPhone: this.reportLostForm.contactPhone.trim() || '4181234567',
        rewardOffered: this.reportLostForm.rewardOffered,
        rewardDetails: this.reportLostForm.rewardDetails.trim() || undefined,
        photos: finalPhotos,
        isInjured: this.reportLostForm.isInjured,
        temperamentTags: this.reportLostForm.temperamentTags,
        goodWithKids: this.reportLostForm.temperamentTags.includes('Bueno con niños'),
        goodWithOtherPets:
          this.reportLostForm.temperamentTags.includes('Sociable con perros') ||
          this.reportLostForm.temperamentTags.includes('Convive con gatos'),
      };

      // Caso A: Edición de publicación existente
      if (editId) {
        this.lostPetService.update(editId, payload).subscribe({
          next: (updatedReport) => {
            this.isSubmittingReportLost.set(false);
            const meta = this.getPostTypeMetadata(updatedReport);
            const updatedPhotos = this.normalizePhotosList(updatedReport.photos?.[0], updatedReport.photos);
            this.allPosts.update((posts) =>
              posts.map((p) =>
                p.id === `lost-${editId}`
                  ? {
                      ...p,
                      postType: updatedReport.type,
                      title: meta.title,
                      typeBadge: meta.typeBadge,
                      badgeClass: meta.badgeClass,
                      description: updatedReport.distinctiveFeatures,
                      photoUrl: updatedPhotos[0] || p.photoUrl,
                      photos: updatedPhotos.length > 0 ? updatedPhotos : p.photos,
                      activePhotoIndex: 0,
                      species: updatedReport.species,
                      gender: updatedReport.gender,
                      coloniaName: this.colonias().find((c) => c.id === updatedReport.coloniaId)?.name,
                      lastSeenLocation: updatedReport.lastSeenLocation,
                      contactPhone: updatedReport.contactPhone,
                      rewardOffered: updatedReport.rewardOffered,
                      rewardDetails: updatedReport.rewardDetails,
                      isInjured: updatedReport.isInjured,
                      temperamentTags: updatedReport.temperamentTags || [],
                      lostData: updatedReport,
                    }
                  : p,
              ),
            );
            this.notify.success('¡Publicación actualizada correctamente!');
            this.closeReportLostModal();
          },
          error: (err) => {
            this.isSubmittingReportLost.set(false);
            this.notify.error(err.error?.message || 'Error al actualizar la publicación');
          },
        });
        return;
      }

      // Caso B: Nueva publicación de "3. Dar en Adopción" -> Se registra en el catálogo de Adopciones con cuestionario activo
      if (this.reportLostForm.type === 'EN_ADOPCION') {
        const petPayload: any = {
          name: this.reportLostForm.petName.trim(),
          species: this.reportLostForm.species,
          gender: this.reportLostForm.gender === 'Hembra' ? 'FEMALE' : 'MALE',
          status: 'DISPONIBLE',
          coloniaId: this.reportLostForm.coloniaId || undefined,
          photoUrl: primaryPhoto,
          photos: finalPhotos,
          rescueStory: `${this.reportLostForm.distinctiveFeatures.trim()} (Ubicación: ${this.reportLostForm.lastSeenLocation.trim()})`,
          notes: `Tel. de contacto: ${this.reportLostForm.contactPhone.trim()}`,
          temperamentTags: this.reportLostForm.temperamentTags,
          isSterilized: this.reportLostForm.temperamentTags.includes('Esterilizado(a)'),
          goodWithKids: this.reportLostForm.temperamentTags.includes('Bueno con niños'),
          goodWithOtherPets:
            this.reportLostForm.temperamentTags.includes('Sociable con perros') ||
            this.reportLostForm.temperamentTags.includes('Convive con gatos'),
        };

        this.petService.create(petPayload).subscribe({
          next: (createdPet) => {
            this.isSubmittingReportLost.set(false);
            const coloniaName = this.colonias().find((c) => c.id === createdPet.coloniaId)?.name || 'Dolores Hidalgo';
            const photosList = this.normalizePhotosList(createdPet.photoUrl || primaryPhoto, createdPet.photos || finalPhotos);
            const newAdoptionPost: FeedPost = {
              id: `pet-${createdPet.id}`,
              kind: 'PET_ADOPTION',
              postType: 'EN_ADOPCION',
              title: `${createdPet.name} busca una familia amorosa`,
              authorName: this.authService.currentUser()?.fullName || 'Ciudadano Solidario',
              authorPhotoUrl: this.authService.currentUser()?.profilePhotoUrl,
              authorRole: 'Adopción Responsable',
              authorColonia: coloniaName,
              createdAt: createdPet.createdAt || new Date().toISOString(),
              timeAgo: this.formatExactDateTime(createdPet.createdAt || new Date().toISOString()),
              temperamentTags: createdPet.temperamentTags || this.reportLostForm.temperamentTags || [],
              typeBadge: '💚 En Adopción',
              badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
              description: createdPet.rescueStory || this.reportLostForm.distinctiveFeatures.trim(),
              photoUrl: photosList[0] || '',
              photos: photosList,
              activePhotoIndex: 0,
              species: createdPet.species,
              gender: createdPet.gender,
              coloniaName,
              isSterilized: createdPet.isSterilized,
              goodWithKids: createdPet.goodWithKids,
              goodWithOtherPets: createdPet.goodWithOtherPets,
              petData: createdPet,
              comments: [],
              showComments: false,
              newCommentText: '',
              isSubmittingComment: false,
            };
            this.allPosts.update((posts) => [newAdoptionPost, ...posts]);
            this.notify.success('¡Mascota publicada en Adopción con Protocolo de Solicitud activo!');
            this.closeReportLostModal();
          },
          error: (err) => {
            this.isSubmittingReportLost.set(false);
            this.notify.error(err.error?.message || 'No se pudo publicar la mascota en adopción');
          },
        });
        return;
      }

      // Caso C: Reportes comunitarios (Animal Herido, En Resguardo, Se Busca, Campaña)
      this.lostPetService.create(payload).subscribe({
        next: (newReport) => {
          this.isSubmittingReportLost.set(false);
          this.reportLostSuccess.set(newReport);

          const meta = this.getPostTypeMetadata(newReport);
          const photosList = this.normalizePhotosList(newReport.photos?.[0], newReport.photos);
          const postId = `lost-${newReport.id}`;
          const newPost: FeedPost = {
            id: postId,
            kind: 'LOST_PET',
            postType: newReport.type,
            title: meta.title,
            authorName: newReport.reporter?.fullName || this.authService.currentUser()?.fullName || 'Ciudadano Solidario',
            authorPhotoUrl: newReport.reporter?.profilePhotoUrl || this.authService.currentUser()?.profilePhotoUrl,
            authorRole: meta.authorRole,
            authorColonia: this.colonias().find((c) => c.id === newReport.coloniaId)?.name || 'Dolores Hidalgo',
            createdAt: newReport.createdAt || new Date().toISOString(),
            timeAgo: this.formatExactDateTime(newReport.createdAt || new Date().toISOString()),
            temperamentTags: newReport.temperamentTags || this.reportLostForm.temperamentTags || [],
            typeBadge: meta.typeBadge,
            badgeClass: meta.badgeClass,
            description: newReport.distinctiveFeatures,
            photoUrl: photosList[0] || '',
            photos: photosList,
            activePhotoIndex: 0,
            species: newReport.species,
            gender: newReport.gender,
            coloniaName: this.colonias().find((c) => c.id === newReport.coloniaId)?.name,
            lostData: newReport,
            lastSeenLocation: newReport.lastSeenLocation,
            contactPhone: newReport.contactPhone,
            rewardOffered: newReport.rewardOffered,
            rewardDetails: newReport.rewardDetails,
            isInjured: newReport.isInjured,
            reportsCount: newReport.reportsCount || (newReport.sightings ? newReport.sightings.length : 1),
            sightings: newReport.sightings || [],
            comments: newReport.comments || [],
            showComments: false,
            newCommentText: '',
            isSubmittingComment: false,
          };

          const alreadyExists = this.allPosts().some((p) => p.id === postId);
          if (alreadyExists) {
            // Se agrupó en cascada con un reporte existente de Animal Herido
            this.allPosts.update((posts) => posts.map((p) => (p.id === postId ? newPost : p)));
            this.notify.success('¡Tu reporte de emergencia se sumó en cascada al caso activo para priorizar su rescate!');
          } else {
            this.allPosts.update((posts) => [newPost, ...posts]);
            this.notify.success('¡Publicación realizada exitosamente en el Muro!');
          }
        },
        error: (err) => {
          this.isSubmittingReportLost.set(false);
          const msg = err.error?.message || 'No se pudo registrar la publicación. Por favor intenta de nuevo.';
          this.notify.error(msg);
        },
      });
    };

    const filesToUpload = photoItems.filter((item) => !!item.file).map((item) => item.file!);
    if (filesToUpload.length > 0) {
      this.imageUploadService.uploadMultipleImages(filesToUpload, 'lost-pets').subscribe({
        next: (uploadedUrls) => {
          let uploadIdx = 0;
          const finalUrls: string[] = [];
          for (const item of photoItems) {
            if (item.file) {
              const url = uploadedUrls[uploadIdx++] || item.previewUrl;
              if (url) finalUrls.push(url);
            } else if (item.existingUrl) {
              finalUrls.push(item.existingUrl);
            }
          }
          executeCreation(finalUrls);
        },
        error: () => {
          const fallbackUrls = photoItems.map((item) => item.existingUrl || item.previewUrl).filter(Boolean);
          executeCreation(fallbackUrls);
        },
      });
    } else {
      const existingUrls = photoItems.map((item) => item.existingUrl || item.previewUrl).filter(Boolean);
      executeCreation(existingUrls);
    }
  }

  getLostBroadcastWhatsAppUrl(report: LostPetReport): string {
    const isLost = report.type === 'EXTRAVIADA';
    const prefix = isLost ? '🚨 ¡URGENTE! SE BUSCA A ESTA MASCOTA' : '📍 PELUDITO ENCONTRADO EN CALLE';
    const msg = `${prefix}\n🐾 Nombre: ${report.petName || 'Sin identificar'}\n📍 Lugar: ${report.lastSeenLocation} (Dolores Hidalgo)\n🔍 Señas: ${report.distinctiveFeatures}\n📲 Contacto: ${report.contactPhone}\n\nAyúdanos a compartir en grupos de Dolores Hidalgo a través de ${this.brand.name}.`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  // ==========================================
  // ITEM #2: FLUJO "QUIERO ADOPTAR"
  // ==========================================
  openAdoptionModal(pet: Pet): void {
    if (!this.authService.isAuthenticated()) {
      this.notify.warning('Inicia sesión para postularte a la adopción de una mascota');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/' } });
      return;
    }
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.selectedPetForAdoption.set(pet);
    this.adoptionSubmittedSuccess.set(false);
    this.adoptionForm = {
      housingType: 'CASA_PROPIA_PATIO',
      familyAgreed: 'SI_FAMILIA',
      currentPets: '',
      relocationPlan: '',
      reason: '',
      agreeNoAbandon: false,
      agreeSterilization: false,
      agreeFollowup: false,
    };
  }

  isAdoptionFormValid(): boolean {
    return (
      !!this.adoptionForm.housingType &&
      (this.adoptionForm.familyAgreed === 'SI_FAMILIA' || this.adoptionForm.familyAgreed === 'VIVO_SOLO') &&
      this.adoptionForm.currentPets.trim().length >= 3 &&
      this.adoptionForm.relocationPlan.trim().length >= 4 &&
      this.adoptionForm.reason.trim().length >= 10 &&
      this.adoptionForm.agreeNoAbandon &&
      this.adoptionForm.agreeSterilization &&
      this.adoptionForm.agreeFollowup
    );
  }

  closeAdoptionModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
    this.selectedPetForAdoption.set(null);
    this.adoptionSubmittedSuccess.set(false);
  }

  submitAdoptionRequest(): void {
    const pet = this.selectedPetForAdoption();
    if (!pet) return;

    if (!this.isAdoptionFormValid()) {
      this.notify.warning('Formulario incompleto', 'Por favor responde todas las preguntas y acepta los compromisos del convenio.');
      return;
    }

    this.isSubmittingAdoption.set(true);

    const housingLabel =
      this.adoptionForm.housingType === 'CASA_PROPIA_PATIO'
        ? 'Casa propia con patio o jardín cercado y seguro'
        : this.adoptionForm.housingType === 'CASA_PROPIA_SIN_PATIO'
          ? 'Casa propia sin patio (espacio interior)'
          : 'En renta (con permiso explícito confirmado del arrendador)';

    const familyLabel =
      this.adoptionForm.familyAgreed === 'SI_FAMILIA'
        ? 'Toda la familia acepta y asume la responsabilidad'
        : 'Vive solo(a) y asume la total responsabilidad';

    const message = `📋 SOLICITUD DE ADOPCIÓN RESPONSABLE (Protocolo Huellitas DH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 Vivienda: ${housingLabel}
👨‍👩‍👧‍👦 Acuerdo familiar: ${familyLabel}
🐾 Mascotas actuales / Esterilización: ${this.adoptionForm.currentPets.trim()}
📦 Plan ante mudanza / imprevistos: ${this.adoptionForm.relocationPlan.trim()}
❤️ Motivo y tiempo dedicado: ${this.adoptionForm.reason.trim()}
📜 Compromisos Aceptados del Convenio:
  ✅ Miembro de familia (sin cadenas/azoteas, no venta/regalo/abandono)
  ✅ Compromiso de esterilización y atención veterinaria continua
  ✅ Seguimiento con fotos y visitas (2 semanas, 1 mes, 6 meses y 1 año)`;

    this.adoptionService.createRequest(pet.id, message).subscribe({
      next: () => {
        this.isSubmittingAdoption.set(false);
        this.adoptionSubmittedSuccess.set(true);
        this.notify.success('¡Solicitud de adopción enviada al rescatista!');
      },
      error: (err) => {
        this.isSubmittingAdoption.set(false);
        const msg = err.error?.message || 'Error al enviar la solicitud';
        this.notify.error(msg);
      },
    });
  }

  getAdoptionWhatsAppUrl(): string {
    const pet = this.selectedPetForAdoption();
    if (!pet) return '';

    const phone = pet.owner?.phone || '4181234567';
    const text = encodeURIComponent(
      `¡Hola! Vi en ${this.brand.name} a ${pet.name} (${pet.species}) en adopción en Dolores Hidalgo. Me encantaría postularme para adoptarlo(a). ¿Podemos platicar sobre los requisitos?`,
    );

    return `https://wa.me/52${phone.replace(/\D/g, '')}?text=${text}`;
  }

  getDirectWhatsAppUrl(phone: string, message: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanNumber = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  }

  // ==========================================
  // SIGHTINGS MODAL
  // ==========================================
  openSightingModal(report: LostPetReport): void {
    if (!this.authService.isAuthenticated()) {
      this.notify.warning('Inicia sesión para reportar el avistamiento de esta mascota');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/' } });
      return;
    }
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.selectedLostPetForSighting.set(report);
    this.sightingPhotoSource.set('FILE');
    this.sightingPhotoPreview.set(null);
    this.sightingSelectedFile.set(null);
    this.sightingForm = {
      locationDescription: '',
      photoUrl: '',
      additionalNotes: '',
    };
  }

  closeSightingModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
    this.selectedLostPetForSighting.set(null);
    this.sightingPhotoPreview.set(null);
    this.sightingSelectedFile.set(null);
  }

  onSightingFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.sightingSelectedFile.set(file);
      this.imageUploadService.fileToDataUrl(file).then((preview) => {
        this.sightingPhotoPreview.set(preview);
      });
    }
  }

  submitSighting(): void {
    const report = this.selectedLostPetForSighting();
    if (!report) return;

    this.isSubmittingSighting.set(true);

    const executeSighting = (photoUrl?: string) => {
      const payload = {
        locationDescription: this.sightingForm.locationDescription.trim(),
        photoUrl: photoUrl || undefined,
        additionalNotes: this.sightingForm.additionalNotes.trim() || undefined,
      };

      this.lostPetService.addSighting(report.id, payload).subscribe({
        next: () => {
          this.isSubmittingSighting.set(false);
          this.closeSightingModal();
          this.notify.success('¡Aviso de avistamiento enviado con éxito!');
        },
        error: () => {
          this.isSubmittingSighting.set(false);
          this.notify.info('Avistamiento registrado temporalmente.');
          this.closeSightingModal();
        },
      });
    };

    if (this.sightingPhotoSource() === 'FILE' && this.sightingSelectedFile()) {
      this.imageUploadService.uploadImage(this.sightingSelectedFile()!, 'sightings').subscribe({
        next: (uploadedUrl) => executeSighting(uploadedUrl),
        error: () => executeSighting(this.sightingPhotoPreview() || undefined),
      });
    } else {
      const url = this.sightingForm.photoUrl?.trim() || this.sightingPhotoPreview() || undefined;
      executeSighting(url);
    }
  }

  // ==========================================
  // SOCIAL SHARE HELPERS
  // ==========================================
  shareToWhatsApp(post: FeedPost): void {
    const postUrl = post.kind === 'PET_ADOPTION' && post.petData
      ? `${window.location.origin}/adopciones/${post.petData.id}`
      : `${window.location.origin}/perdidas`;
    const text = encodeURIComponent(
      `🐾 *${post.title}* en ${this.brand.name} (${this.brand.city})\n\n"${post.description}"\n\nVer publicación completa: ${postUrl}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  }

  shareToFacebook(post: FeedPost): void {
    const postUrl = post.kind === 'PET_ADOPTION' && post.petData
      ? `${window.location.origin}/adopciones/${post.petData.id}`
      : `${window.location.origin}/perdidas`;
    const url = encodeURIComponent(postUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }

  copyPostLink(post: FeedPost): void {
    const postUrl = post.kind === 'PET_ADOPTION' && post.petData
      ? `${window.location.origin}/adopciones/${post.petData.id}`
      : `${window.location.origin}/perdidas`;
    navigator.clipboard.writeText(postUrl);
    this.notify.success('Enlace de la publicación copiado al portapapeles');
  }

  formatExactDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const datePart = date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timePart = date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} • ${timePart}`;
  }

  formatRelativeTime(dateStr: string): string {
    return this.formatExactDateTime(dateStr);
  }

  ngOnDestroy(): void {
    if (this.commentsPollingTimer) {
      clearInterval(this.commentsPollingTimer);
      this.commentsPollingTimer = null;
    }
    if (this.feedPollingTimer) {
      clearInterval(this.feedPollingTimer);
      this.feedPollingTimer = null;
    }
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }
}
