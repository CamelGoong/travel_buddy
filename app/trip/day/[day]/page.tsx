import Link from "next/link";
import { notFound } from "next/navigation";
import { RiArrowLeftSLine } from "@remixicon/react";

import { AppShell, HomeLink, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatKoreanDate } from "@/lib/tokyo-time";
import { LogoutButton } from "@/features/auth";
import { getChecklist } from "@/features/checklist";
import { allowanceForDay } from "@/features/budget";
import {
  categoryLabel,
  EXPENSE_CATEGORIES,
  filterExpenses,
  formatYen,
  parseCategory,
  type ExpenseCategory,
} from "@/features/expenses";
import { getMembers } from "@/features/members/server";
import { getDayExpenses, getSpentByDay } from "@/features/expenses/server";
import { dayStage, RouteLine } from "@/features/route-line";
import { dateOfDay, OSAKA_SPOTS, placesOfDay } from "@/features/trip";

import { summarizeBudget } from "../../budget";
import { loadTripContext } from "../../context";
import { SuggestionIsland } from "../../suggestion-island";
import { loadIslandData } from "../../suggestions";
import { recordExpense } from "./actions";
import { PlacesEditor } from "./places-editor";
import { ExpenseForm } from "./expense-form";

export default async function DayPage({ params, searchParams }: PageProps<"/trip/day/[day]">) {
  const { day } = await params;
  const query = await searchParams;
  const editing = (Array.isArray(query.edit) ? query.edit[0] : query.edit) === "1";
  const personFilter = Number(Array.isArray(query.person) ? query.person[0] : query.person) || null;
  const rawCategory = Array.isArray(query.cat) ? query.cat[0] : query.cat;
  const categoryFilter: ExpenseCategory | null = rawCategory ? parseCategory(rawCategory) : null;
  const ctx = await loadTripContext(`/trip/day/${day}`);
  const { trip, now, days, todayDay } = ctx;

  const dayNumber = Number(day);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > days) notFound();

  const date = dateOfDay(trip, dayNumber);
  const places = placesOfDay(trip, dayNumber);
  const model = dayStage({ dayNumber, dayDate: date, today: now.date, nowTime: now.time, places });
  const [expenses, checklist, spentByDay, members] = await Promise.all([
    getDayExpenses(trip.id, dayNumber),
    getChecklist(trip.id),
    getSpentByDay(trip.id),
    getMembers(trip.id),
  ]);
  const me = members.find((m) => m.isMe);
  const shown = filterExpenses(expenses, { memberId: personFilter, category: categoryFilter });
  const filtering = personFilter !== null || categoryFilter !== null;
  const filterHref = (person: number | null, cat: ExpenseCategory | null) => {
    const params = new URLSearchParams();
    if (person) params.set("person", String(person));
    if (cat) params.set("cat", cat);
    const qs = params.toString();
    return `/trip/day/${dayNumber}${qs ? `?${qs}` : ""}`;
  };
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
  const shownTotal = shown.reduce((sum, e) => sum + e.amountYen, 0);

  return (
    <AppShell
      routeLine={<RouteLine model={model} />}
      suggestion={<SuggestionIsland data={island} />}
      header={
        <div className="flex flex-col gap-3">
          <div className="-ml-2 flex items-center gap-1">
            <HomeLink />
            <Link href="/trip" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <RiArrowLeftSLine data-icon="inline-start" />
              여행 전체
            </Link>
          </div>
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
          <CardTitle>{dayNumber === todayDay ? "오늘 코스" : `${dayNumber}일차 코스`}</CardTitle>
          {trip.isOwner && (
            <CardAction>
              <Link
                href={editing ? `/trip/day/${dayNumber}` : `/trip/day/${dayNumber}?edit=1`}
                replace
                className={buttonVariants({ variant: editing ? "default" : "ghost", size: "sm" })}
              >
                {editing ? "완료" : "편집"}
              </Link>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {editing && trip.isOwner ? (
            <PlacesEditor
              dayNumber={dayNumber}
              places={places.map((p) => ({ name: p.name, time: p.time }))}
              spots={OSAKA_SPOTS.filter((s) => !places.some((p) => p.name === s.name)).map((s) => ({ key: s.key, name: s.name }))}
            />
          ) : places.length === 0 ? (
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
          <ExpenseForm
            idPrefix="day"
            action={recordExpense.bind(null, trip.id, dayNumber)}
            members={members.map((m) => ({ id: m.id, nickname: m.nickname }))}
            myMemberId={me?.id}
          />
          {expenses.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2" data-testid="expense-filter">
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip href={filterHref(null, categoryFilter)} active={personFilter === null}>전체</FilterChip>
                  {members.map((m) => (
                    <FilterChip key={m.id} href={filterHref(personFilter === m.id ? null : m.id, categoryFilter)} active={personFilter === m.id}>
                      {m.nickname}
                    </FilterChip>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip href={filterHref(personFilter, null)} active={categoryFilter === null}>모든 종류</FilterChip>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <FilterChip key={c.key} href={filterHref(personFilter, categoryFilter === c.key ? null : c.key)} active={categoryFilter === c.key}>
                      {c.label}
                    </FilterChip>
                  ))}
                </div>
                {filtering && (
                  <p className="text-sm text-muted-foreground" data-testid="filtered-total">
                    걸러 본 합계 <span className="font-heading font-semibold text-foreground">{formatYen(shownTotal)}</span> · {shown.length}건
                  </p>
                )}
              </div>
              <ul className="flex flex-col gap-3" data-testid="expenses">
                {shown.map((e) => (
                  <li key={e.id} className="flex flex-col gap-1">
                    <div className="flex justify-between gap-3">
                      <span>{e.label}</span>
                      <span className="tabular-nums">{formatYen(e.amountYen)}</span>
                    </div>
                    <p className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {e.people.map((p) => (
                        <span key={p.memberId}>#{p.nickname}</span>
                      ))}
                      <span>#{categoryLabel(e.category)}</span>
                    </p>
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

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      replace
      scroll={false}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50",
      )}
    >
      {children}
    </Link>
  );
}
