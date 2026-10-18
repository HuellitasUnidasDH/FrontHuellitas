import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { UserRole } from '../../../core/models/user.model';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- ======================================================== -->
    <!-- Top Floating Navbar (Desktop & Mobile Header)            -->
    <!-- ======================================================== -->
    <header
      class="fixed top-2.5 sm:top-4 inset-x-0 mx-auto w-[96%] max-w-7xl z-40 transition-all duration-300"
      [ngClass]="{
        'scale-[0.99]': isScrolled(),
        'scale-100': !isScrolled()
      }"
    >
      <div
        class="liquid-glass rounded-2xl sm:rounded-3xl px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-xl transition-all duration-300 relative"
      >
        <!-- Brand / Logo -->
        <div class="flex items-center gap-3 sm:gap-6 min-w-0">
          <a routerLink="/" (click)="closeAllDropdowns()" class="flex items-center gap-2 group flex-shrink-0">
            <div
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform cursor-pointer text-lg"
            >
              🐾
            </div>
            <div class="flex flex-col">
              <span
                class="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-700 dark:from-white dark:via-emerald-200 dark:to-teal-300 bg-clip-text text-transparent"
              >
                {{ brand.name }}
              </span>
              <span class="text-[9px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 -mt-1 hidden lg:inline-block">
                {{ brand.city }}
              </span>
            </div>
          </a>

          <!-- ==================================================== -->
          <!-- Desktop Navigation Tabs: ONLY 3 Primordial Sections  -->
          <!-- + Elegant "Más secciones ▾" Dropdown Menu            -->
          <!-- ==================================================== -->
          <nav class="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-950/40 border border-slate-300/40 dark:border-slate-800/60 backdrop-blur-md">
            
            <!-- 1. Muro Comunitario (Primordial) -->
            <a
              routerLink="/"
              routerLinkActive="active-nav-tab"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="closeAllDropdowns()"
              class="nav-tab-item relative px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
              <span>📰</span>
              <span>Muro</span>
            </a>

            <!-- 2. Adopciones (Primordial) -->
            <a
              routerLink="/adopciones"
              routerLinkActive="active-nav-tab"
              (click)="closeAllDropdowns()"
              class="nav-tab-item relative px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
              <span>🏠</span>
              <span>Adopciones</span>
            </a>

            <!-- 3. Perdidos / Alertas (Primordial) -->
            <a
              routerLink="/perdidas"
              routerLinkActive="active-nav-tab"
              (click)="closeAllDropdowns()"
              class="nav-tab-item relative px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
              <span>🚨</span>
              <span>Perdidos</span>
            </a>

            <!-- Desplegable Bonito: "Más secciones ▾" -->
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

              <!-- Dropdown Menu de Más Secciones -->
              @if (isMoreMenuOpen()) {
                <div
                  (click)="$event.stopPropagation()"
                  class="absolute left-0 mt-2.5 w-60 liquid-glass rounded-2xl p-2 shadow-2xl border border-emerald-500/30 backdrop-blur-2xl z-50 space-y-1 animate-fadeIn"
                >
                  <!-- Aliados de Dolores Hidalgo -->
                  <a
                    routerLink="/aliados"
                    routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    (click)="closeAllDropdowns()"
                    class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="text-sm">🩺</span>
                    <span>Aliados y Veterinarias</span>
                  </a>

                  @if (authService.isAuthenticated()) {
                    <div class="my-1 border-t border-slate-200/60 dark:border-slate-800/60"></div>

                    <!-- Panel de Rescatista (Sólo visible para Rescatistas y Admins) -->
                    @if (isRescuerOrAdmin()) {
                      <a
                        routerLink="/panel-rescatista"
                        routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        (click)="closeAllDropdowns()"
                        class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <span class="text-sm">📋</span>
                        <span>Panel de Rescatista</span>
                      </a>
                    }

                    <!-- Verificación de Adoptante -->
                    <a
                      routerLink="/verificacion"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span class="text-sm">🛡️</span>
                      <span>Verificación de Adoptante</span>
                    </a>

                    <!-- Dashboard Clínico -->
                    <a
                      routerLink="/dashboard"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span class="text-sm">📊</span>
                      <span>Dashboard Clínico</span>
                    </a>

                    <!-- Mis Mascotas -->
                    <a
                      routerLink="/pets"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span class="text-sm">🐾</span>
                      <span>Mis Mascotas</span>
                    </a>

                    <!-- Familias / Cuidado Compartido -->
                    <a
                      routerLink="/groups"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span class="text-sm">👨‍👩‍👧‍👦</span>
                      <span>Familias / Grupos</span>
                    </a>

                    @if (authService.isAdmin()) {
                      <div class="my-1 border-t border-slate-200/60 dark:border-slate-800/60"></div>
                      <!-- Admin Panel -->
                      <a
                        routerLink="/admin"
                        routerLinkActive="bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        (click)="closeAllDropdowns()"
                        class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <span class="text-sm">🛡️</span>
                        <span>Panel Administrador</span>
                      </a>
                    }
                  } @else {
                    <div class="my-1 border-t border-slate-200/60 dark:border-slate-800/60"></div>
                    <!-- Quick Theme Toggle for Guests inside Explorar -->
                    <button
                      type="button"
                      (click)="themeService.toggleTheme()"
                      class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <span class="flex items-center gap-2.5">
                        <span>{{ themeService.isDarkMode() ? '☀️' : '🌙' }}</span>
                        <span>{{ themeService.isDarkMode() ? 'Modo Claro' : 'Modo Oscuro' }}</span>
                      </span>
                    </button>
                  }
                </div>
              }
            </div>
          </nav>
        </div>

        <!-- ======================================================== -->
        <!-- Right Section: Clean User Avatar Dropdown (or Login)     -->
        <!-- NO crowded buttons! Theme toggle & logout inside menu.   -->
        <!-- ======================================================== -->
        <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          @if (authService.isAuthenticated()) {
            <!-- User Profile Avatar Pill with Arrow -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleUserMenu($event)"
                class="flex items-center gap-2 p-1 sm:pr-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/50 shadow-sm transition-all cursor-pointer group"
                [ngClass]="{ 'ring-2 ring-emerald-500/40 bg-white/80 dark:bg-slate-800/80': isUserMenuOpen() }"
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

              <!-- User Dropdown Menu Card -->
              @if (isUserMenuOpen()) {
                <div
                  (click)="$event.stopPropagation()"
                  class="absolute right-0 mt-2.5 w-64 liquid-glass rounded-2xl p-2.5 shadow-2xl border border-emerald-500/30 backdrop-blur-2xl z-50 space-y-1.5 animate-fadeIn"
                >
                  <!-- Header: User Info -->
                  <div class="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                    <p class="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {{ authService.currentUser()?.fullName }}
                    </p>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {{ authService.currentUser()?.email }}
                    </p>
                    <div class="mt-1 flex items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        {{ getRoleBadge(authService.currentUser()?.role) }}
                      </span>
                    </div>
                  </div>

                  <!-- Option: Mi Perfil -->
                  <a
                    routerLink="/perfil"
                    (click)="closeAllDropdowns()"
                    class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="text-sm">👤</span>
                    <span>Mi Perfil y Datos</span>
                  </a>

                  <!-- Option: Mis Publicaciones -->
                  <a
                    routerLink="/perfil"
                    [queryParams]="{ tab: 'publications' }"
                    (click)="closeAllDropdowns()"
                    class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="text-sm">📝</span>
                    <span>Mis Publicaciones</span>
                  </a>

                  <div class="border-t border-slate-200/60 dark:border-slate-800/60"></div>

                  <!-- Option: Dark / Light Mode Switch (Hidden from main bar as requested!) -->
                  <button
                    type="button"
                    (click)="themeService.toggleTheme()"
                    class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <span class="flex items-center gap-2.5">
                      <span>{{ themeService.isDarkMode() ? '☀️' : '🌙' }}</span>
                      <span>{{ themeService.isDarkMode() ? 'Modo Claro' : 'Modo Oscuro' }}</span>
                    </span>
                    <span class="text-[10px] uppercase font-bold text-slate-400">
                      {{ themeService.isDarkMode() ? 'Activo' : 'Inactivo' }}
                    </span>
                  </button>

                  <div class="border-t border-slate-200/60 dark:border-slate-800/60"></div>

                  <!-- Option: Cerrar Sesión (Hidden from main bar as requested!) -->
                  <button
                    type="button"
                    (click)="logoutAndClose()"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <span>🚪</span>
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
                class="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
              >
                Registrarme
              </a>
            </div>
          }

          <!-- Mobile Hamburger / Drawer Toggle Button (Visible only on mobile) -->
          <button
            (click)="toggleMobileMenu()"
            type="button"
            class="md:hidden w-9 h-9 rounded-xl bg-white/60 dark:bg-slate-900/60 hover:bg-white/80 dark:hover:bg-slate-800 border border-slate-300/60 dark:border-slate-700/60 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm text-base"
            aria-label="Abrir menú"
          >
            @if (isMobileMenuOpen()) {
              <span>✕</span>
            } @else {
              <span>☰</span>
            }
          </button>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- Mobile Sliding Navigation Drawer                         -->
      <!-- ======================================================== -->
      @if (isMobileMenuOpen()) {
        <div
          class="md:hidden fixed inset-0 top-16 z-50 bg-slate-950/70 backdrop-blur-md flex flex-col p-4 animate-fadeIn"
          (click)="closeMobileMenu()"
        >
          <div
            class="liquid-glass rounded-3xl p-5 shadow-2xl border border-emerald-500/30 space-y-4 max-h-[80vh] overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <!-- User Status in Drawer -->
            @if (authService.isAuthenticated()) {
              <div class="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                <a
                  routerLink="/perfil"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-2.5 group"
                >
                  <div class="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md">
                    @if (authService.currentUser()?.profilePhotoUrl) {
                      <img
                        [src]="authService.currentUser()!.profilePhotoUrl"
                        [alt]="authService.currentUser()!.fullName"
                        class="w-full h-full object-cover rounded-[10px]"
                      />
                    } @else {
                      <div class="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        {{ authService.currentUser()?.fullName?.charAt(0) }}
                      </div>
                    }
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                      {{ authService.currentUser()?.fullName }}
                    </h4>
                    <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {{ getRoleBadge(authService.currentUser()?.role) }} • Ver perfil →
                    </span>
                  </div>
                </a>

                <button
                  (click)="authService.logout(); closeMobileMenu()"
                  class="p-2 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold"
                  title="Salir"
                >
                  🚪 Salir
                </button>
              </div>
            } @else {
              <div class="flex gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                <a
                  routerLink="/auth/login"
                  (click)="closeMobileMenu()"
                  class="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-white"
                >
                  Iniciar Sesión
                </a>
                <a
                  routerLink="/auth/register"
                  (click)="closeMobileMenu()"
                  class="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md"
                >
                  Registrarme
                </a>
              </div>
            }

            <!-- Navigation Links List -->
            <div class="space-y-1 text-xs font-bold text-slate-700 dark:text-slate-200">
              <a
                routerLink="/"
                (click)="closeMobileMenu()"
                class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span class="text-base">📰</span>
                <span>Muro Comunitario</span>
              </a>

              <a
                routerLink="/adopciones"
                (click)="closeMobileMenu()"
                class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span class="text-base">🏠</span>
                <span>Peluditos en Adopción</span>
              </a>

              <a
                routerLink="/perdidas"
                (click)="closeMobileMenu()"
                class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span class="text-base">🚨</span>
                <span>Mascotas Extraviadas / Encontradas</span>
              </a>

              <a
                routerLink="/aliados"
                (click)="closeMobileMenu()"
                class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span class="text-base">🩺</span>
                <span>Directorio de Aliados (Dolores Hidalgo)</span>
              </a>

              @if (authService.isAuthenticated()) {
                <div class="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2.5">
                    Mi Cuenta y Servicios
                  </span>

                  <a
                    routerLink="/perfil"
                    (click)="closeMobileMenu()"
                    class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors text-emerald-600 dark:text-emerald-400"
                  >
                    <span class="text-base">👤</span>
                    <span>Mi Perfil y Publicaciones</span>
                  </a>

                  <a
                    routerLink="/verificacion"
                    (click)="closeMobileMenu()"
                    class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="text-base">🛡️</span>
                    <span>Verificación de Adoptante</span>
                  </a>

                  @if (isRescuerOrAdmin()) {
                    <a
                      routerLink="/panel-rescatista"
                      (click)="closeMobileMenu()"
                      class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors text-emerald-700 dark:text-emerald-400 font-semibold"
                    >
                      <span class="text-base">📋</span>
                      <span>Panel de Rescatista (Seguimiento 7, 30, 90)</span>
                    </a>
                  }

                  <a
                    routerLink="/dashboard"
                    (click)="closeMobileMenu()"
                    class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="text-base">📊</span>
                    <span>Dashboard Clínico</span>
                  </a>

                  <a
                    routerLink="/pets"
                    (click)="closeMobileMenu()"
                    class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="text-base">🐾</span>
                    <span>Mis Mascotas</span>
                  </a>

                  <a
                    routerLink="/groups"
                    (click)="closeMobileMenu()"
                    class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="text-base">👨‍👩‍👧‍👦</span>
                    <span>Familias / Grupos</span>
                  </a>

                  @if (authService.isAdmin()) {
                    <a
                      routerLink="/admin"
                      (click)="closeMobileMenu()"
                      class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors"
                    >
                      <span class="text-base">🛡️</span>
                      <span>Panel Administrador</span>
                    </a>
                  }
                </div>
              }

              <!-- Theme Toggle in Mobile Drawer -->
              <div class="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <button
                  type="button"
                  (click)="themeService.toggleTheme()"
                  class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span class="flex items-center gap-3">
                    <span class="text-base">{{ themeService.isDarkMode() ? '☀️' : '🌙' }}</span>
                    <span>{{ themeService.isDarkMode() ? 'Modo Claro' : 'Modo Oscuro' }}</span>
                  </span>
                  <span class="text-[10px] uppercase font-bold text-slate-400">
                    Cambiar
                  </span>
                </button>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
              <span>{{ brand.name }} • {{ brand.city }}</span>
              <button
                (click)="closeMobileMenu()"
                class="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }
    </header>

    <!-- ======================================================== -->
    <!-- Mobile Bottom Navigation Dock (Native App Style)         -->
    <!-- Visible ONLY on mobile (< md), thumb-friendly, sleek     -->
    <!-- ======================================================== -->
    <nav
      class="md:hidden fixed bottom-3 inset-x-3 z-50 liquid-glass rounded-2xl p-1.5 flex items-center justify-around shadow-2xl border border-white/40 dark:border-white/10 backdrop-blur-xl"
    >
      <!-- Muro (Public) -->
      <a
        routerLink="/"
        routerLinkActive="mobile-dock-active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
      >
        <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">📰</span>
        <span class="text-[10px] font-bold mt-0.5">Muro</span>
      </a>

      <!-- Adopciones (Public) -->
      <a
        routerLink="/adopciones"
        routerLinkActive="mobile-dock-active"
        class="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
      >
        <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">🏠</span>
        <span class="text-[10px] font-bold mt-0.5">Adoptar</span>
      </a>

      <!-- Perdidos (Public) -->
      <a
        routerLink="/perdidas"
        routerLinkActive="mobile-dock-active"
        class="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
      >
        <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">🚨</span>
        <span class="text-[10px] font-bold mt-0.5">Perdidos</span>
      </a>

      @if (authService.isAuthenticated()) {
        <!-- Mi Perfil -->
        <a
          routerLink="/perfil"
          routerLinkActive="mobile-dock-active"
          class="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
        >
          <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">👤</span>
          <span class="text-[10px] font-bold mt-0.5">Perfil</span>
        </a>

        <!-- Nueva Mascota Action Pill -->
        <a
          routerLink="/pets/new"
          routerLinkActive="mobile-dock-active-add"
          class="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-emerald-600 dark:text-emerald-400 transition-colors group flex-1"
        >
          <div class="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-sm font-black text-emerald-600 dark:text-emerald-400 group-[.mobile-dock-active-add]:bg-emerald-500 group-[.mobile-dock-active-add]:text-slate-950 transition-colors">
            +
          </div>
          <span class="text-[9px] font-bold mt-0.5">Nueva</span>
        </a>
      } @else {
        <!-- Ingresar (Guest) -->
        <a
          routerLink="/auth/login"
          routerLinkActive="mobile-dock-active"
          class="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
        >
          <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">👤</span>
          <span class="text-[10px] font-bold mt-0.5">Entrar</span>
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
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  brand = BRAND_CONFIG;

  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  isMoreMenuOpen = signal(false);
  isUserMenuOpen = signal(false);

  isRescuerOrAdmin = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === UserRole.RESCATISTA_VERIFICADO || role === UserRole.ALBERGUE || role === UserRole.ADMIN;
  });

  toggleMoreMenu(event: Event): void {
    event.stopPropagation();
    this.isUserMenuOpen.set(false);
    this.isMoreMenuOpen.update((v) => !v);
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.isMoreMenuOpen.set(false);
    this.isUserMenuOpen.update((v) => !v);
  }

  closeAllDropdowns(): void {
    this.isMoreMenuOpen.set(false);
    this.isUserMenuOpen.set(false);
  }

  logoutAndClose(): void {
    this.closeAllDropdowns();
    this.authService.logout();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeAllDropdowns();
  }

  toggleMobileMenu(): void {
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

