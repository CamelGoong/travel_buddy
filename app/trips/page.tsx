import Link from "next/link";
import { redirect } from "next/navigation";
import { RiAddLine, RiArrowRightSLine } from "@remixicon/react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTokyoNow } from "@/lib/clock";
import { getUserId } from "@/lib/supabase/server";
import { formatKoreanDate } from "@/lib/tokyo-time";
import { LogoutButton } from "@/features/auth";
import { dayCount, getCurrentTrip, listTrips } from "@/features/trip";

import { openTrip } from "./actions";

/** Home: all of the user's trips, with the current one marked, and a way to make another. */
export default async function TripsPage() {
  if (!(await getUserId())) redirect("/auth/login?next=%2Ftrips");

  const [trips, current, now] = await Promise.all([listTrips(), getCurrentTrip(), getTokyoNow()]);

  return (
    <AppShell
      header={<PageHeader eyebrow="Travel Buddy" title="내 여행" action={<LogoutButton />} />}
    >
      {trips.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>아직 여행이 없어요</CardTitle>
            <CardDescription>날짜를 정하면 코스 초안과 체크리스트를 만들어 드려요.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="trip-list">
          {trips.map((trip) => {
            const days = dayCount(trip);
            const status =
              now.date < trip.startDate ? "출발 전" : now.date > trip.endDate ? "다녀옴" : "여행 중";
            return (
              <li key={trip.id}>
                <form action={openTrip.bind(null, trip.id)}>
                  <button
                    type="submit"
                    className="block w-full rounded-xl text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <Card size="sm" className="transition-colors hover:bg-muted/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          오사카 {days - 1}박 {days}일
                          <Badge variant={status === "여행 중" ? "default" : "outline"}>{status}</Badge>
                          {current?.id === trip.id && <Badge variant="secondary">보는 중</Badge>}
                        </CardTitle>
                        <CardDescription>
                          {formatKoreanDate(trip.startDate)} – {formatKoreanDate(trip.endDate)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-end">
                        <RiArrowRightSLine className="text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/trip/new" className={buttonVariants({ variant: "outline" })}>
        <RiAddLine data-icon="inline-start" />
        새 여행 만들기
      </Link>
    </AppShell>
  );
}
