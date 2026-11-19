import { createClient, getUserId } from "@/lib/supabase/server";

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

/** Replaces the whole stored course with edited days (the course source label is unchanged). */
export async function saveCourse(tripId: number, days: Place[][]): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("trips")
    .update({ course: days.map((places) => ({ places })) })
    .eq("id", tripId);
  if (error) throw error;
}

/** Stores a freshly generated course and marks the trip as AI-made. */
export async function saveAiCourse(tripId: number, days: Place[][]): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("trips")
    .update({ course: days.map((places) => ({ places })), course_source: "ai", fallback_reason: null })
    .eq("id", tripId);
  if (error) throw error;
}

/** Notes that the signed-in owner asked the AI to redo a course (counts toward the daily limit). */
export async function recordRegeneration(tripId: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("course_regenerations").insert({ trip_id: tripId });
  if (error) throw error;
}

/** AI runs by the signed-in user since an instant: trips created plus courses redone. */
export async function countAiRunsSince(sinceIso: string): Promise<number> {
  const supabase = await createClient();
  const me = await getUserId();
  if (!me) return 0;
  const { count, error } = await supabase
    .from("course_regenerations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", me)
    .gte("created_at", sinceIso);
  if (error) throw error;
  return (count ?? 0) + (await countTripsCreatedSince(sinceIso));
}

/** How many trips the signed-in user created at or after an instant (ISO string). */
export async function countTripsCreatedSince(sinceIso: string): Promise<number> {
  const supabase = await createClient();
  const me = await getUserId();
  if (!me) return 0;
  const { count, error } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true })
    .eq("user_id", me)
    .gte("created_at", sinceIso);
  if (error) throw error;
  return count ?? 0;
}

/** Sets or clears (null) the trip's name. Owner only (row access rules). */
export async function renameTripRow(tripId: number, name: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("trips").update({ name }).eq("id", tripId);
  if (error) throw error;
}

/** Deletes a trip and everything under it; false when the signed-in account is not its owner. */
export async function deleteTripRow(tripId: number): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("trips").delete().eq("id", tripId).select("id");
  if (error) throw error;
  return data.length > 0;
}
