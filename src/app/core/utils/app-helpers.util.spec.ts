import {
  buildFacebookShareUrl,
  buildWhatsAppUrl,
  escapeHtml,
  formatActorRoleLabel,
  formatExactDateTime,
  isApiRequestUrl,
  sanitizeBase64RasterDataUrl,
  sanitizeCsvCell,
  sanitizeHttpUrl,
  sanitizeImageSrc,
  sanitizeInternalPath,
} from './app-helpers.util';

describe('app-helpers.util', () => {
  describe('isApiRequestUrl', () => {
    it('matches configured API base URL and relative /api/v1 paths only', () => {
      const apiBase = 'https://backhuellitas.onrender.com/api/v1';
      expect(isApiRequestUrl(`${apiBase}/pets/public`, apiBase)).toBe(true);
      expect(isApiRequestUrl(`${apiBase}?page=1`, apiBase)).toBe(true);
      expect(isApiRequestUrl('/api/v1/users/me', apiBase)).toBe(true);

      expect(
        isApiRequestUrl('https://evil.example.com/api/v1/steal-token', apiBase),
      ).toBe(false);
      expect(isApiRequestUrl('https://backhuellitas.onrender.com.evil.com/api/v1', apiBase)).toBe(
        false,
      );
    });
  });

  describe('sanitizeInternalPath', () => {
    it('allows single-slash in-app paths and blocks open redirects', () => {
      expect(sanitizeInternalPath('/adopciones/123?tab=info')).toBe(
        '/adopciones/123?tab=info',
      );
      expect(sanitizeInternalPath('//evil.com')).toBe('/');
      expect(sanitizeInternalPath('/\\evil.com')).toBe('/');
      expect(sanitizeInternalPath('https://evil.com')).toBe('/');
      expect(sanitizeInternalPath('javascript:alert(1)')).toBe('/');
    });
  });

  describe('sanitizeHttpUrl & sanitizeImageSrc & sanitizeBase64RasterDataUrl', () => {
    it('blocks dangerous javascript: and SVG data URLs while keeping safe raster/HTTP(S)/blob URLs', () => {
      expect(sanitizeHttpUrl('https://huellitas-sand.vercel.app/adopciones')).toBe(
        'https://huellitas-sand.vercel.app/adopciones',
      );
      expect(sanitizeHttpUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull();

      expect(sanitizeImageSrc('https://cdn.example.com/pet.jpg')).toBe(
        'https://cdn.example.com/pet.jpg',
      );
      expect(sanitizeImageSrc('blob:https://huellitas-sand.vercel.app/abc')).toBe(
        'blob:https://huellitas-sand.vercel.app/abc',
      );
      expect(sanitizeImageSrc('data:image/png;base64,iVBORw0KGgo=')).toBe(
        'data:image/png;base64,iVBORw0KGgo=',
      );
      expect(
        sanitizeImageSrc('data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIi8+'),
      ).toBeNull();
      expect(
        sanitizeBase64RasterDataUrl('data:image/svg+xml;base64,PHN2Zy8+'),
      ).toBeNull();
    });
  });

  describe('escapeHtml & sanitizeCsvCell', () => {
    it('escapes HTML entities and neutralizes spreadsheet formula prefixes', () => {
      expect(escapeHtml('<script>"alert"</script>')).toBe(
        '&lt;script&gt;&quot;alert&quot;&lt;/script&gt;',
      );
      expect(sanitizeCsvCell('=CMD|"/C calc"!A0')).toBe('"\'=CMD|""/C calc""!A0"');
      expect(sanitizeCsvCell(' +SUM(1,2)')).toBe('"\' +SUM(1,2)"');
      expect(sanitizeCsvCell('Luna "La Güera"')).toBe('"Luna ""La Güera"""');
    });
  });

  describe('buildWhatsAppUrl & buildFacebookShareUrl & formatters', () => {
    it('normalizes 10-digit Mexican numbers without duplicating country code 52', () => {
      expect(buildWhatsAppUrl('4181234567', 'Hola')).toBe(
        'https://wa.me/524181234567?text=Hola',
      );
      expect(buildWhatsAppUrl('+52 418 123 4567', 'Hola')).toBe(
        'https://wa.me/524181234567?text=Hola',
      );
      expect(buildWhatsAppUrl(undefined, 'Compartir')).toBe(
        'https://wa.me/?text=Compartir',
      );
    });

    it('builds safe Facebook share URL and maps role/date formats cleanly', () => {
      const share = buildFacebookShareUrl('https://huellitas-sand.vercel.app/adopciones/1', 'Adopt');
      expect(share).toContain('https://www.facebook.com/sharer/sharer.php?');
      expect(share).toContain('u=https%3A%2F%2Fhuellitas-sand.vercel.app%2Fadopciones%2F1');
      expect(formatActorRoleLabel('RESCATISTA_VERIFICADO')).toBe('Rescatista Verificado');
      expect(formatActorRoleLabel('UNKNOWN', 'Comunidad DH')).toBe('Comunidad DH');
      expect(formatExactDateTime('2026-11-14T18:00:00Z')).toContain('2026');
    });
  });
});
