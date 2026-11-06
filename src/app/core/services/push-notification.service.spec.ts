import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PushNotificationService } from './push-notification.service';

describe('PushNotificationService', () => {
  let service: PushNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        PushNotificationService,
      ],
    });
    service = TestBed.inject(PushNotificationService);
  });

  it('should be created with safe initial state', () => {
    expect(service).toBeTruthy();
    expect(typeof service.supported()).toBe('boolean');
    expect(service.subscribed()).toBe(false);
    expect(service.busy()).toBe(false);
    expect(service.preferences()).toBeNull();
  });

  it('should reflect initial status correctly', () => {
    const status = service.status();
    expect(['unsupported', 'blocked', 'off', 'on']).toContain(status);
  });

  it('should not invite push notifications if unauthenticated', () => {
    expect(service.canInvite()).toBe(false);
  });

  it('should handle enable failure gracefully without throwing', async () => {
    const success = await service.enable();
    expect(typeof success).toBe('boolean');
    expect(service.busy()).toBe(false);
  });

  it('should handle disable safely without throwing', async () => {
    await expect(service.disable()).resolves.toBeUndefined();
    expect(service.subscribed()).toBe(false);
  });
});
