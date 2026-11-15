import { UserRole } from '../../core/models/user.model';
import { AllyCategory } from '../../core/models/ally.model';
import { sanitizeCsvCell } from '../../core/utils/app-helpers.util';
import {
  ContentReportReason,
  ContentReportStatus,
  ModerationAction,
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

export const ALLY_CATEGORY_OPTIONS: { value: AllyCategory; label: string }[] = [
  { value: 'VETERINARIA', label: 'Clínica Veterinaria' },
  { value: 'ESTETICA_CANINA', label: 'Estética Canina' },
  { value: 'TIENDA_ALIMENTOS', label: 'Tienda de Alimentos' },
  { value: 'FARMACIA_VETERINARIA', label: 'Farmacia Veterinaria' },
];

export const REPORT_REASON_LABELS: Record<ContentReportReason, string> = {
  INTENTO_DE_COBRO: 'Intento de cobro o venta',
  MALTRATO_ANIMAL: 'Maltrato animal',
  DATOS_FALSOS: 'Datos falsos o engañosos',
  SPAM: 'Spam o contenido repetitivo',
  OTRO: 'Otro motivo',
};

export interface ModerationActionMeta {
  value: ModerationAction;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  optionClass: string;
  destructive: boolean;
}

export const MODERATION_ACTION_OPTIONS: ModerationActionMeta[] = [
  {
    value: 'DISMISS',
    label: 'Desestimar denuncia',
    shortLabel: 'Desestimado',
    description: 'No se encontró infracción. Cierra la denuncia sin aplicar sanción.',
    badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30',
    optionClass: 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50',
    destructive: false,
  },
  {
    value: 'MARK_REVIEWING',
    label: 'Dejar en investigación',
    shortLabel: 'En revisión',
    description: 'Mantiene la denuncia en seguimiento mientras se recaban pruebas.',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30',
    optionClass: 'border-sky-400/50 bg-sky-500/5',
    destructive: false,
  },
  {
    value: 'WARN_AUTHOR',
    label: 'Emitir advertencia formal',
    shortLabel: 'Advertencia',
    description: 'Envía una notificación formal al autor sin retirar la publicación.',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    optionClass: 'border-amber-400/50 bg-amber-500/5',
    destructive: false,
  },
  {
    value: 'DELETE_CONTENT',
    label: 'Retirar publicación',
    shortLabel: 'Contenido retirado',
    description: 'Oculta la publicación de inmediato y cancela solicitudes abiertas.',
    badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30',
    optionClass: 'border-orange-500/50 bg-orange-500/10',
    destructive: true,
  },
  {
    value: 'SUSPEND_USER',
    label: 'Suspender cuenta del usuario',
    shortLabel: 'Cuenta suspendida',
    description: 'Inhabilita la cuenta del infractor y revoca sus sesiones activas.',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
    optionClass: 'border-rose-500/50 bg-rose-500/10',
    destructive: true,
  },
  {
    value: 'DELETE_AND_SUSPEND',
    label: 'Retirar publicación y suspender cuenta',
    shortLabel: 'Retiro + Suspensión',
    description: 'Sanción máxima: retira el contenido infractor y bloquea la cuenta.',
    badgeClass: 'bg-rose-600/20 text-rose-700 dark:text-rose-300 border border-rose-500/40',
    optionClass: 'border-rose-600/60 bg-rose-500/15',
    destructive: true,
  },
];

export const MODERATION_ACTION_META_MAP = new Map<ModerationAction, ModerationActionMeta>(
  MODERATION_ACTION_OPTIONS.map((item) => [item.value, item]),
);

export const QUICK_MODERATION_NOTES: string[] = [
  'Intento de cobro o venta prohibido en adopciones gratuitas.',
  'Información falsa, inconsistente o engañosa.',
  'Contenido duplicado, spam o fuera de propósito comunitario.',
  'Revisado sin evidencia suficiente de incumplimiento.',
];

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
    label: 'Animal Herido',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
  },
  EN_RESGUARDO: {
    label: 'En Resguardo',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  },
  EN_ADOPCION: {
    label: 'En Adopción',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
  },
  SE_BUSCA: {
    label: 'Se Busca',
    badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30',
  },
  CAMPANA_COMUNITARIA: {
    label: 'Campaña',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30',
  },
  EXTRAVIADA: {
    label: 'Extraviada',
    badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30',
  },
  ENCONTRADA_EN_CALLE: {
    label: 'Encontrada',
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
  const csv = [
    headers.map(sanitizeCsvCell).join(','),
    ...rows.map((r) => r.map(sanitizeCsvCell).join(',')),
  ].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
