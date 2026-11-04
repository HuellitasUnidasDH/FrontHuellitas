import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DirectMessageService } from './direct-message.service';

describe('DirectMessageService', () => {
  let service: DirectMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'auth/login', children: [] }, { path: 'mensajes', children: [] }]),
        DirectMessageService,
      ],
    });
    service = TestBed.inject(DirectMessageService);
  });

  it('should be created with initial empty state for unauthenticated users', () => {
    expect(service).toBeTruthy();
    expect(service.conversations()).toEqual([]);
    expect(service.totalUnreadMessages()).toBe(0);
    expect(service.unreadConversationsCount()).toBe(0);
  });

  it('should store pending context draft when unauthenticated user clicks message button', () => {
    service.openChatWithContext({
      recipientId: 'user-rescuer-1',
      contextType: 'PET',
      contextTitle: 'Adopción de Luna',
    });

    expect(service.pendingContextDraft()?.recipientId).toBe('user-rescuer-1');
    expect(service.pendingContextDraft()?.contextTitle).toBe('Adopción de Luna');
  });
});

