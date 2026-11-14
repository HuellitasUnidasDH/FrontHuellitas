import { Component, OnInit, OnDestroy, inject, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../core/services/pet.service';
import { LostPetService } from '../../core/services/lost-pet.service';
import { ColoniaService } from '../../core/services/colonia.service';
import { AdoptionService } from '../../core/services/adoption.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { DirectMessageService } from '../../core/services/direct-message.service';
import { ImageUploadService } from '../../core/services/image-upload.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { PushNotificationService } from '../../core/services/push-notification.service';
import { Pet, AdoptionStatus, PetSize } from '../../core/models/pet.model';
import { UserRole } from '../../core/models/user.model';
import { CreateAdoptionRequestPayload } from '../../core/models/adoption.model';
import { LostPetReport, LostPetStatus, LostPetType, PetSighting, PublicationComment } from '../../core/models/lost-pet.model';
import { Colonia } from '../../core/models/colonia.model';
import { BRAND_CONFIG } from '../../core/constants/brand.constants';
import { AdoptionRequestFormComponent } from '../adoptions/shared/adoption-request-form.component';
import { ReportContentModalComponent } from '../../shared/components/report-content-modal/report-content-modal.component';
import { ReportTargetType } from '../../core/services/moderation.service';

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
  imports: [CommonModule, RouterLink, RouterModule, FormsModule, AdoptionRequestFormComponent, ReportContentModalComponent],
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

      @if (singlePostModeId()) {
        <div class="liquid-glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-emerald-500/35 shadow-xl max-w-3xl mx-auto w-full">
          <button
            type="button"
            (click)="exitSinglePostView()"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer transition-all shadow-md"
          >
            <span>←</span>
            <span>Ir al Muro Principal (Ver todas las publicaciones)</span>
          </button>
          <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
            <span>📌</span>
            <span>Vista directa de publicación compartida</span>
          </span>
        </div>
      } @else {
      <!-- ======================================================== -->
      <!-- Compact Top Header (Minimalista y Enfocado)               -->
      <!-- ======================================================== -->
      <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              🐾 Muro {{ brand.name }}
            </h1>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
              {{ brand.city }}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Adopción responsable, rescates y reportes vecinales en un solo lugar.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            (click)="refreshFeedSilently(true)"
            [disabled]="isRefreshingFeed()"
            title="Actualizar muro"
            class="px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span [ngClass]="{ 'animate-spin': isRefreshingFeed() }">🔄</span>
            <span class="hidden sm:inline">Actualizar</span>
          </button>

          @if (authService.isAuthenticated()) {
            <button
              type="button"
              (click)="openPublicationModal()"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>✍️</span>
              <span>Publicar</span>
            </button>
          } @else {
            <a
              routerLink="/auth/login"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>🔑</span>
              <span>Iniciar sesión</span>
            </a>
            <a
              routerLink="/auth/register"
              class="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              Registrarme
            </a>
          }
        </div>
      </section>

      <!-- ======================================================== -->
      <!-- Slim Category Pills + Unified Search & Colonia Bar       -->
      <!-- ======================================================== -->
      <section class="liquid-glass rounded-2xl p-3 sm:p-4 shadow-lg border border-slate-200/70 dark:border-slate-800/70 space-y-3">
        <!-- Category Chips Strip -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            (click)="setFilter('ALL')"
            [ngClass]="activeFilter() === 'ALL' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm font-black' : 'bg-slate-100 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold'"
            class="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🌐</span>
            <span>Todo</span>
          </button>

          <button
            type="button"
            (click)="setFilter('ANIMAL_HERIDO')"
            [ngClass]="activeFilter() === 'ANIMAL_HERIDO' ? 'bg-rose-600 text-white shadow-sm font-black' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 font-semibold'"
            class="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🚨</span>
            <span>Herido</span>
          </button>

          <button
            type="button"
            (click)="setFilter('EN_RESGUARDO')"
            [ngClass]="activeFilter() === 'EN_RESGUARDO' ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-semibold'"
            class="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🏠</span>
            <span>Resguardo</span>
          </button>

          <button
            type="button"
            (click)="setFilter('EN_ADOPCION')"
            [ngClass]="activeFilter() === 'EN_ADOPCION' || activeFilter() === 'ADOPTION' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-semibold'"
            class="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>💚</span>
            <span>Adopción</span>
          </button>

          <button
            type="button"
            (click)="setFilter('SE_BUSCA')"
            [ngClass]="activeFilter() === 'SE_BUSCA' || activeFilter() === 'LOST' ? 'bg-rose-500 text-white shadow-sm font-black' : 'bg-slate-100 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold'"
            class="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🔍</span>
            <span>Se Busca</span>
          </button>

          <button
            type="button"
            (click)="setFilter('CAMPANA_COMUNITARIA')"
            [ngClass]="activeFilter() === 'CAMPANA_COMUNITARIA' ? 'bg-purple-600 text-white shadow-sm font-black' : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 font-semibold'"
            class="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📢</span>
            <span>Campañas</span>
          </button>
        </div>

        <!-- Search + Colonia + Collapsible Advanced Filters Toggle -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div class="relative flex-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Buscar por nombre, calle, raza o descripción..."
              class="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            [ngModel]="selectedColoniaId()"
            (ngModelChange)="selectedColoniaId.set($event)"
            class="sm:w-56 px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="">📍 Todas las colonias</option>
            @for (colonia of colonias(); track colonia.id) {
              <option [value]="colonia.id">{{ colonia.postalCode ? '[' + colonia.postalCode + '] ' : '' }}{{ colonia.name }}</option>
            }
          </select>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="toggleFiltersPanel()"
              [ngClass]="showFiltersPanel() || selectedSpecies() || filterGoodWithKids() || filterGoodWithPets() ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40' : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'"
              class="flex-1 sm:flex-none px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>🎛️</span>
              <span>Filtros</span>
              <span class="text-[10px]">{{ showFiltersPanel() ? '▲' : '▼' }}</span>
            </button>

            @if (hasActiveFilters()) {
              <button
                type="button"
                (click)="clearFilters()"
                class="px-2.5 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer hover:bg-rose-500/20"
                title="Limpiar filtros"
              >
                ✕
              </button>
            }
          </div>
        </div>

        <!-- Collapsible Extra Filters -->
        @if (showFiltersPanel()) {
          <div class="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center gap-2 text-xs animate-fadeIn">
            <select
              [ngModel]="selectedSpecies()"
              (ngModelChange)="selectedSpecies.set($event)"
              class="px-3 py-1.5 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">🐾 Todas las especies</option>
              <option value="Perro">🐕 Perros</option>
              <option value="Gato">🐈 Gatos</option>
            </select>

            <button
              type="button"
              (click)="toggleGoodWithKids()"
              [ngClass]="filterGoodWithKids() ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
              class="px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              👶 Bueno con niños
            </button>

            <button
              type="button"
              (click)="toggleGoodWithPets()"
              [ngClass]="filterGoodWithPets() ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
              class="px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              🐕 Convive con mascotas
            </button>
          </div>
        }
      </section>
      }

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
            {{ singlePostModeId() ? 'Esta publicación ya no está disponible' : 'No hay publicaciones con estos filtros' }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {{ singlePostModeId() ? 'Es posible que haya sido resuelta o dada de baja por su autor.' : 'Intenta cambiar de colonia o selecciona "Todo el Muro" para ver a todos los peluditos de Dolores Hidalgo.' }}
          </p>
          <button
            (click)="exitSinglePostView()"
            class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-all"
          >
            Ver todas las publicaciones del Muro
          </button>
        </div>
      } @else {
        <section
          class="grid grid-cols-1 gap-4 sm:gap-6 items-stretch"
          [ngClass]="singlePostModeId() ? 'max-w-3xl mx-auto w-full' : 'md:grid-cols-2'"
        >
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
                <h2
                  (click)="openSinglePostView(post)"
                  title="Ver publicación directa y comentarios"
                  class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-snug break-words hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline cursor-pointer transition-colors inline-flex items-baseline gap-1.5 group/title"
                >
                  <span>{{ post.title }}</span>
                  @if (!singlePostModeId()) {
                    <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 opacity-60 group-hover/title:opacity-100 transition-opacity shrink-0">↗</span>
                  }
                </h2>
                <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {{ post.description }}
                </p>
              </div>

              <!-- 3. Post Image Gallery (Limpia, sin barras de texto encima) -->
              @if (post.photoUrl || (post.photos && post.photos.length > 0)) {
                <div class="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-slate-950/15 group my-2.5 flex-shrink-0 border border-black/5 dark:border-white/10">
                  <img
                    [src]="getPostCurrentPhoto(post)"
                    [alt]="post.title"
                    (click)="openLightbox(post, post.activePhotoIndex || 0)"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                    loading="lazy"
                    title="Toca para ampliar"
                  />

                  @if (post.photos && post.photos.length > 1) {
                    <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold pointer-events-none">
                      📷 {{ (post.activePhotoIndex || 0) + 1 }}/{{ post.photos.length }}
                    </span>

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
                </div>

                @if (singlePostModeId() && post.photos && post.photos.length > 1) {
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

              <!-- 4. Metadata & Tags Concisos -->
              <div class="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] my-1.5">
                @if (post.coloniaName || post.lastSeenLocation) {
                  <span class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold truncate max-w-full">
                    📍 {{ post.coloniaName || 'Dolores Hgo.' }}{{ post.lastSeenLocation ? ' · ' + post.lastSeenLocation : '' }}
                  </span>
                }

                @if (post.postType !== 'CAMPANA_COMUNITARIA') {
                  <span class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold">
                    🐾 {{ post.species }}{{ post.approxAge ? ' · ' + post.approxAge : '' }}
                  </span>
                }

                @if (post.rewardOffered) {
                  <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                    🎁 {{ post.rewardDetails || 'Recompensa' }}
                  </span>
                }

                @if (post.lostData?.status === 'REENCONTRADA') {
                  <span class="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black">
                    ✅ Resuelto
                  </span>
                }

                @if (post.postType !== 'CAMPANA_COMUNITARIA' && post.temperamentTags && post.temperamentTags.length > 0) {
                  @for (tag of (singlePostModeId() ? post.temperamentTags : post.temperamentTags.slice(0, 2)); track tag) {
                    <span class="px-2 py-0.5 rounded-lg bg-emerald-500/12 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]">
                      {{ tag }}
                    </span>
                  }
                  @if (!singlePostModeId() && post.temperamentTags.length > 2) {
                    <span class="px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                      +{{ post.temperamentTags.length - 2 }}
                    </span>
                  }
                }
              </div>

              <!-- 4.1. Cascading Incident Reports & Sightings (Colapsable en el muro) -->
              @if (post.kind === 'LOST_PET' && post.sightings && post.sightings.length > 0) {
                <div class="rounded-xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 my-1.5 overflow-hidden">
                  <button
                    type="button"
                    (click)="toggleSightingsExpand(post.id)"
                    class="w-full px-3 py-2 flex items-center justify-between gap-2 text-[11px] font-bold text-amber-800 dark:text-amber-300 cursor-pointer hover:bg-amber-500/10 transition-colors"
                  >
                    <span class="flex items-center gap-1.5 truncate">
                      <span>{{ post.postType === 'ANIMAL_HERIDO' ? '🚑' : post.postType === 'EN_RESGUARDO' ? '🏠' : '👀' }}</span>
                      <span class="truncate">
                        {{ post.postType === 'ANIMAL_HERIDO' ? 'Bitácora de ayuda' : post.postType === 'EN_RESGUARDO' ? 'Avisos al resguardo' : 'Avistamientos' }} ({{ post.sightings.length }})
                      </span>
                    </span>
                    <span class="text-[10px] shrink-0 font-black">
                      {{ (isSightingsExpanded(post.id) || singlePostModeId()) ? 'Ocultar ▲' : 'Ver ▾' }}
                    </span>
                  </button>

                  @if (isSightingsExpanded(post.id) || singlePostModeId()) {
                    <div class="px-3 pb-3 space-y-2 max-h-52 overflow-y-auto">
                      @for (sighting of post.sightings; track sighting.id) {
                        <div class="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-500/20 dark:border-slate-800 text-[11px] space-y-1 shadow-sm">
                          <div class="flex items-center justify-between gap-2">
                            <span class="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1">
                              <span>👤 {{ sighting.notifier?.fullName || 'Ciudadano solidario' }}</span>
                              @if (sighting.notifierId && sighting.notifierId === authService.currentUser()?.id) {
                                <span class="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-black">Tú</span>
                              }
                            </span>
                            <div class="flex items-center gap-1.5 flex-shrink-0">
                              <span class="text-[10px] text-slate-400">{{ formatRelativeTime(sighting.createdAt) }}</span>
                              @if ((sighting.notifierId || sighting.notifier?.id) && authService.currentUser()?.id && (sighting.notifierId || sighting.notifier?.id) !== authService.currentUser()?.id) {
                                <button
                                  type="button"
                                  (click)="contactSightingNotifier(post, sighting)"
                                  class="px-2 py-0.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-bold text-[10px] cursor-pointer"
                                >
                                  💬 Contactar
                                </button>
                              }
                              @if (canDeleteSighting(sighting)) {
                                <button
                                  type="button"
                                  (click)="deleteSightingReport(post, sighting)"
                                  class="w-6 h-6 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                                  title="Eliminar reporte"
                                >
                                  🗑️
                                </button>
                              }
                            </div>
                          </div>
                          <p class="text-slate-800 dark:text-slate-100 font-semibold leading-snug">
                            <span class="text-rose-500 font-extrabold">
                              {{ post.postType === 'ANIMAL_HERIDO' ? '🚑 Ayuda / Punto:' : post.postType === 'EN_RESGUARDO' ? '🏠 Aviso:' : '📍 Visto en:' }}
                            </span>
                            {{ sighting.locationDescription }}
                          </p>
                          @if (sighting.additionalNotes) {
                            <p class="text-slate-600 dark:text-slate-300 text-[10px] leading-snug bg-slate-100/80 dark:bg-slate-800/60 p-1.5 rounded-lg">
                              <span class="font-bold">Detalles:</span> {{ sighting.additionalNotes }}
                            </p>
                          }
                          @if (sighting.photoUrl) {
                            <button
                              type="button"
                              (click)="openSightingPhotoInLightbox(post, sighting.photoUrl)"
                              class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-0.5 cursor-pointer"
                            >
                              <span>📷 Ver evidencia</span>
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }

              <!-- 5. Social Actions & CTA Buttons (Limpio con menú ⋯) -->
              <div class="mt-auto pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-1 min-w-0">
                  @if (post.kind === 'PET_ADOPTION' && post.petData) {
                    @if (isOwnFeedPet(post.petData)) {
                      <a
                        routerLink="/panel-rescatista"
                        class="flex-1 min-w-fit whitespace-nowrap justify-center px-3 py-2 rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 active:scale-95 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>🛡️</span>
                        <span>Gestionar Adopciones</span>
                      </a>
                    } @else if (!isFeedPetAdoptable(post.petData)) {
                      <span class="flex-1 min-w-fit whitespace-nowrap justify-center px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5">
                        <span>🏡</span>
                        <span>{{ post.petData.status === 'ADOPTADA' || post.petData.status === 'EN_SEGUIMIENTO' ? 'Adoptada' : 'No disponible' }}</span>
                      </span>
                    } @else {
                      <button
                        (click)="openAdoptionModal(post.petData)"
                        class="flex-1 min-w-fit whitespace-nowrap justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>💚</span>
                        <span>Adoptar</span>
                      </button>
                    }

                    @if (canMessagePostAuthor(post)) {
                      <button
                        type="button"
                        (click)="contactAuthorInApp(post, '¡Hola! Vi la ficha de ' + post.title + ' en adopción y me gustaría pedir más información 🐾')"
                        class="shrink-0 whitespace-nowrap px-2.5 py-2 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Enviar mensaje directo"
                      >
                        <span>✉️</span>
                        <span class="hidden sm:inline">Mensaje</span>
                      </button>
                    }

                    <a
                      [routerLink]="['/adopciones', post.petData.id]"
                      class="shrink-0 whitespace-nowrap px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Ver ficha completa"
                    >
                      <span>👁️</span>
                    </a>
                  } @else if (post.kind === 'LOST_PET' && post.lostData) {
                    @if (post.postType === 'CAMPANA_COMUNITARIA') {
                      @if (canMessagePostAuthor(post)) {
                        <button
                          type="button"
                          (click)="contactAuthorInApp(post, 'Hola, me gustaría solicitar informes sobre la campaña: ' + post.title)"
                          class="flex-1 min-w-fit whitespace-nowrap justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>✉️</span>
                          <span>Solicitar Informes</span>
                        </button>
                      } @else {
                        <button
                          (click)="toggleComments(post)"
                          class="flex-1 min-w-fit whitespace-nowrap justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>📢</span>
                          <span>Preguntar</span>
                        </button>
                      }
                    } @else if (post.postType === 'EN_ADOPCION') {
                      @if (post.lostData.status === 'REENCONTRADA' || post.lostData.status === 'CERRADO') {
                        <span class="flex-1 min-w-fit whitespace-nowrap justify-center px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5">
                          <span>🏡</span>
                          <span>Adoptada</span>
                        </span>
                      } @else if (canMessagePostAuthor(post)) {
                        <button
                          type="button"
                          (click)="contactAuthorInApp(post, 'Hola, me interesa adoptar a ' + (post.lostData.petName || 'este peludito') + ' publicado en Huellitas Dolores Hidalgo 💚')"
                          class="flex-1 min-w-fit whitespace-nowrap justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>💚</span>
                          <span>Quiero Adoptar</span>
                        </button>
                      } @else {
                        <a
                          routerLink="/panel-rescatista"
                          class="flex-1 min-w-fit whitespace-nowrap justify-center px-3 py-2 rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 active:scale-95 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>🛡️</span>
                          <span>Gestionar Adopciones</span>
                        </a>
                      }
                    } @else if (post.postType === 'ANIMAL_HERIDO') {
                      <button
                        (click)="openSightingModal(post.lostData)"
                        class="flex-1 min-w-fit whitespace-nowrap justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white text-xs font-black shadow-md shadow-rose-600/25 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>🚑</span>
                        <span>Brindar Ayuda</span>
                      </button>

                      @if (canMessagePostAuthor(post)) {
                        <button
                          type="button"
                          (click)="contactAuthorInApp(post, 'Hola, vi la alerta de urgencia de ' + post.title + ' y quiero apoyar 🚑')"
                          class="shrink-0 whitespace-nowrap px-2.5 py-2 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="Enviar mensaje directo"
                        >
                          <span>✉️</span>
                          <span class="hidden sm:inline">Mensaje</span>
                        </button>
                      }
                    } @else if (post.postType === 'EN_RESGUARDO') {
                      <button
                        (click)="openSightingModal(post.lostData)"
                        class="flex-1 min-w-fit whitespace-nowrap justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>🏠</span>
                        <span>Es mío / Apoyar</span>
                      </button>

                      @if (canMessagePostAuthor(post)) {
                        <button
                          type="button"
                          (click)="contactAuthorInApp(post, 'Hola, vi tu publicación de resguardo de ' + post.title + ' en Huellitas Dolores Hidalgo 🏠')"
                          class="shrink-0 whitespace-nowrap px-2.5 py-2 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="Enviar mensaje directo"
                        >
                          <span>✉️</span>
                          <span class="hidden sm:inline">Mensaje</span>
                        </button>
                      }
                    } @else {
                      <button
                        (click)="openSightingModal(post.lostData)"
                        class="flex-1 min-w-fit whitespace-nowrap justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 active:scale-95 text-white text-xs font-black shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>👀</span>
                        <span>¡Lo vi!</span>
                      </button>

                      @if (canMessagePostAuthor(post)) {
                        <button
                          type="button"
                          (click)="contactAuthorInApp(post, 'Hola, vi tu alerta de búsqueda de ' + post.title + ' en Huellitas Dolores Hidalgo 📍')"
                          class="shrink-0 whitespace-nowrap px-2.5 py-2 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="Enviar mensaje directo"
                        >
                          <span>✉️</span>
                          <span class="hidden sm:inline">Mensaje</span>
                        </button>
                      }
                    }
                  }
                </div>

                <!-- Comments & Compact Options Menu -->
                <div class="flex items-center gap-1.5 shrink-0 relative">
                  <button
                    type="button"
                    (click)="toggleComments(post)"
                    class="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                    title="Comentarios"
                  >
                    <span>💬</span>
                    <span>{{ (post.comments?.length || 0) }}</span>
                  </button>

                  <div class="relative" (click)="$event.stopPropagation()">
                    <button
                      type="button"
                      (click)="toggleCardMenu(post.id, $event)"
                      class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-black transition-colors cursor-pointer flex items-center justify-center"
                      title="Más opciones"
                    >
                      ⋯
                    </button>

                    @if (openCardMenuPostId() === post.id) {
                      <div class="absolute right-0 bottom-10 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-30 space-y-1 text-xs animate-fadeIn">
                        @if (canDeletePost(post)) {
                          @if (post.kind === 'LOST_PET' && post.lostData && post.postType !== 'CAMPANA_COMUNITARIA' && post.lostData.status !== 'REENCONTRADA') {
                            <button
                              type="button"
                              (click)="openCardMenuPostId.set(null); markPostResolved(post)"
                              class="w-full px-3 py-2 rounded-xl text-left font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 flex items-center gap-2 cursor-pointer"
                            >
                              <span>✅</span>
                              <span>Marcar resuelto</span>
                            </button>
                          }
                          <button
                            type="button"
                            (click)="openCardMenuPostId.set(null); openEditPostModal(post)"
                            class="w-full px-3 py-2 rounded-xl text-left font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 flex items-center gap-2 cursor-pointer"
                          >
                            <span>✏️</span>
                            <span>Editar publicación</span>
                          </button>
                          <button
                            type="button"
                            (click)="openCardMenuPostId.set(null); confirmDeactivatePost(post)"
                            class="w-full px-3 py-2 rounded-xl text-left font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 flex items-center gap-2 cursor-pointer"
                          >
                            <span>🗑️</span>
                            <span>Dar de baja</span>
                          </button>
                          <div class="border-t border-slate-200 dark:border-slate-800 my-1"></div>
                        }
                        <button
                          type="button"
                          (click)="openCardMenuPostId.set(null); shareToFacebook(post)"
                          class="w-full px-3 py-2 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-500/15 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2 cursor-pointer"
                        >
                          <span>🌐</span>
                          <span>Compartir en Facebook</span>
                        </button>
                        <button
                          type="button"
                          (click)="openCardMenuPostId.set(null); copyPostLink(post)"
                          class="w-full px-3 py-2 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <span>🔗</span>
                          <span>Copiar enlace</span>
                        </button>
                        @if (!isOwnPost(post)) {
                          <div class="border-t border-slate-200 dark:border-slate-800 my-1"></div>
                          <button
                            type="button"
                            (click)="openCardMenuPostId.set(null); openReportModal(post)"
                            class="w-full px-3 py-2 rounded-xl text-left font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
                          >
                            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                              <line x1="4" y1="22" x2="4" y2="15" />
                            </svg>
                            <span>Reportar publicación</span>
                          </button>
                        }
                      </div>
                    }
                  </div>
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
                            <div class="flex items-center justify-between gap-2">
                              <span class="font-bold text-slate-900 dark:text-white text-[10px] truncate">
                                {{ comment.author?.fullName || 'Vecino solidario' }}
                              </span>
                              <div class="flex items-center gap-1.5 flex-shrink-0">
                                <span class="text-[9px] text-slate-400 font-medium">
                                  {{ formatExactDateTime(comment.createdAt) }}
                                </span>
                                @if (canDeleteComment(comment)) {
                                  <button
                                    type="button"
                                    (click)="deleteComment(post, comment)"
                                    class="text-[10px] px-1.5 py-0.5 rounded-md text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    title="Eliminar comentario"
                                  >
                                    🗑️
                                  </button>
                                }
                              </div>
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

      @if (reportModalTarget(); as reportTarget) {
        <app-report-content-modal
          [targetType]="reportTarget.targetType"
          [targetId]="reportTarget.targetId"
          [targetTitle]="reportTarget.title"
          [targetSubtitle]="reportTarget.subtitle"
          (closed)="closeReportModal()"
        />
      }

      <!-- ======================================================== -->
      <!-- MODAL ITEM #2: FLUJO INTELIGENTE "QUIERO ADOPTAR"        -->
      <!-- ======================================================== -->
      @if (selectedPetForAdoption()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn overscroll-contain"
          (click)="closeAdoptionModal()"
        >
          <div
            class="liquid-glass rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative border border-emerald-500/30 space-y-5 max-h-[90vh] overflow-y-auto overscroll-contain"
            (click)="$event.stopPropagation()"
          >
            
            <!-- Close Button -->
            <button
              (click)="closeAdoptionModal()"
              class="sticky top-0 ml-auto -mt-1 w-8 h-8 rounded-full bg-slate-200/90 dark:bg-slate-800/90 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-sm font-bold z-10 shadow-sm"
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
                  Tu interés por <strong class="text-emerald-500">{{ selectedPetForAdoption()!.name }}</strong> ha sido registrado. Escríbele por el chat directo de Huellitas o por WhatsApp al rescatista para agendar una visita.
                </p>

                <div class="space-y-2.5">
                  <!-- Direct In-App Message Button (Primary) -->
                  <button
                    type="button"
                    (click)="contactSelectedAdoptionPetOwnerInApp()"
                    class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>💬</span>
                    <span>Enviar Mensaje Directo en Huellitas</span>
                  </button>

                  <!-- WhatsApp Button prefilled (Extra Option) -->
                  <a
                    [href]="getAdoptionWhatsAppUrl()"
                    target="_blank"
                    (click)="closeAdoptionModal()"
                    class="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>📲</span>
                    <span>O abrir WhatsApp con el Rescatista</span>
                  </a>

                  <!-- Mis Adopciones (Barra de progreso) -->
                  <a
                    routerLink="/mis-adopciones"
                    (click)="closeAdoptionModal()"
                    class="w-full py-2.5 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>📊</span>
                    <span>Ver Progreso de mi Solicitud →</span>
                  </a>
                </div>

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
                  <app-adoption-request-form
                    [pet]="selectedPetForAdoption()!"
                    [isSubmitting]="isSubmittingAdoption()"
                    (submitted)="submitAdoptionRequest($event)"
                    (cancelled)="closeAdoptionModal()"
                  />
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- ======================================================== -->
      <!-- MODAL: REPORTAR AVISTAMIENTO / BRINDAR AYUDA / RESGUARDO -->
      <!-- ======================================================== -->
      @if (selectedLostPetForSighting()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div class="liquid-glass rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-rose-500/30 overflow-hidden space-y-4 max-h-[92vh] overflow-y-auto">
            <button
              (click)="closeSightingModal()"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>

            <div class="flex items-center gap-3">
              <span class="text-3xl">
                {{
                  selectedLostPetForSighting()!.type === 'ANIMAL_HERIDO'
                    ? '🚑'
                    : selectedLostPetForSighting()!.type === 'EN_RESGUARDO'
                      ? '🏠'
                      : '👀'
                }}
              </span>
              <div>
                <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  @if (selectedLostPetForSighting()!.type === 'ANIMAL_HERIDO') {
                    Brindar Ayuda: {{ selectedLostPetForSighting()!.petName || 'Animal Herido' }}
                  } @else if (selectedLostPetForSighting()!.type === 'EN_RESGUARDO') {
                    Reclamar Mascota o Apoyar Resguardo
                  } @else {
                    Reportar Avistamiento de {{ selectedLostPetForSighting()!.petName || 'Mascota' }}
                  }
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  @if (selectedLostPetForSighting()!.type === 'ANIMAL_HERIDO') {
                    Tu reporte quedará visible en la Bitácora de la publicación y notificará al autor de inmediato.
                  } @else if (selectedLostPetForSighting()!.type === 'EN_RESGUARDO') {
                    Indica si reconoces a tu mascota o si deseas apoyar con hogar temporal / alimento.
                  } @else {
                    Tu aviso aparecerá en la Bitácora de la tarjeta y notificará a su familia de inmediato.
                  }
                </p>
              </div>
            </div>

            <!-- Quick-Select Action Chips según el tipo de publicación -->
            <div class="space-y-1.5">
              <span class="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                ⚡ Selección rápida (toca una opción o escribe abajo):
              </span>
              <div class="flex flex-wrap gap-1.5">
                @for (chip of getSightingQuickChips(selectedLostPetForSighting()!.type); track chip) {
                  <button
                    type="button"
                    (click)="selectSightingQuickChip(chip)"
                    [ngClass]="sightingForm.locationDescription === chip
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-black shadow-sm'
                      : 'bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-emerald-500'"
                    class="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer active:scale-95 text-left"
                  >
                    {{ chip }}
                  </button>
                }
              </div>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  @if (selectedLostPetForSighting()!.type === 'ANIMAL_HERIDO') {
                    ¿Qué ayuda ofreces o en qué ubicación exacta sigue? *
                  } @else if (selectedLostPetForSighting()!.type === 'EN_RESGUARDO') {
                    ¿Es tu mascota o cómo deseas apoyar? *
                  } @else {
                    ¿Dónde lo viste? (Calle, colonia o punto de referencia en Dolores Hgo.) *
                  }
                </label>
                <input
                  type="text"
                  [(ngModel)]="sightingForm.locationDescription"
                  [placeholder]="
                    selectedLostPetForSighting()!.type === 'ANIMAL_HERIDO'
                      ? 'Ej: Voy en camino con transportadora / Sigue frente a la tienda de C. Guanajuato...'
                      : selectedLostPetForSighting()!.type === 'EN_RESGUARDO'
                        ? 'Ej: ¡Es mi perrito! Se salió ayer en Col. Lindavista / Ofrezco croquetas...'
                        : 'Ej: Pasando la glorieta de la Alameda, frente a la farmacia...'
                  "
                  [class.border-rose-500]="sightingAttempted() && !sightingForm.locationDescription.trim()"
                  class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                />
                @if (sightingAttempted() && !sightingForm.locationDescription.trim()) {
                  <p class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                    Este campo es obligatorio para publicar en la bitácora.
                  </p>
                }
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  @if (selectedLostPetForSighting()!.type === 'ANIMAL_HERIDO') {
                    Detalles adicionales para coordinarse (horario, teléfono o estado)
                  } @else if (selectedLostPetPetIsResguardo()) {
                    Señas particulares, pruebas o detalles de contacto
                  } @else {
                    Notas adicionales (¿Hacia dónde iba? ¿En qué estado estaba?)
                  }
                </label>
                <textarea
                  [(ngModel)]="sightingForm.additionalNotes"
                  rows="3"
                  [placeholder]="
                    selectedLostPetForSighting()!.type === 'ANIMAL_HERIDO'
                      ? 'Ej: Llego en 15 minutos, tengo auto para llevarlo al veterinario...'
                      : selectedLostPetForSighting()!.type === 'EN_RESGUARDO'
                        ? 'Ej: Tiene una manchita en la pata derecha y responde al nombre de Toby...'
                        : 'Ej: Iba caminando despacio en dirección al mercado, se veía asustado...'
                  "
                  class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Fotografía de evidencia (Opcional)
                </label>
                <div class="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 mb-2 gap-1 text-[11px] font-bold">
                  <button
                    type="button"
                    (click)="setSightingPhotoSource('FILE')"
                    [ngClass]="{ 'bg-rose-500 text-white shadow': sightingPhotoSource() === 'FILE', 'text-slate-600 dark:text-slate-400': sightingPhotoSource() !== 'FILE' }"
                    class="flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center"
                  >
                    📁 Dispositivo
                  </button>
                  <button
                    type="button"
                    (click)="setSightingPhotoSource('CAMERA')"
                    [ngClass]="{ 'bg-rose-500 text-white shadow': sightingPhotoSource() === 'CAMERA', 'text-slate-600 dark:text-slate-400': sightingPhotoSource() !== 'CAMERA' }"
                    class="flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center"
                  >
                    📸 Usar Cámara
                  </button>
                  <button
                    type="button"
                    (click)="setSightingPhotoSource('URL')"
                    [ngClass]="{ 'bg-rose-500 text-white shadow': sightingPhotoSource() === 'URL', 'text-slate-600 dark:text-slate-400': sightingPhotoSource() !== 'URL' }"
                    class="flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center"
                  >
                    🔗 Enlace URL
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
                } @else if (sightingPhotoSource() === 'CAMERA') {
                  <div class="rounded-2xl border border-rose-500/30 bg-slate-900/90 p-3 space-y-2.5 text-center">
                    @if (isCameraActive() && activeCameraTarget() === 'SIGHTING') {
                      <div class="relative rounded-xl overflow-hidden bg-black aspect-video max-h-56 mx-auto border border-white/15">
                        <video
                          id="sightingCameraVideo"
                          autoplay
                          playsinline
                          muted
                          class="w-full h-full object-cover"
                        ></video>
                      </div>
                      <div class="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          (click)="capturePhotoFromStream('SIGHTING')"
                          class="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                        >
                          📸 Tomar Foto Ahora
                        </button>
                        <button
                          type="button"
                          (click)="toggleCameraFacingMode('SIGHTING')"
                          class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer transition-colors"
                        >
                          🔄 Girar cámara
                        </button>
                      </div>
                    } @else {
                      @if (cameraError()) {
                        <p class="text-[11px] text-amber-300 font-semibold px-2">
                          {{ cameraError() }}
                        </p>
                      }
                      <div class="flex flex-wrap items-center justify-center gap-2 py-1">
                        <button
                          type="button"
                          (click)="startCameraStream('SIGHTING')"
                          class="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-black cursor-pointer transition-all"
                        >
                          🎥 Encender cámara en vivo
                        </button>
                        <label class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/15 cursor-pointer transition-all">
                          📱 Abrir cámara del teléfono
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            (change)="onSightingFileSelected($event)"
                            class="hidden"
                          />
                        </label>
                      </div>
                    }
                  </div>
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
                    <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Foto lista para adjuntar</span>
                  </div>
                }
              </div>

              <div class="pt-2 flex gap-2">
                <button
                  (click)="submitSighting()"
                  [disabled]="isSubmittingSighting()"
                  class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  @if (isSubmittingSighting()) {
                    <span>Guardando en bitácora...</span>
                  } @else if (selectedLostPetForSighting()!.type === 'ANIMAL_HERIDO') {
                    <span>🚑 Publicar Ayuda en la Bitácora</span>
                  } @else if (selectedLostPetForSighting()!.type === 'EN_RESGUARDO') {
                    <span>🏠 Publicar Aviso en la Bitácora</span>
                  } @else {
                    <span>👀 Publicar Avistamiento en la Bitácora</span>
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
              <!-- REPORT FORM (2 Pasos Limpios) -->
              <div class="space-y-4">
                <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl flex-shrink-0">
                      ✍️
                    </div>
                    <div class="min-w-0">
                      <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                        {{ editingReportId() ? 'Editar Publicación' : 'Crear Publicación' }}
                      </h3>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400">
                        Paso {{ modalStep() }} de 2 · {{ modalStep() === 1 ? 'Tipo y ubicación' : 'Detalles y fotos' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Visual 2-Step Progress Strip -->
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    (click)="setModalStep(1)"
                    [ngClass]="modalStep() === 1 ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-black' : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 font-bold'"
                    class="py-1.5 px-3 rounded-xl border text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>1</span>
                    <span>Tipo y Ubicación</span>
                  </button>
                  <button
                    type="button"
                    (click)="setModalStep(2)"
                    [ngClass]="modalStep() === 2 ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-black' : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 font-bold'"
                    class="py-1.5 px-3 rounded-xl border text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>2</span>
                    <span>Detalles y Fotos</span>
                  </button>
                </div>

                @if (modalStep() === 1) {
                  <!-- ======================================= -->
                  <!-- PASO 1: TIPO, NOMBRE, COLONIA Y CALLE   -->
                  <!-- ======================================= -->
                  <div class="space-y-3.5 text-xs">
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
                          class="p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5 border border-transparent"
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
                          class="p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5 border border-transparent"
                        >
                          <span class="text-base">🏠</span>
                          <span class="text-xs leading-tight">2. En Resguardo</span>
                          <span class="text-[9px] opacity-80 leading-tight">Lo tengo bajo resguardo</span>
                        </button>

                        <!-- 3. Dar en Adopción (Habilitado para Nivel 1+: Teléfono verificado/registrado + Rescatistas) -->
                        @if (hasLevel1()) {
                          <button
                            type="button"
                            (click)="setModalPublicationType('EN_ADOPCION')"
                            [ngClass]="reportLostForm.type === 'EN_ADOPCION' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-bold' : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'"
                            class="p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5 border border-transparent"
                          >
                            <span class="text-base">💚</span>
                            <span class="text-xs leading-tight">3. Dar en Adopción</span>
                            <span class="text-[9px] opacity-80 leading-tight">Protocolo 4 pasos</span>
                          </button>
                        } @else {
                          <button
                            type="button"
                            (click)="setModalPublicationType('EN_ADOPCION')"
                            class="p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400"
                            title="Requiere Nivel 1 (Teléfono de 10 dígitos en Mi Perfil)"
                          >
                            <span class="text-base">🔒</span>
                            <span class="text-xs leading-tight font-bold">3. Dar en Adopción</span>
                            <span class="text-[9px] leading-tight">Requiere Nivel 1 (Teléfono)</span>
                          </button>
                        }

                        <!-- 4. Se Busca -->
                        <button
                          type="button"
                          (click)="setModalPublicationType('SE_BUSCA')"
                          [ngClass]="reportLostForm.type === 'SE_BUSCA' || reportLostForm.type === 'EXTRAVIADA' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 font-bold' : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'"
                          class="p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5 border border-transparent"
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
                          class="p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5 border border-transparent col-span-2 sm:col-span-2"
                        >
                          <span class="text-base">📢</span>
                          <span class="text-xs leading-tight">5. Campaña o Aviso Comunitario</span>
                          <span class="text-[9px] opacity-80 leading-tight">Esterilización, vacunas, colecta o aviso</span>
                        </button>
                      </div>

                      @if (!hasLevel1()) {
                        <div class="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-[11px]">
                          <span class="text-amber-800 dark:text-amber-300 font-semibold">
                            🔓 Agrega tu teléfono (Nivel 1) en Mi Perfil para publicar adopciones directas.
                          </span>
                          <a
                            routerLink="/perfil"
                            (click)="closeReportLostModal()"
                            class="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black whitespace-nowrap"
                          >
                            Ir a Perfil
                          </a>
                        </div>
                      }
                    </div>

                    <!-- Nombre + Especie/Género -->
                    <div class="grid grid-cols-1" [ngClass]="currentCategoryConfig.showSpeciesAndGender ? 'sm:grid-cols-2 gap-3' : 'gap-0'">
                      <div>
                        <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          {{ currentCategoryConfig.titleLabel }}
                        </label>
                        <input
                          type="text"
                          [(ngModel)]="reportLostForm.petName"
                          [placeholder]="currentCategoryConfig.titlePlaceholder"
                          [class.border-rose-500]="reportLostStep1Attempted() && !reportLostForm.petName.trim()"
                          class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                        @if (reportLostStep1Attempted() && !reportLostForm.petName.trim()) {
                          <p class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                            Ingresa el nombre, apodo o título para identificar la publicación.
                          </p>
                        }
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

                    <!-- Colonia + WhatsApp -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div class="flex items-center justify-between gap-1 mb-1">
                          <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                            Colonia / Comunidad *
                          </label>
                          <input
                            type="text"
                            [ngModel]="modalPostalFilter()"
                            (ngModelChange)="modalPostalFilter.set($event)"
                            placeholder="Filtrar C.P."
                            class="w-24 px-2 py-0.5 text-[10px] rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <select
                          [(ngModel)]="reportLostForm.coloniaId"
                          (ngModelChange)="openStreetSuggestions()"
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

                    <!-- Calle Híbrida (Lista Desplegable + Escritura Libre) -->
                    <div class="relative">
                      <div class="flex items-center justify-between gap-2 mb-1">
                        <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                          {{ currentCategoryConfig.locationLabel }}
                        </label>
                        <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Elige sugerencia o escribe libremente
                        </span>
                      </div>
                      <div class="relative flex items-center">
                        <input
                          type="text"
                          [ngModel]="reportLostForm.lastSeenLocation"
                          (ngModelChange)="onStreetInputChange($event)"
                          (focus)="openStreetSuggestions()"
                          (blur)="closeStreetDropdownDelayed()"
                          [placeholder]="currentCategoryConfig.locationPlaceholder"
                          autocomplete="off"
                          [class.border-rose-500]="reportLostStep1Attempted() && !reportLostForm.lastSeenLocation.trim()"
                          class="w-full pl-3 pr-9 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          (mousedown)="$event.preventDefault(); showStreetDropdown() ? showStreetDropdown.set(false) : openStreetSuggestions()"
                          class="absolute right-2 px-1.5 py-0.5 rounded-lg text-slate-500 hover:text-emerald-500 text-xs font-black cursor-pointer"
                          title="Mostrar calles sugeridas de Dolores Hidalgo"
                        >
                          ▾
                        </button>
                      </div>

                      @if (showStreetDropdown() && (streetSuggestions().length > 0 || isLoadingStreets())) {
                        <div class="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/35 shadow-2xl z-30 p-1.5 space-y-0.5">
                          <div class="px-2.5 py-1 text-[10px] font-bold text-slate-400 flex items-center justify-between">
                            <span>🛣️ Calles sugeridas (Dolores Hidalgo)</span>
                            @if (isLoadingStreets()) {
                              <span class="text-emerald-500">Buscando…</span>
                            }
                          </div>
                          @for (street of streetSuggestions(); track street) {
                            <button
                              type="button"
                              (mousedown)="$event.preventDefault(); selectStreetSuggestion(street)"
                              class="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer flex items-center gap-2 transition-colors"
                            >
                              <span class="text-slate-400 text-[10px]">📍</span>
                              <span class="truncate">{{ street }}</span>
                            </button>
                          }
                        </div>
                      }
                      @if (reportLostStep1Attempted() && !reportLostForm.lastSeenLocation.trim()) {
                        <p class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                          Indica la calle, esquina o punto de referencia para continuar.
                        </p>
                      }
                    </div>

                    <div class="pt-2 flex gap-2">
                      <button
                        type="button"
                        (click)="setModalStep(2)"
                        class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <span>Siguiente: Detalles y Fotos</span>
                        <span>→</span>
                      </button>
                      <button
                        type="button"
                        (click)="closeReportLostModal()"
                        class="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                } @else {
                  <!-- ======================================= -->
                  <!-- PASO 2: DESCRIPCIÓN, TEMPERAMENTO, FOTOS -->
                  <!-- ======================================= -->
                  <div class="space-y-3 text-xs">
                    <div class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                      <span class="truncate text-slate-700 dark:text-slate-200 font-semibold">
                        {{ currentCategoryConfig.submitButtonIcon }} <strong>{{ reportLostForm.petName }}</strong> · 📍 {{ reportLostForm.lastSeenLocation }}
                      </span>
                      <button
                        type="button"
                        (click)="setModalStep(1)"
                        class="text-emerald-600 dark:text-emerald-400 font-black hover:underline shrink-0 cursor-pointer"
                      >
                        Editar
                      </button>
                    </div>

                    <div>
                      <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        {{ currentCategoryConfig.descriptionLabel }}
                      </label>
                      <textarea
                        [(ngModel)]="reportLostForm.distinctiveFeatures"
                        rows="3"
                        [placeholder]="currentCategoryConfig.descriptionPlaceholder"
                        [class.border-rose-500]="reportLostAttempted() && !reportLostForm.distinctiveFeatures.trim()"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      ></textarea>
                      @if (reportLostAttempted() && !reportLostForm.distinctiveFeatures.trim()) {
                        <p class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                          Describe las señas particulares o el contexto de la publicación antes de enviar.
                        </p>
                      }
                    </div>

                    @if (reportLostForm.type === 'EN_ADOPCION') {
                      <div class="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 space-y-3">
                        <div>
                          <span class="font-black text-emerald-700 dark:text-emerald-400 uppercase text-[11px] block">
                            📋 Ficha Descriptiva para Adopción y Convenio
                          </span>
                          <span class="text-[10px] text-slate-500 dark:text-slate-400">
                            Estos datos aparecerán en la ficha pública de la mascota y en el Convenio Digital oficial.
                          </span>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                              Edad Aproximada
                            </label>
                            <input
                              type="text"
                              [(ngModel)]="reportLostForm.approximateAge"
                              placeholder="Ej: 4 meses, 1 año y medio..."
                              class="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                              Tamaño / Talla
                            </label>
                            <select
                              [(ngModel)]="reportLostForm.size"
                              class="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                            >
                              <option value="CHICO">Chico</option>
                              <option value="MEDIANO">Mediano</option>
                              <option value="GRANDE">Grande</option>
                              <option value="GIGANTE">Gigante</option>
                            </select>
                          </div>

                          <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                              Raza o Cruza
                            </label>
                            <input
                              type="text"
                              [(ngModel)]="reportLostForm.breed"
                              placeholder="Ej: Mestizo, Criollo, Chihuahua..."
                              class="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                              Color / Pelaje
                            </label>
                            <input
                              type="text"
                              [(ngModel)]="reportLostForm.color"
                              placeholder="Ej: Miel con blanco, atigrado..."
                              class="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                            Señas Particulares (Manchas, orejas, collar, cicatrices...)
                          </label>
                          <input
                            type="text"
                            [(ngModel)]="reportLostForm.specialMarks"
                            placeholder="Ej: Mancha blanca en el pecho, patitas blancas, orejita caída..."
                            class="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                          <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                              Vacunas Aplicadas (Opcional)
                            </label>
                            <input
                              type="text"
                              [(ngModel)]="reportLostForm.vaccinesText"
                              placeholder="Ej: Quíntuple, Rabia (separadas por coma)"
                              class="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <label class="flex items-center gap-2 pt-3 sm:pt-5 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                            <input
                              type="checkbox"
                              [(ngModel)]="reportLostForm.isDewormed"
                              class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>💊 Desparasitación al corriente</span>
                          </label>
                        </div>
                      </div>
                    }

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

                    <!-- Fotografía / Galería Multi-Imagen -->
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

                      @if (reportLostPhotosList().length < authService.maxPhotosAllowed()) {
                        <div class="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 gap-1 text-[11px] font-bold">
                          <button
                            type="button"
                            (click)="setReportLostPhotoSource('FILE')"
                            [ngClass]="{ 'bg-emerald-600 text-white shadow': reportLostPhotoSource() === 'FILE', 'text-slate-600 dark:text-slate-400': reportLostPhotoSource() !== 'FILE' }"
                            class="flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center"
                          >
                            📁 Dispositivo
                          </button>
                          <button
                            type="button"
                            (click)="setReportLostPhotoSource('CAMERA')"
                            [ngClass]="{ 'bg-emerald-600 text-white shadow': reportLostPhotoSource() === 'CAMERA', 'text-slate-600 dark:text-slate-400': reportLostPhotoSource() !== 'CAMERA' }"
                            class="flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center"
                          >
                            📸 Usar Cámara
                          </button>
                          <button
                            type="button"
                            (click)="setReportLostPhotoSource('URL')"
                            [ngClass]="{ 'bg-emerald-600 text-white shadow': reportLostPhotoSource() === 'URL', 'text-slate-600 dark:text-slate-400': reportLostPhotoSource() !== 'URL' }"
                            class="flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center"
                          >
                            🔗 Enlace URL
                          </button>
                        </div>

                        @if (reportLostPhotoSource() === 'FILE') {
                          <label class="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-4 cursor-pointer bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all text-center">
                            <span class="text-2xl mb-1">📷</span>
                            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Toca para agregar {{ reportLostPhotosList().length > 0 ? 'más fotos' : 'imágenes' }}
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
                        } @else if (reportLostPhotoSource() === 'CAMERA') {
                          <div class="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-3 space-y-2.5 text-center">
                            @if (isCameraActive() && activeCameraTarget() === 'REPORT') {
                              <div class="relative rounded-xl overflow-hidden bg-black aspect-video max-h-60 mx-auto border border-white/15">
                                <video
                                  id="reportCameraVideo"
                                  autoplay
                                  playsinline
                                  muted
                                  class="w-full h-full object-cover"
                                ></video>
                              </div>
                              <div class="flex flex-wrap items-center justify-center gap-2">
                                <button
                                  type="button"
                                  (click)="capturePhotoFromStream('REPORT')"
                                  class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                                >
                                  📸 Capturar Foto ({{ reportLostPhotosList().length }}/{{ authService.maxPhotosAllowed() }})
                                </button>
                                <button
                                  type="button"
                                  (click)="toggleCameraFacingMode('REPORT')"
                                  class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer transition-colors"
                                >
                                  🔄 Girar cámara
                                </button>
                              </div>
                            } @else {
                              @if (cameraError()) {
                                <p class="text-[11px] text-amber-300 font-semibold px-2">
                                  {{ cameraError() }}
                                </p>
                              }
                              <div class="flex flex-wrap items-center justify-center gap-2 py-1">
                                <button
                                  type="button"
                                  (click)="startCameraStream('REPORT')"
                                  class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer transition-all"
                                >
                                  🎥 Encender cámara en vivo
                                </button>
                                <label class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/15 cursor-pointer transition-all">
                                  📱 Abrir cámara del teléfono
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    (change)="onReportLostFileSelected($event)"
                                    class="hidden"
                                  />
                                </label>
                              </div>
                            }
                          </div>
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

                    <!-- Checkbox Mascota Herida -->
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
                            Se elevará la prioridad comunitaria y se agrupará en cascada si otros vecinos reportan al mismo animalito.
                          </span>
                        </label>
                      </div>
                    }

                    @if (reportLostAttempted() && (!reportLostForm.petName.trim() || !reportLostForm.lastSeenLocation.trim() || !reportLostForm.distinctiveFeatures.trim())) {
                      <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-600 dark:text-rose-400 font-medium space-y-0.5">
                        <p class="font-bold">Faltan campos obligatorios para publicar:</p>
                        @if (!reportLostForm.petName.trim()) { <p>• Falta el nombre, apodo o título (Paso 1).</p> }
                        @if (!reportLostForm.lastSeenLocation.trim()) { <p>• Falta la ubicación o referencia (Paso 1).</p> }
                        @if (!reportLostForm.distinctiveFeatures.trim()) { <p>• Faltan las señas particulares o descripción (Paso 2).</p> }
                      </div>
                    }

                    <div class="pt-3 flex gap-2">
                      <button
                        type="button"
                        (click)="setModalStep(1)"
                        class="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700"
                      >
                        ← Atrás
                      </button>
                      <button
                        type="button"
                        (click)="submitReportLost()"
                        [disabled]="isSubmittingReportLost()"
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
                    </div>
                  </div>
                }
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

      <!-- ======================================================== -->
      <!-- MODAL DE INVITACIÓN A ACTIVAR ALERTAS EN EL DISPOSITIVO  -->
      <!-- ======================================================== -->
      @if (
        pushService.shouldShowWallModal() &&
        !isReportLostModalOpen() &&
        !selectedPetForAdoption() &&
        !selectedLostPetForSighting() &&
        !lightboxPost()
      ) {
        <div
          class="fixed inset-0 z-[65] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            class="w-full max-w-md rounded-3xl liquid-glass border border-emerald-500/40 bg-white/95 dark:bg-slate-900/95 p-6 shadow-2xl relative overflow-hidden"
            (click)="$event.stopPropagation()"
          >
            <div
              class="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400/25 via-teal-400/15 to-transparent blur-2xl pointer-events-none"
            ></div>

            @if (!pushDeclineConfirmStep()) {
              <div class="relative z-10 text-center space-y-4">
                <div
                  class="w-16 h-16 rounded-2xl mx-auto bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30"
                >
                  🔔
                </div>

                <div class="space-y-1.5">
                  <span
                    class="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  >
                    Alertas en tu dispositivo
                  </span>
                  <h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                    ¿Quieres activar las alertas en tu dispositivo?
                  </h3>
                  <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Te avisaremos al instante en tu celular o computadora cuando alguien responda a tus reportes, te envíe un mensaje o publique una urgencia en tu zona, incluso con Huellitas cerrada.
                  </p>
                </div>

                <div class="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    (click)="acceptPushFromWallModal()"
                    [disabled]="pushService.busy()"
                    class="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/25 cursor-pointer transition-all active:scale-95"
                  >
                    {{ pushService.busy() ? 'Activando alertas…' : '🔔 Sí, activar alertas en mi dispositivo' }}
                  </button>
                  <button
                    type="button"
                    (click)="pushDeclineConfirmStep.set(true)"
                    [disabled]="pushService.busy()"
                    class="w-full py-2.5 px-4 rounded-2xl bg-slate-200/80 dark:bg-slate-800 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            } @else {
              <div class="relative z-10 text-center space-y-4">
                <div
                  class="w-14 h-14 rounded-2xl mx-auto bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl shadow-sm"
                >
                  💾
                </div>

                <div class="space-y-1.5">
                  <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    ¿Deseas guardar esta preferencia?
                  </h3>
                  <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Si guardas tu preferencia, ya no volveremos a mostrarte esta invitación al entrar al muro. Siempre podrás activarlas manualmente desde la pantalla de <strong>Notificaciones</strong>.
                  </p>
                </div>

                <div class="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    (click)="confirmDeclinePushModal(true)"
                    class="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    💾 Sí, guardar preferencia (No volver a preguntar)
                  </button>
                  <button
                    type="button"
                    (click)="confirmDeclinePushModal(false)"
                    class="w-full py-2.5 px-4 rounded-2xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                  >
                    ⏳ No guardar preferencia (Preguntarme después)
                  </button>
                  <button
                    type="button"
                    (click)="pushDeclineConfirmStep.set(false)"
                    class="w-full py-1.5 text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
                  >
                    ← Volver atrás
                  </button>
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
          locationLabel: 'Calle, esquina o referencia exacta *',
          locationPlaceholder: 'Ej: Calle Hidalgo #45, esquina con Puebla (o escribe cualquier referencia)...',
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
          locationLabel: 'Calle, esquina o zona de referencia *',
          locationPlaceholder: 'Ej: Calle Guanajuato, cerca de La Alameda...',
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
  private dmService = inject(DirectMessageService);
  private imageUploadService = inject(ImageUploadService);
  private confirmService = inject(ConfirmService);
  public pushService = inject(PushNotificationService);

  // Push modal state on the main wall
  pushDeclineConfirmStep = signal<boolean>(false);

  // Live Camera state for photo uploaders
  isCameraActive = signal<boolean>(false);
  activeCameraTarget = signal<'REPORT' | 'SIGHTING' | null>(null);
  cameraFacingMode = signal<'environment' | 'user'>('environment');
  cameraError = signal<string | null>(null);
  private activeCameraStream: MediaStream | null = null;

  // ==========================================
  // PERSISTENCIA LIGERA DEL MURO Y RESTAURACIÓN DE NIVEL DE SCROLL
  // ==========================================
  private static readonly SESSION_CACHE_KEY = 'huellitas_feed_light_cache_v1';
  private static cachedPosts: FeedPost[] = [];
  private static cachedColonias: Colonia[] = [];
  private static cachedKnownPostIds = new Set<string>();
  private static cachedDeletedPostIds = new Set<string>();
  private static cachedLatestSeenTimestamp = 0;
  private static savedScrollY = 0;
  private static lastOpenedPostId: string | null = null;
  private static savedFilter: FeedFilterType = 'ALL';
  private static savedSearchQuery = '';
  private static savedColoniaId = '';
  private static savedSpecies = '';
  private static savedGoodWithKids = false;
  private static savedGoodWithPets = false;

  // Data signals
  allPosts = signal<FeedPost[]>(CommunityFeedComponent.cachedPosts);
  colonias = signal<Colonia[]>(CommunityFeedComponent.cachedColonias);
  isLoading = signal<boolean>(CommunityFeedComponent.cachedPosts.length === 0);
  isRefreshingFeed = signal<boolean>(false);
  pendingNewPostsCount = signal<number>(0);
  isScrolledDown = signal<boolean>(false);
  private bufferedFreshPosts: FeedPost[] | null = null;
  private knownPostIds = CommunityFeedComponent.cachedKnownPostIds;
  private deletedPostIds = CommunityFeedComponent.cachedDeletedPostIds;
  private latestSeenTimestamp = CommunityFeedComponent.cachedLatestSeenTimestamp;
  private commentsPollingTimer: any = null;
  private feedPollingTimer: any = null;

  constructor() {
    this.hydrateFromLightweightSessionStorage();

    effect(() => {
      const currentPosts = this.allPosts();
      const currentColonias = this.colonias();
      if (currentPosts.length > 0) {
        CommunityFeedComponent.cachedPosts = currentPosts;
        this.saveLightweightSessionSnapshot(currentPosts, currentColonias);
      }
      if (currentColonias.length > 0) {
        CommunityFeedComponent.cachedColonias = currentColonias;
      }
    });
  }

  /**
   * Guarda una copia ultraligera (< 45 KB) en sessionStorage omitiendo cadenas Base64 pesadas (> 1.5 KB)
   * para no ocupar espacio en el almacenamiento del dispositivo y mantener persistencia instantánea.
   */
  private saveLightweightSessionSnapshot(posts: FeedPost[], colonias: Colonia[]): void {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;
    try {
      const stripHeavyUrl = (u?: string) => (u && u.length <= 1500 ? u : '');
      const lightPosts = posts.slice(0, 35).map((p) => ({
        ...p,
        photoUrl: stripHeavyUrl(p.photoUrl),
        photos: (p.photos || []).map(stripHeavyUrl).filter(Boolean),
        authorPhotoUrl: stripHeavyUrl(p.authorPhotoUrl),
        petData: p.petData
          ? {
              ...p.petData,
              photoUrl: stripHeavyUrl(p.petData.photoUrl),
              photos: (p.petData.photos || []).map(stripHeavyUrl).filter(Boolean),
            }
          : undefined,
        lostData: p.lostData
          ? {
              ...p.lostData,
              photos: (p.lostData.photos || []).map(stripHeavyUrl).filter(Boolean),
            }
          : undefined,
      }));
      sessionStorage.setItem(
        CommunityFeedComponent.SESSION_CACHE_KEY,
        JSON.stringify({
          posts: lightPosts,
          colonias: colonias.slice(0, 120),
          savedAt: Date.now(),
        }),
      );
    } catch {
      // Ignorar si sessionStorage está restringido
    }
  }

  private hydrateFromLightweightSessionStorage(): void {
    if (CommunityFeedComponent.cachedPosts.length > 0) return;
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(CommunityFeedComponent.SESSION_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // Vigencia máxima de 20 minutos para el snapshot de sesión
      if (parsed && Array.isArray(parsed.posts) && parsed.posts.length > 0 && Date.now() - (parsed.savedAt || 0) < 20 * 60 * 1000) {
        CommunityFeedComponent.cachedPosts = parsed.posts;
        this.allPosts.set(parsed.posts);
        this.registerKnownPosts(parsed.posts);
        this.isLoading.set(false);
        if (Array.isArray(parsed.colonias) && parsed.colonias.length > 0) {
          CommunityFeedComponent.cachedColonias = parsed.colonias;
          this.colonias.set(parsed.colonias);
        }
      }
    } catch {
      // Ignorar errores de parseo
    }
  }

  private registerKnownPosts(posts: FeedPost[]): void {
    let maxTs = this.latestSeenTimestamp || Date.now();
    for (const p of posts) {
      this.knownPostIds.add(p.id);
      const ts = new Date(p.createdAt).getTime();
      if (!isNaN(ts) && ts > maxTs) {
        maxTs = ts;
      }
    }
    this.latestSeenTimestamp = Math.max(maxTs, Date.now());
    CommunityFeedComponent.cachedLatestSeenTimestamp = this.latestSeenTimestamp;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.isScrolledDown.set(window.scrollY > 280);
      // Guardar continuamente la altura de scroll mientras el usuario navega en el muro general
      if (!this.singlePostModeId() && window.scrollY > 40) {
        CommunityFeedComponent.savedScrollY = window.scrollY;
      }
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.openCardMenuPostId()) {
      this.openCardMenuPostId.set(null);
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

  // De-saturation & interactive UI controls
  openCardMenuPostId = signal<string | null>(null);
  reportModalTarget = signal<{
    targetType: ReportTargetType;
    targetId: string;
    title: string;
    subtitle: string;
  } | null>(null);
  expandedSightingsPostIds = signal<string[]>([]);
  modalStep = signal<1 | 2>(1);
  reportLostStep1Attempted = signal<boolean>(false);
  reportLostAttempted = signal<boolean>(false);
  sightingAttempted = signal<boolean>(false);
  streetSuggestions = signal<string[]>([]);
  showStreetDropdown = signal<boolean>(false);
  isLoadingStreets = signal<boolean>(false);
  private streetSearchTimer: any = null;

  // Multi-photo upload list for publication modal
  reportLostPhotosList = signal<Array<{ previewUrl: string; file?: File; existingUrl?: string }>>([]);

  // Filters (Signals reactivos para Zoneless Angular 22)
  activeFilter = signal<FeedFilterType>('ALL');
  searchQuery = signal<string>('');
  selectedColoniaId = signal<string>('');
  selectedSpecies = signal<string>('');
  modalPostalFilter = signal<string>('');
  highlightedPostId = signal<string | null>(null);
  singlePostModeId = signal<string | null>(null);
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

  isRescuerOrAdmin = computed(() => {
    const role = this.authService.currentUser()?.role;
    return (
      role === UserRole.RESCATISTA_VERIFICADO ||
      role === UserRole.ALBERGUE ||
      role === UserRole.ADMIN
    );
  });

  /**
   * Un ciudadano cuenta con Nivel 1+ si tiene teléfono de 10+ dígitos, está marcado
   * como verificado o posee verificationLevel >= 1 (rescatistas/albergues/admin siempre cumplen).
   */
  hasLevel1 = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (this.isRescuerOrAdmin()) return true;
    const digits = (user.phone || '').replace(/\D/g, '');
    return (user.verificationLevel ?? 0) >= 1 || !!user.isPhoneVerified || digits.length >= 10;
  });

  // Adoption modal state (Item #2)
  selectedPetForAdoption = signal<Pet | null>(null);
  adoptionSubmittedSuccess = signal<boolean>(false);
  isSubmittingAdoption = signal<boolean>(false);

  // Sighting modal state
  selectedLostPetForSighting = signal<LostPetReport | null>(null);
  isSubmittingSighting = signal<boolean>(false);
  sightingPhotoSource = signal<'FILE' | 'CAMERA' | 'URL'>('FILE');
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
    const singleId = this.singlePostModeId();
    if (singleId) {
      const cleanId = singleId.trim();
      return posts.filter(
        (p) =>
          p.id === cleanId ||
          p.id === `lost-${cleanId}` ||
          p.id === `pet-${cleanId}` ||
          p.lostData?.id === cleanId ||
          p.petData?.id === cleanId,
      );
    }

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
  reportLostPhotoSource = signal<'FILE' | 'CAMERA' | 'URL'>('FILE');
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
    approximateAge: '',
    breed: '',
    size: 'MEDIANO' as PetSize,
    color: '',
    specialMarks: '',
    isDewormed: false,
    vaccinesText: '',
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

  isOwnPost(post: FeedPost): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (post.kind === 'PET_ADOPTION' && post.petData) {
      return (post.petData.ownerId || post.petData.owner?.id) === user.id;
    }
    if (post.kind === 'LOST_PET' && post.lostData) {
      return (post.lostData.reporterId || post.lostData.reporter?.id) === user.id;
    }
    return false;
  }

  openReportModal(post: FeedPost): void {
    if (!this.authService.isAuthenticated()) {
      this.notify.warning('Inicia sesión para poder enviar un reporte a moderación.');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/' } });
      return;
    }
    const isPetPost = post.kind === 'PET_ADOPTION' && !!post.petData?.id;
    const targetId = isPetPost ? post.petData!.id : post.lostData?.id;
    if (!targetId) return;

    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.reportModalTarget.set({
      targetType: isPetPost ? 'PET_POST' : 'LOST_REPORT',
      targetId,
      title: post.title,
      subtitle: `${post.typeBadge} • ${post.coloniaName || this.brand.city}`,
    });
  }

  closeReportModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
    this.reportModalTarget.set(null);
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
          this.deletedPostIds.add(post.id);
          this.knownPostIds.add(post.id);
          if (this.bufferedFreshPosts) {
            this.bufferedFreshPosts = this.bufferedFreshPosts.filter((p) => p.id !== post.id);
          }
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
          this.deletedPostIds.add(post.id);
          this.knownPostIds.add(post.id);
          if (this.bufferedFreshPosts) {
            this.bufferedFreshPosts = this.bufferedFreshPosts.filter((p) => p.id !== post.id);
          }
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

    // Si ya contamos con el muro en memoria o en caché ligera de sesión, mostrarlo en 0ms sin volver a cargar desde cero
    if (CommunityFeedComponent.cachedPosts.length > 0) {
      this.allPosts.set(CommunityFeedComponent.cachedPosts);
      this.isLoading.set(false);
      // Sincronizar en segundo plano sin mostrar pantalla de carga ni mover el scroll
      this.checkForNewPostsSilently();
    } else {
      this.loadFeed();
    }

    this.startAutoPolling();

    this.route.paramMap.subscribe((params) => {
      const routeId = params.get('id');
      if (routeId) {
        this.singlePostModeId.set(routeId.trim());
        if (this.allPosts().length > 0) {
          this.focusTargetPost(routeId);
        }
      } else if (!this.route.snapshot.queryParamMap.get('postId')) {
        const wasInSinglePost = Boolean(this.singlePostModeId() || CommunityFeedComponent.lastOpenedPostId);
        this.singlePostModeId.set(null);
        if (wasInSinglePost) {
          this.restoreSavedFiltersAndScroll();
        }
      }
    });

    this.route.queryParamMap.subscribe((params) => {
      const postId = params.get('postId');
      if (postId) {
        this.singlePostModeId.set(postId.trim());
        if (this.allPosts().length > 0) {
          this.focusTargetPost(postId);
        }
      } else if (!this.route.snapshot.paramMap.get('id')) {
        const wasInSinglePost = Boolean(this.singlePostModeId());
        this.singlePostModeId.set(null);
        if (wasInSinglePost) {
          this.restoreSavedFiltersAndScroll();
        }
      }
    });
  }

  exitSinglePostView(): void {
    this.singlePostModeId.set(null);
    this.restoreSavedFiltersAndScroll();
    this.router.navigate(['/']);
  }

  private restoreSavedFiltersAndScroll(): void {
    this.activeFilter.set(CommunityFeedComponent.savedFilter || 'ALL');
    this.searchQuery.set(CommunityFeedComponent.savedSearchQuery || '');
    this.selectedColoniaId.set(CommunityFeedComponent.savedColoniaId || '');
    this.selectedSpecies.set(CommunityFeedComponent.savedSpecies || '');
    this.filterGoodWithKids.set(CommunityFeedComponent.savedGoodWithKids || false);
    this.filterGoodWithPets.set(CommunityFeedComponent.savedGoodWithPets || false);

    const targetPostId = CommunityFeedComponent.lastOpenedPostId;
    const targetScrollY = CommunityFeedComponent.savedScrollY;

    if (targetPostId) {
      this.highlightedPostId.set(targetPostId);
      setTimeout(() => {
        if (this.highlightedPostId() === targetPostId && !this.singlePostModeId()) {
          this.highlightedPostId.set(null);
        }
      }, 2400);
    }

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (targetPostId && typeof document !== 'undefined') {
            const postEl = document.getElementById(`post-${targetPostId}`);
            if (postEl) {
              if (targetScrollY > 0) {
                window.scrollTo({ top: targetScrollY, behavior: 'instant' as ScrollBehavior });
                const rect = postEl.getBoundingClientRect();
                // Si el elemento quedó fuera del área visible tras restaurar scrollY, centrarlo con exactitud
                if (rect.top < 60 || rect.bottom > window.innerHeight + 120) {
                  postEl.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
                }
              } else {
                postEl.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
              }
              return;
            }
          }
          if (targetScrollY > 0) {
            window.scrollTo({ top: targetScrollY, behavior: 'instant' as ScrollBehavior });
          }
        }, 30);
      });
    }
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
    const directId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('postId');
    if (directId) {
      this.singlePostModeId.set(directId.trim());
      this.activeFilter.set('ALL');
      return;
    }
    this.singlePostModeId.set(null);
    const url = this.router.url;
    if (url.includes('perdidas')) {
      this.activeFilter.set('SE_BUSCA');
    } else if (url.includes('adopciones')) {
      this.activeFilter.set('EN_ADOPCION');
    } else {
      this.activeFilter.set('ALL');
    }
  }

  openSinglePostView(post: FeedPost): void {
    // Guardar el nivel exacto de scroll y filtros activos antes de entrar a la publicación individual
    if (typeof window !== 'undefined' && !this.singlePostModeId()) {
      CommunityFeedComponent.savedScrollY = window.scrollY;
    }
    CommunityFeedComponent.lastOpenedPostId = post.id;
    CommunityFeedComponent.savedFilter = this.activeFilter();
    CommunityFeedComponent.savedSearchQuery = this.searchQuery();
    CommunityFeedComponent.savedColoniaId = this.selectedColoniaId();
    CommunityFeedComponent.savedSpecies = this.selectedSpecies();
    CommunityFeedComponent.savedGoodWithKids = this.filterGoodWithKids();
    CommunityFeedComponent.savedGoodWithPets = this.filterGoodWithPets();

    this.singlePostModeId.set(post.id);
    this.highlightedPostId.set(post.id);
    this.allPosts.update((list) =>
      list.map((p) => (p.id === post.id ? { ...p, showComments: true } : p)),
    );
    this.refreshPostComments(post);
    this.router.navigate(['/publicacion', post.id]);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private lastFetchedTargetPostId: string | null = null;

  private focusTargetPost(rawPostId: string): void {
    const cleanId = rawPostId.trim();
    if (!cleanId) return;

    this.singlePostModeId.set(cleanId);

    // Si había publicaciones nuevas retenidas en el buffer de la píldora flotante,
    // aplicarlas de inmediato para que la publicación recién creada sí aparezca
    if (this.bufferedFreshPosts && this.bufferedFreshPosts.length > 0) {
      this.allPosts.set(this.bufferedFreshPosts);
      this.bufferedFreshPosts = null;
      this.pendingNewPostsCount.set(0);
    }

    const posts = this.allPosts();
    const matched = posts.find(
      (p) =>
        p.id === cleanId ||
        p.id === `lost-${cleanId}` ||
        p.id === `pet-${cleanId}` ||
        p.lostData?.id === cleanId ||
        p.petData?.id === cleanId,
    );

    if (!matched) {
      // Si el muro ya estaba abierto y aún no había descargado esta publicación nueva,
      // recargar el muro automáticamente una vez antes de decir que no está disponible
      if (!this.isLoading() && this.lastFetchedTargetPostId !== cleanId) {
        this.lastFetchedTargetPostId = cleanId;
        this.loadFeed();
      }
      return;
    }

    this.lastFetchedTargetPostId = null;

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

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
            const combined = this.buildFeedPosts(pets || [], reports || []).filter(
              (p) => !this.deletedPostIds.has(p.id),
            );
            this.registerKnownPosts(combined);
            this.allPosts.set(combined);
            this.pendingNewPostsCount.set(0);
            this.bufferedFreshPosts = null;
            this.isLoading.set(false);

            const targetPostId =
              this.route.snapshot.paramMap.get('id') ||
              this.route.snapshot.queryParamMap.get('postId') ||
              this.singlePostModeId();
            if (targetPostId) {
              this.focusTargetPost(targetPostId);
            }
          },
          error: () => {
            const onlyPets = this.buildFeedPosts(pets || [], []).filter(
              (p) => !this.deletedPostIds.has(p.id),
            );
            this.registerKnownPosts(onlyPets);
            this.allPosts.set(onlyPets);
            this.isLoading.set(false);
          },
        });
      },
      error: () => {
        this.lostPetService.getAll().subscribe({
          next: (reports) => {
            const onlyReports = this.buildFeedPosts([], reports || []).filter(
              (p) => !this.deletedPostIds.has(p.id),
            );
            this.registerKnownPosts(onlyReports);
            this.allPosts.set(onlyReports);
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
          },
        });
      },
    });
  }

  private checkForNewPostsSilently(): void {
    if (this.isLoading() || this.isRefreshingFeed()) return;

    this.petService.getAdoptionCatalog().subscribe({
      next: (pets) => {
        this.lostPetService.getAll().subscribe({
          next: (reports) => {
            const fresh = this.buildFeedPosts(pets || [], reports || []).filter(
              (p) => !this.deletedPostIds.has(p.id),
            );

            // Si el muro aún estaba vacío, poblar directamente sin mostrar la píldora
            if (this.allPosts().length === 0 || this.knownPostIds.size === 0) {
              this.registerKnownPosts(fresh);
              this.allPosts.set(fresh);
              this.bufferedFreshPosts = null;
              this.pendingNewPostsCount.set(0);
              return;
            }

            const unseenPosts = fresh.filter((p) => !this.knownPostIds.has(p.id));
            // Solo son publicaciones realmente nuevas aquellas cuya fecha de creación sea posterior a la carga inicial
            const trulyNewPosts = unseenPosts.filter((p) => {
              const createdTs = new Date(p.createdAt).getTime();
              return !isNaN(createdTs) && createdTs > this.latestSeenTimestamp;
            });

            // Cualquier publicación anterior que no estuviera registrada se marca como conocida sin disparar la píldora
            for (const p of unseenPosts) {
              const createdTs = new Date(p.createdAt).getTime();
              if (isNaN(createdTs) || createdTs <= this.latestSeenTimestamp) {
                this.knownPostIds.add(p.id);
              }
            }

            if (trulyNewPosts.length > 0) {
              this.bufferedFreshPosts = fresh;
              this.pendingNewPostsCount.set(trulyNewPosts.length);
            } else {
              this.bufferedFreshPosts = null;
              this.pendingNewPostsCount.set(0);
              this.registerKnownPosts(fresh);
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
      this.registerKnownPosts(this.bufferedFreshPosts);
      this.allPosts.set(this.bufferedFreshPosts);
      this.bufferedFreshPosts = null;
      this.pendingNewPostsCount.set(0);
      const singleId = this.singlePostModeId();
      if (singleId) {
        this.focusTargetPost(singleId);
      } else if (typeof window !== 'undefined') {
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
            const fresh = this.buildFeedPosts(pets || [], reports || []).filter(
              (p) => !this.deletedPostIds.has(p.id),
            );
            this.registerKnownPosts(fresh);
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
    if (type === 'EN_ADOPCION' && !this.hasLevel1()) {
      this.notify.warning(
        'Para dar en adopción se requiere Nivel 1',
        'Agrega un teléfono válido (10 dígitos) en Mi Perfil para habilitar el protocolo oficial de adopción en tus publicaciones.',
      );
      this.reportLostForm.type = 'EN_RESGUARDO';
      this.reportLostForm.isInjured = false;
      return;
    }

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

  toggleCardMenu(postId: string, event: Event): void {
    event.stopPropagation();
    this.openCardMenuPostId.update((curr) => (curr === postId ? null : postId));
  }

  isSightingsExpanded(postId: string): boolean {
    return this.expandedSightingsPostIds().includes(postId);
  }

  toggleSightingsExpand(postId: string): void {
    this.expandedSightingsPostIds.update((list) =>
      list.includes(postId) ? list.filter((id) => id !== postId) : [...list, postId],
    );
  }

  setModalStep(step: 1 | 2): void {
    if (step === 2) {
      this.reportLostStep1Attempted.set(true);
      if (!this.reportLostForm.petName.trim()) {
        this.notify.warning('Indica el nombre o título para continuar al paso 2');
        return;
      }
      if (!this.reportLostForm.lastSeenLocation.trim()) {
        this.notify.warning('Indica la calle, esquina o referencia para continuar al paso 2');
        return;
      }
      this.reportLostStep1Attempted.set(false);
    }
    this.showStreetDropdown.set(false);
    this.modalStep.set(step);
  }

  openStreetSuggestions(): void {
    this.showStreetDropdown.set(true);
    this.loadStreetSuggestions(this.reportLostForm.lastSeenLocation);
  }

  onStreetInputChange(value: string): void {
    this.reportLostForm.lastSeenLocation = value;
    this.showStreetDropdown.set(true);
    if (this.streetSearchTimer) {
      clearTimeout(this.streetSearchTimer);
    }
    this.streetSearchTimer = setTimeout(() => {
      this.loadStreetSuggestions(value);
    }, 180);
  }

  selectStreetSuggestion(street: string): void {
    this.reportLostForm.lastSeenLocation = street;
    this.showStreetDropdown.set(false);
  }

  closeStreetDropdownDelayed(): void {
    setTimeout(() => {
      this.showStreetDropdown.set(false);
    }, 180);
  }

  private loadStreetSuggestions(query?: string): void {
    this.isLoadingStreets.set(true);
    this.coloniaService.searchStreets(query, this.reportLostForm.coloniaId || undefined).subscribe({
      next: (list) => {
        this.streetSuggestions.set(list);
        this.isLoadingStreets.set(false);
      },
      error: () => {
        this.isLoadingStreets.set(false);
      },
    });
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
    this.modalStep.set(1);
    this.reportLostStep1Attempted.set(false);
    this.reportLostAttempted.set(false);
    this.showStreetDropdown.set(false);
    this.isReportLostModalOpen.set(true);
    this.reportLostSuccess.set(null);
    this.reportLostPhotoSource.set('FILE');
    this.reportLostPhotoPreview.set(null);
    this.reportLostSelectedFile.set(null);
    this.reportLostPhotosList.set([]);
    this.reportLostForm.petName = '';
    this.reportLostForm.lastSeenLocation = '';
    this.reportLostForm.distinctiveFeatures = '';
    this.reportLostForm.approximateAge = '';
    this.reportLostForm.breed = '';
    this.reportLostForm.size = 'MEDIANO';
    this.reportLostForm.color = '';
    this.reportLostForm.specialMarks = '';
    this.reportLostForm.isDewormed = false;
    this.reportLostForm.vaccinesText = '';
    this.reportLostForm.photoUrl = '';
    this.reportLostForm.temperamentTags = [];
    this.reportLostForm.contactPhone = this.authService.currentUser()?.phone || '';
    if (defaultType) {
      this.setModalPublicationType(defaultType);
    } else {
      this.setModalPublicationType('ANIMAL_HERIDO');
    }
    this.loadStreetSuggestions('');
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
      this.modalStep.set(1);
      this.reportLostStep1Attempted.set(false);
      this.reportLostAttempted.set(false);
      this.showStreetDropdown.set(false);
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
      this.loadStreetSuggestions(rep.lastSeenLocation || '');
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
    this.stopCameraStream();
    if (this.streetSearchTimer) {
      clearTimeout(this.streetSearchTimer);
      this.streetSearchTimer = null;
    }
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
    this.revokeObjectUrls(this.reportLostPhotosList());
    this.isReportLostModalOpen.set(false);
    this.reportLostSuccess.set(null);
    this.reportLostPhotosList.set([]);
    this.modalPostalFilter.set('');
    this.modalStep.set(1);
    this.reportLostStep1Attempted.set(false);
    this.reportLostAttempted.set(false);
    this.showStreetDropdown.set(false);
  }

  // ==========================================
  // MODAL DE INVITACIÓN A ALERTAS PUSH (MURO)
  // ==========================================
  async acceptPushFromWallModal(): Promise<void> {
    const ok = await this.pushService.enable();
    if (!ok && this.pushService.permission() === 'default') {
      // Si cerró el diálogo del navegador sin decidir, mantenemos el modal sin bloquear
      this.pushDeclineConfirmStep.set(false);
    }
  }

  confirmDeclinePushModal(savePreference: boolean): void {
    this.pushDeclineConfirmStep.set(false);
    this.pushService.declinePrompt(savePreference);
  }

  // ==========================================
  // CAPTURA CON CÁMARA EN VIVO / DISPOSITIVO
  // ==========================================
  setReportLostPhotoSource(source: 'FILE' | 'CAMERA' | 'URL'): void {
    if (source !== 'CAMERA') {
      this.stopCameraStream();
    }
    this.reportLostPhotoSource.set(source);
    if (source === 'CAMERA') {
      void this.startCameraStream('REPORT');
    }
  }

  setSightingPhotoSource(source: 'FILE' | 'CAMERA' | 'URL'): void {
    if (source !== 'CAMERA') {
      this.stopCameraStream();
    }
    this.sightingPhotoSource.set(source);
    if (source === 'CAMERA') {
      void this.startCameraStream('SIGHTING');
    }
  }

  async startCameraStream(target: 'REPORT' | 'SIGHTING'): Promise<void> {
    this.stopCameraStream();
    this.cameraError.set(null);
    this.activeCameraTarget.set(target);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      this.cameraError.set(
        'Tu navegador no permite vista previa en vivo. Usa el botón "Abrir cámara del teléfono" de abajo.',
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: this.cameraFacingMode() },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      this.activeCameraStream = stream;
      this.isCameraActive.set(true);

      setTimeout(() => {
        if (typeof document === 'undefined') return;
        const videoId = target === 'REPORT' ? 'reportCameraVideo' : 'sightingCameraVideo';
        const videoEl = document.getElementById(videoId) as HTMLVideoElement | null;
        if (videoEl && this.activeCameraStream) {
          videoEl.srcObject = this.activeCameraStream;
          videoEl.play().catch(() => {});
        }
      }, 60);
    } catch {
      this.isCameraActive.set(false);
      this.cameraError.set(
        'No se pudo acceder a la cámara en vivo. Verifica los permisos o usa "Abrir cámara del teléfono".',
      );
    }
  }

  stopCameraStream(): void {
    if (this.activeCameraStream) {
      for (const track of this.activeCameraStream.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      this.activeCameraStream = null;
    }
    this.isCameraActive.set(false);
    this.activeCameraTarget.set(null);
  }

  toggleCameraFacingMode(target: 'REPORT' | 'SIGHTING'): void {
    this.cameraFacingMode.update((mode) => (mode === 'environment' ? 'user' : 'environment'));
    void this.startCameraStream(target);
  }

  capturePhotoFromStream(target: 'REPORT' | 'SIGHTING'): void {
    if (typeof document === 'undefined') return;
    const videoId = target === 'REPORT' ? 'reportCameraVideo' : 'sightingCameraVideo';
    const videoEl = document.getElementById(videoId) as HTMLVideoElement | null;
    if (!videoEl || !videoEl.videoWidth) {
      this.notify.warning('La cámara aún se está iniciando, intenta en un segundo.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camara-${Date.now()}.jpg`, { type: 'image/jpeg' });
        if (target === 'REPORT') {
          const maxAllowed = this.authService.maxPhotosAllowed();
          if (this.reportLostPhotosList().length >= maxAllowed) {
            this.notify.warning(`Has alcanzado el límite de ${maxAllowed} fotos.`);
            this.stopCameraStream();
            return;
          }
          const previewUrl = URL.createObjectURL(file);
          this.reportLostPhotosList.update((list) =>
            [...list, { previewUrl, file }].slice(0, maxAllowed),
          );
          this.notify.success('📸 Foto capturada y agregada a la publicación');
          if (this.reportLostPhotosList().length >= maxAllowed) {
            this.stopCameraStream();
          }
        } else {
          this.sightingSelectedFile.set(file);
          void this.imageUploadService.fileToDataUrl(file).then((preview) => {
            this.sightingPhotoPreview.set(preview);
          });
          this.notify.success('📸 Foto de evidencia capturada');
          this.stopCameraStream();
        }
      },
      'image/jpeg',
      0.88,
    );
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
    this.reportLostAttempted.set(true);
    if (!this.reportLostForm.petName.trim() || !this.reportLostForm.lastSeenLocation.trim()) {
      this.reportLostStep1Attempted.set(true);
    }
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
        const parsedVaccines = this.reportLostForm.vaccinesText
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
        const petPayload: any = {
          name: this.reportLostForm.petName.trim(),
          species: this.reportLostForm.species,
          breed: this.reportLostForm.breed.trim() || undefined,
          approximateAge: this.reportLostForm.approximateAge.trim() || 'No especificada',
          gender: this.reportLostForm.gender === 'Hembra' ? 'FEMALE' : 'MALE',
          size: this.reportLostForm.size || 'MEDIANO',
          color: this.reportLostForm.color.trim() || undefined,
          specialMarks: this.reportLostForm.specialMarks.trim() || undefined,
          status: 'DISPONIBLE',
          coloniaId: this.reportLostForm.coloniaId || undefined,
          photoUrl: primaryPhoto,
          photos: finalPhotos,
          rescueStory: `${this.reportLostForm.distinctiveFeatures.trim()} (Ubicación: ${this.reportLostForm.lastSeenLocation.trim()})`,
          notes: `Tel. de contacto: ${this.reportLostForm.contactPhone.trim()}`,
          temperamentTags: this.reportLostForm.temperamentTags,
          isSterilized: this.reportLostForm.temperamentTags.includes('Esterilizado(a)'),
          isDewormed: !!this.reportLostForm.isDewormed,
          vaccinesList: parsedVaccines.length > 0 ? parsedVaccines : undefined,
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
              breed: createdPet.breed,
              approxAge: createdPet.approximateAge,
              size: createdPet.size,
              gender: createdPet.gender === 'FEMALE' ? 'Hembra' : 'Macho',
              coloniaName,
              isSterilized: createdPet.isSterilized,
              isVaccinated: Boolean(createdPet.vaccinesList && createdPet.vaccinesList.length > 0),
              goodWithKids: createdPet.goodWithKids,
              goodWithOtherPets: createdPet.goodWithOtherPets,
              petData: createdPet,
              comments: [],
              showComments: false,
              newCommentText: '',
              isSubmittingComment: false,
            };
            this.registerKnownPosts([newAdoptionPost]);
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

          this.registerKnownPosts([newPost]);
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
  isOwnFeedPet(pet?: Pet): boolean {
    if (!pet) return false;
    const myId = this.authService.currentUser()?.id;
    const ownerId = pet.ownerId || pet.owner?.id;
    return !!myId && !!ownerId && myId === ownerId;
  }

  isFeedPetAdoptable(pet?: Pet): boolean {
    if (!pet?.status) return true;
    return pet.status === 'DISPONIBLE' || pet.status === 'EN_PROCESO';
  }

  openAdoptionModal(pet: Pet): void {
    if (!this.isFeedPetAdoptable(pet)) {
      this.notify.warning('Esta mascota ya no está disponible para nuevas postulaciones.');
      return;
    }
    if (this.isOwnFeedPet(pet)) {
      this.notify.warning('No puedes postularte para adoptar tu propia publicación.');
      return;
    }
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
  }

  closeAdoptionModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
    this.selectedPetForAdoption.set(null);
    this.adoptionSubmittedSuccess.set(false);
  }

  submitAdoptionRequest(payload: CreateAdoptionRequestPayload): void {
    const pet = this.selectedPetForAdoption();
    if (!pet) return;

    this.isSubmittingAdoption.set(true);

    this.adoptionService.createRequest(pet.id, payload).subscribe({
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

  canMessagePostAuthor(post: FeedPost): boolean {
    const authorId =
      post.kind === 'PET_ADOPTION'
        ? post.petData?.ownerId || post.petData?.owner?.id
        : post.lostData?.reporterId || post.lostData?.reporter?.id;
    if (!authorId) return false;
    const myId = this.authService.currentUser()?.id;
    return !myId || authorId !== myId;
  }

  contactAuthorInApp(post: FeedPost, customMessage?: string): void {
    const recipientId =
      post.kind === 'PET_ADOPTION'
        ? post.petData?.ownerId || post.petData?.owner?.id
        : post.lostData?.reporterId || post.lostData?.reporter?.id;
    if (!recipientId) return;

    this.dmService.openChatWithContext({
      recipientId,
      recipientName: post.authorName,
      contextType: post.kind === 'PET_ADOPTION' ? 'PET' : 'LOST_REPORT',
      contextId:
        post.kind === 'PET_ADOPTION' ? post.petData?.id : post.lostData?.id,
      contextTitle: post.title,
      contextSubtitle: `${post.typeBadge} • ${post.coloniaName || 'Dolores Hidalgo'}`,
      contextImageUrl: post.photoUrl,
      contextTargetUrl:
        post.kind === 'PET_ADOPTION' && post.petData
          ? `/adopciones/${post.petData.id}`
          : `/publicacion/${post.id}`,
      contextWhatsappPhone:
        post.contactPhone || post.petData?.owner?.phone || undefined,
      prefilledDraft: customMessage,
    });
  }

  contactSelectedAdoptionPetOwnerInApp(): void {
    const pet = this.selectedPetForAdoption();
    if (!pet) return;
    const recipientId = pet.ownerId || pet.owner?.id;
    this.closeAdoptionModal();
    if (!recipientId) return;

    this.dmService.openChatWithContext({
      recipientId,
      recipientName: pet.owner?.fullName,
      contextType: 'ADOPTION_REQUEST',
      contextId: pet.id,
      contextTitle: `Solicitud de Adopción: ${pet.name}`,
      contextSubtitle: `${pet.species} • ${pet.colonia?.name || 'Dolores Hidalgo'}`,
      contextImageUrl: pet.photoUrl || pet.photos?.[0],
      contextTargetUrl: `/adopciones/${pet.id}`,
      contextWhatsappPhone: pet.owner?.phone || undefined,
      prefilledDraft: `¡Hola! Acabo de registrar mi solicitud para adoptar a ${pet.name}. Me encantaría platicar sobre los siguientes pasos y agendar una visita 💚`,
    });
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
    this.sightingAttempted.set(false);
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
    this.stopCameraStream();
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

  selectedLostPetPetIsResguardo(): boolean {
    return this.selectedLostPetForSighting()?.type === 'EN_RESGUARDO';
  }

  getSightingQuickChips(type?: LostPetType): string[] {
    if (type === 'ANIMAL_HERIDO') {
      return [
        '🚑 Voy en camino a auxiliarlo',
        '🚗 Puedo apoyar con traslado a veterinaria',
        '🏠 Ofrezco resguardo temporal',
        '📍 Sigue en la ubicación reportada',
      ];
    }
    if (type === 'EN_RESGUARDO') {
      return [
        '🙋‍♂️ ¡Es mi mascota! Quiero coordinar para recogerla',
        '🏡 Puedo brindarle hogar temporal',
        '🤝 Apoyo con alimento o insumos',
      ];
    }
    return [
      '📍 Lo acabo de ver hace unos minutos',
      '🏡 Lo tengo resguardado temporalmente',
      '🐕 Iba caminando por esta calle',
    ];
  }

  selectSightingQuickChip(chip: string): void {
    this.sightingForm.locationDescription = chip;
  }

  openSightingPhotoInLightbox(post: FeedPost, photoUrl: string): void {
    if (!photoUrl) return;
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.lightboxPost.set({
      ...post,
      photos: [photoUrl],
    });
    this.lightboxIndex.set(0);
  }

  submitSighting(): void {
    this.sightingAttempted.set(true);
    const report = this.selectedLostPetForSighting();
    if (!report) return;
    if (!this.sightingForm.locationDescription.trim()) {
      this.notify.warning('Completa el campo obligatorio', 'Indica dónde viste a la mascota o el apoyo que deseas ofrecer.');
      return;
    }

    this.isSubmittingSighting.set(true);

    const executeSighting = (photoUrl?: string) => {
      const payload = {
        locationDescription: this.sightingForm.locationDescription.trim().slice(0, 245),
        photoUrl: photoUrl || undefined,
        additionalNotes: this.sightingForm.additionalNotes.trim() || undefined,
      };

      this.lostPetService.addSighting(report.id, payload).subscribe({
        next: (createdSighting) => {
          this.isSubmittingSighting.set(false);
          const currentUser = this.authService.currentUser();
          const enrichedSighting: PetSighting = {
            ...createdSighting,
            id: createdSighting?.id || `sighting-${Date.now()}`,
            reportId: report.id,
            notifierId: createdSighting?.notifierId || currentUser?.id,
            notifier: createdSighting?.notifier || currentUser || undefined,
            locationDescription: createdSighting?.locationDescription || payload.locationDescription,
            additionalNotes: createdSighting?.additionalNotes ?? payload.additionalNotes,
            photoUrl: createdSighting?.photoUrl ?? payload.photoUrl,
            createdAt: createdSighting?.createdAt || new Date().toISOString(),
          };

          const postId = `lost-${report.id}`;
          this.allPosts.update((posts) =>
            posts.map((p) => {
              if (p.id !== postId) return p;
              const updatedSightings = [...(p.sightings || []), enrichedSighting];
              return {
                ...p,
                sightings: updatedSightings,
                reportsCount: updatedSightings.length,
              };
            }),
          );

          this.highlightedPostId.set(postId);
          this.closeSightingModal();
          this.notify.success(
            '¡Reporte guardado en la Bitácora!',
            'Ya es visible dentro de la tarjeta de la publicación y se notificó al autor.',
          );
        },
        error: (err) => {
          this.isSubmittingSighting.set(false);
          const msg =
            err?.error?.message ||
            'No se pudo guardar el reporte. Verifica tu sesión e intenta de nuevo.';
          this.notify.error(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      });
    };

    if (
      (this.sightingPhotoSource() === 'FILE' || this.sightingPhotoSource() === 'CAMERA') &&
      this.sightingSelectedFile()
    ) {
      this.imageUploadService.uploadImage(this.sightingSelectedFile()!, 'sightings').subscribe({
        next: (uploadedUrl) => executeSighting(uploadedUrl),
        error: () => executeSighting(this.sightingPhotoPreview() || undefined),
      });
    } else {
      const url = this.sightingForm.photoUrl?.trim() || this.sightingPhotoPreview() || undefined;
      executeSighting(url);
    }
  }

  canDeleteComment(comment: PublicationComment): boolean {
    if (!comment?.id || String(comment.id).startsWith('temp-')) return false;
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const authorId = comment.authorId || comment.author?.id;
    return Boolean(authorId && authorId === user.id);
  }

  async deleteComment(post: FeedPost, comment: PublicationComment): Promise<void> {
    if (!comment?.id) return;

    const confirmed = await this.confirmService.confirm({
      title: '¿Eliminar comentario?',
      message: 'Este comentario se borrará de la publicación de forma permanente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: '🗑️',
    });
    if (!confirmed) return;

    const obs =
      post.kind === 'LOST_PET' && post.lostData
        ? this.lostPetService.deleteComment(post.lostData.id, comment.id)
        : post.kind === 'PET_ADOPTION' && post.petData
        ? this.petService.deleteComment(post.petData.id, comment.id)
        : null;

    if (!obs) return;

    obs.subscribe({
      next: () => {
        this.allPosts.update((posts) =>
          posts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  comments: (p.comments || []).filter((c) => c.id !== comment.id),
                }
              : p,
          ),
        );
        this.notify.success('Comentario eliminado');
      },
      error: (err) => {
        this.notify.error(
          err?.error?.message || 'No tienes permiso o no se pudo eliminar el comentario',
        );
      },
    });
  }

  canDeleteSighting(sighting: PetSighting): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const creatorId = sighting.notifierId || sighting.notifier?.id;
    return Boolean(creatorId && creatorId === user.id);
  }

  async deleteSightingReport(post: FeedPost, sighting: PetSighting): Promise<void> {
    if (!post.lostData?.id || !sighting?.id) return;

    const confirmed = await this.confirmService.confirm({
      title: '¿Eliminar reporte de la bitácora?',
      message: `¿Deseas eliminar el reporte "${sighting.locationDescription}" de la bitácora de esta publicación?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: '🗑️',
    });
    if (!confirmed) return;

    this.lostPetService.deleteSighting(post.lostData.id, sighting.id).subscribe({
      next: () => {
        this.allPosts.update((posts) =>
          posts.map((p) => {
            if (p.id !== post.id) return p;
            const remaining = (p.sightings || []).filter((s) => s.id !== sighting.id);
            return {
              ...p,
              sightings: remaining,
              reportsCount: Math.max(1, remaining.length),
            };
          }),
        );
        this.notify.success('Reporte eliminado de la bitácora');
      },
      error: (err) => {
        this.notify.error(
          err?.error?.message || 'No tienes permiso o no se pudo eliminar el reporte',
        );
      },
    });
  }

  contactSightingNotifier(post: FeedPost, sighting: any): void {
    const targetUserId = sighting?.notifierId || sighting?.notifier?.id;
    if (!targetUserId) return;
    if (!this.authService.isAuthenticated()) {
      this.notify.warning('Inicia sesión para enviar un mensaje directo');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.dmService.openChatWithContext({
      recipientId: targetUserId,
      recipientName: sighting.notifier?.fullName || 'Ciudadano solidario',
      contextType: 'LOST_PET',
      contextId: post.lostData?.id || post.id,
      contextTitle: `Reporte en: ${post.title}`,
      contextSubtitle: `Bitácora: ${sighting.locationDescription}`,
      contextImageUrl: sighting.photoUrl || post.photoUrl,
      contextTargetUrl: `/publicacion/${post.id}`,
      prefilledDraft: `¡Hola ${sighting.notifier?.fullName?.split(' ')[0] || ''}! Vi tu reporte "${sighting.locationDescription}" en la bitácora de la publicación (${post.title}). ¿Podemos coordinarnos por aquí? 🙏🐾`,
    });
  }

  // ==========================================
  // SOCIAL SHARE HELPERS
  // ==========================================
  getPostDirectUrl(post: FeedPost): string {
    if (post.kind === 'PET_ADOPTION' && post.petData?.id) {
      return `${window.location.origin}/adopciones/${post.petData.id}`;
    }
    if (post.kind === 'LOST_PET' && post.lostData?.id) {
      return `${window.location.origin}/publicacion/${post.lostData.id}`;
    }
    const cleanId = post.id.replace(/^(lost-|pet-)/, '');
    return `${window.location.origin}/publicacion/${cleanId}`;
  }

  shareToFacebook(post: FeedPost): void {
    const postUrl = this.getPostDirectUrl(post);
    const locationPart = post.lastSeenLocation || post.coloniaName || this.brand.city;
    const shareSummary = `🐾 ${post.title}\n📍 Zona: ${locationPart}\n\n"${post.description}"\n\n👉 Ver publicación directa en ${this.brand.name}: ${postUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareSummary).catch(() => {});
    }

    this.notify.info(
      '🌐 Tarjeta de Facebook lista (y texto copiado)',
      'La tarjeta del enlace cargará automáticamente la foto, título y datos de la mascota. Si gustas, también puedes presionar Ctrl+V arriba.',
    );

    const url = encodeURIComponent(postUrl);
    const quote = encodeURIComponent(shareSummary);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank');
  }

  copyPostLink(post: FeedPost): void {
    const postUrl = this.getPostDirectUrl(post);
    navigator.clipboard.writeText(postUrl);
    this.notify.success('🔗 Enlace directo a la publicación copiado al portapapeles');
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
    this.stopCameraStream();
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
