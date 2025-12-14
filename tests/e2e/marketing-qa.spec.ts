import {
  test,
  expect,
  devices,
  type Page,
  type TestInfo,
  type ConsoleMessage,
  type Request,
} from "@playwright/test";
import fs from "fs";
import path from "path";

type RouteSpec = { name: string; path: string };

type CaptureOptions = {
  /** Folder within Playwright's per-test output directory. */
  folder: string;
};

const routes: RouteSpec[] = [
  { name: "home", path: "/" },
  { name: "pricing", path: "/pricing" },
  { name: "features", path: "/features" },
  { name: "about", path: "/about" },
  { name: "docs", path: "/docs" },
  { name: "blog", path: "/blog" },
];

async function captureRouteScreenshots(page: Page, testInfo: TestInfo, options: CaptureOptions) {
  const errors: string[] = [];

  const outDir = path.join(testInfo.outputDir, options.folder);
  fs.mkdirSync(outDir, { recursive: true });

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      errors.push(`[console.error] ${msg.text()}`);
    }
  });

  page.on("pageerror", (err) => {
    errors.push(`[pageerror] ${err.message}`);
  });

  // Note: requestfailed can be noisy (aborts, cancelled navigations). We only capture real failures.
  page.on("requestfailed", (req: Request) => {
    const failure = req.failure();
    const errText = failure?.errorText;
    if (errText && !/net::ERR_ABORTED/i.test(errText)) {
      errors.push(`[requestfailed] ${req.url()} :: ${errText}`);
    }
  });

  for (const route of routes) {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });

    // Some pages may keep connections open (analytics, websockets). Don't hard-fail on networkidle.
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);

    // Basic sanity: avoid silently screenshotting 404s.
    await expect(page, `Route ${route.path} should not be a 404`).not.toHaveTitle(/404|not found/i);

    // Give framer-motion + gradients a beat to settle.
    await page.waitForTimeout(250);

    await page.screenshot({
      path: path.join(outDir, `${route.name}.png`),
      fullPage: true,
    });
  }

  expect(
    errors,
    `Console/page/request errors were detected:\n\n${errors.join("\n") || "(none)"}`
  ).toEqual([]);
}

test.describe("Marketing QA (screenshots)", () => {
  test("desktop", async ({ page }, testInfo) => {
    await captureRouteScreenshots(page, testInfo, { folder: "screenshots-desktop" });
  });

  test.describe("mobile", () => {
    test.use({ ...devices["iPhone 13"] });

    test("mobile", async ({ page }, testInfo) => {
      await captureRouteScreenshots(page, testInfo, { folder: "screenshots-mobile" });
    });
  });
});
