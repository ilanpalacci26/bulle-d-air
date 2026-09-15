import type { Config, Context } from "@netlify/functions";
import { cleanText, json } from "./_shared/http";
import { hashPresenceSecret, isExpired, presenceKey, presencePrefix, publicPresence, randomId, tripKey, tripStore, type Avatar, type Presence, type Trip } from "./_shared/trips";

const colors = new Set(["#FF5D5D", "#FFD84D", "#66D9B8", "#70A7FF", "#A97AFF", "#FF8DC7", "#FF9B55", "#1E2430"]);

function validId(value: string) {
  return /^[A-Za-z0-9_-]{8,24}$/.test(value);
}

function validPosition(body: any) {
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  const accuracy = body?.accuracy == null ? null : Math.max(0, Math.min(50_000, Number(body.accuracy)));
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude, accuracy: Number.isFinite(accuracy) ? accuracy : null };
}

function validAvatar(raw: any, name: string): Avatar {
  const kind = ["emoji", "initials", "photo"].includes(raw?.kind) ? raw.kind : "emoji";
  let value = cleanText(raw?.value, kind === "photo" ? 280_000 : 12);
  if (kind === "photo" && !/^data:image\/(png|jpeg|webp);base64,/i.test(value)) value = "";
  if (!value || (kind === "photo" && value.length > 280_000)) {
    value = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
    return { id: randomId(6), name, kind: "initials", value, color: "#FFD84D" };
  }
  return { id: randomId(6), name, kind, value, color: colors.has(raw?.color) ? raw.color : "#FFD84D" };
}

async function getTrip(tripId: string) {
  if (!validId(tripId)) return null;
  return tripStore().get(tripKey(tripId), { type: "json" }) as Promise<Trip | null>;
}

async function create(req: Request, tripId: string) {
  const trip = await getTrip(tripId);
  if (!trip || isExpired(trip)) return json({ error: "Ce voyage n’existe plus." }, 404);
  let body: any = {};
  if (req.method !== "DELETE") {
    try { body = await req.json(); } catch { return json({ error: "Requête illisible." }, 400); }
  }
  const position = validPosition(body);
  const name = cleanText(body?.name, 28);
  const message = cleanText(body?.message, 100);
  if (!position || name.length < 1) return json({ error: "Ajoutez votre nom et autorisez votre position." }, 400);
  const listed = await tripStore().list({ prefix: presencePrefix(tripId) });
  if (listed.blobs.length >= 30) return json({ error: "La carte a déjà beaucoup d’amis actifs. Réessayez plus tard." }, 429);
  const id = randomId(9);
  const secret = randomId(18);
  const now = new Date().toISOString();
  const presence: Presence = {
    id, tripId, secretHash: await hashPresenceSecret(secret, tripId, id), name,
    avatar: validAvatar(body?.avatar, name), message, ...position,
    createdAt: now, updatedAt: now, expiresAt: trip.expiresAt,
  };
  await tripStore().setJSON(presenceKey(tripId, id), presence, { metadata: { expiresAt: presence.expiresAt } });
  return json({ presence: publicPresence(presence), secret }, 201);
}

async function update(req: Request, tripId: string, id: string) {
  if (!validId(tripId) || !validId(id)) return json({ error: "Présence introuvable." }, 404);
  const store = tripStore();
  const presence = await store.get(presenceKey(tripId, id), { type: "json" }) as Presence | null;
  if (!presence || Date.parse(presence.expiresAt) <= Date.now()) return json({ error: "Présence introuvable." }, 404);
  let body: any = {};
  if (req.method !== "DELETE") {
    try { body = await req.json(); } catch { return json({ error: "Requête illisible." }, 400); }
  }
  const secret = cleanText(req.headers.get("x-presence-secret") || body?.secret, 80);
  if (await hashPresenceSecret(secret, tripId, id) !== presence.secretHash) return json({ error: "Clé de partage incorrecte." }, 401);
  if (req.method === "DELETE") {
    await store.delete(presenceKey(tripId, id));
    return json({ removed: true });
  }
  const position = validPosition(body);
  if (!position) return json({ error: "Position invalide." }, 400);
  Object.assign(presence, position, { message: cleanText(body?.message ?? presence.message, 100), updatedAt: new Date().toISOString() });
  await store.setJSON(presenceKey(tripId, id), presence, { metadata: { expiresAt: presence.expiresAt } });
  return json({ presence: publicPresence(presence) });
}

export default async (req: Request, context: Context) => {
  const tripId = cleanText(context.params.tripId, 30);
  const id = cleanText(context.params.id, 30);
  if (req.method === "POST" && tripId && !id) return create(req, tripId);
  if (["PATCH", "DELETE"].includes(req.method) && tripId && id) return update(req, tripId, id);
  return json({ error: "Méthode non autorisée." }, 405, { allow: "POST, PATCH, DELETE" });
};

export const config: Config = {
  path: ["/api/trips/:tripId/presences", "/api/trips/:tripId/presences/:id"],
};
