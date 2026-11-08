import test from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../src/core/store.js';
import { AIRCRAFT_MIN_DISTANCE_KM, AIRCRAFT_MAX_DISTANCE_KM, aircraftGroundDistanceKm, withinAircraftDistance } from '../src/features/aircraft/aircraft.distance.js';
import { aircraftMetrics, aircraftPhotoHTML, aircraftSketch } from '../src/features/aircraft/aircraft.details.js';

test('distance uses observer coordinates and correctly handles the date line', () => {
  assert.equal(aircraftGroundDistanceKm(52.52,13.405,52.52,13.405),0);
  assert.ok(Math.abs(aircraftGroundDistanceKm(0,1,0,0)-111.195)<0.02);
  assert.ok(Math.abs(aircraftGroundDistanceKm(0,179.5,0,-179.5)-111.195)<0.02);
  assert.ok(Number.isNaN(aircraftGroundDistanceKm(NaN,0,0,0)));
});

test('100km default filter includes nearby aircraft, excludes distant, cap remains within 200nm proxy radius', () => {
  state.lat=0;state.lon=0;state.aircraftMaxDistanceKm=100;
  assert.equal(AIRCRAFT_MIN_DISTANCE_KM,25);
  assert.equal(AIRCRAFT_MAX_DISTANCE_KM,370);
  assert.equal(withinAircraftDistance(0,.3),true);
  assert.equal(withinAircraftDistance(0,1.2),false);
  state.aircraftMaxDistanceKm=370;
  assert.equal(withinAircraftDistance(0,3),true);
  assert.equal(withinAircraftDistance(0,3.4),false);
  assert.equal(370 < 200*1.852,true);
});

test('aircraft detail metrics separate ground distance from line-of-sight range', () => {
  state.lat=52.52;state.lon=13.405;
  const item={id:'3c4b5a',callsign:'DLH123',registration:'D-TEST',type:'A320',speed:125,track:270,verticalRate:-3,positionTime:1_000_000,squawk:'1234'};
  const position={lat:52.52,lon:14,range:44,altitude:11000,az:90,alt:15};
  const metrics=new Map(aircraftMetrics(item,position,1_020_000));
  assert.match(metrics.get('Zum Standort (horizontal)'),/40[,.]/);
  assert.match(metrics.get('Direkte Entfernung'),/44,0 km/);
  assert.equal(metrics.get('Geschwindigkeit'),'450 km/h');
  assert.equal(metrics.get('Flugrichtung'),'270,0° (W)');
  assert.equal(metrics.get('Steigen / Sinken'),'-180 m/min');
  assert.equal(metrics.get('Letzte Position'),'20 s zuvor');
  assert.equal(metrics.get('Kennzeichen'),'D-TEST');
});

test('optional photo embeds validated ICAO address and includes fallback for missing photos', () => {
  const html=aircraftPhotoHTML({id:'3c4b5a',registration:'D-&ABCD'});
  assert.match(html,/hexdb\.io\/api\/v2\/aircraft\/3c4b5a\/image\/thumbnail/);
  assert.match(html,/D-&amp;ABCD/);
  assert.match(html,/FOTO:/);
  assert.equal(aircraftPhotoHTML({id:'bad/<script>'}),aircraftSketch());
});
