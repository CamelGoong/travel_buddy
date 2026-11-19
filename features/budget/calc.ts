// Trip budget math (docs/specs/osaka-trip-budget/). Pure, yen only.

export const MAX_BUDGET_YEN = 10_000_000;
/** Spent share may run this far ahead of the elapsed-days share before we ask. */
export const PACE_AHEAD_THRESHOLD = 0.15;

export type BudgetInput = {
  budgetYen: number;
  dayCount: number;
  /** Total spent per day number */
  spentByDay: Record<number, number>;
};

const sumWhere = (spent: Record<number, number>, keep: (day: number) => boolean) =>
  Object.entries(spent).reduce((sum, [day, yen]) => (keep(Number(day)) ? sum + yen : sum), 0);

export function totalSpent(input: BudgetInput): number {
  return sumWhere(input.spentByDay, () => true);
}

export type DayAllowance =
  | { kind: "allowance"; yen: number }
  | { kind: "over"; yen: number };

/**
 * Suggested spend for a day: (budget − spent before that day) ÷ days left
 * including it, rounded down. Past the budget, how far over it is.
 */
export function allowanceForDay(input: BudgetInput, day: number): DayAllowance {
  const before = sumWhere(input.spentByDay, (d) => d < day);
  const left = input.budgetYen - before;
  if (left <= 0) return { kind: "over", yen: Math.abs(left) };
  return { kind: "allowance", yen: Math.floor(left / (input.dayCount - day + 1)) };
}

/** Before the trip: budget ÷ days. */
export function averagePerDay(input: BudgetInput): number {
  return Math.floor(input.budgetYen / input.dayCount);
}

/** True when the spent share runs 15%p or more ahead of the elapsed share (today included). */
export function isAheadOfPace(input: BudgetInput, today: number): boolean {
  const spentShare = totalSpent(input) / input.budgetYen;
  return spentShare - today / input.dayCount >= PACE_AHEAD_THRESHOLD;
}

/** Parses a yen amount typed by the user ("80,000", "80000엔"). */
export function parseBudget(raw: string): { ok: true; yen: number } | { ok: false; error: string } {
  const text = raw.replace(/[,\s엔¥]/g, "");
  if (!/^-?\d+$/.test(text)) return { ok: false, error: "예산은 숫자로만 입력해 주세요." };
  const yen = Number(text);
  if (yen <= 0) return { ok: false, error: "예산은 0엔보다 커야 해요." };
  if (yen > MAX_BUDGET_YEN) return { ok: false, error: "예산이 너무 커요. 다시 확인해 주세요." };
  return { ok: true, yen };
}
