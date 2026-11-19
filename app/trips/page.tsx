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
import { OnboardingGate, ReplayTour } from "@/features/onboarding";
import { getCurrentTrip, listTrips, tripTitle } from "@/features/trip";

import { AppNav } from "../app-nav";
import { OpenTripLink } from "./open-trip-link";
import { TripCardActions } from "./trip-card-actions";

/** Home: all of the user's trips, with the current one marked, and a way to make another. */
export default async function TripsPage() {
  if (!(await getUserId())) redirect("/auth/login?next=%2Ftrips");

  const [trips, current, now] = await Promise.all([listTrips(), getCurrentTrip(), getTokyoNow()]);

  return (
    <AppShell
      header={<PageHeader eyebrow="Travel Buddy" title="내 여행" action={<AppNav current="trips" />} />}
    >
      {trips.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>아직 여행이 없어요</CardTitle>
            <CardDescription>날짜를 정하면 코스 초안과 체크리스트를 만들어 드려요.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4" data-testid="trip-list">
          {trips.map((trip) => {
            const title = tripTitle(trip);
            const status =
              now.date < trip.startDate ? "출발 전" : now.date > trip.endDate ? "다녀옴" : "여행 중";
            return (
              <li key={trip.id} className="flex flex-col gap-1.5">
                <OpenTripLink tripId={trip.id}>
                    <Card size="sm" className="transition-colors hover:bg-muted/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {title}
                          <Badge variant={status === "여행 중" ? "default" : "outline"}>{status}</Badge>
                          {current?.id === trip.id && <Badge variant="secondary">보는 중</Badge>}
                          {!trip.isOwner && <Badge variant="outline">함께하는 여행</Badge>}
                        </CardTitle>
                        <CardDescription>
                          {formatKoreanDate(trip.startDate)} – {formatKoreanDate(trip.endDate)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-end">
                        <RiArrowRightSLine className="text-muted-foreground" />
                      </CardContent>
                    </Card>
                </OpenTripLink>
                {trip.isOwner && <TripCardActions tripId={trip.id} name={trip.name} title={title} />}
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/trip/new" className={buttonVariants({ variant: "outline" })}>
        <RiAddLine data-icon="inline-start" />
        새 여행 만들기
      </Link>
      <div className="flex justify-center">
        <ReplayTour />
      </div>
      <OnboardingGate />
    </AppShell>
  );
}
