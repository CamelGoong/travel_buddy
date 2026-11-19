import { createClient } from "@/lib/supabase/server";

import { DEFAULT_SLOTS, MAX_CUSTOM_SLOTS, type SlotKind } from "./slots";

export const BUCKET = "trip-documents";

export type DocumentFile = {
  id: number;
  fileName: string;
  contentType: string;
  placeName: string | null;
};

export type DocumentSlot = {
  id: number;
  kind: SlotKind;
  name: string;
  files: DocumentFile[];
};

/** Slots with their files; creates the default slots the first time a trip's vault opens. */
export async function getVault(tripId: number): Promise<DocumentSlot[]> {
  const supabase = await createClient();
  const load = async () => {
    const { data, error } = await supabase
      .from("document_slots")
      .select("id, kind, name, document_files(id, file_name, content_type, place_name, created_at)")
      .eq("trip_id", tripId)
      .order("position")
      .order("created_at", { referencedTable: "document_files" });
    if (error) throw error;
    return data;
  };

  let rows = await load();
  if (rows.length === 0) {
    const { error } = await supabase.from("document_slots").insert(
      DEFAULT_SLOTS.map((slot, position) => ({ trip_id: tripId, kind: slot.kind, name: slot.name, position })),
    );
    // Two tabs opening the vault at once: the unique index rejects the second insert.
    if (error && error.code !== "23505") throw error;
    rows = await load();
  }

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind as SlotKind,
    name: row.name,
    files: row.document_files.map((f) => ({
      id: f.id,
      fileName: f.file_name,
      contentType: f.content_type,
      placeName: f.place_name,
    })),
  }));
}

export async function addFileRow(input: {
  slotId: number;
  tripId: number;
  fileName: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  placeName: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("document_files").insert({
    slot_id: input.slotId,
    trip_id: input.tripId,
    file_name: input.fileName,
    storage_path: input.storagePath,
    content_type: input.contentType,
    size_bytes: input.sizeBytes,
    place_name: input.placeName,
  });
  if (error) throw error;
}

export async function getSlot(
  slotId: number,
): Promise<{ id: number; tripId: number; kind: SlotKind; fileCount: number } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_slots")
    .select("id, trip_id, kind, document_files(id)")
    .eq("id", slotId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, tripId: data.trip_id, kind: data.kind as SlotKind, fileCount: data.document_files.length };
}

export async function insertCustomSlot(tripId: number, name: string): Promise<"ok" | "full"> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_slots")
    .select("position, kind")
    .eq("trip_id", tripId)
    .order("position", { ascending: false });
  if (error) throw error;
  if (data.filter((s) => s.kind === "custom").length >= MAX_CUSTOM_SLOTS) return "full";
  const { error: insertError } = await supabase
    .from("document_slots")
    .insert({ trip_id: tripId, kind: "custom", name, position: (data[0]?.position ?? -1) + 1 });
  if (insertError) throw insertError;
  return "ok";
}

/** Deletes a custom slot and its stored files. Default slots are never deleted. */
export async function deleteCustomSlot(slotId: number): Promise<void> {
  const supabase = await createClient();
  const { data: files, error } = await supabase
    .from("document_files")
    .select("storage_path")
    .eq("slot_id", slotId);
  if (error) throw error;
  const { data: removed, error: deleteError } = await supabase
    .from("document_slots")
    .delete()
    .eq("id", slotId)
    .eq("kind", "custom")
    .select("id");
  if (deleteError) throw deleteError;
  if (removed.length > 0 && files.length > 0) {
    await supabase.storage.from(BUCKET).remove(files.map((f) => f.storage_path));
  }
}

export async function deleteFile(fileId: number): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_files")
    .delete()
    .eq("id", fileId)
    .select("storage_path")
    .maybeSingle();
  if (error) throw error;
  if (data) await supabase.storage.from(BUCKET).remove([data.storage_path]);
}

export async function setFilePlace(fileId: number, placeName: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("document_files").update({ place_name: placeName }).eq("id", fileId);
  if (error) throw error;
}

/** One-hour link to a file the signed-in user owns, or null. */
export async function signedUrlOf(fileId: number): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_files")
    .select("storage_path")
    .eq("id", fileId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(data.storage_path, 3600);
  return signed.data?.signedUrl ?? null;
}
