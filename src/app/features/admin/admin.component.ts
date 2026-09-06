import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { PetService } from '../../core/services/pet.service';
import { AuditService } from '../../core/services/audit.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { User, UserRole } from '../../core/models/user.model';
import { Pet } from '../../core/models/pet.model';
import { AuditLog, SystemStats } from '../../core/models/audit-log.model';

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

        <!-- Tab Selector Pills -->
        <div class="flex flex-wrap items-center p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-950/60 border border-slate-300/60 dark:border-slate-800 gap-1">
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
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🐾</span>
            <span>Mascotas ({{ pets().length }})</span>
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

            <div class="flex items-center gap-4 text-xs font-mono text-slate-700 dark:text-slate-300">
              <div class="bg-white/40 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span class="text-slate-400 text-[10px] uppercase block">Tiempo Activo:</span>
                <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ stats()?.system?.uptime || 'Activo' }}</span>
              </div>
              <div class="bg-white/40 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
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
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mascotas Registradas</span>
                <span class="text-xl">🐾</span>
              </div>
              <div class="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {{ stats()?.pets?.total || pets().length }}
              </div>
              <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Expedientes clínicos y cartillas activas
              </div>
            </div>

            <!-- Card 3: Inicios de Sesión Hoy -->
            <div class="liquid-glass-card p-5 rounded-3xl shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Accesos Hoy</span>
                <span class="text-xl">🔑</span>
              </div>
              <div class="mt-2 text-3xl font-black text-cyan-600 dark:text-cyan-400">
                {{ stats()?.security?.loginsSuccessToday || 0 }}
              </div>
              <div class="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Autenticaciones JWT exitosas en las últimas 24h
              </div>
            </div>

            <!-- Card 4: Seguridad & Intentos Fallidos -->
            <div class="liquid-glass-card p-5 rounded-3xl shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Alertas de Seguridad</span>
                <span class="text-xl">🛡️</span>
              </div>
              <div class="mt-2 text-3xl font-black" [ngClass]="(stats()?.security?.loginsFailedToday || 0) > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'">
                {{ stats()?.security?.totalSecurityAlerts || 0 }}
              </div>
              <div class="mt-2 text-xs text-slate-600 dark:text-slate-400">
                <span class="text-rose-500 font-bold">{{ stats()?.security?.loginsFailedToday || 0 }} fallos hoy</span> mitigados por seguridad
              </div>
            </div>

          </div>

          <!-- Deep Breakdown Grids -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Desglose de Usuarios por Rol -->
            <div class="liquid-glass p-6 rounded-3xl shadow-xl space-y-4">
              <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>👤</span>
                <span>Composición de Usuarios por Rol</span>
              </h3>
              
              <div class="space-y-3">
                <!-- Administradores -->
                <div>
                  <div class="flex justify-between text-xs font-bold mb-1">
                    <span class="text-rose-600 dark:text-rose-400">Administradores</span>
                    <span class="text-slate-700 dark:text-slate-300">{{ stats()?.users?.byRole?.admin || 0 }}</span>
                  </div>
                  <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      class="bg-rose-500 h-full rounded-full transition-all duration-500"
                      [style.width.%]="calcPercentage(stats()?.users?.byRole?.admin || 0, stats()?.users?.total || 1)"
                    ></div>
                  </div>
                </div>

                <!-- Veterinarios -->
                <div>
                  <div class="flex justify-between text-xs font-bold mb-1">
                    <span class="text-teal-600 dark:text-teal-400">Médicos Veterinarios</span>
                    <span class="text-slate-700 dark:text-slate-300">{{ stats()?.users?.byRole?.veterinarian || 0 }}</span>
                  </div>
                  <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      class="bg-teal-500 h-full rounded-full transition-all duration-500"
                      [style.width.%]="calcPercentage(stats()?.users?.byRole?.veterinarian || 0, stats()?.users?.total || 1)"
                    ></div>
                  </div>
                </div>

                <!-- Dueños -->
                <div>
                  <div class="flex justify-between text-xs font-bold mb-1">
                    <span class="text-emerald-600 dark:text-emerald-400">Dueños de Mascotas</span>
                    <span class="text-slate-700 dark:text-slate-300">{{ stats()?.users?.byRole?.petOwner || 0 }}</span>
                  </div>
                  <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      [style.width.%]="calcPercentage(stats()?.users?.byRole?.petOwner || 0, stats()?.users?.total || 1)"
                    ></div>
                  </div>
                </div>
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
          <div class="liquid-glass p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-md">
            <!-- Search bar -->
            <div class="relative flex-1">
              <input
                type="text"
                [(ngModel)]="logSearch"
                (keyup.enter)="loadAuditLogs(1)"
                placeholder="Buscar por IP, correo, detalle o recurso..."
                class="w-full pl-10 pr-4 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
              <span class="absolute left-3.5 top-2 text-slate-400 text-sm">🔍</span>
            </div>

            <!-- Action type filter -->
            <div class="flex items-center gap-2">
              <select
                [(ngModel)]="selectedActionFilter"
                (ngModelChange)="loadAuditLogs(1)"
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
          <div class="liquid-glass p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-md">
            <div class="relative flex-1">
              <input
                type="text"
                [(ngModel)]="userSearch"
                placeholder="Buscar usuario por nombre o correo..."
                class="w-full pl-10 pr-4 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
              <span class="absolute left-3.5 top-2 text-slate-400 text-sm">🔍</span>
            </div>

            <div class="flex items-center gap-2">
              <select
                [(ngModel)]="selectedRoleFilter"
                class="px-3 py-2 rounded-xl liquid-glass-input text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Todos los Roles</option>
                <option [value]="UserRole.ADMIN">Administradores</option>
                <option [value]="UserRole.VETERINARIAN">Veterinarios</option>
                <option [value]="UserRole.PET_OWNER">Dueños</option>
              </select>

              <button
                type="button"
                (click)="onInvalidatePrivacyVersion()"
                class="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Invalidar la aprobación para obligar a todos los usuarios a aceptar una nueva versión de términos"
              >
                <span>📜</span>
                <span>Actualizar Versión Legal</span>
              </button>
            </div>
          </div>

          <!-- Users Table / Cards -->
          @if (isLoadingUsers()) {
            <div class="py-20 flex justify-center">
              <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (filteredUsers().length === 0) {
            <div class="text-center py-16 liquid-glass rounded-3xl">
              <span class="text-4xl">👥</span>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">No se encontraron usuarios</p>
            </div>
          } @else {
            <div class="liquid-glass rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs sm:text-sm">
                  <thead class="bg-slate-200/50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    <tr>
                      <th class="py-3.5 px-4 sm:px-6">Usuario</th>
                      <th class="py-3.5 px-4">Teléfono</th>
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
                        </td>
                        <td class="py-4 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {{ user.phone || 'Sin registrar' }}
                        </td>
                        <td class="py-4 px-4">
                          <!-- Select dropdown to immediately assign/change role -->
                          <select
                            [ngModel]="user.role"
                            (ngModelChange)="onUpdateUserRole(user, $event)"
                            [disabled]="user.id === currentAdminId()"
                            class="px-2.5 py-1 rounded-lg text-xs font-bold liquid-glass-input cursor-pointer focus:outline-none focus:border-emerald-500"
                            [ngClass]="{
                              'text-rose-600 dark:text-rose-400': user.role === UserRole.ADMIN,
                              'text-teal-600 dark:text-teal-400': user.role === UserRole.VETERINARIAN,
                              'text-sky-600 dark:text-sky-400': user.role === UserRole.PET_OWNER
                            }"
                          >
                            <option [value]="UserRole.ADMIN">Administrador</option>
                            <option [value]="UserRole.VETERINARIAN">Veterinario</option>
                            <option [value]="UserRole.PET_OWNER">Dueño de Mascota</option>
                          </select>
                        </td>
                        <td class="py-4 px-4">
                          @if (user.acceptedPrivacyVersion === '2026-v1.0') {
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
          <!-- Pet Search -->
          <div class="liquid-glass p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-md">
            <div class="relative flex-1">
              <input
                type="text"
                [(ngModel)]="petSearch"
                placeholder="Buscar mascota por nombre, especie, chip o dueño..."
                class="w-full pl-10 pr-4 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
              <span class="absolute left-3.5 top-2 text-slate-400 text-sm">🔍</span>
            </div>

            <a
              routerLink="/pets/new"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>+</span>
              <span>Registrar Mascota</span>
            </a>
          </div>

          <!-- Pets Table / Cards -->
          @if (isLoadingPets()) {
            <div class="py-20 flex justify-center">
              <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (filteredPets().length === 0) {
            <div class="text-center py-16 liquid-glass rounded-3xl">
              <span class="text-4xl">🐾</span>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">No se encontraron mascotas registradas</p>
            </div>
          } @else {
            <div class="liquid-glass rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs sm:text-sm">
                  <thead class="bg-slate-200/50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    <tr>
                      <th class="py-3.5 px-4 sm:px-6">Mascota</th>
                      <th class="py-3.5 px-4">Especie / Raza</th>
                      <th class="py-3.5 px-4">Dueño Registrado</th>
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

    </div>
  `,
})
export class AdminComponent implements OnInit {
  private userService = inject(UserService);
  private petService = inject(PetService);
  private auditService = inject(AuditService);
  private notification = inject(NotificationService);
  private authService = inject(AuthService);

  activeTab = signal<'monitoring' | 'audit' | 'users' | 'pets'>('monitoring');

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

  // Users State
  users = signal<User[]>([]);
  isLoadingUsers = signal(false);
  userSearch = '';
  selectedRoleFilter = '';

  // Pets State
  pets = signal<Pet[]>([]);
  isLoadingPets = signal(false);
  petSearch = '';

  UserRole = UserRole;

  currentAdminId = computed(() => this.authService.currentUser()?.id);

  filteredUsers = computed(() => {
    let result = this.users();
    if (this.selectedRoleFilter) {
      result = result.filter((u) => u.role === this.selectedRoleFilter);
    }
    if (this.userSearch.trim()) {
      const q = this.userSearch.toLowerCase();
      result = result.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q)),
      );
    }
    return result;
  });

  filteredPets = computed(() => {
    let result = this.pets();
    if (this.petSearch.trim()) {
      const q = this.petSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.species.toLowerCase().includes(q) ||
          (p.microchipNumber && p.microchipNumber.toLowerCase().includes(q)) ||
          (p.owner && p.owner.fullName.toLowerCase().includes(q)),
      );
    }
    return result;
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadPets();
    this.loadAuditLogs(1);
  }

  switchTab(tab: 'monitoring' | 'audit' | 'users' | 'pets'): void {
    this.activeTab.set(tab);
    if (tab === 'monitoring') this.loadStats();
    if (tab === 'audit') this.loadAuditLogs(this.logsPage());
    if (tab === 'users') this.loadUsers();
    if (tab === 'pets') this.loadPets();
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
      .getLogs(page, 20, this.selectedActionFilter(), this.logSearch())
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

  onUpdateUserRole(user: User, newRole: UserRole): void {
    if (user.role === newRole) return;

    this.userService.update(user.id, { role: newRole }).subscribe({
      next: () => {
        this.notification.success('Rol actualizado', `Se asignó el rol ${newRole} a ${user.fullName}`);
        this.loadUsers();
        this.loadStats();
      },
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

  onDeleteUser(user: User): void {
    if (confirm(`¿Estás seguro de eliminar a ${user.fullName}? Se eliminarán también todas sus mascotas asociadas.`)) {
      this.userService.delete(user.id).subscribe({
        next: () => {
          this.notification.success('Usuario eliminado', `La cuenta de ${user.fullName} fue eliminada`);
          this.loadUsers();
          this.loadPets();
          this.loadStats();
        },
      });
    }
  }

  onDeletePet(pet: Pet): void {
    if (confirm(`¿Estás seguro de eliminar el registro de ${pet.name}?`)) {
      this.petService.delete(pet.id).subscribe({
        next: () => {
          this.notification.success('Mascota eliminada', `${pet.name} fue eliminada`);
          this.loadPets();
          this.loadStats();
        },
      });
    }
  }

  onInvalidatePrivacyVersion(): void {
    const isConfirmed = confirm(
      '¿Deseas invalidar la aprobación del Aviso de Privacidad para TODOS los usuarios? Esto obligará a todos los usuarios a leer y aceptar la nueva versión antes de poder seguir utilizando la aplicación.'
    );
    if (!isConfirmed) return;

    this.userService.resetPrivacyTerms('2026-v2.0').subscribe({
      next: (res) => {
        this.notification.success('Aviso Legal Actualizado', res.message || 'Se ha reiniciado el estado de aprobación legal para todos los usuarios.');
        this.loadUsers();
        this.loadStats();
      },
      error: () => {
        this.notification.error('Error', 'No se pudo actualizar el estado de los términos.');
      },
    });
  }
}
