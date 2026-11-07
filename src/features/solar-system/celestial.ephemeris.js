/**
 * Offline, low-precision Sun and Moon ephemerides.
 * Sun: fitted JPL Earth elements, precessed to mean equator of date.
 * Moon: truncated lunar perturbation series, approximate topocentric parallax.
 * These are sky-guide coordinates, not telescope-grade ephemerides.
 */
import { precessJ2000, radecToHorizontal, timestampToSidereal } from '../../core/astronomy.js';
import { clamp, deg, rad, wrap } from '../../core/math.js';
import { state } from '../../core/store.js';
import { jplHeliocentric } from '../planets/planets.orbits.js';
import { AU_KM } from '../planets/planets.data.js';

export const BODIES = Object.freeze([
 {id:'sun', name:'Sonne', type:'Stern', color:'#f4ca83'},
 {id:'moon', name:'Mond', type:'Erdmond', color:'#b9d6f2'}
]);

const jdOf = date => date.getTime()/86400000+2440587.5;
const sine = degrees => Math.sin(rad(degrees));
const cosine = degrees => Math.cos(rad(degrees));

export function sunCoordinatesAt(date) {
 const T=(jdOf(date)-2451545)/36525;
 const earth=jplHeliocentric('earth',T);
 const y=-earth.y,z=-earth.z,x=-earth.x;
 const e=rad(23.43928); // J2000 mean obliquity
 const Y=Math.cos(e)*y-Math.sin(e)*z;
 const Z=Math.sin(e)*y+Math.cos(e)*z;
 const pos=precessJ2000(wrap(deg(Math.atan2(Y,x))),deg(Math.atan2(Z,Math.hypot(x,Y))),T);
 return {...pos,distAu:earth.r,distKm:earth.r*AU_KM, eclipticLongitude:wrap(deg(Math.atan2(y,x)))};
}

export function moonCoordinatesAt(date) {
 const d=jdOf(date)-2451545;
 const T=d/36525;
 const L=wrap(218.3164477+13.17639648*d);
 const M=wrap(134.9633964+13.06499295*d);
 const D=wrap(297.8501921+12.19074912*d);
 const F=wrap(93.2720950+13.22935024*d);
 const Ms=wrap(357.5291092+.98560028*d);
 const lon=wrap(L
  +6.289*sine(M)+1.274*sine(2*D-M)+.658*sine(2*D)
  +.214*sine(2*M)-.186*sine(Ms)-.059*sine(2*D-2*M)
  -.057*sine(2*D-Ms-M)+.053*sine(2*D+M)+.046*sine(2*D-Ms)
  +.041*sine(Ms-M)-.035*sine(D)-.031*sine(Ms+M)
  -.015*sine(2*F-2*D)+.011*sine(2*D-4*M));
 const lat=5.128*sine(F)+.280*sine(M+F)+.277*sine(M-F)
  +.173*sine(2*D-F)+.055*sine(2*D+F-M)
  +.046*sine(2*D-F-M)+.033*sine(2*D+F)+.017*sine(2*M+F);
 const distKm=385000.56-20905*cosine(M)-3699*cosine(2*D-M)
  -2956*cosine(2*D)-570*cosine(2*M)+246*cosine(2*M-2*D);
 const epsilon=rad(23.439291-.0130042*T);
 const lambda=rad(lon),beta=rad(lat);
 const x=Math.cos(beta)*Math.cos(lambda);
 const y=Math.cos(beta)*Math.sin(lambda);
 const z=Math.sin(beta);
 const Y=y*Math.cos(epsilon)-z*Math.sin(epsilon);
 const Z=y*Math.sin(epsilon)+z*Math.cos(epsilon);
 return {ra:wrap(deg(Math.atan2(Y,x))),dec:deg(Math.atan2(Z,Math.hypot(x,Y))),
  distKm, eclipticLongitude:lon, eclipticLatitude:lat};
}

/** Convert geocentric Moon coordinates into observer-centric RA/Dec. */
export function topocentricMoon(ra,dec,distKm,date,lat=state.lat,lon=state.lon) {
 // Local sidereal angle is evaluated at the given longitude (not necessarily state.lon).
 const lst=wrap(timestampToSidereal(date)-state.lon+lon);
 const p=rad(lat),a=rad(ra),d=rad(dec),theta=rad(lst);
 const ratio=6378.137/distKm;
 const X=Math.cos(d)*Math.cos(a)-ratio*Math.cos(p)*Math.cos(theta);
 const Y=Math.cos(d)*Math.sin(a)-ratio*Math.cos(p)*Math.sin(theta);
 const Z=Math.sin(d)-ratio*Math.sin(p);
 return {ra:wrap(deg(Math.atan2(Y,X))),dec:deg(Math.atan2(Z,Math.hypot(X,Y)))};
}

export function observeBody(id,date=new Date()) {
 if(id!=='sun' && id!=='moon') return null;
 const info=BODIES.find(b=>b.id===id);
 const sun=sunCoordinatesAt(date);
 const center=id==='sun' ? sun : moonCoordinatesAt(date);
 const pos=id==='moon' ? topocentricMoon(center.ra,center.dec,center.distKm,date) : center;
 const lst=timestampToSidereal(date);
 const horizontal=radecToHorizontal(pos.ra,pos.dec,lst);
 const result={body:info,id,ra:pos.ra,dec:pos.dec,az:horizontal.az,alt:horizontal.alt,
  distKm:center.distKm, angularArcmin: id==='moon' ? 2*1737.4/center.distKm*180/Math.PI*60 : 2*695700/center.distKm*180/Math.PI*60};
 if(id==='moon') {
  const cosElong=sine(center.dec)*sine(sun.dec)+cosine(center.dec)*cosine(sun.dec)*cosine(center.ra-sun.ra);
  const elongation=deg(Math.acos(clamp(cosElong,-1,1)));
  const angle=wrap(center.eclipticLongitude-sun.eclipticLongitude);
  const waxing=angle<180;
  const fraction=(1-Math.cos(rad(elongation)))/2;
  const phaseName = fraction<.025?'Neumond'
   :fraction>.975?'Vollmond'
   :fraction>=.475&&fraction<=.525?(waxing?'Erstes Viertel':'Letztes Viertel')
   :fraction<.5?(waxing?'Zunehmende Sichel':'Abnehmende Sichel')
   :(waxing?'Zunehmender Mond':'Abnehmender Mond');
  Object.assign(result,{illum:fraction,phaseName,waxing,elongation});
 }
 return result;
}
