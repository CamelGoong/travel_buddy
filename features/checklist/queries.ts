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
