import { describe, expect, it } from "vitest";

import { parsePreferences } from "./options";
import { validateDraft } from "./validate";

const place = (name: string, time: string, lat = 34.67, lng = 135.5) => ({ name, time, lat, lng });

describe("validateDraft (AC2, AC4-1, AC5)", () => {
  it("accepts a full course and sorts each day by time", () => {
    const result = validateDraft(
      {
        days: [
          { places: [place("도톤보리", "18:00"), place("오사카성", "10:00")] },
          { places: [place("교토 기요미즈데라", "09:00", 34.99, 135.78)] },
        ],
        suggestions: ["우산"],
      },
      2,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.days[0].map((p) => p.time)).toEqual(["10:00", "18:00"]);
    expect(result.draft.suggestions).toEqual(["우산"]);
  });

  it("rejects a course whose day count differs from the trip", () => {
    expect(validateDraft({ days: [{ places: [place("a", "10:00")] }] }, 2).ok).toBe(false);
  });

  it("rejects an empty day, a bad time and a missing coordinate", () => {
    expect(validateDraft({ days: [{ places: [] }] }, 1).ok).toBe(false);
    expect(validateDraft({ days: [{ places: [place("a", "25:00")] }] }, 1).ok).toBe(false);
    expect(validateDraft({ days: [{ places: [place("a", "06:30")] }] }, 1).ok).toBe(false);
    expect(
      validateDraft({ days: [{ places: [{ name: "a", time: "10:00", lat: 34.6 }] }] }, 1).ok,
    ).toBe(false);
  });

  it("rejects coordinates outside the Osaka range", () => {
    expect(validateDraft({ days: [{ places: [place("도쿄타워", "10:00", 35.65, 139.74)] }] }, 1).ok).toBe(
      false,
    );
  });

  it("drops a place already used on an earlier day and fails if the day empties", () => {
    const twoDays = (second: unknown[]) => ({
      days: [{ places: [place("도톤보리", "10:00")] }, { places: second }],
    });
    const kept = validateDraft(twoDays([place("도톤보리", "10:00"), place("신세카이", "12:00")]), 2);
    expect(kept.ok && kept.draft.days[1].map((p) => p.name)).toEqual(["신세카이"]);
    expect(validateDraft(twoDays([place("도톤보리", "10:00")]), 2).ok).toBe(false);
  });

  it("keeps at most three short suggestions and skips ones the defaults cover", () => {
    const result = validateDraft(
      {
        days: [{ places: [place("a", "10:00")] }],
        suggestions: ["여권 사본", "우산", "보조배터리", "유모차", "아주아주아주아주아주아주 긴 항목 이름입니다", "포켓 와이파이"],
      },
      1,
      ["여권", "항공권"],
    );
    expect(result.ok && result.draft.suggestions).toEqual(["우산", "보조배터리", "유모차"]);
  });

  it("treats malformed suggestions as none, not as a failure", () => {
    const result = validateDraft({ days: [{ places: [place("a", "10:00")] }], suggestions: "x" }, 1);
    expect(result.ok && result.draft.suggestions).toEqual([]);
  });
});

describe("parsePreferences (AC1)", () => {
  it("keeps known choices and caps interests at three", () => {
    const p = parsePreferences("couple", ["food", "cafe", "shopping", "night-view", "bogus"]);
    expect(p.companion).toBe("couple");
    expect(p.interests).toHaveLength(3);
  });

  it("allows choosing nothing", () => {
    expect(parsePreferences(null, [])).toEqual({ companion: null, interests: [] });
    expect(parsePreferences("alien", []).companion).toBeNull();
  });
});
