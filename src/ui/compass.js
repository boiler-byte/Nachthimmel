/** Nachthimmel v2 - ui/compass.js. Extracted from the original v6 app. */
import { $, formatNumber } from '../core/dom.js';
import { MAX_ALT, MIN_ALT, clamp, wrap } from '../core/math.js';
import { state } from '../core/store.js';

export let roseRotation = null, lastCompassHeading = null;

export function directionName(az){const labels=['NORD','NORDOST','OST','S\u00dcDOST','S\u00dcD','S\u00dcDWEST','WEST','NORDWEST'];return labels[Math.round(wrap(az)/45)%8];}

export function updateViewUI(){
 const az=wrap(state.az),alt=clamp(state.alt,MIN_ALT,MAX_ALT);
 const signedAlt=(alt>=0?'+':'')+formatNumber(alt,1)+'\u00b0';
 $('compassBearing').textContent=formatNumber(az,1)+'\u00b0';
 $('compassHeight').textContent=signedAlt;
 // Keep the compass rose continuous when crossing north (359 -> 0 degrees).
 if(lastCompassHeading===null){lastCompassHeading=az;roseRotation=az;}
 else{roseRotation+=((az-lastCompassHeading+540)%360)-180;lastCompassHeading=az;}
 $('compassRose').style.transform=`rotate(${-roseRotation}deg)`;
 // A horizontal compass reference appears more face-on when looking down,
 // while the dial tilts away when the camera points high into the sky.
 const tilt=clamp(43+alt*.44,8,74);
 $('compassDial').style.transform=`rotateX(${tilt.toFixed(2)}deg)`;
 $('compassPitchDot').style.left=((alt+90)/180*100).toFixed(2)+'%';
 $('belowFlag').hidden=alt>=-0.1;
 $('compassUnit').setAttribute('aria-label',`Kompass: Azimut ${formatNumber(az,1)} Grad, Blickh\u00f6he ${formatNumber(alt,1)} Grad${alt<0?', virtuell unter dem Horizont':''}`);
}
