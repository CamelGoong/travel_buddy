import { describe, expect, it } from "vitest";

import { formatDiffPct, formatHundredYen, formatWonApprox, fxJudgment, fxTone, makeSnapshot } from "./rate";

describe("fx snapshot and tone", () => {
  it("compares the latest rate with the 30-day average", () => {
    const snap = makeSnapshot(8.2, [8.4, 8.4, 8.6]);
    expect(snap?.avg30).toBeCloseTo(8.4667, 3);
    expect(snap?.diffPct).toBeCloseTo(-3.15, 1);
    expect(makeSnapshot(0, [8])).toBeNull();
    expect(makeSnapshot(8, [])).toBeNull();
  });
  it("uses a ±2% neutral band (AC3)", () => {
    expect(fxTone(-2)).toBe("low");
    expect(fxTone(-1.99)).toBe("even");
    expect(fxTone(1.99)).toBe("even");
    expect(fxTone(2)).toBe("high");
    expect(fxJudgment("low")).toContain("괜찮은 편");
    expect(fxJudgment("high")).toContain("지켜봐도");
    expect(fxJudgment("even")).toContain("비슷");
  });
});

describe("formatting", () => {
  it("shows 100 yen in won and approximate won for an amount (AC1)", () => {
    expect(formatHundredYen(8.3574)).toBe("100엔 = 836원");
    expect(formatWonApprox(1280, 8.3574)).toBe("≈ 10,697원");
    expect(formatDiffPct(-2.44)).toBe("−2.4%");
    expect(formatDiffPct(1)).toBe("+1.0%");
  });
});
