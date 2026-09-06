export enum UserRole {
  ADMIN = 'ADMIN',
  VETERINARIAN = 'VETERINARIAN',
  PET_OWNER = 'PET_OWNER',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
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
  role?: UserRole;
}
