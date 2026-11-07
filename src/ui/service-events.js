/** The UI side of domain notifications. Attached once at application start. */
import { $ } from '../core/dom.js';
import { on } from '../core/events.js';
import { renderDetail } from './details.js';
import { showToast } from './notifications.js';
import { updateSearchResults } from './search.js';
import { updateCounters } from './status.js';

let initialized = false;
export function connectServiceEvents() {
  if (initialized) return;
  initialized = true;
  on('data:changed', () => { updateCounters(); updateSearchResults(); });
  on('detail:refresh', renderDetail);
  on('toast', ({ message, warn = false }) => showToast(message, warn));
  on('satellites:visible', above => {
    $('satCount').textContent = `${above} über Horizont`;
  });
}
