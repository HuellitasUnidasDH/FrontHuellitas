import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PetService } from '../../../core/services/pet.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Pet } from '../../../core/models/pet.model';
import { MedicalRecord } from '../../../core/models/medical-record.model';

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
              <div class="w-20 h-20 rounded-2xl bg-emerald-500/10 dark:bg-slate-800 border-2 border-emerald-500/30 flex items-center justify-center text-4xl shadow-xl">
                @if (pet()!.species.toLowerCase().includes('gato')) { 🐱 }
                @else if (pet()!.species.toLowerCase().includes('perro')) { 🐶 }
                @else { 🐾 }
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{{ pet()!.name }}</h1>
                  <span
                    class="px-2.5 py-0.5 text-xs font-bold rounded-full uppercase"
                    [ngClass]="pet()!.gender === 'MALE' ? 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30' : 'bg-pink-500/15 text-pink-700 dark:text-pink-400 border border-pink-500/30'"
                  >
                    {{ pet()!.gender === 'MALE' ? 'Macho' : 'Hembra' }}
                  </span>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {{ pet()!.species }} · {{ pet()!.breed || 'Raza no especificada' }}
                </p>
                @if (pet()!.microchipNumber) {
                  <p class="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    Chip: {{ pet()!.microchipNumber }}
                  </p>
                }
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3">
              <a
                [routerLink]="['/pets/edit', pet()!.id]"
                class="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Editar Mascota
              </a>

              <button
                (click)="showAddRecordModal.set(true)"
                class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                + Nueva Consulta / Vacuna
              </button>
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

        <!-- Medical History Section -->
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

      <!-- Add Medical Record Modal (Liquid Glass) -->
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
  isLoading = signal(true);
  showAddRecordModal = signal(false);

  recordForm = this.fb.group({
    visitDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
    reason: ['', [Validators.required]],
    diagnosis: ['', [Validators.required]],
    treatment: ['', [Validators.required]],
    prescriptions: [''],
    nextAppointmentDate: [''],
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
    });
  }
}
