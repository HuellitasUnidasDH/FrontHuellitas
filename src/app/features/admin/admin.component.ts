import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { PetService } from '../../core/services/pet.service';
import { AuditService } from '../../core/services/audit.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { AuthService, DEFAULT_PRIVACY_POLICY_CONFIG } from '../../core/services/auth.service';
import {
  ContentReport,
  ContentReportStatus,
  ModerationService,
} from '../../core/services/moderation.service';
import { LostPetService } from '../../core/services/lost-pet.service';
import { AllyService } from '../../core/services/ally.service';
import { ColoniaService } from '../../core/services/colonia.service';
import { User, UserRole } from '../../core/models/user.model';
import { Pet } from '../../core/models/pet.model';
import { LostPetReport, LostPetStatus, LostPetType } from '../../core/models/lost-pet.model';
import { Ally, AllyCategory } from '../../core/models/ally.model';
import { Colonia } from '../../core/models/colonia.model';
import { AuditLog, SystemStats } from '../../core/models/audit-log.model';
import {
  ACTIVE_ROLE_OPTIONS,
  ADOPTION_STATUS_META,
  ALL_ROLE_OPTIONS,
  ALLY_CATEGORY_OPTIONS,
  LEGACY_ROLE_OPTIONS,
  LOST_PET_STATUS_META,
  LOST_PET_TYPE_LABELS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_META,
  REPORT_TARGET_LABELS,
  downloadCsv,
  getRoleMeta,
  normalizeSearchText,
} from './admin-metadata';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Top Banner -->
      <div class="liquid-glass p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              Panel Maestro
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">DevSecOps & Control Total</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Centro de Mando y Auditoría 🛡️
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Supervisa el estado del servidor en tiempo real, rastrea intentos de acceso y ciberataques, gestiona usuarios y administra registros médicos zoológicos.
          </p>
        </div>

        <!-- Tab Selector Pills (Scrollable smoothly on mobile) -->
        <div class="flex items-center overflow-x-auto p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-950/60 border border-slate-300/60 dark:border-slate-800 gap-1 w-full lg:w-auto max-w-full">
          <!-- Monitoreo -->
          <button
            (click)="switchTab('monitoring')"
            [class.bg-white]="activeTab() === 'monitoring'"
            [class.dark:bg-slate-800]="activeTab() === 'monitoring'"
            [class.text-slate-950]="activeTab() === 'monitoring'"
            [class.dark:text-white]="activeTab() === 'monitoring'"
            [class.shadow-md]="activeTab() === 'monitoring'"
            [class.text-slate-600]="activeTab() !== 'monitoring'"
            [class.dark:text-slate-400]="activeTab() !== 'monitoring'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <span>📊</span>
            <span>Monitoreo</span>
          </button>

          <!-- Auditoría & Logs -->
          <button
            (click)="switchTab('audit')"
            [class.bg-white]="activeTab() === 'audit'"
            [class.dark:bg-slate-800]="activeTab() === 'audit'"
            [class.text-slate-950]="activeTab() === 'audit'"
            [class.dark:text-white]="activeTab() === 'audit'"
            [class.shadow-md]="activeTab() === 'audit'"
            [class.text-slate-600]="activeTab() !== 'audit'"
            [class.dark:text-slate-400]="activeTab() !== 'audit'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <span>🛡️</span>
            <span>Logs y Auditoría</span>
          </button>

          <!-- Personas -->
          <button
            (click)="switchTab('users')"
            [class.bg-white]="activeTab() === 'users'"
            [class.dark:bg-slate-800]="activeTab() === 'users'"
            [class.text-slate-950]="activeTab() === 'users'"
            [class.dark:text-white]="activeTab() === 'users'"
            [class.shadow-md]="activeTab() === 'users'"
            [class.text-slate-600]="activeTab() !== 'users'"
            [class.dark:text-slate-400]="activeTab() !== 'users'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <span>👥</span>
            <span>Personas ({{ users().length }})</span>
          </button>

          <!-- Mascotas -->
          <button
            (click)="switchTab('pets')"
            [class.bg-white]="activeTab() === 'pets'"
            [class.dark:bg-slate-800]="activeTab() === 'pets'"
            [class.text-slate-950]="activeTab() === 'pets'"
            [class.dark:text-white]="activeTab() === 'pets'"
            [class.shadow-md]="activeTab() === 'pets'"
            [class.text-slate-600]="activeTab() !== 'pets'"
            [class.dark:text-slate-400]="activeTab() !== 'pets'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <span>🐾</span>
            <span>Mascotas ({{ pets().length }})</span>
          </button>

          <!-- Moderación / Denuncias -->
          <button
            (click)="switchTab('moderation')"
            [class.bg-white]="activeTab() === 'moderation'"
            [class.dark:bg-slate-800]="activeTab() === 'moderation'"
            [class.text-slate-950]="activeTab() === 'moderation'"
            [class.dark:text-white]="activeTab() === 'moderation'"
            [class.shadow-md]="activeTab() === 'moderation'"
            [class.text-slate-600]="activeTab() !== 'moderation'"
            [class.dark:text-slate-400]="activeTab() !== 'moderation'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <span>⚖️</span>
            <span>Moderación</span>
            @if (pendingReportsCount() > 0) {
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {{ pendingReportsCount() }}
              </span>
            }
          </button>

          <!-- Muro Comunitario -->
          <button
            (click)="switchTab('posts')"
            [class.bg-white]="activeTab() === 'posts'"
            [class.dark:bg-slate-800]="activeTab() === 'posts'"
            [class.text-slate-950]="activeTab() === 'posts'"
            [class.dark:text-white]="activeTab() === 'posts'"
            [class.shadow-md]="activeTab() === 'posts'"
            [class.text-slate-600]="activeTab() !== 'posts'"
            [class.dark:text-slate-400]="activeTab() !== 'posts'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <span>📣</span>
            <span>Muro ({{ lostReports().length }})</span>
          </button>

          <!-- Aliados -->
          <button
            (click)="switchTab('allies')"
            [class.bg-white]="activeTab() === 'allies'"
            [class.dark:bg-slate-800]="activeTab() === 'allies'"
            [class.text-slate-950]="activeTab() === 'allies'"
            [class.dark:text-white]="activeTab() === 'allies'"
            [class.shadow-md]="activeTab() === 'allies'"
            [class.text-slate-600]="activeTab() !== 'allies'"
            [class.dark:text-slate-400]="activeTab() !== 'allies'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <span>🏪</span>
            <span>Aliados ({{ allies().length }})</span>
          </button>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- TAB 1: MONITOREO Y ESTADÍSTICAS DEL SISTEMA              -->
      <!-- ========================================================= -->
      @if (activeTab() === 'monitoring') {
        <div class="space-y-6 animate-fade-in">
          
          <!-- Server Pulse Banner -->
          <div class="liquid-glass p-5 rounded-3xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="relative flex h-3.5 w-3.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Estado del Servidor:</span>
                  <span class="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                    {{ stats()?.system?.status || 'OPERACIONAL' }}
                  </span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Base de datos: {{ stats()?.system?.database || 'PostgreSQL Conectado' }} · Node: {{ stats()?.system?.nodeVersion || 'v20+' }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs font-mono text-slate-700 dark:text-slate-300 w-full md:w-auto">
              <div class="flex-1 sm:flex-none bg-white/40 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span class="text-slate-400 text-[10px] uppercase block">Tiempo Activo:</span>
                <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ stats()?.system?.uptime || 'Activo' }}</span>
              </div>
              <div class="flex-1 sm:flex-none bg-white/40 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span class="text-slate-400 text-[10px] uppercase block">Memoria RAM:</span>
                <span class="font-bold">{{ stats()?.system?.memory?.heapUsedMB || 0 }} MB / {{ stats()?.system?.memory?.heapTotalMB || 0 }} MB</span>
              </div>
              <button
                (click)="loadStats()"
                class="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Actualizar métricas"
              >
                🔄
              </button>
            </div>
          </div>

          <!-- 4 KPI Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Card 1: Total Usuarios -->
            <div class="liquid-glass-card p-5 rounded-3xl shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Usuarios</span>
                <span class="text-xl">👥</span>
              </div>
              <div class="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                {{ stats()?.users?.total || users().length }}
              </div>
              <div class="mt-2 text-xs flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">● {{ stats()?.users?.active || 0 }} Activos</span>
                <span>·</span>
                <span class="text-rose-500 font-bold">● {{ stats()?.users?.suspended || 0 }} Suspendidos</span>
              </div>
            </div>

            <!-- Card 2: Total Mascotas -->
            <div class="liquid-glass-card p-5 rounded-3xl shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mascotas & Adopción</span>
                <span class="text-xl">🐾</span>
              </div>
              <div class="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {{ stats()?.pets?.total ?? pets().length }}
              </div>
              <div class="mt-2 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap gap-2">
                <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ stats()?.pets?.availableForAdoption || 0 }} disponibles</span>
                <span>·</span>
                <span class="font-bold text-sky-600 dark:text-sky-400">{{ stats()?.pets?.adopted || 0 }} adoptadas</span>
              </div>
            </div>

            <!-- Card 3: Comunidad & Moderación -->
            <div
              (click)="switchTab(pendingReportsCount() > 0 ? 'moderation' : 'posts')"
              class="liquid-glass-card p-5 rounded-3xl shadow-lg relative overflow-hidden cursor-pointer hover:border-amber-500/40 transition-all"
              title="Haz clic para abrir Moderación o Muro Comunitario"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Comunidad & Reportes</span>
                <span class="text-xl">⚖️</span>
              </div>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-3xl font-black" [ngClass]="(stats()?.community?.pendingModerationReports || 0) > 0 ? 'text-rose-500' : 'text-cyan-600 dark:text-cyan-400'">
                  {{ stats()?.community?.pendingModerationReports ?? pendingReportsCount() }}
                </span>
                <span class="text-xs font-bold text-slate-500 dark:text-slate-400">denuncias pendientes</span>
              </div>
              <div class="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {{ stats()?.community?.activeLostReports ?? 0 }} alertas activas · {{ stats()?.community?.pendingAdoptionRequests ?? 0 }} adopciones en trámite
              </div>
            </div>

            <!-- Card 4: Seguridad & Intentos Fallidos -->
            <div class="liquid-glass-card p-5 rounded-3xl shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Seguridad & Accesos Hoy</span>
                <span class="text-xl">🛡️</span>
              </div>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-3xl font-black text-cyan-600 dark:text-cyan-400">
                  {{ stats()?.security?.loginsSuccessToday || 0 }}
                </span>
                <span class="text-xs font-bold text-slate-500 dark:text-slate-400">accesos hoy</span>
              </div>
              <div class="mt-2 text-xs text-slate-600 dark:text-slate-400">
                <span class="text-rose-500 font-bold">{{ stats()?.security?.loginsFailedToday || 0 }} fallos hoy</span> · {{ stats()?.security?.totalSecurityAlerts || 0 }} alertas totales
              </div>
            </div>

          </div>

          <!-- Deep Breakdown Grids -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Desglose de Usuarios por Rol (Todos los roles Huellitas) -->
            <div class="liquid-glass p-6 rounded-3xl shadow-xl space-y-4">
              <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>👤</span>
                <span>Composición de Usuarios por Rol</span>
              </h3>
              
              <div class="space-y-3">
                @for (roleBar of roleCompositionBars(); track roleBar.key) {
                  <div>
                    <div class="flex justify-between text-xs font-bold mb-1">
                      <span [class]="roleBar.textClass">{{ roleBar.label }}</span>
                      <span class="text-slate-700 dark:text-slate-300 font-mono">{{ roleBar.count }}</span>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        [ngClass]="roleBar.barClass"
                        [style.width.%]="calcPercentage(roleBar.count, stats()?.users?.total || 1)"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Desglose de Mascotas por Especie -->
            <div class="liquid-glass p-6 rounded-3xl shadow-xl space-y-4">
              <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>🐾</span>
                <span>Distribución por Especies Animales</span>
              </h3>

              @if ((stats()?.pets?.bySpecies?.length || 0) === 0) {
                <p class="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">No hay mascotas registradas aún para graficar.</p>
              } @else {
                <div class="space-y-3">
                  @for (specie of stats()?.pets?.bySpecies; track specie.species) {
                    <div>
                      <div class="flex justify-between text-xs font-bold mb-1">
                        <span class="text-slate-800 dark:text-slate-200 capitalize">{{ specie.species }}</span>
                        <span class="text-slate-600 dark:text-slate-400 font-mono">{{ specie.count }} mascotas</span>
                      </div>
                      <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                          [style.width.%]="calcPercentage(specie.count, stats()?.pets?.total || 1)"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

          </div>

          <!-- Actividad Reciente de Auditoría Preview -->
          <div class="liquid-glass p-6 rounded-3xl shadow-xl space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>⚡</span>
                <span>Últimos Eventos de Seguridad del Sistema</span>
              </h3>
              <button
                (click)="switchTab('audit')"
                class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Ver todos los logs</span>
                <span>→</span>
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs font-mono">
                <thead class="text-[10px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <tr>
                    <th class="py-2 px-3">Fecha y Hora</th>
                    <th class="py-2 px-3">Evento</th>
                    <th class="py-2 px-3">Origen (IP)</th>
                    <th class="py-2 px-3">Detalles</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200/60 dark:divide-slate-800/80">
                  @for (log of stats()?.security?.recentLogs; track log.id) {
                    <tr class="hover:bg-white/40 dark:hover:bg-slate-800/30">
                      <td class="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {{ log.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}
                      </td>
                      <td class="py-2.5 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold" [ngClass]="getActionBadgeClass(log.action)">
                          {{ log.action }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {{ log.ipAddress || 'Interno' }}
                      </td>
                      <td class="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-md truncate">
                        {{ log.details || 'Sin detalles' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>
      }

      <!-- ========================================================= -->
      <!-- TAB 2: BITÁCORA DETALLADA DE AUDITORÍA Y LOGS            -->
      <!-- ========================================================= -->
      @if (activeTab() === 'audit') {
        <div class="space-y-6 animate-fade-in">
          
          <!-- Filters & Search Toolbar -->
          <div class="liquid-glass p-4 rounded-2xl flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shadow-md">
            <!-- Search bar -->
            <div class="relative flex-1 flex items-center gap-2">
              <div class="relative flex-1">
                <input
                  type="text"
                  [ngModel]="logSearch()"
                  (ngModelChange)="onLogSearchChange($event)"
                  (keyup.enter)="loadAuditLogs(1)"
                  placeholder="Buscar por IP, correo, detalle, usuario o recurso..."
                  class="w-full pl-10 pr-9 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
                <span class="absolute left-3.5 top-2 text-slate-400 text-sm">🔍</span>
                @if (logSearch()) {
                  <button
                    type="button"
                    (click)="onLogSearchChange(''); loadAuditLogs(1)"
                    class="absolute right-2.5 top-1.5 w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs flex items-center justify-center cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                }
              </div>
              <button
                type="button"
                (click)="loadAuditLogs(1)"
                class="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold hover:opacity-90 cursor-pointer shrink-0"
              >
                Buscar
              </button>
            </div>

            <!-- Action type filter -->
            <div class="flex flex-wrap items-center gap-2">
              <select
                [ngModel]="selectedActionFilter()"
                (ngModelChange)="selectedActionFilter.set($event); loadAuditLogs(1)"
                class="px-3 py-2 rounded-xl liquid-glass-input text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Todos los Eventos</option>
                <option value="LOGIN_SUCCESS">Accesos Exitosos (LOGIN_SUCCESS)</option>
                <option value="LOGIN_FAILED">Intentos Fallidos (LOGIN_FAILED)</option>
                <option value="LOGIN_BLOCKED">Cuentas Suspendidas (LOGIN_BLOCKED)</option>
                <option value="USER_REGISTERED">Registros Nuevos (USER_REGISTERED)</option>
                <option value="SYSTEM_ERROR">Errores del Sistema (SYSTEM_ERROR)</option>
                <option value="THROTTLE_BLOCKED">Rate Limit Excedido (THROTTLE_BLOCKED)</option>
                <option value="LOGOUT">Cierres de Sesión (LOGOUT)</option>
              </select>

              <button
                type="button"
                (click)="loadAuditLogs(1)"
                class="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>🔄</span>
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          <!-- Logs Table (Terminal / DevSecOps Aesthetic) -->
          @if (isLoadingLogs()) {
            <div class="py-20 flex justify-center">
              <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (auditLogs().length === 0) {
            <div class="text-center py-16 liquid-glass rounded-3xl">
              <span class="text-4xl">📜</span>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">No se encontraron registros de auditoría</p>
            </div>
          } @else {
            <div class="liquid-glass rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs font-mono">
                  <thead class="bg-slate-200/50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    <tr>
                      <th class="py-3.5 px-4 sm:px-6">Timestamp</th>
                      <th class="py-3.5 px-4">Evento / Severidad</th>
                      <th class="py-3.5 px-4">Recurso</th>
                      <th class="py-3.5 px-4">IP & Cliente</th>
                      <th class="py-3.5 px-4 sm:px-6">Detalle del Registro</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200/60 dark:divide-slate-800/80">
                    @for (log of auditLogs(); track log.id) {
                      <tr class="hover:bg-white/40 dark:hover:bg-slate-800/30 transition-colors">
                        <td class="py-3.5 px-4 sm:px-6 text-slate-500 whitespace-nowrap">
                          {{ log.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}
                        </td>
                        <td class="py-3.5 px-4 whitespace-nowrap">
                          <span class="px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 shadow-sm" [ngClass]="getActionBadgeClass(log.action)">
                            {{ log.action }}
                          </span>
                        </td>
                        <td class="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                          {{ log.resource }}
                        </td>
                        <td class="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          <div class="font-bold">{{ log.ipAddress || '127.0.0.1' }}</div>
                          <div class="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[160px]" [title]="log.userAgent || ''">
                            {{ log.userAgent || 'Desconocido' }}
                          </div>
                        </td>
                        <td class="py-3.5 px-4 sm:px-6 text-slate-800 dark:text-slate-200 max-w-lg">
                          <span class="break-words font-sans text-xs">
                            {{ log.details || 'Sin información adicional' }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Pagination Toolbar -->
              <div class="p-4 bg-slate-200/40 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                <div class="text-slate-500 dark:text-slate-400">
                  Mostrando página <strong>{{ logsPage() }}</strong> de <strong>{{ logsTotalPages() }}</strong> ({{ totalLogs() }} eventos registrados)
                </div>
                <div class="flex items-center gap-2">
                  <button
                    (click)="loadAuditLogs(logsPage() - 1)"
                    [disabled]="logsPage() <= 1"
                    class="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  <button
                    (click)="loadAuditLogs(logsPage() + 1)"
                    [disabled]="logsPage() >= logsTotalPages()"
                    class="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </div>
          }

        </div>
      }

      <!-- ========================================================= -->
      <!-- TAB 3: GESTIÓN DE PERSONAS / USUARIOS                     -->
      <!-- ========================================================= -->
      @if (activeTab() === 'users') {
        <div class="space-y-6 animate-fade-in">
          <!-- User Filters & Search -->
          <div class="liquid-glass p-4 rounded-2xl flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between shadow-md">
            <div class="relative flex-1">
              <input
                type="text"
                [ngModel]="userSearch()"
                (ngModelChange)="userSearch.set($event)"
                placeholder="Buscar usuario por nombre, correo, teléfono o colonia..."
                class="w-full pl-10 pr-9 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
              <span class="absolute left-3.5 top-2 text-slate-400 text-sm">🔍</span>
              @if (userSearch()) {
                <button
                  type="button"
                  (click)="userSearch.set('')"
                  class="absolute right-2.5 top-1.5 w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs flex items-center justify-center cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              }
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <select
                [ngModel]="selectedRoleFilter()"
                (ngModelChange)="selectedRoleFilter.set($event)"
                class="px-3 py-2 rounded-xl liquid-glass-input text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Todos los Roles</option>
                @for (roleOpt of activeRoleOptions; track roleOpt.value) {
                  <option [value]="roleOpt.value">{{ roleOpt.label }}</option>
                }
                <optgroup label="Roles anteriores (compatibilidad)">
                  @for (legacyOpt of legacyRoleOptions; track legacyOpt.value) {
                    <option [value]="legacyOpt.value">{{ legacyOpt.label }}</option>
                  }
                </optgroup>
              </select>

              <select
                [ngModel]="selectedUserStatusFilter()"
                (ngModelChange)="selectedUserStatusFilter.set($event)"
                class="px-3 py-2 rounded-xl liquid-glass-input text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Todos los Estados</option>
                <option value="ACTIVE">Solo Activos</option>
                <option value="SUSPENDED">Solo Suspendidos</option>
              </select>

              <button
                type="button"
                (click)="exportUsersCsv()"
                [disabled]="filteredUsers().length === 0"
                class="px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                title="Descargar listado filtrado en CSV"
              >
                <span>📥</span>
                <span>CSV ({{ filteredUsers().length }})</span>
              </button>

              @if (isAdmin()) {
                <button
                  type="button"
                  (click)="onInvalidatePrivacyVersion()"
                  class="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Editar el contenido del Aviso de Privacidad y actualizar la versión legal requerida"
                >
                  <span>📜</span>
                  <span>Versión Legal</span>
                </button>
              }
            </div>
          </div>

          <!-- Users Table / Cards -->
          @if (isLoadingUsers()) {
            <div class="py-20 flex justify-center">
              <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (filteredUsers().length === 0) {
            <div class="text-center py-16 liquid-glass rounded-3xl space-y-2">
              <span class="text-4xl block">👥</span>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300">No se encontraron usuarios con esos filtros</p>
              @if (userSearch() || selectedRoleFilter() || selectedUserStatusFilter()) {
                <button
                  type="button"
                  (click)="clearUserFilters()"
                  class="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold cursor-pointer"
                >
                  Limpiar filtros
                </button>
              }
            </div>
          } @else {
            <div class="liquid-glass rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs sm:text-sm">
                  <thead class="bg-slate-200/50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    <tr>
                      <th class="py-3.5 px-4 sm:px-6">Usuario</th>
                      <th class="py-3.5 px-4">Teléfono / Verificación</th>
                      <th class="py-3.5 px-4">Rol Asignado</th>
                      <th class="py-3.5 px-4">Términos</th>
                      <th class="py-3.5 px-4">Estado</th>
                      <th class="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200/60 dark:divide-slate-800/80">
                    @for (user of filteredUsers(); track user.id) {
                      <tr class="hover:bg-white/40 dark:hover:bg-slate-800/30 transition-colors">
                        <td class="py-4 px-4 sm:px-6">
                          <div class="font-bold text-slate-900 dark:text-white text-sm">{{ user.fullName }}</div>
                          <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ user.email }}</div>
                          @if (user.colonia?.name) {
                            <div class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">📍 Col. {{ user.colonia.name }}</div>
                          }
                        </td>
                        <td class="py-4 px-4">
                          <div class="font-mono text-xs text-slate-700 dark:text-slate-300">
                            {{ user.phone || 'Sin registrar' }}
                          </div>
                          <div class="mt-1 flex items-center gap-1.5">
                            <select
                              [ngModel]="user.verificationLevel ?? 0"
                              (ngModelChange)="onUpdateUserVerificationLevel(user, +$event)"
                              class="px-2 py-0.5 rounded-md text-[11px] font-bold liquid-glass-input cursor-pointer focus:outline-none focus:border-emerald-500"
                              [ngClass]="{
                                'text-emerald-600 dark:text-emerald-400': (user.verificationLevel ?? 0) >= 2,
                                'text-sky-600 dark:text-sky-400': (user.verificationLevel ?? 0) === 1,
                                'text-slate-500 dark:text-slate-400': (user.verificationLevel ?? 0) === 0
                              }"
                              title="Nivel de verificación del usuario"
                            >
                              <option [ngValue]="0">Nivel 0 · Básico</option>
                              <option [ngValue]="1">Nivel 1 · Teléfono</option>
                              <option [ngValue]="2">Nivel 2 · Evaluado</option>
                              <option [ngValue]="3">Nivel 3 · Completo</option>
                            </select>
                          </div>
                        </td>
                        <td class="py-4 px-4">
                          <!-- Select dropdown to assign/change any Huellitas role -->
                          <select
                            [ngModel]="user.role"
                            (ngModelChange)="onUpdateUserRole(user, $event)"
                            [disabled]="user.id === currentAdminId()"
                            class="px-2.5 py-1.5 rounded-lg text-xs font-bold liquid-glass-input cursor-pointer focus:outline-none focus:border-emerald-500"
                            [ngClass]="getRoleSelectClass(user.role)"
                          >
                            @for (roleOpt of activeRoleOptions; track roleOpt.value) {
                              <option [value]="roleOpt.value">{{ roleOpt.label }}</option>
                            }
                            @for (legacyOpt of legacyRoleOptions; track legacyOpt.value) {
                              @if (user.role === legacyOpt.value) {
                                <option [value]="legacyOpt.value">{{ legacyOpt.label }}</option>
                              }
                            }
                          </select>
                        </td>
                        <td class="py-4 px-4">
                          @if (user.acceptedPrivacyVersion && user.acceptedPrivacyVersion !== 'OUTDATED' && user.acceptedPrivacyVersion === currentPrivacyVersion()) {
                            <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              <span>✓</span>
                              <span>{{ user.acceptedPrivacyVersion }}</span>
                            </span>
                          } @else {
                            <span class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              <span>⚠️</span>
                              <span>{{ user.acceptedPrivacyVersion || 'Pendiente' }}</span>
                            </span>
                          }
                        </td>
                        <td class="py-4 px-4">
                          <button
                            (click)="onToggleUserStatus(user)"
                            [disabled]="user.id === currentAdminId()"
                            class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer transition-all"
                            [ngClass]="user.isActive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'"
                          >
                            {{ user.isActive ? 'Activo' : 'Suspendido' }}
                          </button>
                        </td>
                        <td class="py-4 px-4 sm:px-6 text-right">
                          <button
                            (click)="onDeleteUser(user)"
                            [disabled]="user.id === currentAdminId()"
                            class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Eliminar usuario"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- ========================================================= -->
      <!-- TAB 4: GESTIÓN GLOBAL DE MASCOTAS                         -->
      <!-- ========================================================= -->
      @if (activeTab() === 'pets') {
        <div class="space-y-6 animate-fade-in">
          <!-- Pet Search & Filters -->
          <div class="liquid-glass p-4 rounded-2xl flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shadow-md">
            <div class="relative flex-1">
              <input
                type="text"
                [ngModel]="petSearch()"
                (ngModelChange)="petSearch.set($event)"
                placeholder="Buscar mascota por nombre, raza, especie, chip o dueño..."
                class="w-full pl-10 pr-9 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
              <span class="absolute left-3.5 top-2 text-slate-400 text-sm">🔍</span>
              @if (petSearch()) {
                <button
                  type="button"
                  (click)="petSearch.set('')"
                  class="absolute right-2.5 top-1.5 w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs flex items-center justify-center cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              }
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <select
                [ngModel]="selectedPetSpeciesFilter()"
                (ngModelChange)="selectedPetSpeciesFilter.set($event)"
                class="px-3 py-2 rounded-xl liquid-glass-input text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Todas las Especies</option>
                <option value="perro">Perros</option>
                <option value="gato">Gatos</option>
                <option value="otro">Otras especies</option>
              </select>

              <select
                [ngModel]="selectedPetStatusFilter()"
                (ngModelChange)="selectedPetStatusFilter.set($event)"
                class="px-3 py-2 rounded-xl liquid-glass-input text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Todos los Estados</option>
                <option value="DISPONIBLE">En Adopción</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="ADOPTADA">Adoptada</option>
                <option value="EN_SEGUIMIENTO">Seguimiento</option>
                <option value="NO_EN_ADOPCION">Expediente Personal</option>
              </select>

              <a
                routerLink="/pets/new"
                class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>+</span>
                <span>Registrar Mascota</span>
              </a>
            </div>
          </div>

          <!-- Pets Table / Cards -->
          @if (isLoadingPets()) {
            <div class="py-20 flex justify-center">
              <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (filteredPets().length === 0) {
            <div class="text-center py-16 liquid-glass rounded-3xl space-y-2">
              <span class="text-4xl block">🐾</span>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300">No se encontraron mascotas con esos filtros</p>
              @if (petSearch() || selectedPetSpeciesFilter() || selectedPetStatusFilter()) {
                <button
                  type="button"
                  (click)="petSearch.set(''); selectedPetSpeciesFilter.set(''); selectedPetStatusFilter.set('')"
                  class="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold cursor-pointer"
                >
                  Limpiar filtros
                </button>
              }
            </div>
          } @else {
            <div class="liquid-glass rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs sm:text-sm">
                  <thead class="bg-slate-200/50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    <tr>
                      <th class="py-3.5 px-4 sm:px-6">Mascota</th>
                      <th class="py-3.5 px-4">Especie / Raza</th>
                      <th class="py-3.5 px-4">Estado Adopción</th>
                      <th class="py-3.5 px-4">Dueño / Publicador</th>
                      <th class="py-3.5 px-4">Microchip</th>
                      <th class="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200/60 dark:divide-slate-800/80">
                    @for (pet of filteredPets(); track pet.id) {
                      <tr class="hover:bg-white/40 dark:hover:bg-slate-800/30 transition-colors">
                        <td class="py-4 px-4 sm:px-6">
                          <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg">
                              {{ pet.species.toLowerCase() === 'perro' || pet.species.toLowerCase() === 'canino' ? '🐶' : pet.species.toLowerCase() === 'gato' || pet.species.toLowerCase() === 'felino' ? '🐱' : '🐾' }}
                            </div>
                            <div>
                              <a [routerLink]="['/pets', pet.id]" class="font-bold text-slate-900 dark:text-white hover:text-emerald-500 transition-colors">
                                {{ pet.name }}
                              </a>
                              <div class="text-[11px] text-slate-500 dark:text-slate-400">
                                {{ pet.gender === 'MALE' ? 'Macho' : 'Hembra' }} · {{ pet.weightKg ? pet.weightKg + ' kg' : 'Sin peso' }}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td class="py-4 px-4">
                          <span class="px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-xs font-semibold capitalize">
                            {{ pet.species }}
                          </span>
                          <span class="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                            {{ pet.breed || 'Mestizo' }}
                          </span>
                        </td>
                        <td class="py-4 px-4">
                          <span
                            class="px-2 py-0.5 rounded-md text-[11px] font-bold inline-block"
                            [ngClass]="getAdoptionStatusBadge(pet.status).badgeClass"
                          >
                            {{ getAdoptionStatusBadge(pet.status).label }}
                          </span>
                        </td>
                        <td class="py-4 px-4">
                          <div class="font-semibold text-slate-800 dark:text-slate-200">{{ pet.owner?.fullName || 'Desconocido' }}</div>
                          <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ pet.owner?.email || '' }}</div>
                        </td>
                        <td class="py-4 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {{ pet.microchipNumber || 'Sin microchip' }}
                        </td>
                        <td class="py-4 px-4 sm:px-6 text-right space-x-2">
                          <a
                            [routerLink]="['/pets', pet.id]"
                            class="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-all inline-block"
                          >
                            Expediente
                          </a>
                          <button
                            (click)="onDeletePet(pet)"
                            class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 transition-all cursor-pointer"
                            title="Eliminar mascota"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- ========================================================= -->
      <!-- TAB 5: MODERACIÓN Y DENUNCIAS COMUNITARIAS                -->
      <!-- ========================================================= -->
      @if (activeTab() === 'moderation') {
        <div class="space-y-6 animate-fade-in">
          <div class="liquid-glass p-4 rounded-2xl flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shadow-md">
            <div class="relative flex-1">
              <input
                type="text"
                [ngModel]="moderationSearch()"
                (ngModelChange)="moderationSearch.set($event)"
                placeholder="Buscar denuncia por motivo, descripción, denunciante o ID..."
                class="w-full pl-10 pr-9 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
              <span class="absolute left-3.5 top-2 text-slate-400 text-sm">🔍</span>
              @if (moderationSearch()) {
                <button
                  type="button"
                  (click)="moderationSearch.set('')"
                  class="absolute right-2.5 top-1.5 w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              }
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <select
                [ngModel]="selectedModerationStatus()"
                (ngModelChange)="selectedModerationStatus.set($event)"
                class="px-3 py-2 rounded-xl liquid-glass-input text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Todos los Estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="EN_REVISION">En Revisión</option>
                <option value="SANCIONADO">Sancionados</option>
                <option value="DESESTIMADO">Desestimados</option>
              </select>

              <button
                type="button"
                (click)="loadModerationReports()"
                class="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🔄</span>
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          @if (isLoadingReports()) {
            <div class="py-20 flex justify-center">
              <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (filteredReports().length === 0) {
            <div class="text-center py-16 liquid-glass rounded-3xl space-y-2">
              <span class="text-4xl block">⚖️</span>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300">No hay denuncias que coincidan con el filtro</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 gap-4">
              @for (report of filteredReports(); track report.id) {
                <div class="liquid-glass p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div class="space-y-2 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        [ngClass]="getReportStatusMeta(report.status).badgeClass"
                      >
                        {{ getReportStatusMeta(report.status).label }}
                      </span>
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {{ getReportTargetLabel(report.targetType) }}
                      </span>
                      <span class="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {{ getReportReasonLabel(report.reason) }}
                      </span>
                      <span class="text-[11px] text-slate-400 font-mono">
                        {{ report.createdAt | date:'dd/MM/yyyy HH:mm' }}
                      </span>
                    </div>

                    <p class="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {{ report.description }}
                    </p>

                    <div class="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        Reportado por: <strong class="text-slate-700 dark:text-slate-200">{{ report.reporterUser?.fullName || 'Usuario' }}</strong>
                        @if (report.reporterUser?.email) {
                          <span class="font-mono"> ({{ report.reporterUser?.email }})</span>
                        }
                      </span>
                      <span class="font-mono text-[11px]">ID objetivo: {{ report.targetId }}</span>
                    </div>

                    @if (report.adminResolutionNotes) {
                      <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                        <span class="font-bold">Resolución Admin:</span> {{ report.adminResolutionNotes }}
                      </div>
                    }
                  </div>

                  <div class="flex flex-wrap lg:flex-col items-stretch gap-2 shrink-0">
                    @if (report.targetType === 'PET_POST') {
                      <a
                        [routerLink]="['/adopciones', report.targetId]"
                        class="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-bold text-center"
                      >
                        Ver Ficha
                      </a>
                    } @else if (report.targetType === 'LOST_REPORT') {
                      <a
                        [routerLink]="['/publicacion', report.targetId]"
                        class="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-bold text-center"
                      >
                        Ver Publicación
                      </a>
                    }

                    <button
                      type="button"
                      (click)="openResolveReportModal(report)"
                      class="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold cursor-pointer"
                    >
                      Resolver / Dictaminar
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ========================================================= -->
      <!-- TAB 6: PUBLICACIONES DEL MURO COMUNITARIO                 -->
      <!-- ========================================================= -->
      @if (activeTab() === 'posts') {
        <div class="space-y-6 animate-fade-in">
          <div class="liquid-glass p-4 rounded-2xl flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shadow-md">
            <div class="relative flex-1">
              <input
                type="text"
                [ngModel]="postSearch()"
                (ngModelChange)="postSearch.set($event)"
                placeholder="Buscar publicación por nombre, descripción, colonia, dirección o autor..."
                class="w-full pl-10 pr-9 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
              <span class="absolute left-3.5 top-2 text-slate-400 text-sm">🔍</span>
              @if (postSearch()) {
                <button
                  type="button"
                  (click)="postSearch.set('')"
                  class="absolute right-2.5 top-1.5 w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              }
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <select
                [ngModel]="selectedPostTypeFilter()"
                (ngModelChange)="selectedPostTypeFilter.set($event)"
                class="px-3 py-2 rounded-xl liquid-glass-input text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Todas las Categorías</option>
                <option value="ANIMAL_HERIDO">Animal Herido</option>
                <option value="EN_RESGUARDO">En Resguardo</option>
                <option value="EN_ADOPCION">En Adopción</option>
                <option value="SE_BUSCA">Se Busca</option>
                <option value="CAMPANA_COMUNITARIA">Campaña Comunitaria</option>
              </select>

              <select
                [ngModel]="selectedPostStatusFilter()"
                (ngModelChange)="selectedPostStatusFilter.set($event)"
                class="px-3 py-2 rounded-xl liquid-glass-input text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Todos los Estados</option>
                <option value="BUSQUEDA_ACTIVA">Activa</option>
                <option value="AVISTADA_RECIENTEMENTE">Avistada</option>
                <option value="REENCONTRADA">Resuelta / Reencontrada</option>
                <option value="CERRADO">Cerrada</option>
              </select>

              <button
                type="button"
                (click)="loadLostReports()"
                class="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

          @if (isLoadingPosts()) {
            <div class="py-20 flex justify-center">
              <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (filteredLostReports().length === 0) {
            <div class="text-center py-16 liquid-glass rounded-3xl space-y-2">
              <span class="text-4xl block">📣</span>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300">No se encontraron publicaciones en el muro</p>
            </div>
          } @else {
            <div class="liquid-glass rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs sm:text-sm">
                  <thead class="bg-slate-200/50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    <tr>
                      <th class="py-3.5 px-4 sm:px-6">Publicación</th>
                      <th class="py-3.5 px-4">Categoría</th>
                      <th class="py-3.5 px-4">Ubicación</th>
                      <th class="py-3.5 px-4">Autor</th>
                      <th class="py-3.5 px-4">Estado</th>
                      <th class="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200/60 dark:divide-slate-800/80">
                    @for (post of filteredLostReports(); track post.id) {
                      <tr class="hover:bg-white/40 dark:hover:bg-slate-800/30 transition-colors">
                        <td class="py-4 px-4 sm:px-6 max-w-xs">
                          <div class="font-bold text-slate-900 dark:text-white">{{ post.petName || 'Sin nombre' }} · {{ post.species }}</div>
                          <div class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{{ post.distinctiveFeatures }}</div>
                        </td>
                        <td class="py-4 px-4">
                          <span
                            class="px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap"
                            [ngClass]="getPostTypeMeta(post.type).badgeClass"
                          >
                            {{ getPostTypeMeta(post.type).label }}
                          </span>
                        </td>
                        <td class="py-4 px-4 text-xs text-slate-600 dark:text-slate-300">
                          <div class="font-semibold">{{ post.colonia?.name || 'Dolores Hidalgo' }}</div>
                          <div class="text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{{ post.lastSeenLocation }}</div>
                        </td>
                        <td class="py-4 px-4 text-xs">
                          <div class="font-semibold text-slate-800 dark:text-slate-200">{{ post.reporter?.fullName || 'Usuario' }}</div>
                          <div class="font-mono text-slate-500 dark:text-slate-400">{{ post.contactPhone }}</div>
                        </td>
                        <td class="py-4 px-4">
                          <select
                            [ngModel]="post.status"
                            (ngModelChange)="onUpdatePostStatus(post, $event)"
                            class="px-2.5 py-1 rounded-lg text-[11px] font-bold liquid-glass-input cursor-pointer"
                          >
                            <option value="BUSQUEDA_ACTIVA">Activa</option>
                            <option value="AVISTADA_RECIENTEMENTE">Avistada</option>
                            <option value="REENCONTRADA">Resuelta</option>
                            <option value="CERRADO">Cerrada</option>
                          </select>
                        </td>
                        <td class="py-4 px-4 sm:px-6 text-right space-x-2 whitespace-nowrap">
                          <a
                            [routerLink]="['/publicacion', post.id]"
                            class="px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/20 inline-block"
                          >
                            Ver
                          </a>
                          <button
                            type="button"
                            (click)="onDeleteLostReport(post)"
                            class="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- ========================================================= -->
      <!-- TAB 7: DIRECTORIO DE ALIADOS COMERCIALES                  -->
      <!-- ========================================================= -->
      @if (activeTab() === 'allies') {
        <div class="space-y-6 animate-fade-in">
          <div class="liquid-glass p-4 rounded-2xl flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shadow-md">
            <div class="relative flex-1">
              <input
                type="text"
                [ngModel]="allySearch()"
                (ngModelChange)="allySearch.set($event)"
                placeholder="Buscar aliado por nombre, dirección, colonia, teléfono o promoción..."
                class="w-full pl-10 pr-9 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
              <span class="absolute left-3.5 top-2 text-slate-400 text-sm">🔍</span>
              @if (allySearch()) {
                <button
                  type="button"
                  (click)="allySearch.set('')"
                  class="absolute right-2.5 top-1.5 w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              }
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <select
                [ngModel]="selectedAllyCategoryFilter()"
                (ngModelChange)="selectedAllyCategoryFilter.set($event)"
                class="px-3 py-2 rounded-xl liquid-glass-input text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Todas las Categorías</option>
                @for (cat of allyCategoryOptions; track cat.value) {
                  <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
                }
              </select>

              <button
                type="button"
                (click)="openAllyModal()"
                class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                + Nuevo Aliado
              </button>
            </div>
          </div>

          @if (isLoadingAllies()) {
            <div class="py-20 flex justify-center">
              <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (filteredAllies().length === 0) {
            <div class="text-center py-16 liquid-glass rounded-3xl space-y-2">
              <span class="text-4xl block">🏪</span>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300">No se encontraron aliados con esos filtros</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (ally of filteredAllies(); track ally.id) {
                <div class="liquid-glass p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col justify-between gap-4">
                  <div class="space-y-2">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {{ getAllyCategoryLabel(ally.category) }}
                        </div>
                        <h4 class="text-base font-black text-slate-900 dark:text-white">{{ ally.businessName }}</h4>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                          [ngClass]="ally.isActive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'"
                        >
                          {{ ally.isActive ? 'Activo' : 'Oculto' }}
                        </span>
                      </div>
                    </div>

                    <p class="text-xs text-slate-600 dark:text-slate-300">
                      📍 {{ ally.address }} @if (ally.colonia?.name) { · Col. {{ ally.colonia?.name }} }
                    </p>
                    <p class="text-xs font-mono text-slate-500 dark:text-slate-400">
                      📞 {{ ally.phone }} @if (ally.whatsappPhone) { · 💬 WA {{ ally.whatsappPhone }} }
                    </p>

                    @if (ally.hasPromotionForAdopters && ally.promotionDescription) {
                      <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                        🎁 <strong>Convenio:</strong> {{ ally.promotionDescription }}
                      </div>
                    }
                  </div>

                  <div class="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <button
                      type="button"
                      (click)="toggleAllyActive(ally)"
                      class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer"
                      [ngClass]="ally.isActive ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'"
                    >
                      {{ ally.isActive ? 'Ocultar' : 'Activar' }}
                    </button>
                    <button
                      type="button"
                      (click)="openAllyModal(ally)"
                      class="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-bold cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ========================================================= -->
      <!-- MODAL DE RESOLUCIÓN DE DENUNCIA                           -->
      <!-- ========================================================= -->
      @if (resolvingReport()) {
        <div class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
          <div class="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-black text-slate-900 dark:text-white">Dictaminar Denuncia</h3>
              <button
                type="button"
                (click)="resolvingReport.set(null)"
                class="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nuevo Estado</label>
                <select
                  [(ngModel)]="reportResolutionForm.status"
                  class="w-full px-3 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white font-semibold"
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_REVISION">En Revisión</option>
                  <option value="SANCIONADO">Sancionado (Infracción confirmada)</option>
                  <option value="DESESTIMADO">Desestimado (Sin infracción)</option>
                </select>
              </div>
              <div>
                <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Notas de resolución</label>
                <textarea
                  [(ngModel)]="reportResolutionForm.adminNotes"
                  rows="3"
                  placeholder="Describe la acción tomada..."
                  class="w-full px-3 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white"
                ></textarea>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                (click)="resolvingReport.set(null)"
                class="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="submitReportResolution()"
                [disabled]="isSavingReport()"
                class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer disabled:opacity-50"
              >
                {{ isSavingReport() ? 'Guardando...' : 'Guardar Dictamen' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================= -->
      <!-- MODAL DE ALIADO COMERCIAL (CREAR / EDITAR)                -->
      <!-- ========================================================= -->
      @if (isAllyModalOpen()) {
        <div class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl overflow-y-auto">
          <div class="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-black text-slate-900 dark:text-white">
                {{ editingAllyId() ? 'Editar Aliado Comercial' : 'Nuevo Aliado Comercial' }}
              </h3>
              <button
                type="button"
                (click)="isAllyModalOpen.set(false)"
                class="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="sm:col-span-2">
                <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nombre del negocio *</label>
                <input
                  type="text"
                  [(ngModel)]="allyForm.businessName"
                  [class.border-rose-500]="allyAttempted() && !allyForm.businessName.trim()"
                  class="w-full px-3 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white"
                  placeholder="Ej. Veterinaria San Roque"
                />
                @if (allyAttempted() && !allyForm.businessName.trim()) {
                  <p class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">Ingresa el nombre del negocio o aliado.</p>
                }
              </div>
              <div>
                <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Categoría *</label>
                <select
                  [(ngModel)]="allyForm.category"
                  class="w-full px-3 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white"
                >
                  @for (cat of allyCategoryOptions; track cat.value) {
                    <option [value]="cat.value">{{ cat.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Colonia</label>
                <select
                  [(ngModel)]="allyForm.coloniaId"
                  class="w-full px-3 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white"
                >
                  <option value="">Sin especificar</option>
                  @for (col of colonias(); track col.id) {
                    <option [value]="col.id">{{ col.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Teléfono *</label>
                <input
                  type="text"
                  [(ngModel)]="allyForm.phone"
                  [class.border-rose-500]="allyAttempted() && !allyForm.phone.trim()"
                  class="w-full px-3 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white"
                  placeholder="4181820000"
                />
                @if (allyAttempted() && !allyForm.phone.trim()) {
                  <p class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">Ingresa un teléfono de contacto.</p>
                }
              </div>
              <div>
                <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">WhatsApp</label>
                <input
                  type="text"
                  [(ngModel)]="allyForm.whatsappPhone"
                  class="w-full px-3 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white"
                  placeholder="4181820000"
                />
              </div>
              <div class="sm:col-span-2">
                <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Dirección *</label>
                <input
                  type="text"
                  [(ngModel)]="allyForm.address"
                  [class.border-rose-500]="allyAttempted() && !allyForm.address.trim()"
                  class="w-full px-3 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white"
                  placeholder="Calle, número y colonia en Dolores Hidalgo"
                />
                @if (allyAttempted() && !allyForm.address.trim()) {
                  <p class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">Indica la dirección del establecimiento.</p>
                }
              </div>
              <div class="sm:col-span-2">
                <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Descripción / Servicios</label>
                <textarea
                  [(ngModel)]="allyForm.description"
                  rows="2"
                  class="w-full px-3 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white"
                ></textarea>
              </div>
              <div class="sm:col-span-2 flex items-center gap-2 pt-1">
                <input type="checkbox" id="allyPromo" [(ngModel)]="allyForm.hasPromotionForAdopters" class="rounded" />
                <label for="allyPromo" class="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Tiene promoción especial para adoptantes Huellitas
                </label>
              </div>
              @if (allyForm.hasPromotionForAdopters) {
                <div class="sm:col-span-2">
                  <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Detalle de la promoción</label>
                  <input
                    type="text"
                    [(ngModel)]="allyForm.promotionDescription"
                    class="w-full px-3 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white"
                    placeholder="Ej. 20% de descuento en primera consulta"
                  />
                </div>
              }
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                (click)="isAllyModalOpen.set(false)"
                class="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="saveAllyModal()"
                [disabled]="isSavingAlly()"
                class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer disabled:opacity-50"
              >
                {{ isSavingAlly() ? 'Guardando...' : 'Guardar Aliado' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================= -->
      <!-- MODAL EXCLUSIVO DE ADMIN: EDITAR AVISO DE PRIVACIDAD      -->
      <!-- ========================================================= -->
      @if (isPrivacyEditorOpen() && isAdmin()) {
        <div class="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-2xl overflow-hidden animate-fade-in">
          <div class="w-full h-full max-h-[96dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col overflow-hidden">
            
            <!-- Header -->
            <div class="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl">
                  📜
                </div>
                <div>
                  <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Editar Aviso de Privacidad y Versión Legal
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    Exclusivo para Administradores · Modifica las cláusulas legales que verán todos los usuarios.
                  </p>
                </div>
              </div>
              <button
                type="button"
                (click)="isPrivacyEditorOpen.set(false)"
                class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            <!-- Form Body -->
            <div class="flex-1 overflow-y-auto py-4 pr-1 space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Versión Legal *
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="privacyEditorForm.version"
                    placeholder="Ej: 2026-v2.0"
                    [class.border-rose-500]="privacyAttempted() && !privacyEditorForm.version.trim()"
                    class="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  @if (privacyAttempted() && !privacyEditorForm.version.trim()) {
                    <p class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">Indica el código de versión legal (ej. 2026-v2.0).</p>
                  }
                </div>
                <div class="sm:col-span-2">
                  <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Título del Documento *
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="privacyEditorForm.title"
                    placeholder="Aviso de Privacidad Integral y Términos Legales"
                    class="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Mensaje Destacado de Consentimiento (Banner Superior)
                </label>
                <textarea
                  [(ngModel)]="privacyEditorForm.introBanner"
                  rows="2"
                  placeholder="Mensaje introductorio de consentimiento..."
                  class="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Cláusulas y Contenido del Aviso de Privacidad *
                  </label>
                  <button
                    type="button"
                    (click)="restoreDefaultPrivacyText()"
                    class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    ↺ Restaurar texto predeterminado
                  </button>
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Separa cada cláusula con una línea en blanco. La primera línea de cada bloque se mostrará como subtítulo en negritas.
                </p>
                <textarea
                  [(ngModel)]="privacyEditorForm.content"
                  rows="11"
                  placeholder="Escribe aquí las cláusulas del Aviso de Privacidad..."
                  [class.border-rose-500]="privacyAttempted() && !privacyEditorForm.content.trim()"
                  class="w-full px-3.5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
                ></textarea>
                @if (privacyAttempted() && !privacyEditorForm.content.trim()) {
                  <p class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">Redacta el contenido del Aviso de Privacidad antes de publicar.</p>
                }
              </div>

              <label class="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="privacyEditorForm.invalidateUsers"
                  class="mt-0.5 w-4 h-4 rounded text-emerald-500 border-slate-300 dark:border-slate-700"
                />
                <div class="text-xs">
                  <span class="font-bold text-amber-800 dark:text-amber-300 block">
                    Solicitar aceptación obligatoria a todos los usuarios registrados
                  </span>
                  <span class="text-[11px] text-slate-600 dark:text-slate-400">
                    Si está activo, invalidará la aceptación anterior para que todos los usuarios lean y acepten este nuevo Aviso de Privacidad al ingresar.
                  </span>
                </div>
              </label>
            </div>

            <!-- Footer -->
            <div class="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                (click)="isPrivacyEditorOpen.set(false)"
                class="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="savePrivacyPolicyChanges()"
                [disabled]="isSavingPrivacyPolicy()"
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                @if (isSavingPrivacyPolicy()) {
                  <span>Guardando...</span>
                } @else {
                  <span>💾 Guardar y Publicar Aviso Legal</span>
                }
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
})
export class AdminComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private petService = inject(PetService);
  private auditService = inject(AuditService);
  private moderationService = inject(ModerationService);
  private lostPetService = inject(LostPetService);
  private allyService = inject(AllyService);
  private coloniaService = inject(ColoniaService);
  private notification = inject(NotificationService);
  private confirmService = inject(ConfirmService);
  private authService = inject(AuthService);

  private logSearchTimer: ReturnType<typeof setTimeout> | null = null;

  activeTab = signal<
    'monitoring' | 'audit' | 'users' | 'pets' | 'moderation' | 'posts' | 'allies'
  >('monitoring');

  // Role & catalog metadata
  activeRoleOptions = ACTIVE_ROLE_OPTIONS;
  legacyRoleOptions = LEGACY_ROLE_OPTIONS;
  allyCategoryOptions = ALLY_CATEGORY_OPTIONS;

  // Stats State
  stats = signal<SystemStats | null>(null);
  isLoadingStats = signal(false);

  // Audit Logs State
  auditLogs = signal<AuditLog[]>([]);
  isLoadingLogs = signal(false);
  totalLogs = signal(0);
  logsPage = signal(1);
  logsTotalPages = signal(1);
  selectedActionFilter = signal('');
  logSearch = signal('');

  // Users State (Signals required for Zoneless Angular computed() tracking)
  users = signal<User[]>([]);
  isLoadingUsers = signal(false);
  userSearch = signal('');
  selectedRoleFilter = signal('');
  selectedUserStatusFilter = signal('');

  // Pets State
  pets = signal<Pet[]>([]);
  isLoadingPets = signal(false);
  petSearch = signal('');
  selectedPetSpeciesFilter = signal('');
  selectedPetStatusFilter = signal('');

  // Moderation Reports State
  reports = signal<ContentReport[]>([]);
  isLoadingReports = signal(false);
  moderationSearch = signal('');
  selectedModerationStatus = signal('');
  resolvingReport = signal<ContentReport | null>(null);
  isSavingReport = signal(false);
  reportResolutionForm: { status: ContentReportStatus; adminNotes: string } = {
    status: 'SANCIONADO',
    adminNotes: '',
  };

  // Community Posts State
  lostReports = signal<LostPetReport[]>([]);
  isLoadingPosts = signal(false);
  postSearch = signal('');
  selectedPostTypeFilter = signal('');
  selectedPostStatusFilter = signal('');

  // Allies State
  allies = signal<Ally[]>([]);
  colonias = signal<Colonia[]>([]);
  isLoadingAllies = signal(false);
  allySearch = signal('');
  selectedAllyCategoryFilter = signal('');
  isAllyModalOpen = signal(false);
  editingAllyId = signal<string | null>(null);
  isSavingAlly = signal(false);
  allyAttempted = signal(false);
  allyForm: {
    businessName: string;
    category: AllyCategory;
    phone: string;
    whatsappPhone: string;
    coloniaId: string;
    address: string;
    description: string;
    hasPromotionForAdopters: boolean;
    promotionDescription: string;
  } = {
    businessName: '',
    category: 'VETERINARIA',
    phone: '',
    whatsappPhone: '',
    coloniaId: '',
    address: '',
    description: '',
    hasPromotionForAdopters: false,
    promotionDescription: '',
  };

  // Privacy Policy Editor State (Admin Exclusive)
  isPrivacyEditorOpen = signal(false);
  isSavingPrivacyPolicy = signal(false);
  privacyAttempted = signal(false);
  privacyEditorForm = {
    version: '2026-v1.0',
    title: DEFAULT_PRIVACY_POLICY_CONFIG.title,
    introBanner: DEFAULT_PRIVACY_POLICY_CONFIG.introBanner,
    content: DEFAULT_PRIVACY_POLICY_CONFIG.content,
    invalidateUsers: true,
  };

  UserRole = UserRole;

  currentAdminId = computed(() => this.authService.currentUser()?.id);
  isAdmin = computed(() => this.authService.isAdmin());
  currentPrivacyVersion = computed(() => this.authService.privacyPolicy().version || '2026-v1.0');

  pendingReportsCount = computed(
    () => this.reports().filter((r) => r.status === 'PENDIENTE').length,
  );

  roleCompositionBars = computed(() => {
    const byRole = this.stats()?.users?.byRole;
    const countsByValue: Record<string, number> = {
      [UserRole.USUARIO_GENERAL]: byRole?.usuarioGeneral ?? 0,
      [UserRole.ADOPTANTE_VERIFICADO]: byRole?.adoptanteVerificado ?? 0,
      [UserRole.RESCATISTA_VERIFICADO]: byRole?.rescatistaVerificado ?? 0,
      [UserRole.ALBERGUE]: byRole?.albergue ?? 0,
      [UserRole.CLINICA_ALIADA]: byRole?.clinicaAliada ?? 0,
      [UserRole.ADMIN]: byRole?.admin ?? 0,
      [UserRole.PET_OWNER]: byRole?.petOwner ?? 0,
      [UserRole.VETERINARIAN]: byRole?.veterinarian ?? 0,
    };

    return ALL_ROLE_OPTIONS.filter((opt) => !opt.isLegacy || (countsByValue[opt.value] || 0) > 0).map(
      (opt) => ({
        key: opt.value,
        label: opt.label,
        count: countsByValue[opt.value] || 0,
        barClass: opt.barClass,
        textClass: opt.textClass,
      }),
    );
  });

  filteredUsers = computed(() => {
    let result = this.users();
    const roleFilter = this.selectedRoleFilter();
    const statusFilter = this.selectedUserStatusFilter();
    const query = normalizeSearchText(this.userSearch());

    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (statusFilter === 'ACTIVE') {
      result = result.filter((u) => u.isActive);
    } else if (statusFilter === 'SUSPENDED') {
      result = result.filter((u) => !u.isActive);
    }
    if (query) {
      result = result.filter(
        (u) =>
          normalizeSearchText(u.fullName).includes(query) ||
          normalizeSearchText(u.email).includes(query) ||
          normalizeSearchText(u.phone).includes(query) ||
          normalizeSearchText(u.colonia?.name).includes(query),
      );
    }
    return result;
  });

  filteredPets = computed(() => {
    let result = this.pets();
    const speciesFilter = this.selectedPetSpeciesFilter();
    const statusFilter = this.selectedPetStatusFilter();
    const query = normalizeSearchText(this.petSearch());

    if (speciesFilter) {
      result = result.filter((p) => {
        const sp = normalizeSearchText(p.species);
        if (speciesFilter === 'perro') return sp === 'perro' || sp === 'canino';
        if (speciesFilter === 'gato') return sp === 'gato' || sp === 'felino';
        return sp !== 'perro' && sp !== 'canino' && sp !== 'gato' && sp !== 'felino';
      });
    }
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (query) {
      result = result.filter(
        (p) =>
          normalizeSearchText(p.name).includes(query) ||
          normalizeSearchText(p.species).includes(query) ||
          normalizeSearchText(p.breed).includes(query) ||
          normalizeSearchText(p.microchipNumber).includes(query) ||
          normalizeSearchText(p.owner?.fullName).includes(query) ||
          normalizeSearchText(p.owner?.email).includes(query),
      );
    }
    return result;
  });

  filteredReports = computed(() => {
    let result = this.reports();
    const status = this.selectedModerationStatus();
    const query = normalizeSearchText(this.moderationSearch());

    if (status) {
      result = result.filter((r) => r.status === status);
    }
    if (query) {
      result = result.filter(
        (r) =>
          normalizeSearchText(r.description).includes(query) ||
          normalizeSearchText(r.reason).includes(query) ||
          normalizeSearchText(r.targetId).includes(query) ||
          normalizeSearchText(r.reporterUser?.fullName).includes(query) ||
          normalizeSearchText(r.reporterUser?.email).includes(query),
      );
    }
    return result;
  });

  filteredLostReports = computed(() => {
    let result = this.lostReports();
    const typeFilter = this.selectedPostTypeFilter();
    const statusFilter = this.selectedPostStatusFilter();
    const query = normalizeSearchText(this.postSearch());

    if (typeFilter) {
      result = result.filter((r) => r.type === typeFilter);
    }
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (query) {
      result = result.filter(
        (r) =>
          normalizeSearchText(r.petName).includes(query) ||
          normalizeSearchText(r.species).includes(query) ||
          normalizeSearchText(r.distinctiveFeatures).includes(query) ||
          normalizeSearchText(r.lastSeenLocation).includes(query) ||
          normalizeSearchText(r.colonia?.name).includes(query) ||
          normalizeSearchText(r.reporter?.fullName).includes(query) ||
          normalizeSearchText(r.contactPhone).includes(query),
      );
    }
    return result;
  });

  filteredAllies = computed(() => {
    let result = this.allies();
    const categoryFilter = this.selectedAllyCategoryFilter();
    const query = normalizeSearchText(this.allySearch());

    if (categoryFilter) {
      result = result.filter((a) => a.category === categoryFilter);
    }
    if (query) {
      result = result.filter(
        (a) =>
          normalizeSearchText(a.businessName).includes(query) ||
          normalizeSearchText(a.address).includes(query) ||
          normalizeSearchText(a.colonia?.name).includes(query) ||
          normalizeSearchText(a.phone).includes(query) ||
          normalizeSearchText(a.promotionDescription).includes(query),
      );
    }
    return result;
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadPets();
    this.loadAuditLogs(1);
    this.loadModerationReports();
    this.loadLostReports();
    this.loadAllies();
    this.coloniaService.getAll().subscribe({
      next: (data) => this.colonias.set(data),
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    if (this.logSearchTimer) {
      clearTimeout(this.logSearchTimer);
      this.logSearchTimer = null;
    }
  }

  switchTab(
    tab: 'monitoring' | 'audit' | 'users' | 'pets' | 'moderation' | 'posts' | 'allies',
  ): void {
    this.activeTab.set(tab);
    if (tab === 'monitoring') this.loadStats();
    if (tab === 'audit') this.loadAuditLogs(this.logsPage());
    if (tab === 'users') this.loadUsers();
    if (tab === 'pets') this.loadPets();
    if (tab === 'moderation') this.loadModerationReports();
    if (tab === 'posts') this.loadLostReports();
    if (tab === 'allies') this.loadAllies();
  }

  onLogSearchChange(value: string): void {
    this.logSearch.set(value);
    if (this.logSearchTimer) {
      clearTimeout(this.logSearchTimer);
    }
    this.logSearchTimer = setTimeout(() => {
      this.loadAuditLogs(1);
    }, 300);
  }

  clearUserFilters(): void {
    this.userSearch.set('');
    this.selectedRoleFilter.set('');
    this.selectedUserStatusFilter.set('');
  }

  exportUsersCsv(): void {
    const rows = this.filteredUsers().map((u) => [
      u.fullName,
      u.email,
      u.phone || '',
      getRoleMeta(u.role)?.label || u.role,
      `Nivel ${u.verificationLevel ?? 0}`,
      u.colonia?.name || '',
      u.isActive ? 'Activo' : 'Suspendido',
      u.acceptedPrivacyVersion || 'Pendiente',
      u.createdAt,
    ]);
    downloadCsv(
      `huellitas-usuarios-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Nombre', 'Correo', 'Teléfono', 'Rol', 'Verificación', 'Colonia', 'Estado', 'Términos', 'Registro'],
      rows,
    );
    this.notification.success('CSV exportado', `Se descargaron ${rows.length} usuarios filtrados.`);
  }

  loadStats(): void {
    this.isLoadingStats.set(true);
    this.auditService.getSystemStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false),
    });
  }

  loadAuditLogs(page = 1): void {
    this.isLoadingLogs.set(true);
    this.auditService
      .getLogs(page, 20, this.selectedActionFilter(), this.logSearch().trim())
      .subscribe({
        next: (data) => {
          this.auditLogs.set(data.data);
          this.totalLogs.set(data.total);
          this.logsPage.set(data.page);
          this.logsTotalPages.set(data.totalPages);
          this.isLoadingLogs.set(false);
        },
        error: () => this.isLoadingLogs.set(false),
      });
  }

  loadUsers(): void {
    this.isLoadingUsers.set(true);
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoadingUsers.set(false);
      },
      error: () => this.isLoadingUsers.set(false),
    });
  }

  loadPets(): void {
    this.isLoadingPets.set(true);
    this.petService.getAll().subscribe({
      next: (data) => {
        this.pets.set(data);
        this.isLoadingPets.set(false);
      },
      error: () => this.isLoadingPets.set(false),
    });
  }

  loadModerationReports(): void {
    this.isLoadingReports.set(true);
    this.moderationService.getReports().subscribe({
      next: (data) => {
        this.reports.set(data);
        this.isLoadingReports.set(false);
      },
      error: () => this.isLoadingReports.set(false),
    });
  }

  loadLostReports(): void {
    this.isLoadingPosts.set(true);
    this.lostPetService.getAll().subscribe({
      next: (data) => {
        this.lostReports.set(data);
        this.isLoadingPosts.set(false);
      },
      error: () => this.isLoadingPosts.set(false),
    });
  }

  loadAllies(): void {
    this.isLoadingAllies.set(true);
    this.allyService.getAllAdmin().subscribe({
      next: (data) => {
        this.allies.set(data);
        this.isLoadingAllies.set(false);
      },
      error: () => this.isLoadingAllies.set(false),
    });
  }

  getRoleSelectClass(role: UserRole): string {
    return getRoleMeta(role)?.selectClass || 'text-slate-700 dark:text-slate-300';
  }

  getAdoptionStatusBadge(status?: string) {
    return (
      ADOPTION_STATUS_META[status || 'NO_EN_ADOPCION'] ||
      ADOPTION_STATUS_META['NO_EN_ADOPCION']
    );
  }

  getReportStatusMeta(status: ContentReportStatus) {
    return REPORT_STATUS_META[status] || REPORT_STATUS_META['PENDIENTE'];
  }

  getReportReasonLabel(reason: ContentReport['reason']) {
    return REPORT_REASON_LABELS[reason] || reason;
  }

  getReportTargetLabel(target: ContentReport['targetType']) {
    return REPORT_TARGET_LABELS[target] || target;
  }

  getPostTypeMeta(type: LostPetType | string) {
    return (
      LOST_PET_TYPE_LABELS[type] || {
        label: type,
        badgeClass: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      }
    );
  }

  getAllyCategoryLabel(category: AllyCategory) {
    const match = ALLY_CATEGORY_OPTIONS.find((c) => c.value === category);
    return match ? `${match.icon} ${match.label}` : category;
  }

  calcPercentage(value: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  }

  getActionBadgeClass(action: string): string {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      case 'LOGIN_FAILED':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      case 'LOGIN_BLOCKED':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30';
      case 'USER_REGISTERED':
        return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30';
      case 'SYSTEM_ERROR':
        return 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 font-black';
      case 'THROTTLE_BLOCKED':
        return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40';
      case 'LOGOUT':
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30';
      default:
        return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  }

  async onUpdateUserRole(user: User, newRole: UserRole): Promise<void> {
    if (user.role === newRole) return;

    if (newRole === UserRole.ADMIN) {
      const confirmed = await this.confirmService.confirm({
        title: 'Asignar rol de Administrador',
        message: `¿Confirmas otorgar permisos totales de Administrador a ${user.fullName}?`,
        submessage: 'Tendrá acceso completo al centro de mando, usuarios y registros.',
        confirmText: 'Sí, otorgar Admin',
        cancelText: 'Cancelar',
        type: 'danger',
        icon: '🛡️',
      });
      if (!confirmed) {
        this.loadUsers();
        return;
      }
    }

    const roleLabel = getRoleMeta(newRole)?.label || newRole;
    this.userService.update(user.id, { role: newRole }).subscribe({
      next: () => {
        this.notification.success('Rol actualizado', `Se asignó "${roleLabel}" a ${user.fullName}`);
        this.loadUsers();
        this.loadStats();
      },
      error: () => this.loadUsers(),
    });
  }

  onUpdateUserVerificationLevel(user: User, level: number): void {
    if ((user.verificationLevel ?? 0) === level) return;
    this.userService.update(user.id, { verificationLevel: level }).subscribe({
      next: () => {
        this.notification.success(
          'Verificación actualizada',
          `${user.fullName} ahora tiene Nivel ${level}.`,
        );
        this.loadUsers();
      },
      error: () => this.loadUsers(),
    });
  }

  onToggleUserStatus(user: User): void {
    const nextStatus = !user.isActive;
    this.userService.update(user.id, { isActive: nextStatus }).subscribe({
      next: () => {
        this.notification.info(
          'Estado actualizado',
          `Usuario ${user.fullName} ahora está ${nextStatus ? 'Activo' : 'Suspendido'}`,
        );
        this.loadUsers();
        this.loadStats();
      },
    });
  }

  openResolveReportModal(report: ContentReport): void {
    this.resolvingReport.set(report);
    this.reportResolutionForm = {
      status: report.status === 'PENDIENTE' ? 'SANCIONADO' : report.status,
      adminNotes: report.adminResolutionNotes || '',
    };
  }

  submitReportResolution(): void {
    const report = this.resolvingReport();
    if (!report) return;
    this.isSavingReport.set(true);
    this.moderationService
      .resolveReport(report.id, {
        status: this.reportResolutionForm.status,
        adminNotes: this.reportResolutionForm.adminNotes.trim(),
      })
      .subscribe({
        next: () => {
          this.isSavingReport.set(false);
          this.resolvingReport.set(null);
          this.notification.success('Dictamen guardado', 'La denuncia fue actualizada correctamente.');
          this.loadModerationReports();
          this.loadStats();
        },
        error: () => {
          this.isSavingReport.set(false);
          this.notification.error('Error', 'No se pudo actualizar la denuncia.');
        },
      });
  }

  onUpdatePostStatus(post: LostPetReport, status: LostPetStatus): void {
    if (post.status === status) return;
    this.lostPetService.updateStatus(post.id, status).subscribe({
      next: () => {
        const label = LOST_PET_STATUS_META[status]?.label || status;
        this.notification.success('Estado actualizado', `La publicación ahora está "${label}".`);
        this.loadLostReports();
        this.loadStats();
      },
      error: () => this.loadLostReports(),
    });
  }

  async onDeleteLostReport(post: LostPetReport): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar publicación del muro',
      message: `¿Archivar la publicación "${post.petName || 'Sin nombre'}"?`,
      submessage: 'Dejará de aparecer en el muro comunitario público.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: '📣',
    });
    if (!confirmed) return;

    this.lostPetService.delete(post.id).subscribe({
      next: () => {
        this.notification.success('Publicación archivada', 'El reporte fue retirado del muro.');
        this.loadLostReports();
        this.loadStats();
      },
    });
  }

  openAllyModal(ally?: Ally): void {
    if (ally) {
      this.editingAllyId.set(ally.id);
      this.allyForm = {
        businessName: ally.businessName,
        category: ally.category,
        phone: ally.phone,
        whatsappPhone: ally.whatsappPhone || '',
        coloniaId: ally.coloniaId || '',
        address: ally.address,
        description: ally.description || '',
        hasPromotionForAdopters: ally.hasPromotionForAdopters,
        promotionDescription: ally.promotionDescription || '',
      };
    } else {
      this.editingAllyId.set(null);
      this.allyForm = {
        businessName: '',
        category: 'VETERINARIA',
        phone: '',
        whatsappPhone: '',
        coloniaId: '',
        address: '',
        description: '',
        hasPromotionForAdopters: false,
        promotionDescription: '',
      };
    }
    this.allyAttempted.set(false);
    this.isAllyModalOpen.set(true);
  }

  saveAllyModal(): void {
    this.allyAttempted.set(true);
    if (!this.allyForm.businessName.trim() || !this.allyForm.phone.trim() || !this.allyForm.address.trim()) {
      this.notification.warning('Campos obligatorios', 'Indica nombre, teléfono y dirección del aliado.');
      return;
    }

    const payload: Partial<Ally> = {
      businessName: this.allyForm.businessName.trim(),
      category: this.allyForm.category,
      phone: this.allyForm.phone.trim(),
      whatsappPhone: this.allyForm.whatsappPhone.trim() || undefined,
      coloniaId: this.allyForm.coloniaId || undefined,
      address: this.allyForm.address.trim(),
      description: this.allyForm.description.trim() || undefined,
      hasPromotionForAdopters: this.allyForm.hasPromotionForAdopters,
      promotionDescription: this.allyForm.hasPromotionForAdopters
        ? this.allyForm.promotionDescription.trim() || undefined
        : undefined,
    };

    this.isSavingAlly.set(true);
    const editId = this.editingAllyId();
    const request$ = editId
      ? this.allyService.update(editId, payload)
      : this.allyService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSavingAlly.set(false);
        this.isAllyModalOpen.set(false);
        this.notification.success(
          editId ? 'Aliado actualizado' : 'Aliado registrado',
          `${payload.businessName} guardado correctamente.`,
        );
        this.loadAllies();
        this.loadStats();
      },
      error: () => {
        this.isSavingAlly.set(false);
        this.notification.error('Error', 'No se pudo guardar la información del aliado.');
      },
    });
  }

  toggleAllyActive(ally: Ally): void {
    const nextState = !ally.isActive;
    this.allyService.update(ally.id, { isActive: nextState }).subscribe({
      next: () => {
        this.notification.info(
          'Estado de aliado actualizado',
          `${ally.businessName} ahora está ${nextState ? 'Visible en el directorio' : 'Oculto'}.`,
        );
        this.loadAllies();
        this.loadStats();
      },
    });
  }

  async onDeleteUser(user: User): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar usuario',
      message: `¿Estás seguro de eliminar a ${user.fullName}?`,
      submessage: 'Se eliminarán también todas sus mascotas asociadas de la base de datos.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: '👤',
    });
    if (!confirmed) return;

    this.userService.delete(user.id).subscribe({
      next: () => {
        this.notification.success('Usuario eliminado', `La cuenta de ${user.fullName} fue eliminada`);
        this.loadUsers();
        this.loadPets();
        this.loadStats();
      },
    });
  }

  async onDeletePet(pet: Pet): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Dar de baja mascota',
      message: `¿Estás seguro de dar de baja el registro de ${pet.name}?`,
      submessage: 'La ficha se archivará con baja lógica en el sistema.',
      confirmText: 'Sí, dar de baja',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: '🗑️',
    });
    if (!confirmed) return;

    this.petService.delete(pet.id).subscribe({
      next: () => {
        this.notification.success('Mascota dada de baja', `${pet.name} fue archivada`);
        this.loadPets();
        this.loadStats();
      },
    });
  }

  onInvalidatePrivacyVersion(): void {
    if (!this.isAdmin()) {
      this.notification.error('Acceso denegado', 'Solo el rol de Administrador puede editar el Aviso de Privacidad.');
      return;
    }

    const active = this.authService.privacyPolicy();
    this.privacyEditorForm = {
      version: active.version || '2026-v2.0',
      title: active.title || DEFAULT_PRIVACY_POLICY_CONFIG.title,
      introBanner: active.introBanner || DEFAULT_PRIVACY_POLICY_CONFIG.introBanner,
      content: active.content || DEFAULT_PRIVACY_POLICY_CONFIG.content,
      invalidateUsers: true,
    };
    this.privacyAttempted.set(false);
    this.isPrivacyEditorOpen.set(true);

    this.userService.getPrivacyPolicy().subscribe({
      next: (policy) => {
        if (policy?.content) {
          this.privacyEditorForm = {
            version: policy.version || '2026-v2.0',
            title: policy.title || DEFAULT_PRIVACY_POLICY_CONFIG.title,
            introBanner: policy.introBanner || DEFAULT_PRIVACY_POLICY_CONFIG.introBanner,
            content: policy.content || DEFAULT_PRIVACY_POLICY_CONFIG.content,
            invalidateUsers: true,
          };
        }
      },
      error: () => {},
    });
  }

  restoreDefaultPrivacyText(): void {
    this.privacyEditorForm = {
      ...this.privacyEditorForm,
      title: DEFAULT_PRIVACY_POLICY_CONFIG.title,
      introBanner: DEFAULT_PRIVACY_POLICY_CONFIG.introBanner,
      content: DEFAULT_PRIVACY_POLICY_CONFIG.content,
    };
    this.notification.info('Texto restaurado', 'Se cargó la redacción predeterminada del Aviso de Privacidad.');
  }

  savePrivacyPolicyChanges(): void {
    if (!this.isAdmin()) return;
    this.privacyAttempted.set(true);
    if (!this.privacyEditorForm.version.trim() || !this.privacyEditorForm.content.trim()) {
      this.notification.warning('Campos obligatorios', 'Indica la versión legal y el contenido del Aviso de Privacidad.');
      return;
    }

    this.isSavingPrivacyPolicy.set(true);
    this.userService
      .resetPrivacyTerms({
        newVersion: this.privacyEditorForm.version.trim(),
        title: this.privacyEditorForm.title.trim() || DEFAULT_PRIVACY_POLICY_CONFIG.title,
        introBanner: this.privacyEditorForm.introBanner.trim(),
        content: this.privacyEditorForm.content.trim(),
        invalidateUsers: this.privacyEditorForm.invalidateUsers,
      })
      .subscribe({
        next: (res) => {
          this.isSavingPrivacyPolicy.set(false);
          this.isPrivacyEditorOpen.set(false);
          if (res?.policy) {
            this.authService.applyUpdatedPrivacyPolicy(res.policy);
          } else {
            this.authService.refreshPrivacyPolicy();
          }
          this.notification.success(
            'Aviso de Privacidad Actualizado',
            res?.message || 'Se guardó el nuevo Aviso de Privacidad y se actualizó la versión legal.',
          );
          this.loadUsers();
          this.loadStats();
        },
        error: () => {
          this.isSavingPrivacyPolicy.set(false);
          this.notification.error('Error', 'No se pudo actualizar el Aviso de Privacidad.');
        },
      });
  }
}
