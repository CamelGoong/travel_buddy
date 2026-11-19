"use server";

import { refresh } from "next/cache";

import { getTokyoNow } from "@/lib/clock";
import { addDays } from "@/lib/tokyo-time";
import { setPrepCheck } from "@/features/briefing";
import { parseBudget } from "@/features/budget";
import {
  addSuggestionToChecklist,
  dismissSuggestion,
  setChecklistItemDone,
} from "@/features/checklist";
import { parseExpense } from "@/features/expenses";
import { insertExpense } from "@/features/expenses/server";
import type { SuggestionKind } from "@/features/suggestions";
import { recordSuggestion } from "@/features/suggestions/server";
import { dayNumberOn, getLatestTrip, setTripBudget } from "@/features/trip";

import type { ExpenseFormState } from "./day/[day]/actions";

export async function toggleChecklistItem(itemId: number, done: boolean) {
  await setChecklistItemDone(itemId, done);
}

/** "추가": the suggestion becomes an unchecked checklist item. */
export async function acceptSuggestion(suggestionId: number) {
  await addSuggestionToChecklist(suggestionId);
  refresh();
}

/** "괜찮아요": the suggestion goes away and does not come back. */
export async function dismissChecklistSuggestion(suggestionId: number) {
  await dismissSuggestion(suggestionId);
  refresh();
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

export type BudgetFormState = { error: string | null; value: string };

/** Sets the trip's total budget, or clears it when the clear button sent the form. */
export async function saveBudget(_prev: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
  const raw = String(formData.get("budget") ?? "");
  const trip = await getLatestTrip();
  if (!trip) return { error: "여행을 찾지 못했어요.", value: raw };

  if (formData.get("intent") === "clear") {
    await setTripBudget(trip.id, null);
    refresh();
    return { error: null, value: "" };
  }
  const parsed = parseBudget(raw);
  if (!parsed.ok) return { error: parsed.error, value: raw };
  await setTripBudget(trip.id, parsed.yen);
  refresh();
  return { error: null, value: String(parsed.yen) };
}
