const path = require("path");
const { chromium } = require("C:/Users/ilanp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/trips/demo-flight", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      trip: { id: "demo-flight", ownerUsername: "Camille", theme: "mario", expiresAt: "2026-09-05T10:00:00Z", passengers: [{ id: "1", name: "Camille", kind: "emoji", value: "😎", color: "#FF5D5D" }] },
      tracking: { activeIndex: 0, legs: [{
        number: "LH2227", callsign: "DLH2227", airline: "Lufthansa", scheduledDeparture: "2026-09-03T06:25:00Z",
        origin: { iata: "CDG", name: "Paris Charles de Gaulle", city: "Paris", country: "France", timeZone: "Europe/Paris", latitude: 49.0097, longitude: 2.5479 },
        destination: { iata: "MUC", name: "Munich International", city: "Munich", country: "Germany", timeZone: "Europe/Berlin", latitude: 48.3538, longitude: 11.7861 },
        distanceKm: 681, remainingKm: 312, plannedDurationMinutes: 85, plannedArrival: "2026-09-03T07:50:00Z", estimatedArrival: "2026-09-03T07:44:00Z", timingSource: "live-estimate",
        routeAvailable: true, routeError: false, progress: .54, status: { code: "airborne", label: "En vol", detail: "34 000 ft · 447 kt" },
        position: { latitude: 49.1, longitude: 7.2, heading: 92, altitude: 34000, speed: 447, registration: "D-AIXX", aircraftType: "A320", seenSecondsAgo: 2 },
        updatedAt: "2026-09-03T07:00:00Z", source: "ADSB.lol"
      }] }
    })
  }));
  const base = process.argv[2] || "http://localhost:8888";
  await page.goto(`${base}/?trip=demo-flight`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".flight-facts");
  const text = await page.locator(".flight-facts").innerText();
  for (const expected of ["Départ prévu", "Arrivée estimée en direct", "1 h 25 min", "681", "Altitude", "ft", "447 kt", "D-AIXX", "Non communiqués"]) {
    if (!text.includes(expected)) throw new Error(`Information absente: ${expected}`);
  }
  await page.screenshot({ path: path.resolve(".impeccable/review/flight-info-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.resolve(".impeccable/review/flight-info-mobile.png"), fullPage: true });
  const sizes = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
  if (sizes.width !== sizes.viewport) throw new Error(`Débordement mobile: ${sizes.width}px`);
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(JSON.stringify({ flightInfo: true, mobile: sizes, errors }, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
