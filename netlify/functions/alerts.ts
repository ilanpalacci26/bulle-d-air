import type { Config, Context } from "@netlify/functions";
import { cleanText, json } from "./_shared/http";
import { alertKey, alertStore, hashAlertSecret, type PushAlert } from "./_shared/alerts";
import type { AlertSettings } from "./_shared/alert-events";
import { resolveFlights } from "./_shared/flight-data";
import { roadTravelMinutes } from "./_shared/road-time";
import { isExpired, randomId, tripKey, tripStore, type Trip } from "./_shared/trips";

const bounded = (value: unknown, fallback: number, min: number, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback;
};

function settings(value: any): AlertSettings {
  return {
    delayEnabled: value?.delayEnabled !== false,
    delayMinutes: bounded(value?.delayMinutes, 15, 5, 180),
    departureEnabled: value?.departureEnabled !== false,
    arrivalBufferMinutes: bounded(value?.arrivalBufferMinutes, 15, 0, 120),
    arrivedEnabled: value?.arrivedEnabled !== false,
  };
}

function validSubscription(value: any) {
  return Boolean(
    value &&
    /^https:\/\//.test(value.endpoint || "") &&
    value.endpoint.length < 2000 &&
    typeof value.keys?.p256dh === "string" &&
    typeof value.keys?.auth === "string",
  );
}

async function register(req: Request, tripId: string) {
  const trip = await tripStore().get(tripKey(tripId), { type: "json" }) as Trip | null;
  if (!trip || isExpired(trip)) return json({ error: "Voyage introuvable ou expiré." }, 404);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Réglages illisibles." }, 400); }
  if (!validSubscription(body?.subscription)) return json({ error: "Abonnement push invalide." }, 400);

  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  const hasLocation = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
  const requestedId = cleanText(body?.id, 36);
  const requestedSecret = cleanText(body?.secret, 100);
  let id = requestedId || randomId(9);
  let secret = requestedSecret || randomId(24);
  let existing: PushAlert | null = null;
  if (requestedId && requestedSecret) {
    existing = await alertStore().get(alertKey(tripId, requestedId), { type: "json" }) as PushAlert | null;
    if (!existing || await hashAlertSecret(requestedSecret, tripId, requestedId) !== existing.secretHash) {
      id = randomId(9);
      secret = randomId(24);
      existing = null;
    }
  }

  const tracking = await resolveFlights(trip.flights);
  const leg = tracking.legs.at(-1) || tracking.legs[0];
  const travelMinutes = hasLocation ? await roadTravelMinutes(latitude, longitude, leg?.destination) : null;
  const now = new Date().toISOString();
  const record: PushAlert = {
    id,
    tripId,
    secretHash: await hashAlertSecret(secret, tripId, id),
    subscription: body.subscription,
    settings: settings(body?.settings),
    state: existing?.state || {},
    latitude: hasLocation ? latitude : null,
    longitude: hasLocation ? longitude : null,
    travelMinutes,
    travelCheckedAt: travelMinutes ? now : null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    expiresAt: trip.expiresAt,
  };
  await alertStore().setJSON(alertKey(tripId, id), record, { metadata: { expiresAt: trip.expiresAt } });
  const arrivalTime = Date.parse(leg?.estimatedArrival);
  const recommendedDeparture = travelMinutes && Number.isFinite(arrivalTime)
    ? new Date(arrivalTime - (travelMinutes + record.settings.arrivalBufferMinutes) * 60_000).toISOString()
    : null;
  return json({ id, secret, travelMinutes, recommendedDeparture, destination: leg?.destination?.iata || null });
}

export default async (req: Request, context: Context) => {
  if (req.method === "GET" && new URL(req.url).pathname === "/api/alerts/config") {
    const publicKey = Netlify.env.get("VAPID_PUBLIC_KEY");
    return publicKey ? json({ publicKey }) : json({ error: "Notifications push non configurées." }, 503);
  }
  const tripId = cleanText(context.params.tripId, 30);
  if (req.method === "POST" && tripId) return register(req, tripId);
  return json({ error: "Méthode non autorisée." }, 405, { allow: "GET, POST" });
};

export const config: Config = {
  path: ["/api/alerts/config", "/api/trips/:tripId/alerts"],
};
