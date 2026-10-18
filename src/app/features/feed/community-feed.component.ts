import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../core/services/pet.service';
import { LostPetService } from '../../core/services/lost-pet.service';
import { ColoniaService } from '../../core/services/colonia.service';
import { AdoptionService } from '../../core/services/adoption.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Pet, AdoptionStatus } from '../../core/models/pet.model';
import { LostPetReport, LostPetStatus, LostPetType, PetSighting } from '../../core/models/lost-pet.model';
import { Colonia } from '../../core/models/colonia.model';
import { BRAND_CONFIG } from '../../core/constants/brand.constants';

type FeedFilterType = 'ALL' | 'ADOPTION' | 'LOST' | 'FOUND';

interface FeedPost {
  id: string;
  kind: 'PET_ADOPTION' | 'LOST_PET';
  title: string;
  authorName: string;
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
  // Adoption specifics
  isSterilized?: boolean;
  isVaccinated?: boolean;
  goodWithKids?: boolean;
  goodWithOtherPets?: boolean;
  petData?: Pet;
  // Lost specifics
  lostData?: LostPetReport;
  lastSeenLocation?: string;
  contactPhone?: string;
  rewardOffered?: boolean;
  rewardDetails?: string;
  isInjured?: boolean;
  reportsCount?: number;
  sightings?: PetSighting[];
}

@Component({
  selector: 'app-community-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-6">

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
              (click)="openReportLostModal()"
              class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🚨</span> Reportar Extravío
            </button>

            @if (authService.isAuthenticated()) {
              <a
                routerLink="/pets/new"
                class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>➕</span> Publicar Adopción
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
      <!-- Stories / Quick Filters Bar (Facebook / Instagram Style)  -->
      <!-- ======================================================== -->
      <section class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        <!-- Story 1: Todos -->
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

        <!-- Story 2: En Adopción -->
        <button
          (click)="setFilter('ADOPTION')"
          class="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none"
        >
          <div
            class="w-16 h-16 rounded-2xl p-0.5 transition-all duration-300"
            [ngClass]="activeFilter() === 'ADOPTION' ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 scale-105 shadow-md shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-800 hover:scale-105'"
          >
            <div class="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🏠
            </div>
          </div>
          <span class="text-[11px] font-bold" [ngClass]="activeFilter() === 'ADOPTION' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'">
            En Adopción
          </span>
        </button>

        <!-- Story 3: Perdidos Urgentes -->
        <button
          (click)="setFilter('LOST')"
          class="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none"
        >
          <div
            class="w-16 h-16 rounded-2xl p-0.5 transition-all duration-300 relative"
            [ngClass]="activeFilter() === 'LOST' ? 'bg-gradient-to-tr from-rose-500 to-amber-500 scale-105 shadow-md shadow-rose-500/30' : 'bg-slate-300 dark:bg-slate-800 hover:scale-105'"
          >
            <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 text-[8px] text-white font-bold items-center justify-center">!</span>
            </span>
            <div class="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🚨
            </div>
          </div>
          <span class="text-[11px] font-bold" [ngClass]="activeFilter() === 'LOST' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'">
            Extraviados
          </span>
        </button>

        <!-- Story 4: Encontrados en Calle -->
        <button
          (click)="setFilter('FOUND')"
          class="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none"
        >
          <div
            class="w-16 h-16 rounded-2xl p-0.5 transition-all duration-300"
            [ngClass]="activeFilter() === 'FOUND' ? 'bg-gradient-to-tr from-sky-500 to-indigo-500 scale-105 shadow-md shadow-sky-500/30' : 'bg-slate-300 dark:bg-slate-800 hover:scale-105'"
          >
            <div class="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📍
            </div>
          </div>
          <span class="text-[11px] font-bold" [ngClass]="activeFilter() === 'FOUND' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400'">
            Encontrados
          </span>
        </button>
      </section>

      <!-- ======================================================== -->
      <!-- Interactive Composer Box (Facebook Feed Style)           -->
      <!-- ======================================================== -->
      <section class="liquid-glass rounded-2xl p-4 shadow-xl border border-slate-200/80 dark:border-slate-800/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-sm flex-shrink-0 shadow-sm">
            @if (authService.currentUser()?.fullName) {
              {{ authService.currentUser()?.fullName?.charAt(0) }}
            } @else {
              🐾
            }
          </div>

          <div
            (click)="onComposerClick()"
            class="flex-1 bg-slate-100 dark:bg-slate-950/60 hover:bg-slate-200/80 dark:hover:bg-slate-900 px-4 py-2.5 rounded-full text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-pointer transition-colors border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
          >
            <span>¿Encontraste o rescataste un peludito en Dolores Hidalgo?</span>
            <span class="text-emerald-500 font-bold text-xs hidden sm:inline">Publicar ✍️</span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
          <button
            (click)="setFilter('ADOPTION')"
            class="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors cursor-pointer"
          >
            <span class="text-base">🏠</span>
            <span class="hidden sm:inline">Dar en</span> Adopción
          </button>

          <span class="text-slate-300 dark:text-slate-700">|</span>

          <button
            (click)="openReportLostModal()"
            class="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition-colors cursor-pointer"
          >
            <span class="text-base">🚨</span>
            <span class="hidden sm:inline">Reportar</span> Extraviado
          </button>

          <span class="text-slate-300 dark:text-slate-700">|</span>

          <button
            (click)="toggleFiltersPanel()"
            class="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 font-semibold transition-colors cursor-pointer"
          >
            <span class="text-base">🔍</span>
            <span>Filtrar</span> Colonia
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
      <section class="space-y-6">
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
              class="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-md cursor-pointer"
            >
              Ver todas las publicaciones
            </button>
          </div>
        } @else {
          @for (post of filteredPosts(); track post.id) {
            <article class="liquid-glass-card liquid-glass rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 border border-slate-200/80 dark:border-slate-800/80">
              
              <!-- 1. Post Header (Author, Badge, Timestamp) -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-lg font-black text-slate-700 dark:text-slate-300 shadow-sm border border-white/20 flex-shrink-0">
                    {{ post.authorName.charAt(0) }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {{ post.authorName }}
                      </span>
                      <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        • {{ post.authorRole }}
                      </span>
                    </div>

                    <div class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>📍 {{ post.authorColonia || 'Dolores Hidalgo' }}</span>
                      <span>•</span>
                      <span>{{ post.timeAgo }}</span>
                    </div>
                  </div>
                </div>

                <!-- Post Kind Badge & Injured Badge -->
                <div class="flex flex-col sm:flex-row items-end sm:items-center gap-1.5">
                  @if (post.isInjured) {
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md shadow-rose-600/30 flex items-center gap-1 animate-pulse">
                      <span>🚨</span> Mascota Herida
                    </span>
                  }
                  <span
                    class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-sm"
                    [ngClass]="post.badgeClass"
                  >
                    {{ post.typeBadge }}
                  </span>
                </div>
              </div>

              <!-- 2. Post Body / Title & Story -->
              <div class="space-y-2">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {{ post.title }}
                </h2>
                <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {{ post.description }}
                </p>
              </div>

              <!-- 3. Post Image (Crisp, High Quality, Responsive with Badges Overlay) -->
              @if (post.photoUrl) {
                <div class="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-950/20 group">
                  <img
                    [src]="post.photoUrl"
                    [alt]="post.title"
                    class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    loading="lazy"
                  />

                  <!-- Floating attributes badge overlay on image -->
                  <div class="absolute bottom-3 inset-x-3 flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-950/70 backdrop-blur-md text-white text-[11px]">
                    <span class="font-bold">🐾 {{ post.species }}</span>
                    @if (post.breed) {
                      <span>• {{ post.breed }}</span>
                    }
                    @if (post.approxAge) {
                      <span class="bg-white/20 px-2 py-0.5 rounded-md">🎂 {{ post.approxAge }}</span>
                    }
                    @if (post.size) {
                      <span class="bg-white/20 px-2 py-0.5 rounded-md">📏 Talla {{ post.size }}</span>
                    }
                    @if (post.coloniaName) {
                      <span class="ml-auto text-emerald-300 font-bold">📍 {{ post.coloniaName }}</span>
                    }
                  </div>
                </div>
              }

              <!-- 4. Tactical Attribute Tags (Health, Behavior, Rewards) -->
              <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
                @if (post.kind === 'PET_ADOPTION') {
                  @if (post.isSterilized) {
                    <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                      ✂️ Esterilizado(a)
                    </span>
                  }
                  @if (post.isVaccinated) {
                    <span class="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30 font-semibold">
                      💉 Cuadro de Vacunas
                    </span>
                  }
                  @if (post.goodWithKids) {
                    <span class="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 font-semibold">
                      👶 Bueno con niños
                    </span>
                  }
                  @if (post.goodWithOtherPets) {
                    <span class="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 font-semibold">
                      🐕 Amigable con mascotas
                    </span>
                  }
                } @else if (post.kind === 'LOST_PET') {
                  @if (post.rewardOffered) {
                    <span class="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 font-bold animate-pulse">
                      🎁 Recompensa: {{ post.rewardDetails || 'Ofrecida' }}
                    </span>
                  }
                  @if (post.lastSeenLocation) {
                    <span class="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-semibold">
                      📍 Visto en: {{ post.lastSeenLocation }}
                    </span>
                  }
                  @if (post.reportsCount && post.reportsCount > 1) {
                    <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold">
                      📑 {{ post.reportsCount }} reportes agrupados en la zona
                    </span>
                  }
                }
              </div>

              <!-- 4.1. Cascading Incident Reports (Deduplication / Agrupación Comunitaria) -->
              @if (post.kind === 'LOST_PET' && post.sightings && post.sightings.length > 0) {
                <div class="rounded-2xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 p-3.5 sm:p-4 space-y-3">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                        📍
                      </div>
                      <div>
                        <h4 class="text-xs font-bold text-slate-900 dark:text-white">
                          Seguimiento Vecinal en Cascada ({{ post.sightings.length }} reportes agrupados)
                        </h4>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400">
                          Para no saturar el muro, los reportes en el mismo perímetro se consolidan en este caso principal.
                        </p>
                      </div>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Caso Activo Consolidado
                    </span>
                  </div>

                  <!-- Cascade list -->
                  <div class="space-y-2 pt-1 border-t border-amber-500/20">
                    @for (sighting of post.sightings; track sighting.id) {
                      <div class="flex items-start gap-3 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                        @if (sighting.photoUrl) {
                          <img
                            [src]="sighting.photoUrl"
                            alt="Foto reporte ciudadano"
                            class="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                        }
                        <div class="flex-1 min-w-0 space-y-0.5">
                          <div class="flex items-center justify-between gap-1">
                            <span class="font-bold text-slate-900 dark:text-white text-[11px] truncate">
                              {{ sighting.notifier?.fullName || 'Vecino solidario de Dolores Hidalgo' }}
                            </span>
                            <span class="text-[10px] text-slate-400 flex-shrink-0">
                              {{ formatRelativeTime(sighting.createdAt) }}
                            </span>
                          </div>
                          <div class="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            <span class="text-rose-500 font-bold">Ubicación:</span> {{ sighting.locationDescription }}
                          </div>
                          @if (sighting.additionalNotes) {
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              "{{ sighting.additionalNotes }}"
                            </p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- 5. Social Actions & CTA Buttons (ITEM #2: Quiero Adoptar Flow) -->
              <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                <div class="flex items-center gap-2 w-full sm:w-auto">
                  @if (post.kind === 'PET_ADOPTION' && post.petData) {
                    <!-- Main CTA: Quiero Adoptar -->
                    <button
                      (click)="openAdoptionModal(post.petData)"
                      class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>💚</span>
                      <span>Quiero Adoptar</span>
                    </button>

                    <!-- Ver Ficha Completa -->
                    <a
                      [routerLink]="['/adopciones', post.petData.id]"
                      class="px-3.5 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>👁️</span>
                      <span>Ficha</span>
                    </a>
                  } @else if (post.kind === 'LOST_PET' && post.lostData) {
                    <!-- CTA: ¡Lo he visto! -->
                    <button
                      (click)="openSightingModal(post.lostData)"
                      class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white text-xs font-black shadow-lg shadow-rose-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>👀</span>
                      <span>¡Lo he visto!</span>
                    </button>

                    <!-- Contact Owner WhatsApp -->
                    @if (post.contactPhone) {
                      <a
                        [href]="getDirectWhatsAppUrl(post.contactPhone, 'Hola, vi la publicación de ' + post.title + ' en Huellitas Dolores Hidalgo')"
                        target="_blank"
                        class="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>📲</span>
                        <span>WhatsApp</span>
                      </a>
                    }
                  }
                </div>

                <!-- Secondary Share Actions (WhatsApp & Facebook) -->
                <div class="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                  <button
                    (click)="shareToWhatsApp(post)"
                    class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-500/20 hover:text-emerald-500 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer flex items-center gap-1"
                    title="Compartir en grupos de WhatsApp"
                  >
                    <span>💬</span>
                    <span class="text-[11px] font-semibold hidden sm:inline">WhatsApp</span>
                  </button>

                  <button
                    (click)="shareToFacebook(post)"
                    class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-sky-500/20 hover:text-sky-500 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer flex items-center gap-1"
                    title="Compartir en Facebook"
                  >
                    <span>🌐</span>
                    <span class="text-[11px] font-semibold hidden sm:inline">Facebook</span>
                  </button>

                  <button
                    (click)="copyPostLink(post)"
                    class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                    title="Copiar enlace"
                  >
                    🔗
                  </button>
                </div>
              </div>
            </article>
          }
        }
      </section>

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
                  <p class="text-xs text-slate-600 dark:text-slate-300">
                    Por favor responde estas breves preguntas para garantizar el bienestar de <strong>{{ selectedPetForAdoption()!.name }}</strong>:
                  </p>

                  <div class="space-y-3">
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        1. ¿En qué tipo de vivienda vivirá?
                      </label>
                      <select
                        [(ngModel)]="adoptionForm.housingType"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="CASA_PROPIA">Casa propia con patio o jardín cercado</option>
                        <option value="CASA_RENTA">Casa en renta (con permiso explícito para mascotas)</option>
                        <option value="DEPARTAMENTO">Departamento / Espacio interior</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        2. ¿Tienes otras mascotas actualmente?
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="adoptionForm.currentPets"
                        placeholder="Ej: 1 perrito mestizo de 3 años, esterilizado / Ninguna"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        3. ¿Por qué deseas adoptar a {{ selectedPetForAdoption()!.name }}?
                      </label>
                      <textarea
                        [(ngModel)]="adoptionForm.reason"
                        rows="3"
                        placeholder="Platícanos sobre tu familia, tu rutina y el espacio que le ofrecerás..."
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      ></textarea>
                    </div>
                  </div>

                  <!-- Submit Action -->
                  <div class="pt-3 flex gap-2">
                    <button
                      (click)="submitAdoptionRequest()"
                      [disabled]="isSubmittingAdoption()"
                      class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                    >
                      @if (isSubmittingAdoption()) {
                        <div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>Enviando...</span>
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
                  <div class="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                    🚨
                  </div>
                  <div>
                    <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Reportar Mascota Extraviada o Encontrada
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      Red solidaria de búsqueda y rescate en Dolores Hidalgo
                    </p>
                  </div>
                </div>

                <!-- Type Selector Tabs: Se Busca vs Encontrado -->
                <div class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 text-xs font-bold">
                  <button
                    type="button"
                    (click)="reportLostForm.type = 'EXTRAVIADA'"
                    [ngClass]="reportLostForm.type === 'EXTRAVIADA' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'"
                    class="py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>🚨</span>
                    <span>Se Extravió Mi Mascota</span>
                  </button>
                  <button
                    type="button"
                    (click)="reportLostForm.type = 'ENCONTRADA_EN_CALLE'"
                    [ngClass]="reportLostForm.type === 'ENCONTRADA_EN_CALLE' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'"
                    class="py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>📍</span>
                    <span>Encontré un Peludito</span>
                  </button>
                </div>

                <!-- Form Fields Grid -->
                <div class="space-y-3 text-xs">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Nombre de la mascota
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="reportLostForm.petName"
                        placeholder="Ej: Firulais, Max (o 'Sin nombre')"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Especie y Género
                      </label>
                      <div class="grid grid-cols-2 gap-2">
                        <select
                          [(ngModel)]="reportLostForm.species"
                          class="w-full px-2 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                        >
                          <option value="Perro">🐕 Perro</option>
                          <option value="Gato">🐈 Gato</option>
                          <option value="Otro">🐾 Otro</option>
                        </select>
                        <select
                          [(ngModel)]="reportLostForm.gender"
                          class="w-full px-2 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                        >
                          <option value="Macho">Macho</option>
                          <option value="Hembra">Hembra</option>
                          <option value="Desconocido">Desconocido</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Colonia en Dolores Hidalgo
                      </label>
                      <select
                        [(ngModel)]="reportLostForm.coloniaId"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 cursor-pointer"
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
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Lugar o punto de referencia exacto
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="reportLostForm.lastSeenLocation"
                      placeholder="Ej: Cerca de la Alameda, frente a la escuela Primaria..."
                      class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Señas particulares (Color, collar, tamaño, comportamiento)
                    </label>
                    <textarea
                      [(ngModel)]="reportLostForm.distinctiveFeatures"
                      rows="2"
                      placeholder="Ej: Color café claro con pecho blanco, collar rojo sin placa, es asustadizo..."
                      class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                    ></textarea>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Enlace a Foto (Opcional)
                    </label>
                    <input
                      type="url"
                      [(ngModel)]="reportLostForm.photoUrl"
                      placeholder="https://... o pega enlace de imagen"
                      class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  @if (reportLostForm.type === 'EXTRAVIADA') {
                    <div class="flex items-center gap-3 pt-1">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          [(ngModel)]="reportLostForm.rewardOffered"
                          class="rounded text-rose-500 focus:ring-rose-400"
                        />
                        <span class="font-bold text-slate-700 dark:text-slate-300">Ofrecer recompensa</span>
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
                  <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="isInjuredCheckbox"
                      [(ngModel)]="reportLostForm.isInjured"
                      class="rounded text-rose-600 focus:ring-rose-500 mt-0.5 h-4 w-4 cursor-pointer"
                    />
                    <label for="isInjuredCheckbox" class="text-xs cursor-pointer select-none">
                      <span class="font-black text-rose-700 dark:text-rose-400 flex items-center gap-1">
                        <span>🚨</span> ¿La mascota está herida o requiere atención médica urgente?
                      </span>
                      <span class="text-slate-600 dark:text-slate-400 text-[11px] block mt-0.5 leading-tight">
                        Al marcar esta opción se eleva la prioridad comunitaria, se alerta a la red de rescate y se agruparán reportes en la misma zona de Dolores Hidalgo en cascada para no duplicar publicaciones.
                      </span>
                    </label>
                  </div>

                  <div class="pt-3 flex gap-2">
                    <button
                      (click)="submitReportLost()"
                      [disabled]="isSubmittingReportLost() || !reportLostForm.lastSeenLocation.trim() || !reportLostForm.distinctiveFeatures.trim()"
                      class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                    >
                      @if (isSubmittingReportLost()) {
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Publicando Alerta...</span>
                      } @else {
                        <span>🚨 Publicar Alerta Inmediata</span>
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
export class CommunityFeedComponent implements OnInit {
  brand = BRAND_CONFIG;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private petService = inject(PetService);
  private lostPetService = inject(LostPetService);
  private coloniaService = inject(ColoniaService);
  private adoptionService = inject(AdoptionService);
  public authService = inject(AuthService);
  private notify = inject(NotificationService);

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
    housingType: 'CASA_PROPIA',
    currentPets: '',
    reason: '',
  };

  // Sighting modal state
  selectedLostPetForSighting = signal<LostPetReport | null>(null);
  isSubmittingSighting = signal<boolean>(false);
  sightingForm = {
    locationDescription: '',
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

    // 1. Kind filter
    if (filter === 'ADOPTION') {
      posts = posts.filter((p) => p.kind === 'PET_ADOPTION');
    } else if (filter === 'LOST') {
      posts = posts.filter((p) => p.kind === 'LOST_PET' && p.lostData?.type === 'EXTRAVIADA');
    } else if (filter === 'FOUND') {
      posts = posts.filter((p) => p.kind === 'LOST_PET' && p.lostData?.type === 'ENCONTRADA_EN_CALLE');
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
  reportLostForm = {
    type: 'EXTRAVIADA' as LostPetType,
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
  };

  ngOnInit(): void {
    this.syncFilterFromRoute();
    this.loadColonias();
    this.loadFeed();
  }

  syncFilterFromRoute(): void {
    const url = this.router.url;
    if (url.includes('perdidas')) {
      this.activeFilter.set('LOST');
    } else if (url.includes('adopciones')) {
      this.activeFilter.set('ADOPTION');
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

  loadFeed(): void {
    this.isLoading.set(true);

    // Fetch both adoption pets and lost pet reports concurrently
    this.petService.getAdoptionCatalog().subscribe({
      next: (pets) => {
        this.lostPetService.getAll().subscribe({
          next: (reports) => {
            const petPosts: FeedPost[] = (pets || []).map((pet) => ({
              id: `pet-${pet.id}`,
              kind: 'PET_ADOPTION',
              title: `${pet.name} busca una familia amorosa`,
              authorName: pet.owner?.fullName || 'Rescatista Huellitas',
              authorRole: 'Rescatista Verificado',
              authorColonia: pet.colonia?.name || 'Dolores Hidalgo',
              createdAt: pet.createdAt,
              timeAgo: this.formatRelativeTime(pet.createdAt),
              typeBadge: '🏠 En Adopción',
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
            }));

            const lostPosts: FeedPost[] = (reports || []).map((rep) => {
              const isLost = rep.type === 'EXTRAVIADA';
              return {
                id: `lost-${rep.id}`,
                kind: 'LOST_PET',
                title: isLost ? `🚨 Se busca a ${rep.petName} (Extraviado)` : `📍 Encontrado en calle: ${rep.petName}`,
                authorName: rep.reporter?.fullName || 'Ciudadano DH',
                authorRole: isLost ? 'Dueño en Búsqueda' : 'Resguardo Temporal',
                authorColonia: rep.colonia?.name || 'Dolores Hidalgo',
                createdAt: rep.createdAt,
                timeAgo: this.formatRelativeTime(rep.createdAt),
                typeBadge: isLost ? '🚨 Se Busca' : '📍 Encontrado',
                badgeClass: isLost
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
                description: rep.distinctiveFeatures || `Visto por última vez en ${rep.lastSeenLocation}. Por favor ayuda compartiendo este reporte.`,
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
    if (filter === 'LOST') {
      this.router.navigate([], { queryParams: { tab: 'perdidos' }, replaceUrl: true });
    } else if (filter === 'ADOPTION') {
      this.router.navigate([], { queryParams: { tab: 'adopciones' }, replaceUrl: true });
    } else if (filter === 'FOUND') {
      this.router.navigate([], { queryParams: { tab: 'encontrados' }, replaceUrl: true });
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
    this.openReportLostModal();
  }

  openReportLostModal(): void {
    this.isReportLostModalOpen.set(true);
    this.reportLostSuccess.set(null);
    this.reportLostForm.contactPhone = this.authService.currentUser()?.phone || '';
  }

  closeReportLostModal(): void {
    this.isReportLostModalOpen.set(false);
    this.reportLostSuccess.set(null);
  }

  submitReportLost(): void {
    if (!this.reportLostForm.lastSeenLocation.trim() || !this.reportLostForm.distinctiveFeatures.trim()) {
      this.notify.warning('Por favor indica el lugar de avistamiento y señas particulares');
      return;
    }

    this.isSubmittingReportLost.set(true);

    const payload = {
      type: this.reportLostForm.type,
      species: this.reportLostForm.species,
      petName: this.reportLostForm.petName.trim() || 'Peludito sin identificar',
      gender: this.reportLostForm.gender,
      coloniaId: this.reportLostForm.coloniaId || undefined,
      lastSeenLocation: this.reportLostForm.lastSeenLocation.trim(),
      incidentDate: this.reportLostForm.incidentDate || new Date().toISOString().split('T')[0],
      distinctiveFeatures: this.reportLostForm.distinctiveFeatures.trim(),
      contactPhone: this.reportLostForm.contactPhone.trim() || '4181234567',
      rewardOffered: this.reportLostForm.rewardOffered,
      rewardDetails: this.reportLostForm.rewardDetails.trim() || undefined,
      photos: this.reportLostForm.photoUrl ? [this.reportLostForm.photoUrl.trim()] : [],
      isInjured: this.reportLostForm.isInjured,
    };

    this.lostPetService.create(payload).subscribe({
      next: (newReport) => {
        this.isSubmittingReportLost.set(false);
        this.reportLostSuccess.set(newReport);
        this.notify.success('¡Alerta publicada exitosamente en el Muro de Dolores Hidalgo!');
        
        const isLost = newReport.type === 'EXTRAVIADA';
        const newPost: FeedPost = {
          id: `lost-${newReport.id}`,
          kind: 'LOST_PET',
          title: isLost ? `🚨 Se busca a ${newReport.petName} (Extraviado)` : `📍 Encontrado en calle: ${newReport.petName}`,
          authorName: this.authService.currentUser()?.fullName || 'Ciudadano DH',
          authorRole: isLost ? 'Dueño en Búsqueda' : 'Resguardo Temporal',
          authorColonia: this.colonias().find(c => c.id === newReport.coloniaId)?.name || 'Dolores Hidalgo',
          createdAt: new Date().toISOString(),
          timeAgo: 'Hace un momento',
          typeBadge: isLost ? '🚨 Se Busca' : '📍 Encontrado',
          badgeClass: isLost
            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
            : 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
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
        };
        this.allPosts.update(posts => [newPost, ...posts]);
      },
      error: (err) => {
        this.isSubmittingReportLost.set(false);
        const msg = err.error?.message || 'No se pudo registrar el reporte. Por favor intenta de nuevo.';
        this.notify.error(msg);
      },
    });
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
    this.selectedPetForAdoption.set(pet);
    this.adoptionSubmittedSuccess.set(false);
    this.adoptionForm = {
      housingType: 'CASA_PROPIA',
      currentPets: '',
      reason: '',
    };
  }

  closeAdoptionModal(): void {
    this.selectedPetForAdoption.set(null);
    this.adoptionSubmittedSuccess.set(false);
  }

  submitAdoptionRequest(): void {
    const pet = this.selectedPetForAdoption();
    if (!pet) return;

    this.isSubmittingAdoption.set(true);

    const message = `[Solicitud Huellitas DH]\nVivienda: ${this.adoptionForm.housingType}\nOtras mascotas: ${this.adoptionForm.currentPets || 'Ninguna'}\nMotivo: ${this.adoptionForm.reason || 'Deseo brindarle un hogar seguro'}`;

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
    this.selectedLostPetForSighting.set(report);
    this.sightingForm = {
      locationDescription: '',
      additionalNotes: '',
    };
  }

  closeSightingModal(): void {
    this.selectedLostPetForSighting.set(null);
  }

  submitSighting(): void {
    const report = this.selectedLostPetForSighting();
    if (!report) return;

    this.isSubmittingSighting.set(true);
    this.lostPetService.addSighting(report.id, this.sightingForm).subscribe({
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

  formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace unos momentos';
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }
}
