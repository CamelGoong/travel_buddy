import { describe, expect, it } from "vitest";

import { allowanceForDay, averagePerDay, isAheadOfPace, parseBudget, totalSpent } from "./calc";

const trip = (spentByDay: Record<number, number>) => ({ budgetYen: 80_000, dayCount: 5, spentByDay });

describe("daily allowance (AC4, AC5)", () => {
  it("splits what is left before the day over the days left including it", () => {
    expect(allowanceForDay(trip({ 1: 20_000 }), 2)).toEqual({ kind: "allowance", yen: 15_000 });
    expect(allowanceForDay(trip({}), 1)).toEqual({ kind: "allowance", yen: 16_000 });
  });
  it("ignores spending on the day itself and later days", () => {
    expect(allowanceForDay(trip({ 1: 20_000, 2: 9_999, 3: 5_000 }), 2)).toEqual({ kind: "allowance", yen: 15_000 });
  });
  it("rounds down to the yen", () => {
    expect(allowanceForDay({ budgetYen: 10_000, dayCount: 3, spentByDay: {} }, 1)).toEqual({ kind: "allowance", yen: 3333 });
  });
  it("reports how far over once the budget is used up", () => {
    expect(allowanceForDay(trip({ 1: 50_000, 2: 31_200 }), 3)).toEqual({ kind: "over", yen: 1_200 });
    expect(allowanceForDay(trip({ 1: 80_000 }), 2)).toEqual({ kind: "over", yen: 0 });
  });
  it("averages the budget before the trip", () => {
    expect(averagePerDay(trip({}))).toBe(16_000);
    expect(totalSpent(trip({ 1: 1_280, 2: 500 }))).toBe(1_780);
  });
});

describe("pace check (AC7)", () => {
  it("asks when the spent share runs 15%p or more ahead of the days", () => {
    expect(isAheadOfPace(trip({ 1: 30_000, 2: 18_000 }), 2)).toBe(true); // 60% vs 40%
    expect(isAheadOfPace(trip({ 1: 30_000, 2: 14_000 }), 2)).toBe(true); // 55% vs 40%: exactly 15%p
    expect(isAheadOfPace(trip({ 1: 30_000, 2: 13_000 }), 2)).toBe(false); // 53.75% vs 40%
  });
});

describe("budget input (AC2)", () => {
  it("accepts yen amounts with commas", () => {
    expect(parseBudget("80,000")).toEqual({ ok: true, yen: 80_000 });
  });
  it("rejects zero, negatives, and non-numbers with a reason", () => {
    expect(parseBudget("0")).toMatchObject({ ok: false });
    expect(parseBudget("-1")).toMatchObject({ ok: false });
    expect(parseBudget("팔만")).toMatchObject({ ok: false, error: expect.stringMatching(/숫자/) });
  });
});
