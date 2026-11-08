import { connectServiceEvents } from './ui/service-events.js';
/** Nachthimmel v2 - app.js. Extracted from the original v6 app. */
import { state } from './core/store.js';
import { restorePreferences } from './core/preferences.js';
import { pollAircraft } from './features/aircraft/adsb.service.js';
import { resize } from './engine/projection.js';
import { renderFrame } from './engine/render-loop.js';
import { buildFallbackConstellations } from './features/constellations/catalog.data.js';
import { loadConstellationCatalog } from './features/constellations/catalog.service.js';
import { loadSatelliteCatalog, setSatelliteLibrary } from './features/satellites/catalog.service.js';
import { FALLBACK_STARS } from './features/stars/catalog.data.js';
import { loadStarCatalog } from './features/stars/catalog.service.js';
import { updateViewUI } from './ui/compass.js';
import { connectUI } from './ui/events.js';
import { showToast } from './ui/notifications.js';
import { updateSearchResults } from './ui/search.js';
import { updateCounters } from './ui/status.js';
import { updateTimeUI } from './ui/time-controls.js';
import { syncPreferencesUI } from './ui/preferences-ui.js';

state.constellations = buildFallbackConstellations();

state.stars = FALLBACK_STARS;

export function initialize(){
 restorePreferences(state);
 syncPreferencesUI();
 connectServiceEvents();resize();connectUI();updateCounters();updateViewUI();updateTimeUI();updateSearchResults();
 if(state.layers.aircraft)pollAircraft();
 requestAnimationFrame(renderFrame);
 // These calls are independent; neither an API outage nor a failed CDN stalls the UI.
 loadStarCatalog();loadConstellationCatalog();
 import('https://cdn.jsdelivr.net/npm/satellite.js@6.0.2/+esm')
  .catch(()=>import('https://esm.sh/satellite.js@6.0.2'))
  .then(lib=>{setSatelliteLibrary(lib);loadSatelliteCatalog();})
  .catch(()=>{state.satError=true;updateCounters();showToast('satellite.js konnte nicht geladen werden. Bitte Internetzugriff auf jsDelivr pr\u00fcfen.',true);});
}
