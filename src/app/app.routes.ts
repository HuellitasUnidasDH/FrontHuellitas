import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/feed/community-feed.component').then((m) => m.CommunityFeedComponent),
  },
  {
    path: 'adopciones',
    loadComponent: () =>
      import('./features/feed/community-feed.component').then((m) => m.CommunityFeedComponent),
  },
  {
    path: 'adopciones/:id',
    loadComponent: () =>
      import('./features/pets/pet-public-detail/pet-public-detail.component').then(
        (m) => m.PetPublicDetailComponent,
      ),
  },
  {
    path: 'perdidas',
    loadComponent: () =>
      import('./features/feed/community-feed.component').then((m) => m.CommunityFeedComponent),
  },
  {
    path: 'aliados',
    loadComponent: () =>
      import('./features/allies/allies-directory.component').then((m) => m.AlliesDirectoryComponent),
  },
  {
    path: 'notificaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications.component').then(
        (m) => m.NotificationsComponent,
      ),
  },
  {
    path: 'mensajes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/messages/direct-messages.component').then(
        (m) => m.DirectMessagesComponent,
      ),
  },
  {
    path: 'verificacion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/adoptions/adopter-verification/adopter-verification.component').then(
        (m) => m.AdopterVerificationComponent,
      ),
  },
  {
    path: 'panel-rescatista',
    canActivate: [authGuard, roleGuard([UserRole.RESCATISTA_VERIFICADO, UserRole.ALBERGUE, UserRole.ADMIN])],
    loadComponent: () =>
      import('./features/adoptions/rescuer-dashboard/rescuer-dashboard.component').then(
        (m) => m.RescuerDashboardComponent,
      ),
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard([UserRole.ADMIN])],
    loadComponent: () =>
      import('./features/admin/admin.component').then((m) => m.AdminComponent),
  },
  {
    path: 'groups',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/groups/groups.component').then((m) => m.GroupsComponent),
  },
  {
    path: 'pets',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/pets/pet-list/pet-list.component').then((m) => m.PetListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/pets/pet-form/pet-form.component').then((m) => m.PetFormComponent),
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import('./features/pets/pet-form/pet-form.component').then((m) => m.PetFormComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/pets/pet-detail/pet-detail.component').then(
            (m) => m.PetDetailComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
