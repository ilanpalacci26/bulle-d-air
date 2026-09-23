export const defaultAlertSettings = {
  delayEnabled: true,
  delayMinutes: 15,
  arrivalEnabled: true,
  arrivalMinutes: 45,
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
    arrivalEnabled: value.arrivalEnabled !== false,
    arrivalMinutes: boundedNumber(value.arrivalMinutes, 45, 5, 240),
  };
}

export function notificationEvents(leg, settingsValue, stateValue = {}, now = Date.now()) {
  const settings = normalizeAlertSettings(settingsValue);
  const state = { delaySent: false, arrivalSent: false, ...stateValue };
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
    settings.arrivalEnabled &&
    !state.arrivalSent &&
    hasLiveEta &&
    minutesUntilArrival > 0 &&
    minutesUntilArrival <= settings.arrivalMinutes
  ) {
    events.push({
      type: "arrival",
      title: "C’est le moment de partir ✈️",
      body: `${leg.number} est attendu dans environ ${minutesUntilArrival} min.`,
    });
    state.arrivalSent = true;
  }

  return { events, state, minutesUntilArrival };
}
