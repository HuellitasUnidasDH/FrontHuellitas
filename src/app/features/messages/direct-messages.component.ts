import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
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
import {
  DirectConversation,
  DirectMessage,
  DirectParticipant,
  StartConversationPayload,
} from '../../core/models/direct-message.model';
import { BRAND_CONFIG } from '../../core/constants/brand.constants';

type InboxFilter = 'ALL' | 'UNREAD' | 'ADOPTIONS' | 'ALERTS';

@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div
      class="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3 h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6.5rem)] flex flex-col gap-2.5 overflow-hidden -mb-24 md:-mb-12"
    >
      <!-- ======================================================== -->
      <!-- 1. Top Header Bar: Huellitas Direct + Nuevo Mensaje CTA  -->
      <!-- ======================================================== -->
      <header
        class="liquid-glass rounded-2xl px-3.5 sm:px-5 py-2 sm:py-2.5 border border-emerald-500/25 shadow-lg flex items-center justify-between gap-3 flex-shrink-0"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 text-slate-950 flex items-center justify-center text-lg sm:text-xl font-black shadow-md shadow-emerald-500/25 flex-shrink-0"
          >
            💬
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1
                class="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white truncate"
              >
                Huellitas Direct
              </h1>
              <span
                class="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
              >
                Mensajería Contextual
              </span>
              @if (dmService.totalUnreadMessages() > 0) {
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-sm shadow-rose-500/40"
                >
                  {{ dmService.totalUnreadMessages() }} sin leer
                </span>
              }
            </div>
            <p class="hidden xs:block text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Conecta directo con rescatistas, albergues y ciudadanos o continúa en WhatsApp con 1 clic
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            (click)="openDirectoryModal()"
            class="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <span>➕</span>
            <span class="hidden sm:inline">Nuevo Mensaje</span>
          </button>
        </div>
      </header>

      <!-- ======================================================== -->
      <!-- 2. Main Split-Pane Messenger Container (WhatsApp Style)  -->
      <!-- ======================================================== -->
      <div
        class="flex-1 min-h-0 flex gap-3 overflow-hidden"
      >
        <!-- ====================================================== -->
        <!-- LEFT PANEL: Conversations Inbox List                   -->
        <!-- ====================================================== -->
        <aside
          class="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 liquid-glass rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl flex flex-col h-full overflow-hidden"
          [ngClass]="{
            'hidden lg:flex': mobileView() === 'CHAT',
            'flex': mobileView() === 'LIST'
          }"
        >
          <!-- Search & Filter Controls -->
          <div
            class="p-3.5 sm:p-4 border-b border-slate-200/60 dark:border-slate-800/60 space-y-3"
          >
            <!-- Search Input -->
            <div class="relative">
              <span
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
              >
                🔍
              </span>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Buscar perfil, mascota o mensaje..."
                class="w-full pl-9 pr-8 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-colors"
              />
              @if (searchQuery()) {
                <button
                  type="button"
                  (click)="searchQuery.set('')"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              }
            </div>

            <!-- Filter Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              @for (tab of filterTabs; track tab.key) {
                <button
                  type="button"
                  (click)="activeFilter.set(tab.key)"
                  class="px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1"
                  [ngClass]="
                    activeFilter() === tab.key
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-300/60 dark:hover:bg-slate-700/60'
                  "
                >
                  <span>{{ tab.icon }}</span>
                  <span>{{ tab.label }}</span>
                  @if (tab.key === 'UNREAD' && dmService.unreadConversationsCount() > 0) {
                    <span
                      class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white"
                    >
                      {{ dmService.unreadConversationsCount() }}
                    </span>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Conversations Scrollable List -->
          <div class="flex-1 overflow-y-auto divide-y divide-slate-200/40 dark:divide-slate-800/50">
            @if (dmService.isLoadingConversations() && dmService.conversations().length === 0) {
              <div class="p-8 text-center space-y-2">
                <div
                  class="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto"
                ></div>
                <p class="text-xs text-slate-500">Cargando tus conversaciones...</p>
              </div>
            } @else if (filteredConversations().length === 0) {
              <div class="p-8 text-center space-y-3">
                <div
                  class="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl mx-auto"
                >
                  💬
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-100">
                    No hay conversaciones en esta vista
                  </p>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Toca el botón «💬 Mensaje» en cualquier publicación del Muro o inicia un chat desde el directorio.
                  </p>
                </div>
                <button
                  type="button"
                  (click)="openDirectoryModal()"
                  class="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold cursor-pointer transition-colors"
                >
                  ➕ Explorar Perfiles
                </button>
              </div>
            } @else {
              @for (conv of filteredConversations(); track conv.id) {
                <div
                  (click)="selectConversation(conv)"
                  class="p-3.5 sm:p-4 flex items-start gap-3 cursor-pointer transition-all relative"
                  [ngClass]="
                    activeConversation()?.id === conv.id
                      ? 'bg-emerald-500/15 dark:bg-emerald-500/15 border-l-4 border-l-emerald-500'
                      : conv.unreadCount > 0
                        ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                        : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  "
                >
                  <!-- Avatar + Role Mini Badge -->
                  <div class="relative flex-shrink-0">
                    <div
                      class="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 p-0.5 shadow-sm"
                    >
                      @if (conv.otherParticipant.profilePhotoUrl) {
                        <img
                          [src]="conv.otherParticipant.profilePhotoUrl"
                          [alt]="conv.otherParticipant.fullName"
                          class="w-full h-full object-cover rounded-[14px]"
                        />
                      } @else {
                        <div
                          class="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center text-sm font-black text-emerald-600 dark:text-emerald-400"
                        >
                          {{ (conv.otherParticipant.fullName || 'H').charAt(0) }}
                        </div>
                      }
                    </div>
                    <span
                      class="absolute -bottom-1 -right-1 text-[11px] bg-white dark:bg-slate-900 rounded-lg px-1 shadow border border-slate-200/60 dark:border-slate-700"
                      [title]="getRoleLabel(conv.otherParticipant.role)"
                    >
                      {{ getRoleIcon(conv.otherParticipant.role) }}
                    </span>
                  </div>

                  <!-- Conversation Summary -->
                  <div class="flex-1 min-w-0 space-y-1">
                    <div class="flex items-center justify-between gap-1">
                      <h3
                        class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate"
                        [ngClass]="{ 'font-black': conv.unreadCount > 0 }"
                      >
                        {{ conv.otherParticipant.fullName }}
                      </h3>
                      <span class="text-[10px] text-slate-400 flex-shrink-0">
                        {{ getTimeAgo(conv.lastMessageAt) }}
                      </span>
                    </div>

                    <!-- Context Pill if linked to a Pet or Post -->
                    @if (conv.contextTitle) {
                      <div class="flex items-center gap-1">
                        <span
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold truncate max-w-full"
                          [ngClass]="getContextBadgeClass(conv.contextType)"
                        >
                          <span>{{ getContextIcon(conv.contextType) }}</span>
                          <span class="truncate">{{ conv.contextTitle }}</span>
                        </span>
                      </div>
                    }

                    <!-- Last Message Text -->
                    <p
                      class="text-xs truncate"
                      [ngClass]="
                        conv.unreadCount > 0
                          ? 'font-bold text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      "
                    >
                      @if (conv.lastSenderId === currentUserId()) {
                        <span class="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Tú:
                        </span>
                      }
                      {{ conv.lastMessageText || 'Conversación iniciada — envía un mensaje' }}
                    </p>
                  </div>

                  <!-- Right Thumbnail or Unread Counter -->
                  <div class="flex flex-col items-end gap-1.5 flex-shrink-0 self-center">
                    @if (conv.contextImageUrl) {
                      <img
                        [src]="conv.contextImageUrl"
                        alt=""
                        class="w-10 h-10 rounded-xl object-cover border border-slate-200/70 dark:border-slate-700 shadow-sm"
                      />
                    }
                    @if (conv.unreadCount > 0) {
                      <span
                        class="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm shadow-rose-500/40"
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
        <!-- RIGHT PANEL: Active Chat Window (WhatsApp Desktop Style)-->
        <!-- ====================================================== -->
        <section
          class="flex-1 min-w-0 liquid-glass rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl flex flex-col h-full overflow-hidden"
          [ngClass]="{
            'hidden lg:flex': mobileView() === 'LIST',
            'flex': mobileView() === 'CHAT'
          }"
        >
          @if (!activeConversation()) {
            <!-- Empty State when no conversation is selected (WhatsApp Desktop style) -->
            <div class="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-4">
              <div
                class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-4xl sm:text-5xl shadow-inner"
              >
                🐾
              </div>
              <div class="max-w-md space-y-1.5 px-4">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Tus Mensajes Directos en {{ brand.name }}
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Selecciona una conversación de la bandeja izquierda para ver los mensajes, o inicia un chat nuevo con un rescatista o ciudadano.
                </p>
              </div>
              <div class="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  (click)="openDirectoryModal()"
                  class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-black shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  ➕ Iniciar Nuevo Chat
                </button>
                <a
                  routerLink="/"
                  class="px-4 py-2.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  📰 Ir al Muro Comunitario
                </a>
              </div>
            </div>
          } @else {
            <!-- ================================================== -->
            <!-- A. Active Conversation Top Header                  -->
            <!-- ================================================== -->
            <div
              class="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between gap-2 flex-shrink-0"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <!-- Back Button on Mobile (prominent style) -->
                <button
                  type="button"
                  (click)="backToInboxOnMobile()"
                  class="lg:hidden px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-black cursor-pointer flex items-center gap-1 transition-colors flex-shrink-0"
                  title="Volver a los chats"
                >
                  <span>←</span>
                  <span class="text-[11px]">Chats</span>
                </button>

                <!-- Counterpart Avatar -->
                <div
                  class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 p-0.5 flex-shrink-0 shadow-sm"
                >
                  @if (activeConversation()!.otherParticipant.profilePhotoUrl) {
                    <img
                      [src]="activeConversation()!.otherParticipant.profilePhotoUrl!"
                      [alt]="activeConversation()!.otherParticipant.fullName"
                      class="w-full h-full object-cover rounded-[14px]"
                    />
                  } @else {
                    <div
                      class="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center text-sm font-black text-emerald-600 dark:text-emerald-400"
                    >
                      {{ (activeConversation()!.otherParticipant.fullName || 'H').charAt(0) }}
                    </div>
                  }
                </div>

                <!-- Counterpart Name & Role Badge -->
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <h3
                      class="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate"
                    >
                      {{ activeConversation()!.otherParticipant.fullName }}
                    </h3>
                    <span
                      class="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    >
                      {{ getRoleIcon(activeConversation()!.otherParticipant.role) }}
                      {{ getRoleLabel(activeConversation()!.otherParticipant.role) }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    @if (activeConversation()!.otherParticipant.isPhoneVerified) {
                      <span class="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Contacto verificado en Dolores Hidalgo
                      </span>
                    } @else {
                      <span>Comunidad Huellitas Dolores Hidalgo</span>
                    }
                  </p>
                </div>
              </div>

              <!-- Extra Action: Direct WhatsApp Bridge Button -->
              @if (getActiveConversationWhatsAppPhone()) {
                <a
                  [href]="getActiveConversationWhatsAppUrl()"
                  target="_blank"
                  class="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 shadow-sm cursor-pointer"
                  title="Continuar esta conversación directamente en WhatsApp"
                >
                  <span>📲</span>
                  <span class="hidden sm:inline">Pasar a WhatsApp</span>
                </a>
              }
            </div>

            <!-- ================================================== -->
            <!-- B. Pinned Publication Context Banner (If present)  -->
            <!-- ================================================== -->
            @if (activeConversation()!.contextTitle) {
              <div
                class="px-4 py-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-b border-emerald-500/20 flex items-center justify-between gap-3 flex-shrink-0"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  @if (activeConversation()!.contextImageUrl) {
                    <img
                      [src]="activeConversation()!.contextImageUrl!"
                      alt=""
                      class="w-9 h-9 rounded-xl object-cover border border-emerald-500/30 flex-shrink-0 shadow-sm"
                    />
                  } @else {
                    <div
                      class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-sm flex-shrink-0"
                    >
                      {{ getContextIcon(activeConversation()!.contextType) }}
                    </div>
                  }
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span
                        class="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300"
                      >
                        Publicación vinculada
                      </span>
                    </div>
                    <p
                      class="text-xs font-bold text-slate-900 dark:text-white truncate"
                    >
                      {{ activeConversation()!.contextTitle }}
                    </p>
                    @if (activeConversation()!.contextSubtitle) {
                      <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {{ activeConversation()!.contextSubtitle }}
                      </p>
                    }
                  </div>
                </div>

                @if (activeConversation()!.contextTargetUrl) {
                  <a
                    [routerLink]="activeConversation()!.contextTargetUrl!"
                    class="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-emerald-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 text-[10px] font-bold border border-slate-200/70 dark:border-slate-700 transition-colors flex-shrink-0"
                  >
                    Ver ↗
                  </a>
                }
              </div>
            }

            <!-- ================================================== -->
            <!-- C. Messages Stream                                 -->
            <!-- ================================================== -->
            <div
              #messagesScrollContainer
              class="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-slate-50/40 dark:bg-slate-950/30"
            >
              @if (dmService.isLoadingMessages() && dmService.activeMessages().length === 0) {
                <div class="py-12 text-center space-y-2">
                  <div
                    class="w-7 h-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto"
                  ></div>
                  <p class="text-xs text-slate-500">Cargando mensajes...</p>
                </div>
              } @else if (dmService.activeMessages().length === 0) {
                <div
                  class="my-6 p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-emerald-500/20 text-center max-w-md mx-auto space-y-2 shadow-sm"
                >
                  <span class="text-3xl block">👋</span>
                  <h4 class="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Inicia la conversación con {{ activeConversation()!.otherParticipant.fullName }}
                  </h4>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">
                    Usa una de las respuestas rápidas de abajo con 1 clic o escribe tu mensaje personalizado.
                  </p>
                </div>
              } @else {
                @for (msg of dmService.activeMessages(); track msg.id) {
                  <div
                    class="flex flex-col"
                    [ngClass]="
                      msg.senderId === currentUserId() ? 'items-end' : 'items-start'
                    "
                  >
                    <!-- Embedded Context Card if this specific message attached a publication -->
                    @if (msg.contextTitle) {
                      <div
                        class="mb-1.5 p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-emerald-500/30 shadow-sm flex items-center gap-2.5 max-w-[85%] sm:max-w-sm"
                      >
                        @if (msg.contextImageUrl) {
                          <img
                            [src]="msg.contextImageUrl"
                            alt=""
                            class="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          />
                        }
                        <div class="min-w-0 flex-1">
                          <span
                            class="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block"
                          >
                            📌 En referencia a:
                          </span>
                          <p
                            class="text-xs font-bold text-slate-900 dark:text-white truncate"
                          >
                            {{ msg.contextTitle }}
                          </p>
                          @if (msg.contextSubtitle) {
                            <p class="text-[10px] text-slate-500 truncate">
                              {{ msg.contextSubtitle }}
                            </p>
                          }
                        </div>
                      </div>
                    }

                    <!-- Message Bubble -->
                    <div
                      class="group relative max-w-[85%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 shadow-sm space-y-2"
                      [ngClass]="
                        msg.senderId === currentUserId()
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-400 text-slate-950 rounded-br-none'
                          : 'bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700/70 rounded-bl-none'
                      "
                    >
                      <!-- Photo Attachment if present -->
                      @if (msg.attachmentUrl) {
                        <div
                          class="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-h-60 cursor-pointer"
                          (click)="previewImageModalUrl.set(msg.attachmentUrl!)"
                        >
                          <img
                            [src]="msg.attachmentUrl"
                            alt="Fotografía adjunta"
                            class="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      }

                      <!-- Message Text -->
                      @if (msg.content) {
                        <p class="text-xs sm:text-[13px] leading-relaxed whitespace-pre-line break-words">
                          {{ msg.content }}
                        </p>
                      }

                      <!-- Timestamp & Read Receipt -->
                      <div
                        class="flex items-center justify-end gap-1.5 text-[10px]"
                        [ngClass]="
                          msg.senderId === currentUserId()
                            ? 'text-slate-900/75 font-semibold'
                            : 'text-slate-400'
                        "
                      >
                        <span>{{ msg.createdAt | date: 'shortTime' }}</span>
                        @if (msg.senderId === currentUserId()) {
                          @if (msg.isOptimistic) {
                            <span>⏳</span>
                          } @else if (msg.isRead) {
                            <span title="Leído">✓✓</span>
                          } @else {
                            <span title="Enviado">✓</span>
                          }
                        }
                      </div>

                      <!-- Delete Own Message Button on Hover -->
                      @if (msg.senderId === currentUserId() && !msg.isOptimistic) {
                        <button
                          type="button"
                          (click)="deleteOwnMessage(msg)"
                          class="opacity-0 group-hover:opacity-100 transition-opacity absolute -left-7 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white text-[10px] flex items-center justify-center cursor-pointer"
                          title="Eliminar mensaje"
                        >
                          🗑️
                        </button>
                      }
                    </div>
                  </div>
                }
              }
            </div>

            <!-- ================================================== -->
            <!-- D. Smart Icebreakers Strip (1-Click Quick Replies) -->
            <!-- ================================================== -->
            <div
              class="px-3 sm:px-4 py-1.5 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-shrink-0"
            >
              <span
                class="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex-shrink-0 pr-1"
              >
                ⚡ Rápido:
              </span>
              @for (chip of smartIcebreakers(); track chip) {
                <button
                  type="button"
                  (click)="useIcebreaker(chip)"
                  class="px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer flex-shrink-0"
                >
                  {{ chip }}
                </button>
              }
            </div>

            <!-- ================================================== -->
            <!-- E. Message Composer Input + Photo Upload           -->
            <!-- ================================================== -->
            <div
              class="p-2.5 sm:p-3.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl space-y-2 flex-shrink-0"
            >
              <!-- Pending Attachment Preview -->
              @if (attachmentPreviewUrl()) {
                <div
                  class="flex items-center justify-between p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30"
                >
                  <div class="flex items-center gap-2.5">
                    <img
                      [src]="attachmentPreviewUrl()!"
                      alt="Vista previa"
                      class="w-11 h-11 rounded-xl object-cover border border-emerald-500/40"
                    />
                    <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      📷 Fotografía lista para enviar
                    </span>
                  </div>
                  <button
                    type="button"
                    (click)="attachmentPreviewUrl.set(null)"
                    class="w-7 h-7 rounded-full bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              }

              <div class="flex items-end gap-2">
                <!-- Hidden File Input for Chat Photo Attachment -->
                <input
                  #chatPhotoInput
                  type="file"
                  accept="image/*"
                  class="hidden"
                  (change)="onChatPhotoSelected($event)"
                />
                <button
                  type="button"
                  (click)="chatPhotoInput.click()"
                  [disabled]="isUploadingPhoto()"
                  class="w-10 h-10 rounded-2xl bg-slate-200/80 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-200 flex items-center justify-center text-base transition-colors cursor-pointer flex-shrink-0"
                  title="Adjuntar fotografía en el chat"
                >
                  @if (isUploadingPhoto()) {
                    <span
                      class="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"
                    ></span>
                  } @else {
                    <span>📷</span>
                  }
                </button>

                <!-- Text Input -->
                <textarea
                  [(ngModel)]="messageText"
                  (keydown.enter)="onEnterPress($event)"
                  rows="1"
                  placeholder="Escribe un mensaje directo..."
                  class="flex-1 max-h-28 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-950/90 border border-slate-300/80 dark:border-slate-700/80 focus:border-emerald-500 focus:outline-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                ></textarea>

                <!-- Send Button -->
                <button
                  type="button"
                  (click)="sendCurrentMessage()"
                  [disabled]="!canSendMessage()"
                  class="px-4 sm:px-5 h-10 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
                >
                  <span>Enviar</span>
                  <span>➤</span>
                </button>
              </div>
            </div>
          }
        </section>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MODAL 1: Directorio de Perfiles ("➕ Nuevo Mensaje")        -->
    <!-- ========================================================== -->
    @if (showDirectoryModal()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
        (click)="showDirectoryModal.set(false)"
      >
        <div
          (click)="$event.stopPropagation()"
          class="liquid-glass rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-emerald-500/30 space-y-4 max-h-[82dvh] flex flex-col"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">💬</span>
              <div>
                <h3 class="text-base font-black text-slate-900 dark:text-white">
                  Iniciar Nueva Conversación
                </h3>
                <p class="text-xs text-slate-500">
                  Directorio de rescatistas, albergues, veterinarios y comunidad DH
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="showDirectoryModal.set(false)"
              class="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          <input
            type="text"
            [(ngModel)]="directorySearch"
            (ngModelChange)="searchDirectory($event)"
            placeholder="Buscar por nombre o rol (ej. Rescatista, Albergue, Veterinario)..."
            class="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
          />

          <div class="flex-1 overflow-y-auto space-y-2 pr-1">
            @for (person of directoryUsers(); track person.id) {
              <div
                (click)="startChatWithDirectoryUser(person)"
                class="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 hover:bg-emerald-500/15 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5 flex-shrink-0"
                  >
                    @if (person.profilePhotoUrl) {
                      <img
                        [src]="person.profilePhotoUrl"
                        [alt]="person.fullName"
                        class="w-full h-full object-cover rounded-[14px]"
                      />
                    } @else {
                      <div
                        class="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-black text-emerald-600 dark:text-emerald-400"
                      >
                        {{ (person.fullName || 'H').charAt(0) }}
                      </div>
                    }
                  </div>
                  <div class="min-w-0">
                    <p
                      class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate"
                    >
                      {{ person.fullName }}
                    </p>
                    <span
                      class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                    >
                      <span>{{ getRoleIcon(person.role) }}</span>
                      <span>{{ getRoleLabel(person.role) }}</span>
                    </span>
                  </div>
                </div>

                <span
                  class="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black flex-shrink-0"
                >
                  Chatear →
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
        class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        (click)="previewImageModalUrl.set(null)"
      >
        <img
          [src]="previewImageModalUrl()!"
          alt="Vista ampliada"
          class="max-w-full max-h-[88dvh] rounded-3xl shadow-2xl border border-white/20 object-contain"
        />
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

  readonly showDirectoryModal = signal<boolean>(false);
  readonly directorySearch = signal<string>('');
  readonly directoryUsers = signal<DirectParticipant[]>([]);
  readonly previewImageModalUrl = signal<string | null>(null);

  /** Contexto pendiente de adjuntar al próximo mensaje que envíe el usuario */
  readonly pendingMessageContext = signal<StartConversationPayload | null>(null);

  private activeChatPollingHandle: any = null;

  readonly filterTabs: { key: InboxFilter; label: string; icon: string }[] = [
    { key: 'ALL', label: 'Todos', icon: '💬' },
    { key: 'UNREAD', label: 'No leídos', icon: '🔴' },
    { key: 'ADOPTIONS', label: 'Adopciones', icon: '🐾' },
    { key: 'ALERTS', label: 'Alertas / Muro', icon: '🚨' },
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
        `👋 ¡Hola! Me interesa ${title}, ¿sigue disponible?`,
        '🏡 Contamos con espacio seguro y patio bardeado',
        '📅 ¿Podemos agendar una visita para conocerlo(a)?',
        '📋 Estoy de acuerdo con el protocolo de adopción responsable',
      ];
    }
    if (ctxType === 'LOST_REPORT') {
      return [
        `📍 ¡Hola! Tengo información sobre ${title}`,
        '📸 Le tomé una fotografía para confirmar si es',
        '🚑 Quiero apoyar con resguardo temporal o traslado',
        '🤝 Vivo cerca de la zona, estaré muy pendiente',
      ];
    }
    return [
      '👋 ¡Hola! Te escribo desde Huellitas Dolores Hidalgo',
      '🐾 ¿Me podrías brindar más información, por favor?',
      '📅 ¿Cuándo te queda bien que platiquemos?',
      '📲 También podemos coordinar por llamada o WhatsApp',
    ];
  });

  ngOnInit(): void {
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
          // Por defecto no se abre ningún chat automáticamente.
          // En PC se muestra la lista a la izquierda y el placeholder a la derecha (estilo WhatsApp Desktop).
          // En móviles / Android se muestra únicamente la lista de chats.
          this.mobileView.set('LIST');
          this.dmService.activeConversation.set(null);
        }
      },
    });

    // Polling de mensajes activos cada 5 segundos cuando hay conversación abierta
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
    if (this.activeChatPollingHandle) {
      clearInterval(this.activeChatPollingHandle);
      this.activeChatPollingHandle = null;
    }
    this.dmService.activeConversation.set(null);
  }

  selectConversation(conv: DirectConversation, switchMobile = true): void {
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

    this.isUploadingPhoto.set(true);
    this.imageUpload.uploadImage(file, 'messages').subscribe({
      next: (url) => {
        this.attachmentPreviewUrl.set(url);
        this.isUploadingPhoto.set(false);
        input.value = '';
      },
      error: () => {
        this.isUploadingPhoto.set(false);
        this.toast.error('No se pudo subir la imagen adjunta.');
        input.value = '';
      },
    });
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

  getActiveConversationWhatsAppPhone(): string | null {
    const conv = this.activeConversation();
    if (!conv) return null;
    return conv.contextWhatsappPhone || conv.otherParticipant.phone || null;
  }

  getActiveConversationWhatsAppUrl(): string {
    const conv = this.activeConversation();
    const rawPhone = this.getActiveConversationWhatsAppPhone() || '';
    const clean = rawPhone.replace(/\D/g, '');
    const fullPhone = clean.length === 10 ? `52${clean}` : clean;
    const topic = conv?.contextTitle
      ? ` sobre «${conv.contextTitle}»`
      : '';
    const msg = `Hola ${conv?.otherParticipant.fullName || ''}, te escribo desde Huellitas Unidas Dolores Hidalgo${topic} 🐾`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
  }

  getRoleIcon(role?: string): string {
    switch (role) {
      case 'ADMIN':
        return '🛡️';
      case 'RESCATISTA_VERIFICADO':
        return '🦸';
      case 'ALBERGUE':
        return '🏠';
      case 'VETERINARIAN':
      case 'CLINICA_ALIADA':
        return '🩺';
      case 'ADOPTANTE_VERIFICADO':
        return '💚';
      default:
        return '🐾';
    }
  }

  getRoleLabel(role?: string): string {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'RESCATISTA_VERIFICADO':
        return 'Rescatista Verificado';
      case 'ALBERGUE':
        return 'Albergue';
      case 'VETERINARIAN':
        return 'Veterinario';
      case 'CLINICA_ALIADA':
        return 'Clínica Aliada';
      case 'ADOPTANTE_VERIFICADO':
        return 'Adoptante Verificado';
      default:
        return 'Comunidad DH';
    }
  }

  getContextIcon(type?: string | null): string {
    switch (type) {
      case 'PET':
      case 'ADOPTION_REQUEST':
        return '💚';
      case 'FOLLOWUP':
        return '📸';
      case 'LOST_REPORT':
        return '🚨';
      default:
        return '🐾';
    }
  }

  getContextBadgeClass(type?: string | null): string {
    switch (type) {
      case 'PET':
      case 'ADOPTION_REQUEST':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
      case 'LOST_REPORT':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30';
      default:
        return 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30';
    }
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
    setTimeout(() => {
      const el = this.messagesScrollContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 60);
  }
}

