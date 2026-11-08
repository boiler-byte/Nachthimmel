import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const manifest = JSON.parse(read('manifest.webmanifest'));
test('web manifest is scoped, standalone and has installable icons', () => {
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './index.html');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.theme_color, '#050915');
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192' && icon.purpose === 'any'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'any'));
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    const bytes = fs.readFileSync(path.join(root, icon.src));
    assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a', `PNG ${icon.src}`);
  }
});

test('source precache only lists first-party files that actually exist', () => {
  const assets = JSON.parse(read('pwa-assets.json'));
  assert.ok(assets.includes('./index.html'));
  assert.ok(assets.includes('./src/main.js'));
  assert.ok(assets.includes('./src/pwa-register.js'));
  assert.ok(assets.includes('./icons/icon-192.png'));
  assert.equal(assets.length, new Set(assets).size);
  for (const relative of assets) {
    assert.ok(relative.startsWith('./'), relative);
    assert.ok(!relative.includes('://'), `No third-party requests: ${relative}`);
    assert.ok(!/[?&](api_key|apikey|key)=/i.test(relative), `No API-key URLs: ${relative}`);
    if (relative !== './') assert.ok(fs.existsSync(path.join(root, relative)), relative);
  }
});

test('service worker does not intercept remote API or credential traffic', () => {
  const sw = read('sw.js');
  assert.ok(sw.includes("request.method !== 'GET'"));
  assert.ok(sw.includes("new URL('./api/', SCOPE).pathname"));
  assert.ok(sw.includes('url.origin !== SCOPE.origin'));
  assert.ok(sw.includes("new URL('./pwa-assets.json', SCOPE)"));
  assert.ok(sw.includes('APP_SHELL'));
  assert.ok(sw.includes('caches.delete(key)'));
});

test('app registers service worker and install interface on supported origins', () => {
  assert.ok(read('index.html').includes('<link rel="manifest" href="./manifest.webmanifest">'));
  assert.ok(read('index.html').includes('id="installPwaBtn"'));
  assert.ok(read('src/main.js').includes('registerPwa();'));
  const register = read('src/pwa-register.js');
  assert.ok(register.includes("'beforeinstallprompt'"));
  assert.ok(register.includes("'appinstalled'"));
  assert.ok(register.includes('navigator.serviceWorker.register'));
});
