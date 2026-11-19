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
  movePlace,
  OSAKA_SPOTS,
  recordRegeneration,
  removePlace,
  saveAiCourse,
  saveCourse,
  setTime,
  type Place,
} from "@/features/trip";

export type CourseEdit =
  | { op: "up" | "down" | "remove"; index: number }
  | { op: "time"; index: number; time: string }
  | { op: "add"; spotKey?: string; name?: string };

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
      result = spot
        ? addPlace(places, { name: spot.name, lat: spot.lat, lng: spot.lng })
        : addPlace(places, { name: edit.name ?? "" });
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
