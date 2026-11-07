/** Interactive markers for the Sun and Moon, with a stylized lunar phase. */
import { state } from '../../core/store.js';
import { ctx } from '../../engine/canvas.js';
import { H, W, hitTargets, projectHor } from '../../engine/projection.js';
import { BODIES, observeBody } from './celestial.ephemeris.js';

function moonDisk(p,r){
 // Small but meaningful phase indicator; waxing light is on the right in the
 // northern hemisphere, reversed in the south. Not a telescope orientation.
 const rightLit=p.waxing !== (state.lat<0);
 ctx.fillStyle='#374355';ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.clip();
 ctx.fillStyle='#dbe9fb';
 for(let y=-r;y<r;y+=.75){
  const edge=Math.sqrt(Math.max(0,r*r-y*y));
  const boundary=edge*(1-2*p.illum);
  const x=rightLit?boundary:-edge;
  ctx.fillRect(x,y,edge-boundary,.9);
 }
 ctx.restore();
}

export function drawSunMoon(date){
 const selectedId=state.selected?.kind==='body'?state.selected.item.id:null;
 for(const body of BODIES){
  const obs=observeBody(body.id,date);
  const p=projectHor(obs.az,obs.alt);
  if(!p||p.x<12||p.x>W-12||p.y<58||p.y>H-100)continue;
  const selected=body.id===selectedId,r=selected?10:8;
  ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=obs.alt>=0?1:.43;
  ctx.shadowBlur=body.id==='sun'?24:12;
  ctx.shadowColor=body.color;
  if(body.id==='sun'){
   const g=ctx.createRadialGradient(-r*.3,-r*.3,0,0,0,r);
   g.addColorStop(0,'#fff7d9');g.addColorStop(.48,'#f7d487');g.addColorStop(1,'#e59b4c');
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  }else{
   moonDisk(obs,r);
   ctx.shadowBlur=0;ctx.strokeStyle='#afcce5';ctx.lineWidth=.8;
   ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  }
  ctx.shadowBlur=0;
  if(selected){ctx.strokeStyle=body.color;ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(0,0,r+10,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
  ctx.font=(selected?'700 ':'600 ')+'11px "Space Grotesk",sans-serif';
  ctx.fillStyle=obs.alt>=0?body.color:'rgba(183,174,177,.6)';
  if(p.x<W-76 && p.y>70 && p.y<H-106)ctx.fillText(body.name,p.x+17,p.y-10);
  hitTargets.push({kind:'body',item:body,x:p.x,y:p.y,r:selected?26:20,priority:9});
 }
}
