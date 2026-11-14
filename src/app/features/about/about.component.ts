import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BRAND_CONFIG } from '../../core/constants/brand.constants';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <!-- Hero del Proyecto -->
      <section class="liquid-glass rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div class="absolute -right-14 -top-14 w-52 h-52 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-3 max-w-2xl">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <span>🐾</span> Sobre {{ brand.name }}
            </span>
            <h1 class="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Tecnología ciudadana por el bienestar animal en {{ brand.city }}
            </h1>
            <p class="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>{{ brand.name }}</strong> nace en la Cuna de la Independencia Nacional para conectar a ciudadanos solidarios, rescatistas independientes, albergues y clínicas veterinarias en una red segura de adopciones responsables, alertas de extravío y seguimiento médico.
            </p>
          </div>

          <a
            routerLink="/"
            class="self-start md:self-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md hover:brightness-105 transition-all whitespace-nowrap"
          >
            ← Volver al Muro Principal
          </a>
        </div>

        <!-- 3 Pilares del Proyecto -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-7 pt-6 border-t border-slate-200/70 dark:border-slate-800/70">
          <div class="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span class="text-2xl block">💚</span>
            <h3 class="text-sm font-black text-slate-900 dark:text-white">Adopción con Protocolo</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Proceso estructurado en 4 pasos (entrevista, visita domiciliaria, convenio digital y seguimiento a 1 año) al alcance de rescatistas y ciudadanos.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span class="text-2xl block">🚨</span>
            <h3 class="text-sm font-black text-slate-900 dark:text-white">Red Vecinal Inmediata</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Reportes geolocalizados por colonias y vialidades de Dolores Hidalgo para atender animales heridos, en resguardo o extraviados.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span class="text-2xl block">🩺</span>
            <h3 class="text-sm font-black text-slate-900 dark:text-white">Expediente y Aliados</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Historial clínico personal para tus mascotas, cartilla preventiva y directorio local de veterinarias y rescatistas verificados.
            </p>
          </div>
        </div>
      </section>

      <!-- Equipo de Desarrollo -->
      <section class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800/80 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span class="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
              Detrás del Código
            </span>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Equipo de Desarrollo
            </h2>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Diseñado y construido en Dolores Hidalgo, Guanajuato 🇲🇽
          </p>
        </div>

        <!-- Foto del Equipo (Opcional si existe /devs/equipo.jpg) -->
        @if (!hideTeamPhoto()) {
          <div class="rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-100 dark:bg-slate-900/70 shadow-md">
            <img
              src="/devs/equipo.jpg"
              alt="Samael y Diego - Desarrolladores de Huellitas"
              (error)="hideTeamPhoto.set(true)"
              class="w-full max-h-80 object-cover"
            />
          </div>
        }

        <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          <!-- Card Principal: Samael (Creador y Desarrollador Principal) -->
          <article class="md:col-span-7 p-6 rounded-3xl bg-gradient-to-br from-emerald-500/12 via-teal-500/8 to-transparent border-2 border-emerald-500/40 shadow-lg flex flex-col justify-between gap-4">
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div class="w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 p-1 shadow-lg shadow-emerald-500/20 flex-shrink-0">
                @if (!hideSamaelPhoto()) {
                  <img
                    src="/devs/samael.jpg"
                    alt="Samael - Creador y Desarrollador Principal"
                    (error)="hideSamaelPhoto.set(true)"
                    class="w-full h-full object-cover rounded-[20px]"
                  />
                } @else {
                  <div class="w-full h-full rounded-[20px] bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <span class="text-3xl font-black">S</span>
                    <span class="text-[9px] font-bold uppercase tracking-wider mt-0.5">Lead Dev</span>
                  </div>
                }
              </div>

              <div class="text-center sm:text-left space-y-2 flex-1">
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-sm">
                    ⭐ Creador y Líder de Proyecto
                  </span>
                </div>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Samael
                </h3>
                <p class="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Arquitecto de Software & Desarrollador Full-Stack Principal
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Responsable de la visión del producto, arquitectura integral (Frontend Angular, API NestJS, base de datos, seguridad, protocolo oficial de adopciones en 4 pasos, mensajería directa, PWA y despliegue en producción).
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-1.5 pt-3 border-t border-emerald-500/20 text-[10px] font-bold">
              <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">Arquitectura Full-Stack</span>
              <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">Protocolo de Adopciones</span>
              <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">Seguridad & Deploy</span>
            </div>
          </article>

          <!-- Card Colaborador: Diego -->
          <article class="md:col-span-5 p-6 rounded-3xl bg-white/75 dark:bg-slate-900/65 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between gap-4">
            <div class="flex flex-col items-center text-center space-y-3">
              <div class="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-tr from-sky-500 to-indigo-500 p-1 shadow-md flex-shrink-0">
                @if (!hideDiegoPhoto()) {
                  <img
                    src="/devs/diego.jpg"
                    alt="Diego - Co-Desarrollador"
                    (error)="hideDiegoPhoto.set(true)"
                    class="w-full h-full object-cover rounded-[20px]"
                  />
                } @else {
                  <div class="w-full h-full rounded-[20px] bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-sky-600 dark:text-sky-400">
                    <span class="text-2xl font-black">D</span>
                    <span class="text-[9px] font-bold uppercase tracking-wider mt-0.5">Dev</span>
                  </div>
                }
              </div>

              <div class="space-y-1.5">
                <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  Co-Desarrollador
                </span>
                <h3 class="text-lg font-black text-slate-900 dark:text-white">
                  Diego
                </h3>
                <p class="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Desarrollador Colaborador
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Colaboración en el desarrollo de funcionalidades, retroalimentación del proyecto y apoyo en la construcción de la plataforma comunitaria.
                </p>
              </div>
            </div>

            <div class="flex flex-wrap justify-center gap-1.5 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-[10px] font-bold">
              <span class="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300">Desarrollo</span>
              <span class="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300">Colaboración</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  `,
})
export class AboutComponent {
  brand = BRAND_CONFIG;
  hideTeamPhoto = signal(false);
  hideSamaelPhoto = signal(false);
  hideDiegoPhoto = signal(false);
}
