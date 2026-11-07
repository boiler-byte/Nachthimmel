import { emit } from '../../core/events.js';
/** Nachthimmel v2 - features/satellites/catalog.service.js. Extracted from the original v6 app. */
import { state } from '../../core/store.js';

export let satlib = null;

export async function loadSatelliteCatalog(){
 if(!satlib){state.satError=true;emit('data:changed');return;}
 const groups=['STATIONS','VISUAL'];
 const tasks=groups.map(async(group)=>{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),16000);
  try{
   const url=`https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=JSON`;
   const resp=await fetch(url,{signal:controller.signal,cache:'default'});
   if(!resp.ok)throw Error(group+': HTTP '+resp.status);
   const data=await resp.json();
   if(!Array.isArray(data))throw Error(group+': invalid JSON');
   return data;
  }finally{clearTimeout(timer);}
 });
 const results=await Promise.allSettled(tasks);
 const all=results.flatMap(r=>r.status==='fulfilled'?r.value:[]);
 const records=new Map();
 for(const omm of all){
  try{
   const id=String(omm.NORAD_CAT_ID||'');if(!id || records.has(id))continue;
   const rec=satlib.json2satrec(omm);
   if(!rec || rec.error)continue;
   records.set(id,{id,name:String(omm.OBJECT_NAME||'SAT '+id).trim(),omm,rec});
  }catch{ /* one malformed object must not affect the entire feed */ }
 }
 if(records.size){
  state.satellites=[...records.values()];state.satLoaded=true;state.satError=false;
  emit('data:changed');
  emit('toast',{message:`${state.satellites.length} CelesTrak-Satelliten geladen. Ihre Positionen werden live berechnet.`});
 }else{
  state.satError=true;emit('data:changed');
  emit('toast',{message:'CelesTrak derzeit nicht erreichbar. Die Satellitenebene zeigt keine erfundenen Positionen.',warn:true});
 }
}
/** Registers the SGP4 implementation after the CDN module has loaded. */
export function setSatelliteLibrary(lib) { satlib = lib; }

