/** Nachthimmel v2 - features/deep-sky/deep-sky.layer.js. Extracted from the original v6 app. */
import { clamp } from '../../core/math.js';
import { state } from '../../core/store.js';
import { ctx } from '../../engine/canvas.js';
import { H, W, hitTargets, projectEq } from '../../engine/projection.js';
import { DEEP } from './catalog.data.js';
import { ensureDsoImage, imageCache } from './images.service.js';

export function drawDeepSky(){
 if(!state.layers.deepSky)return;
 for(const d of DEEP){
  const p=projectEq(d.ra,d.dec);if(!p||p.x<25||p.x>W-25||p.y<62||p.y>H-105)continue;
  ensureDsoImage(d);
  const isSelected=state.selected?.kind==='dso' && state.selected.item.id===d.id;
  const radius=clamp(16+((95-state.fov)*.13),13,27);
  const cache=imageCache.get(d.id);
  ctx.save();
  ctx.shadowColor=isSelected?'#c7a8ff':'#9d7cf5';ctx.shadowBlur=isSelected?24:12;
  ctx.beginPath();ctx.arc(p.x,p.y,radius+3,0,Math.PI*2);
  ctx.fillStyle='rgba(96,58,163,.24)';ctx.fill();ctx.shadowBlur=0;
  if(cache?.img){
   ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.clip();
   const image=cache.img;const iw=image.naturalWidth, ih=image.naturalHeight;
   if(iw && ih){const side=Math.min(iw,ih);ctx.drawImage(image,(iw-side)/2,(ih-side)/2,side,side,p.x-radius,p.y-radius,radius*2,radius*2);}
   ctx.restore();
   ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);
   ctx.fillStyle='rgba(24,8,57,.13)';ctx.fill();
  } else {
   const grd=ctx.createRadialGradient(p.x-radius/3,p.y-radius/4,1,p.x,p.y,radius);
   grd.addColorStop(0,'rgba(186,164,255,.86)');grd.addColorStop(.4,'rgba(99,74,176,.6)');grd.addColorStop(1,'rgba(41,23,80,.82)');
   ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();
   ctx.strokeStyle='rgba(226,213,255,.35)';ctx.beginPath();ctx.moveTo(p.x-6,p.y);ctx.lineTo(p.x+6,p.y);ctx.moveTo(p.x,p.y-6);ctx.lineTo(p.x,p.y+6);ctx.stroke();
  }
  ctx.beginPath();ctx.arc(p.x,p.y,radius+2,0,Math.PI*2);
  ctx.strokeStyle=isSelected?'#d5baff':'rgba(190,160,254,.68)';ctx.lineWidth=isSelected?2.1:1.1;ctx.stroke();
  ctx.restore();
  ctx.font='700 9px "Space Grotesk",sans-serif';ctx.textAlign='left';
  ctx.fillStyle='rgba(229,212,255,.9)';ctx.fillText(d.id,p.x+radius+9,p.y+3);
  hitTargets.push({kind:'dso',item:d,x:p.x,y:p.y,r:radius+11,priority:5});
 }
}
