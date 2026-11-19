import { describe, expect, it } from "vitest";

import { inNudgeWindow, mrtSearchUrl, ticketKeyword, ticketsStillNeeded } from "./mrt";

describe("mrtSearchUrl", () => {
  it("opens a MyRealTrip search with the keyword (AC5, AC6)", () => {
    const url = new URL(mrtSearchUrl("오사카 교통패스"));
    expect(url.origin + url.pathname).toBe("https://www.myrealtrip.com/search");
    expect(url.searchParams.get("query")).toBe("오사카 교통패스");
    expect(ticketKeyword("유니버설 스튜디오 재팬")).toBe("유니버설 스튜디오 재팬 입장권");
  });
});

describe("inNudgeWindow", () => {
  it("covers 14 days before departure through the day before (AC2)", () => {
    expect(inNudgeWindow(14)).toBe(true);
    expect(inNudgeWindow(1)).toBe(true);
    expect(inNudgeWindow(15)).toBe(false);
    expect(inNudgeWindow(0)).toBe(false);
    expect(inNudgeWindow(-3)).toBe(false);
  });
});

describe("ticketsStillNeeded", () => {
  it("lists ticketed places without a linked file, once each, in course order (AC6)", () => {
    const course = ["오사카성 천수각", "도톤보리", "유니버설 스튜디오 재팬", "오사카성 천수각"];
    expect(ticketsStillNeeded(course, new Set())).toEqual(["오사카성 천수각", "유니버설 스튜디오 재팬"]);
    expect(ticketsStillNeeded(course, new Set(["오사카성 천수각"]))).toEqual(["유니버설 스튜디오 재팬"]);
    expect(ticketsStillNeeded(["도톤보리"], new Set())).toEqual([]);
  });
});
