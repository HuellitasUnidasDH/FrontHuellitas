import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
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
        class="liquid-glass rounded-2xl sm:rounded-3xl px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-xl transition-all duration-300"
      >
        <!-- Brand / Logo -->
        <div class="flex items-center gap-2.5 sm:gap-6 min-w-0">
          <a routerLink="/" class="flex items-center gap-2 group flex-shrink-0">
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

          <!-- Desktop Navigation Tabs (Visible on md/lg screens and up) -->
          <nav class="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-950/40 border border-slate-300/40 dark:border-slate-800/60 backdrop-blur-md">
            <!-- Muro Comunitario (Public) -->
            <a
              routerLink="/"
              routerLinkActive="active-nav-tab"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-tab-item relative px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
              <span>📰</span>
              <span>Muro</span>
            </a>

            <!-- Adopciones (Public) -->
            <a
              routerLink="/adopciones"
              routerLinkActive="active-nav-tab"
              class="nav-tab-item relative px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
              <span>🏠</span>
              <span>Adopciones</span>
            </a>

            <!-- Perdidos / Alertas (Public) -->
            <a
              routerLink="/perdidas"
              routerLinkActive="active-nav-tab"
              class="nav-tab-item relative px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
              <span>🚨</span>
              <span>Perdidos</span>
            </a>

            <!-- Aliados (Public) -->
            <a
              routerLink="/aliados"
              routerLinkActive="active-nav-tab"
              class="nav-tab-item relative px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
              <span>🩺</span>
              <span>Aliados</span>
            </a>

            @if (authService.isAuthenticated()) {
              <span class="text-slate-300 dark:text-slate-700 px-0.5">|</span>

              <!-- Panel Rescatista -->
              <a
                routerLink="/panel-rescatista"
                routerLinkActive="active-nav-tab"
                class="nav-tab-item relative px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
                <span>📋</span>
                <span>Rescatista</span>
              </a>

              <!-- Dashboard -->
              <a
                routerLink="/dashboard"
                routerLinkActive="active-nav-tab"
                [routerLinkActiveOptions]="{ exact: true }"
                class="nav-tab-item relative px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
                <span>📊</span>
                <span>Dashboard</span>
              </a>

              <!-- Mis Mascotas -->
              <a
                routerLink="/pets"
                routerLinkActive="active-nav-tab"
                [routerLinkActiveOptions]="{ exact: true }"
                class="nav-tab-item relative px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
                <span>🐾</span>
                <span>Mascotas</span>
              </a>

              <!-- Familias -->
              <a
                routerLink="/groups"
                routerLinkActive="active-nav-tab"
                class="nav-tab-item relative px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
                <span>👨‍👩‍👧‍👦</span>
                <span>Familias</span>
              </a>

              <!-- Admin Link (Only for ADMIN role) -->
              @if (authService.isAdmin()) {
                <a
                  routerLink="/admin"
                  routerLinkActive="active-nav-tab-admin"
                  class="nav-tab-item relative px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ml-0.5"
                >
                  <span class="tab-indicator absolute inset-0 rounded-xl bg-rose-500/15 dark:bg-rose-950/50 shadow-sm border border-rose-500/40 opacity-0 transition-opacity -z-10"></span>
                  <span>🛡️</span>
                  <span>Admin</span>
                </a>
              }
            }
          </nav>
        </div>

        <!-- Right Controls: Theme Switcher & User Profile -->
        <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <!-- Theme Switcher Button -->
          <button
            (click)="themeService.toggleTheme()"
            type="button"
            class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/50 dark:bg-slate-900/60 hover:bg-white/80 dark:hover:bg-slate-800 border border-slate-300/60 dark:border-slate-700/60 flex items-center justify-center text-sm transition-all cursor-pointer shadow-sm"
            [title]="themeService.isDarkMode() ? 'Modo Claro' : 'Modo Oscuro'"
          >
            @if (themeService.isDarkMode()) {
              <span class="text-amber-300 text-sm">☀️</span>
            } @else {
              <span class="text-slate-700 text-sm">🌙</span>
            }
          </button>

          @if (authService.isAuthenticated()) {
            <!-- User Role / Profile Chip -->
            <div class="hidden xl:flex flex-col text-right">
              <span class="text-xs font-bold text-slate-900 dark:text-white max-w-[130px] truncate leading-tight">
                {{ authService.currentUser()?.fullName }}
              </span>
              <span class="text-[9px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                {{ getRoleBadge(authService.currentUser()?.role) }}
              </span>
            </div>

            <!-- Logout Button (Desktop) -->
            <button
              (click)="authService.logout()"
              class="hidden sm:flex px-3 py-1.5 text-xs font-bold rounded-xl sm:rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shadow-sm items-center gap-1"
              title="Cerrar sesión"
            >
              <span>🚪</span>
              <span>Salir</span>
            </button>
          } @else {
            <div class="hidden sm:flex items-center gap-2">
              <a
                routerLink="/auth/login"
                class="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
              >
                Ingresar
              </a>
              <a
                routerLink="/auth/register"
                class="px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
              >
                Registro
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
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md">
                    {{ authService.currentUser()?.fullName?.charAt(0) }}
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-900 dark:text-white">
                      {{ authService.currentUser()?.fullName }}
                    </h4>
                    <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {{ getRoleBadge(authService.currentUser()?.role) }}
                    </span>
                  </div>
                </div>
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
                <div class="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2.5">
                    Mi Cuenta y Servicios
                  </span>

                  <a
                    routerLink="/verificacion"
                    (click)="closeMobileMenu()"
                    class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors text-emerald-600 dark:text-emerald-400"
                  >
                    <span class="text-base">🛡️</span>
                    <span>Verificación de Adoptante (Niveles 1-3)</span>
                  </a>

                  <a
                    routerLink="/panel-rescatista"
                    (click)="closeMobileMenu()"
                    class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="text-base">📋</span>
                    <span>Panel de Rescatista (Seguimiento 7, 30, 90)</span>
                  </a>

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
        <!-- Dashboard -->
        <a
          routerLink="/dashboard"
          routerLinkActive="mobile-dock-active"
          class="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
        >
          <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">📊</span>
          <span class="text-[10px] font-bold mt-0.5">Panel</span>
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
  `]
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  brand = BRAND_CONFIG;

  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);

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

