/** Nachthimmel v2 - features/planets/planets.layer.js. Extracted from the original v6 app. */
import { state } from '../../core/store.js';
import { ctx } from '../../engine/canvas.js';
import { H, W, hitTargets, projectHor } from '../../engine/projection.js';
import { planetObservations } from './planets.orbits.js';

export function drawPlanets(date){
 if(!state.layers.planets)return;
 const observations=planetObservations(date);
 const selectedId=state.selected?.kind==='planet' ? state.selected.item.id : null;
 const visible=[];
 for(const p of observations){
  const coord=projectHor(p.az,p.alt);
  if(!coord||coord.x<12||coord.x>W-12||coord.y<58||coord.y>H-100)continue;
  visible.push({p,coord});
 }
 visible.sort((a,b)=>Number(a.p.planet.id===selectedId)-Number(b.p.planet.id===selectedId));
 const usedLabels=[];
 for(const {p,coord} of visible){
  const {planet}=p,selected=planet.id===selectedId;
  const r=selected?8.5:6.5;
  ctx.save();ctx.translate(coord.x,coord.y);
  // The icon is intentionally enlarged: planets are not to scale on the map.
  ctx.globalAlpha=p.alt>=0?1:.48;
  ctx.shadowColor=planet.color;ctx.shadowBlur=selected?25:15;
  if(planet.id==='saturn'){
   ctx.beginPath();ctx.ellipse(0,0,15.5,5.7,-.38,0,Math.PI*2);
   ctx.strokeStyle=planet.light;ctx.lineWidth=2.2;ctx.stroke();
  }
  const disk=ctx.createRadialGradient(-r*.42,-r*.45,0,0,0,r*1.65);
  disk.addColorStop(0,planet.light);disk.addColorStop(.45,planet.color);disk.addColorStop(1,planet.dark);
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle=disk;ctx.fill();
  ctx.shadowBlur=0;ctx.strokeStyle=planet.light;ctx.lineWidth=.75;ctx.stroke();
  if(planet.id==='jupiter'){
   ctx.save();ctx.beginPath();ctx.arc(0,0,r-.65,0,Math.PI*2);ctx.clip();
   ctx.strokeStyle='rgba(143,89,64,.65)';ctx.lineWidth=1.6;
   for(const v of [-2.8,1.4,4.2]){ctx.beginPath();ctx.moveTo(-r,v);ctx.lineTo(r,v+.7);ctx.stroke();}
   ctx.restore();
  }
  if(selected){ctx.beginPath();ctx.arc(0,0,21,0,Math.PI*2);ctx.strokeStyle='rgba(255,226,185,.88)';ctx.lineWidth=1.2;ctx.stroke();}
  ctx.restore();
  // Labels remain readable and do not occlude the icon. Hide only collisions.
  const lx=coord.x+17,ly=coord.y-11;
  if(lx<W-72&&ly>68&&ly<H-104 && (selected||!usedLabels.some(q=>Math.abs(q.x-lx)<76&&Math.abs(q.y-ly)<18))){
   ctx.textAlign='left';ctx.font=(selected?'700 ':'600 ')+'10px "Space Grotesk", sans-serif';
   ctx.fillStyle=p.alt>=0?'#ffe0ac':'rgba(217,181,137,.59)';
   ctx.fillText(planet.name,lx,ly);usedLabels.push({x:lx,y:ly});
  }
  hitTargets.push({kind:'planet',item:planet,x:coord.x,y:coord.y,r:selected?25:19,priority:8});
 }
}
