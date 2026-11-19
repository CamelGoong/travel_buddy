import { describe, expect, it } from "vitest";

import { validateNewChecklistLabel } from "./labels";

describe("validateNewChecklistLabel", () => {
  it("accepts a trimmed name", () => {
    expect(validateNewChecklistLabel("  휴대폰 충전기 ", ["여권"])).toEqual({ ok: true, label: "휴대폰 충전기" });
  });
  it("rejects empty, over-long and duplicate names", () => {
    expect(validateNewChecklistLabel("  ", []).ok).toBe(false);
    expect(validateNewChecklistLabel("가".repeat(21), []).ok).toBe(false);
    expect(validateNewChecklistLabel("여권", ["여권"]).ok).toBe(false);
    expect(validateNewChecklistLabel("CARD", ["card"]).ok).toBe(false);
  });
});
