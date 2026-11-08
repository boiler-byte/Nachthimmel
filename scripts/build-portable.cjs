/** The portable PWA uses the standalone bundle as its hosted index.html. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const standalone = path.join(dist, 'Nachthimmel_v2.html');
if (!fs.existsSync(standalone)) throw Error('Run npm run standalone before build-portable.cjs');
fs.copyFileSync(standalone, path.join(dist, 'index.html'));
console.log('Portable PWA: dist/index.html generated from standalone bundle');
