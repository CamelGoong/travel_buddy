import { createClient } from "@/lib/supabase/server";

export async function getPrepChecks(
  tripId: number,
  forDate: string,
): Promise<Record<string, boolean>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prep_checks")
    .select("item_key, done")
    .eq("trip_id", tripId)
    .eq("for_date", forDate);
  if (error) throw error;
  return Object.fromEntries(data.map((row) => [row.item_key, row.done]));
}

export async function setPrepCheck(
  tripId: number,
  forDate: string,
  itemKey: string,
  done: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prep_checks")
    .upsert(
      { trip_id: tripId, for_date: forDate, item_key: itemKey, done },
      { onConflict: "trip_id,for_date,item_key" },
    );
  if (error) throw error;
}
