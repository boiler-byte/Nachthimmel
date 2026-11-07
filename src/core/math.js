/** Nachthimmel v2 - core/math.js. Extracted from the original v6 app. */


export const RAD = Math.PI / 180;

export const DEG = 180 / Math.PI;

export const MIN_ALT = -89.5, MAX_ALT = 89.5;

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const wrap = (n) => ((n % 360) + 360) % 360;

export const rad = (v) => v * RAD;

export const deg = (v) => v * DEG;
