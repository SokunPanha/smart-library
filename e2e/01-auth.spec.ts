import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } }); // unauthenticated

test("redirects unauthenticated user to login", async ({ page }) => {
  await page.goto("/en/dashboard");
  await page.waitForURL("**/login**", { timeout: 8000 });
  await expect(page).toHaveURL(/\/login/);
});

test("shows error on wrong credentials", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel(/email/i).fill("wrong@email.com");
  await page.getByLabel(/password/i).fill("wrongpassword");
  await page.getByRole("button", { name: /sign in/i }).click();
  // Should stay on login and show error
  await expect(page).toHaveURL(/\/login/);
  await expect(page).not.toHaveURL(/\/dashboard/);
});

test("logs in with valid credentials", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel(/email/i).fill("admin@hunsenkchao.edu.kh");
  await page.getByLabel(/password/i).fill("admin1234");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  await expect(page).toHaveURL(/\/dashboard/);
});
