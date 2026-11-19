import { describe, expect, it } from "vitest";

import { addPlace, defaultNewTime, movePlace, parseTime, removePlace, setTime } from "./course-edit";

const day = [
  { name: "오사카성 천수각", time: "10:00", lat: 34.687, lng: 135.525 },
  { name: "구로몬 시장", time: "12:30", lat: 34.665, lng: 135.507 },
  { name: "도톤보리", time: "18:00", lat: 34.668, lng: 135.501 },
];

const names = (r: { ok: boolean; places?: { name: string }[] }) => (r.ok ? r.places!.map((p) => p.name) : null);
const times = (r: { ok: boolean; places?: { time: string }[] }) => (r.ok ? r.places!.map((p) => p.time) : null);

describe("movePlace", () => {
  it("swaps neighbours but keeps times in their slots (AC1)", () => {
    const moved = movePlace(day, 1, -1);
    expect(names(moved)).toEqual(["구로몬 시장", "오사카성 천수각", "도톤보리"]);
    expect(times(moved)).toEqual(["10:00", "12:30", "18:00"]);
  });
  it("refuses to move past the ends", () => {
    expect(movePlace(day, 0, -1).ok).toBe(false);
    expect(movePlace(day, 2, 1).ok).toBe(false);
  });
});

describe("setTime", () => {
  it("re-sorts the day by time (AC2)", () => {
    const edited = setTime(day, 2, "11:00");
    expect(names(edited)).toEqual(["오사카성 천수각", "도톤보리", "구로몬 시장"]);
    expect(times(edited)).toEqual(["10:00", "11:00", "12:30"]);
  });
  it("rejects times outside 07:00–22:00 or in the wrong format", () => {
    expect(setTime(day, 0, "06:59").ok).toBe(false);
    expect(setTime(day, 0, "22:01").ok).toBe(false);
    expect(setTime(day, 0, "abc").ok).toBe(false);
    expect(parseTime("9:05")).toBe("09:05");
  });
});

describe("removePlace and addPlace", () => {
  it("removes a place, leaving a free day when empty (AC3)", () => {
    expect(names(removePlace(day, 1))).toEqual(["오사카성 천수각", "도톤보리"]);
    expect(names(removePlace([day[0]], 0))).toEqual([]);
  });
  it("adds a listed place at the default time (AC4)", () => {
    expect(defaultNewTime(day)).toBe("20:00");
    expect(defaultNewTime([{ name: "x", time: "21:00" }])).toBe("22:00");
    expect(defaultNewTime([])).toBe("10:00");
    const added = addPlace(day, { name: "난바 파크스", lat: 34.66, lng: 135.5 });
    expect(names(added)).toEqual(["오사카성 천수각", "구로몬 시장", "도톤보리", "난바 파크스"]);
  });
  it("adds a typed place without coordinates and rejects bad names (AC5)", () => {
    const added = addPlace(day, { name: "  이치란 라멘 " });
    expect(added.ok && added.places.at(-1)).toMatchObject({ name: "이치란 라멘" });
    expect(added.ok && "lat" in added.places.at(-1)!).toBe(false);
    expect(addPlace(day, { name: "  " }).ok).toBe(false);
    expect(addPlace(day, { name: "가".repeat(31) }).ok).toBe(false);
    expect(addPlace(day, { name: "도톤보리" }).ok).toBe(false);
  });
  it("caps a day at eight places (AC4)", () => {
    const full = Array.from({ length: 8 }, (_, i) => ({ name: `장소${i}`, time: "10:00" }));
    expect(addPlace(full, { name: "아홉째" }).ok).toBe(false);
  });
});
