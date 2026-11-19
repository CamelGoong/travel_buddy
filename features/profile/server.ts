// Server-only: reads the signed-in account's profile (name, e-mail, photo link).
import { createClient } from "@/lib/supabase/server";

import { AVATAR_BUCKET } from "./rules";

export type Profile = {
  email: string;
  /** The chosen name; the e-mail's local part until one is set */
  displayName: string;
  avatarPath: string | null;
  /** One-hour link to the photo, or null */
  avatarUrl: string | null;
};

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const email = user.email ?? "";
  const meta = (user.user_metadata ?? {}) as { display_name?: string; avatar_path?: string };
  const path = typeof meta.avatar_path === "string" && meta.avatar_path ? meta.avatar_path : null;
  let avatarUrl: string | null = null;
  if (path) {
    const signed = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
    avatarUrl = signed.data?.signedUrl ?? null;
  }
  return {
    email,
    displayName: meta.display_name?.trim() || email.split("@")[0] || "나",
    avatarPath: path,
    avatarUrl,
  };
}
