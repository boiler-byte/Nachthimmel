/** Nachthimmel v2 - ui/selection.js. Extracted from the original v6 app. */
import { radecToHorizontal, timestampToSidereal } from '../core/astronomy.js';
import { getDate } from '../core/clock.js';
import { MAX_ALT, MIN_ALT, clamp, rad, wrap } from '../core/math.js';
import { state } from '../core/store.js';
import { predictAircraft } from '../features/aircraft/aircraft.positions.js';
import { observeBody } from '../features/solar-system/celestial.ephemeris.js';
import { observePlanet } from '../features/planets/planets.orbits.js';
import { calculateSatPosition } from '../features/satellites/satellites.positions.js';
import { updateViewUI } from './compass.js';
import { renderDetail } from './details.js';
import { showToast } from './notifications.js';

export function objectHorizontal(kind,item){
  if(kind==='aircraft')return predictAircraft(item);
  if(kind==='body'){const o=observeBody(item.id,getDate());return o?{az:o.az,alt:o.alt}:null;}
  if(kind==='planet') {
  const p=observePlanet(item.id);return p?{az:p.az,alt:p.alt}:null;
 }
 if(kind==='satellite') {
  const p=state.satRender.find(s=>s.record.id===item.id);
  if(p)return p;
  return calculateSatPosition(item,getDate(),{latitude:rad(state.lat),longitude:rad(state.lon),height:.045});
 }
 return radecToHorizontal(item.ra,item.dec,timestampToSidereal(getDate()));
}

export function focusObject(kind,item){
 const h=objectHorizontal(kind,item);if(!h)return;
 // Preserve the selected observation time and allow direct inspection of an
 // object at negative altitude, clearly labelled as a virtual view.
 state.az=wrap(h.az);state.alt=clamp(h.alt,MIN_ALT,MAX_ALT);
  state.fov=kind==='constellation'?75:kind==='satellite'||kind==='aircraft'?58:kind==='planet'||kind==='body'?48:48;
 updateViewUI();
 if(h.alt<0)showToast('Objekt unter dem Horizont: Die Karte zeigt eine virtuelle Durchsicht, keine optische Sichtbarkeit.');
 if(state.selected)renderDetail();
}
