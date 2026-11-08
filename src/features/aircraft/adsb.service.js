/** Live ADSB.lol aircraft data through this app's same-origin API bridge. */
import { emit } from '../../core/events.js';
import { aircraftAtLiveTime } from '../../core/clock.js';
import { wrap } from '../../core/math.js';
import { state } from '../../core/store.js';

// ADSB.lol does not enable cross-origin browser requests. See functions/api/aircraft.js.
// The public service has dynamic rate limits, so use conservative polling.
export const AIRCRAFT_POLL_MS = 90_000;
export const AIRCRAFT_RADIUS_NM = 200;
const MAX_POSITION_AGE_MS = 125_000;
const FEET_TO_METRES = 0.3048;
const KNOTS_TO_MS = 0.514444;

function numeric(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function aircraftProxyURL(baseURI = document.baseURI, lat = state.lat, lon = state.lon) {
  const url = new URL('https://nachthimmel-adsb.der-boiler.workers.dev/api/aircraft', baseURI);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Live-Flugzeuge benötigen HTTPS oder localhost mit ADSB.lol-Proxy.');
  }
  url.searchParams.set('lat', lat.toFixed(4));
  url.searchParams.set('lon', lon.toFixed(4));
  url.searchParams.set('radius', String(AIRCRAFT_RADIUS_NM));
  return url;
}

/** Convert ADSBExchange-v2/readsb fields to the renderer's SI-based record model. */
export function parseAircraftStates(data, currentTime = Date.now()) {
  if (!data || !Array.isArray(data.ac)) throw new Error('Ungültige ADSB.lol-Antwort');
  const result = new Map();
  let responseTime = numeric(data.now);
  if (responseTime && responseTime < 1e11) responseTime *= 1000;
  if (!responseTime || responseTime > currentTime + 30_000) responseTime = currentTime;

  for (const entry of data.ac) {
    if (!entry || typeof entry !== 'object') continue;
    const id = String(entry.hex || '').trim().toLowerCase();
    const lat = numeric(entry.lat), lon = numeric(entry.lon);
    const posAge = numeric(entry.seen_pos) ?? numeric(entry.seen);
    const altitudeFeet = numeric(entry.alt_geom) ?? numeric(entry.alt_baro);
    if (!/^[0-9a-f]{6}$/.test(id) || lat === null || lon === null
      || Math.abs(lat) > 90 || Math.abs(lon) > 180
      || entry.alt_baro === 'ground' || altitudeFeet === null
      || altitudeFeet < -1500 || altitudeFeet > 70000 || posAge === null
      || posAge < 0 || posAge * 1000 > MAX_POSITION_AGE_MS) continue;

    const positionTime = Math.min(currentTime, responseTime - posAge * 1000);
    if (currentTime - positionTime > MAX_POSITION_AGE_MS) continue;
    const gs = numeric(entry.gs);
    const track = numeric(entry.track);
    const verticalFeetMin = numeric(entry.geom_rate) ?? numeric(entry.baro_rate);
    result.set(id, {
      id,
      callsign: String(entry.flight || '').trim().slice(0, 16),
      registration: String(entry.r || '').trim().slice(0, 20),
      type: String(entry.t || '').trim().slice(0, 16),
      lat, lon,
      altitude: altitudeFeet * FEET_TO_METRES,
      positionTime,
      speed: gs === null ? null : Math.max(0, gs) * KNOTS_TO_MS,
      track: track === null ? null : wrap(track),
      verticalRate: verticalFeetMin === null ? null : verticalFeetMin * FEET_TO_METRES / 60,
      squawk: String(entry.squawk || '').trim().slice(0, 5),
      source: 'ADSB.lol'
    });
  }
  return result;
}

export async function pollAircraft() {
  if (!state.layers.aircraft || !aircraftAtLiveTime() || document.hidden
    || state.aircraftLoading || Date.now() < state.aircraftNextAt) return;
  state.aircraftLoading = true;
  state.aircraftError = false;
  state.aircraftErrorReason = '';
  emit('data:changed');
  const seq = ++state.aircraftRequestVersion;
  const controller = new AbortController();
  state.aircraftAbort = controller;
  const timeout = setTimeout(() => controller.abort(), 14_000);

  try {
    const response = await fetch(aircraftProxyURL(), {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (seq !== state.aircraftRequestVersion) return;
    if (!response.ok) {
      let detail;
      try { detail = (await response.json())?.error; } catch { /* Non-JSON status. */ }
      if (response.status === 404 || response.status === 405) {
        throw new Error('ADSB.lol-Proxy fehlt – siehe README (Cloudflare Pages oder Node-Server).');
      }
      throw new Error(detail || `ADSB.lol-Proxy HTTP ${response.status}`);
    }
    if (!(response.headers.get('content-type') || '').includes('application/json')) {
      throw new Error('ADSB.lol-Proxy fehlt oder liefert keine JSON-Daten.');
    }
    const parsed = parseAircraftStates(await response.json());
    if (seq !== state.aircraftRequestVersion) return;
    state.aircraft = [...parsed.values()];
    state.aircraftDataTime = Date.now();
    state.aircraftFetchedAt = Date.now();
    state.aircraftLoaded = true;
    state.aircraftError = false;
    state.aircraftErrorReason = '';
    state.aircraftNextAt = Date.now() + AIRCRAFT_POLL_MS;
    if (state.selected?.kind === 'aircraft') {
      const updated = parsed.get(state.selected.item.id);
      if (updated) { state.selected.item = updated; emit('detail:refresh'); }
    }
    emit('data:changed');
  } catch (error) {
    if (seq !== state.aircraftRequestVersion) return;
    state.aircraftError = true;
    state.aircraftErrorReason = String(error?.message || 'ADSB.lol nicht erreichbar').slice(0, 120);
    state.aircraftNextAt = Date.now() + (state.aircraftErrorReason.includes('429') ? 180_000 : AIRCRAFT_POLL_MS);
    if (!state.aircraftFetchedAt) {
      emit('toast', { message: 'Flugzeug-Layer: ' + state.aircraftErrorReason, warn: true });
    }
  } finally {
    clearTimeout(timeout);
    if (seq === state.aircraftRequestVersion) {
      state.aircraftLoading = false;
      state.aircraftAbort = null;
      emit('data:changed');
    }
  }
}
