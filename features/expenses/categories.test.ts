import { describe, expect, it } from "vitest";

import { filterExpenses, parseCategory } from "./categories";

const rows = [
  { id: 1, amountYen: 1280, category: "food" as const, people: [{ memberId: 1 }] },
  { id: 2, amountYen: 3000, category: "ticket" as const, people: [{ memberId: 1 }, { memberId: 2 }] },
  { id: 3, amountYen: 500, category: "food" as const, people: [{ memberId: 2 }] },
];

describe("filterExpenses", () => {
  it("returns everything without a filter", () => {
    expect(filterExpenses(rows, {})).toHaveLength(3);
  });
  it("filters by person, by category, and by both", () => {
    expect(filterExpenses(rows, { memberId: 2 }).map((r) => r.id)).toEqual([2, 3]);
    expect(filterExpenses(rows, { category: "food" }).map((r) => r.id)).toEqual([1, 3]);
    expect(filterExpenses(rows, { memberId: 2, category: "food" }).map((r) => r.id)).toEqual([3]);
  });
});

describe("parseCategory", () => {
  it("falls back to etc", () => {
    expect(parseCategory("food")).toBe("food");
    expect(parseCategory("nope")).toBe("etc");
    expect(parseCategory(null)).toBe("etc");
  });
});
