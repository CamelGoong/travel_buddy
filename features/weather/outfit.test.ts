import { describe, expect, it } from "vitest";

import { outfitLine } from "./outfit";

describe("outfit line", () => {
  it("picks a line by the high temperature and mentions rain when likely", () => {
    expect(outfitLine({ maxC: 15, rainChance: 10 })).toBe("니트에 코트나 두툼한 자켓을 입어요.");
    expect(outfitLine({ maxC: 15, rainChance: 60 })).toMatch(/우산/);
  });
});
