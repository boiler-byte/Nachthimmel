/** Nachthimmel v2 - services/catalog-api.js. Extracted from the original v6 app. */


export async function fetchCatalogFile(filename){
 const bases=['https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial@master/data/','https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/'];
 let lastErr;
 for(const base of bases){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),13500);
  try{
   const resp=await fetch(base+filename,{signal:controller.signal,cache:'force-cache'});
   if(!resp.ok)throw Error('HTTP '+resp.status);
   return await resp.json();
  }catch(err){lastErr=err;}
  finally{clearTimeout(timer);}
 }
 throw lastErr||Error('catalog download failed');
}
