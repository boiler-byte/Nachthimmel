/** Nachthimmel v2 - ui/status.js. Extracted from the original v6 app. */
import { aircraftAtLiveTime } from '../core/clock.js';
import { $ } from '../core/dom.js';
import { state } from '../core/store.js';

export function updateAircraftCounter() {
 const el=$('aircraftCount');
 if(!el)return;
 el.textContent=!state.layers.aircraft ? 'API-Key in Einstellungen hinterlegen'
  : !aircraftAtLiveTime() ? 'Nur zur Live-Zeit (JETZT)'
  : state.aircraftError ? (state.aircraftErrorReason || 'AirLabs-API nicht erreichbar')
  : state.aircraftLoaded ? `${state.aircraft.length} Flugzeuge in der Region`
  : state.aircraftLoading ? 'AirLabs wird abgefragt ...' : 'Verbinde mit AirLabs ...';
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
