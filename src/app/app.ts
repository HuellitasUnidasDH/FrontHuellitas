import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { PrivacyNoticeModalComponent } from './shared/components/privacy-modal/privacy-modal.component';
import { ConfirmationModalComponent } from './shared/components/confirm-modal/confirm-modal.component';
import { PwaInstallComponent } from './shared/components/pwa-install/pwa-install.component';
import { AuthService } from './core/services/auth.service';
import { ConfirmService } from './core/services/confirm.service';
import { NavigationHistoryService } from './core/services/navigation-history.service';

import { BRAND_CONFIG } from './core/constants/brand.constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    NavbarComponent,
    ToastContainerComponent,
    PrivacyNoticeModalComponent,
    ConfirmationModalComponent,
    PwaInstallComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  brand = BRAND_CONFIG;
  authService = inject(AuthService);
  confirmService = inject(ConfirmService);
  private router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);
  isManualPrivacyOpen = signal(false);
  private currentUrl = signal(this.router.url || '/');
  isMessagesRoute = computed(() => this.currentUrl().startsWith('/mensajes'));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url || '/');
      });
  }

  onAcceptUpdatedPrivacy(): void {
    this.isManualPrivacyOpen.set(false);
    if (this.authService.isAuthenticated()) {
      this.authService.acceptPrivacy().subscribe();
    }
  }
}
