/** Nachthimmel v2 - engine/hit-testing.js. Extracted from the original v6 app. */
import { clamp } from '../core/math.js';
import { hitTargets } from './projection.js';
import { updateSelection } from '../ui/dialogs.js';

export function distanceToSegment(x,y,x1,y1,x2,y2){
 const dx=x2-x1,dy=y2-y1,den=dx*dx+dy*dy;
 if(!den)return Math.hypot(x-x1,y-y1);
 const t=clamp(((x-x1)*dx+(y-y1)*dy)/den,0,1);
 return Math.hypot(x-(x1+t*dx),y-(y1+t*dy));
}

export function canvasClick(x,y){
 const matches=[];
 for(const hit of hitTargets){
  let distance;
  if(Number.isFinite(hit.x1))distance=distanceToSegment(x,y,hit.x1,hit.y1,hit.x2,hit.y2);
  else distance=Math.hypot(x-hit.x,y-hit.y);
  const limit=hit.label?Math.max(17,hit.r):hit.r||10;
  if(distance<limit)matches.push({...hit,distance});
 }
 matches.sort((a,b)=>b.priority-a.priority || a.distance-b.distance);
 if(matches.length){const match=matches[0];updateSelection(match.kind,match.item);}
 else updateSelection(null,null);
}
