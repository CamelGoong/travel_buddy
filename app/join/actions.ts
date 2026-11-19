"use server";

import { redirect } from "next/navigation";

import { rememberTrip } from "@/app/trips/actions";
import { JOIN_MESSAGES, parseNickname } from "@/features/members";
import { joinTrip } from "@/features/members/server";

export type JoinFormState = { error: string | null; nickname: string };

/** Joins the trip behind an invite link with the chosen nickname. */
export async function joinWithLink(token: string, _prev: JoinFormState, formData: FormData): Promise<JoinFormState> {
  const raw = String(formData.get("nickname") ?? "");
  const parsed = parseNickname(raw);
  if (!parsed.ok) return { error: parsed.error, nickname: raw };

  let tripId: number | null;
  try {
    const result = await joinTrip(token, parsed.nickname);
    if (result.status !== "ok" && result.status !== "joined") {
      return { error: JOIN_MESSAGES[result.status], nickname: raw };
    }
    tripId = result.tripId;
  } catch {
    return { error: "참여하지 못했어요. 잠시 뒤 다시 시도해 주세요.", nickname: raw };
  }
  if (tripId) await rememberTrip(tripId);
  redirect("/trip");
}
