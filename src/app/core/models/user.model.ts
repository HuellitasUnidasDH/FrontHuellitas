export enum UserRole {
  ADMIN = 'ADMIN',
  USUARIO_GENERAL = 'USUARIO_GENERAL',
  ADOPTANTE_VERIFICADO = 'ADOPTANTE_VERIFICADO',
  RESCATISTA_VERIFICADO = 'RESCATISTA_VERIFICADO',
  ALBERGUE = 'ALBERGUE',
  CLINICA_ALIADA = 'CLINICA_ALIADA',
  // Compatibilidad con registros existentes
  VETERINARIAN = 'VETERINARIAN',
  PET_OWNER = 'PET_OWNER',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isPhoneVerified?: boolean;
  verificationLevel?: number; // 0: No verificado, 1: Teléfono, 2: Cuestionario, 3: Compromiso
  coloniaId?: string;
  profilePhotoUrl?: string;
  role: UserRole;
  isActive: boolean;
  acceptedPrivacyVersion?: string;
  privacyAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  coloniaId?: string;
  role?: UserRole;
}
