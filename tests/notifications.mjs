import assert from "node:assert/strict";
import { notificationEvents } from "../src/notifications.js";

const now = Date.parse("2026-09-23T08:00:00Z");
const leg = {
  number: "AF7509",
  delayMinutes: 22,
  estimatedArrival: "2026-09-23T08:40:00Z",
  timingSource: "live-estimate",
  position: { latitude: 51.3, longitude: -11.1 },
  status: { code: "airborne" },
  destination: { city: "Paris", iata: "CDG" },
};
const settings = {
  delayEnabled: true,
  delayMinutes: 20,
  departureEnabled: true,
  arrivalBufferMinutes: 15,
  arrivedEnabled: true,
  travelMinutes: 30,
};

const first = notificationEvents(leg, settings, {}, now);
assert.deepEqual(first.events.map((event) => event.type), ["delay", "departure"]);
assert.equal(first.minutesUntilArrival, 40);

const repeated = notificationEvents(leg, settings, first.state, now + 60_000);
assert.equal(repeated.events.length, 0, "une même alerte ne doit pas être répétée");

const belowThresholds = notificationEvents(
  { ...leg, delayMinutes: 19, estimatedArrival: "2026-09-23T09:00:00Z" },
  settings,
  {},
  now,
);
assert.equal(belowThresholds.events.length, 0);

const routeOnly = notificationEvents(
  { ...leg, timingSource: "route-estimate", position: null },
  { ...settings, delayEnabled: false },
  {},
  now,
);
assert.equal(routeOnly.events.length, 0, "l’alerte d’arrivée exige une ETA ADS-B en direct");

const arrived = notificationEvents(
  { ...leg, status: { code: "arrived" } },
  { ...settings, delayEnabled: false, departureEnabled: false },
  {},
  now,
);
assert.deepEqual(arrived.events.map((event) => event.type), ["arrived"]);

console.log("Notification thresholds: OK");
