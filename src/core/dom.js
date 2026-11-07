/** Nachthimmel v2 - core/dom.js. Extracted from the original v6 app. */


// Sky catalogues and photos are fetched from public, no-key endpoints at runtime.
export const $ = (id) => document.getElementById(id);

export const ico = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${name}"></use></svg>`;

export const escapeHTML = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, x => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[x]));

export const validURL = (url) => { try { const u = new URL(url); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };

export const formatNumber = (v, digits = 1) => Number.isFinite(v) ? Number(v).toLocaleString('de-DE', {maximumFractionDigits:digits,minimumFractionDigits:digits}) : '--';

export function niceAngle(a){return `${formatNumber(a,1)}\u00b0`;}
