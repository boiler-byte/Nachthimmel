/** Nachthimmel v2 - ui/time-controls.js. Extracted from the original v6 app. */
import { getDate } from '../core/clock.js';
import { $, ico } from '../core/dom.js';
import { clamp } from '../core/math.js';
import { state } from '../core/store.js';
import { pollAircraft } from '../features/aircraft/airlabs.service.js';
import { updateAircraftCounter } from './status.js';

export function setPlaying(value) {
 if (state.playing && !value) state.offsetMs += (Date.now()-state.playStart)*179;
 state.playing = value;
 if (value) state.playStart = Date.now();
 if(!value&&state.layers.aircraft)pollAircraft();
 $('playBtn').innerHTML = ico(value ? 'pause' : 'play');
 $('playBtn').title = value ? 'Zeitablauf anhalten' : 'Zeitablauf starten';
 updateTimeUI();
}

export function addHours(h) { if(state.playing)setPlaying(false); state.offsetMs += h * 3600000; updateTimeUI(); pollAircraft(); }

export function updateTimeUI() {
 const d = getDate();
 $('clockValue').textContent = d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
 $('dateValue').textContent = d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'});
 $('timeMode').textContent = state.playing ? 'ZEITRAFFER \u00d7 180' : Math.abs(state.offsetMs)<60000 ? 'LIVE-BEOBACHTUNGSZEIT' : 'SIMULIERTE ZEIT';
  $('timeRange').value = String(clamp(state.offsetMs/3600000,-12,12));
  if(state.layers.aircraft)updateAircraftCounter();
}
