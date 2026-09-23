export const defaultAlertSettings = {
  delayEnabled: true,
  delayMinutes: 15,
  departureEnabled: true,
  arrivalBufferMinutes: 15,
  arrivedEnabled: true,
  travelMinutes: null,
};

const boundedNumber = (value, fallback, min, max) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(max, Math.max(min, Math.round(number)))
    : fallback;
};

export function normalizeAlertSettings(value = {}) {
  return {
    delayEnabled: value.delayEnabled !== false,
    delayMinutes: boundedNumber(value.delayMinutes, 15, 5, 180),
    departureEnabled: value.departureEnabled ?? value.arrivalEnabled ?? true,
    arrivalBufferMinutes: boundedNumber(value.arrivalBufferMinutes, 15, 0, 120),
    arrivedEnabled: value.arrivedEnabled !== false,
    travelMinutes: Number.isFinite(Number(value.travelMinutes)) ? Number(value.travelMinutes) : null,
  };
}

export function notificationEvents(leg, settingsValue, stateValue = {}, now = Date.now()) {
  const settings = normalizeAlertSettings(settingsValue);
  const state = { delaySent: false, departureSent: false, arrivedSent: false, ...stateValue };
  const events = [];
  const delay = Number(leg?.delayMinutes);

  if (
    settings.delayEnabled &&
    !state.delaySent &&
    Number.isFinite(delay) &&
    delay >= settings.delayMinutes
  ) {
    events.push({
      type: "delay",
      title: `${leg.number} · Retard de ${delay} min`,
      body: `L’arrivée est désormais estimée avec ${delay} minutes de retard.`,
    });
    state.delaySent = true;
  }

  const arrivalTime = Date.parse(leg?.estimatedArrival);
  const hasLiveEta = leg?.timingSource === "live-estimate" && Boolean(leg?.position);
  const minutesUntilArrival = Number.isFinite(arrivalTime)
    ? Math.ceil((arrivalTime - now) / 60_000)
    : null;
  if (
    settings.departureEnabled &&
    !state.departureSent &&
    hasLiveEta &&
    Number.isFinite(settings.travelMinutes) &&
    minutesUntilArrival > 0 &&
    minutesUntilArrival <= settings.travelMinutes + settings.arrivalBufferMinutes
  ) {
    events.push({
      type: "departure",
      title: "C’est le moment de partir 🚗✈️",
      body: `${Math.round(settings.travelMinutes)} min de route pour accueillir ${leg.number} à l’heure.`,
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
