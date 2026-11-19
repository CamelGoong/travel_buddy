// Pure helpers for the day route map (docs/specs/day-route-map/): which places can be drawn,
// how long each leg takes, and where "구글지도에서 길찾기" leads.

import { distanceMeters, estimateTravel, type LatLng, type TravelEstimate } from "@/lib/geo";

import type { Place } from "./course";

export type MapPlace = { index: number; name: string; time: string; lat: number; lng: number };

/** Osaka and the day-trip area around it; searches and typed places outside it are not accepted. */
export const SERVICE_AREA = { minLat: 34.3, maxLat: 35.2, minLng: 134.9, maxLng: 135.9 } as const;

export function inServiceArea(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= SERVICE_AREA.minLat &&
    lat <= SERVICE_AREA.maxLat &&
    lng >= SERVICE_AREA.minLng &&
    lng <= SERVICE_AREA.maxLng
  );
}

/** The day's places that have coordinates, numbered by their position in the day (1-based `index`). */
export function mappablePlaces(places: Place[]): MapPlace[] {
  const out: MapPlace[] = [];
  places.forEach((p, i) => {
    if (p.lat != null && p.lng != null) out.push({ index: i + 1, name: p.name, time: p.time, lat: p.lat, lng: p.lng });
  });
  return out;
}

export type Leg = { from: MapPlace; to: MapPlace; meters: number; estimate: TravelEstimate };

/** Straight-line distance and a rough walk or transit time between neighbouring mapped places. */
export function routeLegs(places: MapPlace[]): Leg[] {
  return places.slice(1).map((to, i) => {
    const from = places[i];
    const meters = distanceMeters(from, to);
    return { from, to, meters, estimate: estimateTravel(meters) };
  });
}

/** "도보 약 3분" or "대중교통 약 35분" */
export function describeLeg(leg: Leg): string {
  return `${leg.estimate.mode === "walk" ? "도보" : "대중교통"} 약 ${leg.estimate.minutes}분`;
}

/** Google Maps directions through every mapped place in order; no API key needed. */
export function googleRouteUrl(places: LatLng[]): string | null {
  if (places.length < 2) return null;
  const point = (p: LatLng) => `${p.lat},${p.lng}`;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", point(places[0]));
  url.searchParams.set("destination", point(places[places.length - 1]));
  if (places.length > 2) url.searchParams.set("waypoints", places.slice(1, -1).map(point).join("|"));
  url.searchParams.set("travelmode", "transit");
  return url.toString();
}
