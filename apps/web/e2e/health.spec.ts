import { test, expect } from "@playwright/test";

test("root page redirects to /dashboard or /login", async ({ page }) => {
  await page.goto("/");

  // The root page should redirect — either to /dashboard or /login
  // depending on authentication state
  const url = page.url();
  const pathname = new URL(url).pathname;

  expect(
    pathname === "/dashboard" || pathname === "/login"
  ).toBeTruthy();
});

test("page has title", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveTitle(/Fred/);
});
