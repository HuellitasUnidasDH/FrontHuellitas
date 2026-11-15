import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SocialNotificationService } from '../../core/services/social-notification.service';
import { NotificationService } from '../../core/services/notification.service';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';
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
  items: SocialNotification[];
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, PushSettingsCardComponent],
  template: `
    <div class="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-7 space-y-4 sm:space-y-5">
      <!-- ======================================================== -->
      <!-- Header & Filter Strip                                    -->
      <!-- ======================================================== -->
      <section
        class="liquid-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 space-y-3.5"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="relative flex-shrink-0">
              <div
                class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center justify-center"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  />
                </svg>
              </div>
              @if (socialNotifications.unreadCount() > 0) {
                <span
                  class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
                >
                  {{ socialNotifications.unreadCount() > 99 ? '99+' : socialNotifications.unreadCount() }}
                </span>
              }
            </div>

            <div class="min-w-0">
              <h1
                class="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate"
              >
                Actividad y Notificaciones
              </h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Comentarios, avistamientos y avances en tus adopciones.
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 self-end sm:self-center flex-shrink-0">
            <button
              type="button"
              (click)="goBack()"
              class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              {{ navHistory.getBackLabel('← Volver') }}
            </button>

            <button
              type="button"
              (click)="refreshFeed()"
              [disabled]="socialNotifications.isLoading()"
              class="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              title="Sincronizar actividad"
            >
              <svg
                class="w-3.5 h-3.5"
                [class.animate-spin]="socialNotifications.isLoading()"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                />
              </svg>
              <span class="hidden sm:inline">Sincronizar</span>
            </button>

            @if (socialNotifications.unreadCount() > 0) {
              <button
                type="button"
                (click)="onMarkAllAsRead()"
                class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>Marcar leídas</span>
              </button>
            }
          </div>
        </div>

        <div
          class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 border-t border-slate-200/70 dark:border-slate-800/70"
        >
          @for (tab of filterTabs(); track tab.id) {
            <button
              type="button"
              (click)="activeFilter.set(tab.id)"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 border"
              [ngClass]="
                activeFilter() === tab.id
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 border-emerald-600 dark:border-emerald-500'
                  : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
              "
            >
              <span>{{ tab.label }}</span>
              @if (tab.count > 0) {
                <span
                  class="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none"
                  [ngClass]="
                    activeFilter() === tab.id
                      ? 'bg-white/25 dark:bg-slate-950/20 text-white dark:text-slate-950'
                      : tab.id === 'UNREAD'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
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
      <!-- Push Notifications Settings Card                         -->
      <!-- ======================================================== -->
      <app-push-settings-card />

      <!-- ======================================================== -->
      <!-- Notifications Stream                                     -->
      <!-- ======================================================== -->
      @if (socialNotifications.isLoading() && socialNotifications.notifications().length === 0) {
        <div
          class="liquid-glass rounded-2xl sm:rounded-3xl p-12 text-center space-y-3 border border-slate-200/80 dark:border-slate-800/80"
        >
          <div
            class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"
          ></div>
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
            Cargando actividad reciente…
          </p>
        </div>
      } @else if (filteredNotifications().length === 0) {
        <section
          class="liquid-glass rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-4 border border-dashed border-slate-300/80 dark:border-slate-700/80"
        >
          <div
            class="w-12 h-12 rounded-2xl mx-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div class="space-y-1 max-w-sm mx-auto">
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              @if (activeFilter() === 'UNREAD') {
                Estás al día con tus notificaciones
              } @else {
                No hay actividad en esta vista
              }
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Los comentarios, avistamientos reportados y actualizaciones de adopciones aparecerán aquí.
            </p>
          </div>
          <div class="pt-1 flex flex-wrap justify-center gap-2">
            @if (activeFilter() !== 'ALL') {
              <button
                type="button"
                (click)="activeFilter.set('ALL')"
                class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold cursor-pointer transition-colors"
              >
                Ver todas
              </button>
            }
            <a
              routerLink="/"
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold transition-colors"
            >
              Ir al Muro Comunitario
            </a>
          </div>
        </section>
      } @else {
        <div class="space-y-5">
          @for (group of groupedNotifications(); track group.key) {
            <section class="space-y-2 animate-fadeIn">
              <div class="flex items-center gap-2 px-1">
                <h2
                  class="text-[11px] font-bold uppercase tracking-wider"
                  [ngClass]="
                    group.key === 'NEW'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  "
                >
                  {{ group.label }}
                </h2>
                <span
                  class="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  {{ group.items.length }}
                </span>
              </div>

              <div class="space-y-2">
                @for (item of group.items; track item.id) {
                  <article
                    (click)="onOpenNotification(item)"
                    class="liquid-glass rounded-2xl p-3.5 sm:p-4 transition-colors cursor-pointer group border"
                    [ngClass]="
                      !item.isRead
                        ? 'border-emerald-500/35 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07] hover:border-emerald-500/60'
                        : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    "
                  >
                    <div class="flex items-start gap-3">
                      <!-- Left Avatar + Subtle Category Icon -->
                      <div class="relative flex-shrink-0 mt-0.5">
                        <div
                          class="w-10 h-10 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800"
                        >
                          @if (item.actor?.profilePhotoUrl) {
                            <img
                              [src]="item.actor!.profilePhotoUrl"
                              [alt]="getActorName(item)"
                              class="w-full h-full object-cover"
                            />
                          } @else {
                            <div
                              class="w-full h-full flex items-center justify-center font-bold text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-500/12"
                            >
                              {{ getActorInitial(item) }}
                            </div>
                          }
                        </div>

                        <div
                          class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
                          [ngClass]="getCategoryBadgeClass(item.type)"
                          [title]="getCategoryLabel(item.type)"
                        >
                          @switch (item.type) {
                            @case (NotificationType.COMMENT_ON_POST) {
                              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                              </svg>
                            }
                            @case (NotificationType.COMMENT_ON_PET) {
                              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                              </svg>
                            }
                            @case (NotificationType.SIGHTING_REPORTED) {
                              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                              </svg>
                            }
                            @case (NotificationType.ADOPTION_REQUEST_RECEIVED) {
                              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
                              </svg>
                            }
                            @case (NotificationType.ADOPTION_REQUEST_STATUS) {
                              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            }
                            @case (NotificationType.FOLLOWUP_PROOF_SUBMITTED) {
                              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                              </svg>
                            }
                            @default {
                              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31" />
                              </svg>
                            }
                          }
                        </div>
                      </div>

                      <!-- Center Content -->
                      <div class="flex-1 min-w-0 space-y-1.5">
                        <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span class="font-semibold text-slate-600 dark:text-slate-300">
                            {{ getCategoryLabel(item.type) }}
                          </span>
                          <span class="text-slate-400">·</span>
                          <span class="text-slate-400 dark:text-slate-500">
                            {{ getTimeAgo(item.createdAt) }}
                          </span>
                          @if (!item.isRead) {
                            <span
                              class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"
                            >
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Sin leer
                            </span>
                          }
                        </div>

                        <p class="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-snug break-words">
                          <strong class="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {{ getActorName(item) }}
                          </strong>
                          <span class="text-slate-600 dark:text-slate-300">
                            {{ ' ' + item.title }}
                          </span>
                        </p>

                        @if (item.message) {
                          <p
                            class="px-3 py-1.5 rounded-r-xl rounded-l-sm bg-slate-100/75 dark:bg-slate-900/60 border-l-2 border-emerald-500/50 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2"
                          >
                            {{ item.message }}
                          </p>
                        }

                        <div class="pt-0.5 flex flex-wrap items-center gap-3 text-xs">
                          <span
                            class="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                          >
                            <span>{{ getActionCtaLabel(item.type) }}</span>
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                          </span>

                          @if (!item.isRead) {
                            <button
                              type="button"
                              (click)="onMarkSingleRead($event, item)"
                              class="text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                            >
                              Marcar leída
                            </button>
                          }

                          <button
                            type="button"
                            (click)="onDeleteNotification($event, item)"
                            class="ml-auto p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                            title="Eliminar notificación"
                            aria-label="Eliminar notificación"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <!-- Optional Right Thumbnail Preview -->
                      @if (item.previewImageUrl) {
                        <div
                          class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/80 dark:border-slate-700/70 bg-slate-100 dark:bg-slate-900"
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
        animation: fadeIn 0.18s ease-out forwards;
      }
    `,
  ],
})
export class NotificationsComponent implements OnInit {
  socialNotifications = inject(SocialNotificationService);
  private toast = inject(NotificationService);
  private router = inject(Router);
  public navHistory = inject(NavigationHistoryService);
  brand = BRAND_CONFIG;
  readonly NotificationType = SocialNotificationType;

  goBack(): void {
    this.navHistory.goBack(['/']);
  }

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
      { id: 'ALL' as NotificationFilterTab, label: 'Todas', count: all.length },
      { id: 'UNREAD' as NotificationFilterTab, label: 'Sin leer', count: unread },
      { id: 'COMMENTS' as NotificationFilterTab, label: 'Comentarios', count: comments },
      { id: 'SIGHTINGS' as NotificationFilterTab, label: 'Avistamientos', count: sightings },
      { id: 'ADOPTIONS' as NotificationFilterTab, label: 'Adopciones', count: adoptions },
      { id: 'GROUPS' as NotificationFilterTab, label: 'Familias', count: groups },
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
        label: 'Sin leer',
        items: unreadGroup,
      });
    }

    if (todayGroup.length > 0) {
      groups.push({
        key: 'TODAY',
        label: 'Hoy',
        items: todayGroup,
      });
    }

    if (weekGroup.length > 0) {
      groups.push({
        key: 'WEEK',
        label: 'Esta semana',
        items: weekGroup,
      });
    }

    if (olderGroup.length > 0) {
      groups.push({
        key: 'OLDER',
        label: 'Anteriores',
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
        return `/adopciones/${item.entityId}`;
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
        return 'Seguimiento Post-Adopción';
      case SocialNotificationType.GROUP_ACTIVITY:
        return 'Actividad Familiar';
      default:
        return 'Notificación';
    }
  }

  getCategoryBadgeClass(type: SocialNotificationType): string {
    switch (type) {
      case SocialNotificationType.SIGHTING_REPORTED:
        return 'bg-amber-500 text-white';
      case SocialNotificationType.ADOPTION_REQUEST_RECEIVED:
      case SocialNotificationType.ADOPTION_REQUEST_STATUS:
        return 'bg-emerald-600 text-white';
      case SocialNotificationType.COMMENT_ON_POST:
      case SocialNotificationType.COMMENT_ON_PET:
        return 'bg-sky-600 text-white';
      default:
        return 'bg-teal-600 text-white';
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
