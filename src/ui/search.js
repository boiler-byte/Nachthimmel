/** Nachthimmel v2 - ui/search.js. Extracted from the original v6 app. */
import { aircraftAtLiveTime } from '../core/clock.js';
import { $, escapeHTML, formatNumber, ico } from '../core/dom.js';
import { state } from '../core/store.js';
import { predictAircraft } from '../features/aircraft/aircraft.positions.js';
import { DEEP } from '../features/deep-sky/catalog.data.js';
import { PLANETS } from '../features/planets/planets.data.js';
import { BODIES, observeBody } from '../features/solar-system/celestial.ephemeris.js';
import { observePlanet } from '../features/planets/planets.orbits.js';
import { updateSelection } from './dialogs.js';
import { setLayer } from './layers.js';
import { focusObject } from './selection.js';

export function searchItems(q){
 const query=q.trim().toLocaleLowerCase('de-DE');
 const match=(...words)=>!query||words.some(w=>String(w||'').toLocaleLowerCase('de-DE').includes(query));
 const list=[
  {section:'SONNE & MOND',kind:'body',items:BODIES.filter(b=>match(b.name,b.id,b.type)),sub:b=>{const h=observeBody(b.id);return b.type+' · '+(h?.alt>=0?'über Horizont':'unter Horizont');},name:b=>b.name},
  {section:'PLANETEN',kind:'planet',items:PLANETS.filter(p=>match(p.name,p.en,p.type)),sub:p=>{const h=observePlanet(p.id);return p.type+' · '+(h?.alt>=0?'über Horizont':'unter Horizont');},name:p=>p.name},
  {section:'STERNBILDER',kind:'constellation',items:state.constellations.filter(c=>match(c.de,c.name,c.id)),sub:c=>(c.name||c.id)+' \u00b7 IAU',name:c=>c.de||c.name},
  {section:'DEEP SKY',kind:'dso',items:DEEP.filter(d=>match(d.name,d.id,d.type)),sub:d=>d.id+' \u00b7 '+d.type,name:d=>d.name},
  {section:'SATELLITEN',kind:'satellite',items:state.satellites.filter(s=>match(s.name,s.id)),sub:s=>'NORAD '+s.id,name:s=>s.name},
  {section:'FLUGZEUGE / ADSB.LOL',kind:'aircraft',items:state.aircraft.filter(a=>aircraftAtLiveTime() && predictAircraft(a)?.alt>0 && match(a.callsign,a.id,a.registration,a.type)),sub:a=>a.id.toUpperCase()+(a.registration?' · '+a.registration:''),name:a=>a.callsign||a.id.toUpperCase()},
  {section:'HELLE STERNE',kind:'star',items:state.stars.filter(s=>s.name&&match(s.name)).slice(0,15),sub:s=>formatNumber(s.mag,2)+' mag',name:s=>s.name}
 ];
 return list;
}

export function updateSearchResults(){
 const query=$('searchInput').value;
 const lists=searchItems(query);
 const results=lists.map(group=>{
  const max=!query ? (group.kind==='body'?2:group.kind==='planet'?7:group.kind==='constellation'?7:group.kind==='dso'?6:group.kind==='satellite'?4:3):12;
  const items=group.items.slice(0,max);
  if(!items.length)return '';
  const icon=group.kind==='body'?'sun':group.kind==='planet'?'planet':group.kind==='constellation'?'const':group.kind==='dso'?'nebula':group.kind==='satellite'?'satellite':group.kind==='aircraft'?'aircraft':'stars';
  const rows=items.map(it=>{const rowIcon=group.kind==='body'?it.id:icon;return `<button class="result-row" data-kind="${group.kind}" data-id="${escapeHTML(group.kind==='satellite'||group.kind==='aircraft'?it.id:group.kind==='star'?(it.id||it.name):it.id)}"><span class="result-symbol">${ico(rowIcon)}</span><span class="result-text"><div class="result-title">${escapeHTML(group.name(it))}</div><div class="result-meta">${escapeHTML(group.sub(it))}</div></span><svg class="arrow" aria-hidden="true"><use href="#i-chevron"></use></svg></button>`;}).join('');
  return `<div class="result-group">${group.section}</div>${rows}`;
 }).join('');
 $('searchResults').innerHTML=results||'<div class="empty-results">Keine Objekte gefunden. Versuche einen anderen Suchbegriff.</div>';
 for(const btn of $('searchResults').querySelectorAll('[data-kind]')){
  btn.onclick=()=>{
   const kind=btn.dataset.kind,id=btn.dataset.id;
   const item=kind==='body'?BODIES.find(v=>v.id===id):kind==='planet'?PLANETS.find(v=>v.id===id):kind==='constellation'?state.constellations.find(v=>v.id===id):kind==='dso'?DEEP.find(v=>v.id===id):kind==='satellite'?state.satellites.find(v=>v.id===id):kind==='aircraft'?state.aircraft.find(v=>v.id===id):state.stars.find(v=>String(v.id||v.name)===id);
   if(!item)return;
   const layer=({star:'stars',planet:'planets',body:'sunMoon',constellation:'constellations',dso:'deepSky',satellite:'satellites',aircraft:'aircraft'})[kind];
   if(layer && !state.layers[layer])setLayer(layer,true);
   updateSelection(kind,item);focusObject(kind,item);
  };
 }
}
