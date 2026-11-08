import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCOPE = 'https://example.test/apps/nachthimmel/';
const assets = JSON.parse(fs.readFileSync(path.join(root, 'pwa-assets.json'), 'utf8'));

function harness() {
  const listeners = new Map();
  const stores = new Map();
  let online = true;
  const calls = [];
  const cacheFor = key => {
    if (!stores.has(key)) {
      const entries = new Map();
      stores.set(key, {
        entries,
        async addAll(urls) {
          for (const url of urls) {
            assert.ok(url.startsWith(SCOPE), `Unexpected precache URL: ${url}`);
            entries.set(url, {ok:true, url, content:'app shell'});
          }
        },
        async put(request, response) {entries.set(typeof request === 'string' ? request : request.url, response);},
        async match(request, options = {}) {
          const url = typeof request === 'string' ? request : request.url;
          return entries.get(url) || (options.ignoreSearch
            ? entries.get(url.split('?')[0]) : undefined);
        }
      });
    }
    return stores.get(key);
  };
  const caches = {
    async open(key) {return cacheFor(key);},
    async keys() {return [...stores.keys()];},
    async delete(key) {return stores.delete(key);},
    async match(request, options) {
      for (const cache of stores.values()) {
        const hit = await cache.match(request, options);
        if (hit) return hit;
      }
      return undefined;
    }
  };
  const self = {
    registration: {scope:SCOPE},
    addEventListener(event, callback) {listeners.set(event, callback);},
    async skipWaiting() {},
    clients: {async claim() {}}
  };
  const fetch = async (request) => {
    const url = typeof request === 'string' || request instanceof URL ? String(request) : request.url;
    calls.push(url);
    if (!online) throw new Error('Offline');
    if (url.endsWith('/pwa-assets.json')) return {ok:true, async json(){return assets;}};
    return {ok:true, url, clone(){return this;}};
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'),
    {self, caches, fetch, URL, Response, console}, {filename:'sw.js'});
  const emit = async (name, request) => {
    let job;
    let wasHandled = false;
    const event = {request,
      waitUntil(promise) {job = promise;},
      respondWith(promise) {wasHandled = true; job = promise;}
    };
    listeners.get(name)(event);
    return {wasHandled, response: job ? await job : undefined};
  };
  return {emit, caches, calls, stores, setOffline(){online = false;}};
}

test('SW installs whole first-party shell, cleans old cache and starts offline', async () => {
  const sw = harness();
  sw.stores.set('nachthimmel-v2-shell-old', {entries:new Map()});
  await sw.emit('install');
  const versioned = (await sw.caches.keys()).find(key => key !== 'nachthimmel-v2-shell-old');
  assert.ok(versioned.startsWith('nachthimmel-v2-shell-'));
  const installed = await sw.caches.open(versioned);
  assert.equal(installed.entries.size, assets.length);
  await sw.emit('activate');
  assert.deepEqual(await sw.caches.keys(), [versioned]);
  sw.setOffline();
  const offlineRequest = {method:'GET',mode:'navigate',url:SCOPE,headers:{has(){return false;}}};
  const offline = await sw.emit('fetch', offlineRequest);
  assert.equal(offline.wasHandled, true);
  assert.equal(offline.response.ok, true);
  const cachedJs = await sw.emit('fetch', {method:'GET',mode:'cors',url:SCOPE+'index.html',headers:{has(){return false;}}});
  assert.equal(cachedJs.response.ok, true);
});

test('SW leaves remote APIs, local ADSB proxy and POSTs alone', async () => {
  const sw = harness();
  await sw.emit('install');
  const headers = {has(){return false;}};
  for (const request of [
    {method:'GET',mode:'cors',url:SCOPE+'api/aircraft?lat=52.52&lon=13.405&radius=200',headers},
    {method:'GET',mode:'cors',url:'https://api.adsb.lol/v2/point/52/13/200',headers},
    {method:'GET',mode:'cors',url:'https://images-api.nasa.gov/search?q=orion',headers},
    {method:'POST',mode:'cors',url:SCOPE+'submit',headers}
  ]) {
    const result = await sw.emit('fetch', request);
    assert.equal(result.wasHandled, false, `Should not intercept ${request.url}`);
  }
  assert.ok(!sw.calls.some(url => url.includes('api/aircraft')));
});
