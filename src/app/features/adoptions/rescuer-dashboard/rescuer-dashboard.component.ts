import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdoptionService } from '../../../core/services/adoption.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import {
  AdoptionRequest,
  AdoptionFollowup,
  AdoptionRequestStatus,
  AdopterVerification,
} from '../../../core/models/adoption.model';
import { UserRole } from '../../../core/models/user.model';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';

@Component({
  selector: 'app-rescuer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <!-- Header -->
      <section class="liquid-glass rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden border border-emerald-500/20">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4 text-center sm:text-left">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 flex-shrink-0">
              📋
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Panel del Rescatista y Evaluación
              </h1>
              <p class="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                Gestión de solicitudes de adopción, aprobación de niveles 2 y 3 de adoptantes y seguimientos 7, 30 y 90 días.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="refreshData()"
              [disabled]="isRefreshing()"
              class="px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50 border border-slate-200 dark:border-slate-700"
              title="Actualizar bandeja"
            >
              <span [class.animate-spin]="isRefreshing()">🔄</span>
              <span>Actualizar</span>
            </button>

            <a
              routerLink="/adopciones"
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1 hover:brightness-105 transition-all"
            >
              <span>+</span> Publicar en Adopción
            </a>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
          <button
            (click)="activeTab.set('REQUESTS')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
            [ngClass]="activeTab() === 'REQUESTS' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            📥 Solicitudes de Adopción ({{ requests().length }})
          </button>

          <button
            (click)="activeTab.set('VERIFICATIONS')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5"
            [ngClass]="activeTab() === 'VERIFICATIONS' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            <span>🛡️ Aprobar Niveles 2 y 3</span>
            @if (pendingVerificationsCount() > 0) {
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {{ pendingVerificationsCount() }}
              </span>
            }
          </button>

          <button
            (click)="activeTab.set('FOLLOWUPS')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
            [ngClass]="activeTab() === 'FOLLOWUPS' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            🗓️ Seguimientos 7, 30 y 90 Días ({{ followups().length }})
          </button>
        </div>
      </section>

      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-16 text-center space-y-3">
          <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-xs font-bold text-slate-500">Cargando bandeja de control...</p>
        </div>
      } @else {
        <!-- TAB 1: SOLICITUDES DE ADOPCIÓN -->
        @if (activeTab() === 'REQUESTS') {
          <section class="space-y-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1 text-xs">
              <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Detección en tiempo real activa
                </span>
                <span class="text-[11px] text-slate-500">
                  Última sincronización: <strong>{{ lastUpdatedFormatted() }}</strong>
                </span>
              </div>
            </div>

            @if (requests().length === 0) {
              <div class="liquid-glass rounded-3xl p-12 text-center space-y-3">
                <span class="text-4xl">📭</span>
                <p class="text-sm font-bold text-slate-800 dark:text-white">No tienes solicitudes pendientes</p>
                <p class="text-xs text-slate-500">Cuando un adoptante postule para una de tus mascotas en el Muro, aparecerá aquí.</p>
              </div>
            } @else {
              <div class="grid grid-cols-1 gap-4">
                @for (req of requests(); track req.id) {
                  <div class="liquid-glass rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 border border-slate-200/80 dark:border-slate-800">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div class="flex items-center gap-3">
                        <img
                          [src]="req.pet?.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80'"
                          [alt]="req.pet?.name"
                          class="w-14 h-14 rounded-2xl object-cover shadow-sm border"
                        />
                        <div>
                          <h3 class="text-base font-bold text-slate-900 dark:text-white">
                            Interés por: {{ req.pet?.name || 'Mascota' }}
                          </h3>
                          <p class="text-xs text-slate-500">
                            Candidato: <strong>{{ req.adopter?.fullName }}</strong> (Nivel {{ req.adopter?.verificationLevel ?? 1 }})
                          </p>
                        </div>
                      </div>

                      <span
                        class="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                        [ngClass]="getStatusBadge(req.status)"
                      >
                        {{ req.status }}
                      </span>
                    </div>

                    @if (req.adopterMessage) {
                      <div class="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-emerald-500/20 shadow-inner text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                        <div class="flex items-center gap-1.5 font-bold text-[11px] text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">
                          <span>📋</span>
                          <span>Respuestas y Compromisos del Protocolo de Adopción:</span>
                        </div>
                        <div class="pl-1 text-slate-700 dark:text-slate-300">
                          {{ req.adopterMessage }}
                        </div>
                      </div>
                    }

                    <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div class="flex flex-wrap items-center gap-2">
                        @if (req.adopter?.id) {
                          <button
                            type="button"
                            (click)="contactAdopterInApp(req)"
                            class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md hover:from-teal-400 hover:to-emerald-300 cursor-pointer"
                          >
                            <span>💬</span> Mensaje en Huellitas
                          </button>
                        }
                        @if (req.adopter?.phone) {
                          <a
                            [href]="getAdopterWhatsAppUrl(req)"
                            target="_blank"
                            class="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                            title="Contactar también por WhatsApp"
                          >
                            <span>📲</span> WhatsApp Adoptante
                          </a>
                        }
                      </div>

                      @if (req.status === 'PENDIENTE') {
                        <div class="flex items-center gap-2">
                          <button
                            (click)="updateStatus(req.id, 'APROBADA')"
                            class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                          >
                            ✓ Aprobar Adopción
                          </button>
                          <button
                            (click)="updateStatus(req.id, 'RECHAZADA')"
                            class="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold cursor-pointer"
                          >
                            ✕ Desestimar
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </section>
        }

        <!-- TAB 2: APROBACIÓN DE VERIFICACIONES DE ADOPTANTES (NIVELES 2 Y 3) -->
        @if (activeTab() === 'VERIFICATIONS') {
          <section class="space-y-4">
            <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-slate-700 dark:text-slate-300">
              🛡️ <strong>Control de Seguridad de Adoptantes:</strong> Ningún usuario puede auto-asignarse el Nivel 2 o el Nivel 3. Como Rescatista Verificado o Administrador, aquí puedes revisar sus respuestas socioambientales y autorizar cada nivel.
            </div>

            @if (verifications().length === 0) {
              <div class="liquid-glass rounded-3xl p-12 text-center space-y-3">
                <span class="text-4xl">🛡️</span>
                <p class="text-sm font-bold text-slate-800 dark:text-white">No hay solicitudes de verificación registradas</p>
                <p class="text-xs text-slate-500">Cuando un ciudadano envíe su Cuestionario Nivel 2 o Carta Compromiso Nivel 3, aparecerá aquí para tu aprobación.</p>
              </div>
            } @else {
              <div class="grid grid-cols-1 gap-4">
                @for (ver of verifications(); track ver.id) {
                  <div class="liquid-glass rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 border border-slate-200/80 dark:border-slate-800">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                      <div>
                        <h3 class="text-base font-black text-slate-900 dark:text-white">
                          {{ ver.user?.fullName || 'Ciudadano Solicitud' }}
                        </h3>
                        <p class="text-xs text-slate-500">
                          📧 {{ ver.user?.email }} • 📱 {{ ver.user?.phone || 'Sin teléfono' }}
                        </p>
                      </div>

                      <div class="flex flex-wrap items-center gap-2 text-[11px] font-extrabold">
                        <span
                          class="px-2.5 py-1 rounded-full border"
                          [ngClass]="
                            ver.isLevel2Completed
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : ver.level2Status === 'PENDIENTE'
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                                : ver.level2Status === 'RECHAZADO'
                                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent'
                          "
                        >
                          Nivel 2: {{ ver.isLevel2Completed ? '✓ Aprobado' : ver.level2Status === 'RECHAZADO' ? '⚠️ Con Observación' : ver.level2Status || 'Pendiente' }}
                        </span>

                        <span
                          class="px-2.5 py-1 rounded-full border"
                          [ngClass]="
                            ver.isLevel3Completed
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : ver.level3Status === 'PENDIENTE'
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                                : ver.level3Status === 'RECHAZADO'
                                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent'
                          "
                        >
                          Nivel 3: {{ ver.isLevel3Completed ? '✓ Aprobado' : ver.level3Status === 'RECHAZADO' ? '⚠️ Con Observación' : ver.level3Status || 'No solicitado' }}
                        </span>
                      </div>
                    </div>

                    @if (ver.reviewNotes && (ver.level2Status === 'RECHAZADO' || ver.level3Status === 'RECHAZADO')) {
                      <div class="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-xs flex items-start justify-between gap-3">
                        <div class="flex items-start gap-2.5">
                          <span class="text-base">💬</span>
                          <div>
                            <strong class="block font-black text-amber-700 dark:text-amber-300 uppercase text-[10px]">
                              Observación activa enviada al solicitante:
                            </strong>
                            <p class="mt-0.5 text-slate-800 dark:text-slate-200">{{ ver.reviewNotes }}</p>
                          </div>
                        </div>
                      </div>
                    }

                    <!-- Questionnaire Answers -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                      <div>
                        <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Tipo de Vivienda</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200">{{ ver.housingType }} (Permite mascotas: {{ ver.landlordAllowsPets ? 'Sí' : 'No' }})</span>
                      </div>
                      <div>
                        <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Habitantes del Hogar</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200">{{ ver.peopleInHome || 'No especificado' }}</span>
                      </div>
                      <div>
                        <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Experiencia Previa</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200">{{ ver.previousExperience || 'No especificado' }}</span>
                      </div>
                      <div>
                        <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Plan ante Mudanza / Viajes</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200">{{ ver.relocationPlan || 'No especificado' }}</span>
                      </div>
                      <div class="sm:col-span-2">
                        <span class="text-[10px] font-extrabold uppercase text-slate-400 block">Responsable Financiero Veterinario</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200">{{ ver.financialResponsible || 'No especificado' }}</span>
                      </div>
                      @if (ver.signedCommitmentLetter) {
                        <div class="sm:col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 font-bold">
                          📜 Carta Compromiso de Nivel 3 firmada digitalmente por el solicitante.
                        </div>
                      }
                    </div>

                    <!-- Reviewer Actions -->
                    <div class="flex flex-wrap items-center justify-end gap-2 pt-2">
                      @if (!ver.isLevel2Completed) {
                        <button
                          type="button"
                          (click)="reviewAdopterLevel(ver, 2, true)"
                          class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                        >
                          ✓ Aprobar Nivel 2
                        </button>
                        <button
                          type="button"
                          (click)="reviewAdopterLevel(ver, 2, false)"
                          class="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer"
                        >
                          ✕ Rechazar Nivel 2
                        </button>
                      } @else if (ver.isLevel2Completed && !ver.isLevel3Completed && (ver.level3Status === 'PENDIENTE' || ver.signedCommitmentLetter)) {
                        <button
                          type="button"
                          (click)="reviewAdopterLevel(ver, 3, true)"
                          class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                        >
                          ✓ Aprobar Nivel 3 (Adoptante Verificado)
                        </button>
                        <button
                          type="button"
                          (click)="reviewAdopterLevel(ver, 3, false)"
                          class="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer"
                        >
                          ✕ Rechazar Nivel 3
                        </button>
                      } @else if (ver.isLevel3Completed) {
                        <span class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          ✅ Expediente Completo (Nivel 3 Autorizado)
                        </span>
                      } @else {
                        <span class="text-xs text-slate-500">
                          Nivel 2 aprobado • Esperando que el usuario firme su Carta Compromiso (Nivel 3)
                        </span>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </section>
        }

        <!-- TAB 3: SEGUIMIENTOS POST-ADOPCIÓN 7, 30 Y 90 DÍAS -->
        @if (activeTab() === 'FOLLOWUPS') {
          <section class="space-y-4">
            <div class="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 text-xs text-slate-700 dark:text-slate-300">
              💡 <strong>Protocolo Oficial Huellitas Dolores Hidalgo:</strong> Los seguimientos a los 7, 30 y 90 días previenen el abandono secundario y verifican la adaptación familiar. Utiliza el botón prellenado para solicitar su fotografía con 1 clic por WhatsApp.
            </div>

            @if (followups().length === 0) {
              <div class="liquid-glass rounded-3xl p-12 text-center space-y-3">
                <span class="text-4xl">🐾</span>
                <p class="text-sm font-bold text-slate-800 dark:text-white">Sin seguimientos activos aún</p>
                <p class="text-xs text-slate-500">Se programarán automáticamente a los 7, 30 y 90 días tras aprobar una adopción.</p>
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @for (fol of followups(); track fol.id) {
                  <div class="liquid-glass rounded-3xl p-5 shadow-xl space-y-3 border border-slate-200/80 dark:border-slate-800">
                    <div class="flex items-center justify-between">
                      <span class="px-3 py-1 rounded-full text-xs font-black uppercase bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30">
                        Hito: {{ fol.dayMilestone }} Días
                      </span>
                      <span class="text-[11px] font-bold text-slate-400">
                        Fecha: {{ fol.scheduledDate | slice:0:10 }}
                      </span>
                    </div>

                    <div>
                      <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                        Mascota: {{ fol.pet?.name || 'Mascota Adoptada' }}
                      </h4>
                      <p class="text-xs text-slate-500">
                        Adoptante: {{ fol.adopter?.fullName || 'Familia adoptante' }}
                      </p>
                    </div>

                    <div class="text-xs">
                      <span class="font-bold text-slate-600 dark:text-slate-300">Estado: </span>
                      <span class="font-black text-emerald-600 dark:text-emerald-400">{{ fol.status }}</span>
                    </div>

                    @if (fol.proofPhotoUrl) {
                      <div class="w-full h-36 rounded-xl overflow-hidden border">
                        <img [src]="fol.proofPhotoUrl" alt="Foto de bienestar recibida" class="w-full h-full object-cover" />
                      </div>
                    }

                    <!-- Actions -->
                    <div class="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center gap-2">
                      @if (fol.adopter?.id) {
                        <button
                          type="button"
                          (click)="contactFollowupAdopterInApp(fol)"
                          class="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1 shadow-md hover:from-teal-400 hover:to-emerald-300 cursor-pointer"
                        >
                          <span>💬</span> Pedir Foto por Huellitas
                        </button>
                      }
                      <a
                        [href]="fol.prefilledWhatsappUrl || getFollowupWhatsAppUrl(fol)"
                        target="_blank"
                        class="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs text-center flex items-center justify-center gap-1 shadow-sm"
                        title="Pedir foto por WhatsApp"
                      >
                        <span>📲</span> WhatsApp
                      </a>

                      @if (fol.status !== 'COMPLETADO') {
                        <button
                          (click)="registerProofModal(fol)"
                          class="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                        >
                          📷 Registrar
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </section>
        }
      }

    </div>
  `,
})
export class RescuerDashboardComponent implements OnInit, OnDestroy {
  brand = BRAND_CONFIG;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private adoptionService = inject(AdoptionService);
  public authService = inject(AuthService);
  private notify = inject(NotificationService);
  private confirmService = inject(ConfirmService);
  private dmService = inject(DirectMessageService);

  activeTab = signal<'REQUESTS' | 'VERIFICATIONS' | 'FOLLOWUPS'>('REQUESTS');
  requests = signal<AdoptionRequest[]>([]);
  verifications = signal<AdopterVerification[]>([]);
  followups = signal<AdoptionFollowup[]>([]);
  isLoading = signal<boolean>(true);
  isRefreshing = signal<boolean>(false);
  lastUpdated = signal<Date>(new Date());

  pendingVerificationsCount = computed(() => {
    return this.verifications().filter(
      (v) => v.level2Status === 'PENDIENTE' || v.level3Status === 'PENDIENTE',
    ).length;
  });

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const role = this.authService.currentUser()?.role;
    if (role !== UserRole.RESCATISTA_VERIFICADO && role !== UserRole.ALBERGUE && role !== UserRole.ADMIN) {
      this.notify.error('Acceso denegado', 'Esta vista es exclusiva para rescatistas verificados y administradores.');
      this.router.navigate(['/dashboard']);
      return;
    }

    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'verifications') {
      this.activeTab.set('VERIFICATIONS');
    }

    this.loadData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.pollTimer = setInterval(() => {
      this.silentRefresh();
    }, 20000);
  }

  stopAutoRefresh(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  lastUpdatedFormatted(): string {
    const d = this.lastUpdated();
    return d.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  silentRefresh(): void {
    this.adoptionService.getPublisherInbox().subscribe({
      next: (newReqs) => {
        this.requests.set(newReqs || []);
        this.lastUpdated.set(new Date());
      },
    });
    this.adoptionService.getVerificationsForReview().subscribe({
      next: (vers) => this.verifications.set(vers || []),
      error: () => {},
    });
  }

  refreshData(): void {
    this.isRefreshing.set(true);
    this.adoptionService.getPublisherInbox().subscribe({
      next: (reqs) => {
        this.requests.set(reqs || []);
        this.adoptionService.getVerificationsForReview().subscribe({
          next: (vers) => this.verifications.set(vers || []),
          error: () => {},
        });
        this.adoptionService.getFollowups().subscribe({
          next: (fols) => {
            this.followups.set(fols || []);
            this.isRefreshing.set(false);
            this.lastUpdated.set(new Date());
            this.notify.success('Bandeja actualizada');
          },
          error: () => this.isRefreshing.set(false),
        });
      },
      error: () => this.isRefreshing.set(false),
    });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.adoptionService.getPublisherInbox().subscribe({
      next: (reqs) => {
        this.requests.set(reqs || []);
        this.adoptionService.getVerificationsForReview().subscribe({
          next: (vers) => this.verifications.set(vers || []),
          error: () => {},
        });
        this.adoptionService.getFollowups().subscribe({
          next: (fols) => {
            this.followups.set(fols || []);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false),
        });
      },
      error: () => this.isLoading.set(false),
    });
  }

  async reviewAdopterLevel(ver: AdopterVerification, level: 2 | 3, approved: boolean): Promise<void> {
    let notes: string | undefined;
    if (!approved) {
      const input = await this.confirmService.prompt({
        title: `Observaciones para Nivel ${level}`,
        message: `Indica al adoptante ${ver.user?.fullName || ''} qué debe corregir o ampliar:`,
        inputPlaceholder: 'Ej: Por favor especifica quién cuidará a la mascota si sales de viaje...',
        confirmText: 'Enviar Observaciones',
        cancelText: 'Cancelar',
        type: 'warning',
        icon: '📝',
      });
      if (!input) return;
      notes = input;
    }

    this.adoptionService.reviewVerification(ver.id, { level, approved, notes }).subscribe({
      next: () => {
        this.notify.success(
          approved
            ? `¡Nivel ${level} aprobado para ${ver.user?.fullName || 'el adoptante'}!`
            : `Observaciones enviadas para Nivel ${level}`,
        );
        this.loadData();
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'No se pudo procesar la evaluación');
      },
    });
  }

  updateStatus(requestId: string, status: AdoptionRequestStatus): void {
    this.adoptionService.updateRequestStatus(requestId, status).subscribe({
      next: () => {
        this.notify.success(`Solicitud marcada como ${status}`);
        this.loadData();
      },
      error: (err) => this.notify.error(err.error?.message || 'Error al actualizar estatus'),
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'APROBADA':
        return 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30';
      case 'RECHAZADA':
        return 'bg-rose-500/20 text-rose-600 border border-rose-500/30';
      default:
        return 'bg-amber-500/20 text-amber-600 border border-amber-500/30';
    }
  }

  getAdopterWhatsAppUrl(req: AdoptionRequest): string {
    const phone = req.adopter?.phone || '';
    const text = encodeURIComponent(
      `¡Hola ${req.adopter?.fullName}! Te escribo de ${this.brand.name} Dolores Hidalgo sobre tu solicitud para adoptar a ${req.pet?.name}. ¿Cuándo tendrías oportunidad de platicar o realizar una visita de conocimiento?`,
    );
    return `https://wa.me/52${phone.replace(/\D/g, '')}?text=${text}`;
  }

  contactAdopterInApp(req: AdoptionRequest): void {
    if (!req.adopter?.id) return;
    this.dmService.openChatWithContext({
      recipientId: req.adopter.id,
      recipientName: req.adopter.fullName,
      contextType: 'ADOPTION_REQUEST',
      contextId: req.pet?.id || req.id,
      contextTitle: `Solicitud de ${req.adopter.fullName} para ${req.pet?.name || 'Mascota'}`,
      contextSubtitle: `Estado actual: ${req.status} • Dolores Hidalgo`,
      contextImageUrl: req.pet?.photoUrl || req.pet?.photos?.[0],
      contextTargetUrl: req.pet ? `/adopciones/${req.pet.id}` : '/panel-rescatista',
      contextWhatsappPhone: req.adopter.phone || undefined,
      prefilledDraft: `¡Hola ${req.adopter.fullName.split(' ')[0]}! Revisé tu solicitud para adoptar a ${req.pet?.name || 'nuestro peludito'}. ¿Cuándo tendrías oportunidad de platicar o realizar una visita de conocimiento? 💚`,
    });
  }

  contactFollowupAdopterInApp(fol: AdoptionFollowup): void {
    if (!fol.adopter?.id) return;
    this.dmService.openChatWithContext({
      recipientId: fol.adopter.id,
      recipientName: fol.adopter.fullName,
      contextType: 'FOLLOWUP',
      contextId: fol.id,
      contextTitle: `Seguimiento de ${fol.dayMilestone} días: ${fol.pet?.name || 'Mascota'}`,
      contextSubtitle: `Hito programado: ${fol.scheduledDate?.slice(0, 10)} • Dolores Hidalgo`,
      contextImageUrl: fol.pet?.photoUrl || fol.pet?.photos?.[0],
      contextTargetUrl: '/panel-rescatista',
      contextWhatsappPhone: fol.adopter.phone || undefined,
      prefilledDraft: `¡Hola ${fol.adopter.fullName.split(' ')[0]}! Te escribo en el seguimiento de los ${fol.dayMilestone} días de ${fol.pet?.name || 'tu peludito'} 🐾 ¿Nos podrías compartir por aquí una fotito reciente para registrar su carnet de bienestar?`,
    });
  }

  getFollowupWhatsAppUrl(fol: AdoptionFollowup): string {
    const phone = fol.adopter?.phone || '';
    const text = encodeURIComponent(
      `¡Hola! Te escribimos de ${this.brand.name} Dolores Hidalgo en el seguimiento de los ${fol.dayMilestone} días de ${fol.pet?.name || 'tu peludito'}. ¿Cómo ha estado? ¿Nos podrías compartir una fotito reciente para su carnet de bienestar? ¡Muchas gracias!`,
    );
    return `https://wa.me/52${phone.replace(/\D/g, '')}?text=${text}`;
  }

  async registerProofModal(fol: AdoptionFollowup): Promise<void> {
    const photoUrl = await this.confirmService.prompt({
      title: 'Fotografía de Seguimiento',
      message: `Registrar evidencia de bienestar para ${fol.pet?.name || 'la mascota'} (Hito: ${fol.dayMilestone} días)`,
      submessage: 'Ingresa el enlace directo o URL de la fotografía enviada por el adoptante.',
      inputPlaceholder: 'https://...',
      confirmText: 'Registrar Evidencia',
      cancelText: 'Cancelar',
      type: 'info',
      icon: '📸',
    });
    if (photoUrl && photoUrl.trim()) {
      this.adoptionService.registerFollowupProof(fol.id, photoUrl.trim(), 'Fotografía recibida por WhatsApp').subscribe({
        next: () => {
          this.notify.success('¡Foto de seguimiento registrada con éxito!');
          this.loadData();
        },
        error: () => this.notify.error('Error al registrar fotografía'),
      });
    }
  }
}
