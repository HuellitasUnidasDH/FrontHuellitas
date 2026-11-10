import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PetService } from '../../core/services/pet.service';
import { Pet } from '../../core/models/pet.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- Welcome Header (Liquid Glass) -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 liquid-glass p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Panel de Control</span>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Hola, {{ authService.currentUser()?.fullName }} 👋
          </h1>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gestiona la salud, historiales y registros de tus animales de compañía.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a
            routerLink="/pets/new"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-102 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>+ Registrar Mascota</span>
          </a>
        </div>
      </div>

      <!-- Metrics Cards (Liquid Glass Cards) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="liquid-glass liquid-glass-card rounded-2xl p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Mascotas</span>
            <span class="text-xl">🐾</span>
          </div>
          <div class="text-3xl font-black text-slate-900 dark:text-white mt-2">{{ pets().length }}</div>
          <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">Registros activos</span>
        </div>

        <div class="liquid-glass liquid-glass-card rounded-2xl p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Caninos (Perros)</span>
            <span class="text-xl">🐶</span>
          </div>
          <div class="text-3xl font-black text-slate-900 dark:text-white mt-2">{{ dogCount() }}</div>
          <span class="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">Identificados</span>
        </div>

        <div class="liquid-glass liquid-glass-card rounded-2xl p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Felinos (Gatos)</span>
            <span class="text-xl">🐱</span>
          </div>
          <div class="text-3xl font-black text-slate-900 dark:text-white mt-2">{{ catCount() }}</div>
          <span class="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">Identificados</span>
        </div>

        <div class="liquid-glass liquid-glass-card rounded-2xl p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Esterilizados</span>
            <span class="text-xl">✨</span>
          </div>
          <div class="text-3xl font-black text-slate-900 dark:text-white mt-2">{{ sterilizedCount() }}</div>
          <span class="text-xs text-teal-600 dark:text-teal-400 font-medium mt-1 inline-block">Control reproductivo</span>
        </div>
      </div>

      <!-- Recent Pets Preview -->
      <div class="liquid-glass rounded-3xl p-6 sm:p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">Tus Mascotas Recientes</h2>
          <a routerLink="/pets" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500">
            Ver todas →
          </a>
        </div>

        @if (isLoading()) {
          <div class="py-12 flex justify-center">
            <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (pets().length === 0) {
          <div class="text-center py-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
            <span class="text-4xl">🐾</span>
            <h3 class="text-base font-semibold text-slate-900 dark:text-white mt-3">Aún no hay mascotas registradas</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Comienza registrando tu primera mascota para llevar su historial médico y vacunación.
            </p>
            <a
              routerLink="/pets/new"
              class="inline-block mt-4 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Registrar Mascota
            </a>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (pet of pets().slice(0, 6); track pet.id) {
              <a
                [routerLink]="['/pets', pet.id]"
                class="group p-4 rounded-2xl bg-white/60 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/50 hover:bg-white/90 dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-slate-800 border border-emerald-500/20 dark:border-slate-700 flex items-center justify-center text-xl font-bold text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      @if (pet.species.toLowerCase().includes('gato')) { 🐱 }
                      @else if (pet.species.toLowerCase().includes('perro')) { 🐶 }
                      @else { 🐾 }
                    </div>
                    <div>
                      <h4 class="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {{ pet.name }}
                      </h4>
                      <span class="text-xs text-slate-500 dark:text-slate-400">{{ pet.species }} · {{ pet.breed || 'Sin raza' }}</span>
                    </div>
                  </div>

                  <span
                    class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                    [ngClass]="pet.gender === 'MALE' ? 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30' : 'bg-pink-500/15 text-pink-700 dark:text-pink-400 border border-pink-500/30'"
                  >
                    {{ pet.gender === 'MALE' ? 'Macho' : 'Hembra' }}
                  </span>
                </div>

                @if (pet.microchipNumber) {
                  <div class="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Microchip:</span>
                    <span class="font-mono text-slate-700 dark:text-slate-300 font-semibold">{{ pet.microchipNumber }}</span>
                  </div>
                }
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private petService = inject(PetService);

  pets = signal<Pet[]>([]);
  isLoading = signal(true);

  dogCount = signal(0);
  catCount = signal(0);
  sterilizedCount = signal(0);

  ngOnInit(): void {
    this.loadPets();
  }

  loadPets(): void {
    this.isLoading.set(true);
    this.petService.getAll().subscribe({
      next: (data) => {
        this.pets.set(data);
        this.dogCount.set(
          data.filter((p) => p.species.toLowerCase().includes('perro')).length,
        );
        this.catCount.set(
          data.filter((p) => p.species.toLowerCase().includes('gato')).length,
        );
        this.sterilizedCount.set(data.filter((p) => p.isSterilized).length);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
