import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../../core/services/pet.service';
import { AdoptionService } from '../../../core/services/adoption.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { Pet } from '../../../core/models/pet.model';
import { UserRole } from '../../../core/models/user.model';
import { CreateAdoptionRequestPayload } from '../../../core/models/adoption.model';
import { AdoptionRequestFormComponent } from '../../adoptions/shared/adoption-request-form.component';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';

@Component({
  selector: 'app-pet-public-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule, AdoptionRequestFormComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <!-- Navigation & Back Link -->
      <div class="flex items-center justify-between">
        <a
          routerLink="/"
          class="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
        >
          <span>←</span> Volver al Muro de {{ brand.name }}
        </a>

        <!-- Share Actions -->
        <div class="flex items-center gap-2">
          <button
            (click)="shareToWhatsApp()"
            class="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>💬</span> WhatsApp
          </button>
          <button
            (click)="shareToFacebook()"
            class="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🌐</span> Facebook
          </button>
        </div>
      </div>

      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-16 text-center space-y-4">
          <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400">
            Cargando expediente de adopción...
          </p>
        </div>
      } @else if (pet()) {
        <div class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-8 border border-emerald-500/20">

          <!-- 1. Header & Main Photo Gallery -->
          <div class="space-y-4">
            <!-- Active Featured Image with Badge Overlays -->
            <div class="relative w-full h-80 sm:h-[26rem] rounded-2xl overflow-hidden bg-slate-950/30 shadow-lg">
              <img
                [src]="activePhoto() || pet()!.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80'"
                [alt]="pet()!.name"
                class="w-full h-full object-cover transition-all duration-300"
              />

              <!-- Top Floating Pills -->
              <div class="absolute top-4 left-4 flex flex-wrap gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500 text-slate-950 shadow-md">
                  🏠 En Adopción
                </span>
                <span
                  class="px-3 py-1 rounded-full text-xs font-bold uppercase shadow-md border"
                  [ngClass]="pet()!.gender === 'FEMALE' ? 'bg-pink-500/90 text-white border-pink-400' : 'bg-sky-500/90 text-white border-sky-400'"
                >
                  {{ pet()!.gender === 'FEMALE' ? '♀ Hembra' : '♂ Macho' }}
                </span>
              </div>

              <!-- Location Tag -->
              <div class="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-xl bg-slate-950/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5">
                <span>📍</span> {{ pet()!.colonia?.name || 'Dolores Hidalgo' }}, Guanajuato
              </div>
            </div>

            <!-- Thumbnail Gallery Strip -->
            @if (pet()!.photos && pet()!.photos!.length > 1) {
              <div class="flex items-center gap-2 overflow-x-auto pb-1">
                @for (photo of pet()!.photos; track $index) {
                  <button
                    (click)="setActivePhoto(photo)"
                    class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0"
                    [ngClass]="activePhoto() === photo ? 'border-emerald-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'"
                  >
                    <img [src]="photo" alt="Foto adicional" class="w-full h-full object-cover" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- 2. Pet Title & Quick Identity -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {{ pet()!.name }}
                </h1>
                <span class="px-3 py-1 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {{ pet()!.species }}
                </span>
              </div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                {{ pet()!.breed || 'Mestizo / Criollo' }} • {{ pet()!.approximateAge || 'Edad no especificada' }} • Talla {{ pet()!.size || 'Mediana' }}
              </p>
            </div>

            <!-- Floating CTA: Quiero Adoptar / Estado -->
            @if (isOwnPet()) {
              <a
                [routerLink]="isRescuerOrAdmin() ? ['/panel-rescatista'] : ['/mis-adopciones']"
                [queryParams]="isRescuerOrAdmin() ? {} : { tab: 'published' }"
                class="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-700 dark:text-sky-300 font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span class="text-lg">📊</span>
                <span>Ver Progreso de {{ pet()!.name }}</span>
              </a>
            } @else if (!isPetAdoptable()) {
              <span class="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 font-black text-xs sm:text-sm text-center">
                {{ pet()!.status === 'ADOPTADA' || pet()!.status === 'EN_SEGUIMIENTO' ? '🏡 ¡Esta mascota ya encontró hogar!' : '🏠 No disponible en adopción' }}
              </span>
            } @else {
              <button
                (click)="openAdoptionModal()"
                class="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span class="text-lg">💚</span>
                <span>¡Quiero Adoptar a {{ pet()!.name }}!</span>
              </button>
            }
          </div>

          <!-- 3. Medical & Health Passport (Semáforo de Salud) -->
          <div class="space-y-3">
            <h2 class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>🩺</span> Expediente Clínico y de Salud
            </h2>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <!-- Esterilización -->
              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Esterilización</span>
                <span
                  class="text-xs font-black flex items-center gap-1"
                  [ngClass]="pet()!.isSterilized ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'"
                >
                  <span>{{ pet()!.isSterilized ? '✅' : '⏳' }}</span>
                  <span>{{ pet()!.isSterilized ? 'Esterilizado(a)' : 'En proceso' }}</span>
                </span>
              </div>

              <!-- Desparasitación -->
              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Desparasitación</span>
                <span
                  class="text-xs font-black flex items-center gap-1"
                  [ngClass]="pet()!.isDewormed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'"
                >
                  <span>{{ pet()!.isDewormed ? '✅' : '❓' }}</span>
                  <span>{{ pet()!.isDewormed ? 'Al corriente' : 'No registrada' }}</span>
                </span>
              </div>

              <!-- Peso Aproximado -->
              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Peso Actual</span>
                <span class="text-xs font-black text-slate-800 dark:text-white">
                  {{ pet()!.weightKg ? pet()!.weightKg + ' kg' : 'Aprox. adecuado' }}
                </span>
              </div>

              <!-- Microchip -->
              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Identificación</span>
                <span class="text-xs font-black text-slate-800 dark:text-white">
                  {{ pet()!.microchipNumber ? '🏷️ Chip activo' : 'Placa Huellitas' }}
                </span>
              </div>
            </div>

            <!-- Listado de Vacunas -->
            @if (pet()!.vaccinesList && pet()!.vaccinesList!.length > 0) {
              <div class="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
                <span class="font-bold text-emerald-700 dark:text-emerald-400 block mb-2">
                  💉 Vacunas Registradas:
                </span>
                <div class="flex flex-wrap gap-2">
                  @for (v of pet()!.vaccinesList; track $index) {
                    <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                      • {{ v }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>

          <!-- 4. Behavioral & Temperament Radar -->
          <div class="space-y-3">
            <h2 class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>🧠</span> Temperamento y Convivencia
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Con Niños</span>
                  <span class="text-base">{{ pet()!.goodWithKids ? '👶 ✅' : '👶 ⚠️' }}</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">
                  {{ pet()!.goodWithKids ? 'Excelente y paciente con niños' : 'Se recomienda para familias con hijos mayores' }}
                </p>
              </div>

              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Con Otras Mascotas</span>
                  <span class="text-base">{{ pet()!.goodWithOtherPets ? '🐕 ✅' : '🐕 ⚠️' }}</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">
                  {{ pet()!.goodWithOtherPets ? 'Sociable con perros y gatos' : 'Prefiere ser hijo único o presentación gradual' }}
                </p>
              </div>

              <div class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Nivel de Energía</span>
                  <span class="text-base">⚡ {{ pet()!.energyLevel || 'Medio' }}</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">
                  {{ pet()!.energyLevel === 'ALTO' ? 'Requiere paseos activos y juegos diarios' : 'Adaptable a hogar tranquilo o paseos moderados' }}
                </p>
              </div>
            </div>
          </div>

          <!-- 5. Rescue Story & Physical Marks -->
          <div class="space-y-3">
            <h2 class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>📖</span> Historia de Rescate y Señas Particulares
            </h2>
            <div class="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line space-y-2">
              <p>{{ pet()!.rescueStory || 'Este peludito fue rescatado con amor en Dolores Hidalgo y espera una familia responsable que le brinde el hogar que merece.' }}</p>
              @if (pet()!.color || pet()!.specialMarks) {
                <div class="pt-2 border-t border-slate-200/70 dark:border-slate-800 text-xs flex flex-wrap gap-3">
                  @if (pet()!.color) {
                    <span>🎨 <strong>Color:</strong> {{ pet()!.color }}</span>
                  }
                  @if (pet()!.specialMarks) {
                    <span>🔍 <strong>Señas particulares:</strong> {{ pet()!.specialMarks }}</span>
                  }
                </div>
              }
            </div>
          </div>

          <!-- 6. Rescuer Contact & Trust Badge -->
          <div class="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3 text-center sm:text-left">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-black">
                🛡️
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  Resguardo Responsable
                </span>
                <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ pet()!.owner?.fullName || 'Red de Rescatistas Huellitas DH' }}
                </h4>
                <p class="text-[11px] text-slate-500">
                  📍 {{ pet()!.colonia?.name || 'Dolores Hidalgo' }} • Adopción con Carta Compromiso
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              @if (canMessageOwner()) {
                <button
                  type="button"
                  (click)="contactOwnerInApp()"
                  class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 shadow-md hover:from-teal-400 hover:to-emerald-300 cursor-pointer"
                >
                  <span>💬</span> Mensaje Directo
                </button>
                <a
                  [href]="getWhatsAppUrl()"
                  target="_blank"
                  class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                  title="Contactar también por WhatsApp"
                >
                  <span>📲</span> WhatsApp Rescatista
                </a>
              }
              @if (isOwnPet()) {
                <a
                  [routerLink]="isRescuerOrAdmin() ? ['/panel-rescatista'] : ['/mis-adopciones']"
                  [queryParams]="isRescuerOrAdmin() ? {} : { tab: 'published' }"
                  class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-black transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                >
                  <span>📊</span> Ver Progreso
                </a>
              } @else if (isPetAdoptable()) {
                <button
                  (click)="openAdoptionModal()"
                  class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all text-center flex items-center justify-center gap-1 shadow-md cursor-pointer"
                >
                  <span>💚</span> Adoptar
                </button>
              } @else {
                <span class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold text-center">
                  {{ pet()!.status === 'ADOPTADA' || pet()!.status === 'EN_SEGUIMIENTO' ? '✓ Adoptada' : 'No disponible' }}
                </span>
              }
            </div>
          </div>
        </div>
      }

      <!-- ITEM #2 ADOPTION MODAL (REUSED FOR DETAIL VIEW) -->
      @if (showAdoptionModal()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn overscroll-contain"
          (click)="closeAdoptionModal()"
        >
          <div
            class="liquid-glass rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative border border-emerald-500/30 max-h-[90vh] overflow-y-auto overscroll-contain space-y-5"
            (click)="$event.stopPropagation()"
          >
            <button
              (click)="closeAdoptionModal()"
              class="sticky top-0 ml-auto -mt-1 w-8 h-8 rounded-full bg-slate-200/90 dark:bg-slate-800/90 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-sm font-bold z-10 shadow-sm"
            >
              ✕
            </button>

            @if (adoptionSubmitted()) {
              <div class="text-center py-6 space-y-4 animate-scaleUp">
                <span class="text-5xl">🎉</span>
                <h4 class="text-lg font-black text-slate-900 dark:text-white">
                  ¡Solicitud Enviada para {{ pet()!.name }}!
                </h4>
                <p class="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                  Tu postulación está registrada. Escríbele un mensaje directo al rescatista en Huellitas o por WhatsApp para agendar una visita.
                </p>
                <div class="space-y-2">
                  <button
                    type="button"
                    (click)="contactOwnerInAppPostAdoption()"
                    class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>💬</span> Enviar Mensaje Directo en Huellitas
                  </button>
                  <a
                    [href]="getWhatsAppUrl()"
                    target="_blank"
                    (click)="closeAdoptionModal()"
                    class="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📲</span> Abrir WhatsApp con el Rescatista
                  </a>
                  <a
                    routerLink="/mis-adopciones"
                    (click)="closeAdoptionModal()"
                    class="w-full py-2.5 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📊</span> Seguir Progreso en Mis Adopciones →
                  </a>
                </div>
              </div>
            } @else {
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="text-3xl">🐾</span>
                  <div>
                    <h3 class="text-lg font-black text-slate-900 dark:text-white">
                      Postular para Adoptar a {{ pet()!.name }}
                    </h3>
                    <p class="text-xs text-slate-500">Adopción responsable en Dolores Hidalgo</p>
                  </div>
                </div>

                @if (!authService.isAuthenticated()) {
                  <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 text-xs">
                    <p class="text-amber-800 dark:text-amber-300">
                      Puedes contactar al rescatista por WhatsApp de inmediato o registrar tu cuenta para completar el cuestionario socioambiental.
                    </p>
                    <div class="flex gap-2">
                      <a
                        [href]="getWhatsAppUrl()"
                        target="_blank"
                        class="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 text-center font-bold"
                      >
                        WhatsApp
                      </a>
                      <a
                        routerLink="/auth/register"
                        class="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-center font-bold"
                      >
                        Registrarme
                      </a>
                    </div>
                  </div>
                } @else {
                  <app-adoption-request-form
                    [pet]="pet()!"
                    [isSubmitting]="isSending()"
                    (submitted)="sendAdoption($event)"
                    (cancelled)="closeAdoptionModal()"
                  />
                }
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
})
export class PetPublicDetailComponent implements OnInit, OnDestroy {
  brand = BRAND_CONFIG;
  private route = inject(ActivatedRoute);
  private petService = inject(PetService);
  private adoptionService = inject(AdoptionService);
  public authService = inject(AuthService);
  private notify = inject(NotificationService);
  private dmService = inject(DirectMessageService);

  pet = signal<Pet | null>(null);
  activePhoto = signal<string>('');
  isLoading = signal<boolean>(true);

  // Adoption modal
  showAdoptionModal = signal<boolean>(false);
  adoptionSubmitted = signal<boolean>(false);
  isSending = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPet(id);
    }
  }

  loadPet(id: string): void {
    this.isLoading.set(true);
    this.petService.getPublicById(id).subscribe({
      next: (data) => {
        this.pet.set(data);
        this.activePhoto.set(data.photoUrl || (data.photos && data.photos[0]) || '');
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notify.error('No se pudo cargar la información de la mascota');
      },
    });
  }

  setActivePhoto(url: string): void {
    this.activePhoto.set(url);
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  isOwnPet(): boolean {
    const p = this.pet();
    const myId = this.authService.currentUser()?.id;
    const ownerId = p?.ownerId || p?.owner?.id;
    return !!myId && !!ownerId && myId === ownerId;
  }

  isPetAdoptable(): boolean {
    const status = this.pet()?.status;
    return !status || status === 'DISPONIBLE' || status === 'EN_PROCESO';
  }

  isRescuerOrAdmin(): boolean {
    const role = this.authService.currentUser()?.role;
    return (
      role === UserRole.RESCATISTA_VERIFICADO ||
      role === UserRole.ALBERGUE ||
      role === UserRole.ADMIN
    );
  }

  openAdoptionModal(): void {
    if (!this.isPetAdoptable()) {
      this.notify.warning('Esta mascota ya no se encuentra disponible para nuevas postulaciones.');
      return;
    }
    if (this.isOwnPet()) {
      this.notify.warning('No puedes postularte a tu propia publicación.');
      return;
    }
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.showAdoptionModal.set(true);
    this.adoptionSubmitted.set(false);
  }

  closeAdoptionModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
    this.showAdoptionModal.set(false);
  }

  sendAdoption(payload: CreateAdoptionRequestPayload): void {
    const p = this.pet();
    if (!p) return;

    this.isSending.set(true);
    this.adoptionService.createRequest(p.id, payload).subscribe({
      next: () => {
        this.isSending.set(false);
        this.adoptionSubmitted.set(true);
        this.notify.success('¡Solicitud enviada al rescatista!');
      },
      error: (err) => {
        this.isSending.set(false);
        this.notify.error(err.error?.message || 'Error al enviar solicitud');
      },
    });
  }

  getWhatsAppUrl(): string {
    const p = this.pet();
    if (!p) return '';
    const phone = p.owner?.phone || '4181234567';
    const text = encodeURIComponent(
      `¡Hola! Vi la ficha de ${p.name} en ${this.brand.name} (${this.brand.city}) y me interesa conocerlo(a) para adopción. ¿Está disponible?`,
    );
    return `https://wa.me/52${phone.replace(/\D/g, '')}?text=${text}`;
  }

  shareToWhatsApp(): void {
    const p = this.pet();
    if (!p) return;
    const text = encodeURIComponent(
      `🐾 ¡Adopta a *${p.name}* en Dolores Hidalgo! Conoce su historia en ${this.brand.name}: ${window.location.href}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  }

  shareToFacebook(): void {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  }

  canMessageOwner(): boolean {
    const p = this.pet();
    const ownerId = p?.ownerId || p?.owner?.id;
    if (!ownerId) return false;
    const myId = this.authService.currentUser()?.id;
    return !myId || ownerId !== myId;
  }

  contactOwnerInApp(): void {
    const p = this.pet();
    if (!p) return;
    const recipientId = p.ownerId || p.owner?.id;
    if (!recipientId) return;

    this.dmService.openChatWithContext({
      recipientId,
      recipientName: p.owner?.fullName,
      contextType: 'PET',
      contextId: p.id,
      contextTitle: `Adopción de ${p.name}`,
      contextSubtitle: `${p.species} • ${p.colonia?.name || 'Dolores Hidalgo'}`,
      contextImageUrl: p.photoUrl || p.photos?.[0],
      contextTargetUrl: `/adopciones/${p.id}`,
      contextWhatsappPhone: p.owner?.phone || undefined,
      prefilledDraft: `¡Hola! Vi la ficha de ${p.name} en Huellitas Dolores Hidalgo y me gustaría platicar sobre los requisitos de adopción 💚`,
    });
  }

  contactOwnerInAppPostAdoption(): void {
    const p = this.pet();
    this.closeAdoptionModal();
    if (!p) return;
    const recipientId = p.ownerId || p.owner?.id;
    if (!recipientId) return;

    this.dmService.openChatWithContext({
      recipientId,
      recipientName: p.owner?.fullName,
      contextType: 'ADOPTION_REQUEST',
      contextId: p.id,
      contextTitle: `Solicitud de Adopción: ${p.name}`,
      contextSubtitle: `${p.species} • ${p.colonia?.name || 'Dolores Hidalgo'}`,
      contextImageUrl: p.photoUrl || p.photos?.[0],
      contextTargetUrl: `/adopciones/${p.id}`,
      contextWhatsappPhone: p.owner?.phone || undefined,
      prefilledDraft: `¡Hola! Acabo de registrar mi postulación para adoptar a ${p.name}. Me gustaría coordinar contigo una visita para conocerlo(a) 🐾`,
    });
  }
}
