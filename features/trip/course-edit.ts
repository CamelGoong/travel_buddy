// Pure course editing rules (docs/specs/trip-course-edit/). Every operation returns a new day.

import type { Place } from "./course";

export const MAX_PLACES_PER_DAY = 8;
export const MIN_TIME = "07:00";
export const MAX_TIME = "22:00";
export const MAX_PLACE_NAME = 30;

export type EditResult = { ok: true; places: Place[] } | { ok: false; error: string };

const fail = (error: string): EditResult => ({ ok: false, error });

/** HH:MM within 07:00–22:00, or null. */
export function parseTime(raw: string): string | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(raw.trim());
  if (!match) return null;
  const time = `${match[1].padStart(2, "0")}:${match[2]}`;
  return time >= MIN_TIME && time <= MAX_TIME ? time : null;
}

/** Stable sort by time so a day's times always run from early to late. */
export function sortByTime(places: Place[]): Place[] {
  return places
    .map((place, index) => ({ place, index }))
    .sort((a, b) => (a.place.time < b.place.time ? -1 : a.place.time > b.place.time ? 1 : a.index - b.index))
    .map((entry) => entry.place);
}

/** Swaps a place with its neighbour; the scheduled times stay in their slots. */
export function movePlace(places: Place[], index: number, direction: -1 | 1): EditResult {
  const target = index + direction;
  if (index < 0 || index >= places.length || target < 0 || target >= places.length) {
    return fail("더 옮길 수 없어요.");
  }
  const next = places.map((p) => ({ ...p }));
  const slotTimes = next.map((p) => p.time);
  [next[index], next[target]] = [next[target], next[index]];
  next.forEach((p, i) => {
    p.time = slotTimes[i];
  });
  return { ok: true, places: next };
}

/** Changes one place's time and re-sorts the day by time. */
export function setTime(places: Place[], index: number, rawTime: string): EditResult {
  const time = parseTime(rawTime);
  if (!time) return fail(`시각은 ${MIN_TIME}–${MAX_TIME} 사이 HH:MM으로 적어 주세요.`);
  if (index < 0 || index >= places.length) return fail("장소를 찾지 못했어요.");
  return { ok: true, places: sortByTime(places.map((p, i) => (i === index ? { ...p, time } : p))) };
}

export function removePlace(places: Place[], index: number): EditResult {
  if (index < 0 || index >= places.length) return fail("장소를 찾지 못했어요.");
  return { ok: true, places: places.filter((_, i) => i !== index) };
}

/** Two hours after the day's last place, capped at 22:00 (10:00 for an empty day). */
export function defaultNewTime(places: Place[]): string {
  const last = places.reduce((max, p) => (p.time > max ? p.time : max), "");
  if (!last) return "10:00";
  const [h, m] = last.split(":").map(Number);
  const minutes = Math.min(h * 60 + m + 120, 22 * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Adds a place at the end of the day with the default time. A place without lat/lng is a typed place. */
export function addPlace(places: Place[], place: { name: string; lat?: number; lng?: number }): EditResult {
  const name = place.name.trim();
  if (name.length === 0) return fail("장소 이름을 적어 주세요.");
  if ([...name].length > MAX_PLACE_NAME) return fail(`장소 이름은 ${MAX_PLACE_NAME}자까지예요.`);
  if (places.length >= MAX_PLACES_PER_DAY) return fail(`하루에는 ${MAX_PLACES_PER_DAY}곳까지 넣을 수 있어요.`);
  if (places.some((p) => p.name.toLowerCase() === name.toLowerCase())) return fail("이미 이 일차에 있는 장소예요.");
  const added: Place = { name, time: defaultNewTime(places), ...(place.lat != null && place.lng != null ? { lat: place.lat, lng: place.lng } : {}) };
  return { ok: true, places: sortByTime([...places, added]) };
}
