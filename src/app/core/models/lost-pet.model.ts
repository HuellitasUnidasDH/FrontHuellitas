import { User } from './user.model';
import { Colonia } from './colonia.model';

export type LostPetType =
  | 'ANIMAL_HERIDO'
  | 'EN_RESGUARDO'
  | 'EN_ADOPCION'
  | 'SE_BUSCA'
  | 'CAMPANA_COMUNITARIA'
  | 'EXTRAVIADA'
  | 'ENCONTRADA_EN_CALLE';
export type LostPetStatus = 'BUSQUEDA_ACTIVA' | 'AVISTADA_RECIENTEMENTE' | 'REENCONTRADA' | 'CERRADO';

export interface PublicationComment {
  id: string;
  reportId: string;
  authorId: string;
  author?: User;
  content: string;
  createdAt: string;
}

export interface PetSighting {
  id: string;
  reportId: string;
  notifierId?: string;
  notifier?: User;
  sightingDate: string;
  locationDescription: string;
  photoUrl?: string;
  additionalNotes?: string;
  createdAt: string;
}

export interface LostPetReport {
  id: string;
  reporterId: string;
  reporter?: User;
  type: LostPetType;
  species: string;
  petName: string;
  gender?: string;
  photos?: string[];
  coloniaId?: string;
  colonia?: Colonia;
  lastSeenLocation: string;
  incidentDate: string;
  distinctiveFeatures: string;
  contactPhone: string;
  status: LostPetStatus;
  rewardOffered: boolean;
  rewardDetails?: string;
  isInjured?: boolean;
  reportsCount?: number;
  lastReportedAt?: string;
  parentReportId?: string;
  sightings?: PetSighting[];
  comments?: PublicationComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLostPetPayload {
  type: LostPetType;
  species: string;
  petName?: string;
  gender?: string;
  photos?: string[];
  coloniaId?: string;
  lastSeenLocation: string;
  incidentDate: string;
  distinctiveFeatures: string;
  contactPhone: string;
  rewardOffered?: boolean;
  rewardDetails?: string;
  isInjured?: boolean;
  parentReportId?: string;
}

export interface CreateSightingPayload {
  locationDescription: string;
  photoUrl?: string;
  additionalNotes?: string;
}
