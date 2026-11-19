import { createClient } from "@/lib/supabase/server";

export type Trip = {
  id: number;
  startDate: string;
  endDate: string;
  /** Optional total budget in yen */
  budgetYen: number | null;
};

/** The signed-in user's most recent trip; only one is shown for now. */
export async function getLatestTrip(): Promise<Trip | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("id, start_date, end_date, budget_yen")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data
    ? { id: data.id, startDate: data.start_date, endDate: data.end_date, budgetYen: data.budget_yen }
    : null;
}
