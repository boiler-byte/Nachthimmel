/** Nachthimmel v2 - ui/layers.js. Extracted from the original v6 app. */
import { $ } from '../core/dom.js';
import { state } from '../core/store.js';
import { emit } from '../core/events.js';
import { pollAircraft } from '../features/aircraft/airlabs.service.js';
import { loadSatelliteCatalog, satlib } from '../features/satellites/catalog.service.js';
import { updateSelection } from './dialogs.js';
import { updateAircraftCounter } from './status.js';

export function setLayer(layer,enabled){
 if(!(layer in state.layers))return;
 state.layers[layer]=enabled;
 const button=document.querySelector(`.layer-toggle[data-layer="${layer}"]`);
 if(button){button.classList.toggle('active',enabled);button.setAttribute('aria-pressed',String(enabled));}
 if(!enabled && state.selected?.kind===({stars:'star',planets:'planet',constellations:'constellation',deepSky:'dso',satellites:'satellite',aircraft:'aircraft',sunMoon:'body'})[layer]){
  updateSelection(null,null);
 }
 if(layer==='selectedPath')emit('detail:refresh');
 if(layer==='planets')$('planetQuicklinks').classList.toggle('enabled',enabled);
 if(layer==='aircraft'){
  if(enabled){state.aircraftNextAt=0;pollAircraft();}
  else{
   state.aircraftRequestVersion++;
   state.aircraftAbort?.abort();state.aircraftAbort=null;state.aircraftLoading=false;
  }
  updateAircraftCounter();
 }
 if(layer==='satellites'&&enabled&&state.satError&&!state.satellites.length&&satlib){
  state.satError=false;loadSatelliteCatalog();
 }
}
