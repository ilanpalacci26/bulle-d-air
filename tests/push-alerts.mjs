import assert from "node:assert/strict";
import { alertEvents } from "../netlify/functions/_shared/alert-events.ts";
import { roadTravelMinutes } from "../netlify/functions/_shared/road-time.ts";

const settings = {
  delayEnabled: true,
  delayMinutes: 15,
  departureEnabled: true,
  arrivalBufferMinutes: 15,
  arrivedEnabled: true,
};
const airborne = {
  number: "AF123",
  delayMinutes: 18,
  estimatedArrival: "2026-09-23T09:00:00Z",
  timingSource: "live-estimate",
  position: { latitude: 38, longitude: 126 },
  destination: { city: "Séoul", iata: "ICN" },
  status: { code: "airborne_delayed" },
};
const result = alertEvents(airborne, settings, {}, 50, Date.parse("2026-09-23T08:00:00Z"));
assert.deepEqual(result.events.map((event) => event.type), ["delay", "departure"]);
assert.equal(alertEvents(airborne, settings, result.state, 50, Date.parse("2026-09-23T08:01:00Z")).events.length, 0);

const arrival = alertEvents({ ...airborne, status: { code: "arrived" } }, settings, result.state, 50);
assert.deepEqual(arrival.events.map((event) => event.type), ["arrived"]);

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => Response.json({ routes: [{ duration: 3600 }] });
assert.equal(await roadTravelMinutes(37.56, 126.97, { latitude: 37.46, longitude: 126.45 }), 60);
let routeCalled = false;
globalThis.fetch = async () => { routeCalled = true; return Response.json({ routes: [{ duration: 3600 }] }); };
assert.equal(await roadTravelMinutes(48.85, 2.35, { latitude: 37.46, longitude: 126.45 }), null);
assert.equal(routeCalled, false, "un utilisateur trop éloigné ne déclenche pas une route absurde");
globalThis.fetch = originalFetch;

console.log("Background push alerts and road calculation: OK");
