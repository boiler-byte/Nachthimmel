import { emit } from '../../core/events.js';
/** Nachthimmel v2 - features/constellations/catalog.service.js. Extracted from the original v6 app. */
import { wrap } from '../../core/math.js';
import { state } from '../../core/store.js';
import { CONST_EXTRA } from './catalog.data.js';
import { fetchCatalogFile } from '../../services/catalog-api.js';

export async function loadConstellationCatalog(){
 try{
  const [locations,geometry]=await Promise.all([fetchCatalogFile('constellations.json'),fetchCatalogFile('constellations.lines.json')]);
  const segmentsById=new Map();
  for(const f of geometry?.features||[]){
   const parts=f.geometry?.coordinates||[];
   segmentsById.set(String(f.id),parts.map(line=>line.map(p=>[wrap(+p[0]),+p[1]]).filter(p=>p.every(Number.isFinite))).filter(line=>line.length>1));
  }
  const features=(locations?.features||[]).map(f=>{
   const p=f.geometry?.coordinates||[];const id=String(f.id||f.properties?.desig||'');
   return {id,name:f.properties?.name||id,de:f.properties?.de||CONST_EXTRA[id]?.de||f.properties?.name||id,ra:wrap(+p[0]),dec:+p[1],segments:segmentsById.get(id)||[]};
  }).filter(f=>Number.isFinite(f.ra)&&Number.isFinite(f.dec));
  if(features.length<80 || !segmentsById.size)throw Error('incomplete constellation data');
  state.constellations=features;state.constLoaded=true;
  emit('data:changed');
  if(state.selected?.kind==='constellation'){
   const updated=features.find(f=>f.id===state.selected.item.id);
   if(updated){state.selected.item=updated;emit('detail:refresh');}
  }
 }catch(err){state.catalogError=true;emit('data:changed');emit('toast',{message:'Sternbild-API offline: grundlegende Figuren stehen weiter bereit.',warn:true});}
}
