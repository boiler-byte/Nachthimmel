/** Nachthimmel v2 - sensors/geolocation.js. Extracted from the original v6 app. */
import { $, formatNumber } from '../core/dom.js';
import { savePreferences } from '../core/preferences.js';
import { cachedPlaceName, cancelPlaceName, schedulePlaceName } from '../services/place-name.service.js';
import { state } from '../core/store.js';
import { pollAircraft } from '../features/aircraft/adsb.service.js';
import { invalidatePlanetCache } from '../features/planets/planets.orbits.js';
import { clearPathCache } from '../features/trajectories/paths.service.js';
import { renderDetail } from '../ui/details.js';
import { closeModal } from '../ui/dialogs.js';
import { showToast } from '../ui/notifications.js';

export function setLocation(lat,lon,place){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180){showToast('Bitte g\u00fcltige Koordinaten eingeben.',true);return false;}
 const explicitPlace = typeof place === 'string' && place.trim() ? place.trim() : null;
 const cachedPlace = explicitPlace ? null : cachedPlaceName(state.placeLookup, lat, lon);
 cancelPlaceName();
 state.lat=lat;state.lon=lon;
 state.place=explicitPlace || cachedPlace || `${formatNumber(lat,3)}\u00b0, ${formatNumber(lon,3)}\u00b0`;
 if (explicitPlace) state.placeLookup={lat,lon,name:explicitPlace,at:Date.now()};
 $('placeLabel').textContent=state.place;
 $('latInput').value=lat.toFixed(4);$('lonInput').value=lon.toFixed(4);
  state.lastSatCompute=0;
  invalidatePlanetCache();clearPathCache();
  state.aircraftRequestVersion++;state.aircraftAbort?.abort();state.aircraftAbort=null;
  state.aircraftLoading=false;state.aircraft=[];state.aircraftLoaded=false;
  state.aircraftError=false;state.aircraftErrorReason='';state.aircraftNextAt=0;
  if(state.layers.aircraft)pollAircraft();
  savePreferences(state);
  if (!explicitPlace && !cachedPlace) {
    schedulePlaceName(lat,lon,(name,requestedLat,requestedLon)=>{
      // Coordinates may have been changed while the network request was pending.
      if (state.lat !== requestedLat || state.lon !== requestedLon) return;
      state.place=name;
      state.placeLookup={lat:requestedLat,lon:requestedLon,name,at:Date.now()};
      $('placeLabel').textContent=name;
      savePreferences(state);
    });
  }
 if(state.selected)renderDetail();
 return true;
}

export function requestGPS(){
 if(!navigator.geolocation){showToast('Geolokalisierung ist in diesem Browser nicht verf\u00fcgbar.',true);return;}
 showToast('GPS-Freigabe wird angefragt. Der Standort wird lokal gespeichert.');
 navigator.geolocation.getCurrentPosition(
  p=>{
   setLocation(p.coords.latitude,p.coords.longitude);
   closeModal('locationModal');showToast('Standort \u00fcbernommen. Die Himmelsansicht wurde aktualisiert.');
  },
  err=>showToast('Standort nicht verf\u00fcgbar ('+err.message+'). Bei Bedarf HTTPS verwenden.',true),
  {enableHighAccuracy:false,timeout:14000,maximumAge:60000}
 );
}
