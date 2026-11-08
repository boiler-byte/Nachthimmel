import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAircraftStates, aircraftProxyURL, AIRCRAFT_POLL_MS } from '../src/features/aircraft/adsb.service.js';
import { onRequestGet, validateRequest } from '../functions/api/aircraft.js';

const now = Date.parse('2026-11-08T09:00:00Z');
const sample = { hex: '3C4B5A', flight: 'DLH123 ', r: 'D-ABCD', t: 'A320',
  lat: 52.51, lon: 13.41, alt_baro: 28900, alt_geom: 30000,
  gs: 250, track: 270, geom_rate: 600, seen_pos: 8, squawk: '1234' };

test('ADSB.lol records normalize to SI with valid observation time', () => {
  const records = parseAircraftStates({ now, ac: [sample] }, now);
  assert.equal(records.size, 1);
  const a = records.get('3c4b5a');
  assert.equal(a.callsign, 'DLH123');
  assert.equal(a.registration, 'D-ABCD');
  assert.equal(a.type, 'A320');
  assert.equal(a.altitude, 9144);
  assert.ok(Math.abs(a.speed - 128.611) < .01);
  assert.ok(Math.abs(a.verticalRate - 3.048) < .001);
  assert.equal(a.positionTime, now - 8000);
  assert.equal(a.track, 270);
  assert.equal(AIRCRAFT_POLL_MS, 90_000);
});

test('ADSB.lol parser excludes ground reports, expired or malformed locations', () => {
  const ac = [
    {...sample, hex:'3c4b5b', alt_baro:'ground'},
    {...sample, hex:'3c4b5c', seen_pos:130},
    {...sample, hex:'3c4b5d', lat:200},
    {...sample, hex:'wrong'},
    {...sample, hex:'3c4b5e', alt_geom:null, alt_baro:10000, gs:null, track:null, geom_rate:null, baro_rate:null},
    {...sample, hex:'3c4b5f', lat:null},
  ];
  const records = parseAircraftStates({now, ac}, now);
  assert.equal(records.size, 1);
  assert.ok(Math.abs(records.get('3c4b5e').altitude-3048)<1e-10);
  assert.equal(records.get('3c4b5e').speed,null);
  assert.throws(()=>parseAircraftStates({response: []},now),/Ungültige/);
});

test('browser only calls same-origin proxy, with a bounded search radius', () => {
  const url = aircraftProxyURL('https://example.org/app/',52.52,13.405);
  assert.equal(url.origin,'https://example.org');
  assert.equal(url.pathname,'/app/api/aircraft');
  assert.equal(url.searchParams.get('radius'),'200');
  assert.equal(url.searchParams.get('lat'),'52.5200');
  assert.throws(()=>aircraftProxyURL('file:///home/user/index.html',52.5,13.4),/HTTPS oder localhost/);
});

test('proxy validation bounds coordinates and prevents arbitrary upstream URLs', async () => {
  const valid = validateRequest(new Request('https://local.test/api/aircraft?lat=52.52&lon=13.405&radius=200'));
  assert.deepEqual(valid, {lat:52.52,lon:13.405,radius:200});
  for(const input of [
    '?lat=100&lon=13&radius=200', '?lat=51&lon=13&radius=251',
    '?lat=51&lon=https://evil.test&radius=20', '?lat=51&lon=13',
    '?lat=Infinity&lon=13&radius=5', '?lat=51&lon=13&radius=0'
  ]){
    const request = new Request('https://local.test/api/aircraft'+input);
    assert.equal(validateRequest(request),null);
    const answer=await onRequestGet({request});
    assert.equal(answer.status,400);
  }
});

test('Cloudflare Pages proxy returns compatible JSON and propagates throttling', async () => {
  const originalFetch=globalThis.fetch;
  const calls=[];
  try {
    globalThis.fetch=async (url, opts)=>{
      calls.push({url,opts});
      return Response.json({now,ac:[sample]});
    };
    const response=await onRequestGet({request:new Request('https://local.test/api/aircraft?lat=52.52&lon=13.4&radius=200')});
    assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal((await response.json()).ac[0].hex,sample.hex);
    assert.equal(calls.length,1);
    assert.equal(calls[0].url,'https://api.adsb.lol/v2/lat/52.52/lon/13.4/dist/200');
    assert.ok(calls[0].opts.signal);
    globalThis.fetch=async()=>Response.json({error:'Too many requests'},{status:429});
    const throttle=await onRequestGet({request:new Request('https://local.test/api/aircraft?lat=52.52&lon=13.4&radius=200')});
    assert.equal(throttle.status,429);
    assert.match((await throttle.json()).error,/429/);
  } finally {globalThis.fetch=originalFetch;}
});
