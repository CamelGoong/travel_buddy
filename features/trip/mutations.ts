import { createClient } from "@/lib/supabase/server";

/** Inserts a trip for the signed-in user and returns its id. */
export async function insertTrip(startDate: string, endDate: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .insert({ start_date: startDate, end_date: endDate })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
