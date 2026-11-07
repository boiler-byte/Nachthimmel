/** Nachthimmel v2 - ui/notifications.js. Extracted from the original v6 app. */
import { $ } from '../core/dom.js';

export function showToast(message, warn = false) {
 const el = document.createElement('div'); el.className = 'toast' + (warn ? ' warn' : ''); el.textContent = message;
 $('toasts').append(el); while ($('toasts').children.length > 3) $('toasts').firstElementChild.remove();
 setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(),350);}, 4500);
}
