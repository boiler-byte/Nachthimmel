/** Same-origin ADSB.lol bridge for Cloudflare Pages Functions and local Node preview.
 *  Endpoint: GET /api/aircraft?lat=52.52&lon=13.405&radius=200
 *  No open-proxy behaviour: the upstream domain and path are fixed and all
 *  query parameters are bounded before sending a request.
 */

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

export function validateRequest(request) {
  const params = new URL(request.url).searchParams;
  const read = (name, min, max) => {
    const value = params.get(name);
    if (!value || !/^-?\d+(?:\.\d+)?$/.test(value)) return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= min && number <= max ? number : null;
  };
  const lat = read('lat', -90, 90), lon = read('lon', -180, 180);
  const radius = read('radius', 1, 250);
  if (lat === null || lon === null || radius === null) return null;
  return { lat, lon, radius: Math.round(radius) };
}

export async function onRequestGet({ request }) {
  const input = validateRequest(request);
  if (!input) return json({ error: 'Ungültige Koordinaten oder Radius (1–250 nautische Meilen).' }, 400);
  const { lat, lon, radius } = input;
  // Literal hostname; never forward arbitrary URLs, credentials or headers.
  const upstreamURL = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${radius}`;
  try {
    const upstream = await fetch(upstreamURL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000)
    });
    if (!upstream.ok) {
      return json({ error: upstream.status === 429
        ? 'ADSB.lol begrenzt momentan Anfragen (HTTP 429). Bitte später erneut versuchen.'
        : `ADSB.lol antwortet mit HTTP ${upstream.status}.` }, upstream.status === 429 ? 429 : 502);
    }
    const data = await upstream.json();
    if (!data || !Array.isArray(data.ac)) {
      return json({ error: 'ADSB.lol hat keine gültige Flugzeugliste geliefert.' }, 502);
    }
    return json({ ac: data.ac, now: data.now || Date.now() });
  } catch (_) {
    return json({ error: 'ADSB.lol ist über den Proxy momentan nicht erreichbar.' }, 502);
  }
}
