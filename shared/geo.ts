import type { City, DiscoveryLocation } from "./contracts.ts";

export function formatDistance(value: number): string {
  return value < 1 ? "<1 km" : `±${value.toLocaleString("id-ID")} km`;
}

export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const radians = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * radians;
  const dLon = (b.longitude - a.longitude) * radians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * radians) *
      Math.cos(b.latitude * radians) *
      Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

function inRing(
  latitude: number,
  longitude: number,
  ring: number[][],
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = ring[i]!;
    const [px, py] = ring[j]!;
    if (
      y! > latitude !== py! > latitude &&
      longitude < ((px! - x!) * (latitude - y!)) / (py! - y!) + x!
    )
      inside = !inside;
  }
  return inside;
}

export function inCity(
  city: City,
  latitude: number,
  longitude: number,
): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return city.boundary.coordinates.some(
    ([outer, ...holes]) =>
      !!outer &&
      inRing(latitude, longitude, outer) &&
      !holes.some((ring) => inRing(latitude, longitude, ring)),
  );
}

export function locationFresh(
  location: DiscoveryLocation | null,
  now = Date.now(),
): boolean {
  if (!location) return false;
  const age = now - Date.parse(location.capturedAt);
  return Number.isFinite(age) && age >= -60000 && age < 30 * 60000;
}

export function validateLocation(
  input: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    capturedAt: string;
  },
  now = Date.now(),
): void {
  if (
    ![input.latitude, input.longitude, input.accuracyMeters].every(
      Number.isFinite,
    ) ||
    Math.abs(input.latitude) > 90 ||
    Math.abs(input.longitude) > 180 ||
    input.accuracyMeters < 0
  )
    throw new Error("LOCATION_REQUIRED");
  if (input.accuracyMeters > 1000) throw new Error("LOCATION_INACCURATE");
  const age = now - Date.parse(input.capturedAt);
  if (!Number.isFinite(age) || age < -60000 || age > 5 * 60000)
    throw new Error("LOCATION_STALE");
}

export function validateReview(score: number, comment: string): void {
  if (
    !Number.isInteger(score) ||
    score < 1 ||
    score > 5 ||
    comment.length > 300 ||
    /https?:|www\.|\+?\d[\d\s()-]{7,}/i.test(comment)
  )
    throw new Error("REVIEW_INVALID");
}
