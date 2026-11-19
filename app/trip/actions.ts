"use server";

import { redirect } from "next/navigation";

import { getTokyoNow } from "@/lib/clock";
import { addDays } from "@/lib/tokyo-time";
import { dismissBriefing, setPrepCheck } from "@/features/briefing";
import { setChecklistItemDone } from "@/features/checklist";
import { dayNumberOn, getLatestTrip } from "@/features/trip";

export async function toggleChecklistItem(itemId: number, done: boolean) {
  await setChecklistItemDone(itemId, done);
}

/** Checks an evening prep item; a checklist-derived item also updates the checklist. */
export async function togglePrepItem(
  tripId: number,
  itemKey: string,
  checklistItemId: number | null,
  done: boolean,
) {
  const now = await getTokyoNow();
  await setPrepCheck(tripId, addDays(now.date, 1), itemKey, done);
  if (checklistItemId !== null) await setChecklistItemDone(checklistItemId, done);
}

export async function confirmMorning() {
  const trip = await getLatestTrip();
  if (!trip) redirect("/trip/new");
  const now = await getTokyoNow();
  await dismissBriefing(trip.id, "morning", now.date);
  const day = dayNumberOn(trip, now.date);
  redirect(day ? `/trip/day/${day}` : "/trip");
}

export async function confirmEvening() {
  const trip = await getLatestTrip();
  if (!trip) redirect("/trip/new");
  const now = await getTokyoNow();
  await dismissBriefing(trip.id, "evening", now.date);
  redirect("/trip");
}
