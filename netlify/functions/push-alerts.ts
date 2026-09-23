import type { Config } from "@netlify/functions";
import webpush, { type PushSubscription } from "web-push";
import { alertEvents } from "./_shared/alert-events";
import { alertKey, alertStore, type PushAlert } from "./_shared/alerts";
import { resolveFlights } from "./_shared/flight-data";
import { isExpired, tripKey, tripStore, type Trip } from "./_shared/trips";

export default async () => {
  const publicKey = Netlify.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Netlify.env.get("VAPID_PRIVATE_KEY");
  if (!publicKey || !privateKey) throw new Error("VAPID keys are missing");
  webpush.setVapidDetails("https://bulle-d-air.netlify.app", publicKey, privateKey);

  const listed = await alertStore().list({ prefix: "alert/" });
  const records = (await Promise.all(
    listed.blobs.slice(0, 100).map((blob) => alertStore().get(blob.key, { type: "json" }) as Promise<PushAlert | null>),
  )).filter((item): item is PushAlert => Boolean(item));
  const trackingByTrip = new Map<string, Promise<{ trip: Trip | null; tracking: any | null }>>();

  const loadTracking = (tripId: string) => {
    if (!trackingByTrip.has(tripId)) {
      trackingByTrip.set(tripId, (async () => {
        const trip = await tripStore().get(tripKey(tripId), { type: "json" }) as Trip | null;
        if (!trip || isExpired(trip)) return { trip, tracking: null };
        return { trip, tracking: await resolveFlights(trip.flights) };
      })());
    }
    return trackingByTrip.get(tripId)!;
  };

  await Promise.all(records.map(async (record) => {
    const key = alertKey(record.tripId, record.id);
    if (Date.parse(record.expiresAt) <= Date.now()) {
      await alertStore().delete(key);
      return;
    }
    const { trip, tracking } = await loadTracking(record.tripId);
    if (!trip || !tracking) {
      await alertStore().delete(key);
      return;
    }
    const state = record.state && !Object.hasOwn(record.state, "delaySent") ? record.state : {};
    const events: ReturnType<typeof alertEvents>["events"] = [];
    tracking.legs.forEach((leg: any, index: number) => {
      const legKey = `${index}-${leg.number}`;
      const isFinalLeg = index === tracking.legs.length - 1;
      const result = alertEvents(leg, {
        ...record.settings,
        departureEnabled: record.settings.departureEnabled && isFinalLeg,
        arrivedEnabled: record.settings.arrivedEnabled && isFinalLeg,
      }, state[legKey] || {}, isFinalLeg ? record.travelMinutes : null);
      state[legKey] = result.state;
      events.push(...result.events);
    });
    if (!events.length) return;
    try {
      for (const event of events) {
        await webpush.sendNotification(record.subscription as PushSubscription, JSON.stringify({
          ...event,
          url: `/?trip=${encodeURIComponent(record.tripId)}`,
          tag: `bulle-${record.tripId}-${event.type}`,
        }));
      }
      record.state = state;
      record.updatedAt = new Date().toISOString();
      await alertStore().setJSON(key, record, { metadata: { expiresAt: record.expiresAt } });
    } catch (error: any) {
      if ([404, 410].includes(Number(error?.statusCode))) await alertStore().delete(key);
      else console.error(`Push failed for ${record.tripId}/${record.id}`, error?.statusCode || error?.message);
    }
  }));
};

export const config: Config = { schedule: "* * * * *" };
