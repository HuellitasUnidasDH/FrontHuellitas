import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PetService } from '../../../core/services/pet.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Pet } from '../../../core/models/pet.model';
import { MedicalRecord } from '../../../core/models/medical-record.model';
import { PetMoment } from '../../../core/models/pet-moment.model';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-pet-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      @if (isLoading()) {
        <div class="py-24 flex justify-center">
          <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (pet()) {
        <!-- Pet Profile Card (Liquid Glass) -->
        <div class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-5">
              <div class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-emerald-500/10 border-2 border-emerald-500/30 flex-shrink-0 shadow-lg">
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

              <div>
                <div class="flex items-center gap-3">
                  <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {{ pet()!.name }}
                  </h1>
                  <span
                    class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    [ngClass]="pet()!.gender === 'FEMALE' ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'"
                  >
                    {{ pet()!.gender === 'FEMALE' ? 'Hembra' : 'Macho' }}
                  </span>
                </div>

                <p class="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {{ pet()!.species }} • {{ pet()!.breed || 'Mestizo / Sin raza' }}
                </p>

                @if (pet()!.microchipNumber) {
                  <div class="flex items-center gap-1.5 mt-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    <span class="text-emerald-500">🏷️</span> Chip: {{ pet()!.microchipNumber }}
                  </div>
                }
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-3">
              <button
                (click)="openAddMomentModal()"
                class="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 text-xs font-bold shadow-md shadow-teal-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>📸</span> + Agregar Momento
              </button>

              <a
                [routerLink]="['/pets/edit', pet()!.id]"
                class="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Editar Mascota
              </a>

              @if (isVetOrAdmin) {
                <button
                  (click)="showAddRecordModal.set(true)"
                  class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  + Consulta Médica
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
                        class="absolute top-3 right-3 w-8 h-8 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all shadow cursor-pointer"
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
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div class="w-full max-w-lg liquid-glass border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📸</span> Inmortalizar Recuerdo
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">La foto se guardará en tu Supabase Storage</p>
              </div>
              <button
                (click)="showAddMomentModal.set(false)"
                class="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="momentForm" (ngSubmit)="onSubmitMoment()" class="space-y-4">
              <!-- Image Dropzone / Preview -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Fotografía del Momento *
                </label>

                @if (!imagePreview()) {
                  <label class="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-6 cursor-pointer bg-white/30 dark:bg-slate-900/30 transition-all">
                    <span class="text-3xl mb-2">📷</span>
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Seleccionar o arrastrar foto</span>
                    <span class="text-[10px] text-slate-400 mt-1">Formatos soportados: JPG, PNG, WEBP (Hasta 10 MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      (change)="onFileSelected($event)"
                      class="hidden"
                    />
                  </label>
                } @else {
                  <div class="relative rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg group">
                    <img
                      [src]="imagePreview()"
                      alt="Previsualización"
                      class="w-full h-52 object-cover"
                    />
                    <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        (click)="removeSelectedFile()"
                        class="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold shadow hover:bg-rose-600 transition-colors cursor-pointer"
                      >
                        Cambiar Foto
                      </button>
                    </div>
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

              <!-- Botones de Acción -->
              <div class="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  (click)="showAddMomentModal.set(false)"
                  class="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  [disabled]="momentForm.invalid || !selectedFile() || isUploadingMoment()"
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
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div
            (click)="$event.stopPropagation()"
            class="max-w-4xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
          >
            <!-- Close Button -->
            <button
              (click)="closeLightbox()"
              class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-950/80 text-white hover:bg-rose-500 flex items-center justify-center font-bold text-sm shadow transition-colors cursor-pointer"
            >
              ✕
            </button>

            <!-- Lightbox Image -->
            <div class="max-h-[70vh] bg-black flex items-center justify-center overflow-hidden">
              <img
                [src]="selectedMomentForLightbox()!.photoUrl"
                [alt]="selectedMomentForLightbox()!.title"
                class="w-full h-full max-h-[70vh] object-contain"
              />
            </div>

            <!-- Lightbox Info -->
            <div class="p-6 text-white space-y-2">
              <div class="flex items-center justify-between gap-4">
                <h3 class="text-xl font-black">{{ selectedMomentForLightbox()!.title }}</h3>
                <span class="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  📅 {{ selectedMomentForLightbox()!.momentDate | slice:0:10 }}
                </span>
              </div>
              @if (selectedMomentForLightbox()!.description) {
                <p class="text-sm text-slate-300 leading-relaxed pt-1">
                  {{ selectedMomentForLightbox()!.description }}
                </p>
              }
            </div>
          </div>
        </div>
      }

      <!-- MODAL: NUEVA CONSULTA MÉDICA (Solo Veterinario/Admin) -->
      @if (showAddRecordModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div class="w-full max-w-lg liquid-glass border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Nueva Consulta Médica</h3>
              <button
                (click)="showAddRecordModal.set(false)"
                class="text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="recordForm" (ngSubmit)="onSubmitRecord()" class="space-y-4">
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

              <div class="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  (click)="showAddRecordModal.set(false)"
                  class="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  [disabled]="recordForm.invalid"
                  class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
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
  selectedMomentForLightbox = signal<PetMoment | null>(null);

  // Moment File Upload
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
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      this.notification.error('Archivo no válido', 'Debes seleccionar una imagen (JPG, PNG, WEBP)');
      return;
    }

    // Validar tamaño (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      this.notification.error('Imagen muy grande', 'El archivo no puede superar los 10 MB');
      return;
    }

    this.selectedFile.set(file);

    // Crear previsualización local
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeSelectedFile(): void {
    this.selectedFile.set(null);
    this.imagePreview.set(null);
  }

  onSubmitMoment(): void {
    if (this.momentForm.invalid || !this.selectedFile() || !this.pet()) return;

    const val = this.momentForm.value;
    const formData = new FormData();
    formData.append('file', this.selectedFile()!);
    formData.append('title', val.title!);
    formData.append('momentDate', val.momentDate!);
    if (val.description) {
      formData.append('description', val.description);
    }

    this.isUploadingMoment.set(true);
    this.petService.addMoment(this.pet()!.id, formData).subscribe({
      next: () => {
        this.notification.success('¡Momento Inmortalizado!', 'La fotografía se guardó en Supabase Storage');
        this.showAddMomentModal.set(false);
        this.isUploadingMoment.set(false);
        this.removeSelectedFile();
        this.loadMoments(this.pet()!.id);
      },
      error: (err) => {
        this.isUploadingMoment.set(false);
        const msg = err.error?.message || 'No se pudo subir la fotografía. Intenta de nuevo.';
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
  }

  closeLightbox(): void {
    this.selectedMomentForLightbox.set(null);
  }

  // ==========================================
  // EXPEDIENTE MÉDICO
  // ==========================================

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
        this.showAddRecordModal.set(false);
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
