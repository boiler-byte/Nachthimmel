/** Nachthimmel v2 - features/planets/planets.orbits.js. Extracted from the original v6 app. */
import { precessJ2000, radecToHorizontal, timestampToSidereal } from '../../core/astronomy.js';
import { getDate } from '../../core/clock.js';
import { DEG, clamp, deg, rad, wrap } from '../../core/math.js';
import { AU_KM, JPL_ELEMENTS, LIGHT_DAYS_PER_AU, PLANETS } from './planets.data.js';

export function jplHeliocentric(id,centuries){
 const [base,rate]=JPL_ELEMENTS[id];
 const [a,e,inc,L,peri,node]=base.map((v,i)=>v+rate[i]*centuries);
 let M=rad(((L-peri+540)%360)-180),E=M;
 // Newton's method for Kepler's equation (radians).
 for(let j=0;j<12;j++){
  const correction=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
  E-=correction;if(Math.abs(correction)<1e-12)break;
 }
 const xp=a*(Math.cos(E)-e),yp=a*Math.sqrt(1-e*e)*Math.sin(E);
 const omega=rad(peri-node),O=rad(node),I=rad(inc);
 const cw=Math.cos(omega),sw=Math.sin(omega),co=Math.cos(O),so=Math.sin(O),ci=Math.cos(I),si=Math.sin(I);
 const x=(cw*co-sw*so*ci)*xp+(-sw*co-cw*so*ci)*yp;
 const y=(cw*so+sw*co*ci)*xp+(-sw*so+cw*co*ci)*yp;
 const z=(sw*si)*xp+(cw*si)*yp;
 return {x,y,z,r:Math.hypot(x,y,z)};
}

/** Compute one planet without touching the observation cache (for sky tracks). */
export function planetCoordinatesAt(id, date) {
 const planet = PLANETS.find(p => p.id === id);
 if (!planet || !(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
 const epoch=(date.getTime()/86400000+2440587.5-2451545)/36525;
 const earth=jplHeliocentric('earth',epoch);
 const eclipticTilt=rad(23.43928),ce=Math.cos(eclipticTilt),se=Math.sin(eclipticTilt);
 let body=jplHeliocentric(id,epoch),dx=0,dy=0,dz=0,dist=0;
 for(let j=0;j<3;j++){
  dx=body.x-earth.x;dy=body.y-earth.y;dz=body.z-earth.z;
  dist=Math.hypot(dx,dy,dz);
  body=jplHeliocentric(id,epoch-(dist*LIGHT_DAYS_PER_AU)/36525);
 }
 dx=body.x-earth.x;dy=body.y-earth.y;dz=body.z-earth.z;
 dist=Math.hypot(dx,dy,dz);
 const eqY=ce*dy-se*dz,eqZ=se*dy+ce*dz;
 const ra2000=wrap(deg(Math.atan2(eqY,dx)));
 const dec2000=deg(Math.atan2(eqZ,Math.hypot(dx,eqY)));
 const {ra,dec}=precessJ2000(ra2000,dec2000,epoch);
 const phaseAngle=Math.acos(clamp((body.r*body.r+dist*dist-earth.r*earth.r)/(2*body.r*dist),-1,1));
 const illum=(1+Math.cos(phaseAngle))/2;
 const elong=deg(Math.acos(clamp((-earth.x*dx-earth.y*dy-earth.z*dz)/(earth.r*dist),-1,1)));
 return {planet,ra,dec,dist,sunDist:body.r,illum,elong,
  phaseAngle:deg(phaseAngle),angularArcsec:2*planet.radius/(dist*AU_KM)*DEG*3600,
  lightMinutes:dist*LIGHT_DAYS_PER_AU*1440};
}

let planetCacheTime=NaN,planetCache=[];

export function planetObservations(date){
 const t=date.getTime();
 if(Number.isFinite(planetCacheTime) && Math.abs(t-planetCacheTime)<18000)return planetCache;
 const lst=timestampToSidereal(date);
 const positions=PLANETS.map(planet=>{
  const p=planetCoordinatesAt(planet.id,date);
  const h=radecToHorizontal(p.ra,p.dec,lst);
  return {...p,az:h.az,alt:h.alt};
 });
 planetCacheTime=t;planetCache=positions;
 return positions;
}

export function observePlanet(id,date=getDate()){
 return planetObservations(date).find(o=>o.planet.id===id)||null;
}
/** Invalidate observer-dependent ephemerides on location changes. */
export function invalidatePlanetCache() { planetCacheTime = NaN; planetCache = []; }
