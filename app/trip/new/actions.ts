"use server";

import { redirect } from "next/navigation";

import { parseBudget } from "@/features/budget";
import { toTokyoNow } from "@/lib/tokyo-time";
import { parsePreferences } from "@/features/ai-course";
import { generateCourse } from "@/features/ai-course/server";
import {
  createChecklistSuggestions,
  createDefaultChecklist,
  DEFAULT_CHECKLIST,
} from "@/features/checklist";
import {
  countTripsCreatedSince,
  dayCount,
  insertTrip,
  validateTripDates,
  type NewTrip,
} from "@/features/trip";

export type CreateTripState = {
  error: string | null;
  budgetError?: string | null;
  startDate: string;
  endDate: string;
  budget?: string;
};

/** AI generations allowed per user per Osaka day; trips past it get the default course. */
const DAILY_LIMIT = 5;

/** Creates an Osaka trip and its pre-departure checklist. */
export async function createTrip(
  _prev: CreateTripState,
  formData: FormData,
): Promise<CreateTripState> {
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const budget = String(formData.get("budget") ?? "").trim();

  const reason = validateTripDates(startDate, endDate);
  if (reason) return { error: reason, startDate, endDate, budget };

  let budgetYen: number | null = null;
  if (budget !== "") {
    const parsed = parseBudget(budget);
    if (!parsed.ok) return { error: null, budgetError: parsed.error, startDate, endDate, budget };
    budgetYen = parsed.yen;
  }

  const prefs = parsePreferences(formData.get("companion"), formData.getAll("interests"));

  try {
    const generated = await generateForTrip({ startDate, endDate }, prefs);
    const trip: NewTrip = {
      startDate,
      endDate,
      budgetYen,
      companion: prefs.companion,
      interests: prefs.interests,
      course: generated.course,
      fallbackReason: generated.fallbackReason,
    };
    const tripId = await insertTrip(trip);
    await createDefaultChecklist(tripId);
    // Suggestions are a bonus; the trip must not fail because of them.
    await createChecklistSuggestions(tripId, generated.suggestions).catch(() => {});
  } catch {
    return { error: "여행을 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.", startDate, endDate, budget };
  }
  redirect("/trip");
}

type Generated = {
  course: NewTrip["course"];
  suggestions: string[];
  fallbackReason: string | null;
};

/** Asks Gemini for a course unless the daily limit is used up; never throws for LLM reasons. */
async function generateForTrip(
  dates: { startDate: string; endDate: string },
  prefs: ReturnType<typeof parsePreferences>,
): Promise<Generated> {
  const osakaMidnight = `${toTokyoNow(new Date()).date}T00:00:00+09:00`;
  if ((await countTripsCreatedSince(osakaMidnight)) >= DAILY_LIMIT) {
    return { course: null, suggestions: [], fallbackReason: "daily_limit" };
  }

  const result = await generateCourse(
    { ...prefs, dayCount: dayCount(dates) },
    DEFAULT_CHECKLIST.map((item) => item.label),
  );
  if (!result.ok) return { course: null, suggestions: [], fallbackReason: result.reason };
  return {
    course: result.draft.days,
    suggestions: result.draft.suggestions,
    fallbackReason: null,
  };
}
