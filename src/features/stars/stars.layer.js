/** Nachthimmel v2 - features/stars/stars.layer.js. Extracted from the original v6 app. */
import { galacticToEquatorial } from '../../core/astronomy.js';
import { DEG, clamp } from '../../core/math.js';
import { state } from '../../core/store.js';
import { ctx } from '../../engine/canvas.js';
import { H, W, hitTargets, projectEq } from '../../engine/projection.js';

export function reseed(seed) {let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}

export const rnd = reseed(148507);

// Decorative, non-catalogue stars are deliberately extremely faint.
export const decor = Array.from({length:1500},()=>({ra:rnd()*360,dec:Math.asin(rnd()*2-1)*DEG,alpha:.06+rnd()*.19,r:.23+rnd()*.53}));

export const galaxyDust=Array.from({length:1400},()=>{
 const l=rnd()*360, b=(rnd()+rnd()+rnd()+rnd()-2)*9.5;
 const eq=galacticToEquatorial(l,b);
 return {...eq,alpha:(.08+rnd()*.23)*(Math.abs(b)<10?1:.75),r:.22+rnd()*.48};
});

export function drawGalaxyDust() {
 // Coordinate-accurate galactic plane haze (decorative particles, not stellar measurements).
 for(const item of galaxyDust){const p=projectEq(item.ra,item.dec);if(!p||p.x<0||p.x>W||p.y<0||p.y>H)continue;ctx.fillStyle=`rgba(123,157,236,${item.alpha})`;ctx.fillRect(p.x,p.y,item.r,item.r);}
 for(const item of decor){const p=projectEq(item.ra,item.dec);if(!p||p.x<0||p.x>W||p.y<0||p.y>H)continue;ctx.fillStyle=`rgba(187,215,246,${item.alpha})`;ctx.fillRect(p.x,p.y,item.r,item.r);}
}

export function starColor(bv){return bv < -.08 ? '#a8c9ff' : bv < .25 ? '#d2e6ff' : bv < .7 ? '#f5f6ff' : bv < 1.3 ? '#ffe9c5' : '#ffcfaa';}

export function drawStars() {
 const labels=[];
 for(const s of state.stars){
  if(s.mag>state.mag || !Number.isFinite(s.ra)||!Number.isFinite(s.dec))continue;
  const p=projectEq(s.ra,s.dec); if(!p||p.x<0||p.x>W||p.y<0||p.y>H)continue;
  const size=clamp((6.45-s.mag)*.44*(94/state.fov)**.3,.43,4.6);
  const col=starColor(s.bv);
  if(s.mag<1.85){
   const radius=size*4.8;const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);
   glow.addColorStop(0,'rgba(176,216,255,.36)');glow.addColorStop(.35,'rgba(116,169,238,.095)');glow.addColorStop(1,'rgba(94,146,213,0)');
   ctx.fillStyle=glow;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();
  }
  ctx.beginPath();ctx.arc(p.x,p.y,size,0,Math.PI*2);ctx.fillStyle=col;ctx.globalAlpha=clamp(.35+(state.mag-s.mag)*.145,.44,1);ctx.fill();ctx.globalAlpha=1;
  if(s.mag<1.46 && s.name && state.fov<=107)labels.push({p,name:s.name});
  if(s.name && s.mag<=2.35)hitTargets.push({kind:'star',item:s,x:p.x,y:p.y,r:Math.max(9,size+5),priority:1});
 }
 ctx.textAlign='left';ctx.font='500 10px "DM Sans", sans-serif';
 for(const {p,name} of labels){
  if(p.x>W-105||p.y<68||p.y>H-90)continue;
  ctx.fillStyle='rgba(212,227,248,.68)';ctx.fillText(name,p.x+9,p.y-7);
 }
}

export function drawSelectedStarHalo() {
  if(!state.layers.stars || state.selected?.kind!=='star')return;
 const p=projectEq(state.selected.item.ra,state.selected.item.dec);if(!p)return;
 ctx.beginPath();ctx.arc(p.x,p.y,19,0,Math.PI*2);ctx.strokeStyle='rgba(178,216,255,.62)';ctx.lineWidth=1;ctx.stroke();
}
