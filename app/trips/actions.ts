"use server";

import { cookies } from "next/headers";

import { revalidatePath } from "next/cache";

import { ownFilePaths, removeStoredFiles } from "@/features/documents/store";
import { CURRENT_TRIP_COOKIE, deleteTripRow, renameTripRow } from "@/features/trip";

/** Remembers which trip the trip screens show (the user's own trips only; others fall back to latest). */
export async function rememberTrip(tripId: number) {
  (await cookies()).set(CURRENT_TRIP_COOKIE, String(tripId), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

const MAX_TRIP_NAME = 20;

export type RenameState = { error: string | null; saved: number };

/** The owner names the trip; an empty name goes back to the default title. */
export async function renameTrip(tripId: number, prev: RenameState, formData: FormData): Promise<RenameState> {
  const name = String(formData.get("name") ?? "").trim();
  if ([...name].length > MAX_TRIP_NAME) {
    return { error: `여행 이름은 ${MAX_TRIP_NAME}자까지예요.`, saved: prev.saved };
  }
  try {
    await renameTripRow(tripId, name === "" ? null : name);
  } catch {
    return { error: "바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.", saved: prev.saved };
  }
  revalidatePath("/trips");
  revalidatePath("/trip");
  return { error: null, saved: prev.saved + 1 };
}

/** The owner deletes a trip with everything in it, including the files they uploaded. */
export async function deleteTrip(tripId: number): Promise<string | null> {
  try {
    const paths = await ownFilePaths(tripId);
    const deleted = await deleteTripRow(tripId);
    if (!deleted) return "여행 주인만 지울 수 있어요.";
    await removeStoredFiles(paths);
  } catch {
    return "지우지 못했어요. 잠시 뒤 다시 시도해 주세요.";
  }
  const jar = await cookies();
  if (jar.get(CURRENT_TRIP_COOKIE)?.value === String(tripId)) jar.delete(CURRENT_TRIP_COOKIE);
  revalidatePath("/trips");
  return null;
}
