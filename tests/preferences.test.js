import test from 'node:test';
import assert from 'node:assert/strict';
import { restorePreferences, savePreferences, preferenceSnapshot, PREFERENCES_KEY }
  from '../src/core/preferences.js';
import { geoDistanceKm } from '../src/core/geo.js';
import {
  cachedPlaceName, parsePlaceName, reversePlaceURL, fetchPlaceName,
  schedulePlaceName, cancelPlaceName, PLACE_LOOKUP_DISTANCE_KM
} from '../src/services/place-name.service.js';

const freshState = () => ({
  lat: 52.52, lon: 13.405, place: 'Berlin, Deutschland', mag: 6,
  aircraftMaxDistanceKm: 100, placeLookup: null,
  layers: {
    stars:true,planets:true,sunMoon:true,constellations:true,deepSky:true,
    satellites:true,aircraft:false,planetPaths:false,sunPath:false,moonPath:false,
    pathArrows:true,selectedPath:true
  },
  satellites: [{ id: 'not-persisted' }], aircraftAbort: { fake: true }, selected: { id: 'not-persisted' }
});
const makeStorage = () => {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    clear() { values.clear(); }
  };
};

test('settings are serialized into exactly one localStorage.nachthimmelApp JSON value', () => {
  const storage = makeStorage();
  const st = freshState();
  st.lat = 53.628; st.lon = 11.416; st.place = 'Schwerin, Deutschland';
  st.mag = 4.25; st.aircraftMaxDistanceKm = 150;
  st.layers.aircraft = true; st.layers.planetPaths = true; st.layers.stars = false;
  st.placeLookup = { lat:53.628, lon:11.416, name:st.place, at:1234567 };
  assert.equal(savePreferences(st, storage), true);
  const stored = JSON.parse(storage.getItem(PREFERENCES_KEY));
  assert.equal(stored.version, 1);
  assert.equal(stored.layers.aircraft, true);
  assert.equal(stored.layers.stars, false);
  assert.equal(stored.layers.planetPaths, true);
  assert.deepEqual(stored.location, {
    lat: 53.628, lon: 11.416, place: 'Schwerin, Deutschland',
    resolved: {lat:53.628,lon:11.416,name:'Schwerin, Deutschland',at:1234567}
  });
  assert.equal(stored.mag, 4.25);
  assert.equal(stored.aircraftMaxDistanceKm, 150);
  assert(!('satellites' in stored) && !('selected' in stored) && !('aircraftAbort' in stored));
  const restored = freshState();
  assert.equal(restorePreferences(restored, storage), true);
  assert.equal(restored.place, 'Schwerin, Deutschland');
  assert.equal(restored.lat, 53.628);
  assert.equal(restored.mag, 4.25);
  assert.equal(restored.aircraftMaxDistanceKm, 150);
  assert.equal(restored.layers.aircraft, true);
  assert.equal(restored.layers.stars, false);
  assert.equal(restored.layers.planetPaths, true);
  assert.deepEqual(restored.placeLookup, st.placeLookup);
});

test('invalid/corrupt stored settings do not break bootstrap or inject unknown properties', () => {
  const storage = makeStorage();
  const initial = freshState();
  storage.setItem(PREFERENCES_KEY, '{bad');
  assert.equal(restorePreferences(initial, storage), false);
  assert.equal(initial.place, 'Berlin, Deutschland');
  storage.setItem(PREFERENCES_KEY, JSON.stringify({
    version: 1, location: {lat:1000,lon:13,place:'wrong'},
    mag: -10, aircraftMaxDistanceKm:100000,
    layers: {stars:'false',planetPaths:true,unknown:true}
  }));
  assert.equal(restorePreferences(initial, storage), true);
  assert.equal(initial.lat, 52.52);
  assert.equal(initial.mag, 6);
  assert.equal(initial.aircraftMaxDistanceKm, 100);
  assert.equal(initial.layers.stars, true);
  assert.equal(initial.layers.planetPaths, true);
  assert.equal(Object.hasOwn(initial.layers, 'unknown'), false);
  assert.equal(preferenceSnapshot(initial).version, 1);
});

test('disabled storage does not prevent changes and keeps defaults', () => {
  const storage = { getItem() { throw Error('SecurityError'); }, setItem() { throw Error('QuotaExceeded'); } };
  assert.equal(restorePreferences(freshState(), storage), false);
  assert.equal(savePreferences(freshState(), storage), false);
});

test('place-name cache is reused only within one kilometre, including across longitude wrap', () => {
  const old = {lat:53.628,lon:11.416,name:'Schwerin, Deutschland'};
  assert.equal(PLACE_LOOKUP_DISTANCE_KM, 1);
  assert(geoDistanceKm(53.628,11.416,53.634,11.416)<1);
  assert(geoDistanceKm(53.628,11.416,53.64,11.416)>1);
  assert.equal(cachedPlaceName(old, 53.634, 11.416), 'Schwerin, Deutschland');
  assert.equal(cachedPlaceName(old, 53.64, 11.416), null);
  assert(geoDistanceKm(50,179.999,50,-179.999)<1);
});

test('Nominatim uses city-scale reverse geocoding and extracts a concise place name', async () => {
  const url = reversePlaceURL(53.628,11.416);
  assert.equal(url.origin, 'https://nominatim.openstreetmap.org');
  assert.equal(url.searchParams.get('zoom'), '13');
  assert.equal(url.searchParams.get('addressdetails'), '1');
  assert.equal(url.searchParams.get('accept-language'), 'de');
  assert.equal(parsePlaceName({ address: {city:'Schwerin', country:'Deutschland',road:'Straße'} }), 'Schwerin, Deutschland');
  assert.equal(parsePlaceName({ address: {village:'Dorf',country:'Deutschland'} }), 'Dorf, Deutschland');
  assert.equal(parsePlaceName({ error:'Unable to geocode' }), null);
  const result = await fetchPlaceName(53.628,11.416,async (requested, options) => {
    assert(requested.href.includes('format=jsonv2'));
    assert.equal(options.headers.Accept, 'application/json');
    return {ok:true,json:async()=>({address:{town:'Beispielstadt',country:'Deutschland'}})};
  });
  assert.equal(result,'Beispielstadt, Deutschland');
  assert.equal(await fetchPlaceName(0,0,async()=>({ok:false})),null);
});

test('async reverse lookup updates only current location and cancels outdated lookups', async () => {
  const original = {fetch:globalThis.fetch, setTimeout:globalThis.setTimeout, clearTimeout:globalThis.clearTimeout};
  let id=0;
  const queue=new Map();
  try {
    globalThis.setTimeout=(callback,ms)=>{const key=++id;queue.set(key,{callback,ms});return key;};
    globalThis.clearTimeout=key=>queue.delete(key);
    const applied=[];
    globalThis.fetch=async()=>({ok:true,json:async()=>({address:{city:'Schwerin',country:'Deutschland'}})});
    schedulePlaceName(53.628,11.416,(...args)=>applied.push(args));
    assert.equal(queue.size,1);
    assert([...queue.values()][0].ms>=350);
    const first=[...queue.entries()][0];queue.delete(first[0]);
    await first[1].callback();
    assert.deepEqual(applied, [['Schwerin, Deutschland',53.628,11.416]]);
    schedulePlaceName(53.700,11.416,(...args)=>applied.push(args));
    assert.equal(queue.size,1);
    assert([...queue.values()][0].ms>1000,'Second request has a conservative cooldown');
    cancelPlaceName();
    assert.equal(queue.size,0,'Canceled request never runs');
  } finally {
    cancelPlaceName();
    globalThis.fetch=original.fetch;
    globalThis.setTimeout=original.setTimeout;
    globalThis.clearTimeout=original.clearTimeout;
  }
});
