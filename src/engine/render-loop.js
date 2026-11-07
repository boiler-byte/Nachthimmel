/** Nachthimmel v2 - engine/render-loop.js. Extracted from the original v6 app. */
import { getDate } from '../core/clock.js';
import { state } from '../core/store.js';
import { pointerMap } from './canvas-input.js';
import { ctx } from './canvas.js';
import { skyRenderer } from './layer-registry.js';
import { DPR, H, W, beginFrame } from './projection.js';
import { refreshBodyDetails } from '../ui/details.js';
import { refreshPlanetDetails } from '../features/planets/planets.details.js';
import { updateViewUI } from '../ui/compass.js';
import { updateTimeUI } from '../ui/time-controls.js';

export let lastRendered = 0, lastUIUpdate = 0, lastTimeUIUpdate = 0;

export function renderFrame(ts){
 requestAnimationFrame(renderFrame);
 const fpsTarget=state.motion || pointerMap.size || state.playing ? 33 : 90;
 if(ts-lastRendered<fpsTarget)return;
 lastRendered=ts;
 if(!W||!H)return;
 ctx.setTransform(DPR,0,0,DPR,0,0);
 const date=getDate();
 beginFrame(date);
  skyRenderer.render({ date });
 if(ts-lastUIUpdate>(state.motion||pointerMap.size?65:150)){updateViewUI();lastUIUpdate=ts;}
 if(ts-lastTimeUIUpdate>900){updateTimeUI();refreshPlanetDetails();refreshBodyDetails();lastTimeUIUpdate=ts;}
}
