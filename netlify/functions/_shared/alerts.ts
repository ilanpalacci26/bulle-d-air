import { getStore } from "@netlify/blobs";
import type { AlertSettings, AlertState } from "./alert-events";

export type PushAlert = {
  id: string;
  tripId: string;
  secretHash: string;
  subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys: { p256dh: string; auth: string };
  };
  settings: AlertSettings;
  state: Record<string, AlertState>;
  latitude: number | null;
  longitude: number | null;
  travelMinutes: number | null;
  travelCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export const alertStore = () => getStore({ name: "bulle-air-alerts", consistency: "strong" });
export const alertKey = (tripId: string, id: string) => `alert/${tripId}/${id}`;
export const alertPrefix = (tripId = "") => `alert/${tripId}`;

export async function hashAlertSecret(secret: string, tripId: string, id: string) {
  const bytes = new TextEncoder().encode(`${tripId}:${id}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Buffer.from(digest).toString("hex");
}
