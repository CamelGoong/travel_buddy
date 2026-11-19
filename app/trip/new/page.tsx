import { redirect } from "next/navigation";

import { AppShell, HomeLink, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTokyoNow } from "@/lib/clock";
import { getUserId } from "@/lib/supabase/server";
import { LogoutButton } from "@/features/auth";
import { OnboardingGate } from "@/features/onboarding";

import { CreateTripForm } from "./create-trip-form";

export default async function NewTripPage() {
  if (!(await getUserId())) redirect("/auth/login?next=/trip/new");
  const now = await getTokyoNow();

  return (
    <AppShell header={<PageHeader eyebrow="Travel Buddy" title="여행 만들기" action={<LogoutButton />} />}>
      <HomeLink className="-ml-2 w-fit" />
      <Card>
        <CardHeader>
          <CardTitle>언제 떠나요?</CardTitle>
          <CardDescription>날짜만 고르면 명소 위주로 코스 초안을 짜 드려요.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTripForm defaultStart={now.date} />
        </CardContent>
      </Card>
      <OnboardingGate />
    </AppShell>
  );
}
