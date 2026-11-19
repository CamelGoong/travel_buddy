"use server";

import { redirect } from "next/navigation";

import { createDefaultChecklist } from "@/features/checklist";
import { insertTrip, validateTripDates } from "@/features/trip";

export type CreateTripState = { error: string | null; startDate: string; endDate: string };

/** Creates an Osaka trip and its pre-departure checklist. */
export async function createTrip(
  _prev: CreateTripState,
  formData: FormData,
): Promise<CreateTripState> {
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  const reason = validateTripDates(startDate, endDate);
  if (reason) return { error: reason, startDate, endDate };

  try {
    const tripId = await insertTrip(startDate, endDate);
    await createDefaultChecklist(tripId);
  } catch {
    return { error: "여행을 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.", startDate, endDate };
  }
  redirect("/trip");
}
