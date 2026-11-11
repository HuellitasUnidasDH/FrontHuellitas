import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SocialNotificationService } from '../../core/services/social-notification.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  SocialNotification,
  SocialNotificationType,
} from '../../core/models/social-notification.model';
import { BRAND_CONFIG } from '../../core/constants/brand.constants';
import { PushSettingsCardComponent } from './push-settings-card.component';

type NotificationFilterTab =
  | 'ALL'
  | 'UNREAD'
  | 'COMMENTS'
  | 'SIGHTINGS'
  | 'ADOPTIONS'
  | 'GROUPS';

interface NotificationTimeGroup {
  key: string;
  label: string;
  icon: string;
  accentClass: string;
  items: SocialNotification[];
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, PushSettingsCardComponent],
  template: `
    <div class="max-w-4xl mx-auto px-2.5 sm:px-6 py-3 sm:py-7 space-y-4 sm:space-y-6">

      <!-- ======================================================== -->
      <!-- Hero Header: Centro de Actividad Social (Liquid Glass)   -->
      <!-- ======================================================== -->
      <section
        class="liquid-glass rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xl relative overflow-hidden border border-emerald-500/25 transition-all"
      >
        <!-- Decorative Ambient Glows -->
        <div
          class="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-400/15 to-transparent blur-2xl pointer-events-none"
        ></div>
        <div
          class="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-gradient-to-tr from-cyan-500/15 via-emerald-400/10 to-transparent blur-2xl pointer-events-none"
        ></div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
          <div class="flex items-center gap-3 sm:gap-4">
            <!-- Animated Pulse Bell Icon Box -->
            <div class="relative flex-shrink-0">
              <div
                class="w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center text-xl sm:text-3xl shadow-lg shadow-emerald-500/25 text-slate-950"
              >
                🔔
              </div>
              @if (socialNotifications.unreadCount() > 0) {
                <span
                  class="absolute -top-1 -right-1 min-w-[18px] h-[18px] sm:min-w-[22px] sm:h-[22px] px-1 sm:px-1.5 rounded-full bg-rose-500 text-white text-[10px] sm:text-[11px] font-black flex items-center justify-center shadow-lg shadow-rose-500/40 ring-2 ring-white dark:ring-slate-900 animate-bounce"
                >
                  {{ socialNotifications.unreadCount() > 99 ? '99+' : socialNotifications.unreadCount() }}
                </span>
              }
            </div>

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1
                  class="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight"
                >
                  Actividad y Notificaciones
                </h1>
                <span
                  class="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0"
                >
                  En Vivo • {{ brand.city }}
                </span>
              </div>
              <p class="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
                Comentarios en tus publicaciones, avistamientos en cascada, solicitudes de adopción y actividad de tu familia.
              </p>
            </div>
          </div>

          <!-- Top Action Toolbar -->
          <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              (click)="refreshFeed()"
              [disabled]="socialNotifications.isLoading()"
              class="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300/60 dark:border-slate-700/60 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Sincronizar actividad"
            >
              <span [class.animate-spin]="socialNotifications.isLoading()">🔄</span>
              <span class="hidden xs:inline">Sincronizar</span>
            </button>

            @if (socialNotifications.unreadCount() > 0) {
              <button
                type="button"
                (click)="onMarkAllAsRead()"
                class="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-[11px] sm:text-xs font-extrabold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <span>✓✓</span>
                <span>Marcar leídas</span>
              </button>
            }
          </div>
        </div>

        <!-- ====================================================== -->
        <!-- Interactive Category Filter Pills (Instagram Style)    -->
        <!-- ====================================================== -->
        <div
          class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-200/60 dark:border-slate-800/60"
        >
          @for (tab of filterTabs(); track tab.id) {
            <button
              type="button"
              (click)="activeFilter.set(tab.id)"
              class="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 border"
              [ngClass]="
                activeFilter() === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black scale-[1.02]'
                  : 'bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-slate-300/50 dark:border-slate-800 hover:bg-white/80 dark:hover:bg-slate-800/80'
              "
            >
              <span>{{ tab.icon }}</span>
              <span>{{ tab.label }}</span>
              @if (tab.count > 0) {
                <span
                  class="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black leading-none"
                  [ngClass]="
                    activeFilter() === tab.id
                      ? 'bg-slate-950/20 text-slate-950'
                      : tab.id === 'UNREAD'
                        ? 'bg-rose-500 text-white'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  "
                >
                  {{ tab.count }}
                </span>
              }
            </button>
          }
        </div>
      </section>

      <!-- ======================================================== -->
      <!-- Push Notifications Settings Card (PWA / Web Push)        -->
      <!-- ======================================================== -->
      <app-push-settings-card />

      <!-- ======================================================== -->
      <!-- Main Feed Content: Time-Grouped Activity Stream          -->
      <!-- ======================================================== -->
      @if (socialNotifications.isLoading() && socialNotifications.notifications().length === 0) {
        <div class="liquid-glass rounded-3xl p-16 text-center space-y-3">
          <div
            class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"
          ></div>
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400">
            Cargando tu actividad comunitaria...
          </p>
        </div>
      } @else if (filteredNotifications().length === 0) {
        <!-- Empty State -->
        <section
          class="liquid-glass rounded-3xl p-10 sm:p-14 text-center space-y-4 border border-dashed border-slate-300/70 dark:border-slate-800"
        >
          <div
            class="w-16 h-16 rounded-3xl mx-auto bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl"
          >
            ✨
          </div>
          <div class="space-y-1 max-w-md mx-auto">
            <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              @if (activeFilter() === 'UNREAD') {
                ¡Estás al día con tus notificaciones!
              } @else {
                Aún no hay actividad en esta categoría
              }
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Cuando algún ciudadano de Dolores Hidalgo comente tu publicación, reporte un avistamiento de tu mascota o postule una adopción, aparecerá aquí al instante.
            </p>
          </div>
          <div class="pt-2 flex flex-wrap justify-center gap-2.5">
            @if (activeFilter() !== 'ALL') {
              <button
                type="button"
                (click)="activeFilter.set('ALL')"
                class="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Ver todas las notificaciones
              </button>
            }
            <a
              routerLink="/"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-extrabold shadow-md cursor-pointer"
            >
              Ir al Muro Comunitario →
            </a>
          </div>
        </section>
      } @else {
        <!-- Grouped Sections (Instagram / Facebook Feed Layout) -->
        <div class="space-y-6">
          @for (group of groupedNotifications(); track group.key) {
            <section class="space-y-3 animate-fadeIn">
              <!-- Time Bucket Header -->
              <div class="flex items-center justify-between px-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm">{{ group.icon }}</span>
                  <h2
                    class="text-xs font-black uppercase tracking-widest"
                    [ngClass]="group.accentClass"
                  >
                    {{ group.label }}
                  </h2>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400"
                  >
                    {{ group.items.length }}
                  </span>
                </div>
              </div>

              <!-- Notification Cards Stack -->
              <div class="space-y-2 sm:space-y-2.5">
                @for (item of group.items; track item.id) {
                  <article
                    (click)="onOpenNotification(item)"
                    class="liquid-glass rounded-2xl sm:rounded-3xl p-3 sm:p-4.5 transition-all duration-200 cursor-pointer group relative overflow-hidden border"
                    [ngClass]="
                      !item.isRead
                        ? 'border-emerald-500/45 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.09] shadow-md sm:shadow-lg shadow-emerald-500/5 hover:border-emerald-500/70'
                        : 'border-slate-200/70 dark:border-slate-800/80 hover:border-emerald-500/30 opacity-90 hover:opacity-100'
                    "
                  >
                    <!-- Left Accent Bar for Unread Items -->
                    @if (!item.isRead) {
                      <div
                        class="absolute left-0 inset-y-0 w-1 sm:w-1.5 bg-gradient-to-b from-emerald-400 via-teal-500 to-cyan-500"
                      ></div>
                    }

                    <div class="flex items-start gap-2.5 sm:gap-4">
                      <!-- 1. Left Composite Avatar + Category Floating Badge (Proporción compacta en móvil) -->
                      <div class="relative flex-shrink-0 mt-0.5">
                        <div
                          class="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl overflow-hidden p-0.5 shadow-md"
                          [ngClass]="getCategoryRingGradient(item.type)"
                        >
                          @if (item.actor?.profilePhotoUrl) {
                            <img
                              [src]="item.actor!.profilePhotoUrl"
                              [alt]="getActorName(item)"
                              class="w-full h-full object-cover rounded-[10px] sm:rounded-[14px] bg-white dark:bg-slate-900"
                            />
                          } @else {
                            <div
                              class="w-full h-full rounded-[10px] sm:rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400"
                            >
                              {{ getActorInitial(item) }}
                            </div>
                          }
                        </div>

                        <!-- Category Mini-Badge on Bottom-Right of Avatar (Instagram/FB style) -->
                        <div
                          class="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs shadow-md ring-1.5 sm:ring-2 ring-white dark:ring-slate-900"
                          [ngClass]="getCategoryBadgeClass(item.type)"
                          [title]="getCategoryLabel(item.type)"
                        >
                          {{ getCategoryIcon(item.type) }}
                        </div>
                      </div>

                      <!-- 2. Center Narrative + Quote Pill + Relative Time -->
                      <div class="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
                        <div class="flex flex-wrap items-center gap-1 sm:gap-1.5">
                          <span
                            class="px-1.5 sm:px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider"
                            [ngClass]="getCategoryPillClass(item.type)"
                          >
                            {{ getCategoryLabel(item.type) }}
                          </span>

                          <span class="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                            • {{ getTimeAgo(item.createdAt) }}
                          </span>

                          @if (!item.isRead) {
                            <span class="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              Nueva
                            </span>
                          }
                        </div>

                        <!-- Headline: Actor + Action -->
                        <p class="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-snug break-words">
                          <strong class="font-black text-slate-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {{ getActorName(item) }}
                          </strong>
                          <span class="font-medium text-slate-700 dark:text-slate-300">
                            {{ ' ' + item.title }}
                          </span>
                        </p>

                        <!-- Comment / Sighting / Adoption Message Quote Bubble -->
                        @if (item.message) {
                          <div
                            class="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-white/60 dark:bg-slate-950/55 border border-slate-200/70 dark:border-slate-800/80 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2"
                          >
                            {{ item.message }}
                          </div>
                        }

                        <!-- Action Footer Row -->
                        <div class="pt-0.5 sm:pt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-bold">
                          <span
                            class="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1"
                          >
                            <span>{{ getActionCtaLabel(item.type) }}</span>
                            <span>→</span>
                          </span>

                          @if (!item.isRead) {
                            <button
                              type="button"
                              (click)="onMarkSingleRead($event, item)"
                              class="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                            >
                              ✓ Leída
                            </button>
                          }

                          <button
                            type="button"
                            (click)="onDeleteNotification($event, item)"
                            class="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer ml-auto"
                            title="Eliminar notificación"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <!-- 3. Right Pet / Post Square Thumbnail Preview (Proporción compacta en móvil) -->
                      @if (item.previewImageUrl) {
                        <div
                          class="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200/80 dark:border-slate-700/70 shadow-sm group-hover:scale-105 transition-transform bg-slate-100 dark:bg-slate-900"
                        >
                          <img
                            [src]="item.previewImageUrl"
                            alt="Vista previa de publicación"
                            class="w-full h-full object-cover"
                          />
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fadeIn {
        animation: fadeIn 0.2s ease-out forwards;
      }
    `,
  ],
})
export class NotificationsComponent implements OnInit {
  socialNotifications = inject(SocialNotificationService);
  private toast = inject(NotificationService);
  private router = inject(Router);
  brand = BRAND_CONFIG;

  activeFilter = signal<NotificationFilterTab>('ALL');

  filterTabs = computed(() => {
    const all = this.socialNotifications.notifications();
    const unread = all.filter((n) => !n.isRead).length;
    const comments = all.filter(
      (n) =>
        n.type === SocialNotificationType.COMMENT_ON_POST ||
        n.type === SocialNotificationType.COMMENT_ON_PET,
    ).length;
    const sightings = all.filter(
      (n) => n.type === SocialNotificationType.SIGHTING_REPORTED,
    ).length;
    const adoptions = all.filter(
      (n) =>
        n.type === SocialNotificationType.ADOPTION_REQUEST_RECEIVED ||
        n.type === SocialNotificationType.ADOPTION_REQUEST_STATUS ||
        n.type === SocialNotificationType.FOLLOWUP_PROOF_SUBMITTED,
    ).length;
    const groups = all.filter(
      (n) => n.type === SocialNotificationType.GROUP_ACTIVITY,
    ).length;

    return [
      { id: 'ALL' as NotificationFilterTab, label: 'Todas', icon: '🔔', count: all.length },
      { id: 'UNREAD' as NotificationFilterTab, label: 'No leídas', icon: '🔥', count: unread },
      { id: 'COMMENTS' as NotificationFilterTab, label: 'Comentarios', icon: '💬', count: comments },
      { id: 'SIGHTINGS' as NotificationFilterTab, label: 'Avistamientos', icon: '🚨', count: sightings },
      { id: 'ADOPTIONS' as NotificationFilterTab, label: 'Adopciones', icon: '🏠', count: adoptions },
      { id: 'GROUPS' as NotificationFilterTab, label: 'Familias', icon: '👨‍👩‍👧‍👦', count: groups },
    ];
  });

  filteredNotifications = computed(() => {
    const all = this.socialNotifications.notifications();
    const filter = this.activeFilter();

    switch (filter) {
      case 'UNREAD':
        return all.filter((n) => !n.isRead);
      case 'COMMENTS':
        return all.filter(
          (n) =>
            n.type === SocialNotificationType.COMMENT_ON_POST ||
            n.type === SocialNotificationType.COMMENT_ON_PET,
        );
      case 'SIGHTINGS':
        return all.filter((n) => n.type === SocialNotificationType.SIGHTING_REPORTED);
      case 'ADOPTIONS':
        return all.filter(
          (n) =>
            n.type === SocialNotificationType.ADOPTION_REQUEST_RECEIVED ||
            n.type === SocialNotificationType.ADOPTION_REQUEST_STATUS ||
            n.type === SocialNotificationType.FOLLOWUP_PROOF_SUBMITTED,
        );
      case 'GROUPS':
        return all.filter((n) => n.type === SocialNotificationType.GROUP_ACTIVITY);
      default:
        return all;
    }
  });

  groupedNotifications = computed<NotificationTimeGroup[]>(() => {
    const list = this.filteredNotifications();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;

    const unreadGroup: SocialNotification[] = [];
    const todayGroup: SocialNotification[] = [];
    const weekGroup: SocialNotification[] = [];
    const olderGroup: SocialNotification[] = [];

    for (const item of list) {
      const createdMs = new Date(item.createdAt).getTime();
      const diff = now - createdMs;

      if (!item.isRead) {
        unreadGroup.push(item);
      } else if (diff <= oneDayMs) {
        todayGroup.push(item);
      } else if (diff <= sevenDaysMs) {
        weekGroup.push(item);
      } else {
        olderGroup.push(item);
      }
    }

    const groups: NotificationTimeGroup[] = [];

    if (unreadGroup.length > 0) {
      groups.push({
        key: 'NEW',
        label: 'Nuevas sin leer',
        icon: '🔥',
        accentClass: 'text-emerald-600 dark:text-emerald-400',
        items: unreadGroup,
      });
    }

    if (todayGroup.length > 0) {
      groups.push({
        key: 'TODAY',
        label: 'Hoy',
        icon: '☀️',
        accentClass: 'text-teal-600 dark:text-teal-400',
        items: todayGroup,
      });
    }

    if (weekGroup.length > 0) {
      groups.push({
        key: 'WEEK',
        label: 'Esta semana',
        icon: '📅',
        accentClass: 'text-slate-600 dark:text-slate-400',
        items: weekGroup,
      });
    }

    if (olderGroup.length > 0) {
      groups.push({
        key: 'OLDER',
        label: 'Anteriores',
        icon: '🗂️',
        accentClass: 'text-slate-500 dark:text-slate-500',
        items: olderGroup,
      });
    }

    return groups;
  });

  ngOnInit(): void {
    this.socialNotifications.loadNotifications().subscribe();
  }

  refreshFeed(): void {
    this.socialNotifications.loadNotifications().subscribe(() => {
      this.toast.info('Sincronizado', 'Tu bandeja de actividad está al día.');
    });
  }

  onOpenNotification(item: SocialNotification): void {
    if (!item.isRead) {
      this.socialNotifications.markAsRead(item.id).subscribe();
    }
    const rawUrl = this.resolveNotificationTargetUrl(item);
    this.router.navigateByUrl(rawUrl);
  }

  private resolveNotificationTargetUrl(item: SocialNotification): string {
    if (item.entityId) {
      if (
        item.type === SocialNotificationType.COMMENT_ON_POST ||
        item.type === SocialNotificationType.SIGHTING_REPORTED ||
        item.targetUrl === '/perdidas'
      ) {
        return `/publicacion/lost-${item.entityId}`;
      }
      if (item.type === SocialNotificationType.COMMENT_ON_PET) {
        return `/publicacion/pet-${item.entityId}`;
      }
    }
    return item.targetUrl || '/';
  }

  onMarkSingleRead(event: Event, item: SocialNotification): void {
    event.stopPropagation();
    this.socialNotifications.markAsRead(item.id).subscribe();
  }

  onMarkAllAsRead(): void {
    this.socialNotifications.markAllAsRead().subscribe(() => {
      this.toast.success(
        'Bandeja al día',
        'Todas tus notificaciones se marcaron como leídas.',
      );
    });
  }

  onDeleteNotification(event: Event, item: SocialNotification): void {
    event.stopPropagation();
    this.socialNotifications.deleteNotification(item.id).subscribe(() => {
      this.toast.info('Eliminada', 'La notificación fue retirada de tu bandeja.');
    });
  }

  getActorName(item: SocialNotification): string {
    return item.actor?.fullName || item.actorNameFallback || 'Comunidad Huellitas DH';
  }

  getActorInitial(item: SocialNotification): string {
    return this.getActorName(item).charAt(0).toUpperCase();
  }

  getCategoryIcon(type: SocialNotificationType): string {
    switch (type) {
      case SocialNotificationType.COMMENT_ON_POST:
      case SocialNotificationType.COMMENT_ON_PET:
        return '💬';
      case SocialNotificationType.SIGHTING_REPORTED:
        return '🚨';
      case SocialNotificationType.ADOPTION_REQUEST_RECEIVED:
        return '🏠';
      case SocialNotificationType.ADOPTION_REQUEST_STATUS:
        return '🎉';
      case SocialNotificationType.FOLLOWUP_PROOF_SUBMITTED:
        return '📸';
      case SocialNotificationType.GROUP_ACTIVITY:
        return '👨‍👩‍👧‍👦';
      default:
        return '🐾';
    }
  }

  getCategoryLabel(type: SocialNotificationType): string {
    switch (type) {
      case SocialNotificationType.COMMENT_ON_POST:
        return 'Comentario en Muro';
      case SocialNotificationType.COMMENT_ON_PET:
        return 'Comentario en Adopción';
      case SocialNotificationType.SIGHTING_REPORTED:
        return 'Avistamiento Reportado';
      case SocialNotificationType.ADOPTION_REQUEST_RECEIVED:
        return 'Solicitud de Adopción';
      case SocialNotificationType.ADOPTION_REQUEST_STATUS:
        return 'Resolución de Adopción';
      case SocialNotificationType.FOLLOWUP_PROOF_SUBMITTED:
        return 'Seguimiento 7/30/90 Días';
      case SocialNotificationType.GROUP_ACTIVITY:
        return 'Actividad Familiar';
      default:
        return 'Notificación';
    }
  }

  getCategoryBadgeClass(type: SocialNotificationType): string {
    switch (type) {
      case SocialNotificationType.SIGHTING_REPORTED:
        return 'bg-amber-500 text-slate-950';
      case SocialNotificationType.ADOPTION_REQUEST_RECEIVED:
      case SocialNotificationType.ADOPTION_REQUEST_STATUS:
        return 'bg-emerald-500 text-slate-950';
      case SocialNotificationType.COMMENT_ON_POST:
      case SocialNotificationType.COMMENT_ON_PET:
        return 'bg-sky-500 text-white';
      default:
        return 'bg-teal-500 text-slate-950';
    }
  }

  getCategoryPillClass(type: SocialNotificationType): string {
    switch (type) {
      case SocialNotificationType.SIGHTING_REPORTED:
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30';
      case SocialNotificationType.ADOPTION_REQUEST_RECEIVED:
      case SocialNotificationType.ADOPTION_REQUEST_STATUS:
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30';
      case SocialNotificationType.COMMENT_ON_POST:
      case SocialNotificationType.COMMENT_ON_PET:
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30';
      default:
        return 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30';
    }
  }

  getCategoryRingGradient(type: SocialNotificationType): string {
    switch (type) {
      case SocialNotificationType.SIGHTING_REPORTED:
        return 'bg-gradient-to-tr from-amber-500 via-orange-400 to-rose-500';
      case SocialNotificationType.COMMENT_ON_POST:
      case SocialNotificationType.COMMENT_ON_PET:
        return 'bg-gradient-to-tr from-sky-400 via-cyan-500 to-teal-400';
      default:
        return 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500';
    }
  }

  getActionCtaLabel(type: SocialNotificationType): string {
    switch (type) {
      case SocialNotificationType.COMMENT_ON_POST:
        return 'Ver comentario en el muro';
      case SocialNotificationType.COMMENT_ON_PET:
        return 'Ver ficha de adopción';
      case SocialNotificationType.SIGHTING_REPORTED:
        return 'Ver reporte y ubicación';
      case SocialNotificationType.ADOPTION_REQUEST_RECEIVED:
        return 'Revisar en Panel de Rescatista';
      case SocialNotificationType.ADOPTION_REQUEST_STATUS:
        return 'Ver estado de mi solicitud';
      case SocialNotificationType.GROUP_ACTIVITY:
        return 'Abrir álbum familiar';
      default:
        return 'Ver detalle';
    }
  }

  getTimeAgo(dateStr: string): string {
    if (!dateStr) return 'Hace un momento';
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return 'Justo ahora';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `Hace ${diffHrs} h`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  }
}

