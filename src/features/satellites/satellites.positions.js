import { emit } from '../../core/events.js';
/** Nachthimmel v2 - features/satellites/satellites.positions.js. Extracted from the original v6 app. */
import { deg, rad, wrap } from '../../core/math.js';
import { state } from '../../core/store.js';
import { satlib } from './catalog.service.js';

export function calculateSatPosition(s,date,observer) {
 if(!satlib || !s.rec)return null;
 try{
  const pv=satlib.propagate(s.rec,date);if(!pv?.position || !pv?.velocity)return null;
  const gmst=satlib.gstime(date);
  const ecf=satlib.eciToEcf(pv.position,gmst);
  const angles=satlib.ecfToLookAngles(observer,ecf);
  const geo=satlib.eciToGeodetic(pv.position,gmst);
  const vel=Math.hypot(pv.velocity.x,pv.velocity.y,pv.velocity.z);
  if(!Number.isFinite(angles.azimuth)||!Number.isFinite(angles.elevation))return null;
  return {az:wrap(deg(angles.azimuth)),alt:deg(angles.elevation),range:angles.rangeSat,altitude:geo.height,speed:vel};
 }catch{return null;}
}

export function computeSatellites(date) {
 if(!satlib || !state.satellites.length)return [];
 const now=performance.now();
 if(now-state.lastSatCompute<650 && Math.abs(date.getTime()-state.lastSatDate)<130000)return state.satRender;
 const observer={latitude:rad(state.lat),longitude:rad(state.lon),height:.045};
 const sats=[];
 for(const s of state.satellites){
  const pos=calculateSatPosition(s,date,observer);
  if(pos)sats.push({...pos,record:s});
 }
 state.lastSatCompute=now;state.lastSatDate=date.getTime();state.satRender=sats;
 if(now-state.lastSatLabel>4000){
  const above=sats.filter(s=>s.alt>0).length;
  emit('satellites:visible',above);
  state.lastSatLabel=now;
 }
 return sats;
}
