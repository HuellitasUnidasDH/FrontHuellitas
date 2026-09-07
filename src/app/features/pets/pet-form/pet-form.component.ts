import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PetService } from '../../../core/services/pet.service';
import { GroupService } from '../../../core/services/group.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PetGender } from '../../../core/models/pet.model';
import { PetGroup } from '../../../core/models/group.model';

@Component({
  selector: 'app-pet-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <a routerLink="/pets" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500">
            ← Volver al listado
          </a>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {{ isEditMode() ? 'Editar Datos de Mascota' : 'Registrar Nueva Mascota' }}
          </h1>
        </div>
      </div>

      <div class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl transition-all">
        <form [formGroup]="petForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- General Info Section -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">
              Información Básica
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre de la Mascota *
                </label>
                <input
                  type="text"
                  formControlName="name"
                  placeholder="Ej. Rocky"
                  class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                @if (petForm.get('name')?.touched && petForm.get('name')?.invalid) {
                  <p class="text-rose-500 dark:text-rose-400 text-xs mt-1">El nombre es requerido</p>
                }
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Especie *
                </label>
                <select
                  formControlName="species"
                  class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Ave">Ave</option>
                  <option value="Conejo">Conejo</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Raza
                </label>
                <input
                  type="text"
                  formControlName="breed"
                  placeholder="Ej. Mestizo, Labrador, Siamés..."
                  class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Sexo
                </label>
                <select
                  formControlName="gender"
                  class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option [value]="PetGender.MALE">Macho</option>
                  <option [value]="PetGender.FEMALE">Hembra</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Family / Group Section -->
          <div class="pt-6 border-t border-slate-200/60 dark:border-slate-800">
            <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
              <span>👨‍👩‍👧‍👦</span> Familia / Grupo Compartido
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Si asignas esta mascota a una familia, todos los miembros podrán verla, subir fotos y compartir recuerdos.
            </p>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Vincular a Familia
              </label>
              <select
                formControlName="groupId"
                class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option [ngValue]="null">🔒 Mascota Individual (Sin grupo compartido)</option>
                @for (group of availableGroups(); track group.id) {
                  <option [ngValue]="group.id">
                    👨‍👩‍👧‍👦 {{ group.name }} (Código: {{ group.inviteCode }})
                  </option>
                }
              </select>
            </div>
          </div>

          <!-- Physical & Identification Section -->
          <div class="pt-6 border-t border-slate-200/60 dark:border-slate-800">
            <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">
              Características & Identificación
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  formControlName="birthDate"
                  class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  formControlName="weightKg"
                  placeholder="Ej. 12.5"
                  class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Color / Pelaje
                </label>
                <input
                  type="text"
                  formControlName="color"
                  placeholder="Ej. Atigrado, Café, Blanco..."
                  class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Número de Microchip (Opcional)
                </label>
                <input
                  type="text"
                  formControlName="microchipNumber"
                  placeholder="Ej. 985141001234567"
                  class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div class="flex items-center pt-6">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    formControlName="isSterilized"
                    class="w-5 h-5 rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">¿Está esterilizado / castrado?</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Clinical Notes -->
          <div class="pt-6 border-t border-slate-200/60 dark:border-slate-800">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Observaciones o Alergias Especiales
            </label>
            <textarea
              formControlName="notes"
              rows="3"
              placeholder="Detalles sobre comportamiento, alergias alimentarias, cirugías previas..."
              class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            ></textarea>
          </div>

          <!-- Submit Buttons -->
          <div class="pt-6 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-3">
            <a
              routerLink="/pets"
              class="px-5 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </a>
            <button
              type="submit"
              [disabled]="petForm.invalid || isSubmitting()"
              class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer transition-all hover:scale-102 active:scale-98 flex items-center gap-2"
            >
              @if (isSubmitting()) {
                <span class="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Guardando...</span>
              } @else {
                <span>{{ isEditMode() ? 'Actualizar Mascota' : 'Guardar Mascota' }}</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class PetFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private petService = inject(PetService);
  private groupService = inject(GroupService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  PetGender = PetGender;

  isEditMode = signal(false);
  isSubmitting = signal(false);
  petId = signal<string | null>(null);
  availableGroups = signal<PetGroup[]>([]);

  petForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    species: ['Perro', [Validators.required]],
    breed: [''],
    gender: [PetGender.MALE],
    groupId: [null as string | null],
    birthDate: [''],
    weightKg: [null as number | null],
    color: [''],
    microchipNumber: [''],
    isSterilized: [false],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadGroups();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.petId.set(id);
      this.loadPetData(id);
    }
  }

  loadGroups(): void {
    this.groupService.getAll().subscribe({
      next: (groups) => this.availableGroups.set(groups),
      error: () => {},
    });
  }

  loadPetData(id: string): void {
    this.petService.getById(id).subscribe({
      next: (pet) => {
        this.petForm.patchValue({
          name: pet.name,
          species: pet.species,
          breed: pet.breed || '',
          gender: pet.gender,
          groupId: pet.groupId || null,
          birthDate: pet.birthDate ? pet.birthDate.substring(0, 10) : '',
          weightKg: pet.weightKg ? Number(pet.weightKg) : null,
          color: pet.color || '',
          microchipNumber: pet.microchipNumber || '',
          isSterilized: pet.isSterilized,
          notes: pet.notes || '',
        });
      },
      error: () => {
        this.router.navigate(['/pets']);
      },
    });
  }

  onSubmit(): void {
    if (this.petForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.petForm.value;

    const payload: any = {
      name: formVal.name!,
      species: formVal.species!,
      breed: formVal.breed || undefined,
      gender: formVal.gender || PetGender.MALE,
      groupId: formVal.groupId || null,
      birthDate: formVal.birthDate || undefined,
      weightKg: formVal.weightKg ? Number(formVal.weightKg) : undefined,
      color: formVal.color || undefined,
      microchipNumber: formVal.microchipNumber || undefined,
      isSterilized: !!formVal.isSterilized,
      notes: formVal.notes || undefined,
    };

    if (this.isEditMode() && this.petId()) {
      this.petService.update(this.petId()!, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.notification.success('Actualizado', 'Datos de la mascota actualizados exitosamente');
          this.router.navigate(['/pets', this.petId()!]);
        },
        error: () => this.isSubmitting.set(false),
      });
    } else {
      this.petService.create(payload).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.notification.success('Registrado', 'Mascota registrada correctamente');
          this.router.navigate(['/pets', created.id]);
        },
        error: () => this.isSubmitting.set(false),
      });
    }
  }
}

