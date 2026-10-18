import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdoptionService } from '../../../core/services/adoption.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AdoptionRequest, AdoptionFollowup, AdoptionRequestStatus } from '../../../core/models/adoption.model';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';

@Component({
  selector: 'app-rescuer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <!-- Header -->
      <section class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-emerald-500/20">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4 text-center sm:text-left">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 flex-shrink-0">
              📋
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Panel del Rescatista
              </h1>
              <p class="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                Gestión de solicitudes y seguimiento preventivo post-adopción a 7, 30 y 90 días en Dolores Hidalgo.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <a
              routerLink="/pets/new"
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md"
            >
              + Publicar Mascota
            </a>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
          <button
            (click)="activeTab.set('REQUESTS')"
            class="px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
            [ngClass]="activeTab() === 'REQUESTS' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300'"
          >
            📥 Solicitudes Recibidas ({{ requests().length }})
          </button>

          <button
            (click)="activeTab.set('FOLLOWUPS')"
            class="px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
            [ngClass]="activeTab() === 'FOLLOWUPS' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300'"
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

                      <!-- Status Badge -->
                      <span
                        class="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                        [ngClass]="getStatusBadge(req.status)"
                      >
                        {{ req.status }}
                      </span>
                    </div>

                    <!-- Adopter Message -->
                    @if (req.adopterMessage) {
                      <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line">
                        {{ req.adopterMessage }}
                      </div>
                    }

                    <!-- Actions -->
                    <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div class="flex items-center gap-2">
                        @if (req.adopter?.phone) {
                          <a
                            [href]="getAdopterWhatsAppUrl(req)"
                            target="_blank"
                            class="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md transition-colors"
                          >
                            <span>💬</span> WhatsApp Adoptante
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

        <!-- TAB 2: SEGUIMIENTOS POST-ADOPCIÓN 7, 30 Y 90 DÍAS -->
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

                    <!-- Status -->
                    <div class="text-xs">
                      <span class="font-bold text-slate-600 dark:text-slate-300">Estado: </span>
                      <span class="font-black text-emerald-600 dark:text-emerald-400">{{ fol.status }}</span>
                    </div>

                    <!-- Proof Photo if received -->
                    @if (fol.proofPhotoUrl) {
                      <div class="w-full h-36 rounded-xl overflow-hidden border">
                        <img [src]="fol.proofPhotoUrl" alt="Foto de bienestar recibida" class="w-full h-full object-cover" />
                      </div>
                    }

                    <!-- Actions -->
                    <div class="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2">
                      <a
                        [href]="fol.prefilledWhatsappUrl || getFollowupWhatsAppUrl(fol)"
                        target="_blank"
                        class="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs text-center flex items-center justify-center gap-1 shadow-md"
                      >
                        <span>💬</span> Pedir Foto WhatsApp
                      </a>

                      @if (fol.status !== 'COMPLETADO') {
                        <button
                          (click)="registerProofModal(fol)"
                          class="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                        >
                          📷 Registrar Foto
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
export class RescuerDashboardComponent implements OnInit {
  brand = BRAND_CONFIG;
  private adoptionService = inject(AdoptionService);
  public authService = inject(AuthService);
  private notify = inject(NotificationService);

  activeTab = signal<'REQUESTS' | 'FOLLOWUPS'>('REQUESTS');
  requests = signal<AdoptionRequest[]>([]);
  followups = signal<AdoptionFollowup[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.adoptionService.getPublisherInbox().subscribe({
      next: (reqs) => {
        this.requests.set(reqs || []);
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
      case 'APROBADA': return 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30';
      case 'RECHAZADA': return 'bg-rose-500/20 text-rose-600 border border-rose-500/30';
      default: return 'bg-amber-500/20 text-amber-600 border border-amber-500/30';
    }
  }

  getAdopterWhatsAppUrl(req: AdoptionRequest): string {
    const phone = req.adopter?.phone || '';
    const text = encodeURIComponent(
      `¡Hola ${req.adopter?.fullName}! Te escribo de ${this.brand.name} Dolores Hidalgo sobre tu solicitud para adoptar a ${req.pet?.name}. ¿Cuándo tendrías oportunidad de platicar o realizar una visita de conocimiento?`,
    );
    return `https://wa.me/52${phone.replace(/\D/g, '')}?text=${text}`;
  }

  getFollowupWhatsAppUrl(fol: AdoptionFollowup): string {
    const phone = fol.adopter?.phone || '';
    const text = encodeURIComponent(
      `¡Hola! Te escribimos de ${this.brand.name} Dolores Hidalgo en el seguimiento de los ${fol.dayMilestone} días de ${fol.pet?.name || 'tu peludito'}. ¿Cómo ha estado? ¿Nos podrías compartir una fotito reciente para su carnet de bienestar? ¡Muchas gracias!`,
    );
    return `https://wa.me/52${phone.replace(/\D/g, '')}?text=${text}`;
  }

  registerProofModal(fol: AdoptionFollowup): void {
    const photoUrl = prompt('Ingresa la URL de la fotografía de bienestar recibida:');
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
