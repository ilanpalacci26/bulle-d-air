export type AlertSettings = {
  delayEnabled: boolean;
  delayMinutes: number;
  departureEnabled: boolean;
  arrivalBufferMinutes: number;
  arrivedEnabled: boolean;
};

export type AlertState = {
  delaySent?: boolean;
  departureSent?: boolean;
  arrivedSent?: boolean;
};

export type AlertEvent = {
  type: "delay" | "departure" | "arrived";
  title: string;
  body: string;
};

export function alertEvents(
  leg: any,
  settings: AlertSettings,
  previous: AlertState = {},
  travelMinutes: number | null = null,
  now = Date.now(),
) {
  const state: AlertState = { ...previous };
  const events: AlertEvent[] = [];
  const delay = Number(leg?.delayMinutes);
  if (settings.delayEnabled && !state.delaySent && Number.isFinite(delay) && delay >= settings.delayMinutes) {
    events.push({
      type: "delay",
      title: `${leg.number} · Retard de ${delay} min`,
      body: `L’arrivée est maintenant estimée avec ${delay} minutes de retard.`,
    });
    state.delaySent = true;
  }

  const arrivalTime = Date.parse(leg?.estimatedArrival);
  const minutesUntilArrival = Number.isFinite(arrivalTime) ? Math.ceil((arrivalTime - now) / 60_000) : null;
  const hasLiveEta = leg?.timingSource === "live-estimate" && Boolean(leg?.position);
  if (
    settings.departureEnabled &&
    !state.departureSent &&
    hasLiveEta &&
    Number.isFinite(travelMinutes) &&
    travelMinutes! > 0 &&
    minutesUntilArrival !== null &&
    minutesUntilArrival > 0 &&
    minutesUntilArrival <= travelMinutes! + settings.arrivalBufferMinutes
  ) {
    events.push({
      type: "departure",
      title: "C’est le moment de partir 🚗✈️",
      body: `${Math.round(travelMinutes!)} min de route pour accueillir ${leg.number} à l’heure.`,
    });
    state.departureSent = true;
  }

  if (settings.arrivedEnabled && !state.arrivedSent && leg?.status?.code === "arrived") {
    events.push({
      type: "arrived",
      title: `${leg.number} est arrivé 🎉`,
      body: `${leg.destination?.city || leg.destination?.iata || "L’avion"} : préparez les câlins !`,
    });
    state.arrivedSent = true;
  }

  return { events, state, minutesUntilArrival };
}
