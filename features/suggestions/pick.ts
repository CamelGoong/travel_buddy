import { distanceMeters, estimateTravel, walkingMinutes, type LatLng, type TravelEstimate } from "./geo";

// Which single proactive suggestion to show now (docs/specs/osaka-contextual-suggestions/).

export type SuggestionKind = "morning" | "evening" | "next_place" | "expense" | "location" | "nearby";

export type LocationPermission = "granted" | "denied" | "prompt" | "unknown";

export type TimedPlace = LatLng & { name: string; time: string };
export type Spot = LatLng & { key: string; name: string };

export type NearbySpot = Spot & { meters: number; walkMinutes: number };

export type Suggestion =
  | { kind: "morning"; context: "" }
  | { kind: "evening"; context: "" }
  | {
      kind: "next_place";
      context: string;
      place: TimedPlace;
      estimate: TravelEstimate | null;
      trigger: "time" | "arrival";
    }
  | { kind: "expense"; context: "lunch" | "dinner" }
  | { kind: "location"; context: "" }
  | { kind: "nearby"; context: string; spots: NearbySpot[] };

export const EVENING_FROM = "20:00";
export const NEXT_PLACE_LEAD_MIN = 30;
export const ARRIVAL_RADIUS_M = 200;
export const NEARBY_RADIUS_M = 1000;
export const NEARBY_COOLDOWN_MIN = 120;
const MEAL_WINDOWS = {
  lunch: ["13:30", "16:00"],
  dinner: ["19:30", "23:00"],
} as const;

export type PickInput = {
  /** Osaka local now */
  nowDate: string;
  nowTime: string;
  todayIsTripDay: boolean;
  tomorrowIsTripDay: boolean;
  /** True only on the day screen for today's day */
  onTodayDayScreen: boolean;
  todayPlaces: TimedPlace[];
  spots: Spot[];
  location: LatLng | null;
  permission: LocationPermission;
  /** Suggestions resolved today, as `${kind}:${context}` */
  resolvedToday: ReadonlySet<string>;
  /** Osaka local 'YYYY-MM-DDTHH:MM' of the latest nearby resolution, if any */
  lastNearbyAt: string | null;
};

const key = (kind: SuggestionKind, context = "") => `${kind}:${context}`;

function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function localMinutes(local: string): number {
  const [date, time] = local.split("T");
  return Date.parse(`${date}T00:00:00Z`) / 60_000 + minutesOf(time);
}

function nextPlace(input: PickInput): Suggestion | null {
  const places = input.todayPlaces;
  const now = minutesOf(input.nowTime);
  const candidates: { index: number; trigger: "time" | "arrival" }[] = [];

  if (input.location) {
    places.forEach((p, i) => {
      if (i + 1 < places.length && distanceMeters(input.location!, p) <= ARRIVAL_RADIUS_M) {
        candidates.push({ index: i + 1, trigger: "arrival" });
      }
    });
  }
  places.forEach((p, i) => {
    const at = minutesOf(p.time);
    if (now >= at - NEXT_PLACE_LEAD_MIN && now <= at) candidates.push({ index: i, trigger: "time" });
  });

  for (const c of candidates) {
    if (input.resolvedToday.has(key("next_place", String(c.index)))) continue;
    const place = places[c.index];
    return {
      kind: "next_place",
      context: String(c.index),
      place,
      trigger: c.trigger,
      estimate: input.location ? estimateTravel(distanceMeters(input.location, place)) : null,
    };
  }
  return null;
}

function nearby(input: PickInput): Suggestion | null {
  if (!input.location) return null;
  if (input.lastNearbyAt) {
    const since = localMinutes(`${input.nowDate}T${input.nowTime}`) - localMinutes(input.lastNearbyAt);
    if (since < NEARBY_COOLDOWN_MIN) return null;
  }
  const onCourse = new Set(input.todayPlaces.map((p) => p.name));
  const near = input.spots
    .filter((s) => !onCourse.has(s.name))
    .map((s) => {
      const meters = distanceMeters(input.location!, s);
      return { ...s, meters, walkMinutes: walkingMinutes(meters) };
    })
    .filter((s) => s.meters <= NEARBY_RADIUS_M)
    .sort((a, b) => a.meters - b.meters);

  // The first line names a spot not already led with today.
  const leadIndex = near.findIndex((s) => !input.resolvedToday.has(key("nearby", s.key)));
  if (leadIndex === -1) return null;
  const lead = near[leadIndex];
  const others = near.filter((_, i) => i !== leadIndex).slice(0, 2);
  return { kind: "nearby", context: lead.key, spots: [lead, ...others] };
}

/** Picks at most one suggestion, in the spec's priority order. */
export function pickSuggestion(input: PickInput): Suggestion | null {
  const done = (k: SuggestionKind, c = "") => input.resolvedToday.has(key(k, c));

  if (input.todayIsTripDay && !done("morning")) return { kind: "morning", context: "" };

  if (input.tomorrowIsTripDay && input.nowTime >= EVENING_FROM && !done("evening")) {
    return { kind: "evening", context: "" };
  }

  if (input.onTodayDayScreen) {
    const next = nextPlace(input);
    if (next) return next;
  }

  if (input.todayIsTripDay) {
    for (const meal of ["lunch", "dinner"] as const) {
      const [from, to] = MEAL_WINDOWS[meal];
      if (input.nowTime >= from && input.nowTime <= to && !done("expense", meal)) {
        return { kind: "expense", context: meal };
      }
    }
  }

  const locationMatters = input.onTodayDayScreen && input.todayPlaces.length > 0;
  if (locationMatters && input.permission === "prompt" && !done("location")) {
    return { kind: "location", context: "" };
  }

  if (input.onTodayDayScreen && input.permission === "granted") return nearby(input);

  return null;
}
