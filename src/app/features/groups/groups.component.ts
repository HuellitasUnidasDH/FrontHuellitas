import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GroupService } from '../../core/services/group.service';
import { PetService } from '../../core/services/pet.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { PetGroup, GroupFeedMoment } from '../../core/models/group.model';
import { Pet } from '../../core/models/pet.model';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- Header with Action Buttons -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>👨‍👩‍👧‍👦</span> Familias y Grupos Compartidos
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comparte tus mascotas y su álbum de recuerdos con tu familia o pareja mediante un código de invitación.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            (click)="showJoinModal.set(true)"
            class="px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>🔑</span> Unirse con Código
          </button>

          <button
            (click)="openCreateModal()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>✨</span> + Crear Nueva Familia
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="py-24 flex justify-center">
          <div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (groups().length === 0) {
        <!-- Empty State -->
        <div class="liquid-glass rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 max-w-xl mx-auto space-y-4">
          <div class="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-4xl">
            🏡
          </div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">Aún no tienes familias creadas</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Crea tu grupo familiar para invitar a tus seres queridos y compartir fotos, momentos y el cuidado de sus mascotas.
          </p>

          <div class="pt-2 flex justify-center gap-3">
            <button
              (click)="openCreateModal()"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
            >
              Crear mi Primera Familia
            </button>
            <button
              (click)="showJoinModal.set(true)"
              class="px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Tengo un Código
            </button>
          </div>
        </div>
      } @else {
        <!-- Groups Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          @for (group of groups(); track group.id) {
            <div class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-6">
              <!-- Top Row -->
              <div>
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2.5">
                      <h3 class="text-xl font-black text-slate-900 dark:text-white">{{ group.name }}</h3>
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                        [ngClass]="group.myRole === 'OWNER' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'"
                      >
                        {{ group.myRole === 'OWNER' ? '👑 Creador' : 'Miembro' }}
                      </span>
                    </div>

                    @if (group.description) {
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ group.description }}</p>
                    }
                  </div>

                  <!-- Action: View Feed -->
                  <button
                    (click)="openGroupFeed(group)"
                    class="px-3.5 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold border border-teal-500/20 transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>📸</span> Muro Familiar
                  </button>
                </div>

                <!-- Invite Code Box (Liquid Glass Banner) -->
                <div class="mt-5 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4">
                  <div>
                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Código de Invitación</span>
                    <span class="text-base font-black tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">
                      {{ group.inviteCode }}
                    </span>
                  </div>

                  <button
                    (click)="copyCode(group.inviteCode)"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    [ngClass]="copiedCode() === group.inviteCode ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'"
                  >
                    @if (copiedCode() === group.inviteCode) {
                      <span>✓ ¡Copiado!</span>
                    } @else {
                      <span>📋 Copiar Código</span>
                    }
                  </button>
                </div>

                <!-- Section: Mascotas de esta Familia -->
                <div class="mt-5">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Mascotas del Hogar ({{ group.pets.length }})
                    </span>

                    <button
                      (click)="openAssignPetModal(group)"
                      class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      + Vincular Mascota
                    </button>
                  </div>

                  @if (group.pets.length === 0) {
                    <p class="text-xs text-slate-400 italic py-2">No hay mascotas vinculadas a esta familia aún.</p>
                  } @else {
                    <div class="flex flex-wrap gap-2 pt-1">
                      @for (pet of group.pets; track pet.id) {
                        <div class="px-3 py-1.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 shadow-sm">
                          <span class="text-sm">🐾</span>
                          <a [routerLink]="['/pets', pet.id]" class="text-xs font-bold text-slate-800 dark:text-white hover:text-emerald-500 transition-colors">
                            {{ pet.name }}
                          </a>
                          <span class="text-[10px] text-slate-400 font-medium">({{ pet.species }})</span>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Section: Integrantes de la Familia -->
                <div class="mt-5">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                    Integrantes ({{ group.members.length }})
                  </span>

                  <div class="space-y-1.5">
                    @for (member of group.members; track member.userId) {
                      <div class="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-100/50 dark:bg-slate-900/30">
                        <div class="flex items-center gap-2">
                          <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                            {{ member.fullName.charAt(0) }}
                          </span>
                          <span class="font-semibold text-slate-800 dark:text-slate-200">{{ member.fullName }}</span>
                          @if (member.userId === currentUser()?.id) {
                            <span class="text-[10px] text-slate-400 italic">(Tú)</span>
                          }
                        </div>

                        <span class="text-[10px] text-slate-400 font-mono">
                          {{ member.role === 'OWNER' ? 'Creador' : 'Miembro' }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Bottom Actions -->
              <div class="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-end gap-3 text-xs">
                @if (group.myRole === 'OWNER') {
                  <button
                    (click)="onDeleteGroup(group)"
                    class="text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Eliminar Familia
                  </button>
                } @else {
                  <button
                    (click)="onLeaveGroup(group)"
                    class="text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Salir de la Familia
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- MODAL: CREAR NUEVA FAMILIA -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div class="w-full max-w-md liquid-glass border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>✨</span> Crear Nueva Familia
              </h3>
              <button
                (click)="showCreateModal.set(false)"
                class="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="createForm" (ngSubmit)="onSubmitCreate()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre de la Familia o Hogar *
                </label>
                <input
                  type="text"
                  formControlName="name"
                  placeholder="Ej. Familia Ramírez, Hogar Peludo..."
                  class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  formControlName="description"
                  rows="2"
                  placeholder="Unas palabras sobre este hogar o grupo..."
                  class="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                ></textarea>
              </div>

              <div class="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  (click)="showCreateModal.set(false)"
                  class="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  [disabled]="createForm.invalid"
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Crear Familia
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: UNIRSE CON CÓDIGO -->
      @if (showJoinModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div class="w-full max-w-md liquid-glass border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div class="flex items-center justify-between text-left">
              <h3 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔑</span> Unirse a una Familia
              </h3>
              <button
                (click)="showJoinModal.set(false)"
                class="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p class="text-xs text-slate-500 dark:text-slate-400 text-left">
              Ingresa el código de invitación que te compartió el creador de la familia para tener acceso a las mascotas compartidas.
            </p>

            <form [formGroup]="joinForm" (ngSubmit)="onSubmitJoin()" class="space-y-4 pt-2">
              <div>
                <input
                  type="text"
                  formControlName="inviteCode"
                  placeholder="FAM-1234"
                  class="w-full px-4 py-3 rounded-2xl liquid-glass-input text-center text-xl font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div class="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  (click)="showJoinModal.set(false)"
                  class="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  [disabled]="joinForm.invalid"
                  class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Unirme a la Familia
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: VINCULAR MASCOTA A LA FAMILIA -->
      @if (showAssignModal() && selectedGroupForAssign()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div class="w-full max-w-md liquid-glass border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-black text-slate-900 dark:text-white">
                Vincular a "{{ selectedGroupForAssign()!.name }}"
              </h3>
              <button
                (click)="showAssignModal.set(false)"
                class="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p class="text-xs text-slate-500 dark:text-slate-400">
              Selecciona una de tus mascotas para compartirla con los miembros de este grupo:
            </p>

            <div class="space-y-2 max-h-60 overflow-y-auto">
              @for (pet of myAvailablePets(); track pet.id) {
                <div class="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5">
                    <span class="text-lg">🐾</span>
                    <div>
                      <span class="text-xs font-bold text-slate-900 dark:text-white block">{{ pet.name }}</span>
                      <span class="text-[10px] text-slate-400">{{ pet.species }}</span>
                    </div>
                  </div>

                  <button
                    (click)="assignPetToGroup(pet.id)"
                    class="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[11px] hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Vincular
                  </button>
                </div>
              } @empty {
                <p class="text-xs text-slate-400 italic py-4 text-center">
                  Todas tus mascotas ya están vinculadas o no tienes mascotas registradas.
                </p>
              }
            </div>
          </div>
        </div>
      }

      <!-- MODAL: MURO / FEED FAMILIAR DE RECUERDOS -->
      @if (showFeedModal() && selectedGroupForFeed()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div class="w-full max-w-3xl liquid-glass border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
              <div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📸</span> Muro de Recuerdos: {{ selectedGroupForFeed()!.name }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Timeline unificado de todas las mascotas de esta familia
                </p>
              </div>

              <button
                (click)="showFeedModal.set(false)"
                class="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            @if (isLoadingFeed()) {
              <div class="py-16 flex justify-center">
                <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            } @else if (feedMoments().length === 0) {
              <div class="py-16 text-center space-y-2">
                <span class="text-4xl">📷</span>
                <p class="text-xs text-slate-400">Esta familia aún no tiene recuerdos fotográficos compartidos.</p>
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @for (moment of feedMoments(); track moment.id) {
                  <div class="rounded-2xl overflow-hidden bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-md flex flex-col">
                    <div class="h-48 overflow-hidden bg-slate-950 relative">
                      <img
                        [src]="moment.photoUrl"
                        [alt]="moment.title"
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div class="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white">
                        🐾 {{ moment.petName }}
                      </div>
                      <div class="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-emerald-400 font-mono">
                        {{ moment.momentDate | slice:0:10 }}
                      </div>
                    </div>

                    <div class="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 class="font-bold text-slate-900 dark:text-white text-sm">{{ moment.title }}</h4>
                        @if (moment.description) {
                          <p class="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-3">
                            {{ moment.description }}
                          </p>
                        }
                      </div>
                    </div>
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
export class GroupsComponent implements OnInit {
  private groupService = inject(GroupService);
  private petService = inject(PetService);
  private notification = inject(NotificationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  currentUser = this.authService.currentUser;
  groups = signal<PetGroup[]>([]);
  myPets = signal<Pet[]>([]);
  isLoading = signal(true);

  // Modals & Active Selections
  showCreateModal = signal(false);
  showJoinModal = signal(false);
  showAssignModal = signal(false);
  showFeedModal = signal(false);
  isLoadingFeed = signal(false);

  selectedGroupForAssign = signal<PetGroup | null>(null);
  selectedGroupForFeed = signal<PetGroup | null>(null);
  feedMoments = signal<GroupFeedMoment[]>([]);

  copiedCode = signal<string | null>(null);

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: [''],
  });

  joinForm = this.fb.group({
    inviteCode: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(12)]],
  });

  ngOnInit(): void {
    this.loadGroups();
    this.loadMyPets();
  }

  loadGroups(): void {
    this.isLoading.set(true);
    this.groupService.getAll().subscribe({
      next: (data) => {
        this.groups.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadMyPets(): void {
    this.petService.getAll().subscribe({
      next: (pets) => this.myPets.set(pets),
    });
  }

  myAvailablePets(): Pet[] {
    const selectedGroup = this.selectedGroupForAssign();
    if (!selectedGroup) return [];
    return this.myPets().filter((p) => p.groupId !== selectedGroup.id);
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code);
    this.copiedCode.set(code);
    setTimeout(() => {
      this.copiedCode.set(null);
    }, 2500);
  }

  openCreateModal(): void {
    this.createForm.reset({ name: '', description: '' });
    this.showCreateModal.set(true);
  }

  onSubmitCreate(): void {
    if (this.createForm.invalid) return;

    const val = this.createForm.value;
    this.groupService.create({ name: val.name!, description: val.description || undefined }).subscribe({
      next: (newGroup) => {
        this.notification.success('¡Familia Creada!', `Código generado: ${newGroup.inviteCode}`);
        this.showCreateModal.set(false);
        this.loadGroups();
      },
      error: (err) => {
        this.notification.error('Error al crear familia', err.error?.message || 'Inténtalo de nuevo');
      },
    });
  }

  onSubmitJoin(): void {
    if (this.joinForm.invalid) return;

    const code = this.joinForm.value.inviteCode!;
    this.groupService.join({ inviteCode: code }).subscribe({
      next: (joinedGroup) => {
        this.notification.success('¡Bienvenido a la familia!', `Te has unido a ${joinedGroup.name}`);
        this.showJoinModal.set(false);
        this.joinForm.reset();
        this.loadGroups();
        this.loadMyPets();
      },
      error: (err) => {
        this.notification.error('Error al unirse', err.error?.message || 'Código inválido');
      },
    });
  }

  openAssignPetModal(group: PetGroup): void {
    this.selectedGroupForAssign.set(group);
    this.showAssignModal.set(true);
  }

  assignPetToGroup(petId: string): void {
    const group = this.selectedGroupForAssign();
    if (!group) return;

    this.groupService.assignPet(group.id, petId).subscribe({
      next: () => {
        this.notification.success('Mascota Vinculada', 'Ahora todos los miembros de la familia pueden verla');
        this.showAssignModal.set(false);
        this.loadGroups();
        this.loadMyPets();
      },
      error: (err) => {
        this.notification.error('Error al vincular', err.error?.message || 'No se pudo vincular la mascota');
      },
    });
  }

  openGroupFeed(group: PetGroup): void {
    this.selectedGroupForFeed.set(group);
    this.showFeedModal.set(true);
    this.isLoadingFeed.set(true);

    this.groupService.getFeed(group.id).subscribe({
      next: (moments) => {
        this.feedMoments.set(moments);
        this.isLoadingFeed.set(false);
      },
      error: () => this.isLoadingFeed.set(false),
    });
  }

  onLeaveGroup(group: PetGroup): void {
    if (!confirm(`¿Estás seguro de que deseas salir de "${group.name}"?`)) return;

    const userId = this.currentUser()!.id;
    this.groupService.removeMember(group.id, userId).subscribe({
      next: () => {
        this.notification.success('Has salido de la familia', group.name);
        this.loadGroups();
        this.loadMyPets();
      },
    });
  }

  onDeleteGroup(group: PetGroup): void {
    if (!confirm(`¿Estás seguro de eliminar la familia "${group.name}"? Las mascotas volverán a ser personales.`)) return;

    this.groupService.deleteGroup(group.id).subscribe({
      next: () => {
        this.notification.success('Familia eliminada', group.name);
        this.loadGroups();
        this.loadMyPets();
      },
    });
  }
}
