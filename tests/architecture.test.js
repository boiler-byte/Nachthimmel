import test from 'node:test';
import assert from 'node:assert/strict';
import { RAD, DEG, clamp, wrap } from '../src/core/math.js';
import { state } from '../src/core/store.js';
import { radecToHorizontal, timestampToSidereal } from '../src/core/astronomy.js';
import { getDate, aircraftAtLiveTime } from '../src/core/clock.js';
import { jplHeliocentric, planetObservations, invalidatePlanetCache } from '../src/features/planets/planets.orbits.js';
import { ecef, aircraftHorizontal, predictAircraft } from '../src/features/aircraft/aircraft.positions.js';
import { SkyRenderer } from '../src/engine/sky-renderer.js';

test('mathematical helpers preserve angle semantics',()=>{
 assert.equal(wrap(-10),350);
 assert.equal(wrap(370),10);
 assert.equal(clamp(122,-90,90),90);
 assert.ok(Math.abs(RAD*DEG-1)<1e-12);
});

test('sidereal and celestial position computations are finite',()=>{
 const d=new Date('2026-11-07T20:30:00Z');
 const sid=timestampToSidereal(d);
 assert.ok(sid>=0 && sid<360);
 const p=radecToHorizontal(0,90,sid);
 assert.ok(Math.abs(p.alt-state.lat)<1e-8);
 assert.ok(p.az>=0 && p.az<360);
});

test('time controls reflect live observation state',()=>{
 const oldOffset=state.offsetMs,oldPlaying=state.playing;
 try{
  state.offsetMs=0;state.playing=false;
  assert.ok(aircraftAtLiveTime());
  assert.ok(Math.abs(getDate().getTime()-Date.now())<2500);
  state.offsetMs=3600000;
  assert.equal(aircraftAtLiveTime(),false);
 }finally{state.offsetMs=oldOffset;state.playing=oldPlaying;}
});

test('all seven planet ephemerides are sensible and invalidate on observer move',()=>{
 const ep=jplHeliocentric('mars',0);
 assert.ok(ep.r>1 && ep.r<2);
 const d=new Date('2026-11-07T20:30:00Z');
 const results=planetObservations(d);
 assert.deepEqual(results.map(x=>x.planet.id),['mercury','venus','mars','jupiter','saturn','uranus','neptune']);
 assert.ok(results.every(x=>[x.ra,x.dec,x.az,x.alt,x.dist,x.illum].every(Number.isFinite)));
 assert.ok(results.every(x=>x.ra>=0 && x.ra<360 && x.dec>=-90 && x.dec<=90));
 assert.ok(results.every(x=>x.dist>0 && x.illum>=0 && x.illum<=1));
 const oldLat=state.lat;
 try{
  state.lat=oldLat+7;invalidatePlanetCache();
  const newResults=planetObservations(d);
  assert.notEqual(newResults[0].alt,results[0].alt);
 }finally{state.lat=oldLat;invalidatePlanetCache();}
});

test('aircraft location math and stale-data policies',()=>{
 assert.equal(ecef(0,0,0).length,3);
 const h=aircraftHorizontal(state.lat,state.lon,10000);
 assert.ok(h.alt>85);
 assert.ok(h.range>9 && h.range<11);
 const now=Date.now();
 const current={lat:state.lat+.25,lon:state.lon+.25,altitude:10000,
  track:90,speed:240,positionTime:now,verticalRate:0};
 assert.ok(Number.isFinite(predictAircraft(current,now).az));
 assert.equal(predictAircraft({...current,positionTime:now-4*60*1000},now),null);
});

test('sky layer registry keeps explicit drawing order and layer visibility',()=>{
 const drawn=[],engine=new SkyRenderer();
 engine.register({id:'background',draw:()=>drawn.push('background')});
 engine.register({id:'stars',visible:()=>false,draw:()=>drawn.push('stars')});
 engine.register({id:'planets',draw:({date})=>drawn.push(date)});
 engine.render({date:'2026-11-07'});
 assert.deepEqual(drawn,['background','2026-11-07']);
 assert.deepEqual(engine.ids,['background','stars','planets']);
 assert.throws(()=>engine.register({id:'stars',draw:()=>{}}),/duplicate/);
});
