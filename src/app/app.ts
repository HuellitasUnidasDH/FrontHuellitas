import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { PrivacyNoticeModalComponent } from './shared/components/privacy-modal/privacy-modal.component';
import { ConfirmationModalComponent } from './shared/components/confirm-modal/confirm-modal.component';
import { PwaInstallComponent } from './shared/components/pwa-install/pwa-install.component';
import { AuthService } from './core/services/auth.service';

import { BRAND_CONFIG } from './core/constants/brand.constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
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
  private router = inject(Router);
  isManualPrivacyOpen = false;

  isMessagesRoute(): boolean {
    return (this.router.url || '').startsWith('/mensajes');
  }

  onAcceptUpdatedPrivacy(): void {
    this.isManualPrivacyOpen = false;
    if (this.authService.isAuthenticated()) {
      this.authService.acceptPrivacy().subscribe();
    }
  }
}
