import type { FlightLeg } from "./trips";

type Airport = {
  iata: string;
  icao: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
};

const timeout = () => AbortSignal.timeout(8500);

function airport(raw: any): Airport | null {
  if (!raw || !Number.isFinite(Number(raw.latitude)) || !Number.isFinite(Number(raw.longitude))) return null;
  return {
    iata: raw.iata_code || "—",
    icao: raw.icao_code || "—",
    name: raw.name || "Aéroport",
    city: raw.municipality || raw.country_name || "",
    latitude: Number(raw.latitude),
    longitude: Number(raw.longitude),
  };
}

function haversine(a: Airport | { latitude: number; longitude: number }, b: Airport | { latitude: number; longitude: number }) {
  const r = 6371;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export async function resolveFlight(leg: FlightLeg) {
  const scheduledMs = Date.parse(leg.scheduledDeparture);
  let route: any = null;
  let routeError = false;

  try {
    const response = await fetch(`https://api.adsbdb.com/v0/callsign/${encodeURIComponent(leg.number)}`, { signal: timeout() });
    if (response.ok) route = (await response.json())?.response?.flightroute ?? null;
    else routeError = true;
  } catch {
    routeError = true;
  }

  const origin = airport(route?.origin);
  const destination = airport(route?.destination);
  const callsign = route?.callsign_icao || route?.callsign || leg.number;
  let aircraft: any = null;

  try {
    const response = await fetch(`https://api.adsb.lol/v2/callsign/${encodeURIComponent(callsign)}`, { signal: timeout() });
    if (response.ok) {
      const data = await response.json();
      aircraft = data?.ac?.find((item: any) => Number.isFinite(item.lat) && Number.isFinite(item.lon)) ?? null;
    }
  } catch {
    // Route information remains useful when live ADS-B is temporarily unavailable.
  }

  const now = Date.now();
  let code = "scheduled";
  let label = "Prévu";
  let detail = "En attente du signal de l’avion";
  let progress = 0;

  if (aircraft) {
    const position = { latitude: Number(aircraft.lat), longitude: Number(aircraft.lon) };
    const altitude = aircraft.alt_baro === "ground" ? 0 : Number(aircraft.alt_baro || aircraft.alt_geom || 0);
    const nearDestination = destination ? haversine(position, destination) < 35 : false;
    if (aircraft.on_ground && nearDestination) {
      code = "arrived";
      label = "Arrivé";
      detail = destination ? `Posé près de ${destination.city || destination.iata}` : "Avion au sol";
      progress = 1;
    } else if (aircraft.on_ground) {
      code = "boarding";
      label = "Au sol";
      detail = "Signal reçu, décollage à venir";
    } else {
      code = "airborne";
      label = "En vol";
      detail = altitude ? `${Math.round(altitude).toLocaleString("fr-FR")} ft · ${Math.round(Number(aircraft.gs || 0))} kt` : "Position ADS-B en direct";
      if (origin && destination) {
        const total = haversine(origin, destination);
        const remaining = haversine(position, destination);
        progress = total ? Math.max(0.03, Math.min(0.98, 1 - remaining / total)) : 0.5;
      } else progress = 0.5;
    }
  } else if (Number.isFinite(scheduledMs) && now > scheduledMs + 15 * 60 * 1000 && now < scheduledMs + 8 * 60 * 60 * 1000) {
    code = "delayed_estimate";
    label = "Retard estimé";
    detail = `Aucun signal en vol ${Math.max(15, Math.round((now - scheduledMs) / 60000))} min après l’heure prévue`;
  } else if (Number.isFinite(scheduledMs) && now > scheduledMs - 90 * 60 * 1000) {
    code = "soon";
    label = "Bientôt";
    detail = "Le suivi en direct apparaîtra dès réception ADS-B";
  }

  return {
    number: leg.number,
    callsign,
    scheduledDeparture: leg.scheduledDeparture,
    airline: route?.airline?.name || null,
    origin,
    destination,
    routeAvailable: Boolean(origin && destination),
    routeError,
    status: { code, label, detail },
    progress,
    position: aircraft ? {
      latitude: Number(aircraft.lat),
      longitude: Number(aircraft.lon),
      heading: Number(aircraft.track || 0),
      altitude: aircraft.alt_baro,
      speed: aircraft.gs,
      seenSecondsAgo: Number(aircraft.seen || aircraft.seen_pos || 0),
    } : null,
    updatedAt: new Date().toISOString(),
    source: aircraft ? "ADSB.lol" : "ADSBdb",
  };
}

export async function resolveFlights(legs: FlightLeg[]) {
  const results = await Promise.all(legs.map(resolveFlight));
  let activeIndex = results.findIndex((item) => ["airborne", "boarding"].includes(item.status.code));
  if (activeIndex < 0) {
    const upcoming = results.findIndex((item) => Date.parse(item.scheduledDeparture) > Date.now() - 8 * 60 * 60 * 1000);
    activeIndex = upcoming >= 0 ? upcoming : results.length - 1;
  }
  return { legs: results, activeIndex: Math.max(0, activeIndex) };
}
