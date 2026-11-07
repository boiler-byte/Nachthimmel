/** Nachthimmel v2 - ui/details.js. Extracted from the original v6 app. */
import { getDate } from '../core/clock.js';
import { $, escapeHTML, formatNumber, ico, niceAngle, validURL } from '../core/dom.js';
import { state } from '../core/store.js';
import { CONST_EXTRA } from '../features/constellations/catalog.data.js';
import { dssPreview, ensureDsoImage, imageCache } from '../features/deep-sky/images.service.js';
import { planetMetrics, planetSketch } from '../features/planets/planets.details.js';
import { observePlanet } from '../features/planets/planets.orbits.js';
import { observeBody } from '../features/solar-system/celestial.ephemeris.js';
import { bodyMetrics, bodySketch } from '../features/solar-system/celestial.details.js';
import { setLayer } from './layers.js';
import { directionName } from './compass.js';
import { updateSelection } from './dialogs.js';
import { focusObject, objectHorizontal } from './selection.js';

export function metricsHTML(entries,prefix='planet') {
 return `<div class="detail-grid">${entries.map(([label,val,key])=>`<div class="detail-metric"><label>${escapeHTML(label)}</label><strong${key ? ` data-${prefix}-field="${escapeHTML(key)}"` : ''}>${escapeHTML(val)}</strong></div>`).join('')}</div>`;
}

export function constellationSketch(con) {
 const pts=con.segments.flat();
 if(!pts.length)return `<div class="detail-image no-image">${ico('const')}</div>`;
 let minX=Math.min(...pts.map(p=>p[0])),maxX=Math.max(...pts.map(p=>p[0]));
 let minY=Math.min(...pts.map(p=>p[1])),maxY=Math.max(...pts.map(p=>p[1]));
 // Handle RA wrap across zero for constellations near the prime meridian.
 let ra0=con.ra;const transformRA=(v)=>((v-ra0+540)%360)-180;
 minX=Math.min(...pts.map(p=>transformRA(p[0])));maxX=Math.max(...pts.map(p=>transformRA(p[0])));
 const w=Math.max(1,maxX-minX),h=Math.max(1,maxY-minY);
 const scale=Math.min(288/w,112/h);
 const ox=200-(minX+maxX)/2*scale,oy=90+(minY+maxY)/2*scale;
 const xp=p=>ox+transformRA(p[0])*scale,yp=p=>oy-p[1]*scale;
 const paths=con.segments.map(seg=>seg.map((p,i)=>(i===0?'M ':'L ')+xp(p).toFixed(1)+' '+yp(p).toFixed(1)).join(' ')).map(path=>`<path d="${path}" fill="none" stroke="#8bc9fa" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" opacity=".78"/>`).join('');
 const stars=pts.map(p=>`<circle cx="${xp(p).toFixed(1)}" cy="${yp(p).toFixed(1)}" r="3" fill="#d6eaff"/><circle cx="${xp(p).toFixed(1)}" cy="${yp(p).toFixed(1)}" r="7" fill="#84bafa" opacity=".16"/>`).join('');
 return `<div class="detail-image no-image" style="background:radial-gradient(ellipse at center,#17304c,#09142a 70%)"><svg viewBox="0 0 400 180" style="height:100%;width:100%" role="img" aria-label="Linienfigur ${escapeHTML(con.de)}">${paths}${stars}</svg><span class="detail-photo-credit">IAU / STERNSKIZZE</span></div>`;
}

export function satelliteSketch() {
 return `<div class="detail-image no-image"><svg viewBox="0 0 400 180" style="width:100%;height:100%;opacity:1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="earthgrad"><stop stop-color="#467fa8"/><stop offset=".65" stop-color="#153454"/><stop offset="1" stop-color="#0c172b"/></radialGradient></defs><circle cx="200" cy="98" r="57" fill="url(#earthgrad)" stroke="#578baf" stroke-width=".6"/><ellipse cx="200" cy="99" rx="154" ry="55" transform="rotate(-19 200 99)" stroke="#74c8ff" stroke-width="1.7" fill="none" opacity=".52" stroke-dasharray="5 7"/><ellipse cx="200" cy="99" rx="154" ry="55" transform="rotate(35 200 99)" stroke="#508db5" stroke-width="1" fill="none" opacity=".3"/><path d="M175 68 203 83 191 111 220 126" fill="none" stroke="#7eb5d4" stroke-width="1.2" opacity=".35"/><g transform="translate(328 58) rotate(-32)"><rect x="-7" y="-7" width="14" height="14" fill="#bbecff"/><rect x="-24" y="-9" width="13" height="18" fill="#3f9dc8" stroke="#8ddaff"/><rect x="11" y="-9" width="13" height="18" fill="#3f9dc8" stroke="#8ddaff"/></g><circle cx="328" cy="58" r="23" fill="none" stroke="#8bddff" stroke-width=".7" opacity=".36"/></svg><span class="detail-photo-credit">SGP4 / ORBITMODELL</span></div>`;
}

export function renderDetail(){
 const panel=$('detailPanel'),selection=state.selected;
 if(!selection){panel.classList.remove('visible');panel.setAttribute('aria-hidden','true');panel.innerHTML='';return;}
 const {kind,item}=selection;
 const h=objectHorizontal(kind,item);
 let display='',top='',image='',subtitle='',about='',footer='',metrics=[],links='';
 const close=`<button class="details-close" id="detailClose" aria-label="Details schliessen">${ico('close')}</button>`;
 if(kind==='planet'){
  const o=observePlanet(item.id);
  top='PLANET / JPL-BAHNBERECHNUNG';display=item.name;subtitle=item.type+' · Sonnensystem';
  image=planetSketch(item);
  about=item.about;
  metrics=planetMetrics(o);
  footer='Positionen: NASA/JPL-Keplerelemente (gültig 1800–2050), geozentrisch angenähert, keine atmosphärische Refraktion. Angezeigter Zeitpunkt: <span data-planet-time>'+escapeHTML(getDate().toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'}))+'</span>. Unter dem Horizont nur virtuelle Ansicht. Planeten-Symbole sind nicht maßstabsgetreu; die Sichtbarkeit hängt auch von Sonnenlicht und Wetter ab.';
  links=`<a class="secondary-btn" href="https://ssd.jpl.nasa.gov/planets/approx_pos.html" target="_blank" rel="noopener noreferrer">JPL-Bahndaten ${ico('chevron')}</a>`;
 }else if(kind==='body'){
  const o=observeBody(item.id,getDate());
  top=item.id==='sun'?'SONNE / LOKALE EPHEMERIDE':'MOND / LOKALE EPHEMERIDE';
  display=item.name;subtitle=item.id==='sun'?'Stern unseres Sonnensystems':'Erdmond · Mondphasen';
  image=bodySketch(o);
  about=item.id==='sun'
   ?'Die Sonnenposition ergibt sich näherungsweise aus den JPL-Erdbahnelementen. Der Tagesbogen zeigt, wie sich die Sonne durch die Erdrotation über den lokalen Horizont bewegt.'
   :'Die Mondposition und Mondphase werden lokal aus einer vereinfachten Mondtheorie berechnet. Die Darstellung berücksichtigt den Blickwinkel des Beobachters (Parallaxe).';
  metrics=bodyMetrics(o);
  footer=(item.id==='sun'?'JPL-Näherungsbahnen der Erde (1800–2050). ':'Vereinfachte Mondbahn einschließlich Hauptstörungen und Parallaxe. ')
   +'Positionen sind Näherungen und nicht für präzise Teleskopausrichtung geeignet. Berechnungszeit: <span data-body-time>'
   +escapeHTML(getDate().toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'}))+'</span>.';
  links=`<a class="secondary-btn" href="https://ssd.jpl.nasa.gov/planets/approx_pos.html" target="_blank" rel="noopener noreferrer">Bahndaten ${ico('chevron')}</a>`;
 }else if(kind==='constellation'){
  const extra=CONST_EXTRA[item.id]||{};
  top='STERNBILD / IAU';display=item.de||item.name||item.id;
  subtitle=`${item.name} \u00b7 ${item.id}`;
  image=constellationSketch(item);
  about=extra.about||`Das Sternbild ${display} geh\u00f6rt zu den 88 offiziell anerkannten IAU-Sternbildern. Die Linien verbinden ausgew\u00e4hlte Sterne; sie stellen keine physisch verbundenen Sterngruppen dar.`;
  metrics=[['Sichtbarkeit',h?.alt>0?'\u00dcber Horizont':'Unter Horizont'],['H\u00f6he',h?niceAngle(h.alt):'--'],['Himmelsrichtung',h?directionName(h.az):'--'],['Markanter Stern',extra.star||'Mehrere Sterne']];
  footer=`Sternbild-Koordinaten: IAU / d3-celestial (J2000). ${extra.season?'Beste Jahreszeit: '+extra.season+'. ':''}`;
  links=`<a class="secondary-btn" target="_blank" rel="noopener noreferrer" href="https://www.iau.org/public/themes/constellations/">IAU-Info ${ico('chevron')}</a>`;
 }else if(kind==='dso'){
  top='DEEP SKY / '+item.type.toUpperCase();display=item.name;subtitle=item.id+' \u00b7 NASA / CDS';
  const cache=imageCache.get(item.id);
  const url=validURL(cache?.src)||dssPreview(item);
  image=`<div class="detail-image"><img src="${escapeHTML(url)}" alt="Astronomische Aufnahme von ${escapeHTML(item.name)}" loading="lazy"><span class="detail-photo-credit">${cache?.source==='NASA'?'NASA IMAGE LIBRARY':'CDS / DSS HIMMELSAUSSCHNITT'}</span></div>`;
  about=item.about;
  metrics=[['Objekttyp',item.type],['Entfernung',item.dist],['H\u00f6he',h?niceAngle(h.alt):'--'],['Rektaszension',formatNumber(item.ra/15,2)+' h']];
  footer='Die Vorschau markiert den korrekten Himmelsort, ist jedoch nicht im Kartenma\u00dfstab und nicht astrometrisch orientiert.';
  const nasaID=cache?.source==='NASA'&&cache?.metadata?.nasa_id;
  const href=nasaID?'https://images.nasa.gov/details/'+encodeURIComponent(nasaID):'https://images.nasa.gov/search?q='+encodeURIComponent(item.query);
  links=`<a class="secondary-btn" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">NASA-Quelle ${ico('chevron')}</a>`;
  ensureDsoImage(item);
 }else if(kind==='satellite'){
  top='ERDSATELLIT / ORBITALDATEN';display=item.name;subtitle='NORAD '+item.id+' \u00b7 '+(item.omm.OBJECT_ID||'Orbitobjekt');
  image=satelliteSketch();
  const pos=h;
  const age=(getDate().getTime()-new Date(item.omm.EPOCH).getTime())/86400000;
  about=`Die Position wird mit SGP4 aus aktuellen CelesTrak-OMM-Orbitdaten berechnet. ${pos?.alt>0?'Dieses Objekt steht derzeit rechnerisch \u00fcber deinem Horizont.':'Dieses Objekt befindet sich zum gew\u00e4hlten Zeitpunkt unter deinem Horizont.'} Die optische Sichtbarkeit h\u00e4ngt unter anderem von Sonnenlicht und Wetter ab.`;
  metrics=[['Horizonth\u00f6he',pos?niceAngle(pos.alt):'--'],['Bahnh\u00f6he',pos?formatNumber(pos.altitude,0)+' km':'--'],['Geschwindigkeit',pos?formatNumber(pos.speed,2)+' km/s':'--'],['Inklination',Number.isFinite(+item.omm.INCLINATION)?formatNumber(+item.omm.INCLINATION,1)+'\u00b0':'--'],['Azimut',pos?niceAngle(pos.az):'--'],['Bahndatenalter',Number.isFinite(age)?formatNumber(age,1)+' Tage':'--']];
  footer=`Berechnete Satellitenposition (SGP4). Datenstand / Epoche: ${escapeHTML(String(item.omm.EPOCH||'unbekannt'))}. Keine Garantie f\u00fcr optische Sichtbarkeit.`;
  links=`<a class="secondary-btn" href="https://celestrak.org/NORAD/elements/gp.php?CATNR=${encodeURIComponent(item.id)}&amp;FORMAT=JSON" target="_blank" rel="noopener noreferrer">CelesTrak-Daten ${ico('chevron')}</a>`;
 }else if(kind==='aircraft'){
  top='FLUGZEUG / AIRLABS LIVE';
  display=item.callsign||item.id.toUpperCase();
  subtitle='ICAO24 '+item.id.toUpperCase()+' · '+(item.country||'Herkunft unbekannt');
  image=`<div class="detail-image no-image" style="background:radial-gradient(ellipse at center,#383329,#151c2c 70%)"><svg viewBox="0 0 200 140" aria-hidden="true" style="height:100%;width:100%;color:#ffdb9f"><g transform="translate(100 70) scale(3.8)"><path d="M0 -11 2 -3 10 1.8 10 4 2.1 2.8 1.8 8.1 4.8 10 4.8 11.5 0 10.5 -4.8 11.5 -4.8 10 -1.8 8.1 -2.1 2.8 -10 4 -10 1.8 -2 -3Z" fill="currentColor" stroke="#fff1d7" stroke-width=".5"/></g></svg><span class="detail-photo-credit">AIRLABS / ADS-B</span></div>`;
  const pos=h,latest=item.positionTime||state.aircraftDataTime||state.aircraftFetchedAt;
  const age=Math.max(0,Math.round((Date.now()-latest)/1000));
  about='Aktuelle Flugzeugposition aus AirLabs. Die Darstellung berechnet den lokalen Sichtwinkel aus geografischer Position und Höhe. Zwischen Messpunkten erfolgt eine begrenzte Kursfortschreibung (maximal 90 Sekunden). Flugroute und Ziel sind nicht Teil dieser Live-Daten.';
  metrics=[['Sichtwinkel',pos?niceAngle(pos.alt):'--'],
   ['Entfernung',pos?formatNumber(pos.range,1)+' km':'--'],
   ['Höhe (Geo/Baro)',pos?formatNumber(pos.altitude,0)+' m':'--'],
   ['Geschwindigkeit',Number.isFinite(item.speed)?formatNumber(item.speed*3.6,0)+' km/h':'--'],
   ['Kurs',Number.isFinite(item.track)?niceAngle(item.track):'--'],
   ['Azimut',pos?niceAngle(pos.az):'--'],
   ['Letzte Position',formatNumber(age,0)+' s zuvor'],
   ['Transpondercode',item.squawk||'--']];
  footer=`AirLabs-Messzeit: ${latest?new Date(latest).toLocaleTimeString('de-DE'):'unbekannt'}; keine historische Rückrechnung bei Nutzung der Zeitleiste. Nicht für Navigation oder Flugsicherung geeignet.`;
  links=`<a class="secondary-btn" href="https://airlabs.co/" target="_blank" rel="noopener noreferrer">AirLabs ${ico('chevron')}</a>`;
 }else if(kind==='star'){
  top='STERN / HELLIGKEIT';display=item.name||('HIP '+item.id);subtitle='Stellarer Katalog / J2000';
  image=`<div class="detail-image no-image" style="background:radial-gradient(ellipse at center,rgba(79,127,188,.24),#091427 68%)"><svg viewBox="0 0 200 140" style="height:100%;width:100%"><defs><radialGradient id="starg"><stop stop-color="#fff"/><stop offset=".15" stop-color="#d8efff"/><stop offset=".35" stop-color="#6eabdc" stop-opacity=".47"/><stop offset="1" stop-color="#6eabdc" stop-opacity="0"/></radialGradient></defs><circle cx="100" cy="70" r="61" fill="url(#starg)"/><path d="M100 16v108M45 70h110" stroke="#b5dbfa" stroke-opacity=".22" stroke-width=".8"/></svg></div>`;
  about='Ein einzelner Stern aus dem astronomischen Katalog. Die scheinbare Helligkeit wird in Magnituden angegeben: kleinere Werte bedeuten hellere Sterne.';
  metrics=[['Scheinbare Helligkeit',formatNumber(item.mag,2)+' mag'],['Rektaszension',formatNumber(item.ra/15,2)+' h'],['Deklination',niceAngle(item.dec)],['Horizonth\u00f6he',h?niceAngle(h.alt):'--']];
  footer='Sternpositionen zur Epoche J2000, ohne Pr\u00e4zessionskorrektur f\u00fcr den aktuellen Zeitpunkt.';
 }
 const pathToggle=kind==='planet'||kind==='body' ? `<button class="secondary-btn" id="togglePathDetail" aria-pressed="${state.layers.selectedPath}">${ico('orbit')} ${state.layers.selectedPath?'Auswahlbahn ausblenden':'Auswahlbahn anzeigen'}</button>` : '';
 const body=`<div class="details-header"><div class="details-kicker"><span class="pulse-dot" style="height:5px;width:5px"></span>${escapeHTML(top)}</div>${close}</div>${image}<div class="detail-body"><h2>${escapeHTML(display)}</h2><div class="detail-sub">${escapeHTML(subtitle)}</div><p>${escapeHTML(about)}</p>${metricsHTML(metrics,kind==='body'?'body':'planet')}<div class="detail-actions"><button class="primary-btn" id="focusDetail">${ico('crosshair')} Auf Karte zeigen</button>${pathToggle}${links}</div><div class="detail-footer">${footer}</div></div>`;
 panel.innerHTML=body;panel.classList.add('visible');panel.setAttribute('aria-hidden','false');
 $('detailClose').onclick=()=>updateSelection(null,null);
 $('focusDetail').onclick=()=>focusObject(kind,item);
 if(pathToggle)$('togglePathDetail').onclick=()=>setLayer('selectedPath',!state.layers.selectedPath);
}

/** Update rapidly changing solar and lunar metrics without rebuilding the panel. */
export function refreshBodyDetails(){
 if(state.selected?.kind!=='body')return;
 const panel=$('detailPanel');if(!panel.classList.contains('visible'))return;
 const o=observeBody(state.selected.item.id,getDate());if(!o)return;
 for(const [label,value,key] of bodyMetrics(o)){
  if(!key)continue;
  const field=panel.querySelector(`[data-body-field="${key}"]`);
  if(field&&field.textContent!==value)field.textContent=value;
 }
 const stamp=panel.querySelector('[data-body-time]');
 if(stamp)stamp.textContent=getDate().toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'});
}

