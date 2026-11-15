import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { ScrollLockService } from '../../../core/services/scroll-lock.service';
import {
  escapeHtml,
  sanitizeBase64RasterDataUrl,
  sanitizeImageSrc,
} from '../../../core/utils/app-helpers.util';

export type PosterQrCategory =
  | 'SE_BUSCA'
  | 'EXTRAVIADA'
  | 'ANIMAL_HERIDO'
  | 'EN_RESGUARDO'
  | 'ENCONTRADA_EN_CALLE'
  | 'EN_ADOPCION'
  | 'CAMPANA_COMUNITARIA';

export interface PosterQrPayload {
  id: string;
  category: PosterQrCategory;
  petName: string;
  species?: string;
  gender?: string;
  approxAge?: string;
  coloniaName?: string;
  locationDetail?: string;
  description: string;
  photoUrl?: string;
  contactPhone?: string;
  rewardOffered?: boolean;
  rewardDetails?: string;
  directUrl: string;
  city?: string;
  brandName?: string;
}

interface PosterTheme {
  bannerLabel: string;
  subtitleLabel: string;
  accentHex: string;
  accentDarkHex: string;
  badgeBgClass: string;
  headerGradientClass: string;
  borderClass: string;
}

/**
 * Estudio interactivo para generar carteles comunitarios con Código QR escaneable.
 *
 * Funcionamiento:
 * - Convierte cualquier reporte del Muro (extraviado, herido, resguardo, campaña)
 *   o ficha pública de adopción en un cartel de alto impacto visual sin herramientas externas.
 * - Genera localmente el código QR mediante la librería `qrcode` apuntando al enlace
 *   canónico de la publicación en Huellitas para acceder en tiempo real a fotos, colonia
 *   exacta, bitácora de avistamientos y contacto seguro.
 * - Permite ocultar el teléfono personal en carteles públicos de poste/calle si el usuario
 *   prefiere canalizar respuestas únicamente a través de la app (modo privacidad).
 * - Exporta el cartel en PNG de alta resolución (1080×1520 px vía Canvas HTML5) o en hoja
 *   limpia lista para imprimir / guardar como PDF.
 */
@Component({
  selector: 'app-poster-qr-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="fixed inset-0 z-[92] flex items-start sm:items-center justify-center p-2.5 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto overscroll-contain"
      (click)="close()"
    >
      <div
        class="liquid-glass rounded-3xl p-4 sm:p-6 max-w-4xl w-full shadow-2xl border border-emerald-500/25 my-auto max-h-[92dvh] overflow-y-auto overscroll-contain space-y-5"
        (click)="$event.stopPropagation()"
      >
        <!-- Top Modal Header -->
        <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="5" height="5" x="3" y="3" rx="1" />
                <rect width="5" height="5" x="16" y="3" rx="1" />
                <rect width="5" height="5" x="3" y="16" rx="1" />
                <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                <path d="M21 21v.01" />
                <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                <path d="M3 12h.01" />
                <path d="M12 3h.01" />
                <path d="M12 16v.01" />
                <path d="M16 12h1" />
                <path d="M21 12v.01" />
                <path d="M12 21v-1" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Estudio de Difusión Comunitaria
              </p>
              <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                Cartel con Código QR de {{ data().petName || 'Publicación' }}
              </h3>
            </div>
          </div>

          <button
            type="button"
            (click)="close()"
            class="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar estudio de cartel"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <!-- Two Column Studio Grid: Live Preview + Export Controls -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          <!-- Left Column: Live Flyer Preview -->
          <div class="lg:col-span-7 flex justify-center">
            <div
              class="w-full max-w-[400px] rounded-2xl overflow-hidden bg-white text-slate-900 shadow-2xl border-2 select-none"
              [ngClass]="posterTheme().borderClass"
            >
              <!-- Banner -->
              <div
                class="px-4 py-3 text-white text-center space-y-0.5 bg-gradient-to-r"
                [ngClass]="posterTheme().headerGradientClass"
              >
                <p class="text-xl sm:text-2xl font-black tracking-tight uppercase leading-none">
                  {{ posterTheme().bannerLabel }}
                </p>
                <p class="text-[10px] font-bold uppercase tracking-widest opacity-90">
                  {{ posterTheme().subtitleLabel }} · {{ data().city || 'Dolores Hidalgo, Gto.' }}
                </p>
              </div>

              <!-- Location Strip (Prominente) -->
              <div class="px-4 py-2 bg-slate-900 text-white flex items-center gap-2 text-xs">
                <svg class="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div class="min-w-0 flex-1">
                  <span class="font-extrabold uppercase tracking-wide text-[11px] block truncate">
                    {{ data().coloniaName || 'Dolores Hidalgo' }}
                  </span>
                  @if (data().locationDetail) {
                    <span class="text-[10px] text-slate-300 block truncate">
                      {{ data().locationDetail }}
                    </span>
                  }
                </div>
              </div>

              <!-- Pet Photo Frame -->
              <div class="p-3.5 pb-2 space-y-2.5 bg-white">
                <div class="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  @if (data().photoUrl) {
                    <img
                      [src]="data().photoUrl"
                      [alt]="data().petName"
                      class="w-full h-full object-cover"
                    />
                  } @else {
                    <div class="flex flex-col items-center gap-1.5 text-slate-400">
                      <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="4" r="2" />
                        <circle cx="18" cy="8" r="2" />
                        <circle cx="20" cy="16" r="2" />
                        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
                      </svg>
                      <span class="text-[11px] font-bold">Sin fotografía adjunta</span>
                    </div>
                  }

                  @if (showReward() && data().rewardOffered) {
                    <div class="absolute bottom-2 inset-x-2 px-3 py-1 rounded-lg bg-amber-400 text-slate-950 text-center text-[11px] font-black uppercase tracking-wide shadow-md">
                      Se ofrece recompensa{{ data().rewardDetails ? ': ' + data().rewardDetails : '' }}
                    </div>
                  }
                </div>

                <!-- Name & Metadata -->
                <div class="space-y-1">
                  <div class="flex items-baseline justify-between gap-2 flex-wrap">
                    <h4 class="text-xl font-black text-slate-950 tracking-tight leading-tight">
                      {{ data().petName || 'Peludito Comunitario' }}
                    </h4>
                    @if (metaSummary()) {
                      <span class="text-[11px] font-bold text-slate-600">
                        {{ metaSummary() }}
                      </span>
                    }
                  </div>
                  <p class="text-xs text-slate-700 leading-snug line-clamp-3">
                    {{ data().description }}
                  </p>
                  @if (customNote().trim()) {
                    <p
                      class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border"
                      [ngClass]="posterTheme().badgeBgClass"
                    >
                      {{ customNote().trim() }}
                    </p>
                  }
                </div>

                <!-- QR + Contact Bottom Dock -->
                <div class="mt-2 pt-2.5 border-t-2 border-dashed border-slate-200 flex items-center gap-3">
                  <div class="w-24 h-24 rounded-xl border border-slate-300 bg-white p-1 shrink-0 flex items-center justify-center">
                    @if (qrDataUrl()) {
                      <img [src]="qrDataUrl()" alt="Código QR de la publicación" class="w-full h-full object-contain" />
                    } @else {
                      <span class="text-[10px] text-slate-400 font-bold">QR...</span>
                    }
                  </div>

                  <div class="flex-1 min-w-0 space-y-1">
                    <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Escanea para ver ficha en vivo
                    </p>
                    <p class="text-[11px] text-slate-700 font-semibold leading-tight">
                      Consulta actualizaciones, reporta un avistamiento o escribe directo desde tu celular.
                    </p>
                    <div class="pt-1">
                      @if (includePhone() && formattedPhone()) {
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-black">
                          <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span>{{ formattedPhone() }}</span>
                        </div>
                      } @else {
                        <span class="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold">
                          Contacto directo en {{ data().brandName || 'Huellitas' }} (vía QR)
                        </span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Controls, Privacy Options & Actions -->
          <div class="lg:col-span-5 space-y-4">
            <div class="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Personalización y Privacidad
              </h4>

              @if (data().contactPhone) {
                <label class="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    [ngModel]="includePhone()"
                    (ngModelChange)="includePhone.set($event)"
                    class="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span class="text-xs text-slate-700 dark:text-slate-200 leading-snug">
                    <strong class="block font-bold">Mostrar teléfono en el cartel</strong>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">
                      Desactívalo si lo pegarás en la calle y prefieres recibir mensajes solo vía QR dentro de Huellitas.
                    </span>
                  </span>
                </label>
              }

              @if (data().rewardOffered) {
                <label class="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    [ngModel]="showReward()"
                    (ngModelChange)="showReward.set($event)"
                    class="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span class="text-xs text-slate-700 dark:text-slate-200 leading-snug">
                    <strong class="block font-bold">Destacar aviso de recompensa</strong>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">
                      Muestra la franja de recompensa sobre la fotografía principal.
                    </span>
                  </span>
                </label>
              }

              <div>
                <label class="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Nota breve adicional (opcional)
                </label>
                <input
                  type="text"
                  maxlength="90"
                  [ngModel]="customNote()"
                  (ngModelChange)="customNote.set($event)"
                  placeholder="Ej: Es asustadizo, no intentar atraparlo corriendo."
                  class="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <p class="text-[10px] text-slate-400 mt-1 text-right">
                  {{ customNote().length }}/90
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2.5">
              <button
                type="button"
                (click)="downloadPngPoster()"
                [disabled]="isExportingPng() || !qrDataUrl()"
                class="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
              >
                @if (isExportingPng()) {
                  <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  <span>Generando imagen HD...</span>
                } @else {
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                  <span>Descargar Cartel PNG (Redes / WhatsApp)</span>
                }
              </button>

              <button
                type="button"
                (click)="printPosterSheet()"
                [disabled]="!qrDataUrl()"
                class="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect width="12" height="8" x="6" y="14" />
                </svg>
                <span>Imprimir o Guardar PDF (Tamaño Carta)</span>
              </button>

              <button
                type="button"
                (click)="copyQrLink()"
                class="w-full py-2.5 px-4 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>Copiar enlace directo embebido en el QR</span>
              </button>
            </div>

            <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <strong>Consejo vecinal:</strong> Pega copias impresas en veterinarias cercanas, tiendas de la colonia y postes iluminados. Quien escanee el código verá el historial en vivo incluso si cambias la ubicación.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PosterQrModalComponent implements OnInit, OnDestroy {
  data = input.required<PosterQrPayload>();
  closed = output<void>();

  private notify = inject(NotificationService);
  private scrollLock = inject(ScrollLockService);

  qrDataUrl = signal<string>('');
  includePhone = signal<boolean>(true);
  showReward = signal<boolean>(true);
  customNote = signal<string>('');
  isExportingPng = signal<boolean>(false);

  posterTheme = computed<PosterTheme>(() => {
    const category = this.data().category;
    switch (category) {
      case 'ANIMAL_HERIDO':
        return {
          bannerLabel: 'Alerta de Auxilio',
          subtitleLabel: 'Animal Herido en Vía Pública',
          accentHex: '#e11d48',
          accentDarkHex: '#be123c',
          badgeBgClass: 'bg-rose-50 text-rose-800 border-rose-200',
          headerGradientClass: 'from-rose-600 to-red-700',
          borderClass: 'border-rose-500/50',
        };
      case 'EN_RESGUARDO':
      case 'ENCONTRADA_EN_CALLE':
        return {
          bannerLabel: 'Peludito Encontrado',
          subtitleLabel: 'En Resguardo Temporal',
          accentHex: '#d97706',
          accentDarkHex: '#b45309',
          badgeBgClass: 'bg-amber-50 text-amber-800 border-amber-200',
          headerGradientClass: 'from-amber-500 to-orange-600',
          borderClass: 'border-amber-500/50',
        };
      case 'EN_ADOPCION':
        return {
          bannerLabel: 'Busco Hogar',
          subtitleLabel: 'Adopción Responsable',
          accentHex: '#059669',
          accentDarkHex: '#047857',
          badgeBgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          headerGradientClass: 'from-emerald-600 to-teal-600',
          borderClass: 'border-emerald-500/50',
        };
      case 'CAMPANA_COMUNITARIA':
        return {
          bannerLabel: 'Aviso Comunitario',
          subtitleLabel: 'Jornada y Difusión Local',
          accentHex: '#0f766e',
          accentDarkHex: '#115e59',
          badgeBgClass: 'bg-teal-50 text-teal-800 border-teal-200',
          headerGradientClass: 'from-teal-600 to-slate-800',
          borderClass: 'border-teal-500/50',
        };
      case 'SE_BUSCA':
      case 'EXTRAVIADA':
      default:
        return {
          bannerLabel: 'Se Busca',
          subtitleLabel: 'Mascota Extraviada',
          accentHex: '#dc2626',
          accentDarkHex: '#991b1b',
          badgeBgClass: 'bg-rose-50 text-rose-800 border-rose-200',
          headerGradientClass: 'from-red-600 to-rose-700',
          borderClass: 'border-red-500/50',
        };
    }
  });

  metaSummary = computed(() => {
    const d = this.data();
    return [d.species, d.gender, d.approxAge].filter(Boolean).join(' · ');
  });

  formattedPhone = computed(() => {
    const raw = (this.data().contactPhone || '').replace(/\D/g, '');
    if (!raw) return '';
    if (raw.length === 10) {
      return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
    }
    return this.data().contactPhone || '';
  });

  constructor() {
    effect(() => {
      const payload = this.data();
      this.includePhone.set(Boolean(payload.contactPhone));
      this.showReward.set(Boolean(payload.rewardOffered));
      this.generateQr(payload.directUrl);
    });
  }

  ngOnInit(): void {
    this.scrollLock.lock('poster-qr-modal', 'modal');
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock('poster-qr-modal', 'modal');
  }

  close(): void {
    this.closed.emit();
  }

  private async generateQr(url: string): Promise<void> {
    if (!url) return;
    try {
      const qrcodeModule = (await import('qrcode')) as unknown as {
        default?: typeof import('qrcode');
        toDataURL?: typeof import('qrcode').toDataURL;
      };
      const toDataURL = qrcodeModule.default?.toDataURL ?? qrcodeModule.toDataURL;
      if (!toDataURL) {
        throw new Error('QR generator unavailable');
      }
      const dataUrl = await toDataURL(url, {
        width: 340,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      this.qrDataUrl.set(dataUrl);
    } catch {
      this.notify.error('No se pudo generar el código QR para este enlace.');
    }
  }

  copyQrLink(): void {
    const url = this.data().directUrl;
    if (!url || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(url)
      .then(() => this.notify.success('Enlace directo copiado al portapapeles'))
      .catch(() => this.notify.warning('No se pudo copiar automáticamente el enlace.'));
  }

  /**
   * Compone un cartel vertical de 1080×1520 px en Canvas HTML5 y lo descarga como PNG.
   * Carga imágenes externas mediante fetch->Blob para evitar bloqueo CORS del canvas.
   */
  async downloadPngPoster(): Promise<void> {
    if (this.isExportingPng()) return;
    this.isExportingPng.set(true);

    try {
      const d = this.data();
      const theme = this.posterTheme();
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1520;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas no disponible');

      // Base blanca
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Header Banner
      const headerGrad = ctx.createLinearGradient(0, 0, canvas.width, 190);
      headerGrad.addColorStop(0, theme.accentHex);
      headerGrad.addColorStop(1, theme.accentDarkHex);
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, canvas.width, 188);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '900 72px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.fillText(theme.bannerLabel.toUpperCase(), canvas.width / 2, 102);

      ctx.font = '700 24px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(
        `${theme.subtitleLabel.toUpperCase()} · ${(d.city || 'Dolores Hidalgo, Gto.').toUpperCase()}`,
        canvas.width / 2,
        152,
      );

      // 2. Location Strip
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 188, canvas.width, 102);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#34d399';
      ctx.font = '800 22px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.fillText('UBICACIÓN / COLONIA:', 56, 228);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 30px system-ui, -apple-system, Segoe UI, sans-serif';
      const locLine = [d.coloniaName || 'Dolores Hidalgo', d.locationDetail].filter(Boolean).join(' · ');
      ctx.fillText(this.truncateCanvasText(ctx, locLine, 968), 56, 268);

      // 3. Pet Photo Frame
      const photoX = 56;
      const photoY = 324;
      const photoW = 968;
      const photoH = 590;
      this.drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 24);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();

      if (d.photoUrl) {
        const img = await this.loadImageForCanvas(d.photoUrl);
        if (img) {
          ctx.save();
          this.drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 24);
          ctx.clip();
          this.drawCoverImage(ctx, img, photoX, photoY, photoW, photoH);
          ctx.restore();
        }
      }

      if (this.showReward() && d.rewardOffered) {
        const rewardText = `SE OFRECE RECOMPENSA${d.rewardDetails ? ': ' + d.rewardDetails : ''}`.toUpperCase();
        ctx.fillStyle = '#facc15';
        this.drawRoundedRect(ctx, photoX + 20, photoY + photoH - 72, photoW - 40, 52, 14);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.font = '900 24px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(this.truncateCanvasText(ctx, rewardText, photoW - 80), canvas.width / 2, photoY + photoH - 38);
      }

      // 4. Title, Metadata & Description
      let cursorY = 974;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 50px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.fillText(this.truncateCanvasText(ctx, d.petName || 'Peludito Comunitario', 968), 56, cursorY);
      cursorY += 42;

      if (this.metaSummary()) {
        ctx.fillStyle = '#475569';
        ctx.font = '700 26px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(this.metaSummary(), 56, cursorY);
        cursorY += 42;
      } else {
        cursorY += 12;
      }

      ctx.fillStyle = '#334155';
      ctx.font = '500 25px system-ui, -apple-system, Segoe UI, sans-serif';
      const descLines = this.wrapTextLines(ctx, d.description || '', 968, 3);
      for (const line of descLines) {
        ctx.fillText(line, 56, cursorY);
        cursorY += 34;
      }

      if (this.customNote().trim()) {
        cursorY += 8;
        ctx.fillStyle = '#ecfdf5';
        this.drawRoundedRect(ctx, 56, cursorY - 26, 968, 46, 12);
        ctx.fill();
        ctx.fillStyle = '#065f46';
        ctx.font = '800 22px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(this.truncateCanvasText(ctx, this.customNote().trim(), 930), 74, cursorY + 4);
      }

      // 5. QR & Contact Dock at Bottom
      const footerY = 1220;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(56, footerY - 20);
      ctx.lineTo(1024, footerY - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      const qrUrl = this.qrDataUrl();
      if (qrUrl) {
        const qrImg = await this.loadImageForCanvas(qrUrl);
        if (qrImg) {
          this.drawRoundedRect(ctx, 56, footerY, 240, 240, 18);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.drawImage(qrImg, 68, footerY + 12, 216, 216);
        }
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 28px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.fillText('ESCANEA EL CÓDIGO QR', 324, footerY + 44);

      ctx.fillStyle = '#475569';
      ctx.font = '600 22px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.fillText('Para ver fotos, mapa de colonia, actualizaciones', 324, footerY + 84);
      ctx.fillText('o reportar un avistamiento al instante:', 324, footerY + 114);

      if (this.includePhone() && this.formattedPhone()) {
        ctx.fillStyle = '#0f172a';
        this.drawRoundedRect(ctx, 324, footerY + 140, 440, 62, 16);
        ctx.fill();
        ctx.fillStyle = '#34d399';
        ctx.font = '800 20px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText('TEL / WHATSAPP:', 348, footerY + 178);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(this.formattedPhone(), 534, footerY + 179);
      } else {
        ctx.fillStyle = '#ecfdf5';
        this.drawRoundedRect(ctx, 324, footerY + 140, 650, 56, 14);
        ctx.fill();
        ctx.fillStyle = '#065f46';
        ctx.font = '800 22px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillText(`Contacto directo y seguro en ${d.brandName || 'Huellitas'} vía QR`, 346, footerY + 176);
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 18px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.fillText(this.truncateCanvasText(ctx, d.directUrl, 690), 324, footerY + 236);

      const safeFileSlug = (d.petName || 'huellitas-cartel')
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/(^-|-$)/g, '');
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `cartel-${safeFileSlug || 'huellitas'}.png`;
      link.href = pngUrl;
      link.click();

      this.notify.success('Cartel PNG descargado listo para compartir');
    } catch {
      this.notify.error('No se pudo exportar el PNG. Usa la opción de Imprimir / PDF.');
    } finally {
      this.isExportingPng.set(false);
    }
  }

  /**
   * Abre una ventana limpia de impresión en tamaño Carta lista para impresora o Guardar como PDF.
   */
  printPosterSheet(): void {
    const d = this.data();
    const theme = this.posterTheme();
    const qrUrl = this.qrDataUrl();
    if (!qrUrl) return;

    const printWin = window.open('', '_blank', 'width=900,height=1100');
    if (!printWin) {
      this.notify.warning('Tu navegador bloqueó la ventana de impresión. Descarga el cartel en PNG.');
      return;
    }
    printWin.opener = null;

    const esc = escapeHtml;
    const safeAccentHex = /^#[0-9a-fA-F]{6}$/.test(theme.accentHex)
      ? theme.accentHex
      : '#059669';
    const safePhotoUrl = sanitizeImageSrc(d.photoUrl);
    const safeQrUrl = sanitizeBase64RasterDataUrl(qrUrl);
    if (!safeQrUrl) {
      printWin.close();
      this.notify.error('No se pudo validar la imagen QR generada.');
      return;
    }

    const contactHtml =
      this.includePhone() && this.formattedPhone()
        ? `<div class="phone-badge">Tel / WhatsApp: ${esc(this.formattedPhone())}</div>`
        : `<div class="privacy-badge">Contacto directo y seguro en ${esc(d.brandName || 'Huellitas')} vía QR</div>`;

    const rewardHtml =
      this.showReward() && d.rewardOffered
        ? `<div class="reward">Se ofrece recompensa${d.rewardDetails ? ': ' + esc(d.rewardDetails) : ''}</div>`
        : '';

    const noteHtml = this.customNote().trim()
      ? `<p class="custom-note">${esc(this.customNote().trim())}</p>`
      : '';

    const photoHtml = safePhotoUrl
      ? `<img src="${esc(safePhotoUrl)}" alt="${esc(d.petName)}" class="hero-img" />`
      : `<div class="hero-empty">Sin fotografía adjunta</div>`;

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Cartel Huellitas - ${esc(d.petName)}</title>
  <style>
    @page { size: letter portrait; margin: 12mm; }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
    body { margin: 0; color: #0f172a; background: #fff; }
    .sheet { border: 3px solid ${safeAccentHex}; border-radius: 16px; overflow: hidden; max-width: 720px; margin: 0 auto; }
    .banner { background: ${safeAccentHex}; color: #fff; text-align: center; padding: 18px 20px; }
    .banner h1 { margin: 0; font-size: 38px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; }
    .banner p { margin: 4px 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.95; }
    .location { background: #0f172a; color: #fff; padding: 12px 20px; font-size: 15px; font-weight: 800; }
    .location small { display: block; color: #cbd5e1; font-weight: 600; font-size: 13px; margin-top: 2px; }
    .content { padding: 20px; }
    .hero-wrap { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; background: #f8fafc; }
    .hero-img { width: 100%; max-height: 370px; object-fit: cover; display: block; }
    .hero-empty { height: 240px; display: flex; align-items: center; justify-content: center; color: #64748b; font-weight: 700; }
    .reward { background: #facc15; color: #0f172a; text-align: center; font-weight: 900; font-size: 15px; padding: 8px 12px; text-transform: uppercase; }
    .pet-title { margin: 16px 0 4px; font-size: 30px; font-weight: 900; }
    .meta { margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #475569; }
    .desc { margin: 0; font-size: 15px; line-height: 1.45; color: #1e293b; }
    .custom-note { margin: 12px 0 0; padding: 9px 12px; border-radius: 8px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-weight: 800; font-size: 13px; }
    .footer { margin-top: 18px; padding-top: 16px; border-top: 2px dashed #cbd5e1; display: flex; align-items: center; gap: 18px; }
    .qr { width: 132px; height: 132px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 4px; }
    .footer-info h3 { margin: 0 0 6px; font-size: 16px; font-weight: 900; text-transform: uppercase; }
    .footer-info p { margin: 0 0 10px; font-size: 13px; color: #334155; }
    .phone-badge { display: inline-block; background: #0f172a; color: #fff; padding: 8px 14px; border-radius: 8px; font-weight: 900; font-size: 16px; }
    .privacy-badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 7px 12px; border-radius: 8px; font-weight: 800; font-size: 13px; }
    .url { margin-top: 8px; font-size: 11px; color: #64748b; word-break: break-all; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="banner">
      <h1>${esc(theme.bannerLabel)}</h1>
      <p>${esc(theme.subtitleLabel)} · ${esc(d.city || 'Dolores Hidalgo, Gto.')}</p>
    </div>
    <div class="location">
      Colonia / Zona: ${esc(d.coloniaName || 'Dolores Hidalgo')}
      ${d.locationDetail ? `<small>Referencia: ${esc(d.locationDetail)}</small>` : ''}
    </div>
    <div class="content">
      <div class="hero-wrap">
        ${photoHtml}
        ${rewardHtml}
      </div>
      <h2 class="pet-title">${esc(d.petName || 'Peludito Comunitario')}</h2>
      ${this.metaSummary() ? `<p class="meta">${esc(this.metaSummary())}</p>` : ''}
      <p class="desc">${esc(d.description || '')}</p>
      ${noteHtml}
      <div class="footer">
        <img src="${esc(safeQrUrl)}" alt="QR" class="qr" />
        <div class="footer-info">
          <h3>Escanea con tu cámara</h3>
          <p>Consulta la publicación en vivo, reporta avistamientos o envía mensajes desde tu teléfono.</p>
          ${contactHtml}
          <div class="url">${esc(d.directUrl)}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    setTimeout(() => {
      try {
        printWin.focus();
        printWin.print();
      } catch {
        // Ignore if popup was closed before print triggered.
      }
    }, 300);
  }

  private async loadImageForCanvas(src: string): Promise<HTMLImageElement | null> {
    if (!src) return null;
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      return this.decodeHtmlImage(src);
    }
    try {
      const response = await fetch(src, { mode: 'cors' });
      if (!response.ok) return null;
      const blob = await response.blob();
      const objUrl = URL.createObjectURL(blob);
      try {
        return await this.decodeHtmlImage(objUrl);
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    } catch {
      return null;
    }
  }

  private decodeHtmlImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private drawCoverImage(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void {
    const imgRatio = img.width / img.height;
    const boxRatio = dw / dh;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (imgRatio > boxRatio) {
      sw = img.height * boxRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / boxRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  private truncateCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let trimmed = text;
    while (trimmed.length > 0 && ctx.measureText(trimmed + '…').width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    return trimmed + '…';
  }

  private wrapTextLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number,
  ): string[] {
    const words = (text || '').trim().split(/\s+/);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
        if (lines.length === maxLines - 1) break;
      }
    }
    if (current && lines.length < maxLines) {
      lines.push(current);
    }
    if (lines.length === maxLines && words.length > 0) {
      lines[maxLines - 1] = this.truncateCanvasText(ctx, lines[maxLines - 1], maxWidth);
    }
    return lines;
  }
}
