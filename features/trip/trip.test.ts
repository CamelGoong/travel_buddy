import { describe, expect, it } from "vitest";

import { buildCourse, dayNumberOn } from "./trip-days";
import { validateTripDates } from "./validate";

describe("course draft (AC2)", () => {
  it("fills day 1 to 5 of a 4-night trip, every place with a scheduled time", () => {
    const course = buildCourse({ startDate: "2026-12-01", endDate: "2026-12-05" });
    expect(course.map((d) => d.dayNumber)).toEqual([1, 2, 3, 4, 5]);
    expect(course[4].date).toBe("2026-12-05");
    for (const day of course) {
      expect(day.places.length).toBeGreaterThan(0);
      for (const p of day.places) expect(p.time).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it("leaves days past the fixed list as free days", () => {
    const course = buildCourse({ startDate: "2026-12-01", endDate: "2026-12-07" });
    expect(course).toHaveLength(7);
    expect(course[5].places).toEqual([]);
  });

  it("finds the day number for a date inside the trip only", () => {
    const trip = { startDate: "2026-12-30", endDate: "2027-01-02" };
    expect(dayNumberOn(trip, "2027-01-01")).toBe(3);
    expect(dayNumberOn(trip, "2026-12-29")).toBeNull();
    expect(dayNumberOn(trip, "2027-01-03")).toBeNull();
  });
});

describe("trip date validation (AC3)", () => {
  it("rejects an end date before the start date with a reason", () => {
    expect(validateTripDates("2026-12-05", "2026-12-01")).toMatch(/종료일이 시작일보다/);
  });
  it("accepts a same-day trip and up to 14 days", () => {
    expect(validateTripDates("2026-12-01", "2026-12-01")).toBeNull();
    expect(validateTripDates("2026-12-01", "2026-12-14")).toBeNull();
    expect(validateTripDates("2026-12-01", "2026-12-15")).toMatch(/최대 14일/);
  });
  it("asks for both dates when one is missing", () => {
    expect(validateTripDates("", "2026-12-01")).toMatch(/모두 골라/);
  });
});
