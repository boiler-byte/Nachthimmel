/* Nachthimmel v2 PWA service worker. Revision is generated from local app assets. */
'use strict';

const CACHE_PREFIX = 'nachthimmel-v2-shell-';
const CACHE_NAME = CACHE_PREFIX + '360ef3aa7980';
const SCOPE = new URL(self.registration.scope);
const APP_SHELL = new URL('./index.html', SCOPE).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // Only first-party app-shell files are precached. Live API responses are not cached.
    const listUrl = new URL('./pwa-assets.json', SCOPE);
    const response = await fetch(listUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error('PWA asset list unavailable: ' + response.status);
    const list = await response.json();
    if (!Array.isArray(list) || !list.length) throw new Error('PWA asset list is empty');
    const urls = list.map(relative => new URL(relative, SCOPE).href);
    if (urls.some(url => !url.startsWith(SCOPE.href))) throw new Error('PWA asset outside app scope');
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Do not intercept third-party APIs, images, fonts or CDN imports.
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  if (request.headers.has('range')) return;
  // API requests are always network-only, even if their path is within the PWA scope.
  if (url.pathname.startsWith(new URL('./api/', SCOPE).pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && !url.search && (url.pathname === SCOPE.pathname || url.pathname === new URL('./index.html', SCOPE).pathname)) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        return await caches.match(request, {ignoreSearch: true})
          || await caches.match(APP_SHELL)
          || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    return await fetch(request);
  })());
});
