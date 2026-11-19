import { describe, expect, it } from "vitest";

import { defaultNickname, parseNickname } from "./nickname";

describe("parseNickname", () => {
  it("trims and accepts 1–10 characters", () => {
    expect(parseNickname("  민수 ")).toEqual({ ok: true, nickname: "민수" });
    expect(parseNickname("가".repeat(10)).ok).toBe(true);
  });
  it("rejects empty and over-long names", () => {
    expect(parseNickname("   ").ok).toBe(false);
    expect(parseNickname("가".repeat(11)).ok).toBe(false);
  });
});

describe("defaultNickname", () => {
  it("uses the e-mail local part cut to 10 characters", () => {
    expect(defaultNickname("haegyun.park@lge.com")).toBe("haegyun.pa");
    expect(defaultNickname("min@x.com")).toBe("min");
  });
  it("falls back when there is no e-mail", () => {
    expect(defaultNickname(null)).toBe("나");
  });
});
