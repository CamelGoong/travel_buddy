import { describe, expect, it } from "vitest";

import { dayStage, tripStage } from "./stages";

describe("trip route line", () => {
  it("lights 출발 전 before the start date (AC5)", () => {
    const m = tripStage({ today: "2026-11-19", startDate: "2026-11-25", dayCount: 5 });
    expect(m.activeIndex).toBe(0);
    expect(m.stations[0].label).toBe("출발 전");
  });
  it("lights today's day during the trip (AC8)", () => {
    const m = tripStage({ today: "2026-11-21", startDate: "2026-11-20", dayCount: 5 });
    expect(m.activeIndex).toBe(2);
    expect(m.stations[2].label).toBe("2일차");
    expect(m.caption).toBe("2일차");
  });
});

describe("day route line (AC8)", () => {
  const places = [
    { name: "오사카성 천수각", time: "10:00" },
    { name: "구로몬 시장", time: "12:30" },
    { name: "도톤보리", time: "18:00" },
  ];
  const base = { dayNumber: 1, dayDate: "2026-11-19", today: "2026-11-19", places };

  it("lights the latest place scheduled at or before now and names it", () => {
    const m = dayStage({ ...base, nowTime: "14:05" });
    expect(m.activeIndex).toBe(1);
    expect(m.caption).toBe("구로몬 시장 · 다음 18:00");
  });
  it("lights a place exactly at its scheduled time", () => {
    expect(dayStage({ ...base, nowTime: "10:00" }).activeIndex).toBe(0);
  });
  it("lights nothing before the first scheduled time", () => {
    expect(dayStage({ ...base, nowTime: "09:59" }).activeIndex).toBeNull();
  });
  it("lights nothing on a future day", () => {
    expect(dayStage({ ...base, today: "2026-11-18", nowTime: "23:00" }).activeIndex).toBeNull();
  });
});
