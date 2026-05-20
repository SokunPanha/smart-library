import { test, expect } from "@playwright/test";

test("dashboard loads with stat cards", async ({ page }) => {
  await page.goto("/en/dashboard");
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible({ timeout: 8000 });
  // Four stat cards should be visible
  const cards = page.locator(".ant-statistic, [class*='statistic']");
  await expect(cards.first()).toBeVisible();
});

test("dashboard shows recent loans table", async ({ page }) => {
  await page.goto("/en/dashboard");
  await page.waitForLoadState("networkidle");
  // Table or empty state should be present
  const table = page.locator(".ant-table, [class*='noLoans'], [class*='empty']").first();
  await expect(table).toBeVisible({ timeout: 8000 });
});

test("nav links are all present", async ({ page }) => {
  await page.goto("/en/dashboard");
  const nav = page.locator("nav, [class*='sidebar'], [class*='layout']").first();
  await expect(nav).toBeVisible({ timeout: 5000 });
  for (const label of ["Catalog", "Members", "Circulation"]) {
    await expect(page.getByRole("menuitem", { name: label }).or(page.getByRole("link", { name: label })).first()).toBeVisible();
  }
});
