/** Persist only user choices, never live catalogues, API requests or selection state. */
export const PREFERENCES_KEY = 'nachthimmelApp';
export const PREFERENCES_VERSION = 1;

const LAYER_KEYS = Object.freeze([
  'stars', 'planets', 'sunMoon', 'constellations', 'deepSky', 'satellites', 'aircraft',
  'planetPaths', 'sunPath', 'moonPath', 'pathArrows', 'selectedPath'
]);

const isCoordinate = (value, maximum) => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= maximum;
const validName = value => typeof value === 'string' && value.trim() && value.length <= 140;

/** Values read from storage are treated as untrusted input. */
export function restorePreferences(state, storage) {
  try {
    const store = storage ?? globalThis.localStorage;
    const raw = store?.getItem?.(PREFERENCES_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved) || saved.version !== PREFERENCES_VERSION) return false;

    if (saved.layers && typeof saved.layers === 'object' && !Array.isArray(saved.layers)) {
      for (const key of LAYER_KEYS) {
        if (typeof saved.layers[key] === 'boolean') state.layers[key] = saved.layers[key];
      }
    }
    const location = saved.location;
    if (location && isCoordinate(location.lat, 90) && isCoordinate(location.lon, 180)) {
      state.lat = location.lat;
      state.lon = location.lon;
      state.place = validName(location.place)
        ? location.place.trim()
        : `${location.lat.toFixed(3)}°, ${location.lon.toFixed(3)}°`;
      const resolved = location.resolved;
      if (resolved && isCoordinate(resolved.lat, 90) && isCoordinate(resolved.lon, 180)
        && validName(resolved.name)) {
        state.placeLookup = {
          lat: resolved.lat, lon: resolved.lon, name: resolved.name.trim(),
          at: Number.isFinite(resolved.at) && resolved.at >= 0 ? resolved.at : 0
        };
      }
    }
    if (typeof saved.mag === 'number' && Number.isFinite(saved.mag) && saved.mag >= 2 && saved.mag <= 6) {
      state.mag = Math.round(saved.mag * 4) / 4;
    }
    const max = saved.aircraftMaxDistanceKm;
    if (typeof max === 'number' && Number.isFinite(max) && max >= 25 && max <= 370) {
      state.aircraftMaxDistanceKm = 25 + Math.round((max - 25) / 5) * 5;
    }
    return true;
  } catch {
    // Storage can be disabled or JSON can be corrupted. Keep healthy defaults.
    return false;
  }
}

export function preferenceSnapshot(state) {
  const layers = {};
  for (const key of LAYER_KEYS) layers[key] = Boolean(state.layers[key]);
  const location = { lat: state.lat, lon: state.lon, place: state.place };
  const savedName = state.placeLookup;
  if (savedName && isCoordinate(savedName.lat, 90) && isCoordinate(savedName.lon, 180)
      && validName(savedName.name)) {
    location.resolved = {
      lat: savedName.lat, lon: savedName.lon, name: savedName.name,
      at: Number.isFinite(savedName.at) ? savedName.at : 0
    };
  }
  return {
    version: PREFERENCES_VERSION,
    layers, location, mag: state.mag,
    aircraftMaxDistanceKm: state.aircraftMaxDistanceKm
  };
}

export function savePreferences(state, storage) {
  try {
    const store = storage ?? globalThis.localStorage;
    if (!store?.setItem) return false;
    store.setItem(PREFERENCES_KEY, JSON.stringify(preferenceSnapshot(state)));
    return true;
  } catch {
    // Do not prevent an observer change when private browsing / quotas disable storage.
    return false;
  }
}
