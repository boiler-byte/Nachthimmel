/** Reflect restored persisted values before connecting event handlers. */
import { $, formatNumber } from '../core/dom.js';
import { state } from '../core/store.js';

export function syncPreferencesUI() {
  document.querySelectorAll('.layer-toggle').forEach(button => {
    const active = Boolean(state.layers[button.dataset.layer]);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('planetQuicklinks').classList.toggle('enabled', state.layers.planets);
  $('placeLabel').textContent = state.place;
  $('latInput').value = state.lat.toFixed(4);
  $('lonInput').value = state.lon.toFixed(4);
  $('magInput').value = String(state.mag);
  $('magLabel').textContent = formatNumber(state.mag, 2) + ' mag';
  $('aircraftDistanceRange').value = String(state.aircraftMaxDistanceKm);
  $('aircraftDistanceValue').textContent = state.aircraftMaxDistanceKm + ' km';
}
