import { createClient } from "@/lib/supabase/server";

import type { SuggestionKind } from "./pick";

export type SuggestionRecords = {
  /** `${kind}:${context}` resolved on the given date */
  resolvedToday: string[];
  /** Osaka local time of the latest nearby resolution on this trip */
  lastNearbyAt: string | null;
};

export async function getSuggestionRecords(tripId: number, date: string): Promise<SuggestionRecords> {
  const supabase = await createClient();
  const [today, nearby, opened] = await Promise.all([
    supabase.from("suggestion_records").select("kind, context").eq("trip_id", tripId).eq("for_date", date),
    supabase
      .from("suggestion_records")
      .select("local_at")
      .eq("trip_id", tripId)
      .eq("kind", "nearby")
      .not("local_at", "is", null)
      .order("local_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Recommendations the user opened stay finished on every later day ("!" marks them).
    supabase.from("suggestion_records").select("kind, context").eq("trip_id", tripId).like("context", "%!"),
  ]);
  if (today.error) throw today.error;
  if (opened.error) throw opened.error;
  if (nearby.error) throw nearby.error;
  return {
    resolvedToday: [
      ...today.data.map((r) => `${r.kind}:${r.context}`),
      ...opened.data.map((r) => `${r.kind}:${r.context.slice(0, -1)}`),
    ],
    lastNearbyAt: nearby.data?.local_at ?? null,
  };
}

/** Records that the user acted on or put off a suggestion. Repeats are ignored. */
export async function recordSuggestion(
  tripId: number,
  kind: SuggestionKind,
  context: string,
  forDate: string,
  localAt: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("suggestion_records")
    .upsert(
      { trip_id: tripId, kind, context, for_date: forDate, local_at: localAt },
      { onConflict: "trip_id,user_id,kind,for_date,context", ignoreDuplicates: true },
    );
  if (error) throw error;
}
