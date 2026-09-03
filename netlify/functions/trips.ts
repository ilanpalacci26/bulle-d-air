import type { Config, Context } from "@netlify/functions";
import { cleanText, json, normalizeFlightNumber } from "./_shared/http";
import { hashPassword, isExpired, publicTrip, randomId, randomPassword, tripKey, tripStore, type Avatar, type FlightLeg, type Trip } from "./_shared/trips";
import { resolveFlights } from "./_shared/flight-data";

const themes = new Set(["minecraft", "mario", "pokemon", "lego"]);
const colors = new Set(["#FF5D5D", "#FFD84D", "#66D9B8", "#70A7FF", "#A97AFF", "#FF8DC7", "#FF9B55", "#1E2430"]);

function validateFlights(value: unknown): FlightLeg[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2) return null;
  const flights = value.map((item: any) => ({
    number: normalizeFlightNumber(item?.number),
    scheduledDeparture: cleanText(item?.scheduledDeparture, 40),
  }));
  if (flights.some((item) => !/^[A-Z0-9]{3,10}$/.test(item.number) || !Number.isFinite(Date.parse(item.scheduledDeparture)))) return null;
  return flights;
}

function validatePassengers(value: unknown): Avatar[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) return null;
  const passengers = value.map((item: any) => {
    const kind = ["emoji", "initials", "photo"].includes(item?.kind) ? item.kind : "initials";
    let avatarValue = cleanText(item?.value, kind === "photo" ? 280_000 : 12);
    if (kind === "photo" && !/^data:image\/(png|jpeg|webp);base64,/i.test(avatarValue)) avatarValue = "";
    return {
      id: cleanText(item?.id, 36) || randomId(6),
      name: cleanText(item?.name, 30) || "Voyageur",
      kind,
      value: avatarValue,
      color: colors.has(item?.color) ? item.color : "#FFD84D",
    } as Avatar;
  });
  if (passengers.some((item) => !item.value || (item.kind === "photo" && item.value.length > 280_000))) return null;
  return passengers;
}

async function getTrip(id: string) {
  if (!/^[A-Za-z0-9_-]{8,24}$/.test(id)) return null;
  return tripStore().get(tripKey(id), { type: "json" }) as Promise<Trip | null>;
}

async function create(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Requête illisible." }, 400); }
  const username = cleanText(body?.username, 30);
  const flights = validateFlights(body?.flights);
  const passengers = validatePassengers(body?.passengers);
  const theme = themes.has(body?.theme) ? body.theme : "minecraft";
  if (username.length < 2) return json({ error: "Le nom d’utilisateur doit contenir au moins 2 caractères." }, 400);
  if (!flights) return json({ error: "Ajoutez un ou deux vols avec une date et une heure valides." }, 400);
  if (!passengers) return json({ error: "Ajoutez entre 1 et 8 voyageurs avec un avatar valide." }, 400);

  const id = randomId(9);
  const password = randomPassword();
  const createdAt = new Date();
  const trip: Trip = {
    id,
    ownerUsername: username,
    passwordHash: await hashPassword(username, password, id),
    theme,
    flights,
    passengers,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString(),
  };
  await tripStore().setJSON(tripKey(id), trip, { metadata: { expiresAt: trip.expiresAt } });
  return json({ trip: publicTrip(trip), password }, 201);
}

async function read(id: string) {
  const trip = await getTrip(id);
  if (!trip) return json({ error: "Ce voyage n’existe pas ou a déjà expiré." }, 404);
  if (isExpired(trip)) {
    await tripStore().delete(tripKey(id));
    return json({ error: "Ce lien a expiré après 48 heures." }, 410);
  }
  const tracking = await resolveFlights(trip.flights);
  return json({ trip: publicTrip(trip), tracking }, 200, { "cache-control": "public, max-age=10, stale-while-revalidate=15" });
}

async function update(req: Request, id: string) {
  const trip = await getTrip(id);
  if (!trip || isExpired(trip)) return json({ error: "Voyage introuvable ou expiré." }, 404);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Requête illisible." }, 400); }
  const username = cleanText(body?.username, 30);
  const password = cleanText(body?.password, 80);
  const candidate = await hashPassword(username, password, id);
  if (username.toLowerCase() !== trip.ownerUsername.toLowerCase() || candidate !== trip.passwordHash) return json({ error: "Identifiants incorrects." }, 401);
  if (body.theme && themes.has(body.theme)) trip.theme = body.theme;
  await tripStore().setJSON(tripKey(id), trip, { metadata: { expiresAt: trip.expiresAt } });
  return json({ trip: publicTrip(trip) });
}

export default async (req: Request, context: Context) => {
  const id = cleanText(context.params.id, 30);
  if (req.method === "POST" && !id) return create(req);
  if (req.method === "GET" && id) return read(id);
  if (req.method === "PATCH" && id) return update(req, id);
  return json({ error: "Méthode non autorisée." }, 405, { allow: "GET, POST, PATCH" });
};

export const config: Config = {
  path: ["/api/trips", "/api/trips/:id"],
};
