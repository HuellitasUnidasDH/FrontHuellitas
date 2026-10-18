import { User } from './user.model';
import { Pet } from './pet.model';

export type HousingType = 'CASA_PROPIA' | 'CASA_RENTADA' | 'DEPARTAMENTO';
export type AdoptionRequestStatus = 'PENDIENTE' | 'EN_EVALUACION' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
export type FollowupStatus = 'PROGRAMADO' | 'SOLICITADO' | 'FOTO_RECIBIDA' | 'ALERTA_REABANDONO' | 'COMPLETADO';

export interface AdopterVerification {
  id: string;
  userId: string;
  housingType: HousingType;
  landlordAllowsPets: boolean;
  peopleInHome?: string;
  previousExperience?: string;
  relocationPlan?: string;
  financialResponsible?: string;
  isLevel2Completed: boolean;
  level2CompletedAt?: string;
  homeYardPhotos?: string[];
  hasSafeEnclosure: boolean;
  signedCommitmentLetter: boolean;
  volunteerInterviewNotes?: string;
  isLevel3Completed: boolean;
  level3CompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdoptionRequest {
  id: string;
  petId: string;
  pet: Pet;
  adopterId: string;
  adopter: User;
  status: AdoptionRequestStatus;
  adopterMessage?: string;
  publisherNotes?: string;
  whatsappDirectUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdoptionFollowup {
  id: string;
  petId: string;
  pet: Pet;
  adopterId: string;
  adopter: User;
  dayMilestone: number; // 7, 30, 90
  scheduledDate: string;
  status: FollowupStatus;
  prefilledWhatsappUrl?: string;
  proofPhotoUrl?: string;
  proofNotes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
