import { expect, test } from "@playwright/test";

test("로그인하지 않으면 여행 화면 대신 로그인 화면이 열린다", async ({ page }) => {
  await page.goto("/trip");

  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page).toHaveTitle("Travel Buddy");
  await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
});
