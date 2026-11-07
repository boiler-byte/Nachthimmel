/** Nachthimmel v2 - features/aircraft/aircraft.layer.js. Extracted from the original v6 app. */
import { aircraftAtLiveTime } from '../../core/clock.js';
import { rad } from '../../core/math.js';
import { state } from '../../core/store.js';
import { ctx } from '../../engine/canvas.js';
import { H, W, hitTargets, projectHor } from '../../engine/projection.js';
import { predictAircraft } from './aircraft.positions.js';

export function drawAircraft(){
 if(!state.layers.aircraft||!aircraftAtLiveTime()||!state.aircraft.length)return;
 const now=Date.now(),selectedId=state.selected?.kind==='aircraft'?state.selected.item.id:null;
 const items=[];
 for(const a of state.aircraft){
  const h=predictAircraft(a,now);if(!h||h.alt<=0)continue;
  const p=projectHor(h.az,h.alt);
  if(!p||p.x<12||p.x>W-12||p.y<54||p.y>H-92)continue;
  items.push({a,h,p});
 }
 // Draw selection on top; other aircraft use a small, recognisable silhouette.
 items.sort((a,b)=>Number(a.a.id===selectedId)-Number(b.a.id===selectedId));
 for(const {a,h,p} of items){
  const selected=a.id===selectedId;
  let angle=rad(Number.isFinite(a.track)?a.track:0);
  if(Number.isFinite(a.track)&&Number.isFinite(a.speed)&&a.speed>5){
   const future=predictAircraft(a,now+12000);
   const pp=future&&projectHor(future.az,future.alt);
   if(pp&&Math.hypot(pp.x-p.x,pp.y-p.y)>1.3)angle=Math.atan2(pp.y-p.y,pp.x-p.x)+Math.PI/2;
  }
  const size=selected?1.24:1;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.scale(size,size);
  ctx.shadowColor='#efc37b';ctx.shadowBlur=selected?21:9;
  ctx.fillStyle=selected?'#ffe6b5':'#e8c28b';
  ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(2,-3);ctx.lineTo(10,1.8);
  ctx.lineTo(10,4);ctx.lineTo(2.1,2.8);ctx.lineTo(1.8,8.1);
  ctx.lineTo(4.8,10);ctx.lineTo(4.8,11.5);ctx.lineTo(0,10.5);
  ctx.lineTo(-4.8,11.5);ctx.lineTo(-4.8,10);ctx.lineTo(-1.8,8.1);
  ctx.lineTo(-2.1,2.8);ctx.lineTo(-10,4);ctx.lineTo(-10,1.8);
  ctx.lineTo(-2,-3);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;
  if(selected){ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);
   ctx.strokeStyle='rgba(255,222,158,.83)';ctx.lineWidth=1.3;ctx.stroke();}
  ctx.restore();
  if(selected || (a.callsign && h.ageSeconds<80 && state.fov<=78 && items.length<35)){
   ctx.font='600 10px "Space Grotesk",sans-serif';ctx.textAlign='left';
   ctx.fillStyle='#f8d7a1';ctx.fillText((a.callsign||a.id).slice(0,12),p.x+14,p.y-12);
  }
  hitTargets.push({kind:'aircraft',item:a,x:p.x,y:p.y,r:selected?25:16,priority:7});
 }
}
