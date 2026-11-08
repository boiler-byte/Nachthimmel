/** Presentation helpers for selected live aircraft; no network call is needed for metrics. */
import { escapeHTML, formatNumber, niceAngle } from '../../core/dom.js';
import { aircraftGroundDistanceKm } from './aircraft.distance.js';

const direction = track => ['N','NO','O','SO','S','SW','W','NW'][Math.floor((((track % 360) + 360) % 360 + 22.5) / 45) % 8];

export function aircraftMetrics(item, position, now = Date.now()) {
  const latest = item.positionTime;
  const age = Number.isFinite(latest) ? Math.max(0, (now - latest) / 1000) : null;
  const surfaceKm = position ? aircraftGroundDistanceKm(position.lat, position.lon) : NaN;
  const speedKmh = Number.isFinite(item.speed) ? item.speed * 3.6 : NaN;
  const climbMMin = Number.isFinite(item.verticalRate) ? item.verticalRate * 60 : NaN;
  return [
    ['Zum Standort (horizontal)', Number.isFinite(surfaceKm) ? formatNumber(surfaceKm, 1) + ' km' : '--'],
    ['Direkte Entfernung', position ? formatNumber(position.range, 1) + ' km' : '--'],
    ['Gemeldete Flughöhe', Number.isFinite(item.altitude) ? formatNumber(item.altitude, 0) + ' m' : position ? formatNumber(position.altitude, 0) + ' m' : '--'],
    ['Geschwindigkeit', Number.isFinite(speedKmh) ? formatNumber(speedKmh, 0) + ' km/h' : '--'],
    ['Flugrichtung', Number.isFinite(item.track) ? niceAngle(item.track) + ' (' + direction(item.track) + ')' : '--'],
    ['Steigen / Sinken', Number.isFinite(climbMMin) ? (climbMMin > 0 ? '+' : '') + formatNumber(climbMMin, 0) + ' m/min' : '--'],
    ['Höhe über Horizont', position ? niceAngle(position.alt) : '--'],
    ['Azimut', position ? niceAngle(position.az) : '--'],
    ['Letzte Position', age === null ? '--' : formatNumber(age, 0) + ' s zuvor'],
    ['Rufzeichen', item.callsign || '--'],
    ['Kennzeichen', item.registration || '--'],
    ['Flugzeugtyp (ICAO)', item.type || '--'],
    ['ICAO24-Adresse', String(item.id || '').toUpperCase()],
    ['Transpondercode', item.squawk || '--']
  ];
}

export function aircraftSketch() {
  return `<div class="detail-image no-image" style="background:radial-gradient(ellipse at center,#383329,#151c2c 70%)"><svg viewBox="0 0 200 140" aria-hidden="true" style="height:100%;width:100%;color:#ffdb9f"><g transform="translate(100 70) scale(3.8)"><path d="M0 -11 2 -3 10 1.8 10 4 2.1 2.8 1.8 8.1 4.8 10 4.8 11.5 0 10.5 -4.8 11.5 -4.8 10 -1.8 8.1 -2.1 2.8 -10 4 -10 1.8 -2 -3Z" fill="currentColor" stroke="#fff1d7" stroke-width=".5"/></g></svg><span class="detail-photo-credit">ADSB.LOL / OHNE FOTO</span></div>`;
}

/** HexDB publishes a stable image endpoint that redirects to a photo or returns 404. */
export function aircraftPhotoHTML(item) {
  const hex = String(item.id || '').toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(hex)) return aircraftSketch();
  const url = `https://hexdb.io/api/v2/aircraft/${hex}/image/thumbnail`;
  return `<div class="detail-image aircraft-image" id="aircraftDetailPhoto"><img id="aircraftPhotoImage" src="${escapeHTML(url)}" alt="Flugzeugfoto, falls vorhanden, für ${escapeHTML(item.registration || item.callsign || hex.toUpperCase())}" loading="lazy" referrerpolicy="no-referrer"><span class="detail-photo-credit">FOTO: <a href="https://hexdb.io/" target="_blank" rel="noopener noreferrer">HEXDB.IO</a></span></div>`;
}
