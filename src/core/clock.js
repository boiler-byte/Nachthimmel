/** Nachthimmel v2 - core/clock.js. Extracted from the original v6 app. */
import { state } from './store.js';

export function getDate() { return new Date(Date.now() + state.offsetMs + (state.playing ? (Date.now()-state.playStart)*179 : 0)); }

export function aircraftAtLiveTime() {
 return !state.playing && Math.abs(getDate().getTime()-Date.now()) < 120000;
}
