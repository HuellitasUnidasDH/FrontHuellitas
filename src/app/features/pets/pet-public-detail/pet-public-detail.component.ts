import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../../core/services/pet.service';
import { AdoptionService } from '../../../core/services/adoption.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Pet } from '../../../core/models/pet.model';
import { BRAND_CONFIG } from '../../../core/constants/brand.constants';

@Component({
  selector: 'app-pet-public-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule],
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

            <!-- Floating CTA: Quiero Adoptar -->
            <button
              (click)="openAdoptionModal()"
              class="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span class="text-lg">💚</span>
              <span>¡Quiero Adoptar a {{ pet()!.name }}!</span>
            </button>
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

          <!-- 5. Rescue Story & Background -->
          <div class="space-y-3">
            <h2 class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>📖</span> Historia de Rescate
            </h2>
            <div class="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {{ pet()!.rescueStory || 'Este peludito fue rescatado con amor en Dolores Hidalgo y ha recibido todos los cuidados médicos necesarios. Ahora espera a una familia que le brinde el hogar que merece.' }}
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

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <a
                [href]="getWhatsAppUrl()"
                target="_blank"
                class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>💬</span> WhatsApp Rescatista
              </a>
              <button
                (click)="openAdoptionModal()"
                class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 text-xs font-black transition-all text-center flex items-center justify-center gap-1 shadow-md"
              >
                <span>💚</span> Adoptar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ITEM #2 ADOPTION MODAL (REUSED FOR DETAIL VIEW) -->
      @if (showAdoptionModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div class="liquid-glass rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-emerald-500/30 overflow-hidden space-y-5">
            <button
              (click)="closeAdoptionModal()"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-sm font-bold"
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
                  Tu postulación está registrada. Escríbele un WhatsApp directo al rescatista para agendar una visita o llamada de conocimiento.
                </p>
                <a
                  [href]="getWhatsAppUrl()"
                  target="_blank"
                  (click)="closeAdoptionModal()"
                  class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>💬</span> Enviar WhatsApp al Rescatista
                </a>
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
                  <div class="space-y-3.5 text-xs">
                    <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                      <span class="text-base">📋</span>
                      <div class="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                        <strong class="text-emerald-700 dark:text-emerald-400">Protocolo de Adopción Responsable:</strong>
                        Completa este cuestionario para que el rescatista evalúe tu solicitud. Todas las preguntas y compromisos son obligatorios.
                      </div>
                    </div>

                    <!-- 1. Tipo de Vivienda -->
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        1. ¿En qué tipo de vivienda vivirá la mascota? <span class="text-rose-500">*</span>
                      </label>
                      <select
                        [(ngModel)]="adoptionForm.housingType"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="CASA_PROPIA_PATIO">🏡 Casa propia con patio o jardín cercado y seguro</option>
                        <option value="CASA_PROPIA_SIN_PATIO">🏠 Casa propia sin patio (espacio interior)</option>
                        <option value="RENTA_CON_PERMISO">🏢 Casa o departamento en renta (con permiso del casero)</option>
                      </select>
                    </div>

                    <!-- 2. Acuerdo Familiar -->
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        2. ¿Toda la familia o personas en casa aceptan la adopción? <span class="text-rose-500">*</span>
                      </label>
                      <select
                        [(ngModel)]="adoptionForm.familyAgreed"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="SI_FAMILIA">👨‍👩‍👧‍👦 Sí, toda la familia acepta y asumirá la responsabilidad</option>
                        <option value="VIVO_SOLO">👤 Vivo solo(a) y asumo la total responsabilidad del cuidado</option>
                      </select>
                    </div>

                    <!-- 3. Mascotas Actuales y Esterilización -->
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        3. ¿Tienes otras mascotas en casa? ¿Están esterilizadas y vacunadas? <span class="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="adoptionForm.currentPets"
                        placeholder="Ej: 1 perrito criollo de 3 años esterilizado / Ninguna mascota actualmente"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <!-- 4. Plan de Mudanza o Imprevistos -->
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        4. En caso de mudanza, viaje o cambio laboral, ¿cuál es tu plan? <span class="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="adoptionForm.relocationPlan"
                        placeholder="Ej: La mascota siempre se muda con nosotros / Familiares directos de apoyo"
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <!-- 5. Motivo y Tiempo Diario -->
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        5. ¿Por qué deseas adoptar a {{ pet()!.name }} y cuánto tiempo le dedicarás? <span class="text-rose-500">*</span>
                      </label>
                      <textarea
                        [(ngModel)]="adoptionForm.reason"
                        rows="2"
                        placeholder="Platícanos sobre tu rutina diaria, paseos y el cariño que recibirá en tu hogar..."
                        class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      ></textarea>
                    </div>

                    <!-- 6. Compromisos Obligatorios del Convenio (Checkboxes) -->
                    <div class="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-300/80 dark:border-slate-700/80 space-y-2.5">
                      <span class="block text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        📜 Compromisos Obligatorios del Convenio de Adopción:
                      </span>

                      <label class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          [(ngModel)]="adoptionForm.agreeNoAbandon"
                          class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span class="text-[11px] leading-tight">
                          <strong>Miembro de la familia:</strong> Tendrá agua, alimento, cariño y atención médica. Jamás estará amarrado, en azoteas, ni será regalado, vendido o reubicado sin consentimiento previo.
                        </span>
                      </label>

                      <label class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          [(ngModel)]="adoptionForm.agreeSterilization"
                          class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span class="text-[11px] leading-tight">
                          <strong>Esterilización y salud:</strong> Me comprometo a su esterilización obligatoria (a los 5-6 meses si es cachorro) y a mantener su cuadro de vacunas y desparasitación al día.
                        </span>
                      </label>

                      <label class="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          [(ngModel)]="adoptionForm.agreeFollowup"
                          class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span class="text-[11px] leading-tight">
                          <strong>Seguimiento de bienestar:</strong> Acepto compartir fotos y recibir seguimiento periódico (a las 2 semanas, 1 mes, 6 meses y al año) para constatar su adaptación.
                        </span>
                      </label>
                    </div>

                    @if (!isAdoptionFormValid()) {
                      <p class="text-[11px] text-amber-600 dark:text-amber-400 font-medium text-center bg-amber-500/10 rounded-xl p-2 border border-amber-500/20">
                        ⚠️ Responde las 5 preguntas y marca los 3 compromisos del convenio para habilitar el envío.
                      </p>
                    }

                    <button
                      (click)="sendAdoption()"
                      [disabled]="isSending() || !isAdoptionFormValid()"
                      class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      @if (isSending()) {
                        <span>Enviando solicitud...</span>
                      } @else {
                        <span>🐾 Confirmar Solicitud de Adopción</span>
                      }
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
})
export class PetPublicDetailComponent implements OnInit {
  brand = BRAND_CONFIG;
  private route = inject(ActivatedRoute);
  private petService = inject(PetService);
  private adoptionService = inject(AdoptionService);
  public authService = inject(AuthService);
  private notify = inject(NotificationService);

  pet = signal<Pet | null>(null);
  activePhoto = signal<string>('');
  isLoading = signal<boolean>(true);

  // Adoption modal
  showAdoptionModal = signal<boolean>(false);
  adoptionSubmitted = signal<boolean>(false);
  isSending = signal<boolean>(false);
  adoptionForm = {
    housingType: 'CASA_PROPIA_PATIO',
    familyAgreed: 'SI_FAMILIA',
    currentPets: '',
    relocationPlan: '',
    reason: '',
    agreeNoAbandon: false,
    agreeSterilization: false,
    agreeFollowup: false,
  };

  isAdoptionFormValid(): boolean {
    return (
      !!this.adoptionForm.housingType &&
      (this.adoptionForm.familyAgreed === 'SI_FAMILIA' || this.adoptionForm.familyAgreed === 'VIVO_SOLO') &&
      this.adoptionForm.currentPets.trim().length >= 3 &&
      this.adoptionForm.relocationPlan.trim().length >= 4 &&
      this.adoptionForm.reason.trim().length >= 10 &&
      this.adoptionForm.agreeNoAbandon &&
      this.adoptionForm.agreeSterilization &&
      this.adoptionForm.agreeFollowup
    );
  }

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

  openAdoptionModal(): void {
    this.showAdoptionModal.set(true);
    this.adoptionSubmitted.set(false);
    this.adoptionForm = {
      housingType: 'CASA_PROPIA_PATIO',
      familyAgreed: 'SI_FAMILIA',
      currentPets: '',
      relocationPlan: '',
      reason: '',
      agreeNoAbandon: false,
      agreeSterilization: false,
      agreeFollowup: false,
    };
  }

  closeAdoptionModal(): void {
    this.showAdoptionModal.set(false);
  }

  sendAdoption(): void {
    const p = this.pet();
    if (!p) return;

    if (!this.isAdoptionFormValid()) {
      this.notify.warning('Formulario incompleto', 'Por favor responde todas las preguntas y acepta los compromisos del convenio.');
      return;
    }

    this.isSending.set(true);

    const housingLabel =
      this.adoptionForm.housingType === 'CASA_PROPIA_PATIO'
        ? 'Casa propia con patio o jardín cercado y seguro'
        : this.adoptionForm.housingType === 'CASA_PROPIA_SIN_PATIO'
          ? 'Casa propia sin patio (espacio interior)'
          : 'En renta (con permiso explícito confirmado del arrendador)';

    const familyLabel =
      this.adoptionForm.familyAgreed === 'SI_FAMILIA'
        ? 'Toda la familia acepta y asume la responsabilidad'
        : 'Vive solo(a) y asume la total responsabilidad';

    const msg = `📋 SOLICITUD DE ADOPCIÓN RESPONSABLE (Protocolo Huellitas DH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 Vivienda: ${housingLabel}
👨‍👩‍👧‍👦 Acuerdo familiar: ${familyLabel}
🐾 Mascotas actuales / Esterilización: ${this.adoptionForm.currentPets.trim()}
📦 Plan ante mudanza / imprevistos: ${this.adoptionForm.relocationPlan.trim()}
❤️ Motivo y tiempo dedicado: ${this.adoptionForm.reason.trim()}
📜 Compromisos Aceptados del Convenio:
  ✅ Miembro de familia (sin cadenas/azoteas, no venta/regalo/abandono)
  ✅ Compromiso de esterilización y atención veterinaria continua
  ✅ Seguimiento con fotos y visitas (2 semanas, 1 mes, 6 meses y 1 año)`;

    this.adoptionService.createRequest(p.id, msg).subscribe({
      next: () => {
        this.isSending.set(false);
        this.adoptionSubmitted.set(true);
        this.notify.success('¡Solicitud enviada!');
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
}
