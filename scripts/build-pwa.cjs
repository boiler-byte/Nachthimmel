/** Prepare first-party PWA assets for unbundled source and Vite production dist. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const target = process.argv[2] === 'dist' ? path.join(root, 'dist') : root;
const isDist = target !== root;
const needed = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

if (isDist) {
  for (const file of needed) {
    const dest = path.join(target, file);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.copyFileSync(path.join(root, file), dest);
  }
}
function filesInside(directory, base = '') {
  const result = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const rel = path.posix.join(base, entry.name);
    if (entry.isDirectory()) result.push(...filesInside(path.join(directory, entry.name), rel));
    else if (entry.isFile()) result.push(rel);
  }
  return result;
}
let paths;
if (isDist) {
  paths = filesInside(target).filter(file => ![
    'sw.js', 'pwa-assets.json', 'Nachthimmel_v2.html'
  ].includes(file) && !file.endsWith('.map'));
} else {
  paths = ['index.html', ...filesInside(path.join(root, 'src'), 'src'), ...needed]
    .filter(file => /\.(html|css|js|json|webmanifest|png)$/.test(file));
}
paths = [...new Set(paths)].sort();
for (const file of paths) {
  if (!fs.existsSync(path.join(target, file))) throw Error(`PWA asset missing: ${file}`);
}
const hash = crypto.createHash('sha256');
for (const file of paths) {
  hash.update(file);
  hash.update(fs.readFileSync(path.join(target, file)));
}
const version = hash.digest('hex').slice(0, 12);
const list = ['./', ...paths.map(file => './' + file)];
fs.writeFileSync(path.join(target, 'pwa-assets.json'), JSON.stringify(list, null, 2) + '\n');
fs.writeFileSync(path.join(target, 'sw.js'), fs.readFileSync(path.join(root, 'sw.template.js'), 'utf8')
  .replaceAll('__PWA_REVISION__', version));
console.log(`PWA ${isDist ? 'production' : 'source'}: ${paths.length} assets, revision ${version}`);
