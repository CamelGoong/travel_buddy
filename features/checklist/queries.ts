import { createClient, getUserId } from "@/lib/supabase/server";

import { DEFAULT_CHECKLIST } from "./defaults";
import { validateNewChecklistLabel } from "./labels";

export type ChecklistItem = {
  id: number;
  key: string;
  label: string;
  /** Whether the signed-in person marked it done */
  done: boolean;
  /** Items the owner added or accepted from a suggestion can be deleted; the five defaults cannot */
  removable: boolean;
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

/** The trip's checklist with the signed-in person's own done marks. */
export async function getChecklist(tripId: number): Promise<ChecklistItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("id, item_key, label, checklist_done(user_id)")
    .eq("trip_id", tripId)
    .order("position");
  if (error) throw error;
  const me = await getUserId();
  return data.map((row) => ({
    id: row.id,
    key: row.item_key,
    label: row.label,
    done: row.checklist_done.some((mark) => mark.user_id === me),
    removable: !DEFAULT_CHECKLIST.some((item) => item.key === row.item_key),
  }));
}

/** Marks an item done or not done for the signed-in person only. */
export async function setChecklistItemDone(itemId: number, done: boolean): Promise<void> {
  const supabase = await createClient();
  const me = await getUserId();
  if (!me) return;
  if (done) {
    const { error } = await supabase
      .from("checklist_done")
      .upsert({ item_id: itemId, user_id: me }, { onConflict: "item_id,user_id", ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("checklist_done").delete().eq("item_id", itemId).eq("user_id", me);
    if (error) throw error;
  }
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

/** Marks the checklist item with this key done for the signed-in person; a no-op when missing or already done. */
export async function completeChecklistItemByKey(tripId: number, itemKey: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("id")
    .eq("trip_id", tripId)
    .eq("item_key", itemKey)
    .maybeSingle();
  if (error) throw error;
  if (data) await setChecklistItemDone(data.id, true);
}

const MAX_CUSTOM_ITEMS = 20;

/** Adds an item the owner typed as the last, unchecked item. Returns an error message or null. */
export async function addCustomChecklistItem(tripId: number, label: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("item_key, label, position")
    .eq("trip_id", tripId)
    .order("position", { ascending: false });
  if (error) throw error;
  const check = validateNewChecklistLabel(label, data.map((row) => row.label));
  if (!check.ok) return check.error;
  if (data.filter((row) => row.item_key.startsWith("custom-")).length >= MAX_CUSTOM_ITEMS) {
    return `직접 더한 항목은 ${MAX_CUSTOM_ITEMS}개까지예요.`;
  }
  const { error: insertError } = await supabase.from("checklist_items").insert({
    trip_id: tripId,
    item_key: `custom-${crypto.randomUUID()}`,
    label: check.label,
    position: (data[0]?.position ?? -1) + 1,
  });
  if (insertError) throw insertError;
  return null;
}

/** Deletes an item the owner added or accepted from a suggestion; the five defaults are never deleted. */
export async function deleteChecklistItem(itemId: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_items")
    .delete()
    .eq("id", itemId)
    .or("item_key.like.custom-%,item_key.like.suggested-%");
  if (error) throw error;
}
