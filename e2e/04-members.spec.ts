import { test, expect } from "@playwright/test";

test.describe("Members", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/members");
    await page.waitForLoadState("networkidle");
  });

  test("loads members page with table", async ({ page }) => {
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator(".ant-table-tbody")).toBeVisible();
  });

  test("can search members", async ({ page }) => {
    const search = page.getByPlaceholder(/search/i).first();
    await search.fill("Dara");
    await page.waitForTimeout(600);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".ant-table-tbody, .ant-empty").first()).toBeVisible();
  });

  test("can open Add Member drawer", async ({ page }) => {
    await page.getByRole("button", { name: /add member/i }).click();
    await expect(page.locator(".ant-drawer-body")).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel(/name.*khmer/i)).toBeVisible();
  });

  test("Add Member form validates required fields", async ({ page }) => {
    await page.getByRole("button", { name: /add member/i }).click();
    await page.locator(".ant-drawer-body").waitFor();
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.locator(".ant-form-item-explain-error").first()).toBeVisible({ timeout: 3000 });
  });

  test("clicking a member row opens profile drawer", async ({ page }) => {
    const firstRow = page.locator(".ant-table-row").first();
    await expect(firstRow).toBeVisible({ timeout: 8000 });
    await firstRow.click();
    // Profile drawer should open
    await expect(page.locator(".ant-drawer-body")).toBeVisible({ timeout: 5000 });
    // Should show loan history tabs
    await expect(page.getByRole("tab")).toHaveCount(4, { timeout: 5000 });
  });

  test("profile drawer shows loan history tab", async ({ page }) => {
    const firstRow = page.locator(".ant-table-row").first();
    await firstRow.click();
    await page.locator(".ant-drawer-body").waitFor();
    await page.getByRole("tab", { name: /history/i }).click();
    // History tab content should be visible (records or empty state)
    await expect(page.locator(".ant-drawer-body").getByText(/history|no loan|borrow/i).first()).toBeVisible({ timeout: 5000 });
  });
});
