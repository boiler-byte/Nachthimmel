/** Nachthimmel v2 - core/astronomy.js. Extracted from the original v6 app. */
import { clamp, deg, rad, wrap } from './math.js';
import { state } from './store.js';

export function timestampToSidereal(t) {
 const jd = t.getTime()/86400000 + 2440587.5;
 const T = (jd - 2451545.0)/36525;
 return wrap(280.46061837 + 360.98564736629*(jd-2451545) + .000387933*T*T - T*T*T/38710000 + state.lon);
}

export function radecToHorizontal(ra,dec,lst) {
 const phi=rad(state.lat), de=rad(dec), ha=rad(wrap(lst-ra));
 const sinAlt = Math.sin(de)*Math.sin(phi)+Math.cos(de)*Math.cos(phi)*Math.cos(ha);
 const alt = Math.asin(clamp(sinAlt,-1,1));
 const east = -Math.cos(de)*Math.sin(ha);
 const north = Math.sin(de)*Math.cos(phi)-Math.cos(de)*Math.sin(phi)*Math.cos(ha);
 return {az:wrap(deg(Math.atan2(east,north))),alt:deg(alt)};
}

export function galacticToEquatorial(l,b) {
 const lr=rad(l), br=rad(b),cb=Math.cos(br), x=cb*Math.cos(lr),y=cb*Math.sin(lr),z=Math.sin(br);
 const ex=-.0548755604*x+.4941094279*y-.8676661490*z;
 const ey=-.8734370902*x-.4448296300*y-.1980763734*z;
 const ez=-.4838350155*x+.7469822445*y+.4559837762*z;
 return {ra:wrap(deg(Math.atan2(ey,ex))),dec:deg(Math.asin(clamp(ez,-1,1)))};
}

/** Precess J2000 equatorial coordinates to the mean equator/equinox of date. */
export function precessJ2000(ra, dec, centuries) {
 const r = rad(ra), d = rad(dec), t = centuries;
 const zeta = rad((2306.2181*t + .30188*t*t + .017998*t*t*t)/3600);
 const z = rad((2306.2181*t + 1.09468*t*t + .018203*t*t*t)/3600);
 const theta = rad((2004.3109*t - .42665*t*t - .041833*t*t*t)/3600);
 const A = Math.cos(d)*Math.sin(r + zeta);
 const B = Math.cos(theta)*Math.cos(d)*Math.cos(r + zeta) - Math.sin(theta)*Math.sin(d);
 const C = Math.sin(theta)*Math.cos(d)*Math.cos(r + zeta) + Math.cos(theta)*Math.sin(d);
 return {ra:wrap(deg(Math.atan2(A,B)+z)), dec:deg(Math.asin(clamp(C,-1,1)))};
}
