import assert from "node:assert/strict";
import { resolveFlight } from "../netlify/functions/_shared/flight-data.ts";

const departure = new Date(Date.now() - 30 * 60_000).toISOString();
const route = {
  callsign_icao: "AFR123",
  origin: { iata_code: "CDG", latitude: 49.0097, longitude: 2.5479 },
  destination: { iata_code: "LHR", latitude: 51.4700, longitude: -0.4543 },
};
const leg = { number: "AF123", scheduledDeparture: departure };
const originalFetch = globalThis.fetch;

function mockResponses(aircraft) {
  globalThis.fetch = async (url) => {
    const address = String(url);
    if (address.includes("adsbdb.com")) return Response.json({ response: { flightroute: route } });
    if (address.includes("open-meteo.com")) return Response.json({ timezone: "Europe/Paris" });
    if (address.includes("adsb.lol")) return Response.json({ ac: aircraft });
    throw new Error(`Unexpected URL: ${address}`);
  };
}

try {
  mockResponses([]);
  const missing = await resolveFlight(leg);
  assert.equal(missing.position, null, "No ADS-B signal must never create a moving plane position");

  mockResponses([{ hex: "39ac23", flight: "AFR123 ", lat: 49.5, lon: 1.8, seen: 2, seen_pos: 2, gs: 350, alt_baro: 12000 }]);
  const live = await resolveFlight(leg);
  assert.equal(live.position?.estimated, false);
  assert.equal(live.position?.latitude, 49.5);
  assert.equal(live.position?.longitude, 1.8);

  mockResponses([
    { hex: "wrong1", flight: "OTHER1", lat: 35, lon: 139, seen: 1, seen_pos: 1 },
    { hex: "39ac23", flight: "AFR123 ", lat: 49.5, lon: 1.8, seen: 2, seen_pos: 2, gs: 350, alt_baro: 12000 },
  ]);
  const exact = await resolveFlight(leg);
  assert.equal(exact.position?.hex, "39ac23", "Only the expected callsign may be attached to the trip");

  mockResponses([{ hex: "39ac23", flight: "AFR123 ", lat: 49.5, lon: 1.8, seen: 900, seen_pos: 900, gs: 350, alt_baro: 12000 }]);
  const stale = await resolveFlight(leg);
  assert.equal(stale.position, null, "Stale ADS-B coordinates must not be shown as live");

  mockResponses([{ hex: "39ac23", flight: "AFR123 ", lat: 49.5, lon: 1.8, seen: 2, seen_pos: 2, gs: 350, alt_baro: 12000 }]);
  const future = await resolveFlight({ ...leg, scheduledDeparture: new Date(Date.now() + 12 * 60 * 60_000).toISOString() });
  assert.equal(future.position, null, "Today's aircraft must not be attached to a trip scheduled tomorrow");

  console.log("Flight position: real ADS-B only, missing/stale signal hidden.");
} finally {
  globalThis.fetch = originalFetch;
}
