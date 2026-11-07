/** Nachthimmel v2 - engine/canvas-input.js. Extracted from the original v6 app. */
import { MAX_ALT, MIN_ALT, clamp, wrap } from '../core/math.js';
import { state } from '../core/store.js';
import { cvs } from './canvas.js';
import { canvasClick } from './hit-testing.js';
import { H, W } from './projection.js';
import { disableMotionForDrag } from '../sensors/orientation.js';

export let pointerMap = new Map(), startPointer = null, wasDragged = false;

export let lastPinch = 0;

export function setZoom(fov){state.fov=clamp(fov,22,115);}

export function onPointerDown(e){
 e.preventDefault();
 cvs.setPointerCapture(e.pointerId);
 pointerMap.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointerMap.size===1){startPointer={x:e.clientX,y:e.clientY};wasDragged=false;}
 if(pointerMap.size===2){
  const pts=[...pointerMap.values()];lastPinch=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  wasDragged=true;
 }
}

export function onPointerMove(e){
 if(!pointerMap.has(e.pointerId))return;
 const prev=pointerMap.get(e.pointerId);
 pointerMap.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointerMap.size===2){
  const pts=[...pointerMap.values()];const distance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  if(lastPinch>0&&distance>0)setZoom(state.fov*lastPinch/distance);
  lastPinch=distance;wasDragged=true;return;
 }
 if(pointerMap.size!==1)return;
 const dx=e.clientX-prev.x,dy=e.clientY-prev.y;
 if(startPointer&&Math.hypot(e.clientX-startPointer.x,e.clientY-startPointer.y)>4)wasDragged=true;
 if(!wasDragged)return;
 if(state.motion)disableMotionForDrag();
 state.az=wrap(state.az-dx/Math.max(250,W)*state.fov*1.55);
 state.alt=clamp(state.alt+dy/Math.max(250,H)*state.fov*1.65,MIN_ALT,MAX_ALT);
}

export function onPointerUp(e){
 const shouldClick=!wasDragged && pointerMap.size===1;
 pointerMap.delete(e.pointerId);
 if(!pointerMap.size){lastPinch=0;startPointer=null;}
 if(shouldClick)canvasClick(e.clientX,e.clientY);
}
