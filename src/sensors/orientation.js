/** Nachthimmel v2 - sensors/orientation.js. Extracted from the original v6 app. */
import { $ } from '../core/dom.js';
import { MAX_ALT, MIN_ALT, clamp, deg, rad, wrap } from '../core/math.js';
import { state } from '../core/store.js';
import { showToast } from '../ui/notifications.js';

export let lastSensorHeading = null;

// Device orientation: use the rear-camera viewing direction calculated from
// W3C alpha / beta / gamma rotations, with a relative-heading fallback.
export let headingOffset=null, sensorReceived=false, sensorAbsoluteSeen=false;

export function orientationHandler(e){
 if(!state.motion)return;
 if(![e.alpha,e.beta,e.gamma].every(v=>typeof v==='number'))return;
 if(sensorAbsoluteSeen && !e.absolute && typeof e.webkitCompassHeading!=='number')return;
 sensorReceived=true;
 let alpha=rad(e.alpha),beta=rad(e.beta),gamma=rad(e.gamma);
 let absolute=false;
 if(typeof e.webkitCompassHeading==='number' && Number.isFinite(e.webkitCompassHeading)){
  alpha=rad(-e.webkitCompassHeading);absolute=true;
 }else if(e.absolute){absolute=true;}
 if(absolute)sensorAbsoluteSeen=true;
 const sb=Math.sin(beta),cb=Math.cos(beta),sg=Math.sin(gamma),cg=Math.cos(gamma),sa=Math.sin(alpha),ca=Math.cos(alpha);
 const east=-sg*ca-sb*cg*sa;
 const north=-sg*sa+sb*cg*ca;
 const up=-cb*cg;
 const planar=Math.hypot(east,north);
 const alt=deg(Math.atan2(up,planar));
 // When viewing the zenith/nadir, azimuth is undefined. Preserve the last
 // reliable azimuth while continuing to update elevation all the way to -90°.
 let az=planar<.08 ? state.az : wrap(deg(Math.atan2(east,north)));
 if(!absolute){
  if(headingOffset===null)headingOffset=wrap(state.az-az);
  az=wrap(az+headingOffset);
  state.sensorRelative=true;
 }else{headingOffset=null;state.sensorRelative=false;}
 const diff=((az-state.az+540)%360)-180;
 state.az=wrap(state.az+diff*.25);
 state.alt=clamp(state.alt+(alt-state.alt)*.22,MIN_ALT,MAX_ALT);
}

export async function toggleMotion(){
 if(state.motion){
  state.motion=false;headingOffset=null;
  window.removeEventListener('deviceorientation',orientationHandler,true);
  window.removeEventListener('deviceorientationabsolute',orientationHandler,true);
  $('motionBtn').classList.remove('active');$('motionBtn').setAttribute('aria-pressed','false');
  $('motionText').textContent='SENSOR AUS';showToast('Bewegungssteuerung deaktiviert.');return;
 }
 if(typeof window.DeviceOrientationEvent==='undefined'){
  showToast('Dieses Ger\u00e4t stellt keinen Bewegungssensor bereit.',true);return;
 }
 try{
  // iOS requires the request to happen directly inside the button click.
  if(typeof DeviceOrientationEvent.requestPermission==='function'){
   const p=await DeviceOrientationEvent.requestPermission();
   if(p!=='granted')throw Error('Berechtigung nicht erteilt');
  }
  state.motion=true;headingOffset=null;sensorReceived=false;sensorAbsoluteSeen=false;
  window.addEventListener('deviceorientation',orientationHandler,true);
  window.addEventListener('deviceorientationabsolute',orientationHandler,true);
  $('motionBtn').classList.add('active');$('motionBtn').setAttribute('aria-pressed','true');
  $('motionText').textContent='SENSOR AN';
  showToast('Bewege das Smartphone, um die Himmelskarte auszurichten. Die R\u00fcckkamera gibt die Blickrichtung vor.');
  setTimeout(()=>{if(state.motion&&!sensorReceived)showToast('Keine Sensordaten empfangen. Auf Smartphones ist eine HTTPS-Seite und die Sensorfreigabe erforderlich.',true);},3200);
 }catch(err){showToast('Sensorzugriff verweigert oder nicht verf\u00fcgbar: '+(err.message||'Fehler'),true);}
}

export function disableMotionForDrag(){
 if(!state.motion)return;
 state.motion=false;headingOffset=null;
 window.removeEventListener('deviceorientation',orientationHandler,true);
 window.removeEventListener('deviceorientationabsolute',orientationHandler,true);
 $('motionBtn').classList.remove('active');$('motionBtn').setAttribute('aria-pressed','false');
 $('motionText').textContent='SENSOR AUS';
}
