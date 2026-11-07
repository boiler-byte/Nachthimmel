/**
 * Single source of truth for canvas compositing order.
 * These adapters keep the existing proven feature drawing code intact.
 */
import { state } from '../core/store.js';
import { background, drawBelowHorizon, drawGrid } from './background.js';
import { SkyRenderer } from './sky-renderer.js';
import { drawGalaxyDust, drawStars, drawSelectedStarHalo } from '../features/stars/stars.layer.js';
import { drawConstellations } from '../features/constellations/constellations.layer.js';
import { drawDeepSky } from '../features/deep-sky/deep-sky.layer.js';
import { drawPlanets } from '../features/planets/planets.layer.js';
import { drawSunMoon } from '../features/solar-system/celestial.layer.js';
import { drawPlanetPaths, drawSunPath, drawMoonPath, drawSelectedPath } from '../features/trajectories/paths.layer.js';
import { drawSatellites } from '../features/satellites/satellites.layer.js';
import { drawAircraft } from '../features/aircraft/aircraft.layer.js';

export const skyRenderer = new SkyRenderer()
  .register({id:'background', draw:background})
  .register({id:'grid', draw:drawGrid})
  .register({id:'galactic-dust', visible:()=>state.layers.stars, draw:drawGalaxyDust})
  .register({id:'constellations', visible:()=>state.layers.constellations, draw:drawConstellations})
  .register({id:'stars', visible:()=>state.layers.stars, draw:drawStars})
  .register({id:'deepSky', visible:()=>state.layers.deepSky, draw:drawDeepSky})
  .register({id:'planet-paths', visible:()=>state.layers.planetPaths, draw:({date})=>drawPlanetPaths(date)})
  .register({id:'sun-path', visible:()=>state.layers.sunPath&&state.layers.sunMoon, draw:({date})=>drawSunPath(date)})
  .register({id:'moon-path', visible:()=>state.layers.moonPath&&state.layers.sunMoon, draw:({date})=>drawMoonPath(date)})
  .register({id:'selected-path', visible:()=>state.layers.selectedPath, draw:({date})=>drawSelectedPath(date)})
  .register({id:'planets', visible:()=>state.layers.planets, draw:({date})=>drawPlanets(date)})
  .register({id:'sun-moon', visible:()=>state.layers.sunMoon, draw:({date})=>drawSunMoon(date)})
  .register({id:'horizon', draw:drawBelowHorizon})
  .register({id:'satellites', visible:()=>state.layers.satellites, draw:({date})=>drawSatellites(date)})
  .register({id:'aircraft', visible:()=>state.layers.aircraft, draw:drawAircraft})
  .register({id:'selection-halo', visible:()=>state.layers.stars, draw:drawSelectedStarHalo});
