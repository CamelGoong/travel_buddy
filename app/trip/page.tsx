import Link from "next/link";
import { RiFolderLine } from "@remixicon/react";

import { AppShell, HomeLink, PageHeader } from "@/components/app-shell";
import { LinkArrow } from "@/components/link-pending";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKoreanDate } from "@/lib/tokyo-time";
import { LogoutButton } from "@/features/auth";
import { getChecklist, getPendingSuggestions } from "@/features/checklist";
import { getVault } from "@/features/documents/store";
import { getMembers } from "@/features/members/server";
import { getOfflineManifest } from "@/features/documents/store";
import { OfflineSync } from "@/components/offline-sync";
import { getFxSnapshot } from "@/features/fx/server";
import { getSpentByDay } from "@/features/expenses/server";
import { RouteLine, tripStage } from "@/features/route-line";
import { buildCourse } from "@/features/trip";

import { acceptSuggestion, dismissChecklistSuggestion } from "./actions";
import { summarizeBudget } from "./budget";
import { BudgetCard } from "./budget-card";
import { RegenerateButton } from "./regenerate-button";
import { ChecklistEditor } from "./checklist-editor";
import { CompanionsCard } from "./companions/companions-card";
import { loadTripContext } from "./context";
import { ChecklistSuggestions } from "./checklist-suggestions";
import { SuggestionIsland } from "./suggestion-island";
import { loadIslandData } from "./suggestions";

export default async function TripPage() {
  const ctx = await loadTripContext();
  const { trip, now, days, todayDay } = ctx;

  const [checklist, pending, spentByDay, vault, members, fx, manifest] = await Promise.all([
    getChecklist(trip.id),
    getPendingSuggestions(trip.id),
    getSpentByDay(trip.id),
    getVault(trip.id),
    getMembers(trip.id),
    getFxSnapshot(),
    getOfflineManifest(trip.id),
  ]);
  const filledSlots = vault.filter((slot) => slot.files.length > 0).length;
  const budget = summarizeBudget({
    budgetYen: trip.budgetYen,
    dayCount: days,
    todayDay,
    beforeTrip: now.date < trip.startDate,
    spentByDay,
  });
  const island = await loadIslandData(ctx, checklist, null, budget);

  const routeLine = (
    <RouteLine model={tripStage({ today: now.date, startDate: trip.startDate, dayCount: days })} />
  );
  const header = (
    <PageHeader
      eyebrow={
        <>
          {formatKoreanDate(trip.startDate)} – {formatKoreanDate(trip.endDate)} · {days - 1}박 {days}일
          {now.simulated && (
            <Badge variant="outline" className="ml-2">
              개발용 시각 {now.date.slice(5)} {now.time}
            </Badge>
          )}
        </>
      }
      title="오사카 여행"
      action={
        <div className="flex items-center">
          <HomeLink />
          <LogoutButton />
        </div>
      }
    />
  );

  const course = buildCourse(trip);
  const doneCount = checklist.filter((i) => i.done).length;

  return (
    <AppShell
      routeLine={routeLine}
      suggestion={<SuggestionIsland data={island} />}
      header={header}
    >
      <Card>
        <CardHeader>
          <CardTitle>출발 전 체크리스트</CardTitle>
          <CardDescription>
            {doneCount}/{checklist.length} 완료
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChecklistEditor items={checklist} isOwner={trip.isOwner} />
        </CardContent>
        {trip.isOwner && pending.length > 0 && (
          <CardContent>
            <ChecklistSuggestions
              suggestions={pending}
              onAdd={acceptSuggestion}
              onDismiss={dismissChecklistSuggestion}
            />
          </CardContent>
        )}
      </Card>

      <Link
        href="/trip/documents"
        className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        data-testid="documents-card"
      >
        <Card size="sm" className="transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiFolderLine />
              서류 보관함
            </CardTitle>
            <CardDescription>
              {filledSlots}/{vault.length} 칸 채움 · 여권, 항공권을 올려 두면 필요할 때 바로 꺼내요
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>

      <OfflineSync manifest={manifest} />

      <CompanionsCard
        tripId={trip.id}
        isOwner={trip.isOwner}
        members={members.map((m) => ({ id: m.id, nickname: m.nickname, role: m.role, isMe: m.isMe }))}
      />

      <BudgetCard summary={budget} canEdit={trip.isOwner} rate={fx?.rate ?? null} />

      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            코스 초안
            {trip.courseSource === "default" && <Badge variant="outline">기본 코스</Badge>}
          </h2>
          {trip.isOwner && <RegenerateButton />}
        </div>
        {trip.isOwner && <p className="-mt-1 text-xs text-muted-foreground">일차를 열어 편집 버튼을 누르면 순서와 장소를 바꿀 수 있어요.</p>}
        <ol className="flex flex-col gap-3" data-testid="course">
          {course.map((day) => (
            <li key={day.dayNumber}>
              <Link href={`/trip/day/${day.dayNumber}`} className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                <Card size="sm" className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {day.dayNumber}일차
                      {day.dayNumber === todayDay && <Badge>오늘</Badge>}
                    </CardTitle>
                    <CardDescription>{formatKoreanDate(day.date)}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-end justify-between gap-2">
                    <PlaceList places={day.places} />
                    <LinkArrow />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <Link href="/trip/new" className={buttonVariants({ variant: "outline" })}>
        새 여행 만들기
      </Link>
    </AppShell>
  );
}

function PlaceList({ places }: { places: { name: string; time: string }[] }) {
  if (places.length === 0) return <p className="text-muted-foreground">자유 일정</p>;
  return (
    <ul className="flex flex-col gap-1">
      {places.map((p) => (
        <li key={p.name} className="flex gap-3">
          <span className="font-heading text-sm text-muted-foreground tabular-nums">{p.time}</span>
          <span>{p.name}</span>
        </li>
      ))}
    </ul>
  );
}
