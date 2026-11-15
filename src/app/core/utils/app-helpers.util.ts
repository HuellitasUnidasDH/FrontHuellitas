const RASTER_DATA_URL_REGEX =
  /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;
const CSV_FORMULA_PREFIX_REGEX = /^[\s]*[=+\-@\t\r]/;

/**
 * Checks whether an HTTP request URL targets our trusted backend API
 * (either matching the configured `apiBaseUrl` or a same-origin `/api/v1` path)
 * before attaching Authorization headers or retrying idempotent requests.
 */
export function isApiRequestUrl(url: string, apiBaseUrl: string): boolean {
  if (!url) return false;
  const normalizedBase = apiBaseUrl.trim().replace(/\/+$/, '');
  if (
    normalizedBase &&
    (url === normalizedBase ||
      url.startsWith(`${normalizedBase}/`) ||
      url.startsWith(`${normalizedBase}?`))
  ) {
    return true;
  }

  return url === '/api/v1' || url.startsWith('/api/v1/') || url.startsWith('/api/v1?');
}

/**
 * Validates that an internal redirect / return URL points strictly to an
 * in-app relative path starting with a single `/` (never `//host`, `\`, or schemes).
 */
export function sanitizeInternalPath(
  rawUrl: string | null | undefined,
  fallback = '/',
): string {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('\\')
  ) {
    return fallback;
  }

  for (let i = 0; i < trimmed.length; i += 1) {
    const code = trimmed.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) {
      return fallback;
    }
  }

  try {
    const parsed = new URL(trimmed, 'https://huellitas.local');
    if (parsed.origin !== 'https://huellitas.local') {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Validates an external web link (`http:` or `https:`), blocking `javascript:`,
 * `data:`, and malformed URLs.
 */
export function sanitizeHttpUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validates a raster base64 data URL (excluding SVG/HTML payloads).
 */
export function sanitizeBase64RasterDataUrl(
  url: string | null | undefined,
): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  return RASTER_DATA_URL_REGEX.test(trimmed) ? trimmed : null;
}

/**
 * Validates image `src` values for print views and HTML templates:
 * permits relative paths (`/assets/...`), `http(s):`, `blob:`, and raster `data:image/*`.
 */
export function sanitizeImageSrc(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (RASTER_DATA_URL_REGEX.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return sanitizeInternalPath(trimmed, '') || null;
  }

  try {
    const parsed = new URL(trimmed);
    if (
      parsed.protocol === 'https:' ||
      parsed.protocol === 'http:' ||
      parsed.protocol === 'blob:'
    ) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Escapes HTML special characters for safe interpolation inside print documents.
 */
export function escapeHtml(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats a CSV cell defensively against Excel/Sheets formula injection (`=`, `+`, `-`, `@`).
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (CSV_FORMULA_PREFIX_REGEX.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Builds a normalized `https://wa.me/...` link preserving existing country codes
 * (avoiding double `52` prefixes) and falling back to a share link when no phone is provided.
 */
export function buildWhatsAppUrl(
  phone?: string | null,
  message = '',
): string {
  const cleanDigits = (phone || '').replace(/\D/g, '');
  const normalizedPhone = cleanDigits.length === 10 ? `52${cleanDigits}` : cleanDigits;
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return normalizedPhone
    ? `https://wa.me/${normalizedPhone}${query}`
    : `https://wa.me/${query}`;
}

/**
 * Builds a safe Facebook sharer URL.
 */
export function buildFacebookShareUrl(targetUrl: string, quote?: string): string {
  const params = new URLSearchParams({ u: targetUrl });
  if (quote) {
    params.set('quote', quote);
  }
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Safely opens an external HTTP(S) URL in a new tab with `noopener,noreferrer`.
 */
export function openExternalSafe(url: string): void {
  const safeUrl = sanitizeHttpUrl(url);
  if (!safeUrl || typeof window === 'undefined') return;
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Maps platform user roles to concise localized display labels.
 */
export function formatActorRoleLabel(
  role?: string | null,
  defaultLabel = 'Responsable / Ciudadano',
): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'RESCATISTA_VERIFICADO':
      return 'Rescatista Verificado';
    case 'ALBERGUE':
      return 'Albergue';
    case 'VETERINARIAN':
      return 'Veterinario';
    case 'CLINICA_ALIADA':
      return 'Clínica Aliada';
    case 'ADOPTANTE_VERIFICADO':
      return 'Adoptante Verificado';
    default:
      return defaultLabel;
  }
}

/**
 * Formats an ISO timestamp in `es-MX` short date + 12h time (`14 nov 2026 • 06:15 p. m.`).
 */
export function formatExactDateTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const datePart = date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} • ${timePart}`;
}

/**
 * Computes a local YYYY-MM-DD calendar key for grouping chat messages by day.
 */
export function getMessageDayKey(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Formats a calendar day label (`Hoy`, `Ayer`, `14 de nov` / `14 de nov de 2025`) for chat dividers.
 */
export function formatMessageDateDivider(
  dateStr?: string | null,
  referenceDate = new Date(),
): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const diffDays = Math.round(
    (today.getTime() - targetDay.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';

  const includeYear = date.getFullYear() !== referenceDate.getFullYear();
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

/**
 * Maps pet gender codes (`MALE`, `FEMALE`, `UNKNOWN`) to localized labels without inventing values.
 */
export function formatPetGenderLabel(
  gender?: string | null,
  defaultLabel = 'No especificado',
): string {
  const normalized = (gender || '').trim().toUpperCase();
  if (!normalized) return defaultLabel;
  if (normalized === 'FEMALE' || normalized === 'HEMBRA') return 'Hembra';
  if (normalized === 'MALE' || normalized === 'MACHO') return 'Macho';
  if (normalized === 'UNKNOWN' || normalized === 'DESCONOCIDO') {
    return 'Desconocido';
  }
  return (gender || '').trim();
}

/**
 * Maps pet size enum codes (`CHICO`..`GIGANTE`) to readable Spanish labels.
 */
export function formatPetSizeLabel(
  size?: string | null,
  defaultLabel = 'No especificado',
): string {
  switch ((size || '').trim().toUpperCase()) {
    case 'CHICO':
      return 'Chico';
    case 'MEDIANO':
      return 'Mediano';
    case 'GRANDE':
      return 'Grande';
    case 'GIGANTE':
      return 'Gigante';
    default:
      return defaultLabel;
  }
}

/**
 * Maps pet energy level codes (`BAJO`, `MEDIO`, `ALTO`) to readable Spanish labels.
 */
export function formatPetEnergyLabel(
  energy?: string | null,
  defaultLabel = 'No especificado',
): string {
  switch ((energy || '').trim().toUpperCase()) {
    case 'BAJO':
      return 'Bajo · Tranquilo';
    case 'MEDIO':
      return 'Medio · Adaptable';
    case 'ALTO':
      return 'Alto · Activo';
    default:
      return defaultLabel;
  }
}
