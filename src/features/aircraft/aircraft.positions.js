/** Nachthimmel v2 - features/aircraft/aircraft.positions.js. Extracted from the original v6 app. */
import { clamp, deg, rad, wrap } from '../../core/math.js';
import { state } from '../../core/store.js';

// ADSB.lol positions are WGS84 aircraft positions (metres after normalization), not astronomical RA/Dec.
// Convert to the observer's topocentric east/north/up frame (same azimuth
// and elevation convention as the satellite and star projection).
export function ecef(lat,lon,heightM){
 const phi=rad(lat),lambda=rad(lon),sinPhi=Math.sin(phi),cosPhi=Math.cos(phi);
 const a=6378137,e2=.00669437999014;
 const n=a/Math.sqrt(1-e2*sinPhi*sinPhi);
 return [(n+heightM)*cosPhi*Math.cos(lambda),(n+heightM)*cosPhi*Math.sin(lambda),
  (n*(1-e2)+heightM)*sinPhi];
}

export function aircraftHorizontal(lat,lon,heightM){
 const p=ecef(lat,lon,heightM),o=ecef(state.lat,state.lon,45);
 const dx=p[0]-o[0],dy=p[1]-o[1],dz=p[2]-o[2];
 const phi=rad(state.lat),lambda=rad(state.lon),s=Math.sin,c=Math.cos;
 const east=-s(lambda)*dx+c(lambda)*dy;
 const north=-s(phi)*c(lambda)*dx-s(phi)*s(lambda)*dy+c(phi)*dz;
 const up=c(phi)*c(lambda)*dx+c(phi)*s(lambda)*dy+s(phi)*dz;
 return {az:wrap(deg(Math.atan2(east,north))),alt:deg(Math.atan2(up,Math.hypot(east,north))),
  range:Math.hypot(east,north,up)/1000};
}

export function predictAircraft(record,at=Date.now()){
 const sample=record.positionTime || state.aircraftDataTime || state.aircraftFetchedAt;
 // Old/unreported positions must never be shown as live traffic.
 if(!Number.isFinite(sample)||at-sample>185000)return null;
 const dt=clamp((at-sample)/1000,0,90); // dead reckoning capped at 90s
 let lat=record.lat,lon=record.lon,height=record.altitude;
 if(Number.isFinite(record.track)&&Number.isFinite(record.speed)){
  const travel=clamp(record.speed,0,430)*dt;
  lat=clamp(lat+deg(travel*Math.cos(rad(record.track))/6371000),-89.99,89.99);
  lon=((lon+deg(travel*Math.sin(rad(record.track))/(6371000*Math.max(.03,Math.cos(rad(lat)))))+540)%360)-180;
 }
 if(Number.isFinite(record.verticalRate))height=clamp(height+record.verticalRate*dt,0,18000);
 return {...aircraftHorizontal(lat,lon,height),lat,lon,altitude:height,
  ageSeconds:Math.max(0,(Date.now()-sample)/1000),predictedSeconds:dt};
}
