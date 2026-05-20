import { test, expect } from "@playwright/test";

test.describe("Catalog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/catalog");
    await page.waitForLoadState("networkidle");
  });

  test("loads catalog page with book table", async ({ page }) => {
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator(".ant-table-tbody")).toBeVisible();
  });

  test("can search books", async ({ page }) => {
    const search = page.getByPlaceholder(/search/i).first();
    await search.fill("Cambodia");
    await page.waitForTimeout(600); // debounce
    await page.waitForLoadState("networkidle");
    // Table should still be visible (results or empty state)
    await expect(page.locator(".ant-table-tbody, .ant-empty").first()).toBeVisible();
  });

  test("can open Add Book drawer", async ({ page }) => {
    await page.getByRole("button", { name: /add book/i }).click();
    await expect(page.locator(".ant-drawer-body")).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel(/title.*khmer/i)).toBeVisible();
  });

  test("Add Book form validates required fields", async ({ page }) => {
    await page.getByRole("button", { name: /add book/i }).click();
    await page.locator(".ant-drawer-body").waitFor();
    // Submit empty form
    await page.getByRole("button", { name: /^save$/i }).click();
    // Validation errors should appear
    await expect(page.locator(".ant-form-item-explain-error").first()).toBeVisible({ timeout: 3000 });
  });

  test("can add and delete a book", async ({ page }) => {
    const title = `E2E Test ${Date.now()}`;

    await page.getByRole("button", { name: /add book/i }).click();
    await page.locator(".ant-drawer-body").waitFor();

    await page.getByLabel(/title.*khmer/i).fill(title);
    await page.getByLabel(/category/i).click();
    await page.locator(".ant-select-item-option").first().click();

    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.locator(".ant-message-notice, .ant-notification-notice")).toBeVisible({ timeout: 8000 });

    // Book should appear in table
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 5000 });

    // Hover row to reveal action buttons, then click the danger (delete) button
    const row = page.locator(".ant-table-row").filter({ hasText: title }).first();
    await row.hover();
    await row.locator("button.ant-btn-dangerous").first().click();
    // Confirm in the ant-design modal
    await page.locator(".ant-modal-confirm-btns").getByRole("button", { name: /delete/i }).click();
    await expect(page.locator(".ant-message-notice, .ant-notification-notice")).toBeVisible({ timeout: 5000 });
  });
});
