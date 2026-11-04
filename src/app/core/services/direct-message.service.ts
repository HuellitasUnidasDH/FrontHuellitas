import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { ApiResponse } from '../models/api-response.model';
import {
  DirectConversation,
  DirectMessage,
  DirectParticipant,
  StartConversationPayload,
  SendMessagePayload,
  ConversationsListResponse,
  ConversationMessagesResponse,
  UnreadMessagesCountResponse,
} from '../models/direct-message.model';

@Injectable({
  providedIn: 'root',
})
export class DirectMessageService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(NotificationService);
  private readonly apiUrl = `${environment.apiUrl}/messages`;

  readonly conversations = signal<DirectConversation[]>([]);
  readonly activeConversation = signal<DirectConversation | null>(null);
  readonly activeMessages = signal<DirectMessage[]>([]);
  readonly totalUnreadMessages = signal<number>(0);
  readonly unreadConversationsCount = signal<number>(0);
  readonly isLoadingConversations = signal<boolean>(false);
  readonly isLoadingMessages = signal<boolean>(false);

  /**
   * Almacena el contexto de una publicación cuando el usuario hace clic en
   * "💬 Mensaje" desde el Muro Comunitario, Ficha de Mascota o Panel de Rescatista.
   */
  readonly pendingContextDraft = signal<StartConversationPayload | null>(null);

  /**
   * Últimas 5 conversaciones para el Popover rápido del Navbar.
   */
  readonly recentConversations = computed(() =>
    this.conversations().slice(0, 5),
  );

  private globalPollingHandle: any = null;

  /**
   * Abre el Centro de Mensajes (/mensajes) vinculando automáticamente la tarjeta
   * de la publicación o mascota sobre la que se quiere conversar.
   */
  openChatWithContext(payload: StartConversationPayload): void {
    if (!this.authService.isAuthenticated()) {
      this.pendingContextDraft.set(payload);
      this.toast.info(
        'Inicia sesión para chatear directamente en Huellitas (o usa el botón de WhatsApp directo).',
      );
      this.router.navigate(['/auth/login']);
      return;
    }

    const currentUserId = this.authService.currentUser()?.id;
    if (!payload.recipientId) {
      this.toast.warning(
        'Esta publicación no tiene un perfil asociado para chat interno. Puedes usar el botón de WhatsApp.',
      );
      return;
    }

    if (currentUserId && payload.recipientId === currentUserId) {
      this.toast.info('Esta es tu propia publicación ✨');
      this.router.navigate(['/mensajes']);
      return;
    }

    this.pendingContextDraft.set(payload);
    this.router.navigate(['/mensajes']);
  }

  /**
   * Carga todas las conversaciones del usuario autenticado.
   */
  loadConversations(silent = false): Observable<ApiResponse<ConversationsListResponse>> {
    if (!this.authService.isAuthenticated()) {
      this.clearState();
      return of({
        success: true,
        statusCode: 200,
        timestamp: new Date().toISOString(),
        data: { items: [], totalUnreadMessages: 0, unreadConversationsCount: 0 },
      });
    }

    if (!silent) {
      this.isLoadingConversations.set(true);
    }

    return this.http
      .get<ApiResponse<ConversationsListResponse>>(`${this.apiUrl}/conversations`)
      .pipe(
        tap((res) => {
          if (res?.data) {
            this.conversations.set(res.data.items || []);
            this.totalUnreadMessages.set(res.data.totalUnreadMessages ?? 0);
            this.unreadConversationsCount.set(
              res.data.unreadConversationsCount ?? 0,
            );
          }
          this.isLoadingConversations.set(false);
        }),
        catchError(() => {
          this.isLoadingConversations.set(false);
          return of({
            success: false,
            statusCode: 500,
            timestamp: new Date().toISOString(),
            data: {
              items: this.conversations(),
              totalUnreadMessages: this.totalUnreadMessages(),
              unreadConversationsCount: this.unreadConversationsCount(),
            },
          });
        }),
      );
  }

  /**
   * Refresca únicamente el contador de no leídos para el icono del Navbar.
   */
  refreshUnreadCount(): Observable<ApiResponse<UnreadMessagesCountResponse>> {
    if (!this.authService.isAuthenticated()) {
      this.totalUnreadMessages.set(0);
      this.unreadConversationsCount.set(0);
      return of({
        success: true,
        statusCode: 200,
        timestamp: new Date().toISOString(),
        data: { unreadMessagesCount: 0, unreadConversationsCount: 0 },
      });
    }

    return this.http
      .get<ApiResponse<UnreadMessagesCountResponse>>(`${this.apiUrl}/unread-count`)
      .pipe(
        tap((res) => {
          if (res?.data) {
            this.totalUnreadMessages.set(res.data.unreadMessagesCount ?? 0);
            this.unreadConversationsCount.set(
              res.data.unreadConversationsCount ?? 0,
            );
          }
        }),
        catchError(() =>
          of({
            success: false,
            statusCode: 500,
            timestamp: new Date().toISOString(),
            data: {
              unreadMessagesCount: this.totalUnreadMessages(),
              unreadConversationsCount: this.unreadConversationsCount(),
            },
          }),
        ),
      );
  }

  /**
   * Inicia o recupera la conversación canónica con otro perfil y actualiza su contexto.
   */
  startOrGetConversation(
    payload: StartConversationPayload,
  ): Observable<ApiResponse<DirectConversation>> {
    const { recipientName, prefilledDraft, ...body } = payload;
    return this.http
      .post<ApiResponse<DirectConversation>>(
        `${this.apiUrl}/conversations/start`,
        body,
      )
      .pipe(
        tap((res) => {
          if (res?.data) {
            const conv = res.data;
            this.activeConversation.set(conv);
            this.conversations.update((list) => {
              const exists = list.some((c) => c.id === conv.id);
              if (exists) {
                return list.map((c) => (c.id === conv.id ? conv : c));
              }
              return [conv, ...list];
            });
          }
        }),
      );
  }

  /**
   * Carga el historial de mensajes de una conversación y marca como leídos los entrantes.
   */
  loadMessages(
    conversationId: string,
    silent = false,
  ): Observable<ApiResponse<ConversationMessagesResponse>> {
    if (!silent) {
      this.isLoadingMessages.set(true);
    }

    return this.http
      .get<ApiResponse<ConversationMessagesResponse>>(
        `${this.apiUrl}/conversations/${conversationId}/messages`,
      )
      .pipe(
        tap((res) => {
          if (res?.data) {
            this.activeConversation.set(res.data.conversation);
            this.activeMessages.set(res.data.messages || []);

            // Descontar no leídos localmente de esta conversación
            const prevConv = this.conversations().find(
              (c) => c.id === conversationId,
            );
            const clearedUnread = prevConv?.unreadCount || 0;
            if (clearedUnread > 0) {
              this.totalUnreadMessages.update((c) =>
                Math.max(0, c - clearedUnread),
              );
              this.unreadConversationsCount.update((c) => Math.max(0, c - 1));
            }

            this.conversations.update((list) =>
              list.map((c) =>
                c.id === conversationId
                  ? { ...res.data.conversation, unreadCount: 0 }
                  : c,
              ),
            );
          }
          this.isLoadingMessages.set(false);
        }),
        catchError(() => {
          this.isLoadingMessages.set(false);
          return of({
            success: false,
            data: {
              conversation: this.activeConversation()!,
              messages: this.activeMessages(),
            },
          } as ApiResponse<ConversationMessagesResponse>);
        }),
      );
  }

  /**
   * Envía un mensaje con actualización optimista inmediata en la interfaz.
   */
  sendMessage(
    conversationId: string,
    payload: SendMessagePayload,
  ): Observable<ApiResponse<DirectMessage>> {
    const currentUser = this.authService.currentUser();
    const conv = this.activeConversation();
    const tempId = `temp-${Date.now()}`;

    const optimisticMsg: DirectMessage = {
      id: tempId,
      conversationId,
      senderId: currentUser?.id || '',
      recipientId: conv?.otherParticipant.id || '',
      sender: currentUser
        ? {
            id: currentUser.id,
            fullName: currentUser.fullName,
            email: currentUser.email,
            phone: currentUser.phone || null,
            role: currentUser.role,
            profilePhotoUrl: currentUser.profilePhotoUrl || null,
            isPhoneVerified: !!currentUser.isPhoneVerified,
          }
        : undefined,
      content: (payload.content || '').trim() || '📷 Fotografía adjunta',
      attachmentUrl: payload.attachmentUrl || null,
      contextType: payload.contextType || null,
      contextId: payload.contextId || null,
      contextTitle: payload.contextTitle || null,
      contextSubtitle: payload.contextSubtitle || null,
      contextImageUrl: payload.contextImageUrl || null,
      contextTargetUrl: payload.contextTargetUrl || null,
      isRead: false,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    this.activeMessages.update((msgs) => [...msgs, optimisticMsg]);

    return this.http
      .post<ApiResponse<DirectMessage>>(
        `${this.apiUrl}/conversations/${conversationId}/messages`,
        payload,
      )
      .pipe(
        tap((res) => {
          if (res?.data) {
            const saved = res.data;
            this.activeMessages.update((msgs) =>
              msgs.map((m) => (m.id === tempId ? saved : m)),
            );

            // Actualizar conversación y moverla al tope de la bandeja
            this.conversations.update((list) => {
              const target = list.find((c) => c.id === conversationId);
              if (!target) return list;
              const updated: DirectConversation = {
                ...target,
                lastMessageText: saved.content,
                lastMessageAt: saved.createdAt,
                lastSenderId: saved.senderId,
                contextType: saved.contextType ?? target.contextType,
                contextId: saved.contextId ?? target.contextId,
                contextTitle: saved.contextTitle ?? target.contextTitle,
                contextSubtitle:
                  saved.contextSubtitle ?? target.contextSubtitle,
                contextImageUrl:
                  saved.contextImageUrl ?? target.contextImageUrl,
                contextTargetUrl:
                  saved.contextTargetUrl ?? target.contextTargetUrl,
              };
              return [
                updated,
                ...list.filter((c) => c.id !== conversationId),
              ];
            });
          }
        }),
        catchError((err) => {
          this.activeMessages.update((msgs) =>
            msgs.map((m) =>
              m.id === tempId
                ? { ...m, isOptimistic: false, sendFailed: true }
                : m,
            ),
          );
          throw err;
        }),
      );
  }

  /**
   * Elimina un mensaje propio enviado.
   */
  deleteMessage(messageId: string): Observable<ApiResponse<{ deleted: boolean }>> {
    this.activeMessages.update((msgs) =>
      msgs.filter((m) => m.id !== messageId),
    );
    return this.http
      .delete<ApiResponse<{ deleted: boolean }>>(
        `${this.apiUrl}/messages/${messageId}`,
      )
      .pipe(
        catchError(() =>
          of({
            success: false,
            statusCode: 500,
            timestamp: new Date().toISOString(),
            data: { deleted: false },
          }),
        ),
      );
  }

  /**
   * Busca perfiles activos en el directorio para iniciar una nueva conversación.
   */
  getDirectoryUsers(
    search?: string,
  ): Observable<ApiResponse<DirectParticipant[]>> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http
      .get<ApiResponse<DirectParticipant[]>>(`${this.apiUrl}/directory`, {
        params,
      })
      .pipe(
        catchError(() =>
          of({
            success: false,
            statusCode: 500,
            timestamp: new Date().toISOString(),
            data: [],
          }),
        ),
      );
  }

  /**
   * Inicia el polling silencioso para mantener el contador de mensajes del Navbar al día.
   */
  startPolling(intervalMs = 15000): void {
    this.stopPolling();
    if (this.authService.isAuthenticated()) {
      this.loadConversations(true).subscribe();
    }
    this.globalPollingHandle = setInterval(() => {
      if (
        this.authService.isAuthenticated() &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible'
      ) {
        this.loadConversations(true).subscribe();
      }
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.globalPollingHandle) {
      clearInterval(this.globalPollingHandle);
      this.globalPollingHandle = null;
    }
  }

  clearState(): void {
    this.conversations.set([]);
    this.activeConversation.set(null);
    this.activeMessages.set([]);
    this.totalUnreadMessages.set(0);
    this.unreadConversationsCount.set(0);
  }
}

