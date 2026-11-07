/** Nachthimmel v2 - features/constellations/constellations.layer.js. Extracted from the original v6 app. */
import { state } from '../../core/store.js';
import { drawPolyline } from '../../engine/background.js';
import { ctx } from '../../engine/canvas.js';
import { H, W, hitTargets, projectEq } from '../../engine/projection.js';

export function drawConstellations() {
 if(!state.layers.constellations)return;
 const chosen = state.selected?.kind==='constellation' ? state.selected.item.id : null;
 // Draw line figures, brighter only for the selected constellation.
 for(const con of state.constellations){
  const selected=con.id===chosen;
  const targetLines=[];
  for(const line of con.segments){const pts=line.map(v=>projectEq(v[0],v[1]));drawPolyline(pts,selected?'rgba(145,211,255,.9)':'rgba(122,176,231,.36)',selected?2:1.1,targetLines);}
  for(const [x1,y1,x2,y2] of targetLines)hitTargets.push({kind:'constellation',item:con,x1,y1,x2,y2,priority:2});
  if(selected){const p=projectEq(con.ra,con.dec);if(p){const g=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,90);g.addColorStop(0,'rgba(85,172,242,.13)');g.addColorStop(1,'rgba(85,172,242,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,90,0,Math.PI*2);ctx.fill();}}
 }
 // Label collision suppression and clickable label boxes.
 const used=[];
 const candidates=[];
 for(const con of state.constellations){const p=projectEq(con.ra,con.dec);if(p&&p.x>20&&p.x<W-20&&p.y>70&&p.y<H-106)candidates.push({con,p});}
 candidates.sort((a,b)=> (a.con.id===chosen?-10:0)-(b.con.id===chosen?-10:0));
 for(const {con,p} of candidates){
  const name=(con.de||con.name||con.id).toUpperCase();
  const offset=con.id===chosen?77:Math.max(70,Math.min(108,name.length*5.2));
  if(used.some(q=>Math.abs(q.x-p.x)<offset && Math.abs(q.y-p.y)<28))continue;
  used.push(p);
  const selected=con.id===chosen;
  ctx.font=(selected?'700 ':'600 ')+(selected?'12px':'10px')+' "Space Grotesk", sans-serif';
  ctx.textAlign='center';
  const tw=ctx.measureText(name).width;
  if(selected){ctx.fillStyle='rgba(52,105,150,.24)';ctx.beginPath();ctx.roundRect(p.x-tw/2-12,p.y-12,tw+24,25,7);ctx.fill();}
  ctx.fillStyle=selected?'#c9eaff':'rgba(158,202,244,.8)';ctx.fillText(name,p.x,p.y+3);
  hitTargets.push({kind:'constellation',item:con,x:p.x,y:p.y,r:Math.max(24,tw/2+9),label:true,priority:3});
 }
}
