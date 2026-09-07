import { Component, EventEmitter, Input, Output, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-privacy-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <!-- Super-layer overlay (z-[999]) with full backdrop blur and dimming to completely cover everything including floating navbar -->
      <div class="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-2xl overflow-hidden transition-all duration-300 animate-fade-in">
        <div
          class="w-full h-full max-h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col overflow-hidden transition-all my-auto"
        >
          <!-- Header -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/80">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                📜
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Aviso de Privacidad Integral y Términos Legales
                </h3>
                <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Versión: 2026-v1.0 · Cumplimiento LFPDPPP & GDPR
                </span>
              </div>
            </div>

            <!-- Solo mostrar botón de cerrar si NO es de aceptación obligatoria -->
            @if (!isMandatory) {
              <button
                type="button"
                (click)="onClose()"
                class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                ✕
              </button>
            }
          </div>

          <!-- Alerta de aceptación mandatoria si aplica -->
          @if (isMandatory) {
            <div class="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <span class="text-base">⚠️</span>
              <span>
                <strong>Actualización de Términos Requerida:</strong> Hemos actualizado nuestro Aviso de Privacidad. Debes leer y aceptar los términos para continuar utilizando la aplicación.
              </span>
            </div>
          }

          <!-- Legal Content Body (Scrollable) -->
          <div class="flex-1 overflow-y-auto py-4 pr-2 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar">
            
            <section class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <p class="font-semibold">
                🛡️ Al registrarse y hacer uso de la plataforma VetRegistro, el usuario otorga su consentimiento expreso e informado para la recopilación, almacenamiento seguro y tratamiento de sus datos personales y de sus animales de compañía bajo las normas legales vigentes.
              </p>
            </section>

            <!-- Cláusula 1 -->
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">
                1. Identidad y Domicilio del Responsable
              </h4>
              <p>
                <strong>VetRegistro Enterprise Systems S.A.P.I. de C.V.</strong> (en adelante "El Responsable"), con domicilio legal y plataformas digitales autorizadas, es el responsable del uso, confidencialidad, integridad y protección de los datos personales proporcionados por los usuarios en estricto cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y estándares internacionales (GDPR).
              </p>
            </div>

            <!-- Cláusula 2 -->
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">
                2. Datos Personales Recabados
              </h4>
              <p>Para la prestación de los servicios del sistema, se recopilan de manera directa y lícita:</p>
              <ul class="list-disc list-inside mt-1.5 space-y-1 pl-2">
                <li><strong>Datos de Identificación del Titular:</strong> Nombre completo, correo electrónico, número telefónico celular verificado de 10 dígitos.</li>
                <li><strong>Datos de Identificación Animal:</strong> Nombre de la mascota, especie, raza, peso, edad, número de microchip de identificación única, fotografías y datos biológicos.</li>
                <li><strong>Historial Clínico Veterinario:</strong> Vacunas, desparasitaciones, diagnósticos médicos, tratamientos farmacológicos y prescripciones expedidas por profesionales autorizados.</li>
                <li><strong>Datos Técnicos de Seguridad y Auditoría:</strong> Dirección IP, registros de acceso (timestamps), tipo de navegador y registros inmutables de auditoría forense para prevenir accesos no autorizados.</li>
              </ul>
            </div>

            <!-- Cláusula 3 -->
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">
                3. Finalidades del Tratamiento de Datos
              </h4>
              <p>Los datos recabados serán utilizados para las siguientes finalidades primarias y necesarias:</p>
              <ul class="list-disc list-inside mt-1.5 space-y-1 pl-2">
                <li>Creación, autenticación y administración segura de su cuenta de usuario con tecnología de cifrado JWT y hashing criptográfico.</li>
                <li>Emisión, consulta y resguardo del expediente médico y cartilla digital de vacunación de sus animales de compañía.</li>
                <li>Verificación y asignación de controles de acceso basados en roles (Dueño, Médico Veterinario o Administrador).</li>
                <li>Seguridad y defensa perimetral: Detección y bloqueo automático de ciberataques, denegación de servicio (DoS) e intentos maliciosos de intrusión.</li>
              </ul>
            </div>

            <!-- Cláusula 4 -->
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">
                4. Medidas de Seguridad y Cifrado
              </h4>
              <p>
                El Responsable implementa medidas de seguridad técnicas, físicas y administrativas reconocidas por la industria, que incluyen: cifrado de contraseñas con algoritmo Bcrypt (factor de costo 12), protección de cabeceras HTTP mediante Helmet CSP/HSTS, prevención de inyecciones SQL mediante consultas parametrizadas tipadas, limitación de tasa de solicitudes (Rate Limiting) y aislamiento estricto multi-tenant de datos.
              </p>
            </div>

            <!-- Cláusula 5 -->
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">
                5. Deslinde de Responsabilidad Médica Veterinaria
              </h4>
              <p>
                VetRegistro opera exclusivamente como una plataforma tecnológica de registro y gestión de información. La veracidad, precisión y consecuencias de los diagnósticos, prescripciones, tratamientos médicos o procedimientos clínicos aplicados a las mascotas son responsabilidad única y exclusiva del Médico Veterinario tratante que los expida o del usuario que los registre.
              </p>
            </div>

            <!-- Cláusula 6 -->
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">
                6. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
              </h4>
              <p>
                Usted tiene el derecho constitucional de acceder a sus datos personales en nuestra posesión, rectificarlos en caso de inexactitud, solicitar su cancelación cuando considere que no se requieren para las finalidades señaladas, u oponerse al tratamiento de los mismos para fines específicos mediante solicitud formal al oficial de privacidad en <em>privacidad&#64;vetregistro.com</em>.
              </p>
            </div>

            <!-- Cláusula 7 -->
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">
                7. Transferencia de Datos
              </h4>
              <p>
                Se hace constar expresamente que El Responsable <strong>NO vende, arrienda, comercializa ni transfiere datos personales o historiales médicos a terceros con fines publicitarios o lucrativos</strong>. Únicamente se transferirán datos cuando sea requerido formalmente por mandato judicial o autoridad sanitaria competente en materia de control zoológico.
              </p>
            </div>

          </div>

          <!-- Footer Actions -->
          <div class="pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                id="modalCheckAccept"
                [(ngModel)]="isTermsCheckboxChecked"
                class="w-4 h-4 rounded text-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <label for="modalCheckAccept" class="cursor-pointer select-none">
                He leído y acepto las cláusulas legales y el tratamiento de datos.
              </label>
            </div>

            <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              @if (!isMandatory) {
                <button
                  type="button"
                  (click)="onClose()"
                  class="px-4 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              }

              <button
                type="button"
                (click)="onAccept()"
                [disabled]="!isTermsCheckboxChecked"
                class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all hover:scale-102 active:scale-98 flex items-center gap-1.5"
              >
                <span>Aceptar y Continuar</span>
                <span>✓</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(16, 185, 129, 0.3);
      border-radius: 9999px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(16, 185, 129, 0.6);
    }
  `]
})
export class PrivacyNoticeModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() isMandatory = false;
  @Output() accepted = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isTermsCheckboxChecked = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (typeof document !== 'undefined') {
        if (this.isOpen) {
          document.body.classList.add('privacy-modal-active');
          document.body.style.overflow = 'hidden';
          document.body.style.touchAction = 'none';
        } else {
          document.body.classList.remove('privacy-modal-active');
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('privacy-modal-active');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  }

  onAccept(): void {
    this.accepted.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}
