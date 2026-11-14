import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService, UserPublications } from '../../core/services/user.service';
import { ColoniaService } from '../../core/services/colonia.service';
import { NotificationService } from '../../core/services/notification.service';
import { ImageUploadService } from '../../core/services/image-upload.service';
import { PetService } from '../../core/services/pet.service';
import { LostPetService } from '../../core/services/lost-pet.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ScrollLockService } from '../../core/services/scroll-lock.service';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';
import { User, UserRole } from '../../core/models/user.model';
import { Colonia } from '../../core/models/colonia.model';
import { LostPetReport, LostPetStatus } from '../../core/models/lost-pet.model';
import { BRAND_CONFIG } from '../../core/constants/brand.constants';
import { getStageMeta } from '../adoptions/shared/adoption-helpers.util';
import { AdoptionRequestStatus } from '../../core/models/adoption.model';

type ProfileTab = 'PETS' | 'LOST' | 'ADOPTIONS';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 overflow-x-clip">
      <!-- Top Bar -->
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          (click)="goBack()"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500/40 transition-colors cursor-pointer"
        >
          <span>{{ navHistory.getBackLabel('← Volver') }}</span>
        </button>

        <button
          type="button"
          (click)="confirmLogout()"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-xs font-bold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>

      <!-- Profile Hero Card -->
      <section class="liquid-glass rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <!-- Avatar -->
          <div class="flex items-center gap-4 sm:block shrink-0">
            <div class="relative group w-20 h-20 sm:w-24 sm:h-24">
              <div class="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg">
                @if (user()?.profilePhotoUrl) {
                  <img
                    [src]="user()!.profilePhotoUrl"
                    [alt]="user()?.fullName || 'Foto de perfil'"
                    class="w-full h-full object-cover"
                  />
                } @else {
                  <span class="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
                    {{ getInitials(user()?.fullName) }}
                  </span>
                }
              </div>

              <button
                type="button"
                (click)="openPhotoModal()"
                aria-label="Cambiar foto de perfil"
                title="Cambiar foto de perfil"
                class="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md flex items-center justify-center border-2 border-white dark:border-slate-900 transition-transform active:scale-95 cursor-pointer"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </button>
            </div>

            <!-- Mobile-only Title Block next to avatar -->
            <div class="sm:hidden min-w-0 flex-1 space-y-1">
              <h1 class="text-lg font-black text-slate-900 dark:text-white tracking-tight break-words leading-snug">
                {{ user()?.fullName || 'Mi Perfil' }}
              </h1>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                {{ getRoleBadge(user()?.role) }}
              </span>
            </div>
          </div>

          <!-- User Info -->
          <div class="flex-1 min-w-0 space-y-2.5">
            <div class="hidden sm:flex flex-wrap items-center gap-2.5">
              <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight break-words">
                {{ user()?.fullName || 'Mi Perfil' }}
              </h1>
              <span class="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                {{ getRoleBadge(user()?.role) }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div class="flex items-center gap-2 min-w-0">
                <svg class="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span class="break-all">{{ user()?.email }}</span>
              </div>

              <div class="flex items-center gap-2 min-w-0">
                <svg class="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                @if (user()?.phone) {
                  <span class="font-semibold">{{ user()?.phone }}</span>
                } @else {
                  <span class="text-amber-600 dark:text-amber-400 font-semibold">Sin teléfono (requerido para publicar)</span>
                }
              </div>

              <div class="flex items-center gap-2 min-w-0">
                <svg class="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span class="truncate">{{ user()?.colonia?.name || brand.city }}</span>
              </div>

              @if (user()?.createdAt) {
                <div class="flex items-center gap-2 min-w-0 text-slate-500 dark:text-slate-400">
                  <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Miembro desde {{ formatDate(user()?.createdAt) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Primary Profile Edit Actions -->
          <div class="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70 dark:border-slate-800">
            <button
              type="button"
              (click)="openEditModal()"
              class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              <span>Editar perfil</span>
            </button>

            <a
              routerLink="/verificacion"
              class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Verificación Nivel {{ verificationLevel() }}/3</span>
            </a>
          </div>
        </div>

        <!-- Verification Trust Progress + Quick Workspace Links -->
        <div class="mt-5 pt-5 border-t border-slate-200/70 dark:border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div class="lg:col-span-6 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-700 dark:text-slate-300">Nivel de Confianza Comunitaria</span>
              <span class="font-black text-emerald-700 dark:text-emerald-400">
                Nivel {{ verificationLevel() }} de 3
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div
                class="px-2.5 py-2 rounded-xl border text-[11px] font-bold transition-colors"
                [ngClass]="
                  verificationLevel() >= 1
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-500'
                "
              >
                1. Teléfono
              </div>
              <div
                class="px-2.5 py-2 rounded-xl border text-[11px] font-bold transition-colors"
                [ngClass]="
                  verificationLevel() >= 2
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-500'
                "
              >
                2. Cuestionario
              </div>
              <div
                class="px-2.5 py-2 rounded-xl border text-[11px] font-bold transition-colors"
                [ngClass]="
                  verificationLevel() >= 3
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-500'
                "
              >
                3. Compromiso
              </div>
            </div>
          </div>

          <div class="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <a
              routerLink="/pets"
              class="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 transition-colors text-left"
            >
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expedientes</span>
              <span class="block text-xs font-black text-slate-900 dark:text-white mt-0.5 truncate">Mis Mascotas</span>
            </a>

            <a
              [routerLink]="isRescuerOrAdmin() ? ['/panel-rescatista'] : ['/mis-adopciones']"
              [queryParams]="!isRescuerOrAdmin() && (publications()?.pets?.length || 0) > 0 ? { tab: 'published' } : {}"
              class="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 transition-colors text-left"
            >
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gestión</span>
              <span class="block text-xs font-black text-slate-900 dark:text-white mt-0.5 truncate">
                {{ isRescuerOrAdmin() ? 'Panel Rescatista' : 'Mis Adopciones' }}
              </span>
            </a>

            <a
              routerLink="/mensajes"
              class="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 transition-colors text-left"
            >
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bandeja</span>
              <span class="block text-xs font-black text-slate-900 dark:text-white mt-0.5 truncate">Mensajes Directos</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Scrollable Responsive Navigation Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          (click)="activeTab.set('PETS')"
          class="px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer"
          [ngClass]="
            activeTab() === 'PETS'
              ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          "
        >
          En Adopción ({{ publications()?.pets?.length || 0 }})
        </button>

        <button
          type="button"
          (click)="activeTab.set('LOST')"
          class="px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer"
          [ngClass]="
            activeTab() === 'LOST'
              ? 'border-rose-500 text-rose-700 dark:text-rose-400 bg-rose-500/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          "
        >
          Reportes y Urgencias ({{ publications()?.lostReports?.length || 0 }})
        </button>

        <button
          type="button"
          (click)="activeTab.set('ADOPTIONS')"
          class="px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer"
          [ngClass]="
            activeTab() === 'ADOPTIONS'
              ? 'border-teal-500 text-teal-700 dark:text-teal-400 bg-teal-500/10'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          "
        >
          Mis Solicitudes ({{ publications()?.adoptionRequests?.length || 0 }})
        </button>
      </div>

      <!-- Loading Skeleton -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (item of [1, 2, 3]; track item) {
            <div class="liquid-glass rounded-2xl p-4 h-56 animate-pulse flex flex-col justify-between border border-slate-200/70 dark:border-slate-800">
              <div class="h-32 bg-slate-300/60 dark:bg-slate-800/70 rounded-xl"></div>
              <div class="space-y-2">
                <div class="h-4 bg-slate-300/60 dark:bg-slate-800/70 rounded w-3/4"></div>
                <div class="h-3 bg-slate-300/60 dark:bg-slate-800/70 rounded w-1/2"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- TAB 1: MASCOTAS PUBLICADAS EN ADOPCIÓN -->
        @if (activeTab() === 'PETS') {
          @if (!publications()?.pets || publications()!.pets.length === 0) {
            <div class="liquid-glass rounded-3xl p-8 sm:p-10 text-center space-y-3 border border-slate-200/80 dark:border-slate-800/80">
              <h3 class="text-base font-black text-slate-900 dark:text-white">Aún no tienes mascotas publicadas en adopción</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Publica una mascota en adopción responsable o administra tus fichas médicas privadas en la sección Mis Mascotas.
              </p>
              <div class="pt-2 flex flex-wrap justify-center gap-2.5">
                <a
                  routerLink="/"
                  [queryParams]="{ compose: 'EN_ADOPCION' }"
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md"
                >
                  + Publicar en Adopción
                </a>
                <a
                  routerLink="/pets/new"
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
                >
                  Registrar Expediente
                </a>
              </div>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (pet of publications()!.pets; track pet.id) {
                <article class="liquid-glass rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800/80 flex flex-col">
                  <div class="h-44 bg-slate-200/50 dark:bg-slate-900 relative overflow-hidden">
                    <img
                      [src]="pet.photoUrl || (pet.photos && pet.photos[0]) || 'assets/pet-placeholder.jpg'"
                      [alt]="pet.name"
                      class="w-full h-full object-cover"
                    />
                    <span
                      class="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-sm"
                      [ngClass]="{
                        'bg-emerald-500 text-slate-950': pet.status === 'DISPONIBLE',
                        'bg-amber-400 text-slate-950': pet.status === 'EN_PROCESO',
                        'bg-sky-500 text-white': pet.status === 'ADOPTADA' || pet.status === 'EN_SEGUIMIENTO'
                      }"
                    >
                      {{ getPetStatusLabel(pet.status) }}
                    </span>
                  </div>

                  <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div class="space-y-1 min-w-0">
                      <h4 class="text-sm font-black text-slate-900 dark:text-white truncate">{{ pet.name }}</h4>
                      <p class="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {{ pet.species }} {{ pet.breed ? '• ' + pet.breed : '' }}
                        {{ pet.approximateAge ? '• ' + pet.approximateAge : '' }}
                      </p>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {{ pet.colonia?.name || brand.city }}
                      </p>
                    </div>

                    <div class="pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div class="flex items-center gap-2">
                        <a
                          [routerLink]="['/adopciones', pet.id]"
                          class="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-500/25 transition-colors"
                        >
                          Ver ficha
                        </a>
                        <a
                          [routerLink]="['/pets/edit', pet.id]"
                          class="px-2.5 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          Editar
                        </a>
                      </div>

                      <div class="flex items-center gap-1.5">
                        <a
                          [routerLink]="isRescuerOrAdmin() ? ['/panel-rescatista'] : ['/mis-adopciones']"
                          [queryParams]="isRescuerOrAdmin() ? {} : { tab: 'published' }"
                          class="px-2.5 py-1.5 rounded-lg text-teal-700 dark:text-teal-300 font-bold hover:bg-teal-500/10 transition-colors"
                        >
                          Postulantes
                        </a>
                        <button
                          type="button"
                          (click)="deactivatePet(pet.id)"
                          class="px-2 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold cursor-pointer"
                          title="Dar de baja adopción"
                        >
                          Baja
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        }

        <!-- TAB 2: REPORTES DE EXTRAVÍO / RESCATE -->
        @if (activeTab() === 'LOST') {
          @if (!publications()?.lostReports || publications()!.lostReports.length === 0) {
            <div class="liquid-glass rounded-3xl p-8 sm:p-10 text-center space-y-3 border border-slate-200/80 dark:border-slate-800/80">
              <h3 class="text-base font-black text-slate-900 dark:text-white">No tienes reportes de emergencia o extravío</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Si se extravió tu mascota o viste un animal herido o en resguardo en {{ brand.city }}, publícalo en el muro comunitario para activar alertas.
              </p>
              <div class="pt-2">
                <a
                  routerLink="/"
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs shadow-md"
                >
                  Ir al Muro a Reportar
                </a>
              </div>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (rep of publications()!.lostReports; track rep.id) {
                <article class="liquid-glass rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800/80 flex flex-col">
                  <div class="h-44 bg-slate-200/50 dark:bg-slate-900 relative overflow-hidden">
                    <img
                      [src]="(rep.photos && rep.photos[0]) || 'assets/pet-placeholder.jpg'"
                      [alt]="rep.petName"
                      class="w-full h-full object-cover"
                    />
                    <div class="absolute top-2.5 inset-x-2.5 flex flex-wrap items-center justify-between gap-1.5">
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-sm"
                        [ngClass]="{
                          'bg-rose-600 text-white': rep.type === 'ANIMAL_HERIDO',
                          'bg-amber-500 text-slate-950': rep.type === 'EN_RESGUARDO',
                          'bg-emerald-500 text-slate-950': rep.type === 'EN_ADOPCION',
                          'bg-purple-600 text-white': rep.type === 'CAMPANA_COMUNITARIA',
                          'bg-rose-500 text-white': rep.type === 'SE_BUSCA' || rep.type === 'EXTRAVIADA',
                          'bg-sky-500 text-white': rep.type === 'ENCONTRADA_EN_CALLE'
                        }"
                      >
                        {{ getLostTypeLabel(rep.type) }}
                      </span>

                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm"
                        [ngClass]="
                          rep.status === 'REENCONTRADA' || rep.status === 'CERRADO'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-900/85 text-white'
                        "
                      >
                        {{ getLostStatusLabel(rep.status) }}
                      </span>
                    </div>
                  </div>

                  <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div class="space-y-1 min-w-0">
                      <h4 class="text-sm font-black text-slate-900 dark:text-white truncate">{{ rep.petName }}</h4>
                      <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {{ rep.lastSeenLocation }}
                      </p>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400">
                        {{ formatExactDateTime(rep.createdAt) }}
                        @if (rep.sightings && rep.sightings.length > 0) {
                          <span class="font-bold text-amber-600 dark:text-amber-400">
                            • {{ rep.sightings.length }} avistamientos
                          </span>
                        }
                      </p>
                    </div>

                    <div class="pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <a
                          [routerLink]="['/publicacion', 'lost-' + rep.id]"
                          class="px-2.5 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          Ver en muro
                        </a>

                        @if (rep.status !== 'REENCONTRADA' && rep.status !== 'CERRADO') {
                          <button
                            type="button"
                            (click)="markReportResolved(rep)"
                            class="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold cursor-pointer transition-colors"
                          >
                            Marcar resuelta
                          </button>
                        }
                      </div>

                      <button
                        type="button"
                        (click)="deactivateLostReport(rep.id)"
                        class="px-2 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold cursor-pointer"
                        title="Dar de baja reporte"
                      >
                        Baja
                      </button>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        }

        <!-- TAB 3: MIS SOLICITUDES DE ADOPCIÓN -->
        @if (activeTab() === 'ADOPTIONS') {
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <p class="text-xs text-slate-600 dark:text-slate-300">
              Consulta el seguimiento en 4 etapas, firma tu Convenio Digital y sube evidencia post-adopción en el portal dedicado.
            </p>
            <a
              routerLink="/mis-adopciones"
              class="self-start sm:self-center px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-sm hover:brightness-105 whitespace-nowrap"
            >
              Abrir Mis Adopciones →
            </a>
          </div>

          @if (!publications()?.adoptionRequests || publications()!.adoptionRequests.length === 0) {
            <div class="liquid-glass rounded-3xl p-8 sm:p-10 text-center space-y-3 border border-slate-200/80 dark:border-slate-800/80">
              <h3 class="text-base font-black text-slate-900 dark:text-white">No tienes postulaciones de adopción</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Explora los perritos y gatitos disponibles en {{ brand.city }} para iniciar una adopción responsable.
              </p>
              <div class="pt-2">
                <a
                  routerLink="/adopciones"
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md"
                >
                  Ver Mascotas en Adopción
                </a>
              </div>
            </div>
          } @else {
            <div class="space-y-3">
              @for (req of publications()!.adoptionRequests; track req.id) {
                @let stage = adoptionStageMeta(req.status);
                <div class="liquid-glass rounded-2xl p-4 sm:p-5 shadow-md border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 overflow-hidden flex items-center justify-center shrink-0">
                      @if (req.pet?.photoUrl) {
                        <img [src]="req.pet.photoUrl" [alt]="req.pet?.name || 'Mascota'" class="w-full h-full object-cover" />
                      } @else {
                        <span class="text-sm font-black text-emerald-700 dark:text-emerald-300">
                          {{ getInitials(req.pet?.name || 'M') }}
                        </span>
                      }
                    </div>
                    <div class="min-w-0">
                      <h4 class="text-sm font-black text-slate-900 dark:text-white truncate">
                        Solicitud para adoptar a {{ req.pet?.name || 'Mascota' }}
                      </h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400">
                        Enviada el {{ formatExactDateTime(req.createdAt) }}
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
                    <span
                      class="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase border"
                      [ngClass]="stage.colorClass"
                    >
                      {{ stage.label }}
                    </span>

                    <a
                      routerLink="/mis-adopciones"
                      class="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      Ver detalle →
                    </a>
                  </div>
                </div>
              }
            </div>
          }
        }
      }

      <!-- MODAL: EDITAR PERFIL Y CONTRASEÑA -->
      @if (isEditModalOpen()) {
        <div
          class="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fadeIn overflow-y-auto overscroll-contain"
          (click)="closeEditModal()"
        >
          <div
            class="bg-white/95 dark:bg-slate-900/95 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl relative border border-emerald-500/30 space-y-5 my-auto max-h-[90dvh] overflow-y-auto overscroll-contain"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800">
              <div>
                <h2 class="text-lg font-black text-slate-900 dark:text-white">Editar Perfil</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">Actualiza tu información de contacto en {{ brand.city }}</p>
              </div>
              <button
                type="button"
                (click)="closeEditModal()"
                aria-label="Cerrar"
                class="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre completo <span class="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="editForm.fullName"
                  name="editFullName"
                  placeholder="Tu nombre y apellido"
                  class="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-sm text-slate-900 dark:text-white"
                  [ngClass]="profileAttempted() && !editForm.fullName.trim() ? '!border-rose-500 ring-1 ring-rose-500/40' : ''"
                />
                @if (profileAttempted() && !editForm.fullName.trim()) {
                  <p class="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    El nombre completo es obligatorio.
                  </p>
                }
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Teléfono / WhatsApp (10 dígitos)
                  </label>
                  @if (editPhoneDigitsCount() >= 10) {
                    <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      Activa Nivel 1
                    </span>
                  }
                </div>
                <input
                  type="tel"
                  [(ngModel)]="editForm.phone"
                  name="editPhone"
                  placeholder="Ej. 4181234567"
                  class="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-sm text-slate-900 dark:text-white"
                  [ngClass]="profileAttempted() && isPhoneInvalid() ? '!border-rose-500 ring-1 ring-rose-500/40' : ''"
                />
                @if (profileAttempted() && isPhoneInvalid()) {
                  <p class="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    Ingresa al menos 10 dígitos numéricos para validar tu teléfono, o déjalo vacío si prefieres omitirlo.
                  </p>
                } @else {
                  <p class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Guardar un teléfono de 10 dígitos activa automáticamente el Nivel 1 de confianza.
                  </p>
                }
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Colonia en {{ brand.city }}
                </label>
                <select
                  [(ngModel)]="editForm.coloniaId"
                  name="editColonia"
                  class="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-sm text-slate-900 dark:text-white"
                >
                  <option value="">Selecciona una colonia (opcional)</option>
                  @for (col of colonias(); track col.id) {
                    <option [value]="col.id">{{ col.name }} {{ col.postalCode ? '(CP ' + col.postalCode + ')' : '' }}</option>
                  }
                </select>
              </div>

              <!-- Foto de perfil dentro de edición -->
              <div class="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Foto de perfil</span>
                  <div class="inline-flex rounded-xl bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                    <button
                      type="button"
                      (click)="editPhotoSource.set('FILE')"
                      class="px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                      [ngClass]="editPhotoSource() === 'FILE' ? 'bg-emerald-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'"
                    >
                      Archivo
                    </button>
                    <button
                      type="button"
                      (click)="editPhotoSource.set('URL')"
                      class="px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                      [ngClass]="editPhotoSource() === 'URL' ? 'bg-emerald-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'"
                    >
                      URL
                    </button>
                  </div>
                </div>

                @if (editPhotoSource() === 'FILE') {
                  <input
                    type="file"
                    accept="image/*"
                    (change)="onEditPhotoFileSelected($event)"
                    class="block w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-500/15 file:text-emerald-700 dark:file:text-emerald-300 cursor-pointer"
                  />
                } @else {
                  <input
                    type="url"
                    [(ngModel)]="editForm.profilePhotoUrl"
                    (ngModelChange)="editFormPhotoPreview.set($event || null)"
                    name="editPhotoUrl"
                    placeholder="https://..."
                    class="w-full px-3 py-2 rounded-xl liquid-glass-input text-xs text-slate-900 dark:text-white"
                  />
                }

                @if (editFormPhotoPreview()) {
                  <div class="flex items-center gap-3">
                    <img
                      [src]="editFormPhotoPreview()"
                      alt="Vista previa"
                      class="w-12 h-12 rounded-xl object-cover border border-emerald-500/30"
                    />
                    <span class="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Vista previa lista</span>
                  </div>
                }
              </div>

              <!-- Seguridad de cuenta -->
              <div class="pt-1 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span>¿Deseas actualizar tu contraseña?</span>
                <a
                  routerLink="/auth/forgot-password"
                  (click)="closeEditModal()"
                  class="font-bold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap"
                >
                  Restablecer por correo →
                </a>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                type="button"
                (click)="closeEditModal()"
                class="px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="saveProfile()"
                [disabled]="isSaving()"
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                @if (isSaving()) {
                  <span class="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Guardando...</span>
                } @else {
                  <span>Guardar cambios</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: ACTUALIZAR FOTO RÁPIDA -->
      @if (isPhotoModalOpen()) {
        <div
          class="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fadeIn overflow-y-auto overscroll-contain"
          (click)="closePhotoModal()"
        >
          <div
            class="bg-white/95 dark:bg-slate-900/95 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl relative border border-emerald-500/30 space-y-5 my-auto max-h-[90dvh] overflow-y-auto overscroll-contain"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800">
              <h2 class="text-lg font-black text-slate-900 dark:text-white">Actualizar Foto de Perfil</h2>
              <button
                type="button"
                (click)="closePhotoModal()"
                aria-label="Cerrar"
                class="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <button
                  type="button"
                  (click)="quickPhotoSource.set('FILE')"
                  class="py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  [ngClass]="quickPhotoSource() === 'FILE' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300'"
                >
                  Subir archivo
                </button>
                <button
                  type="button"
                  (click)="quickPhotoSource.set('URL')"
                  class="py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  [ngClass]="quickPhotoSource() === 'URL' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300'"
                >
                  Pegar enlace URL
                </button>
              </div>

              @if (quickPhotoSource() === 'FILE') {
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Selecciona una imagen (JPG, PNG o WEBP)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    (change)="onQuickPhotoFileSelected($event)"
                    class="block w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/15 file:text-emerald-700 dark:file:text-emerald-300 cursor-pointer"
                  />
                </div>
              } @else {
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    URL de la fotografía
                  </label>
                  <input
                    type="url"
                    [(ngModel)]="quickPhotoUrl"
                    (ngModelChange)="quickPhotoPreview.set($event || null)"
                    name="quickPhotoUrlInput"
                    placeholder="https://..."
                    class="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs text-slate-900 dark:text-white"
                  />
                </div>
              }

              @if (quickPhotoPreview()) {
                <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-emerald-500/30">
                  <img
                    [src]="quickPhotoPreview()"
                    alt="Vista previa"
                    class="w-16 h-16 rounded-xl object-cover border border-emerald-500/40"
                  />
                  <div class="flex-1 min-w-0">
                    <h5 class="text-xs font-bold text-slate-900 dark:text-white truncate">Vista previa lista</h5>
                    <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {{ quickPhotoSource() === 'FILE' ? 'Archivo listo para subir' : 'Enlace web listo' }}
                    </p>
                  </div>
                </div>
              }

              @if (
                photoAttempted() &&
                ((quickPhotoSource() === 'FILE' && !selectedQuickFile()) ||
                  (quickPhotoSource() === 'URL' && !quickPhotoUrl.trim()))
              ) {
                <p class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  {{
                    quickPhotoSource() === 'FILE'
                      ? 'Selecciona una fotografía de tu dispositivo antes de guardar.'
                      : 'Pega un enlace URL válido de la fotografía.'
                  }}
                </p>
              }

              <div class="pt-2 flex flex-col-reverse sm:flex-row gap-2">
                <button
                  type="button"
                  (click)="closePhotoModal()"
                  class="px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  (click)="savePhotoOnly()"
                  [disabled]="isSaving()"
                  class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  @if (isSaving()) {
                    <span class="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>Guardando fotografía...</span>
                  } @else {
                    <span>Guardar fotografía</span>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProfileComponent implements OnInit, OnDestroy {
  brand = BRAND_CONFIG;
  authService = inject(AuthService);
  userService = inject(UserService);
  coloniaService = inject(ColoniaService);
  imageUploadService = inject(ImageUploadService);
  petService = inject(PetService);
  lostPetService = inject(LostPetService);
  notify = inject(NotificationService);
  confirmService = inject(ConfirmService);
  private scrollLock = inject(ScrollLockService);
  public navHistory = inject(NavigationHistoryService);

  user = signal<User | null>(null);
  publications = signal<UserPublications | null>(null);
  colonias = signal<Colonia[]>([]);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  activeTab = signal<ProfileTab>('PETS');

  isEditModalOpen = signal<boolean>(false);
  isPhotoModalOpen = signal<boolean>(false);
  profileAttempted = signal<boolean>(false);
  photoAttempted = signal<boolean>(false);

  quickPhotoSource = signal<'FILE' | 'URL'>('FILE');
  selectedQuickFile = signal<File | null>(null);
  quickPhotoPreview = signal<string | null>(null);
  quickPhotoUrl = '';

  editPhotoSource = signal<'FILE' | 'URL'>('FILE');
  selectedEditFile = signal<File | null>(null);
  editFormPhotoPreview = signal<string | null>(null);

  editForm = {
    fullName: '',
    phone: '',
    profilePhotoUrl: '',
    coloniaId: '',
  };

  verificationLevel = computed(() => this.user()?.verificationLevel ?? 0);

  isRescuerOrAdmin = computed(() => {
    const role = this.user()?.role;
    return (
      role === UserRole.ADMIN ||
      role === UserRole.RESCATISTA_VERIFICADO ||
      role === UserRole.ALBERGUE
    );
  });

  constructor() {
    effect(() => {
      const modalOpen = this.isEditModalOpen() || this.isPhotoModalOpen();
      this.scrollLock.setLocked('profile-modal', modalOpen);
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isPhotoModalOpen()) {
      this.closePhotoModal();
    } else if (this.isEditModalOpen()) {
      this.closeEditModal();
    }
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadColonias();
    this.loadPublications();
  }

  goBack(): void {
    this.navHistory.goBack(['/']);
  }

  async confirmLogout(): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Cerrar sesión',
      message: '¿Deseas cerrar tu sesión actual en este dispositivo?',
      confirmText: 'Cerrar sesión',
      cancelText: 'Seguir aquí',
      type: 'warning',
    });
    if (confirmed) {
      this.authService.logout();
    }
  }

  loadProfile(): void {
    this.userService.getProfile().subscribe({
      next: (u) => {
        this.user.set(u);
        this.editForm = {
          fullName: u.fullName || '',
          phone: u.phone || '',
          profilePhotoUrl: u.profilePhotoUrl || '',
          coloniaId: u.coloniaId || '',
        };
        this.quickPhotoUrl = u.profilePhotoUrl || '';
        this.quickPhotoPreview.set(u.profilePhotoUrl || null);
        this.editFormPhotoPreview.set(u.profilePhotoUrl || null);
      },
      error: () => {
        const u = this.authService.currentUser();
        this.user.set(u);
        if (u) {
          this.quickPhotoUrl = u.profilePhotoUrl || '';
          this.quickPhotoPreview.set(u.profilePhotoUrl || null);
        }
      },
    });
  }

  loadColonias(): void {
    this.coloniaService.getAll().subscribe({
      next: (cols) => this.colonias.set(cols),
      error: () => {},
    });
  }

  loadPublications(): void {
    this.isLoading.set(true);
    this.userService.getMyPublications().subscribe({
      next: (pubs) => {
        this.publications.set(pubs);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  openEditModal(): void {
    this.profileAttempted.set(false);
    const u = this.user();
    if (u) {
      this.editForm = {
        fullName: u.fullName || '',
        phone: u.phone || '',
        profilePhotoUrl: u.profilePhotoUrl || '',
        coloniaId: u.coloniaId || '',
      };
      this.selectedEditFile.set(null);
      this.editFormPhotoPreview.set(u.profilePhotoUrl || null);
    }
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
  }

  openPhotoModal(): void {
    this.photoAttempted.set(false);
    const u = this.user();
    this.quickPhotoUrl = u?.profilePhotoUrl || '';
    this.quickPhotoPreview.set(u?.profilePhotoUrl || null);
    this.selectedQuickFile.set(null);
    this.isPhotoModalOpen.set(true);
  }

  closePhotoModal(): void {
    this.isPhotoModalOpen.set(false);
  }

  async onQuickPhotoFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.selectedQuickFile.set(file);
    const dataUrl = await this.imageUploadService.fileToDataUrl(file);
    this.quickPhotoPreview.set(dataUrl);
  }

  async onEditPhotoFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.selectedEditFile.set(file);
    const dataUrl = await this.imageUploadService.fileToDataUrl(file);
    this.editFormPhotoPreview.set(dataUrl);
  }

  editPhoneDigitsCount(): number {
    return (this.editForm.phone || '').replace(/\D/g, '').length;
  }

  isPhoneInvalid(): boolean {
    const raw = (this.editForm.phone || '').trim();
    if (!raw) return false;
    return this.editPhoneDigitsCount() < 10;
  }

  saveProfile(): void {
    this.profileAttempted.set(true);
    if (!this.editForm.fullName.trim() || this.isPhoneInvalid()) {
      return;
    }

    this.isSaving.set(true);
    const file = this.selectedEditFile();
    if (file && this.editPhotoSource() === 'FILE') {
      this.imageUploadService.uploadImage(file, 'profiles').subscribe({
        next: (uploadedUrl) => {
          this.editForm.profilePhotoUrl = uploadedUrl;
          this.executeSaveProfile();
        },
        error: () => {
          this.isSaving.set(false);
          this.notify.error('No se pudo procesar la fotografía de perfil');
        },
      });
    } else {
      this.executeSaveProfile();
    }
  }

  private executeSaveProfile(): void {
    const payload = {
      fullName: this.editForm.fullName.trim(),
      phone: this.editForm.phone.trim() || undefined,
      profilePhotoUrl: this.editForm.profilePhotoUrl.trim() || undefined,
      coloniaId: this.editForm.coloniaId || undefined,
    };

    this.userService.updateProfile(payload).subscribe({
      next: (updatedUser) => {
        this.isSaving.set(false);
        this.user.set(updatedUser);
        this.closeEditModal();
        this.notify.success('Perfil actualizado exitosamente');
        this.authService.updateCurrentUser(updatedUser);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notify.error(err.error?.message || 'Error al actualizar el perfil');
      },
    });
  }

  savePhotoOnly(): void {
    this.photoAttempted.set(true);
    if (this.quickPhotoSource() === 'FILE') {
      const file = this.selectedQuickFile();
      if (!file) return;
      this.isSaving.set(true);
      this.imageUploadService.uploadImage(file, 'profiles').subscribe({
        next: (photoUrl) => this.persistPhotoUrl(photoUrl),
        error: () => {
          this.isSaving.set(false);
          this.notify.error('No se pudo procesar la fotografía');
        },
      });
    } else {
      if (!this.quickPhotoUrl.trim()) return;
      this.isSaving.set(true);
      this.persistPhotoUrl(this.quickPhotoUrl.trim());
    }
  }

  private persistPhotoUrl(url: string): void {
    this.userService.updateProfile({ profilePhotoUrl: url }).subscribe({
      next: (updatedUser) => {
        this.isSaving.set(false);
        this.user.set(updatedUser);
        this.closePhotoModal();
        this.notify.success('Foto de perfil actualizada exitosamente');
        this.authService.updateCurrentUser(updatedUser);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notify.error(err.error?.message || 'Error al actualizar la foto');
      },
    });
  }

  async markReportResolved(report: LostPetReport): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Marcar reporte como resuelto',
      message: `¿Confirmas que "${report.petName}" ya fue reencontrado o atendido con éxito?`,
      submessage: 'El reporte pasará a estado Resuelta / Reencontrada para avisar a la comunidad.',
      confirmText: 'Sí, marcar resuelta',
      cancelText: 'Cancelar',
      type: 'info',
    });
    if (!confirmed) return;

    this.lostPetService.updateStatus(report.id, 'REENCONTRADA' as LostPetStatus).subscribe({
      next: (updated) => {
        this.publications.update((pubs) => {
          if (!pubs) return pubs;
          return {
            ...pubs,
            lostReports: pubs.lostReports.map((r) => (r.id === report.id ? { ...r, status: updated.status } : r)),
          };
        });
        this.notify.success('¡Qué buena noticia! Reporte marcado como resuelto');
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'No se pudo actualizar el estado del reporte');
      },
    });
  }

  async deactivatePet(id: string): Promise<void> {
    const pet = this.publications()?.pets.find((p) => p.id === id);
    const petName = pet?.name ? `"${pet.name}"` : 'esta mascota';

    const confirmed = await this.confirmService.confirm({
      title: 'Dar de baja adopción',
      message: `¿Deseas dar de baja y desactivar la publicación de adopción de ${petName}?`,
      submessage: 'Dejará de aparecer en el catálogo público y en el muro comunitario, pero se mantendrá archivada en el sistema.',
      confirmText: 'Sí, dar de baja',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.petService.delete(id).subscribe({
      next: () => {
        this.publications.update((pubs) => {
          if (!pubs) return pubs;
          return {
            ...pubs,
            pets: pubs.pets.filter((p) => p.id !== id),
          };
        });
        this.notify.success('Publicación de mascota desactivada y archivada');
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Error al desactivar la publicación');
      },
    });
  }

  async deactivateLostReport(id: string): Promise<void> {
    const report = this.publications()?.lostReports.find((r) => r.id === id);
    const reportTitle = report?.petName ? `"${report.petName}"` : 'este reporte';

    const confirmed = await this.confirmService.confirm({
      title: 'Dar de baja reporte',
      message: `¿Deseas dar de baja y desactivar el reporte de ${reportTitle}?`,
      submessage: 'Dejará de mostrarse en el muro comunitario y alertas públicas, preservando su registro en el sistema.',
      confirmText: 'Sí, dar de baja',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.lostPetService.delete(id).subscribe({
      next: () => {
        this.publications.update((pubs) => {
          if (!pubs) return pubs;
          return {
            ...pubs,
            lostReports: pubs.lostReports.filter((r) => r.id !== id),
          };
        });
        this.notify.success('Reporte desactivado y archivado correctamente');
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Error al desactivar el reporte');
      },
    });
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock('profile-modal');
  }

  getInitials(name?: string): string {
    if (!name) return 'H';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  getRoleBadge(role?: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.RESCATISTA_VERIFICADO:
        return 'Rescatista Verificado';
      case UserRole.ALBERGUE:
        return 'Albergue / Refugio';
      case UserRole.CLINICA_ALIADA:
        return 'Clínica Aliada';
      case UserRole.ADOPTANTE_VERIFICADO:
        return 'Adoptante Verificado';
      case UserRole.VETERINARIAN:
        return 'Médico Veterinario';
      default:
        return 'Ciudadano / Tutor';
    }
  }

  getPetStatusLabel(status?: string): string {
    switch (status) {
      case 'DISPONIBLE':
        return 'Disponible';
      case 'EN_PROCESO':
        return 'En proceso';
      case 'ADOPTADA':
        return 'Adoptada';
      case 'EN_SEGUIMIENTO':
        return 'En seguimiento';
      case 'NO_EN_ADOPCION':
        return 'Expediente privado';
      default:
        return status || 'Disponible';
    }
  }

  getLostTypeLabel(type?: string): string {
    switch (type) {
      case 'ANIMAL_HERIDO':
        return 'Animal herido';
      case 'EN_RESGUARDO':
        return 'En resguardo';
      case 'EN_ADOPCION':
        return 'En adopción';
      case 'CAMPANA_COMUNITARIA':
        return 'Campaña';
      case 'SE_BUSCA':
      case 'EXTRAVIADA':
        return 'Se busca';
      case 'ENCONTRADA_EN_CALLE':
        return 'Encontrada';
      default:
        return 'Reporte';
    }
  }

  getLostStatusLabel(status?: string): string {
    switch (status) {
      case 'REENCONTRADA':
        return 'Resuelta';
      case 'CERRADO':
        return 'Cerrada';
      case 'AVISTADA_RECIENTEMENTE':
        return 'Con avistamiento';
      default:
        return 'Activa';
    }
  }

  adoptionStageMeta(status?: string) {
    return getStageMeta((status || 'PENDIENTE') as AdoptionRequestStatus);
  }

  formatExactDateTime(dateStr?: string): string {
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

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
