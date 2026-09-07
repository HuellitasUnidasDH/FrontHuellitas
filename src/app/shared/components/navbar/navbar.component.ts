import { Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Floating Dynamic Island Navbar -->
    <header
      class="fixed top-3 sm:top-5 inset-x-0 mx-auto w-[94%] max-w-5xl z-50 transition-all duration-500 ease-out"
      [ngClass]="{
        'py-1 scale-[0.99]': isScrolled(),
        'py-1.5': !isScrolled()
      }"
    >
      <div
        class="liquid-glass rounded-2xl sm:rounded-3xl px-4 sm:px-6 h-16 flex items-center justify-between shadow-2xl transition-all duration-500"
        [ngClass]="{
          'shadow-emerald-500/10 border-white/60 dark:border-white/15': isScrolled(),
          'border-white/40 dark:border-white/10': !isScrolled()
        }"
      >
        <!-- Brand / Logo -->
        <div class="flex items-center gap-3">
          <a routerLink="/" class="flex items-center gap-2.5 group">
            <div
              class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 cursor-pointer"
            >
              🐾
            </div>
            <div class="flex flex-col">
              <span
                class="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-700 dark:from-white dark:via-emerald-200 dark:to-teal-300 bg-clip-text text-transparent"
              >
                VetRegistro
              </span>
              <span class="text-[9px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 -mt-1 hidden sm:inline-block">
                Enterprise Shield
              </span>
            </div>
          </a>

          <!-- Dynamic Center Navigation Pills (Authenticated) -->
          @if (authService.isAuthenticated()) {
            <nav class="hidden md:flex items-center gap-1.5 ml-6 bg-slate-200/50 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-slate-300/40 dark:border-slate-800/60 backdrop-blur-md shadow-inner">
              
              <!-- Dashboard Tab -->
              <a
                routerLink="/dashboard"
                routerLinkActive="active-nav-tab"
                [routerLinkActiveOptions]="{ exact: true }"
                class="nav-tab-item group relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <span class="tab-indicator opacity-0 group-[.active-nav-tab]:opacity-100 absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-md shadow-emerald-500/10 border border-emerald-500/30 transition-all duration-300 -z-10"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 group-[.active-nav-tab]:opacity-100 animate-pulse transition-opacity"></span>
                <span>Dashboard</span>
              </a>

              <!-- Mascotas Tab -->
              <a
                routerLink="/pets"
                routerLinkActive="active-nav-tab"
                [routerLinkActiveOptions]="{ exact: true }"
                class="nav-tab-item group relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <span class="tab-indicator opacity-0 group-[.active-nav-tab]:opacity-100 absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-md shadow-emerald-500/10 border border-emerald-500/30 transition-all duration-300 -z-10"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 group-[.active-nav-tab]:opacity-100 animate-pulse transition-opacity"></span>
                <span>Mascotas</span>
              </a>

              <!-- Familias / Grupos Tab -->
              <a
                routerLink="/groups"
                routerLinkActive="active-nav-tab"
                class="nav-tab-item group relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <span class="tab-indicator opacity-0 group-[.active-nav-tab]:opacity-100 absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-md shadow-emerald-500/10 border border-emerald-500/30 transition-all duration-300 -z-10"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 group-[.active-nav-tab]:opacity-100 animate-pulse transition-opacity"></span>
                <span>👨‍👩‍👧‍👦 Familias</span>
              </a>

              <!-- Registrar Tab -->
              <a
                routerLink="/pets/new"
                routerLinkActive="active-nav-tab"
                class="nav-tab-item group relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <span class="tab-indicator opacity-0 group-[.active-nav-tab]:opacity-100 absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-md shadow-emerald-500/10 border border-emerald-500/30 transition-all duration-300 -z-10"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 group-[.active-nav-tab]:opacity-100 animate-pulse transition-opacity"></span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">+</span>
                <span>Nueva Mascota</span>
              </a>

              <!-- Admin Tab (Only for ADMIN role) -->
              @if (authService.isAdmin()) {
                <a
                  routerLink="/admin"
                  routerLinkActive="active-nav-tab"
                  class="nav-tab-item group relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                >
                  <span class="tab-indicator opacity-0 group-[.active-nav-tab]:opacity-100 absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-md shadow-rose-500/10 border border-rose-500/30 transition-all duration-300 -z-10"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500 opacity-0 group-[.active-nav-tab]:opacity-100 animate-pulse transition-opacity"></span>
                  <span>🛡️ Admin</span>
                </a>
              }

            </nav>
          }
        </div>

        <!-- Right Controls: Theme Switcher & User Profile -->
        <div class="flex items-center gap-2.5">
          <!-- Floating Theme Switcher Button -->
          <button
            (click)="themeService.toggleTheme()"
            type="button"
            class="relative w-10 h-10 rounded-2xl bg-white/50 dark:bg-slate-900/60 hover:bg-white/80 dark:hover:bg-slate-800 border border-slate-300/60 dark:border-slate-700/60 flex items-center justify-center text-sm hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer shadow-sm shadow-black/5"
            [title]="themeService.isDarkMode() ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'"
          >
            @if (themeService.isDarkMode()) {
              <span class="text-amber-300 animate-spin-slow">☀️</span>
            } @else {
              <span class="text-slate-700">🌙</span>
            }
          </button>

          @if (authService.isAuthenticated()) {
            <div class="flex items-center gap-2.5">
              <!-- User Role Badge -->
              <div class="hidden lg:flex flex-col text-right pl-2">
                <span class="text-xs font-bold text-slate-900 dark:text-white max-w-[130px] truncate">
                  {{ authService.currentUser()?.fullName }}
                </span>
                <span class="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                  {{ getRoleBadge(authService.currentUser()?.role) }}
                </span>
              </div>

              <!-- Logout Button -->
              <button
                (click)="authService.logout()"
                class="px-3.5 py-1.5 text-xs font-bold rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:border-rose-500/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shadow-sm"
                title="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          } @else {
            <div class="flex items-center gap-2">
              <a
                routerLink="/auth/login"
                class="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-2xl text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                Iniciar Sesión
              </a>
              <a
                routerLink="/auth/register"
                class="px-4 py-2 text-xs sm:text-sm font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Registrarse
              </a>
            </div>
          }
        </div>
      </div>

      <!-- Mobile Navigation Quick Bar (Visible only on small screens when authenticated) -->
      @if (authService.isAuthenticated()) {
        <div class="md:hidden mt-2 liquid-glass rounded-2xl p-1.5 flex items-center justify-around shadow-xl border border-white/30 dark:border-white/10">
          <a
            routerLink="/dashboard"
            routerLinkActive="mobile-active-tab"
            [routerLinkActiveOptions]="{ exact: true }"
            class="group px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5"
          >
            <span>📊</span>
            <span>Dashboard</span>
          </a>
          <a
            routerLink="/pets"
            routerLinkActive="mobile-active-tab"
            [routerLinkActiveOptions]="{ exact: true }"
            class="group px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5"
          >
            <span>🐾</span>
            <span>Mascotas</span>
          </a>
          <a
            routerLink="/groups"
            routerLinkActive="mobile-active-tab"
            class="group px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5"
          >
            <span>👨‍👩‍👧</span>
            <span>Familias</span>
          </a>
          <a
            routerLink="/pets/new"
            routerLinkActive="mobile-active-tab"
            class="group px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-all flex items-center gap-1"
          >
            <span class="font-bold">+</span>
            <span>Nueva</span>
          </a>
          @if (authService.isAdmin()) {
            <a
              routerLink="/admin"
              routerLinkActive="mobile-active-tab"
              class="group px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 transition-all flex items-center gap-1"
            >
              <span>🛡️</span>
              <span>Admin</span>
            </a>
          }
        </div>
      }
    </header>
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

    .mobile-active-tab {
      background: rgba(16, 185, 129, 0.15);
      color: #059669;
      font-weight: 700;
    }

    :host-context(.dark) .mobile-active-tab {
      color: #34d399;
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);

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

  ngOnDestroy(): void {}

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
