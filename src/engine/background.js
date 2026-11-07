/** Nachthimmel v2 - engine/background.js. Extracted from the original v6 app. */
import { clamp, rad } from '../core/math.js';
import { state } from '../core/store.js';
import { ctx } from './canvas.js';
import { H, W, centerY, perspective, projectHor } from './projection.js';

export function background() {
 ctx.fillStyle='#040a18'; ctx.fillRect(0,0,W,H);
 let g=ctx.createRadialGradient(W*.56,H*.43,0,W*.56,H*.43,Math.max(W,H)*.78);
 g.addColorStop(0,'#102343');g.addColorStop(.38,'#09172d');g.addColorStop(1,'#020511');
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // Fine atmospheric haze, independent of observer visibility.
 g=ctx.createLinearGradient(0,H*.3,0,H);g.addColorStop(0,'rgba(5,12,32,0)');g.addColorStop(.65,'rgba(23,41,74,.05)');g.addColorStop(1,'rgba(39,61,103,.21)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}

export function drawPolyline(points,color,width=1,store=null) {
 ctx.beginPath();let prev=null,drawn=0;
 for(const p of points){
  if(!p){prev=null;continue;}
  if(prev && Math.hypot(p.x-prev.x,p.y-prev.y) < Math.max(W,H)*.6){ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);drawn++;if(store)store.push([prev.x,prev.y,p.x,p.y]);}
  prev=p;
 }
 if(drawn){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
}

export function drawGrid() {
 // Both celestial hemispheres are navigable; negative elevation lines identify
 // the otherwise invisible directions below the observer's local horizon.
 for(let a=0;a<360;a+=30){
  const points=[];for(let h=-90;h<=90;h+=3)points.push(projectHor(a,h));
  drawPolyline(points,a%90===0?'rgba(122,172,226,.12)':'rgba(121,165,216,.055)',.8);
 }
 for(const h of [-80,-60,-40,-20,0,20,40,60,80]){
  const pts=[];for(let a=0;a<=360;a+=3)pts.push(projectHor(a,h));
  ctx.save();if(h<0)ctx.setLineDash([4,7]);
  drawPolyline(pts,h===0?'rgba(167,213,246,.42)':h<0?'rgba(154,138,170,.16)':'rgba(121,165,216,.08)',h===0?1.4:.8);
  ctx.restore();
 }
 const cardinal=[['N',0],['NO',45],['O',90],['SO',135],['S',180],['SW',225],['W',270],['NW',315]];
 ctx.font='600 10px "Space Grotesk", sans-serif';ctx.textAlign='center';
 for(const [label,a] of cardinal){const p=projectHor(a,0);if(!p||p.y>H-110||p.y<65)continue;ctx.fillStyle='rgba(140,192,230,.7)';ctx.fillText(label,p.x,p.y-11);}
}

export function drawBelowHorizon(){
 // In this roll-free pinhole camera the horizontal plane projects to a true
 // screen-horizontal line at centerY + focalLength * tan(view altitude).
 const horizonY=centerY+perspective*Math.tan(rad(state.alt));
 const top=clamp(horizonY,0,H);
 if(top<H){
  ctx.save();
  const ground=ctx.createLinearGradient(0,top,0,Math.max(top+1,H));
  ground.addColorStop(0,'rgba(4,9,20,.45)');ground.addColorStop(1,'rgba(5,10,20,.76)');
  ctx.fillStyle=ground;ctx.fillRect(0,top,W,H-top);
  ctx.strokeStyle='rgba(154,153,175,.045)';ctx.lineWidth=.7;
  ctx.beginPath();for(let y=Math.ceil(top/30)*30;y<H;y+=30){ctx.moveTo(0,y);ctx.lineTo(W,y);}ctx.stroke();
  ctx.restore();
 }
 if(horizonY>=42 && horizonY<H-35){
  ctx.save();ctx.setLineDash([8,7]);ctx.strokeStyle='rgba(205,190,161,.4)';ctx.lineWidth=1.1;
  ctx.beginPath();ctx.moveTo(0,horizonY);ctx.lineTo(W,horizonY);ctx.stroke();ctx.setLineDash([]);
  const labelX=clamp(W*.65,90,W-95);
  ctx.textAlign='center';ctx.font='600 9px "Space Grotesk",sans-serif';
  ctx.fillStyle='rgba(223,208,182,.8)';ctx.fillText('HORIZONT 0°',labelX,horizonY-9);ctx.restore();
 }
}
