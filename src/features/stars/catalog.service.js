import { emit } from '../../core/events.js';
/** Nachthimmel v2 - features/stars/catalog.service.js. Extracted from the original v6 app. */
import { wrap } from '../../core/math.js';
import { state } from '../../core/store.js';
import { fetchCatalogFile } from '../../services/catalog-api.js';

export async function loadStarCatalog(){
 try{
  const [stars,names] = await Promise.all([fetchCatalogFile('stars.6.json'),fetchCatalogFile('starnames.json')]);
  state.names=names||{};
  const valid=(stars?.features||[]).map(f=>{
   const coords=f.geometry?.coordinates||[];
   const name=state.names[String(f.id)]?.name || '';
   return {id:f.id,name,ra:wrap(Number(coords[0])),dec:Number(coords[1]),mag:Number(f.properties?.mag),bv:Number(f.properties?.bv||0)};
  }).filter(s=>Number.isFinite(s.ra)&&Number.isFinite(s.dec)&&Number.isFinite(s.mag));
  if(valid.length<1000)throw Error('too few stars');
  state.stars=valid;state.starsLoaded=true;
  emit('data:changed');
 }catch(err){state.catalogError=true;emit('data:changed');emit('toast',{message:'Sternkatalog offline: eingebettete helle Sterne bleiben sichtbar.',warn:true});}
}
