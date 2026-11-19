import { describe, expect, it } from "vitest";

import { TOUR_STEPS } from "./steps";

describe("TOUR_STEPS", () => {
  it("has unique ids and readable copy for every step", () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const step of TOUR_STEPS) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      expect(step.body.trim().length).toBeGreaterThan(0);
      expect(step.title.length).toBeLessThanOrEqual(30);
      expect(step.body.length).toBeLessThanOrEqual(140);
      expect(step.points?.length ?? 0).toBeLessThanOrEqual(3);
    }
  });
  it("opens with a welcome and closes with a start step", () => {
    expect(TOUR_STEPS[0].id).toBe("welcome");
    expect(TOUR_STEPS.at(-1)?.id).toBe("start");
  });
});
