import { describe, expect, it } from "vitest";

import { avatarPath, avatarProblem, parseDisplayName } from "./rules";

describe("parseDisplayName", () => {
  it("trims and accepts 1–10 characters", () => {
    expect(parseDisplayName("  민수 ")).toEqual({ ok: true, name: "민수" });
    expect(parseDisplayName("가".repeat(10)).ok).toBe(true);
  });
  it("rejects empty and over-long names", () => {
    expect(parseDisplayName(" ").ok).toBe(false);
    expect(parseDisplayName("가".repeat(11)).ok).toBe(false);
  });
});

describe("avatarProblem", () => {
  it("accepts small JPG, PNG, WebP photos only", () => {
    expect(avatarProblem({ type: "image/png", size: 1000 })).toBeNull();
    expect(avatarProblem({ type: "image/gif", size: 1000 })).not.toBeNull();
    expect(avatarProblem({ type: "image/jpeg", size: 3 * 1024 * 1024 })).not.toBeNull();
    expect(avatarProblem({ type: "image/jpeg", size: 0 })).not.toBeNull();
  });
});

describe("avatarPath", () => {
  it("keeps the photo in the account's own folder", () => {
    expect(avatarPath("user-1", "image/webp", 5)).toBe("user-1/avatar-5.webp");
  });
});
