import { describe, expect, it } from "vitest";

import { buildPrepItems, checklistPrepKey } from "./prep-items";

describe("evening prep items", () => {
  const checklist = [
    { id: 1, key: "passport", label: "여권", done: true },
    { id: 2, key: "flight", label: "항공권", done: false },
  ];

  it("lists unfinished checklist items on the eve of day 1 (AC11)", () => {
    const items = buildPrepItems({
      tomorrowIsFirstDay: true,
      todayIsTripDay: false,
      tomorrowRainChance: 10,
      checklist,
      checks: {},
    });
    expect(items.map((i) => i.label)).toEqual(["항공권"]);
    expect(items[0].checklistItemId).toBe(2);
  });
  it("keeps a checklist item checked tonight visible", () => {
    const items = buildPrepItems({
      tomorrowIsFirstDay: true,
      todayIsTripDay: false,
      tomorrowRainChance: 10,
      checklist: [{ ...checklist[1], done: true }],
      checks: { [checklistPrepKey("flight")]: true },
    });
    expect(items).toMatchObject([{ label: "항공권", done: true }]);
  });
  it("adds 우산 챙기기 when rain chance is 50% or more (AC12)", () => {
    const at = (rain: number | null) =>
      buildPrepItems({
        tomorrowIsFirstDay: false,
        todayIsTripDay: true,
        tomorrowRainChance: rain,
        checklist,
        checks: {},
      }).map((i) => i.label);
    expect(at(50)).toContain("우산 챙기기");
    expect(at(49)).not.toContain("우산 챙기기");
    expect(at(null)).not.toContain("우산 챙기기");
  });
  it("adds charging every evening during the trip", () => {
    const items = buildPrepItems({
      tomorrowIsFirstDay: false,
      todayIsTripDay: true,
      tomorrowRainChance: 0,
      checklist,
      checks: { charge: true },
    });
    expect(items).toMatchObject([{ label: "휴대폰·보조배터리 충전하기", done: true }]);
  });
});
