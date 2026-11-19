import { describe, expect, it } from "vitest";

import { formatYen, parseExpense } from "./validate";

describe("expense form (AC9)", () => {
  it("accepts 1,280 for 점심", () => {
    expect(parseExpense("1,280", "점심")).toEqual({
      ok: true,
      value: { amountYen: 1280, label: "점심" },
    });
    expect(formatYen(1280)).toBe("1,280엔");
  });
  it("rejects an empty, zero, or negative amount with a reason", () => {
    expect(parseExpense("", "점심")).toMatchObject({ ok: false, error: expect.stringMatching(/금액/) });
    expect(parseExpense("0", "점심")).toMatchObject({ ok: false, error: expect.stringMatching(/0엔보다/) });
    expect(parseExpense("-500", "점심")).toMatchObject({ ok: false, error: expect.stringMatching(/0엔보다/) });
  });
  it("needs a label", () => {
    expect(parseExpense("500", "  ")).toMatchObject({ ok: false });
  });
});
