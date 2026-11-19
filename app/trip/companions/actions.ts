"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";

import { parseNickname } from "@/features/members";
import {
  createInviteToken,
  leaveTrip,
  removeMember,
  renameMyNickname,
} from "@/features/members/server";
import { CURRENT_TRIP_COOKIE, getCurrentTrip } from "@/features/trip";

/** Makes a fresh 7-day invite link (the old one stops working) and returns its address; owner only. */
export async function createInviteLink(): Promise<string | null> {
  const trip = await getCurrentTrip();
  if (!trip || !trip.isOwner) return null;
  const token = await createInviteToken(trip.id);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/join/${token}`;
}

export type NicknameFormState = { error: string | null; nickname: string; saved: number };

export async function changeNickname(
  tripId: number,
  prev: NicknameFormState,
  formData: FormData,
): Promise<NicknameFormState> {
  const raw = String(formData.get("nickname") ?? "");
  const parsed = parseNickname(raw);
  if (!parsed.ok) return { error: parsed.error, nickname: raw, saved: prev.saved };
  try {
    if ((await renameMyNickname(tripId, parsed.nickname)) === "taken") {
      return { error: "이미 이 여행에서 쓰는 닉네임이에요.", nickname: raw, saved: prev.saved };
    }
  } catch {
    return { error: "바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.", nickname: raw, saved: prev.saved };
  }
  refresh();
  return { error: null, nickname: parsed.nickname, saved: prev.saved + 1 };
}

/** The signed-in companion leaves the trip; their files and checklist marks are deleted. */
export async function leaveCurrentTrip(tripId: number) {
  await leaveTrip(tripId);
  (await cookies()).delete(CURRENT_TRIP_COOKIE);
  redirect("/trips");
}

/** The owner removes a companion. */
export async function removeCompanion(memberId: number) {
  await removeMember(memberId);
  refresh();
}
