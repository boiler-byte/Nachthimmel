/**
 * Opportunistic reverse geocoding for explicitly chosen observer positions.
 * No GPS watch/polling: a request is only scheduled after setting a new location.
 * Nominatim usage: cache successful names; 1 km minimum movement; one request at a
 * time; at least 60 s between requests in this browser session.
 * https://operations.osmfoundation.org/policies/nominatim/
 */
import { geoDistanceKm } from '../core/geo.js';

export const PLACE_LOOKUP_DISTANCE_KM = 1;
export const PLACE_LOOKUP_COOLDOWN_MS = 60_000;
const DEBOUNCE_MS = 350;

let latestRequest = 0;
let pendingTimer = null;
let pendingController = null;
let previousRequestAt = -Infinity;

export function cachedPlaceName(lookup, lat, lon) {
  if (!lookup || typeof lookup.name !== 'string' || !lookup.name.trim()) return null;
  return geoDistanceKm(lat, lon, lookup.lat, lookup.lon) < PLACE_LOOKUP_DISTANCE_KM
    ? lookup.name : null;
}

/** Display a settlement, not a house/street or huge verbose reverse-address. */
export function parsePlaceName(data) {
  if (!data || typeof data !== 'object' || data.error) return null;
  const a = data.address;
  if (!a || typeof a !== 'object') return null;
  const settlement = [a.city, a.town, a.village, a.municipality, a.hamlet,
    a.city_district, a.suburb, a.county, a.state].find(v => typeof v === 'string' && v.trim());
  const country = typeof a.country === 'string' ? a.country.trim() : '';
  if (!settlement && !country) return null;
  const parts = [settlement?.trim(), country].filter(Boolean);
  return [...new Set(parts)].join(', ').slice(0, 140);
}

export function reversePlaceURL(lat, lon) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('zoom', '13'); // Village/town level, not individual addresses.
  url.searchParams.set('layer', 'address');
  url.searchParams.set('accept-language', 'de');
  url.searchParams.set('lat', lat.toFixed(6));
  url.searchParams.set('lon', lon.toFixed(6));
  return url;
}

export async function fetchPlaceName(lat, lon, fetchImpl = globalThis.fetch, signal) {
  const response = await fetchImpl(reversePlaceURL(lat, lon), {
    headers: { Accept: 'application/json' },
    referrerPolicy: 'strict-origin-when-cross-origin',
    signal
  });
  if (!response.ok) return null;
  return parsePlaceName(await response.json());
}

/** Cancel older lookups; apply only if this is still the current observer location. */
export function schedulePlaceName(lat, lon, applyName) {
  const token = ++latestRequest;
  if (pendingTimer !== null) clearTimeout(pendingTimer);
  pendingController?.abort();
  pendingController = null;
  const wait = Math.max(DEBOUNCE_MS, previousRequestAt + PLACE_LOOKUP_COOLDOWN_MS - Date.now());
  pendingTimer = setTimeout(async () => {
    pendingTimer = null;
    if (token !== latestRequest) return;
    const controller = new AbortController();
    pendingController = controller;
    previousRequestAt = Date.now();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const name = await fetchPlaceName(lat, lon, globalThis.fetch, controller.signal);
      if (name && token === latestRequest) applyName(name, lat, lon);
    } catch {
      // Offline, blocked API or missing OSM settlement: retain coordinates.
    } finally {
      clearTimeout(timeout);
      if (pendingController === controller) pendingController = null;
    }
  }, wait);
}

export function cancelPlaceName() {
  ++latestRequest;
  if (pendingTimer !== null) clearTimeout(pendingTimer);
  pendingTimer = null;
  pendingController?.abort();
  pendingController = null;
}
