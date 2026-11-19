import { cookies } from "next/headers";

import { createClient, getUserId } from "@/lib/supabase/server";

import type { Place } from "./course";

export type CourseSource = "ai" | "default";

export type Trip = {
  id: number;
  startDate: string;
  endDate: string;
  /** Optional total budget in yen */
  budgetYen: number | null;
  /** Stored AI course, one entry per day; null for trips made before AI courses */
  course: Place[][] | null;
  courseSource: CourseSource;
  /** True when the signed-in account created the trip; companions only see it */
  isOwner: boolean;
};

type CourseJson = { places: Place[] }[];

export const CURRENT_TRIP_COOKIE = "current_trip";

const TRIP_COLUMNS = "id, user_id, start_date, end_date, budget_yen, course, course_source";

/**
 * The trip the user is looking at: the one picked on the trip list (cookie),
 * else the most recent. A cookie id that is not the user's trip is ignored.
 */
export async function getCurrentTrip(): Promise<Trip | null> {
  const supabase = await createClient();
  const me = await getUserId();
  const pickedId = Number((await cookies()).get(CURRENT_TRIP_COOKIE)?.value);

  if (Number.isInteger(pickedId) && pickedId > 0) {
    const { data, error } = await supabase
      .from("trips")
      .select(TRIP_COLUMNS)
      .eq("id", pickedId)
      .maybeSingle();
    if (error) throw error;
    if (data) return toTrip(data, me);
  }

  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toTrip(data, me) : null;
}

/** All of the signed-in user's trips, newest first. */
export async function listTrips(): Promise<Trip[]> {
  const supabase = await createClient();
  const me = await getUserId();
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => toTrip(row, me));
}

type TripRow = {
  id: number;
  user_id: string;
  start_date: string;
  end_date: string;
  budget_yen: number | null;
  course: unknown;
  course_source: string;
};

function toTrip(data: TripRow, me: string | null): Trip {
  const stored = data.course as CourseJson | null;
  return {
    id: data.id,
    startDate: data.start_date,
    endDate: data.end_date,
    budgetYen: data.budget_yen,
    // An edited default course keeps source "default" but stores its places.
    course: stored ? stored.map((day) => day.places) : null,
    courseSource: data.course_source === "ai" ? "ai" : "default",
    isOwner: data.user_id === me,
  };
}
