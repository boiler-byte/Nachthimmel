/** Nachthimmel v2 - ui/status.js. Extracted from the original v6 app. */
import { aircraftAtLiveTime } from '../core/clock.js';
import { $ } from '../core/dom.js';
import { state } from '../core/store.js';
import { withinAircraftDistance } from '../features/aircraft/aircraft.distance.js';
import { predictAircraft } from '../features/aircraft/aircraft.positions.js';

export function updateAircraftCounter() {
 const el=$('aircraftCount');
 if(!el)return;
 const inRange=state.aircraftLoaded ? state.aircraft.filter(a=>{
  const p=predictAircraft(a);return p&&p.alt>0&&withinAircraftDistance(p.lat,p.lon);
 }).length : 0;
 el.textContent=!state.layers.aircraft ? 'Ohne API-Key · Proxy erforderlich'
  : !aircraftAtLiveTime() ? 'Nur zur Live-Zeit (JETZT)'
  : state.aircraftError ? (state.aircraftErrorReason || 'ADSB.lol-Proxy nicht erreichbar')
  : state.aircraftLoaded ? `${inRange} ${inRange===1 ? 'Flugzeug' : 'Flugzeuge'} bis ${state.aircraftMaxDistanceKm} km`
  : state.aircraftLoading ? 'ADSB.lol wird abgefragt ...' : 'Verbinde mit ADSB.lol ...';
}

export function updateCounters() {
  $('starsCount').textContent = state.starsLoaded ? `${state.stars.length.toLocaleString('de-DE')} Katalogsterne & Milchstraße` : 'Basissterne & Milchstraße';
  $('constCount').textContent = state.constLoaded ? `${state.constellations.length} IAU-Sternbilder` : 'Basiskatalog';
  $('satCount').textContent = state.satLoaded ? `${state.satellites.length} Orbitdaten` : state.satError ? 'API nicht erreichbar' : 'Lade Positionen ...';
  updateAircraftCounter();
 const all = state.starsLoaded && state.constLoaded && state.satLoaded;
 $('liveStatus').textContent = all ? 'DATEN AKTUELL' : state.starsLoaded ? 'KATALOG AKTUELL' : 'HIMMELSKARTE';
 $('sourceStatus').textContent = all ? 'Sterne + Satelliten synchronisiert' : state.starsLoaded ? 'Sternkatalog geladen' : state.catalogError ? 'Eingeschr\u00e4nkter Offline-Katalog' : 'Kataloge werden geladen ...';
 $('sourceDot').classList.toggle('offline', !all);
}
