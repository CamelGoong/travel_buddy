"use server";

import { refresh } from "next/cache";

import { toTokyoNow } from "@/lib/tokyo-time";
import { generateCourse } from "@/features/ai-course/server";
import { DEFAULT_CHECKLIST } from "@/features/checklist";
import { unlinkTicketPlaces } from "@/features/documents/store";
import {
  addPlace,
  buildCourse,
  countAiRunsSince,
  dayCount,
  getCurrentTrip,
  inServiceArea,
  movePlace,
  OSAKA_SPOTS,
  recordRegeneration,
  removePlace,
  saveAiCourse,
  saveCourse,
  SERVICE_AREA,
  setTime,
  type Place,
} from "@/features/trip";

export type CourseEdit =
  | { op: "up" | "down" | "remove"; index: number }
  | { op: "time"; index: number; time: string }
  | { op: "add"; spotKey?: string; name?: string; lat?: number; lng?: number };

/** Applies one edit to one day of the course; the owner only. Returns an error message or null. */
export async function editDay(dayNumber: number, edit: CourseEdit): Promise<string | null> {
  const trip = await getCurrentTrip();
  if (!trip) return "여행을 찾지 못했어요.";
  if (!trip.isOwner) return "코스는 여행 주인만 바꿀 수 있어요.";
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > dayCount(trip)) return "일차를 찾지 못했어요.";

  const days = buildCourse(trip).map((d) => d.places);
  const places = days[dayNumber - 1];
  let result;
  switch (edit.op) {
    case "up":
      result = movePlace(places, edit.index, -1);
      break;
    case "down":
      result = movePlace(places, edit.index, 1);
      break;
    case "remove":
      result = removePlace(places, edit.index);
      break;
    case "time":
      result = setTime(places, edit.index, edit.time);
      break;
    case "add": {
      const spot = edit.spotKey ? OSAKA_SPOTS.find((s) => s.key === edit.spotKey) : undefined;
      if (spot) {
        result = addPlace(places, { name: spot.name, lat: spot.lat, lng: spot.lng });
      } else if (edit.lat != null && edit.lng != null) {
        if (!inServiceArea(edit.lat, edit.lng)) return "오사카와 가까운 곳만 넣을 수 있어요.";
        result = addPlace(places, { name: edit.name ?? "", lat: edit.lat, lng: edit.lng });
      } else {
        result = addPlace(places, { name: edit.name ?? "" });
      }
      break;
    }
  }
  if (!result.ok) return result.error;

  days[dayNumber - 1] = result.places;
  try {
    await saveCourse(trip.id, days);
    if (edit.op === "remove") await unlinkTicketPlaces(trip.id, [places[edit.index].name]);
  } catch {
    return "저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.";
  }
  refresh();
  return null;
}

/** AI runs allowed per user per Osaka day; creating trips counts too. */
const DAILY_LIMIT = 5;

/** Asks the AI to redo the whole course; keeps the current course when it cannot. Owner only. */
export async function regenerateCourse(): Promise<string | null> {
  const trip = await getCurrentTrip();
  if (!trip) return "여행을 찾지 못했어요.";
  if (!trip.isOwner) return "코스는 여행 주인만 다시 짤 수 있어요.";

  const osakaMidnight = `${toTokyoNow(new Date()).date}T00:00:00+09:00`;
  if ((await countAiRunsSince(osakaMidnight)) >= DAILY_LIMIT) return "오늘은 더 다시 짤 수 없어요.";

  try {
    await recordRegeneration(trip.id);
    const result = await generateCourse(
      {
        dayCount: dayCount(trip),
        companion: (trip.companion ?? null) as never,
        interests: trip.interests as never,
      },
      DEFAULT_CHECKLIST.map((item) => item.label),
    );
    if (!result.ok) return "지금은 다시 짜지 못했어요.";

    const kept = new Set(result.draft.days.flat().map((p: Place) => p.name));
    const before = buildCourse(trip).flatMap((d) => d.places.map((p) => p.name));
    await saveAiCourse(trip.id, result.draft.days);
    await unlinkTicketPlaces(trip.id, before.filter((name) => !kept.has(name)));
  } catch {
    return "지금은 다시 짜지 못했어요.";
  }
  refresh();
  return null;
}

export type PlaceCandidate = { address: string; lat: number; lng: number };
export type PlaceSearch = { ok: true; results: PlaceCandidate[] } | { ok: false; error: string };

type NominatimHit = { display_name?: string; lat?: string; lon?: string };

/**
 * Looks a typed place name up on OpenStreetMap (Nominatim, no key) inside the Osaka area.
 * Owner only, since only the owner edits the course. Never throws.
 */
export async function searchPlaces(query: string): Promise<PlaceSearch> {
  const trip = await getCurrentTrip();
  if (!trip?.isOwner) return { ok: false, error: "코스는 여행 주인만 바꿀 수 있어요." };
  const q = query.trim();
  if (q.length === 0) return { ok: false, error: "장소 이름을 적어 주세요." };
  if ([...q].length > 30) return { ok: false, error: "장소 이름은 30자까지예요." };

  const area = SERVICE_AREA;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("accept-language", "ko");
  url.searchParams.set("countrycodes", "jp");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("viewbox", `${area.minLng},${area.maxLat},${area.maxLng},${area.minLat}`);
  url.searchParams.set("q", q);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "TravelBuddy/1.0 (learning project)" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return { ok: false, error: "지금은 위치를 찾지 못했어요." };
    const hits = (await response.json()) as NominatimHit[];
    const results = hits
      .map((hit) => ({ address: (hit.display_name ?? "").slice(0, 80), lat: Number(hit.lat), lng: Number(hit.lon) }))
      .filter((hit) => hit.address && inServiceArea(hit.lat, hit.lng));
    return { ok: true, results };
  } catch {
    return { ok: false, error: "지금은 위치를 찾지 못했어요." };
  }
}
