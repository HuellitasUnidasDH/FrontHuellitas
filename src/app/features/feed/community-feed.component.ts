import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
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
}

@Component({
  selector: 'app-community-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-3.5 sm:px-6 py-5 space-y-6">

      <!-- ======================================================== -->
      <!-- Top Hero Header / Dolores Hidalgo Brand Banner           -->
      <!-- ======================================================== -->
      <section class="liquid-glass rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden transition-all border border-emerald-500/20">
        <div class="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-400/10 to-transparent blur-2xl pointer-events-none"></div>

        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div class="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 flex-shrink-0 animate-bounce duration-1000">
              🐾
            </div>
            <div>
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
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
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              (click)="openPublicationModal()"
              class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>✍️</span> Crear Publicación
            </button>

            @if (authService.isAuthenticated()) {
              <a
                routerLink="/pets/new"
                class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🐾</span> Mis Mascotas
              </a>
            } @else {
              <a
                routerLink="/auth/register"
                class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>✨</span> Unirme
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
      <!-- Interactive Composer Box (Facebook Feed Style)           -->
      <!-- ======================================================== -->
      <section class="liquid-glass rounded-2xl p-4 shadow-xl border border-slate-200/80 dark:border-slate-800/80">
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
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              placeholder="Buscar por nombre, raza o seña..."
              class="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <!-- Colonia Filter (Dolores Hidalgo) -->
          <div class="relative">
            <select
              [(ngModel)]="selectedColoniaId"
              (ngModelChange)="onColoniaChange()"
              class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="">📍 Todas las colonias de Dolores Hgo.</option>
              @for (colonia of colonias(); track colonia.id) {
                <option [value]="colonia.id">{{ colonia.name }} ({{ colonia.zoneType }})</option>
              }
            </select>
          </div>

          <!-- Species Filter -->
          <div class="relative">
            <select
              [(ngModel)]="selectedSpecies"
              (ngModelChange)="onSpeciesChange()"
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
            <article class="liquid-glass-card liquid-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg hover:shadow-2xl flex flex-col justify-between border border-slate-200/80 dark:border-white/10 transition-all duration-300 hover:-translate-y-1">
              
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

              <!-- 2. Post Body / Title & Story (Compact & High Contrast) -->
              <div class="mt-2.5 space-y-1">
                <h2 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight line-clamp-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {{ post.title }}
                </h2>
                <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {{ post.description }}
                </p>
              </div>

              <!-- 3. Post Image (Optimal 16:10 / Compact Height with Floating Specular Badges) -->
              @if (post.photoUrl) {
                <div class="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-slate-950/20 group my-2.5 flex-shrink-0 border border-black/5 dark:border-white/10">
                  <img
                    [src]="post.photoUrl"
                    [alt]="post.title"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  <!-- Floating attributes badge overlay on image -->
                  <div class="absolute bottom-2 inset-x-2 flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-slate-950/75 backdrop-blur-md text-white text-[10px]">
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
                  @if (post.lastSeenLocation) {
                    <span class="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-semibold truncate max-w-full">
                      📍 Visto: {{ post.lastSeenLocation }}
                    </span>
                  }
                  @if (post.reportsCount && post.reportsCount > 1) {
                    <span class="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold">
                      📑 {{ post.reportsCount }} reportes agrupados
                    </span>
                  }
                }
              </div>

              <!-- 4.1. Cascading Incident Reports (Deduplication / Agrupación Comunitaria) -->
              @if (post.kind === 'LOST_PET' && post.sightings && post.sightings.length > 0) {
                <div class="rounded-xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 p-2.5 my-1.5 space-y-2">
                  <div class="flex items-center justify-between gap-1 text-[11px]">
                    <span class="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <span>📍</span> Cascada vecinal ({{ post.sightings.length }} reportes)
                    </span>
                    <span class="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400">Consolidado</span>
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
                    <!-- CTA: ¡Lo he visto! -->
                    <button
                      (click)="openSightingModal(post.lostData)"
                      class="flex-1 justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 active:scale-95 text-white text-xs font-black shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>👀</span>
                      <span>¡Lo vi!</span>
                    </button>

                    <!-- Contact Owner WhatsApp -->
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
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div class="liquid-glass rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl relative border border-rose-500/30 overflow-hidden space-y-4 max-h-[92vh] overflow-y-auto">
            
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
                      Crear Publicación en el Muro Comunitario
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
                      <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Colonia en Dolores Hidalgo
                      </label>
                      <select
                        [(ngModel)]="reportLostForm.coloniaId"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="">Selecciona la colonia...</option>
                        @for (col of colonias(); track col.id) {
                          <option [value]="col.id">{{ col.name }}</option>
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

                  <!-- Fotografía / Afiche -->
                  <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      {{ currentCategoryConfig.photoLabel }}
                    </label>

                    <div class="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 mb-2 gap-1 text-xs font-bold max-w-sm">
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
                        <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Toca para seleccionar imagen desde celular o PC</span>
                        <span class="text-[10px] text-slate-500 dark:text-slate-400">{{ currentCategoryConfig.photoPlaceholder }}</span>
                        <input
                          type="file"
                          accept="image/*"
                          (change)="onReportLostFileSelected($event)"
                          class="hidden"
                        />
                      </label>
                    } @else {
                      <input
                        type="url"
                        [(ngModel)]="reportLostForm.photoUrl"
                        (ngModelChange)="reportLostPhotoPreview.set($event)"
                        placeholder="https://... o pega enlace directo de imagen"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    }

                    @if (reportLostPhotoPreview() || reportLostForm.photoUrl) {
                      <div class="mt-2 p-2 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-emerald-500/30 flex items-center gap-3">
                        <img
                          [src]="reportLostPhotoPreview() || reportLostForm.photoUrl"
                          alt="Vista previa"
                          class="w-14 h-14 rounded-xl object-cover border border-emerald-500/40 shadow-sm"
                        />
                        <div class="text-xs">
                          <span class="font-bold block text-slate-900 dark:text-white">Imagen lista para difusión</span>
                          <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {{ reportLostPhotoSource() === 'FILE' ? 'Archivo cargado desde tu dispositivo' : 'Enlace web válido' }}
                          </span>
                        </div>
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
                          Al marcar esta opción se eleva la prioridad comunitaria, se alerta a la red de rescate y se agruparán reportes en la misma zona de Dolores Hidalgo en cascada para no duplicar publicaciones.
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
                        <span>{{ currentCategoryConfig.submitButtonIcon }} {{ currentCategoryConfig.submitButtonText }}</span>
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

  // Filters
  activeFilter = signal<FeedFilterType>('ALL');
  searchQuery = '';
  selectedColoniaId = '';
  selectedSpecies = '';
  filterGoodWithKids = signal<boolean>(false);
  filterGoodWithPets = signal<boolean>(false);
  showFiltersPanel = signal<boolean>(false);

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
    const query = this.searchQuery.toLowerCase().trim();
    const coloniaId = this.selectedColoniaId;
    const species = this.selectedSpecies.toLowerCase().trim();
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

    // 2. Search query
    if (query) {
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.species.toLowerCase().includes(query) ||
          (p.breed && p.breed.toLowerCase().includes(query)) ||
          (p.coloniaName && p.coloniaName.toLowerCase().includes(query)),
      );
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
      posts = posts.filter((p) => p.species.toLowerCase() === species);
    }

    // 5. Behavioral
    if (kids) {
      posts = posts.filter((p) => p.kind === 'PET_ADOPTION' && p.goodWithKids === true);
    }
    if (pets) {
      posts = posts.filter((p) => p.kind === 'PET_ADOPTION' && p.goodWithOtherPets === true);
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
  }

  syncFilterFromRoute(): void {
    const url = this.router.url;
    if (url.includes('perdidas')) {
      this.activeFilter.set('SE_BUSCA');
    } else if (url.includes('adopciones')) {
      this.activeFilter.set('EN_ADOPCION');
    } else {
      this.activeFilter.set('ALL');
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

  loadFeed(): void {
    this.isLoading.set(true);

    // Fetch both adoption pets and community publications concurrently
    this.petService.getAdoptionCatalog().subscribe({
      next: (pets) => {
        this.lostPetService.getAll().subscribe({
          next: (reports) => {
            const petPosts: FeedPost[] = (pets || []).map((pet) => ({
              id: `pet-${pet.id}`,
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
              description: pet.rescueStory || `Conoce a ${pet.name}, un hermoso peludito de talla ${pet.size || 'mediana'} que está listo para llenar tu hogar de amor en Dolores Hidalgo.`,
              photoUrl: pet.photoUrl || (pet.photos && pet.photos[0]) || '',
              photos: pet.photos || [],
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
              comments: pet.comments || [],
              showComments: false,
              newCommentText: '',
              isSubmittingComment: false,
            }));

            const lostPosts: FeedPost[] = (reports || []).map((rep) => {
              const meta = this.getPostTypeMetadata(rep);
              return {
                id: `lost-${rep.id}`,
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
                photoUrl: (rep.photos && rep.photos[0]) || '',
                photos: rep.photos || [],
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
                comments: rep.comments || [],
                showComments: false,
                newCommentText: '',
                isSubmittingComment: false,
              };
            });

            // Combine and sort by createdAt descending
            const combined = [...petPosts, ...lostPosts].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );

            this.allPosts.set(combined);
            this.isLoading.set(false);
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
      Boolean(this.searchQuery) ||
      Boolean(this.selectedColoniaId) ||
      Boolean(this.selectedSpecies) ||
      this.filterGoodWithKids() ||
      this.filterGoodWithPets()
    );
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedColoniaId = '';
    this.selectedSpecies = '';
    this.filterGoodWithKids.set(false);
    this.filterGoodWithPets.set(false);
    this.activeFilter.set('ALL');
  }

  onSearchChange(): void {}
  onColoniaChange(): void {}
  onSpeciesChange(): void {}

  onComposerClick(): void {
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

  openPublicationModal(defaultType?: LostPetType): void {
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.isReportLostModalOpen.set(true);
    this.reportLostSuccess.set(null);
    this.reportLostPhotoSource.set('FILE');
    this.reportLostPhotoPreview.set(null);
    this.reportLostSelectedFile.set(null);
    this.reportLostForm.photoUrl = '';
    this.reportLostForm.temperamentTags = [];
    this.reportLostForm.contactPhone = this.authService.currentUser()?.phone || '';
    if (defaultType) {
      this.setModalPublicationType(defaultType);
    } else {
      this.setModalPublicationType('ANIMAL_HERIDO');
    }
  }

  openReportLostModal(): void {
    this.openPublicationModal('SE_BUSCA');
  }

  closeReportLostModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
    this.isReportLostModalOpen.set(false);
    this.reportLostSuccess.set(null);
  }

  toggleComments(post: FeedPost): void {
    post.showComments = !post.showComments;
  }

  submitComment(post: FeedPost): void {
    if (!post.newCommentText || !post.newCommentText.trim()) return;
    if (!this.authService.isAuthenticated()) {
      this.notify.warning('Inicia sesión para dejar un comentario');
      return;
    }

    const text = post.newCommentText.trim();
    post.isSubmittingComment = true;

    const commentObs =
      post.kind === 'LOST_PET' && post.lostData
        ? this.lostPetService.addComment(post.lostData.id, text)
        : post.kind === 'PET_ADOPTION' && post.petData
        ? this.petService.addComment(post.petData.id, text)
        : null;

    if (!commentObs) {
      post.isSubmittingComment = false;
      this.notify.error('No se pudo identificar la publicación');
      return;
    }

    commentObs.subscribe({
      next: (comment) => {
        post.isSubmittingComment = false;
        post.newCommentText = '';
        if (!post.comments) post.comments = [];
        const enrichedComment: PublicationComment = {
          id: comment.id,
          reportId: (comment as any).reportId || (comment as any).petId || post.id,
          authorId: comment.authorId,
          author: comment.author || this.authService.currentUser() || undefined,
          content: comment.content,
          createdAt: comment.createdAt || new Date().toISOString(),
        };
        post.comments.push(enrichedComment);
        this.notify.success('¡Comentario publicado!');
      },
      error: (err) => {
        post.isSubmittingComment = false;
        const msg = err.error?.message || 'Error al enviar el comentario';
        this.notify.error(msg);
      },
    });
  }

  onReportLostFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.reportLostSelectedFile.set(file);
      this.imageUploadService.fileToDataUrl(file).then((preview) => {
        this.reportLostPhotoPreview.set(preview);
      });
    }
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

    this.isSubmittingReportLost.set(true);

    const executeCreation = (finalPhotoUrl?: string) => {
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
        photos: finalPhotoUrl ? [finalPhotoUrl] : [],
        isInjured: this.reportLostForm.isInjured,
        temperamentTags: this.reportLostForm.temperamentTags,
        goodWithKids: this.reportLostForm.temperamentTags.includes('Bueno con niños'),
        goodWithOtherPets:
          this.reportLostForm.temperamentTags.includes('Sociable con perros') ||
          this.reportLostForm.temperamentTags.includes('Convive con gatos'),
      };

      this.lostPetService.create(payload).subscribe({
        next: (newReport) => {
          this.isSubmittingReportLost.set(false);
          this.reportLostSuccess.set(newReport);
          this.notify.success('¡Publicación realizada exitosamente en el Muro!');
          
          const meta = this.getPostTypeMetadata(newReport);
          const newPost: FeedPost = {
            id: `lost-${newReport.id}`,
            kind: 'LOST_PET',
            postType: newReport.type,
            title: meta.title,
            authorName: this.authService.currentUser()?.fullName || 'Ciudadano Solidario',
            authorPhotoUrl: this.authService.currentUser()?.profilePhotoUrl,
            authorRole: meta.authorRole,
            authorColonia: this.colonias().find(c => c.id === newReport.coloniaId)?.name || 'Dolores Hidalgo',
            createdAt: newReport.createdAt || new Date().toISOString(),
            timeAgo: this.formatExactDateTime(newReport.createdAt || new Date().toISOString()),
            temperamentTags: newReport.temperamentTags || this.reportLostForm.temperamentTags || [],
            typeBadge: meta.typeBadge,
            badgeClass: meta.badgeClass,
            description: newReport.distinctiveFeatures,
            photoUrl: (newReport.photos && newReport.photos[0]) || '',
            photos: newReport.photos || [],
            species: newReport.species,
            gender: newReport.gender,
            coloniaName: this.colonias().find(c => c.id === newReport.coloniaId)?.name,
            lostData: newReport,
            lastSeenLocation: newReport.lastSeenLocation,
            contactPhone: newReport.contactPhone,
            rewardOffered: newReport.rewardOffered,
            rewardDetails: newReport.rewardDetails,
            isInjured: newReport.isInjured,
            reportsCount: newReport.reportsCount || (newReport.sightings ? newReport.sightings.length : 1),
            sightings: newReport.sightings || [],
            comments: [],
            showComments: false,
            newCommentText: '',
            isSubmittingComment: false,
          };
          this.allPosts.update(posts => [newPost, ...posts]);
        },
        error: (err) => {
          this.isSubmittingReportLost.set(false);
          const msg = err.error?.message || 'No se pudo registrar la publicación. Por favor intenta de nuevo.';
          this.notify.error(msg);
        },
      });
    };

    if (this.reportLostPhotoSource() === 'FILE' && this.reportLostSelectedFile()) {
      this.imageUploadService.uploadImage(this.reportLostSelectedFile()!, 'lost-pets').subscribe({
        next: (uploadedUrl) => executeCreation(uploadedUrl),
        error: () => executeCreation(this.reportLostPhotoPreview() || undefined),
      });
    } else {
      const url = this.reportLostForm.photoUrl?.trim() || this.reportLostPhotoPreview() || undefined;
      executeCreation(url);
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
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }
}
