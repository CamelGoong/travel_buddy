import { createClient, getUserId } from "@/lib/supabase/server";

import { INVITE_DAYS, type JoinStatus } from "./nickname";

export type Member = {
  id: number;
  userId: string;
  nickname: string;
  role: "owner" | "companion";
  isMe: boolean;
};

/** Active members of a trip, owner first. */
export async function getMembers(tripId: number): Promise<Member[]> {
  const supabase = await createClient();
  const me = await getUserId();
  const { data, error } = await supabase
    .from("trip_members")
    .select("id, user_id, nickname, role")
    .eq("trip_id", tripId)
    .is("left_at", null)
    .order("id");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    role: row.role as Member["role"],
    isMe: row.user_id === me,
  }));
}

/** Changes the signed-in member's nickname; "taken" when another member uses it. */
export async function renameMyNickname(tripId: number, nickname: string): Promise<"ok" | "taken"> {
  const supabase = await createClient();
  const me = await getUserId();
  if (!me) return "taken";
  const { error } = await supabase
    .from("trip_members")
    .update({ nickname })
    .eq("trip_id", tripId)
    .eq("user_id", me)
    .is("left_at", null);
  if (error) {
    if (error.code === "23505") return "taken";
    throw error;
  }
  return "ok";
}

/** Makes (or replaces) the trip's invite link token, valid for 7 days. Owner only. */
export async function createInviteToken(tripId: number): Promise<string> {
  const supabase = await createClient();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("trip_invites")
    .upsert({ trip_id: tripId, token, expires_at: expiresAt, created_at: new Date().toISOString() }, { onConflict: "trip_id" });
  if (error) throw error;
  return token;
}

export type InviteInfo = {
  status: "ok" | "joined" | "expired" | "invalid" | "full";
  tripId: number | null;
  startDate: string | null;
  endDate: string | null;
  ownerNickname: string | null;
  defaultNickname: string;
};

export async function getInviteInfo(token: string): Promise<InviteInfo> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invite_info", { p_token: token });
  if (error) {
    // A malformed token is just an invalid link.
    if (error.code === "22P02") {
      return { status: "invalid", tripId: null, startDate: null, endDate: null, ownerNickname: null, defaultNickname: "나" };
    }
    throw error;
  }
  const row = data[0];
  return {
    status: row.status as InviteInfo["status"],
    tripId: row.trip_id,
    startDate: row.start_date,
    endDate: row.end_date,
    ownerNickname: row.owner_nickname,
    defaultNickname: row.default_nickname ?? "나",
  };
}

export async function joinTrip(token: string, nickname: string): Promise<{ status: JoinStatus; tripId: number | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_trip", { p_token: token, p_nickname: nickname });
  if (error) {
    if (error.code === "22P02") return { status: "invalid", tripId: null };
    throw error;
  }
  const row = data[0];
  return { status: row.status as JoinStatus, tripId: row.trip_id };
}

/** Leaves a trip; removes the person's stored files from the private bucket. */
export async function leaveTrip(tripId: number): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("leave_trip", { p_trip: tripId });
  if (error) throw error;
  const paths = (data ?? []) as string[];
  if (paths.length > 0) await supabase.storage.from("trip-documents").remove(paths);
}

/** Removes a companion (owner only). Their stored files stay unreachable but are not deleted from Storage. */
export async function removeMember(memberId: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { p_member: memberId });
  if (error) throw error;
}

/** The signed-in person's active member row in a trip, or null. */
export async function getMyMember(tripId: number): Promise<Member | null> {
  return (await getMembers(tripId)).find((m) => m.isMe) ?? null;
}
