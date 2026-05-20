import { test, expect } from "@playwright/test";

test.describe("Circulation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/circulation");
    await page.waitForLoadState("networkidle");
  });

  test("loads circulation page with loans table", async ({ page }) => {
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator(".ant-table")).toBeVisible();
  });

  test("shows loan stats cards", async ({ page }) => {
    // Stat cards at top of page
    await expect(page.locator(".ant-statistic, [class*='stat']").first()).toBeVisible({ timeout: 8000 });
  });

  test("can filter loans by status", async ({ page }) => {
    const filterSelect = page.locator(".ant-select").filter({ hasText: /status|filter/i }).first();
    if (await filterSelect.isVisible()) {
      await filterSelect.click();
      const option = page.locator(".ant-select-item").first();
      await option.click();
      await page.waitForLoadState("networkidle");
    }
    await expect(page.locator(".ant-table")).toBeVisible();
  });

  test("can open manual checkout form", async ({ page }) => {
    await page.getByRole("button", { name: /check.?out/i }).first().click();
    // Either a drawer or modal opens
    const form = page.locator(".ant-drawer-body, .ant-modal-body").first();
    await expect(form).toBeVisible({ timeout: 5000 });
  });
});
