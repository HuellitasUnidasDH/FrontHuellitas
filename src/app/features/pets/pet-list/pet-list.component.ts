import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../../core/services/pet.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { Pet } from '../../../core/models/pet.model';

@Component({
  selector: 'app-pet-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Registro de Mascotas</h1>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">Explora, filtra y administra todas tus mascotas</p>
        </div>

        <a
          routerLink="/pets/new"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
        >
          <span>+ Nueva Mascota</span>
        </a>
      </div>

      <!-- Filters & Search Bar (Liquid Glass) -->
      <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between liquid-glass p-4 rounded-2xl shadow-md">
        <!-- Search Input -->
        <div class="relative flex-1">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="applyFilters()"
            placeholder="Buscar por nombre o número de microchip..."
            class="w-full pl-10 pr-4 py-2 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <span class="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
        </div>

        <!-- Species Filter Pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            (click)="setSpeciesFilter('')"
            [class.bg-emerald-500]="selectedSpecies() === ''"
            [class.text-slate-950]="selectedSpecies() === ''"
            [class.bg-slate-200]="selectedSpecies() !== ''"
            [class.dark:bg-slate-800]="selectedSpecies() !== ''"
            [class.text-slate-700]="selectedSpecies() !== ''"
            [class.dark:text-slate-300]="selectedSpecies() !== ''"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shadow-sm"
          >
            Todas
          </button>
          <button
            (click)="setSpeciesFilter('Perro')"
            [class.bg-emerald-500]="selectedSpecies() === 'Perro'"
            [class.text-slate-950]="selectedSpecies() === 'Perro'"
            [class.bg-slate-200]="selectedSpecies() !== 'Perro'"
            [class.dark:bg-slate-800]="selectedSpecies() !== 'Perro'"
            [class.text-slate-700]="selectedSpecies() !== 'Perro'"
            [class.dark:text-slate-300]="selectedSpecies() !== 'Perro'"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shadow-sm"
          >
            🐶 Perros
          </button>
          <button
            (click)="setSpeciesFilter('Gato')"
            [class.bg-emerald-500]="selectedSpecies() === 'Gato'"
            [class.text-slate-950]="selectedSpecies() === 'Gato'"
            [class.bg-slate-200]="selectedSpecies() !== 'Gato'"
            [class.dark:bg-slate-800]="selectedSpecies() !== 'Gato'"
            [class.text-slate-700]="selectedSpecies() !== 'Gato'"
            [class.dark:text-slate-300]="selectedSpecies() !== 'Gato'"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shadow-sm"
          >
            🐱 Gatos
          </button>
          <button
            (click)="applyFilters()"
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            Filtrar
          </button>
        </div>
      </div>

      <!-- Pets Grid -->
      @if (isLoading()) {
        <div class="py-24 flex justify-center">
          <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (pets().length === 0) {
        <div class="text-center py-20 liquid-glass rounded-3xl">
          <span class="text-5xl">🔎</span>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mt-4">No se encontraron mascotas</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Prueba ajustando tus términos de búsqueda o registra una nueva mascota.
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (pet of pets(); track pet.id) {
            <div class="liquid-glass liquid-glass-card rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <!-- Card Header -->
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-slate-800 border border-emerald-500/20 dark:border-slate-700 flex items-center justify-center text-2xl">
                      @if (pet.species.toLowerCase().includes('gato')) { 🐱 }
                      @else if (pet.species.toLowerCase().includes('perro')) { 🐶 }
                      @else { 🐾 }
                    </div>
                    <div>
                      <h3 class="font-bold text-base text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        <a [routerLink]="['/pets', pet.id]">{{ pet.name }}</a>
                      </h3>
                      <p class="text-xs text-slate-500 dark:text-slate-400">{{ pet.species }} · {{ pet.breed || 'Sin raza' }}</p>
                      @if (pet.group) {
                        <span class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          👨‍👩‍👧‍👦 {{ pet.group.name }}
                        </span>
                      }
                    </div>
                  </div>

                  <span
                    class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                    [ngClass]="pet.gender === 'MALE' ? 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30' : 'bg-pink-500/15 text-pink-700 dark:text-pink-400 border border-pink-500/30'"
                  >
                    {{ pet.gender === 'MALE' ? 'Macho' : 'Hembra' }}
                  </span>
                </div>

                <!-- Attributes Info -->
                <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div class="p-2 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/60">
                    <span class="text-slate-400 block text-[10px] uppercase">Peso</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200">
                      {{ pet.weightKg ? pet.weightKg + ' kg' : 'No registrado' }}
                    </span>
                  </div>

                  <div class="p-2 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/60">
                    <span class="text-slate-400 block text-[10px] uppercase">Esterilizado</span>
                    <span class="font-semibold" [ngClass]="pet.isSterilized ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'">
                      {{ pet.isSterilized ? 'Sí' : 'No' }}
                    </span>
                  </div>
                </div>

                @if (pet.microchipNumber) {
                  <div class="mt-3 text-[11px] text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/40 flex items-center justify-between">
                    <span>Chip:</span>
                    <span class="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{{ pet.microchipNumber }}</span>
                  </div>
                }
              </div>

              <!-- Card Actions -->
              <div class="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <a
                  [routerLink]="['/pets', pet.id]"
                  class="flex-1 text-center py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 transition-colors"
                >
                  Expediente Clínico
                </a>

                <a
                  [routerLink]="['/pets/edit', pet.id]"
                  class="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Editar mascota"
                >
                  ✏️
                </a>

                <button
                  (click)="onDeletePet(pet)"
                  class="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-rose-500/20 border border-transparent text-xs text-rose-500 dark:text-rose-400 transition-colors cursor-pointer"
                  title="Eliminar mascota"
                >
                  🗑️
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PetListComponent implements OnInit {
  private petService = inject(PetService);
  private notification = inject(NotificationService);
  private confirmService = inject(ConfirmService);

  pets = signal<Pet[]>([]);
  isLoading = signal(true);
  searchQuery = '';
  selectedSpecies = signal('');

  ngOnInit(): void {
    this.fetchPets();
  }

  fetchPets(): void {
    this.isLoading.set(true);
    this.petService.getAll(this.searchQuery, this.selectedSpecies()).subscribe({
      next: (data) => {
        this.pets.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.fetchPets();
  }

  setSpeciesFilter(species: string): void {
    this.selectedSpecies.set(species);
    this.fetchPets();
  }

  async onDeletePet(pet: Pet): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Dar de baja mascota',
      message: `¿Estás seguro de que deseas dar de baja el registro de "${pet.name}"?`,
      submessage: 'La ficha dejará de mostrarse en tu lista activa, pero se conservará archivada en la base de datos como respaldo.',
      confirmText: 'Sí, dar de baja',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: '🗑️',
    });
    if (!confirmed) return;

    this.petService.delete(pet.id).subscribe({
      next: () => {
        this.notification.success('Mascota dada de baja', `${pet.name} fue archivada exitosamente`);
        this.fetchPets();
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Error al dar de baja a la mascota');
      },
    });
  }
}
