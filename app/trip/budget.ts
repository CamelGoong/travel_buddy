import { allowanceForDay, averagePerDay, isAheadOfPace, totalSpent, type DayAllowance } from "@/features/budget";

export type TodayGuide = DayAllowance | { kind: "average"; yen: number } | { kind: "done" };

export type BudgetSummary = {
  budgetYen: number;
  spent: number;
  remaining: number;
  /** Before the trip: average per day; during it: today's allowance */
  today: TodayGuide;
  /** Today's spend, during the trip */
  spentToday: number | null;
  /** Spent share runs 15%p or more ahead of today's elapsed share */
  aheadOfPace: boolean;
  byDay: { day: number; spent: number }[];
};

/** Budget view for a trip, or null when no budget is set. */
export function summarizeBudget(input: {
  budgetYen: number | null;
  dayCount: number;
  todayDay: number | null;
  beforeTrip: boolean;
  spentByDay: Record<number, number>;
}): BudgetSummary | null {
  if (input.budgetYen === null) return null;
  const b = { budgetYen: input.budgetYen, dayCount: input.dayCount, spentByDay: input.spentByDay };
  const spent = totalSpent(b);
  const today: TodayGuide = input.todayDay
    ? allowanceForDay(b, input.todayDay)
    : input.beforeTrip
      ? { kind: "average", yen: averagePerDay(b) }
      : { kind: "done" };
  return {
    budgetYen: input.budgetYen,
    spent,
    remaining: input.budgetYen - spent,
    today,
    spentToday: input.todayDay ? (input.spentByDay[input.todayDay] ?? 0) : null,
    aheadOfPace: input.todayDay !== null && isAheadOfPace(b, input.todayDay),
    byDay: Array.from({ length: input.dayCount }, (_, i) => ({
      day: i + 1,
      spent: input.spentByDay[i + 1] ?? 0,
    })),
  };
}
