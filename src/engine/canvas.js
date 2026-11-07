/** Nachthimmel v2 - engine/canvas.js. Extracted from the original v6 app. */
import { $ } from '../core/dom.js';

export const cvs = $('sky');

export const ctx = cvs.getContext('2d', { alpha: false });
