const fs = require("fs");
const path = require("path");
const {
  chromium,
} = require("C:/Users/ilanp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const base = process.argv[2] || "http://localhost:8888";
  fs.mkdirSync(path.resolve(".impeccable/review"), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["geolocation", "notifications"],
    geolocation: { latitude: 48.8566, longitude: 2.3522 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("favicon"))
      errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));

  await page.goto(base, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.resolve(".impeccable/review/create-desktop.png"),
    fullPage: true,
  });
  await page.fill("#username", "Camille Test");
  await page.fill("#flight-1", "AF123");
  await page.click("#add-passenger");
  await page.locator(".person-name").nth(1).fill("Lou");
  await page.click("#add-passenger");
  await page.locator(".person-name").nth(2).fill("Sam");
  await page.click('.cta[type="submit"]');
  await page.waitForSelector(".success-ticket", { timeout: 15000 });
  const url = await page.locator("#share-link").inputValue();
  const password = (
    await page.locator("#generated-password").textContent()
  ).trim();
  if (!url.includes("?trip=") || password.length < 10)
    throw new Error("Le lien ou le mot de passe manque.");

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".maplibregl-canvas", { timeout: 15000 });
  await page.waitForSelector(".flight-state", { timeout: 30000 });
  const desktopHasSignal = (await page.locator(".flight-state span").textContent()).includes("ADS-B récente");
  if ((await page.locator(".plane-marker").count()) !== Number(desktopHasSignal))
    throw new Error("Le marqueur avion ne correspond pas à l’état du signal ADS-B.");
  await page.click("#notifications");
  await page.fill("#delay-minutes", "20");
  await page.fill("#arrival-minutes", "60");
  await page.click('#notification-form .cta[type="submit"]');
  await page.waitForSelector("#notification-sheet", { state: "hidden" });
  const alertSettings = await page.evaluate(() => {
    const trip = new URLSearchParams(location.search).get("trip");
    return JSON.parse(localStorage.getItem(`bulle-alerts-${trip}`));
  });
  if (alertSettings.delayMinutes !== 20 || alertSettings.arrivalMinutes !== 60)
    throw new Error("Les seuils de notification ne sont pas mémorisés.");
  await page.screenshot({
    path: path.resolve(".impeccable/review/tracker-desktop.png"),
  });
  await page.click("#here-button");
  await page.fill("#viewer-name", "Alex");
  await page.fill("#viewer-message", "On vous attend avec des croissants !");
  await page.click("#presence-form .cta");
  await page.waitForSelector(".friend-marker", { timeout: 15000 });
  const message = await page.locator(".friend-message").textContent();
  if (!message.includes("croissants"))
    throw new Error("La bulle de présence ne contient pas le message.");
  await page.click("#stop-sharing");
  await page.waitForSelector(".friend-marker", {
    state: "detached",
    timeout: 15000,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".flight-state", { timeout: 30000 });
  await page.screenshot({
    path: path.resolve(".impeccable/review/tracker-mobile.png"),
  });
  const metrics = await page.evaluate(() => {
    const plane = document.querySelector(".plane-marker")?.getBoundingClientRect();
    return {
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      mapHeight: document.querySelector("#map").getBoundingClientRect().height,
      crew: document.querySelectorAll(".air-crew>span").length,
      planeVisible: Boolean(plane && plane.right > 0 && plane.left < innerWidth && plane.bottom > 0 && plane.top < innerHeight),
      hasSignal: document.querySelector(".flight-state span")?.textContent.includes("ADS-B récente"),
    };
  });
  await page.click("#here-button");
  await page.fill("#viewer-name", "Mobile");
  await page.click(".sheet-close");
  if (await page.locator("#presence-sheet").isVisible())
    throw new Error("Le panneau mobile ne se ferme pas.");
  console.log(
    JSON.stringify(
      { created: true, alertsConfigured: alertSettings, presenceCreatedAndRemoved: true, metrics, errors },
      null,
      2,
    ),
  );
  await browser.close();
  if (
    errors.length ||
    metrics.scrollWidth > metrics.viewport ||
    metrics.mapHeight !== 844 ||
    metrics.crew !== (metrics.hasSignal ? 3 : 0) ||
    metrics.planeVisible !== metrics.hasSignal
  )
    process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
