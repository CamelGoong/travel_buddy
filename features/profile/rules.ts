// Profile rules shared by server and client (docs/specs/mypage-and-trip-management/).

export const MAX_DISPLAY_NAME = 10;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_BUCKET = "avatars";

/** Display name: 1–10 characters after trimming. */
export function parseDisplayName(raw: string): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim();
  if (name.length === 0) return { ok: false, error: "이름을 적어 주세요." };
  if ([...name].length > MAX_DISPLAY_NAME) return { ok: false, error: `이름은 ${MAX_DISPLAY_NAME}자까지예요.` };
  return { ok: true, name };
}

/** Why a photo cannot be used, or null when it can. */
export function avatarProblem(file: { type: string; size: number }): string | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return "JPG, PNG, WebP 사진만 쓸 수 있어요.";
  if (file.size > MAX_AVATAR_BYTES) return "사진은 2MB까지예요.";
  if (file.size === 0) return "빈 파일이에요.";
  return null;
}

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Storage path of a new photo inside the account's own folder. */
export function avatarPath(userId: string, contentType: string, stamp: number): string {
  return `${userId}/avatar-${stamp}.${EXTENSIONS[contentType] ?? "jpg"}`;
}
