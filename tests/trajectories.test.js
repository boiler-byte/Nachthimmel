import test from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../src/core/store.js';
import { planetCoordinatesAt, planetObservations } from '../src/features/planets/planets.orbits.js';
import { BODIES, observeBody, moonCoordinatesAt, sunCoordinatesAt } from '../src/features/solar-system/celestial.ephemeris.js';
import { bodyMetrics } from '../src/features/solar-system/celestial.details.js';
import { skyTrack, dailyTrack, clearPathCache } from '../src/features/trajectories/paths.service.js';

const datetime = iso => new Date(iso);

test('Sun positions follow the June and December solstices',()=>{
 const june=sunCoordinatesAt(datetime('2026-06-21T12:00:00Z'));
 const december=sunCoordinatesAt(datetime('2026-12-21T12:00:00Z'));
 assert.ok(june.dec>23 && june.dec<23.6);
 assert.ok(december.dec<-23 && december.dec>-23.6);
 assert.ok(june.ra>88 && june.ra<93);
 assert.ok(december.ra>268 && december.ra<273);
});

test('Moon phase tracks new and full moon without network access',()=>{
 const newMoon=observeBody('moon',datetime('2024-04-08T18:20:00Z'));
 const fullMoon=observeBody('moon',datetime('2024-03-25T07:00:00Z'));
 assert.ok(newMoon.illum<.08,`new moon fraction ${newMoon.illum}`);
 assert.ok(fullMoon.illum>.92,`full moon fraction ${fullMoon.illum}`);
 assert.ok(newMoon.distKm>350000 && newMoon.distKm<410000);
 assert.deepEqual(BODIES.map(b=>b.id),['sun','moon']);
});

test('Sun and Moon have finite topocentric positions for different observers',()=>{
 const d=datetime('2026-11-07T20:30:00Z');
 const original={lat:state.lat,lon:state.lon};
 try{
  const a=observeBody('moon',d),sun=observeBody('sun',d);
  assert.ok([a.ra,a.dec,a.az,a.alt,a.distKm,a.illum,sun.ra,sun.alt].every(Number.isFinite));
  assert.equal(observeBody('invalid',d),null);
  const geocentric=moonCoordinatesAt(d);
  assert.ok(Math.abs(a.ra-geocentric.ra)>.001);
  state.lat=-35;state.lon=149;
  const b=observeBody('moon',d);
  assert.notEqual(a.alt,b.alt);
  assert.ok(bodyMetrics(b).some(entry=>entry[0]==='Mondphase'));
 }finally{state.lat=original.lat;state.lon=original.lon;}
});

test('Planet tracks represent ±30 days against stars and preserve planet observation cache',()=>{
 clearPathCache();
 const d=datetime('2026-11-07T20:30:00Z');
 const before=planetObservations(d);
 const track=skyTrack('planet','mars',d);
 assert.equal(track.spanDays,30);
 assert.equal(track.points.length,121);
 assert.ok(track.points[0].time<d.getTime() && track.points.at(-1).time>d.getTime());
 assert.ok(track.points.every(p=>Number.isFinite(p.ra)&&Number.isFinite(p.dec)));
 assert.strictEqual(planetObservations(d),before,'sampling paths does not disturb live planet cache');
 const current=planetCoordinatesAt('jupiter',d);
 const observed=before.find(p=>p.planet.id==='jupiter');
 assert.ok(Math.abs(current.ra-observed.ra)<1e-10);
});

test('Moon track spans ±7 days and daily arcs include horizon crossings',()=>{
 clearPathCache();
 const d=datetime('2026-11-07T12:00:00Z');
 const moon=skyTrack('body','moon',d);
 assert.equal(moon.spanDays,7);
 assert.equal(moon.points.length,113);
 assert.ok(Math.abs(moon.points[0].ra-moon.points.at(-1).ra)>30);
 const sun=dailyTrack('sun',d);
 assert.ok(sun.points.length>=90);
 assert.ok(sun.points.some(x=>x.alt>0) && sun.points.some(x=>x.alt<0));
 assert.ok(sun.points.every((x,i,a)=>i===0||a[i-1].time<x.time));
 const moonDay=dailyTrack('moon',d);
 assert.ok(moonDay.points.length>=90);
});

test('Layer defaults avoid drawing all paths at once',()=>{
 assert.equal(state.layers.sunMoon,true);
 assert.equal(state.layers.planetPaths,false);
 assert.equal(state.layers.sunPath,false);
 assert.equal(state.layers.moonPath,false);
 assert.equal(state.layers.pathArrows,true);
 assert.equal(state.layers.selectedPath,true);
});
