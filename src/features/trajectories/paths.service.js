/** Compute reusable celestial paths independently of canvas or DOM. */
import { state } from '../../core/store.js';
import { planetCoordinatesAt } from '../planets/planets.orbits.js';
import { observeBody } from '../solar-system/celestial.ephemeris.js';

const HOUR=3600000, DAY=24*HOUR;
const cached=new Map();

function memo(key,create){
 if(cached.has(key))return cached.get(key);
 const value=create();
 if(cached.size>=48)cached.delete(cached.keys().next().value);
 cached.set(key,value);
 return value;
}

export function clearPathCache(){cached.clear();}

/** Fixed local-sidereal view: apparent motion against the background stars. */
export function skyTrack(kind,id,date){
 const halfSpan=kind==='planet'?30:7;
 const stepMs=kind==='planet'?DAY/2:3*HOUR;
 const slot=Math.floor(date.getTime()/(6*HOUR));
 const location=kind==='body'?`${state.lat}/${state.lon}`:'';
 const key=`sky/${kind}/${id}/${slot}/${location}`;
 return memo(key,()=>{
  const center=slot*6*HOUR+3*HOUR;
  const points=[];
  const steps=Math.round(halfSpan*DAY/stepMs);
  for(let i=-steps;i<=steps;i++){
   const sampleDate=new Date(center+i*stepMs);
   const o=kind==='planet'?planetCoordinatesAt(id,sampleDate):observeBody(id,sampleDate);
   if(o)points.push({ra:o.ra,dec:o.dec,time:sampleDate.getTime(),delta:i/steps*halfSpan});
  }
  return {points, center:Math.floor(points.length/2), spanDays:halfSpan};
 });
}

/** Actual local horizontal daily arc, including points below the horizon. */
export function dailyTrack(id,date){
 const start=new Date(date.getFullYear(),date.getMonth(),date.getDate());
 const end=new Date(date.getFullYear(),date.getMonth(),date.getDate()+1);
 const key=`day/${id}/${start.getTime()}/${state.lat}/${state.lon}`;
 return memo(key,()=>{
  const points=[];
  const step=15*60000;
  for(let t=start.getTime();t<end.getTime();t+=step){
   const o=observeBody(id,new Date(t));
   points.push({az:o.az,alt:o.alt,time:t});
  }
  const o=observeBody(id,end);
  points.push({az:o.az,alt:o.alt,time:end.getTime()});
  return {points,start:start.getTime(),end:end.getTime()};
 });
}
