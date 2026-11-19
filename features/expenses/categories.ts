// Expense categories and tag filtering (docs/specs/trip-companions/).

export const EXPENSE_CATEGORIES = [
  { key: "food", label: "식비" },
  { key: "transport", label: "교통" },
  { key: "shopping", label: "쇼핑" },
  { key: "ticket", label: "입장" },
  { key: "etc", label: "기타" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["key"];

export function parseCategory(raw: unknown): ExpenseCategory {
  return EXPENSE_CATEGORIES.some((c) => c.key === raw) ? (raw as ExpenseCategory) : "etc";
}

export function categoryLabel(key: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.key === key)?.label ?? "기타";
}

export type ExpenseTags = {
  amountYen: number;
  category: ExpenseCategory;
  people: { memberId: number }[];
};

/** Keeps expenses that carry the person tag and the category (a missing filter matches everything). */
export function filterExpenses<T extends ExpenseTags>(
  expenses: T[],
  filter: { memberId?: number | null; category?: ExpenseCategory | null },
): T[] {
  return expenses.filter(
    (e) =>
      (!filter.memberId || e.people.some((p) => p.memberId === filter.memberId)) &&
      (!filter.category || e.category === filter.category),
  );
}
