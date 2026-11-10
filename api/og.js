// Serverless Function en Vercel para generar etiquetas Open Graph dinámicas
// (Foto, Título y Descripción reales de cada mascota) para Facebook, WhatsApp, X y Telegram.

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || 'https://backhuellitas.onrender.com/api/v1';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getReportBadgeTitle(rep) {
  const name = rep.petName || 'Peludito';
  switch (rep.type) {
    case 'ANIMAL_HERIDO':
      return `🚨 Animal Herido / Emergencia: ${name} — Huellitas DH`;
    case 'EN_RESGUARDO':
      return `🏠 Encontrado y En Resguardo: ${name} — Huellitas DH`;
    case 'EN_ADOPCION':
      return `💚 En Adopción Responsable: ${name} — Huellitas DH`;
    case 'CAMPANA_COMUNITARIA':
      return `📢 Campaña Comunitaria: ${name} — Huellitas DH`;
    case 'ENCONTRADA_EN_CALLE':
      return `📍 Peludito Encontrado: ${name} — Huellitas DH`;
    case 'SE_BUSCA':
    case 'EXTRAVIADA':
    default:
      return `🔍 Se Busca a ${name} en Dolores Hidalgo — Huellitas DH`;
  }
}

module.exports = async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:4200';
    const origin = `${protocol}://${host}`;

    const rawId = String(req.query.id || '').trim();
    const rawType = String(req.query.type || 'post').trim();
    const mode = String(req.query.mode || 'html').trim();

    const isPet = rawType === 'pet' || rawId.startsWith('pet-');
    const cleanUuid = rawId.replace(/^(lost-|pet-)/, '');

    let title = 'Huellitas Unidas Dolores Hidalgo — Rescate y Adopción Responsable';
    let description =
      'Plataforma ciudadana para el rescate, reporte de mascotas extraviadas y adopción responsable en Dolores Hidalgo, Gto.';
    let rawImageUrl = `${origin}/icons/icon-512x512.png`;
    const canonicalPath =
      rawType === 'pet' ? `/adopciones/${cleanUuid}` : `/publicacion/${rawId || cleanUuid}`;
    const canonicalUrl = `${origin}${canonicalPath}`;

    if (cleanUuid) {
      const endpoint = isPet
        ? `${BACKEND_API_URL}/pets/public/${encodeURIComponent(cleanUuid)}`
        : `${BACKEND_API_URL}/lost-pets/${encodeURIComponent(cleanUuid)}`;

      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const json = await response.json();
        const data = json && json.data ? json.data : json;

        if (data) {
          if (isPet) {
            const petName = data.name || 'Peludito';
            const species = data.species || 'Mascota';
            const colonia =
              (data.colonia && data.colonia.name) || 'Dolores Hidalgo, Gto.';
            title = `💚 ${petName} (${species}) busca una familia amorosa en ${colonia} — Huellitas DH`;
            description =
              data.rescueStory ||
              `Conoce a ${petName}, disponible para adopción responsable en ${colonia}. ¡Ayúdanos compartiendo!`;
            rawImageUrl =
              data.photoUrl ||
              (Array.isArray(data.photos) && data.photos[0]) ||
              rawImageUrl;
          } else {
            title = getReportBadgeTitle(data);
            const locationPart = data.lastSeenLocation
              ? `📍 Ubicación: ${data.lastSeenLocation}. `
              : '';
            const featuresPart = data.distinctiveFeatures || '';
            const rewardPart = data.rewardOffered
              ? ` 💰 Se ofrece recompensa.`
              : '';
            const phonePart = data.contactPhone
              ? ` 📲 Contacto: ${data.contactPhone}.`
              : '';
            description = `${locationPart}${featuresPart}${rewardPart}${phonePart}`.trim();
            rawImageUrl =
              (Array.isArray(data.photos) && data.photos[0]) || rawImageUrl;
          }
        }
      }
    }

    // Modo binario de imagen: si la foto está guardada en Base64 en la BD,
    // Facebook requiere un endpoint HTTP real con Content-Type: image/jpeg.
    if (mode === 'image') {
      if (rawImageUrl && rawImageUrl.startsWith('data:image/')) {
        const matches = rawImageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const mimeType = matches[1] || 'image/jpeg';
          const buffer = Buffer.from(matches[2], 'base64');
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
          return res.status(200).send(buffer);
        }
      }
      if (rawImageUrl && rawImageUrl.startsWith('http')) {
        return res.redirect(302, rawImageUrl);
      }
      return res.redirect(302, `${origin}/icons/icon-512x512.png`);
    }

    // Si la foto es un Data URL Base64, apuntar og:image a este mismo endpoint con ?mode=image
    let finalOgImage = rawImageUrl;
    if (rawImageUrl && rawImageUrl.startsWith('data:image/')) {
      finalOgImage = `${origin}/api/og?mode=image&type=${encodeURIComponent(
        rawType,
      )}&id=${encodeURIComponent(rawId)}`;
    } else if (rawImageUrl && rawImageUrl.startsWith('/')) {
      finalOgImage = `${origin}${rawImageUrl}`;
    }

    const safeTitle = escapeHtml(title);
    const safeDesc = escapeHtml(description.slice(0, 300));
    const safeImage = escapeHtml(finalOgImage);
    const safeUrl = escapeHtml(canonicalUrl);

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Huellitas Unidas Dolores Hidalgo">
  <meta property="og:locale" content="es_MX">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${safeUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImage}">
  <link rel="canonical" href="${safeUrl}">
</head>
<body>
  <p>Redirigiendo a <a href="${safeUrl}">${safeTitle}</a>...</p>
  <script>window.location.replace(${JSON.stringify(canonicalPath)});</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    return res.status(200).send(html);
  } catch (err) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!doctype html><html><head><title>Huellitas Unidas DH</title></head><body><script>window.location.replace("/");</script></body></html>`);
  }
};

