import { AdoptionFollowup, AdoptionRequest, AdoptionRequestStatus, ADOPTION_STAGE_META, FOLLOWUP_MILESTONE_LABELS } from '../../../core/models/adoption.model';
import { Pet } from '../../../core/models/pet.model';
import { User } from '../../../core/models/user.model';

export interface PetFollowupGroup {
  petId: string;
  pet: Pet;
  adopter?: User;
  milestones: AdoptionFollowup[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  nextPending?: AdoptionFollowup;
  hasAlert: boolean;
}

const ORDERED_MILESTONES = [14, 30, 180, 365];

export function groupFollowupsByPet(followups: AdoptionFollowup[]): PetFollowupGroup[] {
  const map = new Map<string, PetFollowupGroup>();

  for (const fol of followups) {
    if (!fol.pet || fol.pet.isDeleted) continue;
    const key = `${fol.petId}::${fol.adopterId}`;
    let group = map.get(key);
    if (!group) {
      group = {
        petId: fol.petId,
        pet: fol.pet,
        adopter: fol.adopter,
        milestones: [],
        completedCount: 0,
        totalCount: 0,
        progressPercent: 0,
        hasAlert: false,
      };
      map.set(key, group);
    }
    group.milestones.push(fol);
  }

  return Array.from(map.values()).map((g) => {
    g.milestones.sort((a, b) => {
      const idxA = ORDERED_MILESTONES.indexOf(a.dayMilestone);
      const idxB = ORDERED_MILESTONES.indexOf(b.dayMilestone);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    g.totalCount = g.milestones.length;
    g.completedCount = g.milestones.filter((m) => m.status === 'COMPLETADO').length;
    g.progressPercent = g.totalCount > 0 ? Math.round((g.completedCount / g.totalCount) * 100) : 0;
    g.nextPending = g.milestones.find((m) => m.status !== 'COMPLETADO');
    g.hasAlert = g.milestones.some((m) => m.status === 'ALERTA_REABANDONO');
    return g;
  });
}

export function getMilestoneLabel(dayMilestone: number): { short: string; label: string; badge: string } {
  return (
    FOLLOWUP_MILESTONE_LABELS[dayMilestone] || {
      short: `${dayMilestone}d`,
      label: `${dayMilestone} días`,
      badge: `Día ${dayMilestone}`,
    }
  );
}

export function getStageMeta(status: AdoptionRequestStatus) {
  return ADOPTION_STAGE_META[status] || ADOPTION_STAGE_META.PENDIENTE;
}

export function getCandidateVerificationBadge(user?: User | null): {
  level: number;
  title: string;
  subtitle: string;
  badgeClass: string;
  icon: string;
} {
  const lvl = user?.verificationLevel ?? 0;
  if (lvl >= 3) {
    return {
      level: 3,
      title: 'Nivel 3 • Adoptante Verificado',
      subtitle: 'Teléfono + Cuestionario Socioambiental + Carta Compromiso aprobados',
      badgeClass: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25',
      icon: '🛡️',
    };
  }
  if (lvl === 2) {
    return {
      level: 2,
      title: 'Nivel 2 • Cuestionario Aprobado',
      subtitle: 'Teléfono verificado y cuestionario de hogar aprobado',
      badgeClass: 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25',
      icon: '🏠',
    };
  }
  if (lvl === 1 || user?.isPhoneVerified) {
    return {
      level: 1,
      title: 'Nivel 1 • Teléfono Verificado',
      subtitle: 'Falta aprobar cuestionario Nivel 2 y Nivel 3',
      badgeClass: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40',
      icon: '📱',
    };
  }
  return {
    level: 0,
    title: 'Nivel 0 • Cuenta Básica',
    subtitle: 'Sin verificación de adoptante completada todavía',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
    icon: '⚠️',
  };
}

export function getRequestStepIndex(req: AdoptionRequest): number {
  switch (req.status) {
    case 'APROBADA':
      return 4;
    case 'ESPERANDO_CONVENIO':
    case 'CONVENIO_FIRMADO':
      return 3;
    case 'VISITA_DOMICILIARIA':
      return 2;
    case 'EN_EVALUACION':
    case 'EN_ENTREVISTA':
    case 'PENDIENTE':
      return 1;
    default:
      return 0;
  }
}

