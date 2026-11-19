import { redirect } from "next/navigation";

import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserId } from "@/lib/supabase/server";
import { getProfile } from "@/features/profile/server";

import { AppNav } from "../app-nav";
import { ProfileForm } from "./profile-form";

/** My page: the account's name and photo, kept deliberately small. */
export default async function MyPage() {
  const userId = await getUserId();
  if (!userId) redirect("/auth/login?next=%2Fmypage");
  const profile = await getProfile();
  if (!profile) redirect("/auth/login?next=%2Fmypage");

  return (
    <AppShell header={<PageHeader eyebrow="Travel Buddy" title="마이페이지" action={<AppNav current="mypage" />} />}>
      <Card>
        <CardHeader>
          <CardTitle>내 정보</CardTitle>
          <CardDescription data-testid="profile-email">{profile.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            userId={userId}
            displayName={profile.displayName}
            avatarUrl={profile.avatarUrl}
            currentAvatarPath={profile.avatarPath}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
