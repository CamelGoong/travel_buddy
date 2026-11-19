import { createClient } from "@/lib/supabase/server";

import { DEFAULT_CHECKLIST } from "./defaults";

export type ChecklistItem = {
  id: number;
  key: string;
  label: string;
  done: boolean;
};

export async function createDefaultChecklist(tripId: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("checklist_items").insert(
    DEFAULT_CHECKLIST.map((item, position) => ({
      trip_id: tripId,
      item_key: item.key,
      label: item.label,
      position,
    })),
  );
  if (error) throw error;
}

export async function getChecklist(tripId: number): Promise<ChecklistItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("id, item_key, label, done")
    .eq("trip_id", tripId)
    .order("position");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    key: row.item_key,
    label: row.label,
    done: row.done,
  }));
}

export async function setChecklistItemDone(itemId: number, done: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_items")
    .update({ done })
    .eq("id", itemId);
  if (error) throw error;
}

export type ChecklistSuggestion = { id: number; label: string };

/** Stores generated "do you need this?" suggestions as pending for a trip. */
export async function createChecklistSuggestions(tripId: number, labels: string[]): Promise<void> {
  if (labels.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_suggestions")
    .insert(labels.map((label) => ({ trip_id: tripId, label })));
  if (error) throw error;
}

export async function getPendingSuggestions(tripId: number): Promise<ChecklistSuggestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_suggestions")
    .select("id, label")
    .eq("trip_id", tripId)
    .eq("status", "pending")
    .order("id");
  if (error) throw error;
  return data;
}

/** Moves a pending suggestion into the checklist as an unchecked last item. */
export async function addSuggestionToChecklist(suggestionId: number): Promise<void> {
  const supabase = await createClient();
  const { data: suggestion, error } = await supabase
    .from("checklist_suggestions")
    .update({ status: "added" })
    .eq("id", suggestionId)
    .eq("status", "pending")
    .select("trip_id, label")
    .maybeSingle();
  if (error) throw error;
  if (!suggestion) return;

  const { data: last, error: lastError } = await supabase
    .from("checklist_items")
    .select("position")
    .eq("trip_id", suggestion.trip_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) throw lastError;

  const { error: insertError } = await supabase.from("checklist_items").insert({
    trip_id: suggestion.trip_id,
    item_key: `suggested-${suggestionId}`,
    label: suggestion.label,
    position: (last?.position ?? -1) + 1,
  });
  if (insertError) throw insertError;
}

export async function dismissSuggestion(suggestionId: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_suggestions")
    .update({ status: "dismissed" })
    .eq("id", suggestionId)
    .eq("status", "pending");
  if (error) throw error;
}

/** Marks the checklist item with this key done; a no-op when it is missing or already done. */
export async function completeChecklistItemByKey(tripId: number, itemKey: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_items")
    .update({ done: true })
    .eq("trip_id", tripId)
    .eq("item_key", itemKey)
    .eq("done", false);
  if (error) throw error;
}
