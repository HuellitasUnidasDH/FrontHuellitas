import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SocialNotificationService } from './social-notification.service';

describe('SocialNotificationService', () => {
  let service: SocialNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        SocialNotificationService,
      ],
    });
    service = TestBed.inject(SocialNotificationService);
  });

  it('should be created with initial empty state for unauthenticated users', () => {
    expect(service).toBeTruthy();
    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });
});

