import { getStore } from "@netlify/blobs";

export type Avatar = {
  id: string;
  name: string;
  kind: "emoji" | "initials" | "photo";
  value: string;
  color: string;
};

export type FlightLeg = {
  number: string;
  scheduledDeparture: string;
};

export type Trip = {
  id: string;
  ownerUsername: string;
  passwordHash: string;
  theme: "minecraft" | "mario" | "pokemon" | "lego";
  flights: FlightLeg[];
  passengers: Avatar[];
  createdAt: string;
  expiresAt: string;
};

export const tripStore = () => getStore({ name: "bulle-air-trips", consistency: "strong" });
export const tripKey = (id: string) => `trip/${id}`;

function bytesToBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

export function randomId(size = 9) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export function randomPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export async function hashPassword(username: string, password: string, tripId: string) {
  const payload = new TextEncoder().encode(`${tripId}:${username.toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Buffer.from(digest).toString("hex");
}

export function isExpired(trip: Trip) {
  return Date.parse(trip.expiresAt) <= Date.now();
}

export function publicTrip(trip: Trip) {
  const { passwordHash: _passwordHash, ...safe } = trip;
  return safe;
}
