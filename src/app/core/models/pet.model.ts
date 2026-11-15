import { User } from './user.model';
import { PublicationComment } from './lost-pet.model';

export enum PetGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

export type PetSize = 'CHICO' | 'MEDIANO' | 'GRANDE' | 'GIGANTE';
export type AdoptionStatus = 'NO_EN_ADOPCION' | 'DISPONIBLE' | 'EN_PROCESO' | 'ADOPTADA' | 'EN_SEGUIMIENTO';
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
  breed?: string | null;
  birthDate?: string | null;
  approximateAge?: string | null;
  gender?: PetGender | string | null;
  size?: PetSize | null;
  status?: AdoptionStatus;
  coloniaId?: string | null;
  colonia?: PetColonia;
  color?: string | null;
  furType?: string | null;
  specialMarks?: string | null;
  weightKg?: number | null;
  microchipNumber?: string | null;
  photoUrl?: string | null;
  photos?: string[];
  videoUrl?: string | null;
  isSterilized: boolean;
  isDewormed?: boolean;
  vaccinesList?: string[];
  vaccineCardPhotoUrl?: string | null;
  knownDiseases?: string | null;
  goodWithKids?: boolean | null;
  goodWithOtherPets?: boolean | null;
  temperamentTags?: string[];
  isDeleted?: boolean;
  energyLevel?: EnergyLevel | null;
  trainingNotes?: string | null;
  rescueStory?: string | null;
  notes?: string | null;
  groupId?: string | null;
  group?: any;
  owner?: User;
  ownerId: string;
  adoptedByUserId?: string;
  adoptedByUser?: User;
  adoptionDate?: string;
  comments?: PublicationComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetPayload {
  name: string;
  species: string;
  breed?: string | null;
  birthDate?: string | null;
  approximateAge?: string | null;
  gender?: PetGender | string | null;
  size?: PetSize | null;
  status?: AdoptionStatus;
  coloniaId?: string | null;
  color?: string | null;
  furType?: string | null;
  specialMarks?: string | null;
  weightKg?: number | null;
  microchipNumber?: string | null;
  photoUrl?: string | null;
  photos?: string[];
  videoUrl?: string | null;
  isSterilized?: boolean;
  isDewormed?: boolean;
  vaccinesList?: string[];
  vaccineCardPhotoUrl?: string | null;
  knownDiseases?: string | null;
  goodWithKids?: boolean | null;
  goodWithOtherPets?: boolean | null;
  temperamentTags?: string[];
  energyLevel?: EnergyLevel | null;
  trainingNotes?: string | null;
  rescueStory?: string | null;
  notes?: string | null;
  ownerId?: string;
  groupId?: string | null;
}

export interface UpdatePetPayload extends Partial<CreatePetPayload> {}
