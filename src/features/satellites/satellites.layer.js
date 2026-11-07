/** Nachthimmel v2 - features/satellites/satellites.layer.js. Extracted from the original v6 app. */
import { rad } from '../../core/math.js';
import { state } from '../../core/store.js';
import { drawPolyline } from '../../engine/background.js';
import { ctx } from '../../engine/canvas.js';
import { H, W, hitTargets, projectHor } from '../../engine/projection.js';
import { satlib } from './catalog.service.js';
import { calculateSatPosition, computeSatellites } from './satellites.positions.js';

export function drawSelectedSatelliteOrbit(s,date) {
 if(!satlib||!s?.rec)return;
 const observer={latitude:rad(state.lat),longitude:rad(state.lon),height:.045};
 for(const [lo,hi,color] of [[-720,0,'rgba(86,196,244,.25)'],[0,900,'rgba(114,215,252,.66)']]){
  let points=[];
  for(let dt=lo;dt<=hi;dt+=35){
   const sample=calculateSatPosition(s,new Date(date.getTime()+dt*1000),observer);
   points.push(sample && sample.alt>0 ? projectHor(sample.az,sample.alt) : null);
  }
  ctx.save();ctx.setLineDash([5,5]);drawPolyline(points,color,1.55);ctx.restore();
 }
}

export function drawSatellites(date){
 if(!state.layers.satellites)return;
 const positions=computeSatellites(date);
 const chosen=state.selected?.kind==='satellite' ? state.selected.item.id : null;
 if(chosen){const item=state.satellites.find(s=>s.id===chosen);if(item)drawSelectedSatelliteOrbit(item,date);}
 const visible=positions.filter(s=>s.alt>0).sort((a,b)=>a.alt-b.alt);
 for(const sat of visible){
  const p=projectHor(sat.az,sat.alt);if(!p||p.x<10||p.x>W-10||p.y<52||p.y>H-95)continue;
  const selected=sat.record.id===chosen;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.4);
  ctx.shadowColor='#8addff';ctx.shadowBlur=selected?22:13;
  ctx.fillStyle=selected?'#d8f8ff':'#9cdbff';ctx.fillRect(-3.5,-3.5,7,7);
  ctx.shadowBlur=0;ctx.strokeStyle='#92d4ff';ctx.lineWidth=1.2;
  ctx.strokeRect(-10,-4.5,5,9);ctx.strokeRect(5,-4.5,5,9);
  if(selected){ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.strokeStyle='rgba(141,227,255,.75)';ctx.stroke();}
  ctx.restore();
  if(selected || sat.record.name.includes('ISS')) {
   ctx.textAlign='left';ctx.font='600 10px "Space Grotesk",sans-serif';ctx.fillStyle='#9de0ff';
   ctx.fillText(sat.record.name.substring(0,19),p.x+14,p.y-11);
  }
  hitTargets.push({kind:'satellite',item:sat.record,x:p.x,y:p.y,r:selected?23:16,priority:6});
 }
}
