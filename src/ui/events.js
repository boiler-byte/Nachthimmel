/** Nachthimmel v2 - ui/events.js. Extracted from the original v6 app. */
import { $ } from '../core/dom.js';
import { MAX_ALT, MIN_ALT, clamp, wrap } from '../core/math.js';
import { state } from '../core/store.js';
import { savePreferences } from '../core/preferences.js';
import { onPointerDown, onPointerMove, onPointerUp, setZoom } from '../engine/canvas-input.js';
import { cvs } from '../engine/canvas.js';
import { resize } from '../engine/projection.js';
import { pollAircraft } from '../features/aircraft/adsb.service.js';
import { AIRCRAFT_MIN_DISTANCE_KM, AIRCRAFT_MAX_DISTANCE_KM, withinAircraftDistance } from '../features/aircraft/aircraft.distance.js';
import { predictAircraft } from '../features/aircraft/aircraft.positions.js';
import { PLANETS } from '../features/planets/planets.data.js';
import { toggleMotion } from '../sensors/orientation.js';
import { closeModal, openModal, restoreOverlayFromHistory, updateSelection, visibleModal } from './dialogs.js';
import { setLayer } from './layers.js';
import { connectLocationDialog } from './location-dialog.js';
import { showToast } from './notifications.js';
import { updateSearchResults } from './search.js';
import { focusObject } from './selection.js';
import { updateAircraftCounter } from './status.js';
import { addHours, setPlaying, updateTimeUI } from './time-controls.js';

export function connectUI(){
 document.querySelectorAll('[data-planet-jump]').forEach(button=>{
  button.addEventListener('click',()=>{
   const planet=PLANETS.find(v=>v.id===button.dataset.planetJump);
   if(!planet)return;
   if(!state.layers.planets)setLayer('planets',true);
   updateSelection('planet',planet);
   focusObject('planet',planet);
  });
 });
 document.querySelectorAll('.layer-toggle').forEach(button=>{
  button.addEventListener('click',()=>{
   const layer=button.dataset.layer;
   setLayer(layer,!state.layers[layer]);
  });
 });
 $('motionBtn').addEventListener('click',toggleMotion);
 $('zoomInBtn').onclick=()=>setZoom(state.fov*.81);
 $('zoomOutBtn').onclick=()=>setZoom(state.fov*1.23);
 $('playBtn').onclick=()=>setPlaying(!state.playing);
 $('prevHour').onclick=()=>addHours(-1);
 $('nextHour').onclick=()=>addHours(1);
 $('refreshAircraftBtn').onclick=()=>{
  if(!state.layers.aircraft)setLayer('aircraft',true);
  else {state.aircraftNextAt=0;pollAircraft();}
 };
 const aircraftRange=$('aircraftDistanceRange');
 if(aircraftRange){
  aircraftRange.value=String(state.aircraftMaxDistanceKm);
  $('aircraftDistanceValue').textContent=state.aircraftMaxDistanceKm+' km';
  aircraftRange.addEventListener('input',()=>{
   const distance=Number(aircraftRange.value);
   if(!Number.isFinite(distance))return;
   state.aircraftMaxDistanceKm=Math.max(AIRCRAFT_MIN_DISTANCE_KM,Math.min(AIRCRAFT_MAX_DISTANCE_KM,distance));
   savePreferences(state);
   $('aircraftDistanceValue').textContent=state.aircraftMaxDistanceKm+' km';
   updateAircraftCounter();
   if(state.selected?.kind==='aircraft'){
    const pos=predictAircraft(state.selected.item);
    if(!pos||!withinAircraftDistance(pos.lat,pos.lon))updateSelection(null,null);
   }
  });
 }
 $('nowBtn').onclick=()=>{setPlaying(false);state.offsetMs=0;updateTimeUI();pollAircraft();};
 $('timeRange').addEventListener('input',e=>{
  if(state.playing)setPlaying(false);
  state.offsetMs=Number(e.target.value)*3600000;updateTimeUI();pollAircraft();
 });
 $('searchBtn').onclick=()=>{updateSearchResults();openModal('searchModal');$('searchInput').focus();};
 $('searchClose').onclick=()=>closeModal('searchModal');
 $('searchInput').addEventListener('input',updateSearchResults);
 connectLocationDialog();
 $('layersBtn').onclick=()=>openModal('layersModal');
 $('layersClose').onclick=()=>closeModal('layersModal');
 $('pathsBtn').onclick=()=>openModal('pathsModal');
 $('pathsClose').onclick=()=>closeModal('pathsModal');
 for(const id of ['searchModal','layersModal','pathsModal','locationModal'])$(id).addEventListener('click',e=>{if(e.target===$(id))closeModal(id);});
 cvs.addEventListener('pointerdown',onPointerDown);
 cvs.addEventListener('pointermove',onPointerMove);
 cvs.addEventListener('pointerup',onPointerUp);
 cvs.addEventListener('pointercancel',onPointerUp);
 cvs.addEventListener('wheel',e=>{e.preventDefault();setZoom(state.fov*(e.deltaY<0?.91:1.1));},{passive:false});
 cvs.addEventListener('dblclick',e=>{e.preventDefault();setZoom(state.fov*.74);});
 window.addEventListener('resize',resize);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)pollAircraft();});
 window.setInterval(pollAircraft,7000);
 window.addEventListener('popstate',restoreOverlayFromHistory);
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   const current=visibleModal();
   if(current){e.preventDefault();closeModal(current);return;}
   if(state.selected){e.preventDefault();updateSelection(null,null);return;}
  }
  // Do not steer the map or open search behind the currently open dialog.
  if(visibleModal())return;
  const tag=document.activeElement?.tagName?.toLowerCase();if(tag==='input'||tag==='textarea')return;
  if(e.key==='/'||e.key.toLowerCase()==='f'){
   e.preventDefault();updateSearchResults();openModal('searchModal');$('searchInput').focus();
  }else if(e.key==='ArrowLeft'){state.az=wrap(state.az-7);e.preventDefault();}
  else if(e.key==='ArrowRight'){state.az=wrap(state.az+7);e.preventDefault();}
  else if(e.key==='ArrowUp'){state.alt=clamp(state.alt+7,MIN_ALT,MAX_ALT);e.preventDefault();}
  else if(e.key==='ArrowDown'){state.alt=clamp(state.alt-7,MIN_ALT,MAX_ALT);e.preventDefault();}
  else if(e.key==='+'||e.key==='='){setZoom(state.fov*.84);e.preventDefault();}
  else if(e.key==='-'){setZoom(state.fov*1.2);e.preventDefault();}
 });
}
