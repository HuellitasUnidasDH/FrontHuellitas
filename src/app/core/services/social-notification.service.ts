import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  SocialNotification,
  SocialNotificationsResponse,
  SocialNotificationType,
} from '../models/social-notification.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SocialNotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly URL = `${environment.apiUrl}/notifications`;

  private notificationsSignal = signal<SocialNotification[]>([]);
  private unreadCountSignal = signal<number>(0);
  private isLoadingSignal = signal<boolean>(false);

  public readonly notifications = this.notificationsSignal.asReadonly();
  public readonly unreadCount = this.unreadCountSignal.asReadonly();
  public readonly isLoading = this.isLoadingSignal.asReadonly();

  public readonly recentNotifications = computed(() =>
    this.notificationsSignal().slice(0, 6),
  );

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      if (isAuth) {
        this.loadNotifications().subscribe();
        this.startPolling();
      } else {
        this.stopPolling();
        this.notificationsSignal.set([]);
        this.unreadCountSignal.set(0);
      }
    });
  }

  loadNotifications(filters?: {
    unreadOnly?: boolean;
    type?: SocialNotificationType;
  }): Observable<SocialNotificationsResponse> {
    if (!this.authService.isAuthenticated()) {
      return of({ items: [], unreadCount: 0, totalCount: 0 });
    }

    this.isLoadingSignal.set(true);
    let params = new HttpParams();
    if (filters?.unreadOnly) {
      params = params.set('unreadOnly', 'true');
    }
    if (filters?.type) {
      params = params.set('type', filters.type);
    }

    return this.http
      .get<ApiResponse<SocialNotificationsResponse>>(this.URL, { params })
      .pipe(
        map((res) => res.data),
        tap((data) => {
          if (!filters?.unreadOnly && !filters?.type) {
            this.notificationsSignal.set(data.items || []);
          }
          this.unreadCountSignal.set(data.unreadCount ?? 0);
          this.isLoadingSignal.set(false);
        }),
        catchError(() => {
          this.isLoadingSignal.set(false);
          return of({
            items: this.notificationsSignal(),
            unreadCount: this.unreadCountSignal(),
            totalCount: this.notificationsSignal().length,
          });
        }),
      );
  }

  refreshUnreadCount(): void {
    if (!this.authService.isAuthenticated()) return;
    this.http
      .get<ApiResponse<{ unreadCount: number }>>(`${this.URL}/unread-count`)
      .pipe(
        map((res) => res.data.unreadCount),
        catchError(() => of(this.unreadCountSignal())),
      )
      .subscribe((count) => {
        const previous = this.unreadCountSignal();
        this.unreadCountSignal.set(count);
        if (count !== previous) {
          this.loadNotifications().subscribe();
        }
      });
  }

  markAsRead(id: string): Observable<SocialNotification | null> {
    // Actualización optimista inmediata en UI
    this.notificationsSignal.update((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    this.recalculateLocalUnread();

    return this.http
      .patch<ApiResponse<SocialNotification>>(`${this.URL}/${id}/read`, {})
      .pipe(
        map((res) => res.data),
        catchError(() => of(null)),
      );
  }

  markAllAsRead(): Observable<{ message: string; updatedCount: number }> {
    this.notificationsSignal.update((list) =>
      list.map((n) => ({ ...n, isRead: true })),
    );
    this.unreadCountSignal.set(0);

    return this.http
      .patch<ApiResponse<{ message: string; updatedCount: number }>>(
        `${this.URL}/read-all`,
        {},
      )
      .pipe(
        map((res) => res.data),
        catchError(() => of({ message: 'Actualizado', updatedCount: 0 })),
      );
  }

  deleteNotification(id: string): Observable<{ message: string }> {
    this.notificationsSignal.update((list) => list.filter((n) => n.id !== id));
    this.recalculateLocalUnread();

    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.URL}/${id}`)
      .pipe(
        map((res) => res.data),
        catchError(() => of({ message: 'Eliminada' })),
      );
  }

  private recalculateLocalUnread(): void {
    const unread = this.notificationsSignal().filter((n) => !n.isRead).length;
    this.unreadCountSignal.set(unread);
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      this.refreshUnreadCount();
    }, 15000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

