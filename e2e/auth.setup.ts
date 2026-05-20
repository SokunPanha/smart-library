import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/admin.json");

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel(/email/i).fill("admin@hunsenkchao.edu.kh");
  await page.getByLabel(/password/i).fill("admin1234");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: authFile });
});
