"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { clearOfflineFiles } from "@/lib/offline-store";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    // Documents saved on this device go away with the session.
    await clearOfflineFiles();
    await createClient().auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <Button variant="ghost" size="sm" onClick={logout}>
      로그아웃
    </Button>
  );
}
