import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AllyService } from '../../core/services/ally.service';
import { ColoniaService } from '../../core/services/colonia.service';
import { Ally, AllyCategory } from '../../core/models/ally.model';
import { Colonia } from '../../core/models/colonia.model';
import { BRAND_CONFIG } from '../../core/constants/brand.constants';

@Component({
  selector: 'app-allies-directory',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <!-- Header Banner -->
      <section class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-emerald-500/20">
        <div class="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-gradient-to-br from-teal-400/20 to-emerald-500/20 blur-3xl pointer-events-none"></div>

        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div class="flex items-center gap-4 text-center sm:text-left">
            <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 flex-shrink-0">
              🩺
            </div>
            <div>
              <div class="flex items-center justify-center sm:justify-start gap-2">
                <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Aliados Comerciales
                </h1>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  {{ brand.city }}
                </span>
              </div>
              <p class="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                Directorio verificado de clínicas veterinarias, estéticas caninas y tiendas locales con promociones exclusivas para adoptantes de {{ brand.name }}.
              </p>
            </div>
          </div>

          <a
            routerLink="/"
            class="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            ← Volver al Muro
          </a>
        </div>
      </section>

      <!-- Category Filter Pills -->
      <section class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          (click)="setCategory('')"
          class="px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap"
          [ngClass]="selectedCategory() === '' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
        >
          🏥 Todos ({{ allies().length }})
        </button>

        <button
          (click)="setCategory('VETERINARIA')"
          class="px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap"
          [ngClass]="selectedCategory() === 'VETERINARIA' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
        >
          🩺 Veterinarias
        </button>

        <button
          (click)="setCategory('ESTETICA_CANINA')"
          class="px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap"
          [ngClass]="selectedCategory() === 'ESTETICA_CANINA' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
        >
          ✂️ Estéticas Caninas
        </button>

        <button
          (click)="setCategory('TIENDA_ALIMENTOS')"
          class="px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap"
          [ngClass]="selectedCategory() === 'TIENDA_ALIMENTOS' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md' : 'liquid-glass text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
        >
          🥣 Alimentos & Accesorios
        </button>
      </section>

      <!-- Allies Grid -->
      <section>
        @if (isLoading()) {
          <div class="liquid-glass rounded-3xl p-16 text-center space-y-3">
            <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-xs font-bold text-slate-500">Cargando directorio de Dolores Hidalgo...</p>
          </div>
        } @else if (filteredAllies().length === 0) {
          <div class="liquid-glass rounded-3xl p-12 text-center space-y-3">
            <span class="text-4xl">🏥</span>
            <p class="text-sm font-bold text-slate-800 dark:text-white">No hay negocios en esta categoría</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (ally of filteredAllies(); track ally.id) {
              <div class="liquid-glass-card liquid-glass rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 border border-slate-200/80 dark:border-slate-800">
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <span class="text-3xl">
                      {{ getCategoryIcon(ally.category) }}
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      ✓ Verificado
                    </span>
                  </div>

                  <div>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {{ ally.businessName }}
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <span>📍</span> {{ ally.address }}
                    </p>
                  </div>

                  <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {{ ally.description }}
                  </p>

                  <!-- Promotion Banner for Adopters -->
                  @if (ally.hasPromotionForAdopters && ally.promotionDescription) {
                    <div class="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border border-amber-500/30 text-xs">
                      <span class="font-extrabold text-amber-700 dark:text-amber-400 block mb-0.5 flex items-center gap-1">
                        <span>🎁</span> Beneficio Adopción Responsable:
                      </span>
                      <p class="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                        {{ ally.promotionDescription }}
                      </p>
                    </div>
                  }
                </div>

                <!-- Contact Buttons -->
                <div class="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2">
                  @if (ally.whatsappPhone) {
                    <a
                      [href]="getWhatsAppUrl(ally.whatsappPhone, ally.businessName)"
                      target="_blank"
                      class="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs text-center flex items-center justify-center gap-1 shadow-md transition-colors"
                    >
                      <span>💬</span> WhatsApp
                    </a>
                  }
                  <a
                    [href]="'tel:' + ally.phone"
                    class="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    📞 Llamar
                  </a>
                </div>
              </div>
            }
          </div>
        }
      </section>

    </div>
  `,
})
export class AlliesDirectoryComponent implements OnInit {
  brand = BRAND_CONFIG;
  private allyService = inject(AllyService);

  allies = signal<Ally[]>([]);
  isLoading = signal<boolean>(true);
  selectedCategory = signal<string>('');

  filteredAllies = computed(() => {
    const cat = this.selectedCategory();
    if (!cat) return this.allies();
    return this.allies().filter((a) => a.category === cat);
  });

  ngOnInit(): void {
    this.loadAllies();
  }

  loadAllies(): void {
    this.isLoading.set(true);
    this.allyService.getAll().subscribe({
      next: (data) => {
        this.allies.set(data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  setCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }

  getCategoryIcon(cat: AllyCategory): string {
    switch (cat) {
      case 'VETERINARIA': return '🩺';
      case 'ESTETICA_CANINA': return '✂️';
      case 'TIENDA_ALIMENTOS': return '🥣';
      default: return '🏥';
    }
  }

  getWhatsAppUrl(phone: string, name: string): string {
    const text = encodeURIComponent(`Hola ${name}, vi su negocio en el directorio de ${this.brand.name} Dolores Hidalgo. Me gustaría pedir informes sobre sus servicios.`);
    return `https://wa.me/52${phone.replace(/\D/g, '')}?text=${text}`;
  }
}
