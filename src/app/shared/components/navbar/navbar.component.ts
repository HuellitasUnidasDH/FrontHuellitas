import {
  Component,
  DestroyRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { PwaService } from '../../../core/services/pwa.service';
import { SocialNotificationService } from '../../../core/services/social-notification.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { ScrollLockService } from '../../../core/services/scroll-lock.service';
import { DirectConversation } from '../../../core/models/direct-message.model';
import {
  SocialNotification,
  SocialNotificationType,
} from '../../../core/models/social-notification.model';
import { UserRole } from '../../../core/models/user.model';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- ======================================================== -->
    <!-- Top Floating Navbar (Desktop & Mobile Header)            -->
    <!-- Sin transform/scale en <header> para no atrapar fixed    -->
    <!-- ======================================================== -->
    <header
      class="fixed top-2 sm:top-4 inset-x-0 mx-auto w-[96%] max-w-7xl z-50 transition-shadow duration-300"
    >
      <div
        class="rounded-2xl sm:rounded-3xl px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-xl transition-all duration-300 relative"
      >
        <!-- Capa Liquid Glass separada para no crear containing block sobre menús móviles -->
        <div
          class="absolute inset-0 liquid-glass rounded-2xl sm:rounded-3xl pointer-events-none -z-10"
          [ngClass]="{ 'shadow-2xl': isScrolled() }"
        ></div>

        <!-- Brand / Logo -->
        <div class="flex items-center gap-2.5 sm:gap-6 min-w-0">
          <a routerLink="/" (click)="closeAllDropdowns()" class="flex items-center gap-2.5 group flex-shrink-0">
            <div
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-slate-950 shadow-sm group-hover:scale-105 transition-transform cursor-pointer"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="4" r="2" />
                <circle cx="18" cy="8" r="2" />
                <circle cx="20" cy="16" r="2" />
                <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
              </svg>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                {{ brand.name }}
              </span>
              <span class="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 -mt-1 hidden lg:inline-block">
                {{ brand.city }}
              </span>
            </div>
          </a>

          <!-- Desktop Navigation Tabs -->
          <nav class="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <a
              routerLink="/"
              routerLinkActive="active-nav-tab"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="closeAllDropdowns()"
              class="nav-tab-item relative px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 opacity-0 transition-opacity -z-10"></span>
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8" />
                <path d="M15 18h-5" />
                <path d="M10 6h8v4h-8V6Z" />
              </svg>
              <span>Muro</span>
            </a>

            <a
              routerLink="/adopciones"
              routerLinkActive="active-nav-tab"
              (click)="closeAllDropdowns()"
              class="nav-tab-item relative px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 opacity-0 transition-opacity -z-10"></span>
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <span>Adopciones</span>
            </a>

            <a
              routerLink="/perdidas"
              routerLinkActive="active-nav-tab"
              (click)="closeAllDropdowns()"
              class="nav-tab-item relative px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 opacity-0 transition-opacity -z-10"></span>
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <span>Perdidos</span>
            </a>

            <!-- Desplegable Bonito: "Explorar ▾" -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleMoreMenu($event)"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer hover:bg-white/40 dark:hover:bg-slate-800/40"
                [ngClass]="{ 'bg-white/60 dark:bg-slate-800/60 text-emerald-600 dark:text-emerald-400': isMoreMenuOpen() }"
              >
                <span>Explorar</span>
                <svg
                  class="w-3.5 h-3.5 transition-transform duration-200"
                  [ngClass]="{ 'rotate-180': isMoreMenuOpen() }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown Menu de Más Secciones (Desktop) -->
              @if (isMoreMenuOpen()) {
                <div
                  (click)="$event.stopPropagation()"
                  class="absolute left-0 mt-2.5 w-64 bg-white/95 dark:bg-[#0d1526]/95 rounded-2xl p-2.5 shadow-2xl border border-emerald-500/30 backdrop-blur-2xl z-50 space-y-1 animate-fadeIn"
                >
                  <!-- Aliados de Dolores Hidalgo -->
                  <a
                    routerLink="/aliados"
                    routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    (click)="closeAllDropdowns()"
                    class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 2v20" />
                      <path d="M18 13H4" />
                      <path d="M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                    </svg>
                    <span>Aliados y Veterinarias</span>
                  </a>

                  <!-- Sobre Nosotros -->
                  <a
                    routerLink="/nosotros"
                    routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    (click)="closeAllDropdowns()"
                    class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    <span>Nosotros</span>
                  </a>

                  @if (!pwaService.isStandalone()) {
                    <button
                      type="button"
                      (click)="closeAllDropdowns(); pwaService.installPwa()"
                      class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      <span>Instalar App en mi dispositivo</span>
                    </button>
                  }

                  @if (authService.isAuthenticated()) {
                    <div class="my-1 border-t border-slate-200/60 dark:border-slate-800/60"></div>

                    <!-- Mensajes Directos (Huellitas Direct) -->
                    <a
                      routerLink="/mensajes"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span class="flex items-center gap-2.5">
                        <svg class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                        </svg>
                        <span>Mensajes Directos</span>
                      </span>
                      @if (dmService.totalUnreadMessages() > 0) {
                        <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                          {{ dmService.totalUnreadMessages() }}
                        </span>
                      }
                    </a>

                    <!-- Centro de Notificaciones -->
                    <a
                      routerLink="/notificaciones"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span class="flex items-center gap-2.5">
                        <svg class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                        </svg>
                        <span>Centro de Notificaciones</span>
                      </span>
                      @if (socialNotifications.unreadCount() > 0) {
                        <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                          {{ socialNotifications.unreadCount() }}
                        </span>
                      }
                    </a>

                    <!-- Gestión de Adopciones -->
                    <a
                      routerLink="/panel-rescatista"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      </svg>
                      <span>{{ isRescuerOrAdmin() ? 'Panel de Rescatista' : 'Gestionar Mis Adopciones' }}</span>
                    </a>

                    <!-- Mis Adopciones y Progreso -->
                    <a
                      routerLink="/mis-adopciones"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <svg class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span>Mis Adopciones y Progreso</span>
                    </a>

                    <!-- Verificación de Adoptante -->
                    <a
                      routerLink="/verificacion"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <svg class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      <span>Verificación de Adoptante</span>
                    </a>

                    <!-- Dashboard Clínico -->
                    <a
                      routerLink="/dashboard"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <svg class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 3v18h18" />
                        <path d="m19 9-5 5-4-4-3 3" />
                      </svg>
                      <span>Dashboard Clínico</span>
                    </a>

                    <!-- Mis Mascotas -->
                    <a
                      routerLink="/pets"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <svg class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="4" r="2" />
                        <circle cx="18" cy="8" r="2" />
                        <circle cx="20" cy="16" r="2" />
                        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
                      </svg>
                      <span>Mis Mascotas</span>
                    </a>

                    <!-- Familias / Cuidado Compartido -->
                    <a
                      routerLink="/groups"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <svg class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>Familias / Grupos</span>
                    </a>

                    @if (authService.isAdmin()) {
                      <div class="my-1 border-t border-slate-200/60 dark:border-slate-800/60"></div>
                      <!-- Admin Panel -->
                      <a
                        routerLink="/admin"
                        routerLinkActive="bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        (click)="closeAllDropdowns()"
                        class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>Panel Administrador</span>
                      </a>
                    }
                  } @else {
                    <div class="my-1 border-t border-slate-200/60 dark:border-slate-800/60"></div>
                    <!-- Quick Theme Toggle for Guests inside Explorar -->
                    <button
                      type="button"
                      (click)="themeService.toggleTheme()"
                      class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <span class="flex items-center gap-2.5">
                        <svg
                          class="w-4 h-4 shrink-0 transition-colors"
                          [ngClass]="themeService.isDarkMode() ? 'text-emerald-400' : 'text-slate-600 dark:text-slate-300'"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                        </svg>
                        <span>Modo Oscuro</span>
                      </span>
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold transition-colors"
                        [ngClass]="
                          themeService.isDarkMode()
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        "
                      >
                        {{ themeService.isDarkMode() ? 'Activo' : 'Inactivo' }}
                      </span>
                    </button>
                  }
                </div>
              }
            </div>
          </nav>
        </div>

        <!-- ======================================================== -->
        <!-- Right Section: Messages + Bell + User Avatar + Burger    -->
        <!-- ======================================================== -->
        <div class="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          
          @if (authService.isAuthenticated()) {
            <!-- ==================================================== -->
            <!-- 1. Direct Messages Pill + Floating Inbox Popover     -->
            <!-- ==================================================== -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleMessagesMenu($event)"
                class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60 shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                [ngClass]="{ 'ring-2 ring-emerald-500/50 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400': isMessagesMenuOpen() }"
                title="Mensajes Directos (Huellitas Direct)"
              >
                <svg class="w-4.5 h-4.5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>

                @if (dmService.totalUnreadMessages() > 0) {
                  <span
                    class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-md shadow-emerald-500/40 ring-2 ring-white dark:ring-slate-900"
                  >
                    {{ dmService.totalUnreadMessages() > 9 ? '9+' : dmService.totalUnreadMessages() }}
                  </span>
                }
              </button>

              <!-- Floating Popover for Direct Messages -->
              @if (isMessagesMenuOpen()) {
                <div
                  (click)="$event.stopPropagation()"
                  class="fixed left-3 right-3 top-[4.25rem] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2.5 sm:w-96 bg-white/95 dark:bg-[#0d1526]/95 rounded-3xl p-4 shadow-2xl border border-emerald-500/30 backdrop-blur-2xl z-50 space-y-3 animate-fadeIn"
                >
                  <div class="flex items-center justify-between px-1">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                      </svg>
                      <h3 class="text-sm font-black text-slate-900 dark:text-white">
                        Huellitas Direct
                      </h3>
                      @if (dmService.totalUnreadMessages() > 0) {
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                        >
                          {{ dmService.totalUnreadMessages() }} sin leer
                        </span>
                      }
                    </div>
                  </div>

                  @if (dmService.recentConversations().length === 0) {
                    <div class="py-7 text-center space-y-1.5">
                      <div class="w-10 h-10 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                        </svg>
                      </div>
                      <p class="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Sin conversaciones activas aún
                      </p>
                      <p class="text-[11px] text-slate-500">
                        Toca «Mensaje» en cualquier publicación para chatear directo.
                      </p>
                    </div>
                  } @else {
                    <div class="max-h-[52dvh] sm:max-h-72 overflow-y-auto overscroll-contain space-y-2 pr-0.5">
                      @for (conv of dmService.recentConversations(); track conv.id) {
                        <div
                          (click)="openConversationFromPopover(conv)"
                          class="p-2.5 rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer border"
                          [ngClass]="
                            conv.unreadCount > 0
                              ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15'
                              : 'bg-slate-100/70 dark:bg-slate-900/60 border-transparent hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                          "
                        >
                          <div class="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5 flex-shrink-0">
                            @if (conv.otherParticipant.profilePhotoUrl) {
                              <img
                                [src]="conv.otherParticipant.profilePhotoUrl"
                                [alt]="conv.otherParticipant.fullName"
                                class="w-full h-full object-cover rounded-[10px]"
                              />
                            } @else {
                              <div class="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-black text-emerald-600 dark:text-emerald-400">
                                {{ (conv.otherParticipant.fullName || 'H').charAt(0) }}
                              </div>
                            }
                          </div>

                          <div class="flex-1 min-w-0">
                            <p class="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {{ conv.otherParticipant.fullName }}
                            </p>
                            @if (conv.contextTitle) {
                              <p class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1">
                                <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M12 17v5" />
                                  <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                                </svg>
                                <span class="truncate">{{ conv.contextTitle }}</span>
                              </p>
                            }
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {{ conv.lastMessageText || 'Abrir conversación' }}
                            </p>
                          </div>

                          @if (conv.unreadCount > 0) {
                            <span class="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                              {{ conv.unreadCount }}
                            </span>
                          }
                        </div>
                      }
                    </div>
                  }

                  <a
                    routerLink="/mensajes"
                    (click)="closeAllDropdowns()"
                    class="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <span>Abrir bandeja completa de mensajes</span>
                    <span>→</span>
                  </a>
                </div>
              }
            </div>

            <!-- ==================================================== -->
            <!-- 2. Notification Bell Pill + Floating Activity Popover-->
            <!-- ==================================================== -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleNotifMenu($event)"
                class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60 shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                [ngClass]="{ 'ring-2 ring-emerald-500/50 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400': isNotifMenuOpen() }"
                title="Notificaciones y Actividad"
              >
                <svg class="w-4.5 h-4.5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>

                @if (socialNotifications.unreadCount() > 0) {
                  <span
                    class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-rose-500/40 ring-2 ring-white dark:ring-slate-900"
                  >
                    {{ socialNotifications.unreadCount() > 9 ? '9+' : socialNotifications.unreadCount() }}
                  </span>
                }
              </button>

              <!-- Floating Popover (Responsive: Full width on mobile, anchored right on sm+) -->
              @if (isNotifMenuOpen()) {
                <div
                  (click)="$event.stopPropagation()"
                  class="fixed left-3 right-3 top-[4.25rem] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2.5 sm:w-96 bg-white/95 dark:bg-[#0d1526]/95 rounded-3xl p-4 shadow-2xl border border-emerald-500/30 backdrop-blur-2xl z-50 space-y-3 animate-fadeIn"
                >
                  <!-- Popover Header -->
                  <div class="flex items-center justify-between px-1">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                      </svg>
                      <h3 class="text-sm font-black text-slate-900 dark:text-white">
                        Notificaciones
                      </h3>
                      @if (socialNotifications.unreadCount() > 0) {
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                        >
                          {{ socialNotifications.unreadCount() }} nuevas
                        </span>
                      }
                    </div>

                    @if (socialNotifications.unreadCount() > 0) {
                      <button
                        type="button"
                        (click)="socialNotifications.markAllAsRead().subscribe()"
                        class="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        <span>Marcar leídas</span>
                      </button>
                    }
                  </div>

                  <!-- Recent Notifications Mini-List -->
                  @if (socialNotifications.recentNotifications().length === 0) {
                    <div class="py-8 text-center space-y-1.5">
                      <div class="w-10 h-10 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                        </svg>
                      </div>
                      <p class="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Sin notificaciones pendientes
                      </p>
                      <p class="text-[11px] text-slate-500">
                        Aquí verás cuando comenten tus publicaciones o reporten avistamientos.
                      </p>
                    </div>
                  } @else {
                    <div class="max-h-[55dvh] sm:max-h-80 overflow-y-auto overscroll-contain space-y-2 pr-0.5">
                      @for (notif of socialNotifications.recentNotifications(); track notif.id) {
                        <div
                          (click)="openNotificationFromPopover(notif)"
                          class="p-3 rounded-2xl flex items-start gap-2.5 transition-all cursor-pointer border"
                          [ngClass]="
                            !notif.isRead
                              ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15'
                              : 'bg-slate-100/70 dark:bg-slate-900/60 border-transparent hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                          "
                        >
                          <!-- Actor Avatar + Mini Icon -->
                          <div class="relative flex-shrink-0">
                            <div class="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5">
                              @if (notif.actor?.profilePhotoUrl) {
                                <img
                                  [src]="notif.actor!.profilePhotoUrl"
                                  [alt]="notif.actor?.fullName || 'Usuario'"
                                  class="w-full h-full object-cover rounded-[10px]"
                                />
                              } @else {
                                <div class="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-black text-emerald-600 dark:text-emerald-400">
                                  {{ (notif.actor?.fullName || notif.actorNameFallback || 'H').charAt(0) }}
                                </div>
                              }
                            </div>
                            <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-md bg-white dark:bg-slate-900 flex items-center justify-center shadow border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                              <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                @switch (notif.type) {
                                  @case ('COMMENT_ON_POST') {
                                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                                  }
                                  @case ('COMMENT_ON_PET') {
                                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                                  }
                                  @case ('SIGHTING_REPORTED') {
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                    <circle cx="12" cy="10" r="3" />
                                  }
                                  @case ('ADOPTION_REQUEST_RECEIVED') {
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                  }
                                  @case ('ADOPTION_REQUEST_STATUS') {
                                    <path d="M20 6 9 17l-5-5" />
                                  }
                                  @case ('FOLLOWUP_PROOF_SUBMITTED') {
                                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                    <circle cx="12" cy="13" r="3" />
                                  }
                                  @default {
                                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                  }
                                }
                              </svg>
                            </span>
                          </div>

                          <!-- Text Summary -->
                          <div class="flex-1 min-w-0">
                            <p class="text-xs text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                              <strong class="font-bold">
                                {{ notif.actor?.fullName || notif.actorNameFallback || 'Ciudadano DH' }}
                              </strong>
                              {{ ' ' + notif.title }}
                            </p>
                            @if (notif.message) {
                              <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {{ notif.message }}
                              </p>
                            }
                          </div>

                          <!-- Right Thumbnail or Unread Dot -->
                          @if (notif.previewImageUrl) {
                            <img
                              [src]="notif.previewImageUrl"
                              alt=""
                              class="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-slate-200/60 dark:border-slate-700"
                            />
                          } @else if (!notif.isRead) {
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 self-center flex-shrink-0"></span>
                          }
                        </div>
                      }
                    </div>
                  }

                  <!-- Footer CTA: Dedicated Full Screen -->
                  <a
                    routerLink="/notificaciones"
                    (click)="closeAllDropdowns()"
                    class="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <span>Ver todas en pantalla completa</span>
                    <span>→</span>
                  </a>
                </div>
              }
            </div>

            <!-- User Profile Avatar Pill with Arrow -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleUserMenu($event)"
                class="flex items-center gap-2 p-1 sm:pr-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60 shadow-sm transition-all cursor-pointer group"
                [ngClass]="{ 'ring-2 ring-emerald-500/50 bg-white dark:bg-slate-800': isUserMenuOpen() }"
                title="Menú de usuario"
              >
                <!-- Avatar image or initial circle -->
                <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 p-0.5 shadow-sm flex-shrink-0">
                  @if (authService.currentUser()?.profilePhotoUrl) {
                    <img
                      [src]="authService.currentUser()!.profilePhotoUrl"
                      [alt]="authService.currentUser()!.fullName"
                      class="w-full h-full object-cover rounded-[10px]"
                    />
                  } @else {
                    <div class="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {{ (authService.currentUser()?.fullName || 'U').charAt(0) }}
                    </div>
                  }
                </div>

                <!-- User Name (Hidden on very small screens, visible on sm and up) -->
                <div class="hidden sm:flex flex-col text-left max-w-[120px]">
                  <span class="text-xs font-bold text-slate-800 dark:text-white truncate leading-tight">
                    {{ getFirstName(authService.currentUser()?.fullName) }}
                  </span>
                  <span class="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
                    {{ getRoleBadge(authService.currentUser()?.role) }}
                  </span>
                </div>

                <!-- Sleek arrow -->
                <svg
                  class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 group-hover:text-emerald-500"
                  [ngClass]="{ 'rotate-180': isUserMenuOpen() }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- User Dropdown Menu Card (Responsive on mobile & desktop) -->
              @if (isUserMenuOpen()) {
                <div
                  (click)="$event.stopPropagation()"
                  class="fixed left-3 right-3 top-[4.25rem] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2.5 sm:w-68 bg-white/95 dark:bg-[#0d1526]/95 rounded-3xl sm:rounded-2xl p-3 shadow-2xl border border-emerald-500/30 backdrop-blur-2xl z-50 space-y-1.5 animate-fadeIn max-h-[75dvh] overflow-y-auto"
                >
                  <!-- Header: User Info -->
                  <div class="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                    <p class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {{ authService.currentUser()?.fullName }}
                    </p>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {{ authService.currentUser()?.email }}
                    </p>
                    <div class="mt-1.5 flex items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        {{ getRoleBadge(authService.currentUser()?.role) }}
                      </span>
                    </div>
                  </div>

                  <!-- Option: Mi Perfil -->
                  <a
                    routerLink="/perfil"
                    (click)="closeAllDropdowns()"
                    class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <svg class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Mi Perfil</span>
                  </a>

                  <!-- Option: Mis Mensajes Directos -->
                  <a
                    routerLink="/mensajes"
                    (click)="closeAllDropdowns()"
                    class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="flex items-center gap-3">
                      <svg class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                      </svg>
                      <span>Mensajes Directos</span>
                    </span>
                    @if (dmService.totalUnreadMessages() > 0) {
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                        {{ dmService.totalUnreadMessages() }}
                      </span>
                    }
                  </a>

                  <!-- Option: Mis Notificaciones -->
                  <a
                    routerLink="/notificaciones"
                    (click)="closeAllDropdowns()"
                    class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="flex items-center gap-3">
                      <svg class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                      </svg>
                      <span>Mis Notificaciones</span>
                    </span>
                    @if (socialNotifications.unreadCount() > 0) {
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                        {{ socialNotifications.unreadCount() }}
                      </span>
                    }
                  </a>

                  <div class="border-t border-slate-200/60 dark:border-slate-800/60"></div>

                  <!-- Option: Dark Mode Toggle -->
                  <button
                    type="button"
                    (click)="themeService.toggleTheme()"
                    class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <span class="flex items-center gap-3">
                      <svg
                        class="w-4 h-4 shrink-0 transition-colors"
                        [ngClass]="themeService.isDarkMode() ? 'text-emerald-400' : 'text-slate-600 dark:text-slate-300'"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                      <span>Modo Oscuro</span>
                    </span>
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold transition-colors"
                      [ngClass]="
                        themeService.isDarkMode()
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      "
                    >
                      {{ themeService.isDarkMode() ? 'Activo' : 'Inactivo' }}
                    </span>
                  </button>

                  <div class="border-t border-slate-200/60 dark:border-slate-800/60"></div>

                  <!-- Option: Cerrar Sesión -->
                  <button
                    type="button"
                    (click)="logoutAndClose()"
                    class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              }
            </div>
          } @else {
            <!-- Guest: Iniciar Sesión & Registro -->
            <div class="hidden sm:flex items-center gap-2">
              <a
                routerLink="/auth/login"
                class="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                Ingresar
              </a>
              <a
                routerLink="/auth/register"
                class="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 shadow-sm transition-colors cursor-pointer"
              >
                Registrarme
              </a>
            </div>
          }

          <!-- Mobile Hamburger / Drawer Toggle Button (Visible only on mobile) -->
          <button
            (click)="toggleMobileMenu($event)"
            type="button"
            class="md:hidden w-9 h-9 rounded-xl bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-300/70 dark:border-slate-700/70 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
            [ngClass]="{ 'ring-2 ring-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400': isMobileMenuOpen() }"
            [attr.aria-expanded]="isMobileMenuOpen()"
            aria-label="Abrir menú de navegación"
          >
            @if (isMobileMenuOpen()) {
              <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            } @else {
              <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            }
          </button>
        </div>
      </div>
    </header>

    <!-- ======================================================== -->
    <!-- Mobile Full-Viewport Navigation Drawer (Outside <header>)-->
    <!-- ======================================================== -->
    @if (isMobileMenuOpen()) {
      <div
        class="md:hidden fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-md flex flex-col pt-[4.5rem] pb-24 px-3 animate-fadeIn overscroll-contain"
        (click)="closeMobileMenu()"
      >
        <div
          class="w-full max-w-lg mx-auto bg-white/95 dark:bg-[#0b1324]/95 rounded-3xl p-4 sm:p-5 shadow-2xl border border-emerald-500/35 flex flex-col max-h-[calc(100dvh-6.5rem)] overflow-hidden overscroll-contain"
          (click)="$event.stopPropagation()"
        >
          <!-- Top Fixed Header inside Drawer: User Status -->
          @if (authService.isAuthenticated()) {
            <div class="flex items-center justify-between gap-2 pb-3.5 mb-2 border-b border-slate-200/80 dark:border-slate-800/80 flex-shrink-0">
              <a
                routerLink="/perfil"
                (click)="closeMobileMenu()"
                class="flex items-center gap-3 min-w-0 group"
              >
                <div class="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md flex-shrink-0">
                  @if (authService.currentUser()?.profilePhotoUrl) {
                    <img
                      [src]="authService.currentUser()!.profilePhotoUrl"
                      [alt]="authService.currentUser()!.fullName"
                      class="w-full h-full object-cover rounded-[14px]"
                    />
                  } @else {
                    <div class="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-base">
                      {{ authService.currentUser()?.fullName?.charAt(0) }}
                    </div>
                  }
                </div>
                <div class="min-w-0">
                  <h4 class="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors truncate">
                    {{ authService.currentUser()?.fullName }}
                  </h4>
                  <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                    {{ getRoleBadge(authService.currentUser()?.role) }} • Ver mi perfil →
                  </span>
                </div>
              </a>

              <button
                type="button"
                (click)="authService.logout(); closeMobileMenu()"
                class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-extrabold flex-shrink-0 cursor-pointer"
                title="Cerrar sesión"
              >
                <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
                <span>Salir</span>
              </button>
            </div>
          } @else {
            <div class="grid grid-cols-2 gap-2.5 pb-3.5 mb-2 border-b border-slate-200/80 dark:border-slate-800/80 flex-shrink-0">
              <a
                routerLink="/auth/login"
                (click)="closeMobileMenu()"
                class="py-2.5 px-3 text-center text-xs sm:text-sm font-extrabold rounded-xl bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                Iniciar Sesión
              </a>
              <a
                routerLink="/auth/register"
                (click)="closeMobileMenu()"
                class="py-2.5 px-3 text-center text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md"
              >
                Registrarme
              </a>
            </div>
          }

          <!-- Scrollable Navigation Links List -->
          <div class="flex-1 overflow-y-auto overscroll-contain space-y-1 pr-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pt-1">
              Secciones Principales
            </span>

            <a
              routerLink="/"
              routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
            >
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M10 6h8v4h-8V6Z" />
              </svg>
              <span>Muro Comunitario</span>
            </a>

            <a
              routerLink="/adopciones"
              routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
            >
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <span>Peluditos en Adopción</span>
            </a>

            <a
              routerLink="/perdidas"
              routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
            >
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <span>Mascotas Extraviadas / Encontradas</span>
            </a>

            <a
              routerLink="/aliados"
              routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
            >
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 2v20" />
                <path d="M18 13H4" />
              </svg>
              <span>Directorio de Aliados (Dolores Hidalgo)</span>
            </a>

            <a
              routerLink="/nosotros"
              routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
            >
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <span>Sobre Nosotros</span>
            </a>

            @if (authService.isAuthenticated()) {
              <div class="pt-2.5 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1">
                <span class="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3">
                  Mi Cuenta y Servicios
                </span>

                <a
                  routerLink="/mensajes"
                  routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  (click)="closeMobileMenu()"
                  class="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-emerald-700 dark:text-emerald-400"
                >
                  <span class="flex items-center gap-3">
                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    </svg>
                    <span>Mensajes Directos (Huellitas Direct)</span>
                  </span>
                  @if (dmService.totalUnreadMessages() > 0) {
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500 text-slate-950">
                      {{ dmService.totalUnreadMessages() }}
                    </span>
                  }
                </a>

                <a
                  routerLink="/notificaciones"
                  routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  (click)="closeMobileMenu()"
                  class="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-emerald-700 dark:text-emerald-400"
                >
                  <span class="flex items-center gap-3">
                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    <span>Centro de Notificaciones</span>
                  </span>
                  @if (socialNotifications.unreadCount() > 0) {
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white">
                      {{ socialNotifications.unreadCount() }} nuevas
                    </span>
                  }
                </a>

                <a
                  routerLink="/perfil"
                  routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Mi Perfil</span>
                </a>

                <a
                  routerLink="/mis-adopciones"
                  routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Mis Adopciones y Progreso</span>
                </a>

                <a
                  routerLink="/verificacion"
                  routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>Verificación de Adoptante</span>
                </a>

                <a
                  routerLink="/panel-rescatista"
                  routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-emerald-700 dark:text-emerald-400 font-bold"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  </svg>
                  <span>{{ isRescuerOrAdmin() ? 'Panel de Rescatista (Seguimiento)' : 'Gestionar Mis Adopciones' }}</span>
                </a>

                <a
                  routerLink="/dashboard"
                  routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                  <span>Dashboard Clínico</span>
                </a>

                <a
                  routerLink="/pets"
                  routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="4" r="2" />
                    <circle cx="18" cy="8" r="2" />
                    <circle cx="20" cy="16" r="2" />
                    <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
                  </svg>
                  <span>Mis Mascotas</span>
                </a>

                <a
                  routerLink="/groups"
                  routerLinkActive="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Familias / Grupos</span>
                </a>

                @if (authService.isAdmin()) {
                  <a
                    routerLink="/admin"
                    routerLinkActive="bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    (click)="closeMobileMenu()"
                    class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors font-bold"
                  >
                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Panel Administrador</span>
                  </a>
                }
              </div>
            }

            @if (!pwaService.isStandalone()) {
              <div class="pt-2.5 mt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                <button
                  type="button"
                  (click)="closeMobileMenu(); pwaService.installPwa()"
                  class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 font-bold transition-colors cursor-pointer"
                >
                  <span class="flex items-center gap-3">
                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    <span>Instalar App Huellitas</span>
                  </span>
                  <span class="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950">
                    Gratis
                  </span>
                </button>
              </div>
            }

            <!-- Theme Toggle in Mobile Drawer -->
            <div class="pt-2.5 mt-2 border-t border-slate-200/80 dark:border-slate-800/80">
              <button
                type="button"
                (click)="themeService.toggleTheme()"
                class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
              >
                <span class="flex items-center gap-3">
                  <svg
                    class="w-4 h-4 shrink-0 transition-colors"
                    [ngClass]="themeService.isDarkMode() ? 'text-emerald-400' : 'text-slate-600 dark:text-slate-300'"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                  <span>Modo Oscuro</span>
                </span>
                <span
                  class="px-2.5 py-0.5 rounded-full text-[11px] uppercase font-bold transition-colors"
                  [ngClass]="
                    themeService.isDarkMode()
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  "
                >
                  {{ themeService.isDarkMode() ? 'Activo' : 'Inactivo' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Drawer Footer -->
          <div class="pt-3 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
            <span class="font-semibold">{{ brand.name }} • {{ brand.city }}</span>
            <button
              type="button"
              (click)="closeMobileMenu()"
              class="px-4 py-2 rounded-xl bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-white font-extrabold cursor-pointer"
            >
              Cerrar menú
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ======================================================== -->
    <!-- Mobile Bottom Navigation Dock (Native App Style)         -->
    <!-- ======================================================== -->
    <nav
      aria-label="Navegación móvil"
      class="md:hidden fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] inset-x-2.5 sm:inset-x-3 z-50 liquid-glass rounded-2xl p-1 gap-0.5 flex items-center justify-around shadow-2xl border border-white/40 dark:border-white/10 backdrop-blur-xl"
    >
      <!-- Muro (Public) -->
      <a
        routerLink="/"
        routerLinkActive="mobile-dock-active"
        [routerLinkActiveOptions]="{ exact: true }"
        (click)="closeAllDropdowns()"
        class="flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1 min-w-0"
      >
        <svg class="w-4 h-4 group-[.mobile-dock-active]:text-emerald-600 dark:group-[.mobile-dock-active]:text-emerald-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M10 6h8v4h-8V6Z" />
          <path d="M18 14h-8" />
        </svg>
        <span class="text-[10px] font-semibold mt-0.5 truncate">Muro</span>
      </a>

      <!-- Adopciones (Public) -->
      <a
        routerLink="/adopciones"
        routerLinkActive="mobile-dock-active"
        (click)="closeAllDropdowns()"
        class="flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1 min-w-0"
      >
        <svg class="w-4 h-4 group-[.mobile-dock-active]:text-emerald-600 dark:group-[.mobile-dock-active]:text-emerald-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        <span class="text-[10px] font-semibold mt-0.5 truncate">Adoptar</span>
      </a>

      @if (authService.isAuthenticated()) {
        <!-- Mensajes Directos -->
        <a
          routerLink="/mensajes"
          routerLinkActive="mobile-dock-active"
          (click)="closeAllDropdowns()"
          class="relative flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1 min-w-0"
        >
          <svg class="w-4 h-4 group-[.mobile-dock-active]:text-emerald-600 dark:group-[.mobile-dock-active]:text-emerald-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
          <span class="text-[10px] font-semibold mt-0.5 truncate">Mensajes</span>
          @if (dmService.totalUnreadMessages() > 0) {
            <span class="absolute top-1 right-3 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
          }
        </a>

        <!-- Alertas / Notificaciones -->
        <a
          routerLink="/notificaciones"
          routerLinkActive="mobile-dock-active"
          (click)="closeAllDropdowns()"
          class="relative flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1 min-w-0"
        >
          <svg class="w-4 h-4 group-[.mobile-dock-active]:text-emerald-600 dark:group-[.mobile-dock-active]:text-emerald-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span class="text-[10px] font-semibold mt-0.5 truncate">Alertas</span>
          @if (socialNotifications.unreadCount() > 0) {
            <span class="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
          }
        </a>

        <!-- Menú Completo en Dock Móvil -->
        <button
          type="button"
          (click)="toggleMobileMenu($event)"
          [ngClass]="{ 'mobile-dock-active': isMobileMenuOpen() }"
          [attr.aria-expanded]="isMobileMenuOpen()"
          aria-label="Opciones del menú"
          class="flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1 min-w-0 cursor-pointer"
        >
          <svg class="w-4 h-4 group-[.mobile-dock-active]:text-emerald-600 dark:group-[.mobile-dock-active]:text-emerald-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
          <span class="text-[10px] font-semibold mt-0.5 truncate">Menú</span>
        </button>
      } @else {
        <!-- Perdidos (Public) -->
        <a
          routerLink="/perdidas"
          routerLinkActive="mobile-dock-active"
          (click)="closeAllDropdowns()"
          class="flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1 min-w-0"
        >
          <svg class="w-4 h-4 group-[.mobile-dock-active]:text-emerald-600 dark:group-[.mobile-dock-active]:text-emerald-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <span class="text-[10px] font-semibold mt-0.5 truncate">Perdidos</span>
        </a>

        <!-- Ingresar (Guest) -->
        <a
          routerLink="/auth/login"
          routerLinkActive="mobile-dock-active"
          (click)="closeAllDropdowns()"
          class="flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1 min-w-0"
        >
          <svg class="w-4 h-4 group-[.mobile-dock-active]:text-emerald-600 dark:group-[.mobile-dock-active]:text-emerald-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span class="text-[10px] font-semibold mt-0.5 truncate">Entrar</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    :host {
      display: block;
    }

    .active-nav-tab {
      color: #059669 !important;
    }

    :host-context(.dark) .active-nav-tab {
      color: #34d399 !important;
    }

    .active-nav-tab .tab-indicator {
      opacity: 1 !important;
    }

    .active-nav-tab-admin {
      color: #e11d48 !important;
    }

    :host-context(.dark) .active-nav-tab-admin {
      color: #fb7185 !important;
    }

    .active-nav-tab-admin .tab-indicator {
      opacity: 1 !important;
    }

    /* Mobile Bottom Dock Active States */
    .mobile-dock-active {
      color: #059669 !important;
      background: rgba(16, 185, 129, 0.12);
    }

    :host-context(.dark) .mobile-dock-active {
      color: #34d399 !important;
      background: rgba(16, 185, 129, 0.18);
    }

    .mobile-dock-active-admin {
      color: #e11d48 !important;
      background: rgba(225, 29, 72, 0.12);
    }

    :host-context(.dark) .mobile-dock-active-admin {
      color: #fb7185 !important;
      background: rgba(225, 29, 72, 0.18);
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.15s ease-out forwards;
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  pwaService = inject(PwaService);
  socialNotifications = inject(SocialNotificationService);
  dmService = inject(DirectMessageService);
  private scrollLock = inject(ScrollLockService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  brand = BRAND_CONFIG;

  constructor() {
    effect(() => {
      this.scrollLock.setLocked('navbar-drawer', this.isMobileMenuOpen(), 'drawer');
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeAllDropdowns();
      });
  }

  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  isMoreMenuOpen = signal(false);
  isUserMenuOpen = signal(false);
  isNotifMenuOpen = signal(false);
  isMessagesMenuOpen = signal(false);

  isRescuerOrAdmin = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === UserRole.RESCATISTA_VERIFICADO || role === UserRole.ALBERGUE || role === UserRole.ADMIN;
  });

  toggleMoreMenu(event: Event): void {
    event.stopPropagation();
    this.isUserMenuOpen.set(false);
    this.isNotifMenuOpen.set(false);
    this.isMessagesMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    this.isMoreMenuOpen.update((v) => !v);
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.isMoreMenuOpen.set(false);
    this.isNotifMenuOpen.set(false);
    this.isMessagesMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    this.isUserMenuOpen.update((v) => !v);
  }

  toggleMessagesMenu(event: Event): void {
    event.stopPropagation();
    this.isMoreMenuOpen.set(false);
    this.isUserMenuOpen.set(false);
    this.isNotifMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    const nextState = !this.isMessagesMenuOpen();
    this.isMessagesMenuOpen.set(nextState);
    if (nextState) {
      this.dmService.loadConversations().subscribe();
    }
  }

  toggleNotifMenu(event: Event): void {
    event.stopPropagation();
    this.isMoreMenuOpen.set(false);
    this.isUserMenuOpen.set(false);
    this.isMessagesMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    const nextState = !this.isNotifMenuOpen();
    this.isNotifMenuOpen.set(nextState);
    if (nextState) {
      this.socialNotifications.loadNotifications().subscribe();
    }
  }

  openConversationFromPopover(conv: DirectConversation): void {
    this.dmService.activeConversation.set(conv);
    this.closeAllDropdowns();
    this.router.navigate(['/mensajes'], { queryParams: { convId: conv.id } });
  }

  openNotificationFromPopover(notif: SocialNotification): void {
    if (!notif.isRead) {
      this.socialNotifications.markAsRead(notif.id).subscribe();
    }
    this.closeAllDropdowns();
    let targetUrl = notif.targetUrl || '/notificaciones';
    if (notif.entityId) {
      if (
        notif.type === SocialNotificationType.COMMENT_ON_POST ||
        notif.type === SocialNotificationType.SIGHTING_REPORTED ||
        notif.targetUrl === '/perdidas'
      ) {
        targetUrl = `/publicacion/lost-${notif.entityId}`;
      } else if (notif.type === SocialNotificationType.COMMENT_ON_PET) {
        targetUrl = `/adopciones/${notif.entityId}`;
      }
    }
    this.router.navigateByUrl(targetUrl);
  }

  getNotifIcon(type: SocialNotificationType): string {
    switch (type) {
      case SocialNotificationType.COMMENT_ON_POST:
      case SocialNotificationType.COMMENT_ON_PET:
        return 'Comentario';
      case SocialNotificationType.SIGHTING_REPORTED:
        return 'Alerta';
      case SocialNotificationType.ADOPTION_REQUEST_RECEIVED:
        return 'Adopción';
      case SocialNotificationType.ADOPTION_REQUEST_STATUS:
        return 'Actualización';
      case SocialNotificationType.FOLLOWUP_PROOF_SUBMITTED:
        return 'Seguimiento';
      case SocialNotificationType.GROUP_ACTIVITY:
        return 'Comunidad';
      default:
        return 'Aviso';
    }
  }

  closeAllDropdowns(): void {
    this.isMoreMenuOpen.set(false);
    this.isUserMenuOpen.set(false);
    this.isNotifMenuOpen.set(false);
    this.isMessagesMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
  }

  logoutAndClose(): void {
    this.closeAllDropdowns();
    this.authService.logout();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeAllDropdowns();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeAllDropdowns();
  }

  toggleMobileMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isMoreMenuOpen.set(false);
    this.isUserMenuOpen.set(false);
    this.isNotifMenuOpen.set(false);
    this.isMessagesMenuOpen.set(false);
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.isScrolled.set(window.scrollY > 20);
    }
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isScrolled.set(window.scrollY > 20);
    }
    this.dmService.startPolling(15000);
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock('navbar-drawer', 'drawer');
  }

  getFirstName(fullName?: string): string {
    if (!fullName) return 'Usuario';
    return fullName.trim().split(' ')[0];
  }

  getRoleBadge(role?: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.RESCATISTA_VERIFICADO:
        return 'Rescatista';
      case UserRole.ALBERGUE:
        return 'Albergue';
      case UserRole.CLINICA_ALIADA:
      case UserRole.VETERINARIAN:
        return 'Clínica Aliada';
      case UserRole.ADOPTANTE_VERIFICADO:
        return 'Adoptante Verificado';
      case UserRole.USUARIO_GENERAL:
      case UserRole.PET_OWNER:
      default:
        return 'Ciudadano';
    }
  }
}
