/** Great-circle distance between two geographic coordinates, in kilometres. */
export function geoDistanceKm(lat1, lon1, lat2, lon2) {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return NaN;
  const toRad = Math.PI / 180;
  const a = (lat2 - lat1) * toRad / 2;
  const b = (lon2 - lon1) * toRad / 2;
  const h = Math.sin(a) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(b) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
