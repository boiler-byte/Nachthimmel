/** The observer location and visual magnitude controls live in their own modal. */
import { $, formatNumber } from '../core/dom.js';
import { state } from '../core/store.js';
import { savePreferences } from '../core/preferences.js';
import { requestGPS, setLocation } from '../sensors/geolocation.js';
import { closeModal, openModal } from './dialogs.js';
import { showToast } from './notifications.js';

function syncLocationFields() {
  // Reopening must discard coordinates edited but not confirmed.
  $('latInput').value = state.lat.toFixed(4);
  $('lonInput').value = state.lon.toFixed(4);
  $('magInput').value = String(state.mag);
  $('magLabel').textContent = formatNumber(state.mag, 2) + ' mag';
}

function saveObserverLocation() {
  const latText = $('latInput').value.trim();
  const lonText = $('lonInput').value.trim();
  if (!latText || !lonText) {
    showToast('Bitte Breiten- und Längengrad eingeben.', true);
    return;
  }
  if (setLocation(Number(latText), Number(lonText))) {
    closeModal('locationModal');
    showToast('Beobachtungsstandort aktualisiert.');
  }
}

export function connectLocationDialog() {
  $('locationTop').addEventListener('click', () => {
    syncLocationFields();
    openModal('locationModal');
    $('latInput').focus();
  });
  $('locationClose').addEventListener('click', () => closeModal('locationModal'));
  $('saveLocation').addEventListener('click', saveObserverLocation);
  $('gpsBtn').addEventListener('click', requestGPS);
  $('magInput').addEventListener('input', event => {
    state.mag = Number(event.target.value);
    savePreferences(state);
    $('magLabel').textContent = formatNumber(state.mag, 2) + ' mag';
  });
}
