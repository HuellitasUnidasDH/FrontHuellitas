import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService, UserPublications } from '../../core/services/user.service';
import { ColoniaService } from '../../core/services/colonia.service';
import { NotificationService } from '../../core/services/notification.service';
import { ImageUploadService } from '../../core/services/image-upload.service';
import { PetService } from '../../core/services/pet.service';
import { LostPetService } from '../../core/services/lost-pet.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { User, UserRole } from '../../core/models/user.model';
import { Colonia } from '../../core/models/colonia.model';
import { Pet } from '../../core/models/pet.model';
import { LostPetReport } from '../../core/models/lost-pet.model';
import { BRAND_CONFIG } from '../../core/constants/brand.constants';
import { getStageMeta } from '../adoptions/shared/adoption-helpers.util';
import { AdoptionRequestStatus } from '../../core/models/adoption.model';

type ProfileTab = 'PETS' | 'LOST' | 'ADOPTIONS';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">

      <!-- ======================================================== -->
      <!-- Profile Header Card (Liquid Glass with Dolores Hgo Theme)-->
      <!-- ======================================================== -->
      <section class="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-emerald-500/20">
        <div class="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-400/10 blur-2xl pointer-events-none"></div>

        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          
          <!-- Avatar with Edit Photo Button -->
          <div class="relative group flex-shrink-0">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 p-1 shadow-xl shadow-emerald-500/20">
              @if (user()?.profilePhotoUrl) {
                <img
                  [src]="user()!.profilePhotoUrl"
                  [alt]="user()!.fullName"
                  class="w-full h-full object-cover rounded-2xl bg-white dark:bg-slate-900"
                />
              } @else {
                <div class="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {{ (user()?.fullName || 'U').charAt(0) }}
                </div>
              }
            </div>

            <!-- Quick Photo Change Button Overlay -->
            <button
              (click)="openPhotoModal()"
              class="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg border border-white/20 transition-all cursor-pointer text-sm"
              title="Cambiar foto de perfil"
            >
              📷
            </button>
          </div>

          <!-- User Details -->
          <div class="flex-1 text-center sm:text-left space-y-2">
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {{ user()?.fullName || 'Cargando perfil...' }}
              </h1>

              <!-- Role Badge -->
              <span class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                {{ getRoleBadge(user()?.role) }}
              </span>

              <!-- Verification Badge -->
              @if (user()?.verificationLevel && user()!.verificationLevel! > 0) {
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30">
                  🛡️ Nivel {{ user()?.verificationLevel }}
                </span>
              }
            </div>

            <!-- User Meta Information -->
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-300">
              <span class="flex items-center gap-1">
                <span>✉️</span> {{ user()?.email }}
              </span>
              @if (user()?.phone) {
                <span class="flex items-center gap-1">
                  <span>📱</span> {{ user()?.phone }}
                </span>
              }
              <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>📍</span> {{ user()?.colonia?.name || 'Dolores Hidalgo' }}
              </span>
            </div>

            <p class="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Miembro de {{ brand.name }} desde {{ formatDate(user()?.createdAt) }}
            </p>
          </div>

          <!-- Edit Profile Action Button -->
          <div class="flex-shrink-0">
            <button
              (click)="openEditModal()"
              class="px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>✏️</span> Editar Perfil
            </button>
          </div>
        </div>
      </section>

      <!-- ======================================================== -->
      <!-- Publications Tabs Navigation                             -->
      <!-- ======================================================== -->
      <section class="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-2">
        <button
          (click)="activeTab.set('PETS')"
          [ngClass]="activeTab() === 'PETS' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 font-bold'"
          class="px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>🐾</span>
          <span>Mis Mascotas en Adopción</span>
          <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
            {{ publications()?.pets?.length || 0 }}
          </span>
        </button>

        <button
          (click)="activeTab.set('LOST')"
          [ngClass]="activeTab() === 'LOST' ? 'bg-rose-500 text-white shadow-md font-black' : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 font-bold'"
          class="px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>🚨</span>
          <span>Mis Reportes de Extravío</span>
          <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
            {{ publications()?.lostReports?.length || 0 }}
          </span>
        </button>

        <button
          (click)="activeTab.set('ADOPTIONS')"
          [ngClass]="activeTab() === 'ADOPTIONS' ? 'bg-sky-500 text-white shadow-md font-black' : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 font-bold'"
          class="px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>📋</span>
          <span>Mis Solicitudes</span>
          <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
            {{ publications()?.adoptionRequests?.length || 0 }}
          </span>
        </button>
      </section>

      <!-- ======================================================== -->
      <!-- Tab Content Area                                         -->
      <!-- ======================================================== -->
      @if (isLoading()) {
        <div class="liquid-glass rounded-3xl p-12 text-center space-y-3">
          <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400">Cargando tus publicaciones...</p>
        </div>
      } @else {

        <!-- TAB 1: MIS MASCOTAS EN ADOPCIÓN -->
        @if (activeTab() === 'PETS') {
          @if (!publications()?.pets || publications()!.pets.length === 0) {
            <div class="liquid-glass rounded-3xl p-10 text-center space-y-3 border border-slate-200/80 dark:border-slate-800/80">
              <span class="text-4xl">🐾</span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Aún no has publicado mascotas en adopción</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                ¿Rescataste a un peludito en Dolores Hidalgo? Dale visibilidad en toda la comunidad para encontrarle una familia amorosa.
              </p>
              <div class="pt-2">
                <a
                  routerLink="/pets/new"
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                >
                  <span>➕</span> Publicar Mascota en Adopción
                </a>
              </div>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (pet of publications()!.pets; track pet.id) {
                <div class="liquid-glass rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800/80 flex flex-col group">
                  <div class="h-44 bg-slate-950/20 relative overflow-hidden">
                    <img
                      [src]="pet.photoUrl || (pet.photos && pet.photos[0]) || 'assets/pet-placeholder.jpg'"
                      [alt]="pet.name"
                      class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <span
                      class="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-sm"
                      [ngClass]="{
                        'bg-emerald-500 text-slate-950': pet.status === 'DISPONIBLE',
                        'bg-amber-500 text-slate-950': pet.status === 'EN_PROCESO',
                        'bg-sky-500 text-white': pet.status === 'ADOPTADA'
                      }"
                    >
                      {{ pet.status }}
                    </span>
                  </div>

                  <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 class="text-sm font-black text-slate-900 dark:text-white">{{ pet.name }}</h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400">
                        {{ pet.species }} • {{ pet.breed || 'Mestizo' }} • Talla {{ pet.size || 'Mediana' }}
                      </p>
                    </div>

                    <div class="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                      <span class="text-slate-400 text-[11px] flex items-center gap-1">
                        <span>🕒</span> {{ formatExactDateTime(pet.createdAt) }}
                      </span>
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          (click)="deactivatePet(pet.id)"
                          class="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer text-xs"
                          title="Desactivar y archivar publicación"
                        >
                          🗑️
                        </button>
                        <a
                          [routerLink]="['/adopciones', pet.id]"
                          class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                        >
                          Ver ficha →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        }

        <!-- TAB 2: MIS REPORTES DE EXTRAVÍO / RESCATE -->
        @if (activeTab() === 'LOST') {
          @if (!publications()?.lostReports || publications()!.lostReports.length === 0) {
            <div class="liquid-glass rounded-3xl p-10 text-center space-y-3 border border-slate-200/80 dark:border-slate-800/80">
              <span class="text-4xl">🚨</span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">No tienes reportes de extravío activos</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Si se perdió tu mascota o encontraste a un peludito en la calle de Dolores Hidalgo, genera un reporte para alertar a la red.
              </p>
              <div class="pt-2">
                <a
                  routerLink="/perdidas"
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  <span>🚨</span> Crear Reporte de Alerta
                </a>
              </div>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (rep of publications()!.lostReports; track rep.id) {
                <div class="liquid-glass rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800/80 flex flex-col group">
                  <div class="h-44 bg-slate-950/20 relative overflow-hidden">
                    <img
                      [src]="(rep.photos && rep.photos[0]) || 'assets/pet-placeholder.jpg'"
                      [alt]="rep.petName"
                      class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div class="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-sm"
                        [ngClass]="{
                          'bg-rose-600 text-white': rep.type === 'ANIMAL_HERIDO',
                          'bg-amber-500 text-slate-950': rep.type === 'EN_RESGUARDO',
                          'bg-emerald-500 text-slate-950': rep.type === 'EN_ADOPCION',
                          'bg-purple-600 text-white': rep.type === 'CAMPANA_COMUNITARIA',
                          'bg-rose-500 text-white': rep.type === 'SE_BUSCA' || rep.type === 'EXTRAVIADA',
                          'bg-sky-500 text-white': rep.type === 'ENCONTRADA_EN_CALLE'
                        }"
                      >
                        @switch (rep.type) {
                          @case ('ANIMAL_HERIDO') { 🚨 Animal Herido }
                          @case ('EN_RESGUARDO') { 🏠 En Resguardo }
                          @case ('EN_ADOPCION') { 💚 En Adopción }
                          @case ('CAMPANA_COMUNITARIA') { 📢 Campaña }
                          @case ('SE_BUSCA') { 🔍 Se Busca }
                          @case ('EXTRAVIADA') { 🔍 Se Busca }
                          @default { 📍 Reporte }
                        }
                      </span>

                      @if (rep.isInjured) {
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                          Herido
                        </span>
                      }
                    </div>
                  </div>

                  <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 class="text-sm font-black text-slate-900 dark:text-white">{{ rep.petName }}</h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400">
                        📍 {{ rep.lastSeenLocation }}
                      </p>
                      @if (rep.sightings && rep.sightings.length > 0) {
                        <span class="inline-block mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          📑 {{ rep.sightings.length }} avistamientos reportados
                        </span>
                      }
                    </div>

                    <div class="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                      <span class="text-slate-400 text-[11px] flex items-center gap-1">
                        <span>🕒</span> {{ formatExactDateTime(rep.createdAt) }}
                      </span>
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          (click)="deactivateLostReport(rep.id)"
                          class="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer text-xs"
                          title="Desactivar y archivar reporte"
                        >
                          🗑️
                        </button>
                        <a
                          routerLink="/perdidas"
                          class="text-rose-600 dark:text-rose-400 font-bold hover:underline"
                        >
                          Ver en el muro →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        }

        <!-- TAB 3: MIS SOLICITUDES DE ADOPCIÓN -->
        @if (activeTab() === 'ADOPTIONS') {
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p class="text-xs text-slate-600 dark:text-slate-300">
              Visualiza el avance oficial de 4 pasos de tus postulaciones, firma Convenios y sube seguimientos en tu portal dedicado.
            </p>
            <a
              routerLink="/mis-adopciones"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-sm hover:brightness-105"
            >
              🐾 Ir a Portal Mis Adopciones →
            </a>
          </div>

          @if (!publications()?.adoptionRequests || publications()!.adoptionRequests.length === 0) {
            <div class="liquid-glass rounded-3xl p-10 text-center space-y-3 border border-slate-200/80 dark:border-slate-800/80">
              <span class="text-4xl">📋</span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">No tienes solicitudes de adopción enviadas</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Explora los peluditos disponibles en Dolores Hidalgo y postúlate para darles un hogar responsable.
              </p>
              <div class="pt-2">
                <a
                  routerLink="/adopciones"
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                >
                  <span>🏠</span> Ver Peluditos en Adopción
                </a>
              </div>
            </div>
          } @else {
            <div class="space-y-3">
              @for (req of publications()!.adoptionRequests; track req.id) {
                @let stage = adoptionStageMeta(req.status);
                <div class="liquid-glass rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xl font-bold">
                        🐾
                      </div>
                      <div>
                        <h4 class="text-sm font-black text-slate-900 dark:text-white">
                          Solicitud para adoptar a {{ req.pet?.name || 'Mascota' }}
                        </h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                          Enviada el: {{ formatExactDateTime(req.createdAt) }}
                        </p>
                      </div>
                    </div>

                    <span
                      class="px-3 py-1 rounded-full text-xs font-extrabold uppercase shadow-sm border"
                      [ngClass]="stage.colorClass"
                    >
                      {{ stage.label }}
                    </span>
                  </div>

                  <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      [style.width.%]="stage.progress"
                    ></div>
                  </div>

                  @if (req.publisherNotes) {
                    <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-700 dark:text-slate-300">
                      <span class="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">💬 Nota del rescatista:</span>
                      {{ req.publisherNotes }}
                    </div>
                  }
                </div>
              }
            </div>
          }
        }

      }

      <!-- ======================================================== -->
      <!-- MODAL: EDITAR DATOS DE PERFIL                           -->
      <!-- ======================================================== -->
      @if (isEditModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div class="liquid-glass rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-emerald-500/30 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              (click)="closeEditModal()"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>

            <div class="flex items-center gap-3">
              <span class="text-2xl">✏️</span>
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Editar Perfil</h3>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  [(ngModel)]="editForm.fullName"
                  (ngModelChange)="profileAttempted.set(false)"
                  class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                  [ngClass]="profileAttempted() && !editForm.fullName.trim() ? 'border-rose-500 bg-rose-500/5' : 'border-slate-300 dark:border-slate-700'"
                />
                @if (profileAttempted() && !editForm.fullName.trim()) {
                  <p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    El nombre completo es obligatorio.
                  </p>
                }
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  [(ngModel)]="editForm.phone"
                  class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Colonia en Dolores Hidalgo</label>
                <select
                  [(ngModel)]="editForm.coloniaId"
                  class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">Selecciona tu colonia...</option>
                  @for (col of colonias(); track col.id) {
                    <option [value]="col.id">{{ col.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Foto de Perfil</label>
                
                <!-- Selector de origen de foto para modal de edición -->
                <div class="flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1 mb-2 gap-1 text-[11px] font-bold">
                  <button
                    type="button"
                    (click)="editPhotoSource.set('FILE')"
                    [ngClass]="{ 'bg-emerald-500 text-slate-950 shadow': editPhotoSource() === 'FILE', 'text-slate-600 dark:text-slate-400': editPhotoSource() !== 'FILE' }"
                    class="flex-1 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    📁 Desde mi dispositivo
                  </button>
                  <button
                    type="button"
                    (click)="editPhotoSource.set('URL')"
                    [ngClass]="{ 'bg-emerald-500 text-slate-950 shadow': editPhotoSource() === 'URL', 'text-slate-600 dark:text-slate-400': editPhotoSource() !== 'URL' }"
                    class="flex-1 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    🔗 Pegar enlace URL
                  </button>
                </div>

                @if (editPhotoSource() === 'FILE') {
                  <div>
                    <label class="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl p-3 cursor-pointer bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all">
                      <span class="text-xl mb-1">📁</span>
                      <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Seleccionar foto de celular o PC</span>
                      <span class="text-[10px] text-slate-500 dark:text-slate-400">JPG, PNG o WEBP</span>
                      <input
                        type="file"
                        accept="image/*"
                        (change)="onEditPhotoFileSelected($event)"
                        class="hidden"
                      />
                    </label>
                  </div>
                } @else {
                  <input
                    type="url"
                    [(ngModel)]="editForm.profilePhotoUrl"
                    (ngModelChange)="editFormPhotoPreview.set($event)"
                    placeholder="https://images.unsplash.com/..."
                    class="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                }

                @if (editFormPhotoPreview() || editForm.profilePhotoUrl) {
                  <div class="mt-2 flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-emerald-500/30">
                    <img
                      [src]="editFormPhotoPreview() || editForm.profilePhotoUrl"
                      alt="Vista previa de perfil"
                      class="w-12 h-12 rounded-xl object-cover border border-emerald-500/40 shadow-sm"
                    />
                    <div class="flex-1 text-[11px] text-slate-600 dark:text-slate-300 truncate">
                      Vista previa lista para guardar
                    </div>
                  </div>
                }
              </div>

              <div class="pt-3 flex gap-2">
                <button
                  (click)="saveProfile()"
                  [disabled]="isSaving()"
                  class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  @if (isSaving()) {
                    <span>Guardando...</span>
                  } @else {
                    <span>Guardar Cambios</span>
                  }
                </button>
                <button
                  (click)="closeEditModal()"
                  class="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL RÁPIDO: CAMBIAR FOTO DE PERFIL (FILE O URL)        -->
      <!-- ======================================================== -->
      @if (isPhotoModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div class="liquid-glass rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative border border-emerald-500/30 space-y-4">
            <button
              (click)="closePhotoModal()"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>

            <div class="flex items-center gap-2.5">
              <span class="text-2xl">📷</span>
              <div>
                <h3 class="text-base font-black text-slate-900 dark:text-white">Cambiar Foto de Perfil</h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Actualiza tu avatar desde tu dispositivo o mediante enlace web</p>
              </div>
            </div>

            <!-- Tabs: Dispositivo vs URL -->
            <div class="flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1 gap-1 text-xs font-bold">
              <button
                type="button"
                (click)="quickPhotoSource.set('FILE')"
                [ngClass]="{ 'bg-emerald-500 text-slate-950 shadow': quickPhotoSource() === 'FILE', 'text-slate-600 dark:text-slate-400': quickPhotoSource() !== 'FILE' }"
                class="flex-1 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                📁 Desde mi dispositivo
              </button>
              <button
                type="button"
                (click)="quickPhotoSource.set('URL')"
                [ngClass]="{ 'bg-emerald-500 text-slate-950 shadow': quickPhotoSource() === 'URL', 'text-slate-600 dark:text-slate-400': quickPhotoSource() !== 'URL' }"
                class="flex-1 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                🔗 Pegar enlace web
              </button>
            </div>

            <div class="space-y-3 text-xs">
              @if (quickPhotoSource() === 'FILE') {
                <div>
                  <label class="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 cursor-pointer bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all">
                    <span class="text-3xl mb-1.5">📷</span>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Toca para elegir foto de celular o PC</span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Formatos JPG, PNG, WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      (change)="onQuickPhotoFileSelected($event)"
                      class="hidden"
                    />
                  </label>
                </div>
              } @else {
                <div class="space-y-1">
                  <label class="block font-bold text-slate-700 dark:text-slate-300">Enlace de la imagen (URL)</label>
                  <input
                    type="url"
                    [(ngModel)]="quickPhotoUrl"
                    (ngModelChange)="quickPhotoPreview.set($event)"
                    placeholder="https://images.unsplash.com/..."
                    class="w-full px-3 py-2.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              }

              <!-- Previsualización de la foto seleccionada -->
              @if (quickPhotoPreview() || (quickPhotoSource() === 'URL' && quickPhotoUrl.trim())) {
                <div class="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/70 border border-emerald-500/30 flex items-center gap-3">
                  <img
                    [src]="quickPhotoPreview() || quickPhotoUrl"
                    alt="Vista previa de perfil"
                    class="w-16 h-16 rounded-2xl object-cover border border-emerald-500/50 shadow-md"
                  />
                  <div class="flex-1 min-w-0">
                    <h5 class="text-xs font-bold text-slate-900 dark:text-white truncate">Vista previa lista</h5>
                    <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {{ quickPhotoSource() === 'FILE' ? 'Archivo listo para subir' : 'Enlace web válido' }}
                    </p>
                  </div>
                </div>
              }

              @if (photoAttempted() && ((quickPhotoSource() === 'FILE' && !selectedQuickFile()) || (quickPhotoSource() === 'URL' && !quickPhotoUrl.trim()))) {
                <p class="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {{ quickPhotoSource() === 'FILE' ? 'Selecciona una fotografía de tu dispositivo antes de guardar.' : 'Pega el enlace URL válido de la fotografía.' }}
                </p>
              }

              <div class="pt-2 flex gap-2">
                <button
                  (click)="savePhotoOnly()"
                  [disabled]="isSaving()"
                  class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  @if (isSaving()) {
                    <div class="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando fotografía...</span>
                  } @else {
                    <span>Guardar Fotografía</span>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class ProfileComponent implements OnInit, OnDestroy {
  brand = BRAND_CONFIG;
  authService = inject(AuthService);
  userService = inject(UserService);
  coloniaService = inject(ColoniaService);
  imageUploadService = inject(ImageUploadService);
  petService = inject(PetService);
  lostPetService = inject(LostPetService);
  notify = inject(NotificationService);
  confirmService = inject(ConfirmService);

  user = signal<User | null>(null);
  publications = signal<UserPublications | null>(null);
  colonias = signal<Colonia[]>([]);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  activeTab = signal<ProfileTab>('PETS');

  // Modal states
  isEditModalOpen = signal<boolean>(false);
  isPhotoModalOpen = signal<boolean>(false);
  profileAttempted = signal<boolean>(false);
  photoAttempted = signal<boolean>(false);

  // Dual photo controls (Quick Photo Modal)
  quickPhotoSource = signal<'FILE' | 'URL'>('FILE');
  selectedQuickFile = signal<File | null>(null);
  quickPhotoPreview = signal<string | null>(null);
  quickPhotoUrl = '';

  // Dual photo controls (Edit Profile Modal)
  editPhotoSource = signal<'FILE' | 'URL'>('FILE');
  selectedEditFile = signal<File | null>(null);
  editFormPhotoPreview = signal<string | null>(null);

  editForm = {
    fullName: '',
    phone: '',
    profilePhotoUrl: '',
    coloniaId: '',
  };

  ngOnInit(): void {
    this.loadProfile();
    this.loadColonias();
    this.loadPublications();
  }

  loadProfile(): void {
    this.userService.getProfile().subscribe({
      next: (u) => {
        this.user.set(u);
        this.editForm = {
          fullName: u.fullName || '',
          phone: u.phone || '',
          profilePhotoUrl: u.profilePhotoUrl || '',
          coloniaId: u.coloniaId || '',
        };
        this.quickPhotoUrl = u.profilePhotoUrl || '';
        this.quickPhotoPreview.set(u.profilePhotoUrl || null);
        this.editFormPhotoPreview.set(u.profilePhotoUrl || null);
      },
      error: () => {
        const u = this.authService.currentUser();
        this.user.set(u);
        if (u) {
          this.quickPhotoUrl = u.profilePhotoUrl || '';
          this.quickPhotoPreview.set(u.profilePhotoUrl || null);
        }
      },
    });
  }

  loadColonias(): void {
    this.coloniaService.getAll().subscribe({
      next: (cols) => this.colonias.set(cols),
      error: () => {},
    });
  }

  loadPublications(): void {
    this.isLoading.set(true);
    this.userService.getMyPublications().subscribe({
      next: (pubs) => {
        this.publications.set(pubs);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  openEditModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.profileAttempted.set(false);
    const u = this.user();
    if (u) {
      this.editForm = {
        fullName: u.fullName || '',
        phone: u.phone || '',
        profilePhotoUrl: u.profilePhotoUrl || '',
        coloniaId: u.coloniaId || '',
      };
      this.selectedEditFile.set(null);
      this.editFormPhotoPreview.set(u.profilePhotoUrl || null);
    }
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
    this.isEditModalOpen.set(false);
  }

  openPhotoModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.photoAttempted.set(false);
    const u = this.user();
    this.quickPhotoUrl = u?.profilePhotoUrl || '';
    this.quickPhotoPreview.set(u?.profilePhotoUrl || null);
    this.selectedQuickFile.set(null);
    this.isPhotoModalOpen.set(true);
  }

  closePhotoModal(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
    this.isPhotoModalOpen.set(false);
  }

  async onQuickPhotoFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.selectedQuickFile.set(file);
    const dataUrl = await this.imageUploadService.fileToDataUrl(file);
    this.quickPhotoPreview.set(dataUrl);
  }

  async onEditPhotoFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.selectedEditFile.set(file);
    const dataUrl = await this.imageUploadService.fileToDataUrl(file);
    this.editFormPhotoPreview.set(dataUrl);
  }

  saveProfile(): void {
    this.profileAttempted.set(true);
    if (!this.editForm.fullName.trim()) {
      return;
    }

    this.isSaving.set(true);

    const file = this.selectedEditFile();
    if (file && this.editPhotoSource() === 'FILE') {
      this.imageUploadService.uploadImage(file, 'profiles').subscribe({
        next: (uploadedUrl) => {
          this.editForm.profilePhotoUrl = uploadedUrl;
          this.executeSaveProfile();
        },
        error: () => {
          this.isSaving.set(false);
          this.notify.error('No se pudo procesar la fotografía de perfil');
        },
      });
    } else {
      this.executeSaveProfile();
    }
  }

  private executeSaveProfile(): void {
    this.userService.updateProfile(this.editForm).subscribe({
      next: (updatedUser) => {
        this.isSaving.set(false);
        this.user.set(updatedUser);
        this.closeEditModal();
        this.notify.success('¡Perfil actualizado exitosamente!');
        this.authService.updateCurrentUser(updatedUser);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notify.error(err.error?.message || 'Error al actualizar el perfil');
      },
    });
  }

  savePhotoOnly(): void {
    this.photoAttempted.set(true);
    if (this.quickPhotoSource() === 'FILE') {
      const file = this.selectedQuickFile();
      if (!file) {
        return;
      }
      this.isSaving.set(true);
      this.imageUploadService.uploadImage(file, 'profiles').subscribe({
        next: (photoUrl) => {
          this.persistPhotoUrl(photoUrl);
        },
        error: () => {
          this.isSaving.set(false);
          this.notify.error('No se pudo procesar la fotografía');
        },
      });
    } else {
      if (!this.quickPhotoUrl.trim()) {
        return;
      }
      this.isSaving.set(true);
      this.persistPhotoUrl(this.quickPhotoUrl.trim());
    }
  }

  private persistPhotoUrl(url: string): void {
    this.userService.updateProfile({ profilePhotoUrl: url }).subscribe({
      next: (updatedUser) => {
        this.isSaving.set(false);
        this.user.set(updatedUser);
        this.closePhotoModal();
        this.notify.success('¡Foto de perfil actualizada exitosamente!');
        this.authService.updateCurrentUser(updatedUser);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notify.error(err.error?.message || 'Error al actualizar la foto');
      },
    });
  }

  formatExactDateTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const datePart = date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timePart = date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} • ${timePart}`;
  }

  async deactivatePet(id: string): Promise<void> {
    const pet = this.publications()?.pets.find((p) => p.id === id);
    const petName = pet?.name ? `"${pet.name}"` : 'esta mascota';

    const confirmed = await this.confirmService.confirm({
      title: 'Dar de baja adopción',
      message: `¿Deseas dar de baja y desactivar la publicación de adopción de ${petName}?`,
      submessage: 'Dejará de aparecer en el catálogo público y en el muro comunitario, pero se mantendrá archivada en el sistema para auditoría y respaldo administrativo.',
      confirmText: 'Sí, dar de baja',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: '🗑️',
    });
    if (!confirmed) return;

    this.petService.delete(id).subscribe({
      next: () => {
        this.publications.update((pubs) => {
          if (!pubs) return pubs;
          return {
            ...pubs,
            pets: pubs.pets.filter((p) => p.id !== id),
          };
        });
        this.notify.success('Publicación de mascota desactivada y archivada');
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Error al desactivar la publicación');
      },
    });
  }

  async deactivateLostReport(id: string): Promise<void> {
    const report = this.publications()?.lostReports.find((r) => r.id === id);
    const reportTitle = report?.petName ? `"${report.petName}"` : 'este reporte';

    const confirmed = await this.confirmService.confirm({
      title: 'Dar de baja reporte',
      message: `¿Deseas dar de baja y desactivar el reporte de ${reportTitle}?`,
      submessage: 'Dejará de mostrarse en el muro comunitario y alertas públicas, pero se preservará resguardado en la base de datos como evidencia y registro de seguridad.',
      confirmText: 'Sí, dar de baja',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: '🗑️',
    });
    if (!confirmed) return;

    this.lostPetService.delete(id).subscribe({
      next: () => {
        this.publications.update((pubs) => {
          if (!pubs) return pubs;
          return {
            ...pubs,
            lostReports: pubs.lostReports.filter((r) => r.id !== id),
          };
        });
        this.notify.success('Reporte desactivado y archivado correctamente');
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Error al desactivar el reporte');
      },
    });
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  getRoleBadge(role?: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.RESCATISTA_VERIFICADO:
        return 'Rescatista Verificado';
      case UserRole.ADOPTANTE_VERIFICADO:
        return 'Adoptante Verificado';
      case UserRole.VETERINARIAN:
        return 'Médico Veterinario';
      default:
        return 'Ciudadano / Tutor';
    }
  }

  adoptionStageMeta(status?: string) {
    return getStageMeta((status || 'PENDIENTE') as AdoptionRequestStatus);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
