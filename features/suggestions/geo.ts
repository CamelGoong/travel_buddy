export type LatLng = { lat: number; lng: number };

/** Great-circle distance in meters. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type TravelEstimate = { mode: "walk" | "transit"; minutes: number };

const WALK_METERS_PER_MIN = 80;

/** Rough travel time from straight-line distance: walk under 1km, transit beyond. */
export function estimateTravel(meters: number): TravelEstimate {
  if (meters < 1000) {
    return { mode: "walk", minutes: Math.max(1, Math.ceil(meters / WALK_METERS_PER_MIN)) };
  }
  // Waiting, transfers and walking to stations dominate short city hops.
  return { mode: "transit", minutes: Math.round(8 + (meters / 1000) * 2.5) };
}

export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / WALK_METERS_PER_MIN));
}

/** "🚶 7분" or "🚇 약 12분" */
export function formatEstimate(estimate: TravelEstimate): string {
  return estimate.mode === "walk" ? `🚶 ${estimate.minutes}분` : `🚇 약 ${estimate.minutes}분`;
}

/** Google Maps directions from the current location; no API key needed. */
export function mapsDirectionsUrl(
  to: Partial<LatLng> & { name?: string },
  mode: "transit" | "walking",
): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  // A typed-in place has no coordinates: let the map app search its name.
  const hasCoords = to.lat != null && to.lng != null;
  url.searchParams.set("destination", hasCoords ? `${to.lat},${to.lng}` : `${to.name ?? ""} 오사카`);
  url.searchParams.set("travelmode", mode);
  return url.toString();
}
