import { createClient } from "@/lib/supabase/server";

import type { BriefingKind } from "./decide";

export async function getDismissedToday(
  tripId: number,
  date: string,
): Promise<Record<BriefingKind, boolean>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("briefing_dismissals")
    .select("kind")
    .eq("trip_id", tripId)
    .eq("for_date", date);
  if (error) throw error;
  const kinds = new Set(data.map((row) => row.kind));
  return { morning: kinds.has("morning"), evening: kinds.has("evening") };
}

export async function dismissBriefing(
  tripId: number,
  kind: BriefingKind,
  date: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("briefing_dismissals")
    .upsert(
      { trip_id: tripId, kind, for_date: date },
      { onConflict: "trip_id,kind,for_date", ignoreDuplicates: true },
    );
  if (error) throw error;
}

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
