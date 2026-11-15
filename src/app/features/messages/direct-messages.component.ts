import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DirectMessageService } from '../../core/services/direct-message.service';
import { AuthService } from '../../core/services/auth.service';
import { ImageUploadService } from '../../core/services/image-upload.service';
import { NotificationService } from '../../core/services/notification.service';
import { ScrollLockService } from '../../core/services/scroll-lock.service';
import {
  DirectConversation,
  DirectMessage,
  DirectParticipant,
  StartConversationPayload,
} from '../../core/models/direct-message.model';
import { BRAND_CONFIG } from '../../core/constants/brand.constants';
import {
  buildWhatsAppUrl,
  formatActorRoleLabel,
  formatMessageDateDivider,
  getMessageDayKey,
} from '../../core/utils/app-helpers.util';

type InboxFilter = 'ALL' | 'UNREAD' | 'ADOPTIONS' | 'ALERTS';

@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div
      class="max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-2 h-[calc(100dvh-10.25rem-env(safe-area-inset-bottom))] sm:h-[calc(100dvh-11.25rem-env(safe-area-inset-bottom))] md:h-[calc(100dvh-7rem)] flex flex-col overflow-hidden overscroll-none"
    >
      <div class="flex-1 min-h-0 flex gap-3 overflow-hidden">
        <!-- ====================================================== -->
        <!-- LEFT PANEL: Conversations Inbox                        -->
        <!-- ====================================================== -->
        <aside
          class="w-full md:w-80 lg:w-[350px] xl:w-[380px] flex-shrink-0 liquid-glass rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col h-full overflow-hidden"
          [ngClass]="{
            'hidden md:flex': mobileView() === 'CHAT',
            'flex': mobileView() === 'LIST'
          }"
        >
          <!-- Inbox Header + Search + Filters -->
          <div class="px-4 pt-4 pb-3 border-b border-slate-200/70 dark:border-slate-800/70 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <h1 class="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  Mensajes
                </h1>
                @if (dmService.totalUnreadMessages() > 0) {
                  <span
                    class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  >
                    {{ dmService.totalUnreadMessages() }}
                  </span>
                }
              </div>

              <button
                type="button"
                (click)="openDirectoryModal()"
                class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors flex-shrink-0"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Nuevo</span>
              </button>
            </div>

            <!-- Search Input -->
            <div class="relative">
              <svg
                class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Buscar persona, mascota o mensaje..."
                class="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/75 border border-slate-200/80 dark:border-slate-700/80 focus:border-emerald-500 focus:outline-none text-base sm:text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-colors"
              />
              @if (searchQuery()) {
                <button
                  type="button"
                  (click)="searchQuery.set('')"
                  class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                  aria-label="Limpiar búsqueda"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              }
            </div>

            <!-- Filter Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              @for (tab of filterTabs; track tab.key) {
                <button
                  type="button"
                  (click)="activeFilter.set(tab.key)"
                  class="px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 border"
                  [ngClass]="
                    activeFilter() === tab.key
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 border-emerald-600 dark:border-emerald-500'
                      : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                  "
                >
                  <span>{{ tab.label }}</span>
                  @if (tab.key === 'UNREAD' && dmService.unreadConversationsCount() > 0) {
                    <span
                      class="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none"
                      [ngClass]="
                        activeFilter() === tab.key
                          ? 'bg-white/25 dark:bg-slate-950/20 text-white dark:text-slate-950'
                          : 'bg-rose-500 text-white'
                      "
                    >
                      {{ dmService.unreadConversationsCount() }}
                    </span>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Conversations Scrollable List -->
          <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-slate-200/50 dark:divide-slate-800/60">
            @if (dmService.isLoadingConversations() && dmService.conversations().length === 0) {
              <div class="p-8 text-center space-y-2.5">
                <div
                  class="w-7 h-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto"
                ></div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Cargando conversaciones…</p>
              </div>
            } @else if (filteredConversations().length === 0) {
              <div class="p-8 text-center space-y-3">
                <div
                  class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                    />
                  </svg>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Sin conversaciones en esta vista
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Escríbele a alguien desde una publicación del Muro o inicia un chat desde el directorio.
                  </p>
                </div>
                <button
                  type="button"
                  (click)="openDirectoryModal()"
                  class="px-3.5 py-2 rounded-xl bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Explorar directorio
                </button>
              </div>
            } @else {
              @for (conv of filteredConversations(); track conv.id) {
                <div
                  (click)="selectConversation(conv)"
                  class="px-3.5 py-3 flex items-center gap-3 cursor-pointer transition-colors relative"
                  [ngClass]="
                    activeConversation()?.id === conv.id
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/12 border-l-2 border-l-emerald-600 dark:border-l-emerald-400'
                      : conv.unreadCount > 0
                        ? 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/45'
                  "
                >
                  <!-- Avatar -->
                  <div class="relative flex-shrink-0">
                    <div
                      class="w-11 h-11 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800"
                    >
                      @if (conv.otherParticipant.profilePhotoUrl) {
                        <img
                          [src]="conv.otherParticipant.profilePhotoUrl"
                          [alt]="conv.otherParticipant.fullName"
                          class="w-full h-full object-cover"
                        />
                      } @else {
                        <div
                          class="w-full h-full flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/12"
                        >
                          {{ (conv.otherParticipant.fullName || 'H').charAt(0) }}
                        </div>
                      }
                    </div>
                    @if (conv.unreadCount > 0) {
                      <span
                        class="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                      ></span>
                    }
                  </div>

                  <!-- Conversation Summary -->
                  <div class="flex-1 min-w-0 space-y-0.5">
                    <div class="flex items-center justify-between gap-2">
                      <h3
                        class="text-xs sm:text-sm text-slate-900 dark:text-white truncate"
                        [ngClass]="conv.unreadCount > 0 ? 'font-bold' : 'font-semibold'"
                      >
                        {{ conv.otherParticipant.fullName }}
                      </h3>
                      <span class="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                        {{ getTimeAgo(conv.lastMessageAt) }}
                      </span>
                    </div>

                    @if (conv.contextTitle) {
                      <p
                        class="text-[11px] font-medium truncate"
                        [ngClass]="
                          conv.contextType === 'LOST_REPORT'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        "
                      >
                        {{ conv.contextTitle }}
                      </p>
                    }

                    <p
                      class="text-xs truncate"
                      [ngClass]="
                        conv.unreadCount > 0
                          ? 'font-semibold text-slate-800 dark:text-slate-100'
                          : 'text-slate-500 dark:text-slate-400'
                      "
                    >
                      @if (conv.lastSenderId === currentUserId()) {
                        <span class="text-emerald-600 dark:text-emerald-400 font-medium">Tú: </span>
                      }
                      {{ conv.lastMessageText || 'Conversación iniciada' }}
                    </p>
                  </div>

                  <!-- Right Thumbnail or Unread Count -->
                  <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                    @if (conv.contextImageUrl) {
                      <img
                        [src]="conv.contextImageUrl"
                        alt=""
                        class="w-9 h-9 rounded-lg object-cover border border-slate-200/80 dark:border-slate-700/80"
                      />
                    }
                    @if (conv.unreadCount > 0) {
                      <span
                        class="min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 text-[10px] font-bold flex items-center justify-center"
                      >
                        {{ conv.unreadCount }}
                      </span>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </aside>

        <!-- ====================================================== -->
        <!-- RIGHT PANEL: Active Chat Thread                        -->
        <!-- ====================================================== -->
        <section
          class="flex-1 min-w-0 liquid-glass rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col h-full overflow-hidden"
          [ngClass]="{
            'hidden md:flex': mobileView() === 'LIST',
            'flex': mobileView() === 'CHAT'
          }"
        >
          @if (!activeConversation()) {
            <!-- Empty State when no conversation is selected -->
            <div class="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center space-y-4">
              <div
                class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
              >
                <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              </div>
              <div class="max-w-sm space-y-1.5">
                <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Chat de {{ brand.name }}
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Selecciona una conversación para responder o inicia un nuevo chat con rescatistas y miembros de la comunidad.
                </p>
              </div>
              <div class="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  (click)="openDirectoryModal()"
                  class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold shadow-sm cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Iniciar conversación</span>
                </button>
                <a
                  routerLink="/"
                  class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  Ir al Muro
                </a>
              </div>
            </div>
          } @else {
            <!-- A. Active Conversation Header -->
            <div
              class="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/65 dark:bg-slate-900/55 backdrop-blur-md flex items-center justify-between gap-2 flex-shrink-0"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  (click)="backToInboxOnMobile()"
                  class="md:hidden px-2 py-1.5 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors flex-shrink-0"
                  title="Volver a conversaciones"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                  <span>Chats</span>
                </button>

                <div
                  class="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0"
                >
                  @if (activeConversation()!.otherParticipant.profilePhotoUrl) {
                    <img
                      [src]="activeConversation()!.otherParticipant.profilePhotoUrl!"
                      [alt]="activeConversation()!.otherParticipant.fullName"
                      class="w-full h-full object-cover"
                    />
                  } @else {
                    <div
                      class="w-full h-full flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/12"
                    >
                      {{ (activeConversation()!.otherParticipant.fullName || 'H').charAt(0) }}
                    </div>
                  }
                </div>

                <div class="min-w-0">
                  <h3 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {{ activeConversation()!.otherParticipant.fullName }}
                  </h3>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <span>{{ getRoleLabel(activeConversation()!.otherParticipant.role) }}</span>
                    @if (activeConversation()!.otherParticipant.isPhoneVerified) {
                      <span class="text-emerald-600 dark:text-emerald-400 font-medium">
                        · Verificado
                      </span>
                    }
                  </p>
                </div>
              </div>

              @if (getActiveConversationWhatsAppPhone()) {
                <a
                  [href]="getActiveConversationWhatsAppUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/12 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                  title="Continuar conversación en WhatsApp"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                    />
                  </svg>
                  <span class="hidden sm:inline">WhatsApp</span>
                </a>
              }
            </div>

            <!-- B. Compact Linked Publication Context Bar -->
            @if (activeConversation()!.contextTitle) {
              <div
                (click)="openContextPublication(activeConversation()!)"
                [ngClass]="hasNavigableContext(activeConversation()!) ? 'cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors' : ''"
                class="px-3.5 sm:px-5 py-2 bg-slate-50/75 dark:bg-slate-900/50 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between gap-2.5 flex-shrink-0"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  @if (activeConversation()!.contextImageUrl) {
                    <img
                      [src]="activeConversation()!.contextImageUrl!"
                      alt=""
                      class="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                  } @else {
                    <div
                      class="w-8 h-8 rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                        />
                      </svg>
                    </div>
                  }
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {{ activeConversation()!.contextTitle }}
                    </p>
                    @if (activeConversation()!.contextSubtitle) {
                      <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {{ activeConversation()!.contextSubtitle }}
                      </p>
                    }
                  </div>
                </div>

                @if (hasNavigableContext(activeConversation()!)) {
                  <button
                    type="button"
                    (click)="openContextPublication(activeConversation()!, $event)"
                    class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-500/15 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700 transition-colors flex-shrink-0 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver</span>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  </button>
                }
              </div>
            }

            <!-- C. Messages Stream -->
            <div
              #messagesScrollContainer
              class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/35"
            >
              @if (dmService.isLoadingMessages() && dmService.activeMessages().length === 0) {
                <div class="py-12 text-center space-y-2">
                  <div
                    class="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto"
                  ></div>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Cargando mensajes…</p>
                </div>
              } @else if (dmService.activeMessages().length === 0) {
                <div class="h-full flex flex-col items-center justify-center py-6">
                  <div
                    class="p-5 sm:p-6 rounded-2xl bg-white/85 dark:bg-slate-900/75 border border-slate-200/80 dark:border-slate-800 text-center max-w-md w-full space-y-4"
                  >
                    <div class="space-y-1">
                      <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                        Saluda a {{ activeConversation()!.otherParticipant.fullName }}
                      </h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400">
                        Toca una sugerencia para iniciar rápido o escribe tu propio mensaje.
                      </p>
                    </div>
                    <div class="flex flex-col gap-1.5">
                      @for (chip of smartIcebreakers(); track chip) {
                        <button
                          type="button"
                          (click)="useIcebreaker(chip)"
                          class="px-3 py-2 rounded-xl bg-slate-100/90 hover:bg-emerald-500/15 dark:bg-slate-800/80 dark:hover:bg-emerald-500/20 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-200 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-left transition-colors cursor-pointer"
                        >
                          {{ chip }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              } @else {
                @for (msg of dmService.activeMessages(); track msg.id; let i = $index) {
                  @if (shouldShowDateDivider(i)) {
                    <div class="flex justify-center my-3 select-none">
                      <span class="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-slate-200/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/70 shadow-sm">
                        {{ getMessageDateLabel(msg.createdAt) }}
                      </span>
                    </div>
                  }
                  <div
                    class="flex flex-col"
                    [ngClass]="msg.senderId === currentUserId() ? 'items-end' : 'items-start'"
                  >
                    <!-- Optional Per-Message Publication Reference -->
                    @if (msg.contextTitle) {
                      <div
                        (click)="openContextPublication(msg)"
                        [ngClass]="hasNavigableContext(msg) ? 'cursor-pointer hover:border-emerald-500/60 transition-colors' : ''"
                        class="mb-1.5 px-3 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 max-w-[85%] sm:max-w-sm"
                      >
                        @if (msg.contextImageUrl) {
                          <img
                            [src]="msg.contextImageUrl"
                            alt=""
                            class="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                          />
                        }
                        <div class="min-w-0 flex-1">
                          <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                            Publicación vinculada
                          </span>
                          <p class="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {{ msg.contextTitle }}
                          </p>
                        </div>
                        @if (hasNavigableContext(msg)) {
                          <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                          </svg>
                        }
                      </div>
                    }

                    <!-- Message Bubble -->
                    <div
                      class="group relative max-w-[85%] sm:max-w-[72%] rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 space-y-1.5"
                      [ngClass]="
                        msg.senderId === currentUserId()
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 rounded-br-sm shadow-sm'
                          : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/70 rounded-bl-sm shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                      "
                    >
                      @if (msg.attachmentUrl) {
                        <div
                          class="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-h-60 cursor-pointer"
                          (click)="previewImageModalUrl.set(msg.attachmentUrl!)"
                        >
                          <img
                            [src]="msg.attachmentUrl"
                            alt="Fotografía adjunta"
                            (load)="onMessageImageLoad()"
                            class="w-full h-full object-cover"
                          />
                        </div>
                      }

                      @if (msg.content) {
                        <p class="text-[13px] sm:text-sm leading-relaxed whitespace-pre-line break-words">
                          {{ msg.content }}
                        </p>
                      }

                      <div
                        class="flex items-center justify-end gap-1 text-[10px]"
                        [ngClass]="
                          msg.senderId === currentUserId()
                            ? 'text-white/80 dark:text-slate-950/75 font-medium'
                            : 'text-slate-400 dark:text-slate-500'
                        "
                      >
                        <span>{{ msg.createdAt | date: 'shortTime' }}</span>
                        @if (msg.senderId === currentUserId()) {
                          @if (msg.isOptimistic) {
                            <span title="Enviando" class="inline-flex">
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            </span>
                          } @else if (msg.isRead) {
                            <span title="Leído" class="inline-flex">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12.75 5 5 8-10m-1.5 10 8-10" />
                              </svg>
                            </span>
                          } @else {
                            <span title="Enviado" class="inline-flex">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            </span>
                          }
                        }
                      </div>

                      @if (msg.senderId === currentUserId() && !msg.isOptimistic) {
                        <button
                          type="button"
                          (click)="deleteOwnMessage(msg)"
                          class="opacity-50 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:!opacity-100 transition-opacity absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center cursor-pointer shadow-sm"
                          title="Eliminar mensaje"
                          aria-label="Eliminar mensaje"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      }
                    </div>
                  </div>
                }
              }
            </div>

            <!-- D. On-Demand Quick Replies Strip (Only when toggled in active chat) -->
            @if (showQuickReplies() && dmService.activeMessages().length > 0) {
              <div
                class="px-3 sm:px-4 py-2 border-t border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0"
              >
                @for (chip of smartIcebreakers(); track chip) {
                  <button
                    type="button"
                    (click)="useIcebreaker(chip)"
                    class="px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex-shrink-0"
                  >
                    {{ chip }}
                  </button>
                }
              </div>
            }

            <!-- E. Message Composer -->
            <div
              class="px-2.5 sm:px-4 py-2 sm:py-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md space-y-2 flex-shrink-0"
            >
              @if (attachmentPreviewUrl()) {
                <div
                  class="flex items-center justify-between px-2.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25"
                >
                  <div class="flex items-center gap-2.5">
                    <img
                      [src]="attachmentPreviewUrl()!"
                      alt="Vista previa"
                      class="w-10 h-10 rounded-lg object-cover border border-emerald-500/30"
                    />
                    <span class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      Imagen lista para enviar
                    </span>
                  </div>
                  <button
                    type="button"
                    (click)="attachmentPreviewUrl.set(null)"
                    class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    aria-label="Quitar imagen adjunta"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              }

              <div class="flex items-end gap-1.5 sm:gap-2">
                <input
                  #chatPhotoInput
                  type="file"
                  accept="image/*"
                  class="hidden"
                  (change)="onChatPhotoSelected($event)"
                />
                <input
                  #chatCameraInput
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  (change)="onChatPhotoSelected($event)"
                />

                <!-- Gallery Button -->
                <button
                  type="button"
                  (click)="chatPhotoInput.click()"
                  [disabled]="isUploadingPhoto()"
                  class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 disabled:opacity-50"
                  title="Adjuntar imagen"
                  aria-label="Adjuntar imagen"
                >
                  @if (isUploadingPhoto()) {
                    <span
                      class="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"
                    ></span>
                  } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                  }
                </button>

                <!-- Camera Button -->
                <button
                  type="button"
                  (click)="openChatCameraModal()"
                  [disabled]="isUploadingPhoto()"
                  class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 disabled:opacity-50"
                  title="Tomar foto con cámara"
                  aria-label="Tomar foto con cámara"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                    />
                  </svg>
                </button>

                <!-- Quick Replies Toggle (when conversation already has messages) -->
                @if (dmService.activeMessages().length > 0) {
                  <button
                    type="button"
                    (click)="showQuickReplies.set(!showQuickReplies())"
                    [attr.aria-pressed]="showQuickReplies()"
                    class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                    [ngClass]="
                      showQuickReplies()
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    "
                    title="Respuestas rápidas"
                    aria-label="Respuestas rápidas"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                      />
                    </svg>
                  </button>
                }

                <!-- Textarea -->
                <textarea
                  [(ngModel)]="messageText"
                  (keydown.enter)="onEnterPress($event)"
                  (focus)="onMessageImageLoad()"
                  rows="1"
                  placeholder="Escribe un mensaje…"
                  class="flex-1 min-h-[40px] max-h-28 px-3.5 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700/80 focus:border-emerald-500 focus:outline-none text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none transition-colors"
                ></textarea>

                <!-- Send Button -->
                <button
                  type="button"
                  (click)="sendCurrentMessage()"
                  [disabled]="!canSendMessage()"
                  class="w-10 h-10 sm:w-auto sm:px-4 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-40 text-white dark:text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                  aria-label="Enviar mensaje"
                >
                  <span class="hidden sm:inline">Enviar</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          }
        </section>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MODAL 1: Directorio de Perfiles                            -->
    <!-- ========================================================== -->
    @if (showDirectoryModal()) {
      <div
        class="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto overscroll-contain"
        (click)="showDirectoryModal.set(false)"
      >
        <div
          (click)="$event.stopPropagation()"
          class="liquid-glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4 max-h-[82dvh] flex flex-col"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">
                Nueva conversación
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Encuentra rescatistas, albergues, veterinarios o miembros de Huellitas.
              </p>
            </div>
            <button
              type="button"
              (click)="showDirectoryModal.set(false)"
              class="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
              aria-label="Cerrar directorio"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="relative">
            <svg
              class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              [(ngModel)]="directorySearch"
              (ngModelChange)="searchDirectory($event)"
              placeholder="Buscar por nombre o rol (ej. Rescatista, Albergue)..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-base sm:text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
            @for (person of directoryUsers(); track person.id) {
              <div
                (click)="startChatWithDirectoryUser(person)"
                class="p-3 rounded-2xl bg-white/75 dark:bg-slate-900/70 hover:bg-emerald-500/10 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-10 h-10 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0"
                  >
                    @if (person.profilePhotoUrl) {
                      <img
                        [src]="person.profilePhotoUrl"
                        [alt]="person.fullName"
                        class="w-full h-full object-cover"
                      />
                    } @else {
                      <div
                        class="w-full h-full flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/12"
                      >
                        {{ (person.fullName || 'H').charAt(0) }}
                      </div>
                    }
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {{ person.fullName }}
                    </p>
                    <p class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      {{ getRoleLabel(person.role) }}
                    </p>
                  </div>
                </div>

                <span
                  class="px-3 py-1.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 text-xs font-bold flex-shrink-0"
                >
                  Chatear
                </span>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- ========================================================== -->
    <!-- MODAL 2: Visor Lightbox para Fotos del Chat                -->
    <!-- ========================================================== -->
    @if (previewImageModalUrl()) {
      <div
        class="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn overscroll-contain"
        (click)="previewImageModalUrl.set(null)"
      >
        <button
          type="button"
          (click)="previewImageModalUrl.set(null)"
          class="fixed top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/15 cursor-pointer"
          aria-label="Cerrar imagen"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          [src]="previewImageModalUrl()!"
          alt="Vista ampliada"
          (click)="$event.stopPropagation()"
          class="max-w-full max-h-[86dvh] rounded-2xl shadow-2xl border border-white/15 object-contain"
        />
      </div>
    }

    <!-- ========================================================== -->
    <!-- MODAL 3: Captura con Cámara en Vivo                        -->
    <!-- ========================================================== -->
    @if (isChatCameraModalOpen()) {
      <div
        class="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn overflow-y-auto overscroll-contain"
        (click)="closeChatCameraModal()"
      >
        <div
          (click)="$event.stopPropagation()"
          class="w-full max-w-md rounded-2xl sm:rounded-3xl liquid-glass border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 p-5 shadow-2xl space-y-4 my-auto max-h-[88dvh] overflow-y-auto overscroll-contain"
        >
          <div class="flex items-center justify-between gap-2">
            <div>
              <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Tomar fotografía
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Captura directamente con la cámara de tu dispositivo
              </p>
            </div>
            <button
              type="button"
              (click)="closeChatCameraModal()"
              class="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
              aria-label="Cerrar cámara"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <input
            #nativeModalCameraInput
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            (change)="onChatPhotoSelected($event); closeChatCameraModal()"
          />

          @if (isChatCameraActive()) {
            <div class="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] border border-slate-700">
              <video
                id="chatLiveCameraVideo"
                autoplay
                playsinline
                muted
                class="w-full h-full object-cover"
              ></video>
              <div class="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  (click)="toggleChatCameraFacingMode()"
                  class="px-3 py-1.5 rounded-xl bg-slate-900/80 text-white text-xs font-semibold backdrop-blur-md border border-white/15 cursor-pointer hover:bg-slate-800 inline-flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                    />
                  </svg>
                  <span>Voltear</span>
                </button>
                <button
                  type="button"
                  (click)="captureChatPhotoFromStream()"
                  class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg cursor-pointer"
                >
                  Capturar foto
                </button>
              </div>
            </div>
          } @else {
            <div class="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 text-center space-y-3">
              @if (chatCameraError()) {
                <p class="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {{ chatCameraError() }}
                </p>
              }
              <div class="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  (click)="startChatCameraStream()"
                  class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Reintentar cámara
                </button>
                <button
                  type="button"
                  (click)="nativeModalCameraInput.click()"
                  class="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Abrir cámara del teléfono
                </button>
              </div>
            </div>
          }

          <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              (click)="nativeModalCameraInput.click()"
              class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Usar cámara nativa del teléfono
            </button>
            <button
              type="button"
              (click)="closeChatCameraModal()"
              class="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DirectMessagesComponent implements OnInit, OnDestroy {
  readonly dmService = inject(DirectMessageService);
  readonly authService = inject(AuthService);
  private readonly imageUpload = inject(ImageUploadService);
  private readonly toast = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly scrollLock = inject(ScrollLockService);
  readonly brand = BRAND_CONFIG;

  @ViewChild('messagesScrollContainer')
  private messagesScrollContainer?: ElementRef<HTMLDivElement>;

  readonly searchQuery = signal<string>('');
  readonly activeFilter = signal<InboxFilter>('ALL');
  readonly mobileView = signal<'LIST' | 'CHAT'>('LIST');
  readonly messageText = signal<string>('');
  readonly attachmentPreviewUrl = signal<string | null>(null);
  readonly isUploadingPhoto = signal<boolean>(false);
  readonly isSending = signal<boolean>(false);
  readonly showQuickReplies = signal<boolean>(false);

  readonly showDirectoryModal = signal<boolean>(false);
  readonly directorySearch = signal<string>('');
  readonly directoryUsers = signal<DirectParticipant[]>([]);
  readonly previewImageModalUrl = signal<string | null>(null);

  readonly isChatCameraModalOpen = signal<boolean>(false);
  readonly isChatCameraActive = signal<boolean>(false);
  readonly chatCameraFacingMode = signal<'environment' | 'user'>('environment');
  readonly chatCameraError = signal<string | null>(null);
  private chatCameraStream: MediaStream | null = null;

  /** Contexto pendiente de adjuntar al próximo mensaje que envíe el usuario */
  readonly pendingMessageContext = signal<StartConversationPayload | null>(null);

  private activeChatPollingHandle: any = null;
  private lastTrackedConvId: string | null = null;
  private lastTrackedMessageCount = 0;
  private lastTrackedMessageId: string | null = null;

  constructor() {
    effect(() => {
      const anyModalOpen =
        this.showDirectoryModal() ||
        !!this.previewImageModalUrl() ||
        this.isChatCameraModalOpen();
      if (anyModalOpen) {
        this.scrollLock.lock('dm-modal');
      } else {
        this.scrollLock.unlock('dm-modal');
      }
    });

    effect(() => {
      const convId = this.activeConversation()?.id || null;
      const messages = this.dmService.activeMessages();
      const count = messages.length;
      const latestId = count > 0 ? messages[count - 1].id : null;

      const convChanged = convId !== this.lastTrackedConvId;
      const messageAddedOrUpdated =
        count > this.lastTrackedMessageCount ||
        (latestId !== null && latestId !== this.lastTrackedMessageId);

      this.lastTrackedConvId = convId;
      this.lastTrackedMessageCount = count;
      this.lastTrackedMessageId = latestId;

      if (convId && (convChanged || messageAddedOrUpdated)) {
        this.scrollToBottom();
      }
    });
  }

  readonly filterTabs: { key: InboxFilter; label: string }[] = [
    { key: 'ALL', label: 'Todos' },
    { key: 'UNREAD', label: 'No leídos' },
    { key: 'ADOPTIONS', label: 'Adopciones' },
    { key: 'ALERTS', label: 'Alertas' },
  ];

  readonly currentUserId = computed(
    () => this.authService.currentUser()?.id || '',
  );

  readonly activeConversation = computed(() =>
    this.dmService.activeConversation(),
  );

  readonly filteredConversations = computed(() => {
    const list = this.dmService.conversations();
    const filter = this.activeFilter();
    const q = this.searchQuery().trim().toLowerCase();

    return list.filter((conv) => {
      if (filter === 'UNREAD' && conv.unreadCount === 0) return false;
      if (
        filter === 'ADOPTIONS' &&
        conv.contextType !== 'PET' &&
        conv.contextType !== 'ADOPTION_REQUEST' &&
        conv.contextType !== 'FOLLOWUP'
      ) {
        return false;
      }
      if (filter === 'ALERTS' && conv.contextType !== 'LOST_REPORT') {
        return false;
      }

      if (!q) return true;
      return (
        conv.otherParticipant.fullName.toLowerCase().includes(q) ||
        (conv.contextTitle && conv.contextTitle.toLowerCase().includes(q)) ||
        (conv.lastMessageText && conv.lastMessageText.toLowerCase().includes(q))
      );
    });
  });

  readonly smartIcebreakers = computed(() => {
    const conv = this.activeConversation();
    const ctxType = conv?.contextType;
    const title = conv?.contextTitle || 'tu publicación';

    if (ctxType === 'PET' || ctxType === 'ADOPTION_REQUEST') {
      return [
        `Hola, me interesa ${title}. ¿Sigue disponible?`,
        'Contamos con espacio seguro y patio bardeado.',
        '¿Podemos agendar una visita para conocerlo(a)?',
        'Estoy de acuerdo con el protocolo de adopción responsable.',
      ];
    }
    if (ctxType === 'LOST_REPORT') {
      return [
        `Hola, tengo información sobre ${title}.`,
        'Le tomé una fotografía para confirmar si se trata de la mascota.',
        'Puedo apoyar con resguardo temporal o traslado.',
        'Vivo cerca de la zona y estaré pendiente.',
      ];
    }
    return [
      'Hola, te escribo desde Huellitas Dolores Hidalgo.',
      '¿Me podrías compartir más información, por favor?',
      '¿En qué horario podemos platicar?',
      'También podemos coordinar por llamada o WhatsApp.',
    ];
  });

  ngOnInit(): void {
    this.scrollLock.lock('dm-page', 'viewport');
    const draft = this.dmService.pendingContextDraft();

    this.dmService.loadConversations().subscribe({
      next: () => {
        if (draft && draft.recipientId) {
          this.dmService.pendingContextDraft.set(null);
          this.pendingMessageContext.set(draft);
          if (draft.prefilledDraft) {
            this.messageText.set(draft.prefilledDraft);
          }

          this.dmService.startOrGetConversation(draft).subscribe({
            next: (res) => {
              if (res?.data) {
                this.selectConversation(res.data);
              }
            },
            error: () => {
              this.toast.error('No se pudo abrir la conversación con este perfil.');
            },
          });
        } else {
          const convIdParam = this.route.snapshot.queryParamMap.get('convId');
          const list = this.dmService.conversations();
          if (convIdParam) {
            const target = list.find((c) => c.id === convIdParam);
            if (target) {
              this.selectConversation(target, true);
              return;
            }
          }
          this.mobileView.set('LIST');
          this.dmService.activeConversation.set(null);
        }
      },
    });

    this.activeChatPollingHandle = setInterval(() => {
      const currentConv = this.activeConversation();
      if (
        currentConv &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible'
      ) {
        this.dmService.loadMessages(currentConv.id, true).subscribe();
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    this.stopChatCameraStream();
    this.scrollLock.unlock('dm-modal');
    this.scrollLock.unlock('dm-page', 'viewport');
    if (this.activeChatPollingHandle) {
      clearInterval(this.activeChatPollingHandle);
      this.activeChatPollingHandle = null;
    }
    this.dmService.activeConversation.set(null);
  }

  selectConversation(conv: DirectConversation, switchMobile = true): void {
    const previousId = this.dmService.activeConversation()?.id;
    if (previousId !== conv.id) {
      this.dmService.activeMessages.set([]);
      this.showQuickReplies.set(false);
    }
    this.dmService.activeConversation.set(conv);
    if (switchMobile) {
      this.mobileView.set('CHAT');
    }
    this.dmService.loadMessages(conv.id).subscribe({
      next: () => this.scrollToBottom(),
    });
  }

  backToInboxOnMobile(): void {
    this.mobileView.set('LIST');
    this.dmService.activeConversation.set(null);
    this.showQuickReplies.set(false);
  }

  canSendMessage(): boolean {
    if (this.isSending() || this.isUploadingPhoto()) return false;
    return (
      this.messageText().trim().length > 0 || !!this.attachmentPreviewUrl()
    );
  }

  onEnterPress(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      event.preventDefault();
      this.sendCurrentMessage();
    }
  }

  useIcebreaker(text: string): void {
    this.showQuickReplies.set(false);
    this.messageText.set(text);
    this.sendCurrentMessage();
  }

  sendCurrentMessage(): void {
    const conv = this.activeConversation();
    if (!conv || !this.canSendMessage()) return;

    const text = this.messageText().trim();
    const attachment = this.attachmentPreviewUrl();
    const ctx = this.pendingMessageContext();

    this.messageText.set('');
    this.attachmentPreviewUrl.set(null);
    this.pendingMessageContext.set(null);
    this.isSending.set(true);

    this.dmService
      .sendMessage(conv.id, {
        content: text || undefined,
        attachmentUrl: attachment || undefined,
        contextType: ctx?.contextType,
        contextId: ctx?.contextId,
        contextTitle: ctx?.contextTitle,
        contextSubtitle: ctx?.contextSubtitle,
        contextImageUrl: ctx?.contextImageUrl,
        contextTargetUrl: ctx?.contextTargetUrl,
      })
      .subscribe({
        next: () => {
          this.isSending.set(false);
          this.scrollToBottom();
        },
        error: () => {
          this.isSending.set(false);
          this.toast.error('No se pudo enviar el mensaje. Intenta de nuevo.');
        },
      });

    this.scrollToBottom();
  }

  onChatPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadChatAttachmentFile(file, () => {
      input.value = '';
    });
  }

  private uploadChatAttachmentFile(file: File, onDone?: () => void): void {
    this.isUploadingPhoto.set(true);
    this.imageUpload.uploadImage(file, 'messages').subscribe({
      next: (url) => {
        this.attachmentPreviewUrl.set(url);
        this.isUploadingPhoto.set(false);
        onDone?.();
      },
      error: () => {
        this.isUploadingPhoto.set(false);
        this.toast.error('No se pudo subir la imagen adjunta.');
        onDone?.();
      },
    });
  }

  openChatCameraModal(): void {
    this.isChatCameraModalOpen.set(true);
    void this.startChatCameraStream();
  }

  closeChatCameraModal(): void {
    this.stopChatCameraStream();
    this.isChatCameraModalOpen.set(false);
  }

  async startChatCameraStream(): Promise<void> {
    this.stopChatCameraStream();
    this.chatCameraError.set(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      this.chatCameraError.set(
        'Tu navegador no permite vista previa en vivo. Usa la cámara nativa del teléfono.',
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: this.chatCameraFacingMode() },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      this.chatCameraStream = stream;
      this.isChatCameraActive.set(true);

      setTimeout(() => {
        if (typeof document === 'undefined') return;
        const videoEl = document.getElementById('chatLiveCameraVideo') as HTMLVideoElement | null;
        if (videoEl && this.chatCameraStream) {
          videoEl.srcObject = this.chatCameraStream;
          videoEl.play().catch(() => {});
        }
      }, 60);
    } catch {
      this.isChatCameraActive.set(false);
      this.chatCameraError.set(
        'No se pudo acceder a la cámara en vivo. Verifica los permisos o usa "Abrir cámara del teléfono".',
      );
    }
  }

  stopChatCameraStream(): void {
    if (this.chatCameraStream) {
      for (const track of this.chatCameraStream.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      this.chatCameraStream = null;
    }
    this.isChatCameraActive.set(false);
  }

  toggleChatCameraFacingMode(): void {
    this.chatCameraFacingMode.update((mode) => (mode === 'environment' ? 'user' : 'environment'));
    void this.startChatCameraStream();
  }

  captureChatPhotoFromStream(): void {
    if (typeof document === 'undefined') return;
    const videoEl = document.getElementById('chatLiveCameraVideo') as HTMLVideoElement | null;
    if (!videoEl || !videoEl.videoWidth) {
      this.toast.warning('La cámara aún se está iniciando, intenta en un segundo.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `chat-camara-${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.closeChatCameraModal();
        this.uploadChatAttachmentFile(file);
      },
      'image/jpeg',
      0.88,
    );
  }

  onMessageImageLoad(): void {
    this.scrollToBottom();
  }

  deleteOwnMessage(msg: DirectMessage): void {
    this.dmService.deleteMessage(msg.id).subscribe({
      next: () => this.toast.info('Mensaje eliminado'),
    });
  }

  openDirectoryModal(): void {
    this.showDirectoryModal.set(true);
    this.searchDirectory('');
  }

  searchDirectory(query: string): void {
    this.dmService.getDirectoryUsers(query).subscribe({
      next: (res) => {
        this.directoryUsers.set(res?.data || []);
      },
    });
  }

  startChatWithDirectoryUser(person: DirectParticipant): void {
    this.showDirectoryModal.set(false);
    this.dmService
      .startOrGetConversation({
        recipientId: person.id,
        contextType: 'PROFILE',
        contextTitle: `Contacto directo con ${person.fullName}`,
        contextWhatsappPhone: person.phone || undefined,
      })
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.selectConversation(res.data, true);
          }
        },
      });
  }

  hasNavigableContext(ctx?: {
    contextType?: string | null;
    contextId?: string | null;
    contextTargetUrl?: string | null;
  } | null): boolean {
    return !!this.resolveContextPublicationUrl(ctx);
  }

  resolveContextPublicationUrl(ctx?: {
    contextType?: string | null;
    contextId?: string | null;
    contextTargetUrl?: string | null;
  } | null): string | null {
    if (!ctx) return null;

    if (ctx.contextType === 'LOST_REPORT' && ctx.contextId) {
      const cleanId = ctx.contextId.startsWith('lost-')
        ? ctx.contextId
        : `lost-${ctx.contextId}`;
      return `/publicacion/${cleanId}`;
    }

    if (
      (ctx.contextType === 'PET' || ctx.contextType === 'ADOPTION_REQUEST') &&
      ctx.contextId
    ) {
      const cleanPetId = ctx.contextId.replace(/^pet-/, '');
      return `/adopciones/${cleanPetId}`;
    }

    if (ctx.contextTargetUrl && ctx.contextTargetUrl.trim() && ctx.contextTargetUrl.trim() !== '/') {
      const raw = ctx.contextTargetUrl.trim();
      try {
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          const parsed = new URL(raw);
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {}
      return raw;
    }

    const activeConv = this.activeConversation();
    if (activeConv && ctx !== activeConv) {
      if (activeConv.contextType === 'LOST_REPORT' && activeConv.contextId) {
        const cleanId = activeConv.contextId.startsWith('lost-')
          ? activeConv.contextId
          : `lost-${activeConv.contextId}`;
        return `/publicacion/${cleanId}`;
      }
      if (
        (activeConv.contextType === 'PET' ||
          activeConv.contextType === 'ADOPTION_REQUEST') &&
        activeConv.contextId
      ) {
        const cleanPetId = activeConv.contextId.replace(/^pet-/, '');
        return `/adopciones/${cleanPetId}`;
      }
    }

    return null;
  }

  openContextPublication(
    ctx?: {
      contextType?: string | null;
      contextId?: string | null;
      contextTargetUrl?: string | null;
    } | null,
    event?: Event,
  ): void {
    if (event) {
      event.stopPropagation();
    }
    const targetUrl = this.resolveContextPublicationUrl(ctx);
    if (!targetUrl) return;
    this.router.navigateByUrl(targetUrl);
  }

  getActiveConversationWhatsAppPhone(): string | null {
    const conv = this.activeConversation();
    if (!conv) return null;
    return conv.contextWhatsappPhone || conv.otherParticipant.phone || null;
  }

  getActiveConversationWhatsAppUrl(): string {
    const conv = this.activeConversation();
    const rawPhone = this.getActiveConversationWhatsAppPhone() || '';
    const topic = conv?.contextTitle
      ? ` sobre «${conv.contextTitle}»`
      : '';
    const msg = `Hola ${conv?.otherParticipant.fullName || ''}, te escribo desde Huellitas Unidas Dolores Hidalgo${topic}`;
    return buildWhatsAppUrl(rawPhone, msg);
  }

  getRoleLabel(role?: string): string {
    return formatActorRoleLabel(role, 'Comunidad DH');
  }

  shouldShowDateDivider(index: number): boolean {
    const messages = this.dmService.activeMessages();
    const current = messages[index];
    if (!current?.createdAt) return false;
    const currentDay = getMessageDayKey(current.createdAt);
    if (!currentDay) return false;
    if (index === 0) return true;
    const previousDay = getMessageDayKey(messages[index - 1]?.createdAt);
    return currentDay !== previousDay;
  }

  getMessageDateLabel(dateStr?: string): string {
    return formatMessageDateDivider(dateStr);
  }

  getTimeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diffSec = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000,
    );
    if (diffSec < 60) return 'Ahora';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  }

  private scrollToBottom(): void {
    if (typeof window === 'undefined') return;
    const applyScroll = () => {
      const el = this.messagesScrollContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    };
    requestAnimationFrame(() => applyScroll());
    setTimeout(() => applyScroll(), 50);
    setTimeout(() => applyScroll(), 160);
  }
}
