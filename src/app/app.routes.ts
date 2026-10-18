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
    path: 'verificacion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/adoptions/adopter-verification/adopter-verification.component').then(
        (m) => m.AdopterVerificationComponent,
      ),
  },
  {
    path: 'panel-rescatista',
    canActivate: [authGuard],
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
