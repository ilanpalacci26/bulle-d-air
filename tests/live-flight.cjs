const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ilanp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const url = process.argv[2];
  if (!url) throw new Error("Ajoutez l’URL d’un voyage correspondant à un vol en cours.");
  fs.mkdirSync(path.resolve(".gstack/qa-reports/screenshots"), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    permissions: ["notifications"],
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".flight-state", { timeout: 30000 });
  try {
    await page.waitForSelector(".plane-marker", { timeout: 60000 });
  } catch (error) {
    const state = await page.locator(".flight-state").innerText().catch(() => "carte indisponible");
    throw new Error(`${error.message}\nÉtat visible: ${state}\nErreurs: ${errors.join(" | ") || "aucune"}`);
  }
  const first = await page.locator(".plane-marker").evaluate((element) => element.style.transform);
  await page.click("#notifications");
  await page.screenshot({
    path: path.resolve(".gstack/qa-reports/screenshots/live-alerts.png"),
  });
  await page.click("#notification-sheet .sheet-close");
  await page.waitForTimeout(16_000);
  const second = await page.locator(".plane-marker").evaluate((element) => element.style.transform);
  await page.screenshot({
    path: path.resolve(".gstack/qa-reports/screenshots/live-tracker.png"),
  });
  const source = await page.locator(".flight-state span").textContent();
  const summary = await page.locator("#flight-summary").innerText();
  await browser.close();
  const result = { summary, source, markerMoved: first !== second, errors };
  console.log(JSON.stringify(result, null, 2));
  if (!source.includes("ADS-B récente") || errors.length) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
