/** Shared v2 application state. This compatibility facade is intentionally flat. */
export const state = {
  // Observer and camera
  lat: 52.52, lon: 13.405, place: 'Berlin, Deutschland',
  az: 206, alt: 46, fov: 94, mag: 6,
  aircraftMaxDistanceKm: 100, // Horizontal distance filter in kilometres (25..370).

  // View and simulation
  layers: {
    stars:true, planets:true, sunMoon:true, constellations:true,
    deepSky:true, satellites:true, aircraft:false,
    planetPaths:false, sunPath:false, moonPath:false,
    pathArrows:true, selectedPath:true
  },
  motion: false, sensorRelative: false,
  playing: false, playStart: 0, offsetMs: 0, selected: null,

  // Catalogue status and fallback data (populated by app.js and services)
  starsLoaded: false, constLoaded: false, satLoaded: false, aircraftLoaded: false,
  stars: [], names: {}, constellations: [], lines: [], satellites: [], aircraft: [],
  catalogError: false, satError: false,

  // Satellite prediction cache
  satRender: [], lastSatCompute: 0, lastSatDate: 0, lastSatLabel: 0,

  // ADSB.lol proxy polling lifecycle (no API key required)
  aircraftError: false, aircraftLoading: false,
  aircraftFetchedAt: 0, aircraftDataTime: 0, aircraftNextAt: 0,
  aircraftRequestVersion: 0, aircraftAbort: null, aircraftErrorReason: '',
};
