const EARTH_RADIUS_KM = 6371;

/**
 * Generate a random circle center that is NOT on the target location
 * but guarantees the target is within the circle's radius.
 *
 * The center is placed 10-90km from the target in a random direction,
 * ensuring there's always at least 10km buffer on each side.
 */
export function generateHintCircleCenter(
  targetLat: number,
  targetLng: number,
  radiusKm: number = 100
): { lat: number; lng: number } {
  // Place center 10-90km from target (leaving 10km buffer)
  const minDistance = 10;
  const maxDistance = radiusKm - 10;
  const randomDistance = minDistance + Math.random() * (maxDistance - minDistance);
  const randomBearing = Math.random() * 360;

  // Convert to radians
  const lat1 = (targetLat * Math.PI) / 180;
  const lng1 = (targetLng * Math.PI) / 180;
  const bearing = (randomBearing * Math.PI) / 180;
  const angularDistance = randomDistance / EARTH_RADIUS_KM;

  // Calculate destination point using Haversine inverse formula
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );

  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  );

  // Convert back to degrees
  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI,
  };
}

export const HINT_CIRCLE_RADIUS_KM = 125;
