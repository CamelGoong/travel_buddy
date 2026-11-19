"use server";

import { refresh } from "next/cache";

import { getUserId } from "@/lib/supabase/server";
import { completeChecklistItemByKey } from "@/features/checklist";
import { CHECKLIST_KEY_OF_SLOT, fileProblem, parseSlotName } from "@/features/documents";
import {
  addFileRow,
  deleteCustomSlot,
  deleteFile,
  getSlot,
  insertCustomSlot,
  setFilePlace,
} from "@/features/documents/store";
import { getCurrentTrip } from "@/features/trip";

export type UploadedFile = {
  slotId: number;
  path: string;
  name: string;
  type: string;
  size: number;
  placeName: string | null;
};

/** Saves the row for a file the browser already put in Storage; returns an error message or null. */
export async function registerFile(file: UploadedFile): Promise<string | null> {
  const userId = await getUserId();
  const slot = await getSlot(file.slotId);
  if (!userId || !slot) return "칸을 찾지 못했어요.";
  // The path must sit in this user's own folder for this slot's trip.
  if (!file.path.startsWith(`${userId}/${slot.tripId}/`)) return "올릴 수 없는 경로예요.";
  const problem = fileProblem({ type: file.type, size: file.size }, slot.fileCount);
  if (problem) return problem;

  try {
    await addFileRow({
      slotId: slot.id,
      tripId: slot.tripId,
      fileName: file.name.slice(0, 200),
      storagePath: file.path,
      contentType: file.type,
      sizeBytes: file.size,
      placeName: slot.kind === "ticket" ? file.placeName : null,
    });
    const checklistKey = CHECKLIST_KEY_OF_SLOT[slot.kind];
    if (checklistKey) await completeChecklistItemByKey(slot.tripId, checklistKey);
  } catch {
    return "저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.";
  }
  refresh();
  return null;
}

export async function removeFile(fileId: number) {
  await deleteFile(fileId);
  refresh();
}

export async function removeSlot(slotId: number) {
  await deleteCustomSlot(slotId);
  refresh();
}

export async function changeFilePlace(fileId: number, placeName: string | null) {
  await setFilePlace(fileId, placeName);
  refresh();
}

export type SlotFormState = { error: string | null; name: string };

export async function addSlot(_prev: SlotFormState, formData: FormData): Promise<SlotFormState> {
  const raw = String(formData.get("name") ?? "");
  const parsed = parseSlotName(raw);
  if (!parsed.ok) return { error: parsed.error, name: raw };
  const trip = await getCurrentTrip();
  if (!trip) return { error: "여행을 찾지 못했어요.", name: raw };
  try {
    if ((await insertCustomSlot(trip.id, parsed.name)) === "full") {
      return { error: "칸은 10개까지 직접 만들 수 있어요.", name: raw };
    }
  } catch {
    return { error: "만들지 못했어요. 잠시 뒤 다시 시도해 주세요.", name: raw };
  }
  refresh();
  return { error: null, name: "" };
}
