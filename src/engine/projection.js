/** Nachthimmel v2 - engine/projection.js. Extracted from the original v6 app. */
import { radecToHorizontal, timestampToSidereal } from '../core/astronomy.js';
import { rad } from '../core/math.js';
import { state } from '../core/store.js';
import { ctx, cvs } from './canvas.js';

export let W = 0, H = 0, DPR = 1;

export let hitTargets = [];

export let centerX = 0, centerY = 0, perspective = 0;

export function calcBasis() {
 const az=rad(state.az), alt=rad(state.alt);
 const sinAz=Math.sin(az), cosAz=Math.cos(az), sinAlt=Math.sin(alt), cosAlt=Math.cos(alt);
 return {front:[cosAlt*sinAz,cosAlt*cosAz,sinAlt],right:[cosAz,-sinAz,0],up:[-sinAlt*sinAz,-sinAlt*cosAz,cosAlt]};
}

export let basis=calcBasis(), sidereal=0;

export function projectHor(az,alt) {
 const a=rad(az), h=rad(alt), c=Math.cos(h);
 const v0=c*Math.sin(a),v1=c*Math.cos(a),v2=Math.sin(h);
 const dz=v0*basis.front[0]+v1*basis.front[1]+v2*basis.front[2];
 if(dz<=.075)return null;
 const x=centerX+perspective*(v0*basis.right[0]+v1*basis.right[1])/dz;
 const y=centerY-perspective*(v0*basis.up[0]+v1*basis.up[1]+v2*basis.up[2])/dz;
 if(x < -170 || x > W+170 || y < -170 || y > H+170)return null;
 return {x,y};
}

// Deliberately project the complete celestial sphere. Below the local horizon,
// objects are a labelled virtual through-Earth view rather than optically visible.
export function projectEq(ra,dec) { const h=radecToHorizontal(ra,dec,sidereal); return projectHor(h.az,h.alt); }

export function resize() {
 DPR=Math.min(2,window.devicePixelRatio || 1);
 W=Math.max(1,window.innerWidth); H=Math.max(1,window.innerHeight);
 cvs.width=Math.round(W*DPR);cvs.height=Math.round(H*DPR);
 cvs.style.width=W+'px';cvs.style.height=H+'px';
 ctx.setTransform(DPR,0,0,DPR,0,0);
 centerX=W*.5;centerY=H*(W<=760?.41:.47);
 perspective=(H*.5)/Math.tan(rad(state.fov)/2);
}
/** Begin one coherent sky frame before any layer draws. */
export function beginFrame(date) {
 perspective = (H * .5) / Math.tan(rad(state.fov) / 2);
 basis = calcBasis();
 sidereal = timestampToSidereal(date);
 hitTargets = [];
}

