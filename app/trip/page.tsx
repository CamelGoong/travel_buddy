import Link from "next/link";
import { RiArrowRightSLine } from "@remixicon/react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { formatKoreanDate } from "@/lib/tokyo-time";
import { LogoutButton } from "@/features/auth";
import { buildPrepItems, decideBriefing, getDismissedToday, getPrepChecks } from "@/features/briefing";
import { getChecklist } from "@/features/checklist";
import { RouteLine, tripStage } from "@/features/route-line";
import { buildCourse, placesForDay } from "@/features/trip";
import { outfitLine, WeatherSummary } from "@/features/weather";

import { confirmEvening, confirmMorning, toggleChecklistItem, togglePrepItem } from "./actions";
import { CheckRow } from "./check-row";
import { loadForecast, loadTripContext } from "./context";

export default async function TripPage() {
  const ctx = await loadTripContext();
  const { trip, now, days, todayDay, tomorrowDay } = ctx;

  const [checklist, dismissedToday] = await Promise.all([
    getChecklist(trip.id),
    getDismissedToday(trip.id, now.date),
  ]);

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
      action={<LogoutButton />}
    />
  );

  const briefing = decideBriefing({
    nowTime: now.time,
    todayIsTripDay: todayDay !== null,
    tomorrowIsTripDay: tomorrowDay !== null,
    dismissedToday,
  });

  if (briefing === "morning" && todayDay !== null) {
    const forecast = await loadForecast(now.date);
    const places = placesForDay(todayDay);
    return (
      <AppShell routeLine={routeLine} header={header}>
        <Card data-testid="morning-briefing">
          <CardHeader>
            <CardDescription>아침 안내 · {formatKoreanDate(now.date)}</CardDescription>
            <CardTitle className="text-xl">좋은 아침! 오늘은 {todayDay}일차예요 ☀️</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <WeatherSummary forecast={forecast} />
            {forecast && <p className="font-medium">👕 {outfitLine(forecast)}</p>}
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">오늘 갈 곳</h2>
              <PlaceList places={places} />
            </section>
            <form action={confirmMorning}>
              <button type="submit" className={buttonVariants({ size: "lg", className: "w-full" })}>
                확인, 오늘 시작할게요
              </button>
            </form>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (briefing === "evening" && tomorrowDay !== null) {
    const [forecast, checks] = await Promise.all([
      loadForecast(ctx.tomorrow),
      getPrepChecks(trip.id, ctx.tomorrow),
    ]);
    const prepItems = buildPrepItems({
      tomorrowIsFirstDay: tomorrowDay === 1,
      todayIsTripDay: todayDay !== null,
      tomorrowRainChance: forecast?.rainChance ?? null,
      checklist,
      checks,
    });
    const places = placesForDay(tomorrowDay);
    return (
      <AppShell routeLine={routeLine} header={header}>
        <Card data-testid="evening-briefing">
          <CardHeader>
            <CardDescription>저녁 안내 · 내일 {formatKoreanDate(ctx.tomorrow)}</CardDescription>
            <CardTitle className="text-xl">내일은 {tomorrowDay}일차예요 🌙</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">내일 코스 한눈에</h2>
              {places.length > 0 ? (
                <p className="leading-relaxed" data-testid="tomorrow-summary">
                  {places.map((p) => `${p.time} ${p.name}`).join(" → ")}
                </p>
              ) : (
                <p className="text-muted-foreground">내일은 자유 일정이에요.</p>
              )}
            </section>
            <WeatherSummary forecast={forecast} />
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground">자기 전에 챙겨요</h2>
              {prepItems.length > 0 ? (
                <FieldGroup className="gap-3" data-testid="prep-items">
                  {prepItems.map((item) => (
                    <CheckRow
                      key={item.key}
                      id={`prep-${item.key}`}
                      label={item.label}
                      defaultChecked={item.done}
                      onToggle={togglePrepItem.bind(null, trip.id, item.key, item.checklistItemId ?? null)}
                    />
                  ))}
                </FieldGroup>
              ) : (
                <p className="text-muted-foreground">챙길 게 없어요. 푹 자요!</p>
              )}
            </section>
            <form action={confirmEvening}>
              <button type="submit" className={buttonVariants({ size: "lg", className: "w-full" })}>
                확인, 내일 봐요
              </button>
            </form>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const course = buildCourse(trip);
  const doneCount = checklist.filter((i) => i.done).length;

  return (
    <AppShell routeLine={routeLine} header={header}>
      <Card>
        <CardHeader>
          <CardTitle>출발 전 체크리스트</CardTitle>
          <CardDescription>
            {doneCount}/{checklist.length} 완료
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-3" data-testid="checklist">
            {checklist.map((item) => (
              <CheckRow
                key={item.id}
                id={`checklist-${item.key}`}
                label={item.label}
                defaultChecked={item.done}
                onToggle={toggleChecklistItem.bind(null, item.id)}
              />
            ))}
          </FieldGroup>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">코스 초안</h2>
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
                    <RiArrowRightSLine className="shrink-0 text-muted-foreground" />
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
