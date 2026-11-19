"use server";

import { refresh } from "next/cache";

import { getTokyoNow } from "@/lib/clock";
import { addDays } from "@/lib/tokyo-time";
import { setPrepCheck } from "@/features/briefing";
import { setChecklistItemDone } from "@/features/checklist";
import { insertExpense, parseExpense } from "@/features/expenses";
import type { SuggestionKind } from "@/features/suggestions";
import { recordSuggestion } from "@/features/suggestions/server";
import { dayNumberOn, getLatestTrip } from "@/features/trip";

import type { ExpenseFormState } from "./day/[day]/actions";

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

/** The user acted on or put off a suggestion; it will not come back in the same situation. */
export async function resolveSuggestion(kind: SuggestionKind, context: string) {
  const trip = await getLatestTrip();
  if (!trip) return;
  const now = await getTokyoNow();
  await recordSuggestion(trip.id, kind, context, now.date, `${now.date}T${now.time}`);
}

/** Records today's expense from the meal prompt and closes that prompt. */
export async function recordExpenseFromPrompt(
  meal: "lunch" | "dinner",
  prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const amount = String(formData.get("amount") ?? "");
  const label = String(formData.get("label") ?? "");
  const parsed = parseExpense(amount, label);
  if (!parsed.ok) return { error: parsed.error, amount, label, saved: prev.saved };

  const trip = await getLatestTrip();
  const now = await getTokyoNow();
  const day = trip ? dayNumberOn(trip, now.date) : null;
  if (!trip || !day) {
    return { error: "오늘은 여행 일차가 아니에요.", amount, label, saved: prev.saved };
  }
  try {
    await insertExpense(trip.id, day, parsed.value);
    await recordSuggestion(trip.id, "expense", meal, now.date, `${now.date}T${now.time}`);
  } catch {
    return { error: "기록하지 못했어요. 잠시 뒤 다시 시도해 주세요.", amount, label, saved: prev.saved };
  }
  refresh();
  return { error: null, amount: "", label: "", saved: prev.saved + 1 };
}
