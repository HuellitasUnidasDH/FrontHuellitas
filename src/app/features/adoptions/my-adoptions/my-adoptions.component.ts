import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdoptionService } from '../../../core/services/adoption.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ImageUploadService } from '../../../core/services/image-upload.service';
import {
  AdoptionFollowup,
  AdoptionRequest,
  FollowupStatus,
  PublishedPetProgress,
  SignAdoptionAgreementPayload,
} from '../../../core/models/adoption.model';
import { AdoptionAgreementDocumentComponent } from '../shared/adoption-agreement-document.component';
import {
  getMilestoneLabel,
  getRequestStepIndex,
  getStageMeta,
  groupFollowupsByPet,
} from '../shared/adoption-helpers.util';

@Component({
  selector: 'app-my-adoptions',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AdoptionAgreementDocumentComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <!-- Header -->
      <section class="liquid-glass rounded-3xl p-5 sm:p-7 border border-emerald-500/20 shadow-xl space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 flex-shrink-0">
              🐾
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Mis Adopciones y Progreso
              </h1>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                Consulta el avance paso a paso de tus postulaciones, firma tu Convenio Digital y envía tus seguimientos en un solo lugar.
              </p>
            </div>
          </div>

          <a
            routerLink="/verificacion"
            class="px-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-100 hover:brightness-105 transition-all self-start sm:self-center"
          >
            🛡️ Mi Verificación de Adoptante
          </a>
        </div>

        <!-- Tabs -->
        <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-200/70 dark:border-slate-800 text-xs">
          <button
            type="button"
            (click)="activeTab.set('APPLICATIONS')"
            class="px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-all"
            [ngClass]="activeTab() === 'APPLICATIONS' ? 'bg-emerald-500 text-slate-950 font-black shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            📝 Mis Postulaciones ({{ applications().length }})
          </button>

          <button
            type="button"
            (click)="activeTab.set('FOLLOWUPS')"
            class="px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-all"
            [ngClass]="activeTab() === 'FOLLOWUPS' ? 'bg-emerald-500 text-slate-950 font-black shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            📸 Seguimientos de mis Mascotas ({{ followupGroups().length }})
          </button>

          <button
            type="button"
            (click)="activeTab.set('PUBLISHED')"
            class="px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-all"
            [ngClass]="activeTab() === 'PUBLISHED' ? 'bg-emerald-500 text-slate-950 font-black shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            📊 Progreso como Dueño ({{ publishedProgress().length }})
          </button>
        </div>
      </section>

      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-12 text-center space-y-3">
          <div class="text-4xl animate-bounce">🐾</div>
          <p class="text-sm font-bold text-slate-500">Cargando tu historial y progreso de adopción...</p>
        </div>
      } @else {
        <!-- ========================================================== -->
        <!-- TAB 1: MIS POSTULACIONES CON BARRA DE PROGRESO + CONVENIO -->
        <!-- ========================================================== -->
        @if (activeTab() === 'APPLICATIONS') {
          <section class="space-y-4">
            @if (applications().length === 0) {
              <div class="liquid-glass rounded-3xl p-10 text-center space-y-3 border border-dashed border-slate-300 dark:border-slate-700">
                <div class="text-4xl">🐶</div>
                <h3 class="font-black text-slate-900 dark:text-white text-base">Aún no has enviado solicitudes de adopción</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto">
                  Explora las mascotas disponibles en el muro comunitario y envía tu solicitud para iniciar el protocolo oficial de 4 pasos.
                </p>
                <a routerLink="/comunidad" class="inline-block px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">
                  Ver Mascotas en Adopción
                </a>
              </div>
            } @else {
              @for (req of applications(); track req.id) {
                @let stage = stageMeta(req.status);
                @let stepIdx = stepIndex(req);
                <article class="liquid-glass rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-lg space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                      <img
                        [src]="req.pet?.photoUrl || req.pet?.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80'"
                        [alt]="req.pet?.name"
                        class="w-16 h-16 rounded-2xl object-cover shadow-md border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                      <div>
                        <div class="flex flex-wrap items-center gap-2">
                          <h2 class="text-lg font-black text-slate-900 dark:text-white">{{ req.pet?.name }}</h2>
                          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border" [ngClass]="stage.colorClass">
                            {{ stage.label }}
                          </span>
                        </div>
                        <span class="text-xs text-slate-500 block mt-0.5">
                          {{ req.pet?.species }} • {{ req.pet?.breed || 'Mestizo' }} • Enviada el {{ req.createdAt | date:'dd/MM/yyyy' }}
                        </span>
                        @if (req.evaluatedByRescuer) {
                          <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                            Rescatista evaluador: {{ req.evaluatedByRescuer.fullName }}
                          </span>
                        }
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                      @if (req.status === 'ESPERANDO_CONVENIO') {
                        <button
                          type="button"
                          (click)="openAgreementModal(req, 'sign')"
                          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-indigo-500/30 cursor-pointer animate-pulse"
                        >
                          ✍️ Revisar y Firmar Convenio
                        </button>
                      } @else if (req.agreementSignedAt) {
                        <button
                          type="button"
                          (click)="openAgreementModal(req, 'view')"
                          class="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 font-black text-xs cursor-pointer"
                        >
                          📜 Ver / Descargar Convenio PDF
                        </button>
                      }
                      <a
                        [routerLink]="['/adopciones', req.petId]"
                        class="px-3.5 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs"
                      >
                        Ver Ficha
                      </a>
                    </div>
                  </div>

                  <!-- BARRA DE PROGRESO DE 4 PASOS -->
                  <div class="space-y-2 pt-2">
                    <div class="flex items-center justify-between text-xs font-bold">
                      <span class="text-slate-600 dark:text-slate-300">Avance del Protocolo Oficial</span>
                      <span class="font-black text-emerald-600 dark:text-emerald-400">{{ stage.progress }}%</span>
                    </div>
                    <div class="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        [ngClass]="req.status === 'RECHAZADA' || req.status === 'CANCELADA' ? 'bg-rose-400' : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'"
                        [style.width.%]="stage.progress"
                      ></div>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] sm:text-[11px] font-bold">
                      @for (s of stepLabels; track s.num) {
                        <div
                          class="p-2 rounded-xl text-center border"
                          [ngClass]="
                            stepIdx >= s.num
                              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-800 dark:text-emerald-300'
                              : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                          "
                        >
                          <span class="block">{{ s.icon }}</span>
                          <span class="block truncate">{{ s.title }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Detalles o notas del rescatista -->
                  @if (req.homeVisitScheduledAt && req.status === 'VISITA_DOMICILIARIA') {
                    <div class="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-900 dark:text-sky-200">
                      📅 <strong>Visita domiciliaria programada:</strong> {{ req.homeVisitScheduledAt | date:'dd/MM/yyyy HH:mm' }}
                    </div>
                  }
                  @if (req.status === 'ESPERANDO_CONVENIO') {
                    <div class="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-200">
                      🎉 <strong>¡Tu visita domiciliaria fue aprobada!</strong> Haz clic en <strong>"Revisar y Firmar Convenio"</strong> para firmar digitalmente. Recuerda que el cotejo de tu INE será físico y presencial el día de entrega (no subas foto de INE).
                    </div>
                  }
                  @if (req.status === 'CONVENIO_FIRMADO') {
                    <div class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-900 dark:text-purple-200">
                      ✅ <strong>Convenio enviado al rescatista.</strong> Presenta tu INE físicamente el día de la entrega para completar la adopción oficial.
                    </div>
                  }
                  @if (req.publisherNotes) {
                    <div class="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-200">
                      💬 <strong>Nota del Rescatista:</strong> {{ req.publisherNotes }}
                    </div>
                  }
                  @if (req.rejectionReason && req.status === 'RECHAZADA') {
                    <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
                      <strong>Resolución:</strong> {{ req.rejectionReason }}
                    </div>
                  }
                </article>
              }
            }
          </section>
        }

        <!-- ================================================================== -->
        <!-- TAB 2: SEGUIMIENTOS UNIFICADOS POR MASCOTA (TARJETA CONTENEDORA) -->
        <!-- ================================================================== -->
        @if (activeTab() === 'FOLLOWUPS') {
          <section class="space-y-5">
            @if (followupGroups().length === 0) {
              <div class="liquid-glass rounded-3xl p-10 text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700">
                <div class="text-4xl">🗓️</div>
                <h3 class="font-bold text-slate-900 dark:text-white text-base">No tienes seguimientos activos</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto">
                  Cuando formalices una adopción verás aquí una tarjeta por cada mascota con tus hitos de 2 semanas, 1 mes, medio año y 1 año para subir tus fotos directamente.
                </p>
              </div>
            } @else {
              @for (group of followupGroups(); track group.petId) {
                <article class="liquid-glass rounded-3xl p-5 sm:p-6 border border-emerald-500/25 shadow-xl space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                    <div class="flex items-center gap-4">
                      <img
                        [src]="group.pet.photoUrl || group.pet.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80'"
                        [alt]="group.pet.name"
                        class="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-emerald-500/30 flex-shrink-0"
                      />
                      <div class="min-w-0 flex-1">
                        <h2 class="text-xl font-black text-slate-900 dark:text-white">{{ group.pet.name }}</h2>
                        <span class="text-xs text-slate-500 block">
                          Avance del seguimiento: <strong class="text-emerald-600 dark:text-emerald-400">{{ group.completedCount }} de {{ group.totalCount }} hitos validados</strong>
                        </span>
                        <div class="w-full max-w-xs h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-1.5 overflow-hidden">
                          <div
                            class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            [style.width.%]="group.progressPercent"
                          ></div>
                        </div>
                      </div>
                    </div>

                    <a
                      [routerLink]="['/adopciones', group.petId]"
                      class="px-3.5 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold self-start sm:self-center"
                    >
                      Ver Ficha de {{ group.pet.name }}
                    </a>
                  </div>

                  @if (!group.pet.isSterilized) {
                    <div class="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-xs text-amber-900 dark:text-amber-200">
                      🩺 <strong>Recordatorio de Esterilización Obligatoria:</strong> Por convenio, {{ group.pet.name }} debe ser esterilizada entre los <strong>5 y 6 meses de edad</strong>. Comparte el comprobante con tu rescatista.
                    </div>
                  }

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    @for (fol of group.milestones; track fol.id) {
                      @let mLabel = milestoneLabel(fol.dayMilestone);
                      <div class="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div class="flex items-center justify-between gap-2">
                          <div>
                            <span class="text-xs font-black text-slate-900 dark:text-white block">
                              📅 Seguimiento {{ mLabel.label }} ({{ mLabel.badge }})
                            </span>
                            <span class="text-[11px] text-slate-500">
                              Fecha sugerida: {{ fol.scheduledDate | date:'dd/MM/yyyy' }}
                            </span>
                          </div>
                          <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase" [ngClass]="followupBadge(fol.status)">
                            {{ followupLabel(fol.status) }}
                          </span>
                        </div>

                        @if (fol.proofPhotoUrl) {
                          <a [href]="fol.proofPhotoUrl" target="_blank" class="block">
                            <img [src]="fol.proofPhotoUrl" [alt]="'Seguimiento ' + mLabel.label" class="w-full h-36 rounded-xl object-cover border border-emerald-500/30" />
                          </a>
                          @if (fol.proofNotes) {
                            <p class="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 p-2 rounded-lg">
                              💬 {{ fol.proofNotes }}
                            </p>
                          }
                        }

                        @if (fol.status !== 'COMPLETADO') {
                          <div class="space-y-2 pt-1">
                            <input
                              type="text"
                              [(ngModel)]="proofNotesByFollowup[fol.id]"
                              placeholder="¿Cómo sigue? Ej: Muy feliz, comiendo bien y jugando..."
                              class="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <label class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 text-slate-950 font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-all">
                              @if (uploadingFollowupId() === fol.id) {
                                ⏳ Subiendo evidencia...
                              } @else {
                                📷 {{ fol.proofPhotoUrl ? 'Actualizar Fotografía' : 'Tomar / Subir Fotografía de Seguimiento' }}
                              }
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                class="hidden"
                                (change)="onUploadMyFollowupPhoto($event, fol)"
                                [disabled]="uploadingFollowupId() === fol.id"
                              />
                            </label>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </article>
              }
            }
          </section>
        }

        <!-- ========================================================== -->
        <!-- TAB 3: BARRA DE PROGRESO PARA DUEÑO DE MASCOTA (OPCIÓN 2) -->
        <!-- ========================================================== -->
        @if (activeTab() === 'PUBLISHED') {
          <section class="space-y-4">
            <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-start gap-3">
                <span class="text-xl flex-shrink-0">📋</span>
                <div>
                  <strong class="block font-black">Gestiona tus Adopciones Publicadas</strong>
                  <span>Desde el Centro de Adopciones puedes revisar postulantes, hacer entrevistas, liberar el convenio y dar seguimiento a tus mascotas.</span>
                </div>
              </div>
              <a
                routerLink="/panel-rescatista"
                class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-sm whitespace-nowrap text-center hover:brightness-105 transition-all"
              >
                Gestionar Solicitudes →
              </a>
            </div>

            @if (publishedProgress().length === 0) {
              <div class="liquid-glass rounded-3xl p-10 text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700">
                <div class="text-4xl">📋</div>
                <h3 class="font-bold text-slate-900 dark:text-white text-base">Sin publicaciones en proceso de adopción</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto">
                  Si rescatas o encuentras una mascota y necesitas ayuda para darla en adopción responsable, repórtala en el muro como <strong>"En Resguardo"</strong> para que un rescatista verificado coordine el protocolo.
                </p>
              </div>
            } @else {
              @for (item of publishedProgress(); track item.pet.id) {
                <article class="liquid-glass rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-lg space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                      <img
                        [src]="item.pet.photoUrl || item.pet.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80'"
                        [alt]="item.pet.name"
                        class="w-16 h-16 rounded-2xl object-cover shadow-md flex-shrink-0"
                      />
                      <div>
                        <h2 class="text-lg font-black text-slate-900 dark:text-white">{{ item.pet.name }}</h2>
                        <span class="text-xs text-slate-500 block">
                          Postulantes recibidos: <strong>{{ item.totalRequests }}</strong> ({{ item.activeRequests }} en evaluación activa)
                        </span>
                        @if (item.supervisingRescuerName) {
                          <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                            Rescatista supervisor: {{ item.supervisingRescuerName }}
                          </span>
                        }
                      </div>
                    </div>

                    <a
                      [routerLink]="['/adopciones', item.pet.id]"
                      class="px-3.5 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold self-start sm:self-center"
                    >
                      Ver Ficha →
                    </a>
                  </div>

                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-xs font-bold">
                      <span class="text-slate-700 dark:text-slate-200">{{ item.stageLabel }}</span>
                      <span class="text-emerald-600 dark:text-emerald-400 font-black">{{ item.progressPercent }}%</span>
                    </div>
                    <div class="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        [style.width.%]="item.progressPercent"
                      ></div>
                    </div>
                  </div>
                </article>
              }
            }
          </section>
        }
      }

      <!-- MODAL CONVENIO DIGITAL -->
      @if (selectedAgreementReq()) {
        <div
          class="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm overflow-y-auto overscroll-contain p-3 sm:p-6 flex items-start justify-center"
          (click)="closeAgreementModal()"
        >
          <div class="w-full max-w-4xl my-2 sm:my-4 relative" (click)="$event.stopPropagation()">
            <button
              type="button"
              (click)="closeAgreementModal()"
              class="sticky top-2 z-20 mb-2 ml-auto flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-black text-xs shadow-lg cursor-pointer"
            >
              ✕ Cerrar Convenio
            </button>

            <app-adoption-agreement-document
              [request]="selectedAgreementReq()!"
              [mode]="agreementMode()"
              [isSubmitting]="isSigningAgreement()"
              (signed)="handleSignAgreement($event)"
            />
          </div>
        </div>
      }
    </div>
  `,
})
export class MyAdoptionsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private adoptionService = inject(AdoptionService);
  private notify = inject(NotificationService);
  private imageUpload = inject(ImageUploadService);

  activeTab = signal<'APPLICATIONS' | 'FOLLOWUPS' | 'PUBLISHED'>('APPLICATIONS');
  applications = signal<AdoptionRequest[]>([]);
  myFollowups = signal<AdoptionFollowup[]>([]);
  publishedProgress = signal<PublishedPetProgress[]>([]);
  isLoading = signal(true);

  selectedAgreementReq = signal<AdoptionRequest | null>(null);
  agreementMode = signal<'sign' | 'view'>('view');
  isSigningAgreement = signal(false);

  uploadingFollowupId = signal<string | null>(null);
  proofNotesByFollowup: Record<string, string> = {};

  stepLabels = [
    { num: 1, icon: '🗣️', title: 'Entrevista' },
    { num: 2, icon: '🏠', title: 'Visita' },
    { num: 3, icon: '📜', title: 'Convenio' },
    { num: 4, icon: '🏡', title: 'Adoptada' },
  ];

  followupGroups = computed(() => groupFollowupsByPet(this.myFollowups()));

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'followups') this.activeTab.set('FOLLOWUPS');
    else if (tab === 'published') this.activeTab.set('PUBLISHED');

    this.loadAll();
  }

  loadAll(): void {
    this.isLoading.set(true);
    let pending = 3;
    const done = () => {
      pending--;
      if (pending <= 0) this.isLoading.set(false);
    };

    this.adoptionService.getMyApplications().subscribe({
      next: (apps) => {
        this.applications.set(apps || []);
        done();
      },
      error: () => done(),
    });

    this.adoptionService.getMyFollowups().subscribe({
      next: (fols) => {
        this.myFollowups.set(fols || []);
        done();
      },
      error: () => done(),
    });

    this.adoptionService.getMyPublishedProgress().subscribe({
      next: (pub) => {
        this.publishedProgress.set(pub || []);
        done();
      },
      error: () => done(),
    });
  }

  stageMeta(status: AdoptionRequest['status']) {
    return getStageMeta(status);
  }

  stepIndex(req: AdoptionRequest): number {
    return getRequestStepIndex(req);
  }

  milestoneLabel(day: number) {
    return getMilestoneLabel(day);
  }

  followupBadge(status: FollowupStatus): string {
    switch (status) {
      case 'COMPLETADO':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
      case 'FOTO_RECIBIDA':
        return 'bg-sky-500/20 text-sky-700 dark:text-sky-300';
      case 'ALERTA_REABANDONO':
        return 'bg-rose-500 text-white';
      default:
        return 'bg-amber-500/20 text-amber-800 dark:text-amber-300';
    }
  }

  followupLabel(status: FollowupStatus): string {
    switch (status) {
      case 'COMPLETADO':
        return '✓ Validado';
      case 'FOTO_RECIBIDA':
        return '📷 Enviado';
      case 'ALERTA_REABANDONO':
        return '⚠️ Revisión';
      default:
        return 'Pendiente';
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  openAgreementModal(req: AdoptionRequest, mode: 'sign' | 'view'): void {
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.agreementMode.set(mode);
    this.selectedAgreementReq.set(req);
  }

  closeAgreementModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
    this.selectedAgreementReq.set(null);
  }

  handleSignAgreement(payload: SignAdoptionAgreementPayload): void {
    const req = this.selectedAgreementReq();
    if (!req) return;

    this.isSigningAgreement.set(true);
    this.adoptionService.signAgreement(req.id, payload).subscribe({
      next: () => {
        this.isSigningAgreement.set(false);
        this.closeAgreementModal();
        this.notify.success(
          '¡Convenio firmado con éxito!',
          'El rescatista recibió notificación. Presenta tu INE físicamente el día de entrega.',
        );
        this.loadAll();
      },
      error: (err) => {
        this.isSigningAgreement.set(false);
        this.notify.error(err.error?.message || 'No se pudo firmar el Convenio');
      },
    });
  }

  onUploadMyFollowupPhoto(event: Event, fol: AdoptionFollowup): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const note = this.proofNotesByFollowup[fol.id]?.trim() || 'Evidencia de bienestar enviada por el adoptante';
    this.uploadingFollowupId.set(fol.id);

    this.imageUpload.uploadImage(file, 'followups').subscribe({
      next: (url) => {
        this.adoptionService.registerFollowupProof(fol.id, url, note).subscribe({
          next: () => {
            this.uploadingFollowupId.set(null);
            this.notify.success('¡Fotografía enviada!', 'El rescatista recibió tu evidencia de seguimiento.');
            this.loadAll();
          },
          error: () => {
            this.uploadingFollowupId.set(null);
            this.notify.error('No se pudo registrar el seguimiento');
          },
        });
      },
      error: () => {
        this.uploadingFollowupId.set(null);
        this.notify.error('Error al subir imagen');
      },
    });
  }
}

