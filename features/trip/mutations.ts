import { createClient } from "@/lib/supabase/server";

/** Inserts a trip for the signed-in user and returns its id. */
export async function insertTrip(
  startDate: string,
  endDate: string,
  budgetYen: number | null = null,
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .insert({ start_date: startDate, end_date: endDate, budget_yen: budgetYen })
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
