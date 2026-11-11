import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { PwaService } from '../../../core/services/pwa.service';
import { SocialNotificationService } from '../../../core/services/social-notification.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
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
          <a routerLink="/" (click)="closeAllDropdowns()" class="flex items-center gap-2 group flex-shrink-0">
            <div
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform cursor-pointer text-lg"
            >
              🐾
            </div>
            <div class="flex flex-col min-w-0">
              <span
                class="text-sm sm:text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-700 dark:from-white dark:via-emerald-200 dark:to-teal-300 bg-clip-text text-transparent truncate"
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
                    <span class="text-sm">🩺</span>
                    <span>Aliados y Veterinarias</span>
                  </a>

                  @if (!pwaService.isStandalone()) {
                    <button
                      type="button"
                      (click)="closeAllDropdowns(); pwaService.installPwa()"
                      class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      <span class="text-sm">📲</span>
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
                        <span class="text-sm">💬</span>
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
                        <span class="text-sm">🔔</span>
                        <span>Centro de Notificaciones</span>
                      </span>
                      @if (socialNotifications.unreadCount() > 0) {
                        <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                          {{ socialNotifications.unreadCount() }}
                        </span>
                      }
                    </a>

                    <!-- Panel de Rescatista -->
                    @if (isRescuerOrAdmin()) {
                      <a
                        routerLink="/panel-rescatista"
                        routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        (click)="closeAllDropdowns()"
                        class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <span class="text-sm">📋</span>
                        <span>Panel de Rescatista</span>
                      </a>
                    }

                    <!-- Mis Adopciones y Progreso (Portal Adoptante / Dueño) -->
                    <a
                      routerLink="/mis-adopciones"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span class="text-sm">🐾</span>
                      <span>Mis Adopciones y Progreso</span>
                    </a>

                    <!-- Verificación de Adoptante -->
                    <a
                      routerLink="/verificacion"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span class="text-sm">🛡️</span>
                      <span>Verificación de Adoptante</span>
                    </a>

                    <!-- Dashboard Clínico -->
                    <a
                      routerLink="/dashboard"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span class="text-sm">📊</span>
                      <span>Dashboard Clínico</span>
                    </a>

                    <!-- Mis Mascotas -->
                    <a
                      routerLink="/pets"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span class="text-sm">🐾</span>
                      <span>Mis Mascotas</span>
                    </a>

                    <!-- Familias / Cuidado Compartido -->
                    <a
                      routerLink="/groups"
                      routerLinkActive="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      (click)="closeAllDropdowns()"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
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
                        class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
                      class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
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
                class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60 shadow-sm flex items-center justify-center transition-all cursor-pointer group"
                [ngClass]="{ 'ring-2 ring-emerald-500/50 bg-white dark:bg-slate-800': isMessagesMenuOpen() }"
                title="Mensajes Directos (Huellitas Direct)"
              >
                <span class="text-base sm:text-lg group-hover:scale-110 transition-transform">💬</span>

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
                      <span class="text-sm">💬</span>
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
                      <span class="text-2xl block">🐾</span>
                      <p class="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Sin conversaciones activas aún
                      </p>
                      <p class="text-[11px] text-slate-500">
                        Toca «💬 Mensaje» en cualquier publicación para chatear directo.
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
                              <p class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                📌 {{ conv.contextTitle }}
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
                class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60 shadow-sm flex items-center justify-center transition-all cursor-pointer group"
                [ngClass]="{ 'ring-2 ring-emerald-500/50 bg-white dark:bg-slate-800': isNotifMenuOpen() }"
                title="Notificaciones y Actividad"
              >
                <span class="text-base sm:text-lg group-hover:scale-110 transition-transform">🔔</span>

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
                      <span class="text-sm">🔔</span>
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
                        class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        ✓ Marcar leídas
                      </button>
                    }
                  </div>

                  <!-- Recent Notifications Mini-List -->
                  @if (socialNotifications.recentNotifications().length === 0) {
                    <div class="py-8 text-center space-y-1.5">
                      <span class="text-2xl block">✨</span>
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
                            <span class="absolute -bottom-1 -right-1 text-[10px] bg-white dark:bg-slate-900 rounded-md px-0.5 shadow">
                              {{ getNotifIcon(notif.type) }}
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
                    class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="text-base">👤</span>
                    <span>Mi Perfil y Datos</span>
                  </a>

                  <!-- Option: Mis Mensajes Directos -->
                  <a
                    routerLink="/mensajes"
                    (click)="closeAllDropdowns()"
                    class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="flex items-center gap-3">
                      <span class="text-base">💬</span>
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
                      <span class="text-base">🔔</span>
                      <span>Mis Notificaciones</span>
                    </span>
                    @if (socialNotifications.unreadCount() > 0) {
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                        {{ socialNotifications.unreadCount() }}
                      </span>
                    }
                  </a>

                  <!-- Option: Mis Publicaciones -->
                  <a
                    routerLink="/perfil"
                    [queryParams]="{ tab: 'publications' }"
                    (click)="closeAllDropdowns()"
                    class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span class="text-base">📝</span>
                    <span>Mis Publicaciones</span>
                  </a>

                  <div class="border-t border-slate-200/60 dark:border-slate-800/60"></div>

                  <!-- Option: Dark / Light Mode Switch -->
                  <button
                    type="button"
                    (click)="themeService.toggleTheme()"
                    class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <span class="flex items-center gap-3">
                      <span class="text-base">{{ themeService.isDarkMode() ? '☀️' : '🌙' }}</span>
                      <span>{{ themeService.isDarkMode() ? 'Modo Claro' : 'Modo Oscuro' }}</span>
                    </span>
                    <span class="text-[10px] uppercase font-bold text-slate-400">
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
                    <span class="text-base">🚪</span>
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
            (click)="toggleMobileMenu($event)"
            type="button"
            class="md:hidden w-9 h-9 rounded-xl bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-300/70 dark:border-slate-700/70 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-sm text-base font-bold"
            [ngClass]="{ 'ring-2 ring-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400': isMobileMenuOpen() }"
            aria-label="Abrir menú de navegación"
          >
            @if (isMobileMenuOpen()) {
              <span>✕</span>
            } @else {
              <span>☰</span>
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
        class="md:hidden fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-md flex flex-col pt-[4.5rem] pb-24 px-3 animate-fadeIn"
        (click)="closeMobileMenu()"
      >
        <div
          class="w-full max-w-lg mx-auto bg-white/95 dark:bg-[#0b1324]/95 rounded-3xl p-4 sm:p-5 shadow-2xl border border-emerald-500/35 flex flex-col max-h-[calc(100dvh-6.5rem)] overflow-hidden"
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
                class="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-extrabold flex-shrink-0 cursor-pointer"
                title="Cerrar sesión"
              >
                🚪 Salir
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
          <div class="flex-1 overflow-y-auto overscroll-contain space-y-1.5 pr-1 text-sm font-bold text-slate-800 dark:text-slate-100">
            <span class="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 pt-1">
              Secciones Principales
            </span>

            <a
              routerLink="/"
              routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl border border-transparent hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors"
            >
              <span class="text-lg">📰</span>
              <span>Muro Comunitario</span>
            </a>

            <a
              routerLink="/adopciones"
              routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl border border-transparent hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors"
            >
              <span class="text-lg">🏠</span>
              <span>Peluditos en Adopción</span>
            </a>

            <a
              routerLink="/perdidas"
              routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl border border-transparent hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors"
            >
              <span class="text-lg">🚨</span>
              <span>Mascotas Extraviadas / Encontradas</span>
            </a>

            <a
              routerLink="/aliados"
              routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl border border-transparent hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors"
            >
              <span class="text-lg">🩺</span>
              <span>Directorio de Aliados (Dolores Hidalgo)</span>
            </a>

            @if (authService.isAuthenticated()) {
              <div class="pt-2.5 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                <span class="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3">
                  Mi Cuenta y Servicios
                </span>

                <a
                  routerLink="/mensajes"
                  routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  (click)="closeMobileMenu()"
                  class="flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors text-emerald-700 dark:text-emerald-400"
                >
                  <span class="flex items-center gap-3.5">
                    <span class="text-lg">💬</span>
                    <span>Mensajes Directos (Huellitas Direct)</span>
                  </span>
                  @if (dmService.totalUnreadMessages() > 0) {
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-slate-950">
                      {{ dmService.totalUnreadMessages() }}
                    </span>
                  }
                </a>

                <a
                  routerLink="/notificaciones"
                  routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  (click)="closeMobileMenu()"
                  class="flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors text-emerald-700 dark:text-emerald-400"
                >
                  <span class="flex items-center gap-3.5">
                    <span class="text-lg">🔔</span>
                    <span>Centro de Notificaciones</span>
                  </span>
                  @if (socialNotifications.unreadCount() > 0) {
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white">
                      {{ socialNotifications.unreadCount() }} nuevas
                    </span>
                  }
                </a>

                <a
                  routerLink="/perfil"
                  routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <span class="text-lg">👤</span>
                  <span>Mi Perfil y Publicaciones</span>
                </a>

                <a
                  routerLink="/mis-adopciones"
                  routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <span class="text-lg">🐾</span>
                  <span>Mis Adopciones y Progreso</span>
                </a>

                <a
                  routerLink="/verificacion"
                  routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <span class="text-lg">🛡️</span>
                  <span>Verificación de Adoptante</span>
                </a>

                @if (isRescuerOrAdmin()) {
                  <a
                    routerLink="/panel-rescatista"
                    routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    (click)="closeMobileMenu()"
                    class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors text-emerald-700 dark:text-emerald-400 font-extrabold"
                  >
                    <span class="text-lg">📋</span>
                    <span>Panel de Rescatista (Seguimiento)</span>
                  </a>
                }

                <a
                  routerLink="/dashboard"
                  routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <span class="text-lg">📊</span>
                  <span>Dashboard Clínico</span>
                </a>

                <a
                  routerLink="/pets"
                  routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <span class="text-lg">🐾</span>
                  <span>Mis Mascotas</span>
                </a>

                <a
                  routerLink="/groups"
                  routerLinkActive="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <span class="text-lg">👨‍👩‍👧‍👦</span>
                  <span>Familias / Grupos</span>
                </a>

                @if (authService.isAdmin()) {
                  <a
                    routerLink="/admin"
                    routerLinkActive="bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    (click)="closeMobileMenu()"
                    class="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors font-extrabold"
                  >
                    <span class="text-lg">🛡️</span>
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
                  class="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold transition-colors cursor-pointer"
                >
                  <span class="flex items-center gap-3.5">
                    <span class="text-lg">📲</span>
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
                class="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
              >
                <span class="flex items-center gap-3.5">
                  <span class="text-lg">{{ themeService.isDarkMode() ? '☀️' : '🌙' }}</span>
                  <span>{{ themeService.isDarkMode() ? 'Modo Claro' : 'Modo Oscuro' }}</span>
                </span>
                <span class="text-xs uppercase font-extrabold text-emerald-600 dark:text-emerald-400">
                  Cambiar
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
      class="md:hidden fixed bottom-2.5 inset-x-3 z-50 liquid-glass rounded-2xl p-1.5 flex items-center justify-around shadow-2xl border border-white/40 dark:border-white/10 backdrop-blur-xl"
    >
      <!-- Muro (Public) -->
      <a
        routerLink="/"
        routerLinkActive="mobile-dock-active"
        [routerLinkActiveOptions]="{ exact: true }"
        (click)="closeAllDropdowns()"
        class="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
      >
        <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">📰</span>
        <span class="text-[10px] font-bold mt-0.5">Muro</span>
      </a>

      <!-- Adopciones (Public) -->
      <a
        routerLink="/adopciones"
        routerLinkActive="mobile-dock-active"
        (click)="closeAllDropdowns()"
        class="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
      >
        <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">🏠</span>
        <span class="text-[10px] font-bold mt-0.5">Adoptar</span>
      </a>

      @if (authService.isAuthenticated()) {
        <!-- Mensajes Directos -->
        <a
          routerLink="/mensajes"
          routerLinkActive="mobile-dock-active"
          (click)="closeAllDropdowns()"
          class="relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
        >
          <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">💬</span>
          <span class="text-[10px] font-bold mt-0.5">Mensajes</span>
          @if (dmService.totalUnreadMessages() > 0) {
            <span class="absolute top-1 right-3 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
          }
        </a>

        <!-- Alertas / Notificaciones -->
        <a
          routerLink="/notificaciones"
          routerLinkActive="mobile-dock-active"
          (click)="closeAllDropdowns()"
          class="relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
        >
          <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">🔔</span>
          <span class="text-[10px] font-bold mt-0.5">Alertas</span>
          @if (socialNotifications.unreadCount() > 0) {
            <span class="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
          }
        </a>

        <!-- Menú Completo en Dock Móvil -->
        <button
          type="button"
          (click)="toggleMobileMenu($event)"
          [ngClass]="{ 'mobile-dock-active': isMobileMenuOpen() }"
          class="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1 cursor-pointer"
        >
          <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">☰</span>
          <span class="text-[10px] font-bold mt-0.5">Opciones</span>
        </button>
      } @else {
        <!-- Perdidos (Public) -->
        <a
          routerLink="/perdidas"
          routerLinkActive="mobile-dock-active"
          (click)="closeAllDropdowns()"
          class="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
        >
          <span class="text-base group-[.mobile-dock-active]:scale-110 transition-transform">🚨</span>
          <span class="text-[10px] font-bold mt-0.5">Perdidos</span>
        </a>

        <!-- Ingresar (Guest) -->
        <a
          routerLink="/auth/login"
          routerLinkActive="mobile-dock-active"
          (click)="closeAllDropdowns()"
          class="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-600 dark:text-slate-400 transition-colors group flex-1"
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
  pwaService = inject(PwaService);
  socialNotifications = inject(SocialNotificationService);
  dmService = inject(DirectMessageService);
  private router = inject(Router);
  brand = BRAND_CONFIG;

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
        targetUrl = `/publicacion/pet-${notif.entityId}`;
      }
    }
    this.router.navigateByUrl(targetUrl);
  }

  getNotifIcon(type: SocialNotificationType): string {
    switch (type) {
      case SocialNotificationType.COMMENT_ON_POST:
      case SocialNotificationType.COMMENT_ON_PET:
        return '💬';
      case SocialNotificationType.SIGHTING_REPORTED:
        return '🚨';
      case SocialNotificationType.ADOPTION_REQUEST_RECEIVED:
        return '🏠';
      case SocialNotificationType.ADOPTION_REQUEST_STATUS:
        return '🎉';
      case SocialNotificationType.FOLLOWUP_PROOF_SUBMITTED:
        return '📸';
      case SocialNotificationType.GROUP_ACTIVITY:
        return '👨‍👩‍👧‍👦';
      default:
        return '🔔';
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
