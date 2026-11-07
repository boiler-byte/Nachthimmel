import { emit } from '../../core/events.js';
/** Nachthimmel v2 - features/aircraft/airlabs.service.js. Extracted from the original v6 app. */
import { aircraftAtLiveTime } from '../../core/clock.js';
import { clamp, wrap } from '../../core/math.js';
import { state } from '../../core/store.js';

// AirLabs allows browser-side CORS requests; a user-supplied key is required.
// No proxy, server-side bridge or embedded shared credential is used.
export const AIRCRAFT_POLL_MS=10*60*1000;

export let airlabsKey='';

try{airlabsKey=sessionStorage.getItem('nachthimmel_airlabs_key')||'';}catch{}

export function aircraftBoundingBox(){
 const d=2.35;
 return [clamp(state.lat-d,-90,90),clamp(state.lon-d,-180,180),clamp(state.lat+d,-90,90),clamp(state.lon+d,-180,180)].map(x=>x.toFixed(4)).join(',');
}

export function parseAircraftStates(data){
 if(!data||!Array.isArray(data.response))throw Error('Ungültige AirLabs-Antwort');
 const result=new Map(),now=Date.now();
 for(const v of data.response){
  if(!v || typeof v!=='object')continue;
  const id=String(v.hex||'').trim().toLowerCase();
  const lat=Number(v.lat),lon=Number(v.lng),altitude=Number(v.alt);
  const positionTime=Number.isFinite(Number(v.updated))&&Number(v.updated)>0?Number(v.updated)*1000:now;
  if(!/^[0-9a-f]{6}$/.test(id)||!Number.isFinite(lat)||!Number.isFinite(lon)||!Number.isFinite(altitude)||
   Math.abs(lat)>90||Math.abs(lon)>180||altitude<-500||altitude>22000||now-positionTime>175000||v.status==='landed')continue;
  result.set(id,{id,callsign:String(v.flight_icao||v.flight_iata||v.flight_number||'').trim().slice(0,16),
   country:String(v.flag||'').slice(0,65),lat,lon,altitude,positionTime,
   speed:Number.isFinite(Number(v.speed))?Number(v.speed)/3.6:null,
   track:Number.isFinite(Number(v.dir))?wrap(Number(v.dir)):null,
   verticalRate:Number.isFinite(Number(v.v_speed))?Number(v.v_speed):null,
   squawk:String(v.squawk||'').slice(0,5),source:null});
 }
 return result;
}

export async function pollAircraft(){
 if(!state.layers.aircraft||!aircraftAtLiveTime()||document.hidden||state.aircraftLoading||Date.now()<state.aircraftNextAt)return;
 if(!airlabsKey){
  state.aircraftError=true;state.aircraftErrorReason='AirLabs-Key in Einstellungen eingeben';
  emit('data:changed');return;
 }
 state.aircraftLoading=true;state.aircraftError=false;state.aircraftErrorReason='';emit('data:changed');
 const seq=++state.aircraftRequestVersion;
 const controller=new AbortController();state.aircraftAbort=controller;
 const timer=setTimeout(()=>controller.abort(),16000);
 try{
  const params=new URLSearchParams({api_key:airlabsKey,bbox:aircraftBoundingBox(),
   _fields:'hex,flight_icao,flight_iata,flight_number,flag,lat,lng,alt,dir,speed,v_speed,squawk,updated,status'});
  const response=await fetch('https://airlabs.co/api/v9/flights?'+params,{signal:controller.signal,cache:'no-store'});
  if(!response.ok)throw Error('AirLabs HTTP '+response.status);
  const data=await response.json();if(seq!==state.aircraftRequestVersion)return;
  if(data.error)throw Error('AirLabs: '+String(data.error.message||data.error.code||'API-Fehler').slice(0,120));
  const aircraft=parseAircraftStates(data);
  state.aircraft=[...aircraft.values()];state.aircraftDataTime=Date.now();
  state.aircraftFetchedAt=Date.now();state.aircraftLoaded=true;state.aircraftError=false;state.aircraftErrorReason='';
  state.aircraftNextAt=Date.now()+AIRCRAFT_POLL_MS;
  if(state.selected?.kind==='aircraft'){
   const updated=aircraft.get(state.selected.item.id);
   if(updated){state.selected.item=updated;emit('detail:refresh');}
  }
  emit('data:changed');
 }catch(err){
  if(seq!==state.aircraftRequestVersion)return;
  state.aircraftError=true;
  state.aircraftErrorReason=String(err.message||'AirLabs nicht erreichbar').slice(0,90);
  state.aircraftNextAt=Date.now()+AIRCRAFT_POLL_MS;
  if(!state.aircraftFetchedAt)emit('toast',{message:'Flugzeug-Layer: '+state.aircraftErrorReason,warn:true});
 }finally{
  clearTimeout(timer);
  if(seq===state.aircraftRequestVersion){state.aircraftLoading=false;state.aircraftAbort=null;emit('data:changed');}
 }
}
/** Keep the user-supplied API key private to this session. */
export function getAirLabsKey() { return airlabsKey; }
export function setAirLabsKey(key) { airlabsKey = String(key || '').trim(); }

