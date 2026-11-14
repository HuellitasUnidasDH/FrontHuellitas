import {
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdoptionRequest,
  SignAdoptionAgreementPayload,
} from '../../../core/models/adoption.model';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';
import { ImageUploadService } from '../../../core/services/image-upload.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-adoption-agreement-document',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
      <!-- Membrete Oficial -->
      <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest text-emerald-100 block">
            {{ brand.fullName }} • {{ brand.fullLocation }}
          </span>
          <h2 class="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
            📜 Convenio de Adopción Responsable
          </h2>
          <p class="text-xs text-emerald-50/90 mt-1">
            Formato oficial para la entrega formal de <strong>{{ request().pet?.name }}</strong>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="printConvenio()"
            class="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <span>🖨️</span> Imprimir / Guardar PDF
          </button>
          @if (request().agreementSignedAt) {
            <span class="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-300/40 text-emerald-100 font-black text-[11px]">
              ✓ Firmado el {{ request().agreementSignedAt | date:'dd/MM/yyyy HH:mm' }}
            </span>
          }
        </div>
      </div>

      <div class="p-5 sm:p-7 space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
        <!-- Declaración inicial -->
        <p class="leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
          En <strong>{{ brand.fullLocation }}</strong>, se celebra el presente
          <strong>CONVENIO DE ADOPCIÓN RESPONSABLE</strong> respecto al animal de compañía cuya ficha descriptiva se detalla a continuación, con el compromiso mutuo de garantizar su vida digna, salud y protección permanente.
        </p>

        <!-- TABLA DESCRIPCIÓN OFICIAL -->
        <div class="space-y-2.5">
          <h3 class="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            DESCRIPCIÓN DEL ANIMAL EN ADOPCIÓN
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Nombre</span>
              <span class="font-black text-slate-900 dark:text-white">{{ request().pet?.name || 'N/D' }}</span>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Especie / Raza</span>
              <span class="font-bold">{{ request().pet?.species }} • {{ request().pet?.breed || 'Mestizo' }}</span>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Edad Aproximada</span>
              <span class="font-bold">{{ request().pet?.approximateAge || 'No especificada' }}</span>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Sexo / Tamaño</span>
              <span class="font-bold">{{ genderLabel(request().pet?.gender) }} • {{ request().pet?.size || 'Mediano' }}</span>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Color y Señas</span>
              <span class="font-bold">{{ request().pet?.color || 'N/D' }} {{ request().pet?.specialMarks ? '(' + request().pet?.specialMarks + ')' : '' }}</span>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Esterilizado</span>
              <span
                class="font-black"
                [ngClass]="request().pet?.isSterilized ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'"
              >
                {{ request().pet?.isSterilized ? 'Sí (Esterilizado)' : 'No (Compromiso 5-6 meses)' }}
              </span>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Desparasitación</span>
              <span class="font-bold">{{ request().pet?.isDewormed ? 'Al corriente' : 'Pendiente / En proceso' }}</span>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Vacunas / Salud</span>
              <span class="font-bold">
                {{ request().pet?.vaccinesList?.length ? request().pet?.vaccinesList?.join(', ') : 'Por confirmar según carnet' }}
              </span>
            </div>
          </div>
        </div>

        <!-- COMPROMISOS OFICIALES DEL ADOPTANTE -->
        <div class="space-y-2.5">
          <h3 class="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            COMPROMISOS DE CUIDADO Y BIENESTAR ANIMAL
          </h3>
          <ol class="list-decimal pl-5 space-y-2 text-xs leading-relaxed bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl">
            <li>Proporcionar alimentación adecuada, agua fresca limpia las 24 horas y refugio digno en el interior del hogar (prohibido mantenerlo en azoteas, balcones expuestos o amarrado permanentemente).</li>
            <li>Brindar atención médica veterinaria oportuna, vacunas anuales, desparasitación y trato ético libre de violencia física o psicológica.</li>
            <li>Colocar collar con placa de identificación visible y asegurar puertas, rejas o bardas para evitar fugas o accidentes viales.</li>
            <li>
              Permitir y responder puntualmente el <strong>seguimiento post-adopción</strong> enviado por el rescatista a las
              <strong>2 semanas, 1 mes, medio año (6 meses) y 1 año</strong> mediante evidencia fotográfica y comunicación directa.
            </li>
            <li>Queda estrictamente prohibido vender, regalar, ceder a terceros, abandonar o utilizar al animal con fines de lucro, reproducción o pelea.</li>
            <li>
              <strong>Cláusula de Esterilización Obligatoria:</strong>
              @if (request().pet?.isSterilized) {
                La mascota ya se entrega esterilizada conforme a los lineamientos de control ético.
              } @else {
                Debido a que la mascota aún no se encuentra esterilizada, el adoptante se compromete obligatoriamente a realizar la cirugía de esterilización al cumplir entre <strong>5 y 6 meses de edad</strong> y presentar comprobante médico al rescatista responsable.
              }
            </li>
          </ol>
        </div>

        <!-- CLÁUSULAS FORMALES DEL CONVENIO -->
        <div class="space-y-2 text-xs leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            CLÁUSULAS LEGALES DEL CONVENIO
          </h3>
          <p><strong>PRIMERA (Propósito):</strong> El Rescatista entrega la custodia responsable del animal al Adoptante exclusivamente como animal de compañía y miembro de su hogar.</p>
          <p><strong>SEGUNDA (Revocación por Incumplimiento):</strong> En caso de comprobarse maltrato, negligencia grave, abandono o negativa reiterada injustificada en los seguimientos, el Rescatista queda facultado para recuperar inmediatamente al animal.</p>
          <p><strong>TERCERA (Imposibilidad sobrevenida):</strong> Si por fuerza mayor el Adoptante no pudiera continuar cuidándolo, deberá notificar inmediatamente al Rescatista para coordinar su reubicación segura, sin abandonarlo ni regalarlo por cuenta propia.</p>
          <p><strong>CUARTA (Cotejo de Identidad y Privacidad):</strong> Para proteger los datos personales conforme a la LFPDPPP, la identificación oficial (INE) se presenta <strong>únicamente mediante cotejo físico presencial</strong> el día de entrega y no se almacena fotografía en esta plataforma.</p>
        </div>

        <!-- SECCIÓN ADOPTANTE + FIRMA -->
        @if (mode() === 'sign') {
          <div class="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-5">
            <h3 class="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              DATOS Y FIRMA DIGITAL DEL ADOPTANTE
            </h3>

            <!-- Aviso Privacidad INE -->
            <div class="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
              <span class="text-lg flex-shrink-0">🔐</span>
              <div>
                <strong>Privacidad Protegida (Sin foto de INE):</strong> Por seguridad legal, <strong>no subas foto de tu INE</strong>. Solo preséntala físicamente al rescatista al momento de recibir a {{ request().pet?.name }}. El comprobante de domicilio es totalmente opcional.
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="font-bold block mb-1">Nombre completo tal como aparece en identificación *</label>
                <input
                  type="text"
                  [(ngModel)]="form.adopterFullName"
                  (blur)="markTouched('adopterFullName')"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border outline-none focus:ring-2 focus:ring-emerald-500"
                  [ngClass]="agreementFieldInvalid('adopterFullName') ? 'border-rose-500 bg-rose-500/5' : 'border-slate-200 dark:border-slate-700'"
                />
                @if (agreementFieldInvalid('adopterFullName')) {
                  <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">Ingresa tu nombre completo tal como aparece en tu identificación.</p>
                }
              </div>
              <div>
                <label class="font-bold block mb-1">Teléfono / WhatsApp de contacto *</label>
                <input
                  type="tel"
                  [(ngModel)]="form.adopterPhone"
                  (blur)="markTouched('adopterPhone')"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border outline-none focus:ring-2 focus:ring-emerald-500"
                  [ngClass]="agreementFieldInvalid('adopterPhone') ? 'border-rose-500 bg-rose-500/5' : 'border-slate-200 dark:border-slate-700'"
                />
                @if (agreementFieldInvalid('adopterPhone')) {
                  <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">Ingresa un teléfono de contacto válido.</p>
                }
              </div>
              <div>
                <label class="font-bold block mb-1">Redes Sociales (Facebook / Instagram) *</label>
                <input
                  type="text"
                  [(ngModel)]="form.adopterSocialMedia"
                  (blur)="markTouched('adopterSocialMedia')"
                  placeholder="https://facebook.com/tu.perfil o @usuario"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border outline-none focus:ring-2 focus:ring-emerald-500"
                  [ngClass]="agreementFieldInvalid('adopterSocialMedia') ? 'border-rose-500 bg-rose-500/5' : 'border-slate-200 dark:border-slate-700'"
                />
                @if (agreementFieldInvalid('adopterSocialMedia')) {
                  <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">Indica tu perfil o usuario de red social.</p>
                }
              </div>
              <div>
                <label class="font-bold block mb-1">Domicilio completo donde vivirá la mascota *</label>
                <input
                  type="text"
                  [(ngModel)]="form.adopterAddress"
                  (blur)="markTouched('adopterAddress')"
                  placeholder="Calle, número, colonia y referencia"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border outline-none focus:ring-2 focus:ring-emerald-500"
                  [ngClass]="agreementFieldInvalid('adopterAddress') ? 'border-rose-500 bg-rose-500/5' : 'border-slate-200 dark:border-slate-700'"
                />
                @if (agreementFieldInvalid('adopterAddress')) {
                  <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">Ingresa calle, colonia y referencia de tu domicilio.</p>
                }
              </div>
            </div>

            <!-- Comprobante de domicilio OPCIONAL -->
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-xs space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span class="font-bold block text-slate-800 dark:text-white">Comprobante de Domicilio (Opcional)</span>
                  <span class="text-[11px] text-slate-500">Si deseas agilizar la entrega puedes adjuntarlo aquí, o mostrarlo físicamente al rescatista.</span>
                </div>
                <label class="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  @if (isUploadingProof()) {
                    ⏳ Subiendo...
                  } @else {
                    📎 Adjuntar Comprobante (Opcional)
                  }
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    (change)="onUploadAddressProof($event)"
                    [disabled]="isUploadingProof()"
                  />
                </label>
              </div>
              @if (form.addressProofUrl) {
                <div class="flex items-center gap-3 pt-1">
                  <img [src]="form.addressProofUrl" alt="Comprobante de domicilio" class="w-16 h-16 rounded-xl object-cover border border-emerald-500/40" />
                  <span class="text-emerald-600 dark:text-emerald-400 font-bold text-xs">✓ Comprobante adjuntado correctamente</span>
                  <button
                    type="button"
                    (click)="form.addressProofUrl = ''"
                    class="text-rose-500 font-bold text-[11px] underline cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              }
            </div>

            <!-- Checkboxes de conformidad -->
            <div class="space-y-2.5 text-xs">
              <label
                class="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl border transition-colors"
                [ngClass]="attemptedSubmit() && !form.agreementAccepted ? 'bg-rose-500/8 border-rose-500/40' : 'border-transparent'"
              >
                <input
                  type="checkbox"
                  [(ngModel)]="form.agreementAccepted"
                  class="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span class="font-bold">
                  He leído íntegramente el Convenio de Adopción Responsable, las 4 cláusulas legales y acepto el seguimiento a 2 semanas, 1 mes, 6 meses y 1 año.
                </span>
              </label>

              @if (!request().pet?.isSterilized) {
                <label
                  class="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl border transition-colors"
                  [ngClass]="attemptedSubmit() && !form.sterilizationCommitmentAccepted ? 'bg-rose-500/10 border-rose-500/50' : 'bg-amber-500/10 border-amber-500/30'"
                >
                  <input
                    type="checkbox"
                    [(ngModel)]="form.sterilizationCommitmentAccepted"
                    class="mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                  />
                  <span class="font-bold text-amber-900 dark:text-amber-200">
                    Acepto el compromiso obligatorio de esterilizar a {{ request().pet?.name }} entre los 5 y 6 meses de edad y enviar el comprobante al rescatista.
                  </span>
                </label>
              }
            </div>

            <!-- Pad de Firma Digital -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-black text-slate-800 dark:text-white">
                  Firma Digital del Adoptante * (Dibuja tu firma con dedo o ratón)
                </label>
                <button
                  type="button"
                  (click)="clearSignature()"
                  class="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] cursor-pointer hover:bg-slate-300"
                >
                  Limpiar firma
                </button>
              </div>

              <div
                class="rounded-2xl border-2 border-dashed bg-white overflow-hidden relative transition-colors"
                [ngClass]="attemptedSubmit() && !hasDrawnSignature() ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-emerald-500/50'"
              >
                <canvas
                  #signatureCanvas
                  width="640"
                  height="190"
                  class="w-full h-44 touch-none cursor-crosshair block"
                  (pointerdown)="startDrawing($event)"
                  (pointermove)="draw($event)"
                  (pointerup)="stopDrawing()"
                  (pointerleave)="stopDrawing()"
                  (pointercancel)="stopDrawing()"
                ></canvas>
                @if (!hasDrawnSignature()) {
                  <span class="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400 select-none">
                    Firma aquí dentro del recuadro
                  </span>
                }
              </div>
              @if (attemptedSubmit() && !hasDrawnSignature()) {
                <p class="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  Dibuja tu firma dentro del recuadro para validar el convenio.
                </p>
              }
            </div>

            @if (attemptedSubmit() && agreementMissingItems().length > 0) {
              <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-700 dark:text-rose-300 space-y-1">
                <p class="font-bold">Revisa lo siguiente antes de firmar el convenio:</p>
                <ul class="list-disc pl-4 space-y-0.5">
                  @for (item of agreementMissingItems(); track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
              </div>
            }

            <div class="flex justify-end pt-2">
              <button
                type="button"
                (click)="submitAgreement()"
                [disabled]="isSubmitting()"
                class="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50 transition-all"
              >
                @if (isSubmitting()) {
                  ⏳ Guardando Convenio...
                } @else {
                  ✍️ Firmar Convenio y Notificar al Rescatista
                }
              </button>
            </div>
          </div>
        } @else {
          <!-- MODO LECTURA / EXPEDIENTE -->
          <div class="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-5">
            <h3 class="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              REGISTRO DEL CONVENIO Y VALIDACIÓN DE ENTREGA
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Adoptante en Convenio</span>
                <span class="font-black">{{ request().adopterAgreementFullName || request().adopter?.fullName || 'Pendiente' }}</span>
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Teléfono</span>
                <span class="font-bold">{{ request().adopterAgreementPhone || request().adopter?.phone || 'Pendiente' }}</span>
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Domicilio</span>
                <span class="font-bold">{{ request().adopterAddress || request().questionnaireData?.address || 'Pendiente' }}</span>
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Redes Sociales</span>
                <span class="font-bold break-all">{{ request().adopterSocialMedia || request().questionnaireData?.socialMedia || 'Pendiente' }}</span>
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Cotejo Físico de INE</span>
                <span class="font-black" [ngClass]="request().ineVerifiedInPerson ? 'text-emerald-600' : 'text-amber-600'">
                  {{ request().ineVerifiedInPerson ? '✓ Verificada físicamente en entrega' : '⏳ Pendiente de cotejo presencial' }}
                </span>
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Compromiso Esterilización</span>
                <span class="font-bold">
                  {{ request().pet?.isSterilized ? 'Ya esterilizada' : request().sterilizationCommitmentAccepted ? '✓ Compromiso firmado (5-6 meses)' : 'Pendiente' }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              @if (request().adopterSignatureData) {
                <div class="p-3 rounded-2xl bg-white border border-slate-200 text-center space-y-1">
                  <span class="text-[10px] font-black uppercase text-slate-400 block">Firma Digital Adoptante</span>
                  <img
                    [src]="request().adopterSignatureData"
                    alt="Firma digital"
                    class="h-24 mx-auto object-contain"
                  />
                </div>
              }
              @if (request().addressProofUrl) {
                <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                  <span class="text-[10px] font-black uppercase text-slate-400 block">Comprobante de Domicilio</span>
                  <a [href]="request().addressProofUrl" target="_blank" class="block">
                    <img
                      [src]="request().addressProofUrl"
                      alt="Comprobante de domicilio"
                      class="h-24 w-full rounded-xl object-cover"
                    />
                  </a>
                </div>
              }
              @if (request().handoverPhotoUrl) {
                <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                  <span class="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 block">Foto Oficial de Entrega</span>
                  <a [href]="request().handoverPhotoUrl" target="_blank" class="block">
                    <img
                      [src]="request().handoverPhotoUrl"
                      alt="Entrega oficial"
                      class="h-24 w-full rounded-xl object-cover"
                    />
                  </a>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdoptionAgreementDocumentComponent {
  brand = BRAND_CONFIG;
  private imageUpload = inject(ImageUploadService);
  private notify = inject(NotificationService);

  request = input.required<AdoptionRequest>();
  mode = input<'view' | 'sign'>('view');
  isSubmitting = input<boolean>(false);
  signed = output<SignAdoptionAgreementPayload>();

  @ViewChild('signatureCanvas') signatureCanvas?: ElementRef<HTMLCanvasElement>;

  isUploadingProof = signal(false);
  hasDrawnSignature = signal(false);
  attemptedSubmit = signal(false);
  touchedFields = signal<Record<string, boolean>>({});
  private drawing = false;

  form = {
    adopterFullName: '',
    adopterPhone: '',
    adopterSocialMedia: '',
    adopterAddress: '',
    agreementAccepted: false,
    sterilizationCommitmentAccepted: false,
    addressProofUrl: '',
  };

  constructor() {
    effect(() => {
      const req = this.request();
      if (!req) return;
      this.form.adopterFullName = req.adopterAgreementFullName || req.adopter?.fullName || '';
      this.form.adopterPhone = req.adopterAgreementPhone || req.adopter?.phone || '';
      this.form.adopterSocialMedia =
        req.adopterSocialMedia || req.questionnaireData?.socialMedia || '';
      this.form.adopterAddress = req.adopterAddress || req.questionnaireData?.address || '';
      this.form.addressProofUrl = req.addressProofUrl || '';
      this.form.agreementAccepted = !!req.agreementAccepted;
      this.form.sterilizationCommitmentAccepted =
        !!req.sterilizationCommitmentAccepted || !!req.pet?.isSterilized;
    });
  }

  genderLabel(g?: string): string {
    if (g === 'MALE') return 'Macho';
    if (g === 'FEMALE') return 'Hembra';
    return 'No especificado';
  }

  private getCanvasPoint(ev: PointerEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (ev.clientX - rect.left) * scaleX,
      y: (ev.clientY - rect.top) * scaleY,
    };
  }

  startDrawing(ev: PointerEvent): void {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture?.(ev.pointerId);
    const pt = this.getCanvasPoint(ev, canvas);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    this.drawing = true;
    this.hasDrawnSignature.set(true);
  }

  draw(ev: PointerEvent): void {
    if (!this.drawing) return;
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = this.getCanvasPoint(ev, canvas);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  }

  stopDrawing(): void {
    this.drawing = false;
  }

  clearSignature(): void {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasDrawnSignature.set(false);
  }

  onUploadAddressProof(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingProof.set(true);
    this.imageUpload.uploadImage(file, 'address-proofs').subscribe({
      next: (url) => {
        this.form.addressProofUrl = url;
        this.isUploadingProof.set(false);
        this.notify.success('Comprobante adjuntado', 'Recuerda que la INE se presenta físicamente.');
      },
      error: () => {
        this.isUploadingProof.set(false);
        this.notify.error('No se pudo subir la imagen');
      },
    });
  }

  markTouched(field: string): void {
    this.touchedFields.update((prev) => ({ ...prev, [field]: true }));
  }

  agreementFieldInvalid(
    field: 'adopterFullName' | 'adopterPhone' | 'adopterSocialMedia' | 'adopterAddress',
  ): boolean {
    return (this.touchedFields()[field] || this.attemptedSubmit()) && !this.form[field].trim();
  }

  agreementMissingItems(): string[] {
    const items: string[] = [];
    if (!this.form.adopterFullName.trim()) items.push('Nombre completo conforme a identificación');
    if (!this.form.adopterPhone.trim()) items.push('Teléfono o WhatsApp de contacto');
    if (!this.form.adopterSocialMedia.trim()) items.push('Perfil o usuario de red social');
    if (!this.form.adopterAddress.trim()) items.push('Domicilio completo donde vivirá la mascota');
    if (!this.form.agreementAccepted) items.push('Casilla de aceptación del Convenio y seguimiento');
    if (!this.request().pet?.isSterilized && !this.form.sterilizationCommitmentAccepted) {
      items.push('Casilla de compromiso obligatorio de esterilización');
    }
    if (!this.hasDrawnSignature() || !this.signatureCanvas?.nativeElement) {
      items.push('Firma digital dibujada dentro del recuadro');
    }
    return items;
  }

  submitAgreement(): void {
    this.attemptedSubmit.set(true);
    if (this.agreementMissingItems().length > 0 || !this.signatureCanvas?.nativeElement) {
      return;
    }

    const signatureData = this.signatureCanvas.nativeElement.toDataURL('image/png');
    this.signed.emit({
      adopterFullName: this.form.adopterFullName.trim(),
      adopterAddress: this.form.adopterAddress.trim(),
      adopterPhone: this.form.adopterPhone.trim(),
      adopterSocialMedia: this.form.adopterSocialMedia.trim(),
      agreementAccepted: true,
      sterilizationCommitmentAccepted: this.form.sterilizationCommitmentAccepted,
      adopterSignatureData: signatureData,
      ...(this.form.addressProofUrl ? { addressProofUrl: this.form.addressProofUrl } : {}),
    });
  }

  private escapeHtml(str?: string | null): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  printConvenio(): void {
    if (typeof window === 'undefined') return;
    const req = this.request();
    const pet = req.pet;
    const printWin = window.open('', '_blank', 'width=860,height=920');
    if (!printWin) {
      this.notify.warning('Ventana bloqueada', 'Permite ventanas emergentes para imprimir o guardar el PDF.');
      return;
    }

    const sigImg = req.adopterSignatureData
      ? `<img src="${req.adopterSignatureData}" style="max-height:90px; display:block; margin:0 auto;" />`
      : '<div style="height:60px; border-bottom:1px solid #1e293b; width:260px; margin:20px auto 4px;"></div>';

    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Convenio de Adopción - ${this.escapeHtml(pet?.name)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 28px 34px; font-size: 12px; line-height: 1.5; }
  h1 { font-size: 18px; margin: 0 0 4px; color: #065f46; text-align: center; }
  .sub { text-align: center; font-size: 11px; color: #475569; margin-bottom: 18px; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px; color: #065f46; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td, th { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 11px; }
  th { background: #f1f5f9; width: 22%; color: #334155; }
  ol, p { margin: 8px 0; }
  .sigs { display: flex; justify-content: space-between; margin-top: 26px; gap: 24px; }
  .sig-box { flex: 1; text-align: center; border-top: 1px solid #334155; padding-top: 8px; }
  @media print { body { margin: 14px; } }
</style>
</head>
<body>
  <h1>CONVENIO DE ADOPCIÓN RESPONSABLE</h1>
  <div class="sub">${this.escapeHtml(this.brand.fullName)} • ${this.escapeHtml(this.brand.fullLocation)}</div>

  <h2>Descripción de la Mascota</h2>
  <table>
    <tr><th>Nombre</th><td>${this.escapeHtml(pet?.name)}</td><th>Especie / Raza</th><td>${this.escapeHtml(pet?.species)} • ${this.escapeHtml(pet?.breed || 'Mestizo')}</td></tr>
    <tr><th>Edad Aprox.</th><td>${this.escapeHtml(pet?.approximateAge || 'N/D')}</td><th>Sexo / Tamaño</th><td>${this.genderLabel(pet?.gender)} • ${this.escapeHtml(pet?.size || 'Mediano')}</td></tr>
    <tr><th>Color / Señas</th><td>${this.escapeHtml(pet?.color || 'N/D')} ${this.escapeHtml(pet?.specialMarks || '')}</td><th>Esterilizado</th><td>${pet?.isSterilized ? 'Sí' : 'No (Compromiso 5-6 meses)'}</td></tr>
  </table>

  <h2>Compromisos de Cuidado y Cláusulas</h2>
  <ol>
    <li>Alimentación digna, agua limpia y resguardo dentro del hogar (no azoteas, no amarrado).</li>
    <li>Atención médica veterinaria oportuna y vacunación vigente.</li>
    <li>Collar con placa de identificación y prevención de extravíos.</li>
    <li>Seguimiento obligatorio con evidencia fotográfica a las 2 semanas, 1 mes, 6 meses y 1 año.</li>
    <li>Prohibida la venta, cesión, abandono o reproducción.</li>
    <li>${pet?.isSterilized ? 'Esterilización previa cumplida.' : 'Compromiso obligatorio de esterilización entre los 5 y 6 meses de edad.'}</li>
  </ol>
  <p><strong>Cotejo de Identidad (LFPDPPP):</strong> ${req.ineVerifiedInPerson ? 'INE cotejada físicamente en la entrega.' : 'Pendiente de cotejo físico presencial en la entrega.'}</p>

  <h2>Adoptante</h2>
  <table>
    <tr><th>Nombre</th><td>${this.escapeHtml(req.adopterAgreementFullName || this.form.adopterFullName || req.adopter?.fullName)}</td><th>Teléfono</th><td>${this.escapeHtml(req.adopterAgreementPhone || this.form.adopterPhone || req.adopter?.phone)}</td></tr>
    <tr><th>Domicilio</th><td>${this.escapeHtml(req.adopterAddress || this.form.adopterAddress)}</td><th>Redes Sociales</th><td>${this.escapeHtml(req.adopterSocialMedia || this.form.adopterSocialMedia)}</td></tr>
  </table>

  <div class="sigs">
    <div class="sig-box">
      ${sigImg}
      <strong>Adoptante</strong><br/>
      <span>${this.escapeHtml(req.adopterAgreementFullName || req.adopter?.fullName)}</span>
    </div>
    <div class="sig-box">
      <div style="height:60px;"></div>
      <strong>Rescatista Responsable</strong><br/>
      <span>${this.escapeHtml(req.evaluatedByRescuer?.fullName || this.brand.fullName)}</span>
    </div>
  </div>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  }
}

