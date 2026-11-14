import { UserRole } from '../../core/models/user.model';
import { AllyCategory } from '../../core/models/ally.model';
import {
  ContentReportReason,
  ContentReportStatus,
  ReportTargetType,
} from '../../core/services/moderation.service';

export interface RoleOption {
  value: UserRole;
  label: string;
  shortLabel: string;
  selectClass: string;
  barClass: string;
  textClass: string;
  isLegacy?: boolean;
}

export const ACTIVE_ROLE_OPTIONS: RoleOption[] = [
  {
    value: UserRole.USUARIO_GENERAL,
    label: 'Usuario General',
    shortLabel: 'Usuario',
    selectClass: 'text-slate-700 dark:text-slate-200',
    barClass: 'bg-slate-500',
    textClass: 'text-slate-700 dark:text-slate-300',
  },
  {
    value: UserRole.ADOPTANTE_VERIFICADO,
    label: 'Adoptante Verificado',
    shortLabel: 'Adoptante',
    selectClass: 'text-sky-600 dark:text-sky-400',
    barClass: 'bg-sky-500',
    textClass: 'text-sky-600 dark:text-sky-400',
  },
  {
    value: UserRole.RESCATISTA_VERIFICADO,
    label: 'Rescatista Verificado',
    shortLabel: 'Rescatista',
    selectClass: 'text-emerald-600 dark:text-emerald-400',
    barClass: 'bg-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    value: UserRole.ALBERGUE,
    label: 'Albergue / Refugio',
    shortLabel: 'Albergue',
    selectClass: 'text-amber-600 dark:text-amber-400',
    barClass: 'bg-amber-500',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: UserRole.CLINICA_ALIADA,
    label: 'Clínica Aliada',
    shortLabel: 'Clínica',
    selectClass: 'text-teal-600 dark:text-teal-400',
    barClass: 'bg-teal-500',
    textClass: 'text-teal-600 dark:text-teal-400',
  },
  {
    value: UserRole.ADMIN,
    label: 'Administrador',
    shortLabel: 'Admin',
    selectClass: 'text-rose-600 dark:text-rose-400',
    barClass: 'bg-rose-500',
    textClass: 'text-rose-600 dark:text-rose-400',
  },
];

export const LEGACY_ROLE_OPTIONS: RoleOption[] = [
  {
    value: UserRole.PET_OWNER,
    label: 'Dueño de Mascota (Legacy)',
    shortLabel: 'Dueño (Legacy)',
    selectClass: 'text-emerald-600 dark:text-emerald-400',
    barClass: 'bg-emerald-400',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    isLegacy: true,
  },
  {
    value: UserRole.VETERINARIAN,
    label: 'Veterinario (Legacy)',
    shortLabel: 'Veterinario (Legacy)',
    selectClass: 'text-teal-600 dark:text-teal-400',
    barClass: 'bg-teal-400',
    textClass: 'text-teal-600 dark:text-teal-400',
    isLegacy: true,
  },
];

export const ALL_ROLE_OPTIONS: RoleOption[] = [...ACTIVE_ROLE_OPTIONS, ...LEGACY_ROLE_OPTIONS];

const ROLE_META_MAP = new Map<string, RoleOption>(ALL_ROLE_OPTIONS.map((r) => [r.value, r]));

export function getRoleMeta(role?: UserRole | string): RoleOption | undefined {
  return role ? ROLE_META_MAP.get(role) : undefined;
}

export const ALLY_CATEGORY_OPTIONS: { value: AllyCategory; label: string; icon: string }[] = [
  { value: 'VETERINARIA', label: 'Clínica Veterinaria', icon: '🩺' },
  { value: 'ESTETICA_CANINA', label: 'Estética Canina', icon: '✂️' },
  { value: 'TIENDA_ALIMENTOS', label: 'Tienda de Alimentos', icon: '🦴' },
  { value: 'FARMACIA_VETERINARIA', label: 'Farmacia Veterinaria', icon: '💊' },
];

export const REPORT_REASON_LABELS: Record<ContentReportReason, string> = {
  INTENTO_DE_COBRO: '💰 Intento de cobro / venta',
  MALTRATO_ANIMAL: '🚨 Maltrato animal',
  DATOS_FALSOS: '⚠️ Datos falsos o engañosos',
  SPAM: '📢 Spam o contenido repetitivo',
  OTRO: '📝 Otro motivo',
};

export const REPORT_STATUS_META: Record<
  ContentReportStatus,
  { label: string; badgeClass: string }
> = {
  PENDIENTE: {
    label: 'Pendiente',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  },
  EN_REVISION: {
    label: 'En revisión',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30',
  },
  SANCIONADO: {
    label: 'Sancionado',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
  },
  DESESTIMADO: {
    label: 'Desestimado',
    badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30',
  },
};

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  PET_POST: 'Mascota / Adopción',
  LOST_REPORT: 'Publicación del Muro',
  USER_ACCOUNT: 'Cuenta de Usuario',
};

export const LOST_PET_TYPE_LABELS: Record<string, { label: string; badgeClass: string }> = {
  ANIMAL_HERIDO: {
    label: '🚑 Animal Herido',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
  },
  EN_RESGUARDO: {
    label: '🏠 En Resguardo',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  },
  EN_ADOPCION: {
    label: '💛 En Adopción',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
  },
  SE_BUSCA: {
    label: '🔎 Se Busca',
    badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30',
  },
  CAMPANA_COMUNITARIA: {
    label: '📣 Campaña',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30',
  },
  EXTRAVIADA: {
    label: '🔎 Extraviada',
    badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30',
  },
  ENCONTRADA_EN_CALLE: {
    label: '🏠 Encontrada',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  },
};

export const LOST_PET_STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  BUSQUEDA_ACTIVA: {
    label: 'Activa',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  },
  AVISTADA_RECIENTEMENTE: {
    label: 'Avistada',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30',
  },
  REENCONTRADA: {
    label: 'Resuelta / Reencontrada',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
  },
  CERRADO: {
    label: 'Cerrada',
    badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/30',
  },
};

export const ADOPTION_STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  NO_EN_ADOPCION: {
    label: 'De casa / Expediente',
    badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/30',
  },
  DISPONIBLE: {
    label: 'En Adopción',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
  },
  EN_PROCESO: {
    label: 'En Proceso',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  },
  ADOPTADA: {
    label: 'Adoptada',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30',
  },
  EN_SEGUIMIENTO: {
    label: 'Seguimiento',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30',
  },
};

/**
 * Normalizes text for accent-insensitive, case-insensitive local search.
 */
export function normalizeSearchText(value?: string | null): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  const escapeCell = (cell: string | number | boolean | null | undefined) => {
    const str = cell === null || cell === undefined ? '' : String(cell);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csv = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
