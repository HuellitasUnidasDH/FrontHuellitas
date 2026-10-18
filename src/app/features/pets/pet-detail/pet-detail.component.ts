import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PetService } from '../../../core/services/pet.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { compressAndResizeImage } from '../../../core/utils/image-compressor.util';
import { Pet } from '../../../core/models/pet.model';
import { MedicalRecord } from '../../../core/models/medical-record.model';
import { PetMoment } from '../../../core/models/pet-moment.model';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-pet-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      @if (isLoading()) {
        <div class="py-24 flex justify-center">
          <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (pet()) {
        <!-- Pet Profile Card (Liquid Glass) -->
        <div class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
              <div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-emerald-500/10 border-2 border-emerald-500/30 flex-shrink-0 shadow-lg">
                @if (pet()!.photoUrl) {
                  <img
                    [src]="pet()!.photoUrl"
                    [alt]="pet()!.name"
                    class="w-full h-full object-cover"
                  />
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {{ pet()!.name.charAt(0) }}
                  </div>
                }
              </div>

              <div class="min-w-0">
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {{ pet()!.name }}
                  </h1>
                  <span
                    class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    [ngClass]="pet()!.gender === 'FEMALE' ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'"
                  >
                    {{ pet()!.gender === 'FEMALE' ? 'Hembra' : 'Macho' }}
                  </span>
                  @if (pet()!.group) {
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      👨‍👩‍👧‍👦 {{ pet()!.group.name }}
                    </span>
                  }
                </div>

                <p class="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {{ pet()!.species }} • {{ pet()!.breed || 'Mestizo / Sin raza' }}
                </p>

                @if (pet()!.microchipNumber) {
                  <div class="inline-flex items-center gap-1.5 mt-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span class="text-emerald-500">🏷️</span> Chip: {{ pet()!.microchipNumber }}
                  </div>
                }
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center justify-center sm:justify-start lg:justify-end gap-2.5 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-slate-800">
              <button
                (click)="openAddMomentModal()"
                class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 text-xs font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>📸</span> + Agregar Momento
              </button>

              <a
                [routerLink]="['/pets/edit', pet()!.id]"
                class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>✏️</span> Editar
              </a>

              @if (isVetOrAdmin) {
                <button
                  (click)="showAddRecordModal.set(true)"
                  class="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>🩺</span> + Consulta Médica
                </button>
              }
            </div>
          </div>

          <!-- Quick Data Pills -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/80">
            <div class="p-3 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/60">
              <span class="text-[10px] uppercase font-semibold text-slate-400 block">Nacimiento</span>
              <span class="text-xs font-bold text-slate-800 dark:text-white">
                {{ pet()!.birthDate ? (pet()!.birthDate | slice:0:10) : 'No registrado' }}
              </span>
            </div>

            <div class="p-3 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/60">
              <span class="text-[10px] uppercase font-semibold text-slate-400 block">Peso Actual</span>
              <span class="text-xs font-bold text-slate-800 dark:text-white">
                {{ pet()!.weightKg ? pet()!.weightKg + ' kg' : 'No registrado' }}
              </span>
            </div>

            <div class="p-3 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/60">
              <span class="text-[10px] uppercase font-semibold text-slate-400 block">Color</span>
              <span class="text-xs font-bold text-slate-800 dark:text-white">{{ pet()!.color || 'No especificado' }}</span>
            </div>

            <div class="p-3 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/60">
              <span class="text-[10px] uppercase font-semibold text-slate-400 block">Esterilizado</span>
              <span class="text-xs font-bold" [ngClass]="pet()!.isSterilized ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'">
                {{ pet()!.isSterilized ? 'Sí' : 'No' }}
              </span>
            </div>
          </div>

          @if (pet()!.notes) {
            <div class="mt-4 p-3 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">Observaciones: </span>{{ pet()!.notes }}
            </div>
          }
        </div>

        <!-- Section Navigation Tabs -->
        <div class="flex items-center gap-6 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <button
            type="button"
            (click)="activeTab.set('moments')"
            [ngClass]="activeTab() === 'moments' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold'"
            class="pb-2 border-b-2 flex items-center gap-2 text-sm sm:text-base transition-all cursor-pointer"
          >
            <span class="text-lg">📸</span> Álbum de Recuerdos
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {{ moments().length }}
            </span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('records')"
            [ngClass]="activeTab() === 'records' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold'"
            class="pb-2 border-b-2 flex items-center gap-2 text-sm sm:text-base transition-all cursor-pointer"
          >
            <span class="text-lg">🩺</span> Expediente Clínico & Vacunas
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {{ medicalRecords().length }}
            </span>
          </button>
        </div>

        <!-- TAB 1: ÁLBUM DE MOMENTOS / RECUERDOS (Supabase Storage) -->
        @if (activeTab() === 'moments') {
          <div class="space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 class="text-xl font-black text-slate-900 dark:text-white">Galería de Recuerdos</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Fotografías y momentos especiales alojados en Supabase Storage
                </p>
              </div>

              <button
                (click)="openAddMomentModal()"
                class="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>✨</span> Inmortalizar Momento
              </button>
            </div>

            @if (moments().length === 0) {
              <div class="liquid-glass rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
                <div class="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-3xl mb-4">
                  📸
                </div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Aún no hay recuerdos guardados</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Sube las fotos de tu mascota para construir su álbum de vida: su primer día, sus paseos favoritos o sus anécdotas más divertidas.
                </p>
                <button
                  (click)="openAddMomentModal()"
                  class="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>📷</span> Subir la Primera Foto
                </button>
              </div>
            } @else {
              <!-- Moments Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (moment of moments(); track moment.id) {
                  <div class="liquid-glass rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-xl group hover:border-emerald-500/50 transition-all flex flex-col">
                    <!-- Image Container with Lightbox Trigger -->
                    <div
                      (click)="openLightbox(moment)"
                      class="relative h-56 overflow-hidden cursor-pointer bg-slate-950"
                    >
                      <img
                        [src]="moment.photoUrl"
                        [alt]="moment.title"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span class="text-xs text-white font-semibold flex items-center gap-1.5">
                          <span>🔍</span> Ver en grande
                        </span>
                      </div>

                      <!-- Date Badge -->
                      <div class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white border border-white/10 shadow">
                        📅 {{ moment.momentDate | slice:0:10 }}
                      </div>

                      <!-- Delete Button -->
                      <button
                        (click)="onDeleteMoment(moment, $event)"
                        title="Eliminar recuerdo"
                        class="absolute top-3 right-3 w-8 h-8 rounded-full bg-rose-500/90 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>

                    <!-- Card Body -->
                    <div class="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 class="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-500 transition-colors">
                          {{ moment.title }}
                        </h4>

                        @if (moment.description) {
                          <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                            {{ moment.description }}
                          </p>
                        }
                      </div>

                      <div class="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-400 font-mono">
                        Guardado: {{ moment.createdAt | slice:0:10 }}
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- TAB 2: EXPEDIENTE CLÍNICO -->
        @if (activeTab() === 'records') {
          <div class="liquid-glass rounded-3xl p-6 sm:p-8">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">Expediente Clínico & Historial</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Consultas, diagnósticos y tratamientos registrados</p>
              </div>
            </div>

            @if (medicalRecords().length === 0) {
              <div class="text-center py-16 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                <span class="text-4xl">🩺</span>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white mt-3">Sin registros médicos</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Registra la primera visita o vacuna para llevar el historial</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (record of medicalRecords(); track record.id) {
                  <div class="p-5 rounded-2xl bg-white/60 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 transition-colors">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div class="flex items-center gap-2">
                        <span class="text-lg">📋</span>
                        <h4 class="font-bold text-slate-900 dark:text-white text-sm">{{ record.reason }}</h4>
                      </div>
                      <span class="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        Fecha: {{ record.visitDate | slice:0:10 }}
                      </span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300">
                      <div class="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Diagnóstico</span>
                        <p>{{ record.diagnosis }}</p>
                      </div>

                      <div class="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tratamiento / Vacuna</span>
                        <p>{{ record.treatment }}</p>
                      </div>
                    </div>

                    @if (record.prescriptions) {
                      <div class="mt-3 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                        <span class="font-bold text-teal-600 dark:text-teal-400">Receta / Dosis: </span>{{ record.prescriptions }}
                      </div>
                    }

                    @if (record.nextAppointmentDate) {
                      <div class="mt-2 text-right text-[11px] text-slate-500 dark:text-slate-400">
                        Próxima cita recomendada:
                        <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ record.nextAppointmentDate | slice:0:10 }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- MODAL: AGREGAR NUEVO MOMENTO (Supabase Storage) -->
      @if (showAddMomentModal()) {
        <div
          (click)="closeAddMomentModal()"
          class="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden"
        >
          <div
            (click)="$event.stopPropagation()"
            class="w-full h-full max-h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <!-- Header Pinned -->
            <div class="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
              <div>
                <h3 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📸</span> Inmortalizar Recuerdo
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Optimizado automáticamente para máxima fluidez</p>
              </div>
              <button
                type="button"
                (click)="closeAddMomentModal()"
                class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xl font-bold cursor-pointer transition-colors"
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="momentForm" (ngSubmit)="onSubmitMoment()" class="flex flex-col flex-1 min-h-0 overflow-hidden">
              <!-- Scrollable Body -->
              <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
                <!-- Image Dropzone / Preview with Dual Source (File or URL) -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Fotografía del Momento *
                  </label>

                  <!-- Dual Source Toggle -->
                  <div class="flex rounded-xl bg-slate-800 p-1 mb-2.5 gap-1 text-xs font-bold">
                    <button
                      type="button"
                      (click)="momentPhotoSource.set('FILE')"
                      [ngClass]="{ 'bg-emerald-500 text-slate-950 shadow': momentPhotoSource() === 'FILE', 'text-slate-400 hover:text-white': momentPhotoSource() !== 'FILE' }"
                      class="flex-1 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      📁 Desde mi dispositivo
                    </button>
                    <button
                      type="button"
                      (click)="momentPhotoSource.set('URL')"
                      [ngClass]="{ 'bg-emerald-500 text-slate-950 shadow': momentPhotoSource() === 'URL', 'text-slate-400 hover:text-white': momentPhotoSource() !== 'URL' }"
                      class="flex-1 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      🔗 Pegar enlace URL
                    </button>
                  </div>

                  @if (momentPhotoSource() === 'FILE') {
                    @if (isCompressingImage()) {
                      <div class="flex flex-col items-center justify-center border-2 border-emerald-500/40 rounded-2xl p-8 bg-slate-800/40 space-y-2">
                        <div class="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <span class="text-xs font-bold text-emerald-400">Optimizando y escalando fotografía... ⚡</span>
                        <span class="text-[10px] text-slate-400">Reduciendo peso para evitar congelamientos</span>
                      </div>
                    } @else if (!imagePreview()) {
                      <label class="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 cursor-pointer bg-slate-800/40 hover:bg-slate-800/60 transition-all">
                        <span class="text-3xl mb-2">📷</span>
                        <span class="text-xs font-bold text-slate-200">Seleccionar foto desde galería o cámara</span>
                        <span class="text-[10px] text-slate-400 mt-1">Cualquier resolución · Optimización inteligente activa</span>
                        <input
                          type="file"
                          accept="image/*"
                          (change)="onFileSelected($event)"
                          class="hidden"
                        />
                      </label>
                    } @else {
                      <div class="relative rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg group bg-slate-950">
                        <img
                          [src]="imagePreview()"
                          alt="Previsualización"
                          class="w-full h-48 sm:h-52 object-contain"
                        />
                        <div class="absolute bottom-2 right-2 flex items-center gap-2">
                          <button
                            type="button"
                            (click)="removeSelectedFile()"
                            class="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
                          >
                            Cambiar Foto
                          </button>
                        </div>
                      </div>
                    }
                  } @else {
                    <!-- URL Source -->
                    <div class="space-y-2">
                      <input
                        type="url"
                        [ngModel]="momentUrlInput()"
                        (ngModelChange)="momentUrlInput.set($event)"
                        [ngModelOptions]="{ standalone: true }"
                        placeholder="https://images.unsplash.com/... o enlace web de la foto"
                        class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
                      />

                      @if (momentUrlInput().trim()) {
                        <div class="relative rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg group bg-slate-950">
                          <img
                            [src]="momentUrlInput().trim()"
                            alt="Previsualización por URL"
                            class="w-full h-48 sm:h-52 object-contain"
                          />
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Título -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Título del Recuerdo *
                  </label>
                  <input
                    type="text"
                    formControlName="title"
                    placeholder="Ej. Su primer día en el parque, Cumpleaños #1..."
                    class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <!-- Fecha del Recuerdo -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha del Momento *
                  </label>
                  <input
                    type="date"
                    formControlName="momentDate"
                    class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <!-- Descripción / Anécdota -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Anécdota / Descripción (Opcional)
                  </label>
                  <textarea
                    formControlName="description"
                    rows="3"
                    placeholder="Escribe lo que ocurrió este día para recordarlo siempre..."
                    class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  ></textarea>
                </div>
              </div>

              <!-- Sticky Pinned Footer -->
              <div class="p-4 pb-6 sm:pb-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-slate-900/95">
                <button
                  type="button"
                  (click)="closeAddMomentModal()"
                  class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  [disabled]="momentForm.invalid || (momentPhotoSource() === 'FILE' && !selectedFile()) || (momentPhotoSource() === 'URL' && !momentUrlInput().trim()) || isUploadingMoment() || isCompressingImage()"
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  @if (isUploadingMoment()) {
                    <div class="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando en Supabase...</span>
                  } @else {
                    <span>Guardar Recuerdo</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: LIGHTBOX / VISTA EN GRANDE DE FOTO -->
      @if (selectedMomentForLightbox()) {
        <div
          (click)="closeLightbox()"
          class="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-md overflow-hidden animate-in fade-in duration-150"
        >
          <div
            (click)="$event.stopPropagation()"
            class="max-w-4xl w-full max-h-[95dvh] sm:max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col relative my-auto"
          >
            <!-- Close Button Pinned -->
            <button
              (click)="closeLightbox()"
              class="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-slate-950/80 text-white hover:bg-rose-500 flex items-center justify-center font-bold text-base shadow transition-colors cursor-pointer"
            >
              ✕
            </button>

            <!-- Lightbox Image -->
            <div class="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-0">
              <img
                [src]="selectedMomentForLightbox()!.photoUrl"
                [alt]="selectedMomentForLightbox()!.title"
                class="w-full h-full max-h-[65vh] sm:max-h-[70vh] object-contain"
              />
            </div>

            <!-- Lightbox Info -->
            <div class="p-4 sm:p-6 bg-slate-900 border-t border-slate-800 text-white space-y-2 shrink-0">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 class="text-base sm:text-xl font-black">{{ selectedMomentForLightbox()!.title }}</h3>
                <span class="self-start sm:self-auto text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  📅 {{ selectedMomentForLightbox()!.momentDate | slice:0:10 }}
                </span>
              </div>
              @if (selectedMomentForLightbox()!.description) {
                <p class="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                  {{ selectedMomentForLightbox()!.description }}
                </p>
              }
            </div>
          </div>
        </div>
      }

      <!-- MODAL: NUEVA CONSULTA MÉDICA (Solo Veterinario/Admin) -->
      @if (showAddRecordModal()) {
        <div
          (click)="closeAddRecordModal()"
          class="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden"
        >
          <div
            (click)="$event.stopPropagation()"
            class="w-full h-full max-h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div class="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Nueva Consulta Médica</h3>
              <button
                type="button"
                (click)="closeAddRecordModal()"
                class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xl font-bold cursor-pointer transition-colors"
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="recordForm" (ngSubmit)="onSubmitRecord()" class="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha de la Consulta *
                  </label>
                  <input
                    type="date"
                    formControlName="visitDate"
                    class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Motivo de Visita *
                  </label>
                  <input
                    type="text"
                    formControlName="reason"
                    placeholder="Ej. Chequeo general, Vacuna antirrábica..."
                    class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Diagnóstico *
                  </label>
                  <textarea
                    formControlName="diagnosis"
                    rows="2"
                    placeholder="Observaciones clínicas y diagnóstico del veterinario"
                    class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Tratamiento Aplicado *
                  </label>
                  <textarea
                    formControlName="treatment"
                    rows="2"
                    placeholder="Medicamentos inyectados, vacuna aplicada, limpieza..."
                    class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Receta Médica / Prescripción (Opcional)
                  </label>
                  <input
                    type="text"
                    formControlName="prescriptions"
                    placeholder="Ej. Amoxicilina 250mg cada 12 hrs por 7 días"
                    class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha Próxima Cita (Opcional)
                  </label>
                  <input
                    type="date"
                    formControlName="nextAppointmentDate"
                    class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <!-- Sticky Pinned Footer -->
              <div class="p-4 pb-6 sm:pb-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-slate-900/95">
                <button
                  type="button"
                  (click)="closeAddRecordModal()"
                  class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  [disabled]="recordForm.invalid"
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Guardar Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class PetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private petService = inject(PetService);
  private notification = inject(NotificationService);
  authService = inject(AuthService);

  pet = signal<Pet | null>(null);
  medicalRecords = signal<MedicalRecord[]>([]);
  moments = signal<PetMoment[]>([]);
  isLoading = signal(true);

  // Tabs
  activeTab = signal<'moments' | 'records'>('moments');

  // Modals & States
  showAddRecordModal = signal(false);
  showAddMomentModal = signal(false);
  isUploadingMoment = signal(false);
  isCompressingImage = signal(false);
  selectedMomentForLightbox = signal<PetMoment | null>(null);

  // Moment File Upload & Dual Source (File or URL)
  momentPhotoSource = signal<'FILE' | 'URL'>('FILE');
  momentUrlInput = signal<string>('');
  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

  get isVetOrAdmin(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === UserRole.VETERINARIAN || role === UserRole.ADMIN;
  }

  recordForm = this.fb.group({
    visitDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
    reason: ['', [Validators.required]],
    diagnosis: ['', [Validators.required]],
    treatment: ['', [Validators.required]],
    prescriptions: [''],
    nextAppointmentDate: [''],
  });

  momentForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    momentDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
    description: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPet(id);
    }
  }

  loadPet(id: string): void {
    this.isLoading.set(true);
    this.petService.getById(id).subscribe({
      next: (data) => {
        this.pet.set(data);
        this.loadRecords(id);
        this.loadMoments(id);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadRecords(petId: string): void {
    this.petService.getMedicalRecords(petId).subscribe({
      next: (records) => {
        this.medicalRecords.set(records);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadMoments(petId: string): void {
    this.petService.getMoments(petId).subscribe({
      next: (moments) => {
        this.moments.set(moments);
      },
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.lockBodyScroll(false);
    if (this.imagePreview() && this.imagePreview()!.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview()!);
    }
  }

  private lockBodyScroll(locked: boolean): void {
    if (typeof document === 'undefined') return;
    if (locked) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  }

  // ==========================================
  // MOMENTOS / RECUERDOS (Supabase Storage)
  // ==========================================

  openAddMomentModal(): void {
    this.momentForm.reset({
      title: '',
      description: '',
      momentDate: new Date().toISOString().substring(0, 10),
    });
    this.removeSelectedFile();
    this.showAddMomentModal.set(true);
    this.lockBodyScroll(true);
  }

  closeAddMomentModal(): void {
    this.showAddMomentModal.set(false);
    this.lockBodyScroll(false);
    this.momentUrlInput.set('');
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const rawFile = input.files[0];

    // Validar tipo
    if (!rawFile.type.startsWith('image/')) {
      this.notification.error('Archivo no válido', 'Debes seleccionar una imagen (JPG, PNG, WEBP)');
      return;
    }

    // Validar tamaño inicial (máximo 25 MB antes de compresión)
    if (rawFile.size > 25 * 1024 * 1024) {
      this.notification.error('Imagen muy grande', 'El archivo no puede superar los 25 MB');
      return;
    }

    // Liberar URL anterior para evitar fugas de memoria
    if (this.imagePreview() && this.imagePreview()!.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview()!);
    }

    this.isCompressingImage.set(true);

    try {
      // Redimensionar y comprimir instantáneamente en el cliente a max 1600px y calidad 82%
      // Reduce fotos de 15MB a ~250KB con nitidez profesional, eliminando la saturación de GPU
      const result = await compressAndResizeImage(rawFile, 1600, 1600, 0.82);
      this.selectedFile.set(result.file);
      this.imagePreview.set(result.objectUrl);
    } catch (err) {
      console.error('Error optimizando imagen:', err);
      const fallbackUrl = URL.createObjectURL(rawFile);
      this.selectedFile.set(rawFile);
      this.imagePreview.set(fallbackUrl);
    } finally {
      this.isCompressingImage.set(false);
    }
  }

  removeSelectedFile(): void {
    if (this.imagePreview() && this.imagePreview()!.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview()!);
    }
    this.selectedFile.set(null);
    this.imagePreview.set(null);
  }

  onSubmitMoment(): void {
    const isFileSource = this.momentPhotoSource() === 'FILE';
    const hasPhoto = isFileSource ? !!this.selectedFile() : !!this.momentUrlInput().trim();
    if (this.momentForm.invalid || !hasPhoto || !this.pet()) return;

    const val = this.momentForm.value;
    const formData = new FormData();
    if (isFileSource && this.selectedFile()) {
      formData.append('file', this.selectedFile()!);
    } else {
      formData.append('photoUrl', this.momentUrlInput().trim());
    }
    formData.append('title', val.title!);
    formData.append('momentDate', val.momentDate!);
    if (val.description) {
      formData.append('description', val.description);
    }

    this.isUploadingMoment.set(true);
    this.petService.addMoment(this.pet()!.id, formData).subscribe({
      next: () => {
        this.notification.success('¡Momento Inmortalizado!', 'El recuerdo fotográfico se guardó exitosamente');
        this.closeAddMomentModal();
        this.isUploadingMoment.set(false);
        this.removeSelectedFile();
        this.momentUrlInput.set('');
        this.loadMoments(this.pet()!.id);
      },
      error: (err) => {
        this.isUploadingMoment.set(false);
        const msg = err.error?.message || 'No se pudo guardar la fotografía. Intenta de nuevo.';
        this.notification.error('Error al guardar', msg);
      },
    });
  }

  onDeleteMoment(moment: PetMoment, event: Event): void {
    event.stopPropagation();
    if (!confirm(`¿Estás seguro de eliminar el recuerdo "${moment.title}"?`)) return;

    this.petService.deleteMoment(moment.id).subscribe({
      next: () => {
        this.notification.success('Recuerdo eliminado', 'Se ha eliminado de la galería');
        this.loadMoments(this.pet()!.id);
      },
      error: () => {
        this.notification.error('Error', 'No se pudo eliminar el recuerdo');
      },
    });
  }

  openLightbox(moment: PetMoment): void {
    this.selectedMomentForLightbox.set(moment);
    this.lockBodyScroll(true);
  }

  closeLightbox(): void {
    this.selectedMomentForLightbox.set(null);
    this.lockBodyScroll(false);
  }

  // ==========================================
  // EXPEDIENTE MÉDICO
  // ==========================================

  openAddRecordModal(): void {
    this.showAddRecordModal.set(true);
    this.lockBodyScroll(true);
  }

  closeAddRecordModal(): void {
    this.showAddRecordModal.set(false);
    this.lockBodyScroll(false);
  }

  onSubmitRecord(): void {
    if (this.recordForm.invalid || !this.pet()) return;

    const val = this.recordForm.value;
    const payload = {
      petId: this.pet()!.id,
      visitDate: val.visitDate!,
      reason: val.reason!,
      diagnosis: val.diagnosis!,
      treatment: val.treatment!,
      prescriptions: val.prescriptions || undefined,
      nextAppointmentDate: val.nextAppointmentDate || undefined,
    };

    this.petService.createMedicalRecord(payload).subscribe({
      next: () => {
        this.notification.success('Consulta Guardada', 'El expediente clínico fue actualizado');
        this.closeAddRecordModal();
        this.recordForm.reset({
          visitDate: new Date().toISOString().substring(0, 10),
        });
        this.loadRecords(this.pet()!.id);
      },
      error: () => {
        this.notification.error('Error', 'No se pudo registrar la consulta médica');
      },
    });
  }
}
