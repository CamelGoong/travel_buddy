import { createClient } from "@/lib/supabase/server";

import type { Place } from "./course";

export type NewTrip = {
  startDate: string;
  endDate: string;
  budgetYen: number | null;
  companion: string | null;
  interests: string[];
  /** Generated course, one entry per day; null stores the default course */
  course: Place[][] | null;
  fallbackReason: string | null;
};

/** Inserts a trip for the signed-in user and returns its id. */
export async function insertTrip(trip: NewTrip): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .insert({
      start_date: trip.startDate,
      end_date: trip.endDate,
      budget_yen: trip.budgetYen,
      companion: trip.companion,
      interests: trip.interests,
      course: trip.course ? trip.course.map((places) => ({ places })) : null,
      course_source: trip.course ? "ai" : "default",
      fallback_reason: trip.fallbackReason,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/** Sets or clears (null) the trip's total budget. */
export async function setTripBudget(tripId: number, budgetYen: number | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("trips").update({ budget_yen: budgetYen }).eq("id", tripId);
  if (error) throw error;
}

/** How many trips the signed-in user created at or after an instant (ISO string). */
export async function countTripsCreatedSince(sinceIso: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceIso);
  if (error) throw error;
  return count ?? 0;
}
