import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell, PageHeader } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserId } from "@/lib/supabase/server";
import { formatKoreanDate } from "@/lib/tokyo-time";
import { JOIN_MESSAGES } from "@/features/members";
import { getInviteInfo } from "@/features/members/server";
import { rememberTrip } from "@/app/trips/actions";

import { JoinForm } from "./join-form";

/** Landing page of an invite link: sign in first, then pick a nickname and join. */
export default async function JoinPage({ params }: PageProps<"/join/[token]">) {
  const { token } = await params;
  if (!(await getUserId())) redirect(`/auth/login?next=${encodeURIComponent(`/join/${token}`)}`);

  const info = await getInviteInfo(token);
  if (info.status === "joined" && info.tripId) {
    await rememberTrip(info.tripId);
    redirect("/trip");
  }

  return (
    <AppShell header={<PageHeader eyebrow="Travel Buddy" title="여행에 초대받았어요" />}>
      {info.status === "ok" && info.startDate && info.endDate ? (
        <Card>
          <CardHeader>
            <CardTitle>{info.ownerNickname}님의 오사카 여행</CardTitle>
            <CardDescription>
              {formatKoreanDate(info.startDate)} – {formatKoreanDate(info.endDate)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinForm token={token} defaultNickname={info.defaultNickname} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>참여할 수 없어요</CardTitle>
            <CardDescription>
              {JOIN_MESSAGES[info.status === "full" ? "full" : info.status === "expired" ? "expired" : "invalid"]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/trips" className={buttonVariants({ variant: "outline" })}>
              내 여행으로
            </Link>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
