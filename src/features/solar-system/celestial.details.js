import { formatNumber, niceAngle } from '../../core/dom.js';

export function bodyMetrics(o) {
 if(!o)return [];
 const common=[
  ['Sichtbarkeit',o.alt>=0?'Über Horizont':'Unter Horizont','visibility'],
  ['Horizonthöhe',niceAngle(o.alt),'alt'],
  ['Azimut',niceAngle(o.az),'az'],
  ['Rektaszension',formatNumber(o.ra/15,2)+' h','ra'],
  ['Deklination',niceAngle(o.dec),'dec'],
  ['Entfernung',formatNumber(o.distKm,0)+' km','distance'],
  ['Winkeldurchmesser',formatNumber(o.angularArcmin,1)+'′','angular']
 ];
 return o.id==='moon' ? [
  ['Mondphase',o.phaseName,'phase'],
  ['Beleuchteter Anteil',formatNumber(o.illum*100,1)+' %','illum'],
  ['Sonnenabstand am Himmel',niceAngle(o.elongation),'elongation'],
  ...common
 ] : common;
}

export function bodySketch(o){
 const moon=o.id==='moon';
 const sphere=moon?'#d7e5f5':'#f7d082';
 const shadow=moon?'#36475f':'#f3a55e';
 // A dark lunar disc with an illuminated crescent/gibbous shape.
 // Opposite directions are used for waxing vs waning, as viewed from north.
 const f=moon?Math.max(0,Math.min(1,o.illum)):1;
 const rightLit=moon&&o.waxing;
 const outerSweep=rightLit?1:0;
 const terminalSweep=rightLit?(f<.5?0:1):(f<.5?1:0);
 const rx=62*Math.abs(1-2*f);
 const returnEdge=rx<.2?'L 220 29':`A ${rx.toFixed(2)} 62 0 0 ${terminalSweep} 220 29`;
 const phase=moon?`<circle cx="220" cy="91" r="62" fill="#39495d"/><path d="M 220 29 A 62 62 0 0 ${outerSweep} 220 153 ${returnEdge} Z" fill="#e3f0ff" opacity=".97"/>`:'';
 return `<div class="detail-image no-image" style="background:radial-gradient(ellipse at center,${moon?'#223652':'#513e2d'},#081326 75%)"><svg viewBox="0 0 440 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${moon?'Schematische Mondphase':'Stilisierte Sonne'}" style="width:100%;height:100%;opacity:1"><defs><radialGradient id="celestialSphere" cx="34%" cy="28%" r="80%"><stop offset="0" stop-color="#fff7e2"/><stop offset=".45" stop-color="${sphere}"/><stop offset="1" stop-color="${shadow}"/></radialGradient></defs><circle cx="220" cy="90" r="79" fill="${sphere}" opacity=".1"/><circle cx="220" cy="91" r="62" fill="url(#celestialSphere)"/>${phase}</svg><span class="detail-photo-credit">${moon?'MONDPHASE / SCHEMATISCH':'SONNEN-ILLUSTRATION / NICHT MASSSTABSGETREU'}</span></div>`;
}
