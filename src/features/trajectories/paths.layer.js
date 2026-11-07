/**
 * Separate orbit overlays. Sky tracks use a fixed star-field coordinate system;
 * daily arcs use the observer's horizontal system at each sample time.
 */
import { radecToHorizontal } from '../../core/astronomy.js';
import { state } from '../../core/store.js';
import { ctx } from '../../engine/canvas.js';
import { H, W, projectEq, projectHor, sidereal } from '../../engine/projection.js';
import { PLANETS } from '../planets/planets.data.js';
import { observeBody } from '../solar-system/celestial.ephemeris.js';
import { dailyTrack, skyTrack } from './paths.service.js';

const SUN='#e9bc74', MOON='#a7c9e9';
const usable = p => p && p.x>=-20 && p.x<=W+20 && p.y>=-20 && p.y<=H+20;
const shortSegment = (a,b) => usable(a)&&usable(b) && Math.hypot(b.x-a.x,b.y-a.y)<Math.max(W,H)*.32;
const clockText = t => new Date(t).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});

function projectSky(points){
 return points.map(o=>{
  const p=projectEq(o.ra,o.dec);
  const h=radecToHorizontal(o.ra,o.dec,sidereal);
  return {...p,valid:!!p,above:h.alt>=0,time:o.time};
 });
}
function projectDaily(points){
 return points.map(o=>{const p=projectHor(o.az,o.alt);return {...p,valid:!!p,above:o.alt>=0,time:o.time};});
}

function drawArrow(a,b,color,opacity,strong){
 if(!shortSegment(a,b))return;
 const len=Math.hypot(b.x-a.x,b.y-a.y);
 if(len<2.5)return;
 ctx.save();ctx.translate((a.x+b.x)*.5,(a.y+b.y)*.5);
 ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));
 ctx.globalAlpha=opacity;
 ctx.fillStyle=color;ctx.beginPath();
 ctx.moveTo(strong?6:5,0);ctx.lineTo(strong?-3:-2,-(strong?4.3:3.2));
 ctx.lineTo(strong?-3:-2,strong?4.3:3.2);ctx.closePath();ctx.fill();ctx.restore();
}

function drawPath(points,now,color,{strong=false,daily=false}={}){
 if(points.length<2)return;
 const coords=daily?projectDaily(points):projectSky(points);
 const base=strong?1.9:1.15;
 // Past and future must stay distinguishable; below horizon is virtual only.
 for(const past of [true,false])for(const above of [false,true]){
  ctx.save();ctx.beginPath();let count=0;
  for(let i=0;i<coords.length-1;i++){
   const a=coords[i],b=coords[i+1];
   if(!shortSegment(a,b))continue;
   if(((a.time+b.time)*.5<now)!==past)continue;
   if((a.above&&b.above)!==above)continue;
   ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);count++;
  }
  if(count){
   ctx.globalAlpha=(past?(strong?.43:.20):(strong?.78:.49))*(above?1:.48);
   ctx.strokeStyle=color;ctx.lineWidth=base;ctx.setLineDash(daily?(above?[7,5]:[2,8]):[4,5]);ctx.stroke();
  }
  ctx.restore();
 }
 if(state.layers.pathArrows){
  // One or two small forward-facing arrows on future, visible portions only.
  const eligible=[];
  for(let i=0;i<coords.length-1;i++){
   if(coords[i].time<now || !coords[i].above || !usable(coords[i]))continue;
   // Slow planets may move less than a pixel per sample. Measure across
   // several samples, without ever spanning an invisible/back-facing segment.
   for(let j=i+1;j<coords.length;j++){
    const a=coords[j-1],b=coords[j];
    if(!a.above||!b.above||!shortSegment(a,b))break;
    const distance=Math.hypot(b.x-coords[i].x,b.y-coords[i].y);
    if(distance>=5){eligible.push({i,j});break;}
   }
  }
  const indices=strong&&eligible.length>5 ? [Math.floor(eligible.length*.38),Math.floor(eligible.length*.76)]
   : eligible.length?[Math.floor(eligible.length*.62)]:[];
  for(const arrow of new Map(indices.map(j=>[eligible[j].i,eligible[j]])).values()){
   drawArrow(coords[arrow.i],coords[arrow.j],color,strong?.95:.65,strong);
  }
 }
 if(strong && !daily){
  // Date marks on the selected object's path, relative to observation time.
  for(const relative of [-.5,.5]){
   const i=Math.round((coords.length-1)*(relative+1)/2);
   const p=coords[i];if(!usable(p)||p.y<67||p.y>H-108||p.x<55||p.x>W-75)continue;
   const days=Math.round(Math.abs(points[i].time-now)/86400000);
   ctx.save();ctx.fillStyle=color;ctx.globalAlpha=.8;
   ctx.font='600 9px "Space Grotesk",sans-serif';
   ctx.fillText((relative<0?'−':'+')+days+' T',p.x+7,p.y-7);ctx.restore();
  }
 }
}

function horizonMarkers(id,points,color){
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1];
  if((a.alt>=0)===(b.alt>=0))continue;
  const ratio=-a.alt/(b.alt-a.alt);
  if(ratio<0||ratio>1)continue;
  const crossingTime=a.time+(b.time-a.time)*ratio;
  const o=observeBody(id,new Date(crossingTime));
  const p=projectHor(o.az,o.alt);
  if(!usable(p)||p.x<50||p.x>W-80||p.y<66||p.y>H-110)continue;
  ctx.save();ctx.fillStyle=color;ctx.globalAlpha=.85;
  ctx.beginPath();ctx.arc(p.x,p.y,2.6,0,2*Math.PI);ctx.fill();
  ctx.font='600 9px "Space Grotesk",sans-serif';
  ctx.fillText(`${a.alt<0?'Auf':'Unter'} ${clockText(crossingTime)}`,p.x+6,p.y-7);
  ctx.restore();
 }
}

function drawSky(kind,id,date,color,strong=false){
 const track=skyTrack(kind,id,date);
 drawPath(track.points,date.getTime(),color,{strong});
}
function drawDay(id,date,color,strong=false){
 const track=dailyTrack(id,date);
 drawPath(track.points,date.getTime(),color,{strong,daily:true});
 if(strong||id==='sun')horizonMarkers(id,track.points,color);
}

const selected=(kind,id)=>state.layers.selectedPath&&state.selected?.kind===kind&&state.selected.item.id===id;

export function drawPlanetPaths(date){
 for(const planet of PLANETS){
  if(selected('planet',planet.id))continue; // selected curve is highlighted in its own overlay
  drawSky('planet',planet.id,date,planet.color);
 }
}
export function drawSunPath(date){
 if(!selected('body','sun'))drawDay('sun',date,SUN);
}
export function drawMoonPath(date){
 if(selected('body','moon'))return;
 drawSky('body','moon',date,MOON);
 drawDay('moon',date,MOON);
}
export function drawSelectedPath(date){
 const s=state.selected;if(!s||!state.layers.selectedPath)return;
 if(s.kind==='planet'&&state.layers.planets){
  drawSky('planet',s.item.id,date,s.item.color,true);
 }else if(s.kind==='body'&&state.layers.sunMoon){
  if(s.item.id==='sun')drawDay('sun',date,SUN,true);
  if(s.item.id==='moon'){
   drawSky('body','moon',date,MOON,true);
   drawDay('moon',date,MOON,true);
  }
 }
}
