"use server";

import { redirect } from "next/navigation";

import { parseBudget } from "@/features/budget";
import { createDefaultChecklist } from "@/features/checklist";
import { insertTrip, validateTripDates } from "@/features/trip";

export type CreateTripState = {
  error: string | null;
  budgetError?: string | null;
  startDate: string;
  endDate: string;
  budget?: string;
};

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

  try {
    const tripId = await insertTrip(startDate, endDate, budgetYen);
    await createDefaultChecklist(tripId);
  } catch {
    return { error: "여행을 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.", startDate, endDate, budget };
  }
  redirect("/trip");
}
