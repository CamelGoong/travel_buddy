import { createClient } from "@/lib/supabase/server";

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
};

type CourseJson = { places: Place[] }[];

/** The signed-in user's most recent trip; only one is shown for now. */
export async function getLatestTrip(): Promise<Trip | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("id, start_date, end_date, budget_yen, course, course_source")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const stored = data.course as CourseJson | null;
  return {
    id: data.id,
    startDate: data.start_date,
    endDate: data.end_date,
    budgetYen: data.budget_yen,
    course: data.course_source === "ai" && stored ? stored.map((day) => day.places) : null,
    courseSource: data.course_source === "ai" ? "ai" : "default",
  };
}
