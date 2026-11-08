/** Aircraft ground distance and local display filter, independent of the ADSB proxy URL. */
import { state } from '../../core/store.js';
import { rad } from '../../core/math.js';

export const AIRCRAFT_MIN_DISTANCE_KM = 25;
// The existing ADSB.lol query remains 200 nautical miles (~370.4 km).
// Keeping its URL unchanged also preserves users' custom GitHub Pages Worker endpoints.
export const AIRCRAFT_MAX_DISTANCE_KM = 370;
export const AIRCRAFT_DEFAULT_DISTANCE_KM = 100;

/** Surface (great-circle) distance in km; altitude is deliberately excluded. */
export function aircraftGroundDistanceKm(lat, lon, observerLat = state.lat, observerLon = state.lon) {
  if (![lat, lon, observerLat, observerLon].every(Number.isFinite)) return NaN;
  const deltaLat = rad(lat - observerLat);
  const deltaLon = rad(lon - observerLon);
  const s = Math.sin(deltaLat / 2) ** 2
    + Math.cos(rad(observerLat)) * Math.cos(rad(lat)) * Math.sin(deltaLon / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function withinAircraftDistance(lat, lon, maxKm = state.aircraftMaxDistanceKm) {
  const distance = aircraftGroundDistanceKm(lat, lon);
  return Number.isFinite(distance) && distance <= maxKm;
}
