import { User } from './user.model';
import { Pet } from './pet.model';

export type HousingType = 'CASA_PROPIA' | 'CASA_RENTADA' | 'DEPARTAMENTO';
export type AdoptionRequestStatus =
  | 'PENDIENTE'
  | 'EN_EVALUACION'
  | 'EN_ENTREVISTA'
  | 'VISITA_DOMICILIARIA'
  | 'ESPERANDO_CONVENIO'
  | 'CONVENIO_FIRMADO'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'CANCELADA';
export type FollowupStatus = 'PROGRAMADO' | 'SOLICITADO' | 'FOTO_RECIBIDA' | 'ALERTA_REABANDONO' | 'COMPLETADO';
export type FollowupMilestone = 14 | 30 | 180 | 365;
export type VerificationStepStatus = 'NO_ENVIADO' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface AdoptionQuestionnaire {
  housingType?: string;
  landlordAllowsPets?: boolean;
  familyAgreed?: string;
  peopleInHome?: string;
  currentPets?: string;
  previousExperience?: string;
  relocationPlan?: string;
  financialResponsible?: string;
  dailyTime?: string;
  motivation?: string;
  socialMedia?: string;
  address?: string;
}

export interface CreateAdoptionRequestPayload {
  message?: string;
  questionnaire?: AdoptionQuestionnaire;
  socialMedia?: string;
  address?: string;
}

export interface AdopterVerification {
  id: string;
  userId: string;
  user?: User;
  housingType: HousingType;
  landlordAllowsPets: boolean;
  peopleInHome?: string;
  previousExperience?: string;
  relocationPlan?: string;
  financialResponsible?: string;
  level2Status?: VerificationStepStatus;
  isLevel2Completed: boolean;
  level2CompletedAt?: string;
  homeYardPhotos?: string[];
  hasSafeEnclosure: boolean;
  signedCommitmentLetter: boolean;
  volunteerInterviewNotes?: string;
  level3Status?: VerificationStepStatus;
  isLevel3Completed: boolean;
  level3CompletedAt?: string;
  reviewedByAdminId?: string;
  reviewNotes?: string;
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
  questionnaireData?: AdoptionQuestionnaire | null;
  adopterSocialMedia?: string | null;
  adopterAddress?: string | null;
  publisherNotes?: string | null;
  rejectionReason?: string | null;
  whatsappDirectUrl?: string | null;
  evaluatedByRescuerId?: string | null;
  evaluatedByRescuer?: User | null;
  // Paso 1: Entrevista y redes sociales
  socialMediaReviewed: boolean;
  interviewCompleted: boolean;
  interviewNotes?: string | null;
  interviewCompletedAt?: string | null;
  // Paso 2: Visita domiciliaria
  homeVisitScheduledAt?: string | null;
  homeVisitFamilyAccepted: boolean;
  homeVisitSafeConditions: boolean;
  homeVisitCompleted: boolean;
  homeVisitNotes?: string | null;
  homeVisitCompletedAt?: string | null;
  // Paso 3: Convenio y entrega (Sin foto de INE por LFPDPPP)
  agreementAccepted: boolean;
  sterilizationCommitmentAccepted: boolean;
  adopterAgreementFullName?: string | null;
  adopterAgreementPhone?: string | null;
  adopterSignatureData?: string | null;
  agreementSignedAt?: string | null;
  ineVerifiedInPerson: boolean;
  addressProofUrl?: string | null;
  addressProofVerifiedInPerson: boolean;
  handoverPhotoUrl?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdoptionRequestDetailResponse {
  request: AdoptionRequest;
  verification: AdopterVerification | null;
}

export interface PublishedPetProgress {
  pet: Pet;
  totalRequests: number;
  activeRequests: number;
  highestStage: AdoptionRequestStatus | null;
  progressPercent: number;
  stageLabel: string;
  supervisingRescuerName?: string;
}

export interface AdvanceAdoptionStagePayload {
  status: AdoptionRequestStatus;
  publisherNotes?: string;
  rejectionReason?: string;
  socialMediaReviewed?: boolean;
  interviewCompleted?: boolean;
  interviewNotes?: string;
  homeVisitScheduledAt?: string;
  homeVisitFamilyAccepted?: boolean;
  homeVisitSafeConditions?: boolean;
  homeVisitCompleted?: boolean;
  homeVisitNotes?: string;
  ineVerifiedInPerson?: boolean;
  addressProofVerifiedInPerson?: boolean;
  handoverPhotoUrl?: string;
}

export interface SignAdoptionAgreementPayload {
  adopterFullName: string;
  adopterAddress: string;
  adopterPhone: string;
  adopterSocialMedia: string;
  agreementAccepted: boolean;
  sterilizationCommitmentAccepted?: boolean;
  adopterSignatureData: string;
  addressProofUrl?: string;
}

export interface AdoptionFollowup {
  id: string;
  petId: string;
  pet: Pet;
  adopterId: string;
  adopter: User;
  dayMilestone: number; // 14 (2 sem), 30 (1 mes), 180 (6 meses), 365 (1 año)
  scheduledDate: string;
  status: FollowupStatus;
  prefilledWhatsappUrl?: string;
  proofPhotoUrl?: string;
  proofNotes?: string;
  submittedByUserId?: string | null;
  submittedByRole?: string | null;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const FOLLOWUP_MILESTONE_LABELS: Record<number, { short: string; label: string; badge: string }> = {
  14: { short: '2 sem', label: '2 Semanas', badge: 'Día 14' },
  30: { short: '1 mes', label: '1 Mes', badge: 'Día 30' },
  180: { short: '6 meses', label: 'Medio Año', badge: 'Día 180' },
  365: { short: '1 año', label: '1 Año', badge: 'Día 365' },
};

export const ADOPTION_STAGE_META: Record<
  AdoptionRequestStatus,
  { step: number; progress: number; label: string; colorClass: string }
> = {
  PENDIENTE: {
    step: 1,
    progress: 15,
    label: 'Recibida (En espera de revisión)',
    colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  EN_EVALUACION: {
    step: 1,
    progress: 25,
    label: 'Paso 1: Entrevista y revisión',
    colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  EN_ENTREVISTA: {
    step: 1,
    progress: 25,
    label: 'Paso 1: Entrevista y redes sociales',
    colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  VISITA_DOMICILIARIA: {
    step: 2,
    progress: 50,
    label: 'Paso 2: Visita domiciliaria',
    colorClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  ESPERANDO_CONVENIO: {
    step: 3,
    progress: 75,
    label: 'Paso 3: Firma de Convenio pendiente',
    colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  CONVENIO_FIRMADO: {
    step: 3,
    progress: 90,
    label: 'Paso 3: Convenio firmado / Entrega',
    colorClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  APROBADA: {
    step: 4,
    progress: 100,
    label: 'Paso 4: Adopción formalizada',
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  RECHAZADA: {
    step: 0,
    progress: 0,
    label: 'No aprobada',
    colorClass: 'bg-red-100 text-red-700 border-red-200',
  },
  CANCELADA: {
    step: 0,
    progress: 0,
    label: 'Cancelada',
    colorClass: 'bg-slate-100 text-slate-500 border-slate-200',
  },
};
