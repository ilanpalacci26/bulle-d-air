import type { FlightLeg } from "./trips";

type Airport = {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  timeZone?: string;
  latitude: number;
  longitude: number;
};

const timeout = () => AbortSignal.timeout(8500);
const timeZoneCache = new Map<string, string>();

function airport(raw: any): Airport | null {
  if (!raw || !Number.isFinite(Number(raw.latitude)) || !Number.isFinite(Number(raw.longitude))) return null;
  return {
    iata: raw.iata_code || "—",
    icao: raw.icao_code || "—",
    name: raw.name || "Aéroport",
    city: raw.municipality || raw.country_name || "",
    country: raw.country_name || "",
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

function roundToFive(minutes: number) {
  return Math.round(minutes / 5) * 5;
}

function addMinutes(iso: string, minutes: number) {
  const time = Date.parse(iso);
  return Number.isFinite(time) ? new Date(time + minutes * 60_000).toISOString() : null;
}

function interpolatePosition(origin: Airport, destination: Airport, progress: number) {
  let longitudeDelta = destination.longitude - origin.longitude;
  if (longitudeDelta > 180) longitudeDelta -= 360;
  if (longitudeDelta < -180) longitudeDelta += 360;
  let longitude = origin.longitude + longitudeDelta * progress;
  if (longitude > 180) longitude -= 360;
  if (longitude < -180) longitude += 360;
  return {
    latitude: origin.latitude + (destination.latitude - origin.latitude) * progress,
    longitude,
  };
}

async function addTimeZone(place: Airport | null) {
  if (!place) return;
  const cacheKey = `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;
  const cached = timeZoneCache.get(cacheKey);
  if (cached) {
    place.timeZone = cached;
    return;
  }
  try {
    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      timezone: "auto",
      forecast_days: "1",
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: timeout() });
    if (!response.ok) return;
    const zone = (await response.json())?.timezone;
    if (typeof zone === "string" && zone.includes("/")) {
      place.timeZone = zone;
      timeZoneCache.set(cacheKey, zone);
    }
  } catch {
    // The rest of the flight card stays available without a time zone lookup.
  }
}

export async function resolveFlight(leg: FlightLeg) {
  const scheduledMs = Date.parse(leg.scheduledDeparture);
  const requestTime = Date.now();
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
  await Promise.all([addTimeZone(origin), addTimeZone(destination)]);
  const callsign = route?.callsign_icao || route?.callsign || leg.number;
  let aircraft: any = null;

  const liveWindow = Number.isFinite(scheduledMs)
    && scheduledMs > requestTime - 18 * 60 * 60 * 1000
    && scheduledMs < requestTime + 36 * 60 * 60 * 1000;
  if (liveWindow) {
    try {
      const response = await fetch(`https://api.adsb.lol/v2/callsign/${encodeURIComponent(callsign)}`, { signal: timeout() });
      if (response.ok) {
        const data = await response.json();
        aircraft = data?.ac?.find((item: any) => Number.isFinite(item.lat) && Number.isFinite(item.lon)) ?? null;
      }
    } catch {
      // Route information remains useful when live ADS-B is temporarily unavailable.
    }
  }

  const now = Date.now();
  const distanceKm = origin && destination ? Math.round(haversine(origin, destination)) : null;
  // A route-aware block-time estimate: cruise time plus taxi, climb and descent.
  const plannedDurationMinutes = distanceKm
    ? Math.max(45, roundToFive((distanceKm / 800) * 60 + 35))
    : null;
  const plannedArrival = plannedDurationMinutes
    ? addMinutes(leg.scheduledDeparture, plannedDurationMinutes)
    : null;
  let estimatedArrival = plannedArrival;
  let remainingKm: number | null = null;
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
        remainingKm = Math.round(remaining);
        progress = total ? Math.max(0.03, Math.min(0.98, 1 - remaining / total)) : 0.5;
        const measuredKmh = Number(aircraft.gs || 0) * 1.852;
        const usefulKmh = measuredKmh >= 350 ? Math.min(measuredKmh, 1_050) : 780;
        estimatedArrival = new Date(now + (remaining / usefulKmh) * 3_600_000 + 15 * 60_000).toISOString();
      } else progress = 0.5;
    }
    if (!aircraft.on_ground && plannedArrival && estimatedArrival && Date.parse(estimatedArrival) - Date.parse(plannedArrival) >= 10 * 60_000) {
      code = "airborne_delayed";
      label = "Retard estimé";
      detail = `Arrivée estimée ${Math.round((Date.parse(estimatedArrival) - Date.parse(plannedArrival)) / 60_000)} min après l’horaire calculé`;
    }
  } else if (origin && destination && plannedDurationMinutes && Number.isFinite(scheduledMs) && now >= scheduledMs && now <= scheduledMs + plannedDurationMinutes * 60_000) {
    progress = Math.max(0.02, Math.min(0.98, (now - scheduledMs) / (plannedDurationMinutes * 60_000)));
    code = "route_estimate";
    label = "Trajet estimé";
    detail = "Position animée selon l’horaire, en attente du signal ADS-B";
    remainingKm = Math.round((distanceKm || 0) * (1 - progress));
  } else if (origin && destination && plannedArrival && now > Date.parse(plannedArrival)) {
    progress = 1;
    code = "arrived_estimate";
    label = "Arrivée estimée";
    detail = "Horaire calculé, sans confirmation officielle";
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
    distanceKm,
    remainingKm,
    plannedDurationMinutes,
    plannedArrival,
    estimatedArrival,
    timingSource: aircraft && remainingKm !== null ? "live-estimate" : "route-estimate",
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
      registration: aircraft.r || null,
      aircraftType: aircraft.t || aircraft.desc || null,
      seenSecondsAgo: Number(aircraft.seen || aircraft.seen_pos || 0),
      estimated: false,
    } : origin && destination && progress > 0 ? {
      ...interpolatePosition(origin, destination, progress),
      heading: null,
      altitude: null,
      speed: null,
      registration: null,
      aircraftType: null,
      seenSecondsAgo: null,
      estimated: true,
    } : null,
    updatedAt: new Date().toISOString(),
    source: aircraft ? "ADSB.lol" : "ADSBdb + horaire",
  };
}

export async function resolveFlights(legs: FlightLeg[]) {
  const results = await Promise.all(legs.map(resolveFlight));
  let activeIndex = results.findIndex((item) => ["airborne", "airborne_delayed", "boarding", "route_estimate"].includes(item.status.code));
  if (activeIndex < 0) {
    const upcoming = results.findIndex((item) => Date.parse(item.scheduledDeparture) > Date.now() - 8 * 60 * 60 * 1000);
    activeIndex = upcoming >= 0 ? upcoming : results.length - 1;
  }
  return { legs: results, activeIndex: Math.max(0, activeIndex) };
}
