import { User } from './user.model';

export enum PetGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

export type PetSize = 'CHICO' | 'MEDIANO' | 'GRANDE' | 'GIGANTE';
export type AdoptionStatus = 'DISPONIBLE' | 'EN_PROCESO' | 'ADOPTADA' | 'EN_SEGUIMIENTO';
export type EnergyLevel = 'BAJO' | 'MEDIO' | 'ALTO';

export interface PetColonia {
  id: string;
  name: string;
  postalCode?: string;
  zoneType?: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  approximateAge?: string;
  gender: PetGender;
  size?: PetSize;
  status?: AdoptionStatus;
  coloniaId?: string;
  colonia?: PetColonia;
  color?: string;
  furType?: string;
  specialMarks?: string;
  weightKg?: number;
  microchipNumber?: string;
  photoUrl?: string;
  photos?: string[];
  videoUrl?: string;
  isSterilized: boolean;
  isDewormed?: boolean;
  vaccinesList?: string[];
  vaccineCardPhotoUrl?: string;
  knownDiseases?: string;
  goodWithKids?: boolean;
  goodWithOtherPets?: boolean;
  energyLevel?: EnergyLevel;
  trainingNotes?: string;
  rescueStory?: string;
  notes?: string;
  groupId?: string | null;
  group?: any;
  owner?: User;
  ownerId: string;
  adoptedByUserId?: string;
  adoptedByUser?: User;
  adoptionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetPayload {
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  approximateAge?: string;
  gender?: PetGender;
  size?: PetSize;
  status?: AdoptionStatus;
  coloniaId?: string;
  color?: string;
  furType?: string;
  specialMarks?: string;
  weightKg?: number;
  microchipNumber?: string;
  photoUrl?: string;
  photos?: string[];
  videoUrl?: string;
  isSterilized?: boolean;
  isDewormed?: boolean;
  vaccinesList?: string[];
  vaccineCardPhotoUrl?: string;
  knownDiseases?: string;
  goodWithKids?: boolean;
  goodWithOtherPets?: boolean;
  energyLevel?: EnergyLevel;
  trainingNotes?: string;
  rescueStory?: string;
  notes?: string;
  ownerId?: string;
  groupId?: string | null;
}

export interface UpdatePetPayload extends Partial<CreatePetPayload> {}
