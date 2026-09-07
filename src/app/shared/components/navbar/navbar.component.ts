import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { UserRole } from '../../../core/models/user.model';

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
                VetRegistro
              </span>
              <span class="text-[9px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 -mt-1 hidden lg:inline-block">
                Enterprise Cloud
              </span>
            </div>
          </a>

          <!-- Desktop Navigation Tabs (Visible on md/lg screens and up) -->
          @if (authService.isAuthenticated()) {
            <nav class="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-950/40 border border-slate-300/40 dark:border-slate-800/60 backdrop-blur-md">
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

              <!-- Mascotas -->
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

              <!-- Nueva Mascota Action Pill -->
              <a
                routerLink="/pets/new"
                routerLinkActive="active-nav-tab"
                class="nav-tab-item relative px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <span class="tab-indicator absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/30 opacity-0 transition-opacity -z-10"></span>
                <span class="font-black text-sm">+</span>
                <span>Nueva</span>
              </a>

              <!-- Admin Link (Only for ADMIN role - compact & highlighted) -->
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
            </nav>
          }
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

            <!-- Logout Button -->
            <button
              (click)="authService.logout()"
              class="px-3 py-1.5 text-xs font-bold rounded-xl sm:rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shadow-sm flex items-center gap-1"
              title="Cerrar sesión"
            >
              <span>🚪</span>
              <span class="hidden sm:inline">Salir</span>
            </button>
          } @else {
            <div class="flex items-center gap-2">
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
        </div>
      </div>
    </header>

    <!-- ======================================================== -->
    <!-- Mobile Bottom Navigation Dock (Native App Style)         -->
    <!-- Visible ONLY on mobile (< md), thumb-friendly, sleek     -->
    <!-- ======================================================== -->
    @if (authService.isAuthenticated()) {
      <nav
        class="md:hidden fixed bottom-3 inset-x-3 z-50 liquid-glass rounded-2xl p-1.5 flex items-center justify-around shadow-2xl border border-white/40 dark:border-white/10 backdrop-blur-xl"
      >
        <!-- Dashboard -->
        <a
          routerLink="/dashboard"
          routerLinkActive="mobile-dock-active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
        >
          <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">📊</span>
          <span class="text-[10px] font-bold mt-0.5">Inicio</span>
        </a>

        <!-- Mascotas -->
        <a
          routerLink="/pets"
          routerLinkActive="mobile-dock-active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
        >
          <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">🐾</span>
          <span class="text-[10px] font-bold mt-0.5">Mascotas</span>
        </a>

        <!-- Familias -->
        <a
          routerLink="/groups"
          routerLinkActive="mobile-dock-active"
          class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
        >
          <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">👨‍👩‍👧</span>
          <span class="text-[10px] font-bold mt-0.5">Familias</span>
        </a>

        <!-- Registrar Mascota Center Button -->
        <a
          routerLink="/pets/new"
          routerLinkActive="mobile-dock-active-add"
          class="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-emerald-600 dark:text-emerald-400 transition-colors group flex-1"
        >
          <div class="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-base font-black text-emerald-600 dark:text-emerald-400 group-[.mobile-dock-active-add]:bg-emerald-500 group-[.mobile-dock-active-add]:text-slate-950 transition-colors">
            +
          </div>
          <span class="text-[10px] font-bold mt-0.5">Nueva</span>
        </a>

        <!-- Admin Tab (Only if ADMIN) -->
        @if (authService.isAdmin()) {
          <a
            routerLink="/admin"
            routerLinkActive="mobile-dock-active-admin"
            class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-rose-600 dark:text-rose-400 transition-colors group flex-1"
          >
            <span class="text-base group-[.mobile-dock-active-admin]:scale-110 transition-transform">🛡️</span>
            <span class="text-[10px] font-bold mt-0.5">Admin</span>
          </a>
        }
      </nav>
    }
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

  isScrolled = signal(false);

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
      case UserRole.VETERINARIAN:
        return 'Médico Veterinario';
      case UserRole.PET_OWNER:
        return 'Dueño';
      default:
        return 'Usuario';
    }
  }
}

