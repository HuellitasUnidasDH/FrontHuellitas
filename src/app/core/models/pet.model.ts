import { User } from './user.model';

export enum PetGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  gender: PetGender;
  color?: string;
  weightKg?: number;
  microchipNumber?: string;
  photoUrl?: string;
  isSterilized: boolean;
  notes?: string;
  owner?: User;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetPayload {
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  gender?: PetGender;
  color?: string;
  weightKg?: number;
  microchipNumber?: string;
  photoUrl?: string;
  isSterilized?: boolean;
  notes?: string;
  ownerId?: string;
}

export interface UpdatePetPayload extends Partial<CreatePetPayload> {}
