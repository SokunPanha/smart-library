import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test("settings page loads", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({ timeout: 8000 });
  });

  test("shows all settings tabs", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForLoadState("networkidle");
    for (const tab of ["General", "Loan Rules"]) {
      await expect(page.getByRole("tab", { name: tab })).toBeVisible({ timeout: 5000 });
    }
  });

  test("can update library name", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForLoadState("networkidle");
    // General tab (default)
    const nameField = page.getByLabel(/library name.*english/i);
    await expect(nameField).toBeVisible({ timeout: 5000 });
    await nameField.fill("Test Library Name");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.locator(".ant-message-notice, .ant-notification-notice")).toBeVisible({ timeout: 5000 });
    // Restore original value
    await nameField.fill("Hun Sen Kchao High School Library");
    await page.getByRole("button", { name: /save/i }).click();
  });
});
