import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../../core/services/pwa.service';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- 1. Banner Flotante de Instalación Rápida (Solo si no está instalada ni descartada) -->
    @if (!pwaService.isStandalone() && !pwaService.bannerDismissed()) {
      <div
        class="fixed bottom-20 md:bottom-5 right-4 left-4 md:left-auto md:w-96 z-40 liquid-glass rounded-2xl p-4 shadow-2xl border border-emerald-500/40 backdrop-blur-2xl animate-fadeIn"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 text-xl font-black shadow-md shadow-emerald-500/20 flex-shrink-0"
          >
            🐾
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-xs font-black text-slate-900 dark:text-white truncate">
                📲 Instalar App {{ brand.name }}
              </h4>
              <button
                type="button"
                (click)="pwaService.dismissBanner()"
                class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-1.5 py-0.5 rounded-lg cursor-pointer"
                title="Cerrar aviso"
              >
                ✕
              </button>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
              Agrégala a tu pantalla de inicio para reportar urgencias y adoptar con 1 clic.
            </p>

            <div class="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                (click)="pwaService.installPwa()"
                class="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <span>⚡</span>
                <span>Instalar Ahora</span>
              </button>
              <button
                type="button"
                (click)="pwaService.dismissBanner()"
                class="py-2 px-3 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-700"
              >
                Después
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- 2. Modal de Instrucciones de Instalación (iOS Safari o Guía de Navegador) -->
    @if (pwaService.showInstructionsModal()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn"
        (click)="pwaService.closeInstructionsModal()"
      >
        <div
          class="liquid-glass rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-emerald-500/30 space-y-5 relative"
          (click)="$event.stopPropagation()"
        >
          <button
            type="button"
            (click)="pwaService.closeInstructionsModal()"
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-xs font-bold"
          >
            ✕
          </button>

          <div class="flex items-center gap-3.5">
            <div
              class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/25 flex-shrink-0"
            >
              🐾
            </div>
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Aplicación Web Progresiva (PWA)
              </span>
              <h3 class="text-lg font-black text-slate-900 dark:text-white">
                Instalar {{ brand.name }} en tu dispositivo
              </h3>
            </div>
          </div>

          @if (pwaService.isIos()) {
            <!-- Instrucciones para iPhone / iPad -->
            <div class="space-y-3 text-xs text-slate-700 dark:text-slate-200">
              <p class="text-slate-600 dark:text-slate-300">
                En <strong>iPhone o iPad (Safari)</strong>, sigue estos 2 sencillos pasos para instalar la app en tu pantalla de inicio:
              </p>
              <div class="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Toca el botón <strong>Compartir</strong> <span class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold">⬆️</span> en la barra inferior de Safari.</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Selecciona <strong>"Agregar a pantalla de inicio"</strong> <span class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold">➕</span> y confirma en <strong>Agregar</strong>.</span>
                </div>
              </div>
            </div>
          } @else {
            <!-- Instrucciones para Android / Chrome / Edge Desktop -->
            <div class="space-y-3 text-xs text-slate-700 dark:text-slate-200">
              <p class="text-slate-600 dark:text-slate-300">
                Puedes instalar <strong>{{ brand.name }}</strong> como aplicación nativa en tu celular Android o computadora:
              </p>
              <div class="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div class="flex items-start gap-3">
                  <span class="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs flex-shrink-0 mt-0.5">💻</span>
                  <div>
                    <strong>En PC (Chrome / Edge):</strong> Haz clic en el ícono de <strong>Instalar Huellitas (📥 / 🖥️)</strong> que aparece en el lado derecho de la barra de direcciones arriba.
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <span class="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs flex-shrink-0 mt-0.5">📱</span>
                  <div>
                    <strong>En Celular Android (Chrome):</strong> Toca el menú de tres puntos <strong>(⋮)</strong> arriba a la derecha y elige <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                  </div>
                </div>
              </div>
            </div>
          }

          <button
            type="button"
            (click)="pwaService.closeInstructionsModal()"
            class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    }
  `,
})
export class PwaInstallComponent {
  pwaService = inject(PwaService);
  brand = BRAND_CONFIG;
}
