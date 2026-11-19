import Link from "next/link";
import { notFound } from "next/navigation";
import { RiArrowLeftSLine } from "@remixicon/react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatKoreanDate } from "@/lib/tokyo-time";
import { LogoutButton } from "@/features/auth";
import { getChecklist } from "@/features/checklist";
import { allowanceForDay } from "@/features/budget";
import { formatYen, getDayExpenses, getSpentByDay } from "@/features/expenses";
import { dayStage, RouteLine } from "@/features/route-line";
import { dateOfDay, placesForDay } from "@/features/trip";

import { summarizeBudget } from "../../budget";
import { loadTripContext } from "../../context";
import { SuggestionIsland } from "../../suggestion-island";
import { loadIslandData } from "../../suggestions";
import { recordExpense } from "./actions";
import { ExpenseForm } from "./expense-form";

export default async function DayPage({ params }: PageProps<"/trip/day/[day]">) {
  const { day } = await params;
  const ctx = await loadTripContext(`/trip/day/${day}`);
  const { trip, now, days, todayDay } = ctx;

  const dayNumber = Number(day);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > days) notFound();

  const date = dateOfDay(trip, dayNumber);
  const places = placesForDay(dayNumber);
  const model = dayStage({ dayNumber, dayDate: date, today: now.date, nowTime: now.time, places });
  const [expenses, checklist, spentByDay] = await Promise.all([
    getDayExpenses(trip.id, dayNumber),
    getChecklist(trip.id),
    getSpentByDay(trip.id),
  ]);
  const budget = summarizeBudget({
    budgetYen: trip.budgetYen,
    dayCount: days,
    todayDay,
    beforeTrip: now.date < trip.startDate,
    spentByDay,
  });
  const dayAllowance =
    trip.budgetYen !== null
      ? allowanceForDay({ budgetYen: trip.budgetYen, dayCount: days, spentByDay }, dayNumber)
      : null;
  const island = await loadIslandData(ctx, checklist, dayNumber, budget);
  const total = expenses.reduce((sum, e) => sum + e.amountYen, 0);

  return (
    <AppShell
      routeLine={<RouteLine model={model} />}
      suggestion={<SuggestionIsland data={island} />}
      header={
        <div className="flex flex-col gap-3">
          <Link href="/trip" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}>
            <RiArrowLeftSLine data-icon="inline-start" />
            여행 전체
          </Link>
          <PageHeader
            eyebrow={
              <>
                {formatKoreanDate(date)}
                {now.simulated && (
                  <Badge variant="outline" className="ml-2">
                    개발용 시각 {now.date.slice(5)} {now.time}
                  </Badge>
                )}
              </>
            }
            title={
              <span className="flex items-center gap-2">
                {dayNumber}일차 {dayNumber === todayDay && <Badge>오늘</Badge>}
              </span>
            }
            action={<LogoutButton />}
          />
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>오늘 코스</CardTitle>
        </CardHeader>
        <CardContent>
          {places.length === 0 ? (
            <p className="text-muted-foreground">자유 일정이에요. 마음 가는 대로!</p>
          ) : (
            <ol className="flex flex-col gap-3" data-testid="day-places">
              {places.map((p, i) => (
                <li
                  key={p.name}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2",
                    i === model.activeIndex && "bg-primary/10 font-semibold",
                  )}
                  aria-current={i === model.activeIndex ? "step" : undefined}
                >
                  <span className="font-heading text-sm text-muted-foreground tabular-nums">{p.time}</span>
                  <span>{p.name}</span>
                  {i === model.activeIndex && <Badge className="ml-auto">지금</Badge>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>이날 여비</CardTitle>
          <CardDescription>
            합계 <span className="font-heading text-lg font-semibold text-foreground" data-testid="day-total">{formatYen(total)}</span>
            {dayAllowance && (
              <span className="ml-2" data-testid="day-allowance">
                {dayAllowance.kind === "allowance"
                  ? `· 이날 권장 ${formatYen(dayAllowance.yen)}`
                  : `· 예산을 ${formatYen(dayAllowance.yen)} 넘었어요`}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ExpenseForm idPrefix="day" action={recordExpense.bind(null, trip.id, dayNumber)} />
          {expenses.length > 0 && (
            <>
              <Separator />
              <ul className="flex flex-col gap-2" data-testid="expenses">
                {expenses.map((e) => (
                  <li key={e.id} className="flex justify-between gap-3">
                    <span>{e.label}</span>
                    <span className="tabular-nums">{formatYen(e.amountYen)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
