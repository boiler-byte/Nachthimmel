import { emit } from '../../core/events.js';
/** Nachthimmel v2 - features/deep-sky/images.service.js. Extracted from the original v6 app. */
import { validURL } from '../../core/dom.js';
import { clamp } from '../../core/math.js';
import { state } from '../../core/store.js';

export const imageCache = new Map();

export const nasaQueue = [];

export const nasaQueued = new Set();

export let nasaActive = 0;

export function dssPreview(d) {
 const fov=clamp(d.extent*2.2,.7,5.0);
 const params = new URLSearchParams({hips:'CDS/P/DSS2/color',width:'340',height:'340',projection:'TAN',fov:String(fov),ra:String(d.ra),dec:String(d.dec),coordsys:'icrs',format:'jpg'});
 return 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?'+params;
}

export function useDsoImage(d,url,source,metadata=null) {
 const safe=validURL(url);if(!safe)return;
 const img = new Image();
 img.onload=()=>{
  const entry=imageCache.get(d.id)||{};
  if(source==='CDS' && entry.source==='NASA')return;
  imageCache.set(d.id,{...entry,img,src:safe,source,metadata});
  if(state.selected?.kind==='dso' && state.selected.item.id===d.id) emit('detail:refresh');
 };
 img.onerror=()=>{
  const entry=imageCache.get(d.id)||{};
  if(source==='NASA' && !entry.img)useDsoImage(d,dssPreview(d),'CDS');
 };
 img.src=safe;
}

export function ensureDsoImage(d) {
 if(!imageCache.has(d.id)) {
  imageCache.set(d.id,{requested:true,source:'none'});
  useDsoImage(d,dssPreview(d),'CDS');
 }
 if(!nasaQueued.has(d.id)) {
  nasaQueued.add(d.id);nasaQueue.push(d);processNasaQueue();
 }
}

export async function processNasaQueue() {
 while(nasaActive<2 && nasaQueue.length){
  const d=nasaQueue.shift();nasaActive++;
  (async()=>{
   try{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
    let response;
    try{
     response=await fetch('https://images-api.nasa.gov/search?'+new URLSearchParams({q:d.query,media_type:'image',page_size:'10'}),{signal:controller.signal});
    }finally{clearTimeout(timer);}
    if(!response.ok)throw Error('NASA HTTP '+response.status);
    const data=await response.json();
    const items=(data?.collection?.items||[]).filter(v=>v?.data?.[0] && v.links?.some(l=>l.href));
    const words=[d.id.toLowerCase(),d.name.toLowerCase().split(' ')[0],d.query.toLowerCase().split(' ')[0]];
    items.sort((a,b)=>{
     const score=(item)=>words.reduce((n,w)=>n+(w.length>=2 && String(item.data[0].title||'').toLowerCase().includes(w)?2:0),0);
     return score(b)-score(a);
    });
    const item=items[0];
    if(item){
     const link=item.links.find(l=>l.rel==='preview')||item.links[0];
     if(link?.href)useDsoImage(d,link.href,'NASA',item.data[0]);
    }
   }catch(err){ /* The CDS image remains available when NASA cannot respond. */ }
   finally{nasaActive--;processNasaQueue();}
  })();
 }
}
