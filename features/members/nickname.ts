// Nickname and member rules shared by server and client (docs/specs/trip-companions/).

export const MAX_NICKNAME = 10;
export const MAX_MEMBERS = 6;
export const INVITE_DAYS = 7;

/** A trip-local nickname: 1–10 characters after trimming. */
export function parseNickname(raw: string): { ok: true; nickname: string } | { ok: false; error: string } {
  const nickname = raw.trim();
  if (nickname.length === 0) return { ok: false, error: "닉네임을 적어 주세요." };
  if ([...nickname].length > MAX_NICKNAME) return { ok: false, error: `닉네임은 ${MAX_NICKNAME}자까지예요.` };
  return { ok: true, nickname };
}

/** The default nickname for an account: the part of its e-mail before the "@". */
export function defaultNickname(email: string | null | undefined): string {
  const local = (email ?? "").split("@")[0].trim();
  return [...(local || "나")].slice(0, MAX_NICKNAME).join("");
}

export type JoinStatus = "ok" | "joined" | "expired" | "invalid" | "full" | "taken" | "bad_name";

export const JOIN_MESSAGES: Record<Exclude<JoinStatus, "ok" | "joined">, string> = {
  expired: "만료되었거나 취소된 링크예요. 초대한 사람에게 새 링크를 받아 주세요.",
  invalid: "만료되었거나 취소된 링크예요. 초대한 사람에게 새 링크를 받아 주세요.",
  full: "인원이 가득 찼어요. 한 여행에는 최대 6명까지 함께할 수 있어요.",
  taken: "이미 이 여행에서 쓰는 닉네임이에요. 다른 닉네임을 적어 주세요.",
  bad_name: `닉네임은 1–${MAX_NICKNAME}자로 적어 주세요.`,
};
