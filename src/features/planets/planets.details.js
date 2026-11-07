/** Nachthimmel v2 - features/planets/planets.details.js. Extracted from the original v6 app. */
import { getDate } from '../../core/clock.js';
import { $, escapeHTML, formatNumber, niceAngle } from '../../core/dom.js';
import { state } from '../../core/store.js';
import { AU_KM } from './planets.data.js';
import { observePlanet } from './planets.orbits.js';

export function planetMetrics(p){
 if(!p)return [];
 const angleText=p.angularArcsec<1?formatNumber(p.angularArcsec,2):formatNumber(p.angularArcsec,1);
 return [
  ['Sichtbarkeit',p.alt>=0?'Über Horizont':'Unter Horizont','visibility'],
  ['Horizonthöhe',niceAngle(p.alt),'alt'],
  ['Azimut',niceAngle(p.az),'az'],
  ['Rektaszension',formatNumber(p.ra/15,2)+' h','ra'],
  ['Deklination',niceAngle(p.dec),'dec'],
  ['Entfernung zur Erde',formatNumber(p.dist,3)+' AE','dist'],
  ['Entfernung in km',formatNumber(p.dist*AU_KM/1e6,1)+' Mio. km','distKm'],
  ['Entfernung zur Sonne',formatNumber(p.sunDist,2)+' AE','sunDist'],
  ['Beleuchtete Scheibe',formatNumber(p.illum*100,0)+' %','phase'],
  ['Sonnenabstand am Himmel',niceAngle(p.elong),'elong'],
  ['Winkeldurchmesser',angleText+' ″','angular'],
  ['Lichtlaufzeit',formatNumber(p.lightMinutes,1)+' min','light'],
  ['Mittlerer Durchmesser',formatNumber(p.planet.radius*2,0)+' km'],
  ['Umlaufzeit um Sonne',formatNumber(p.planet.year,2)+' Jahre'],
  ['Eigendrehung',p.planet.rotation],
  ['Planetentyp',p.planet.type]
 ];
}

export function planetSketch(planet){
 const {color,light,dark,id,name}=planet;
 const saturn=id==='saturn';
 const backgroundRing=saturn?'<ellipse cx="220" cy="92" rx="119" ry="29" transform="rotate(-19 220 92)" fill="none" stroke="#dfc495" stroke-width="13" opacity=".46"/>':'';
 const frontRing=saturn?'<path d="M113 111 Q 214 148 327 70" fill="none" stroke="#ffe0a5" stroke-width="6" opacity=".68"/>':'';
 const stripes=id==='jupiter'?'<path d="M130 72Q220 85 310 69M128 90Q223 108 313 92M141 114Q221 126 297 111" stroke="#94634b" stroke-width="11" fill="none" opacity=".42"/>':'';
 const mars=id==='mars'?'<path d="M150 71Q171 46 201 64T249 90Q231 94 209 112T157 94Z" fill="#723b38" opacity=".38"/>':'';
 const clouds=id==='venus'||id==='uranus'||id==='neptune'?'<path d="M136 81Q216 64 305 82M139 103Q222 87 297 103" stroke="#fff" opacity=".16" stroke-width="8" fill="none"/>':'';
 const craters=id==='mercury'?'<circle cx="195" cy="63" r="15" fill="none" stroke="#454e5c" stroke-width="2.7" opacity=".55"/><circle cx="255" cy="102" r="9" fill="none" stroke="#454e5c" stroke-width="2.5" opacity=".45"/>':'';
 return `<div class="detail-image no-image" style="background:radial-gradient(ellipse at 55% 48%,#1c2d43,#081121 75%)"><svg viewBox="0 0 440 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stilisierte Illustration von ${escapeHTML(name)}" style="width:100%;height:100%;opacity:1"><defs><radialGradient id="planetSphere" cx="33%" cy="25%" r="78%"><stop offset="0" stop-color="${light}"/><stop offset=".49" stop-color="${color}"/><stop offset="1" stop-color="${dark}"/></radialGradient><clipPath id="planetClip"><circle cx="220" cy="90" r="72"/></clipPath></defs><circle cx="106" cy="28" r="1" fill="#b7ddff" opacity=".65"/><circle cx="357" cy="46" r="1.4" fill="#b7ddff" opacity=".35"/>${backgroundRing}<circle cx="220" cy="90" r="81" fill="${color}" opacity=".065"/><circle cx="220" cy="90" r="72" fill="url(#planetSphere)"/><g clip-path="url(#planetClip)">${stripes}${mars}${clouds}${craters}</g>${frontRing}</svg><span class="detail-photo-credit">PLANETEN-ILLUSTRATION / NICHT MAßSTABSGETREU</span></div>`;
}

export function refreshPlanetDetails(){
 if(state.selected?.kind!=='planet')return;
 const panel=$('detailPanel');if(!panel.classList.contains('visible'))return;
 const observation=observePlanet(state.selected.item.id);
 if(!observation)return;
 for(const [label,value,key] of planetMetrics(observation)){
  if(!key)continue;
  const field=panel.querySelector(`[data-planet-field="${key}"]`);
  if(field && field.textContent!==value)field.textContent=value;
 }
 const stamp=panel.querySelector('[data-planet-time]');
 if(stamp)stamp.textContent=getDate().toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'});
}
