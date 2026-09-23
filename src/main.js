import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "./style.css";
import {
  defaultAlertSettings,
  normalizeAlertSettings,
  notificationEvents,
} from "./notifications.js";

maplibregl.setWorkerUrl(mapWorkerUrl);

const app = document.querySelector("#app");
const emojis = ["😎", "🥳", "🦊", "🐼", "🐸", "🦄", "🤠", "🛸", "🌈", "🧳"];
const colors = [
  "#ff5f57",
  "#ffd84d",
  "#61d8b3",
  "#70a7ff",
  "#a97aff",
  "#ff8dc7",
];
let passengers = [
  {
    id: crypto.randomUUID(),
    name: "Moi",
    kind: "emoji",
    value: "😎",
    color: colors[0],
  },
];
let map,
  pollTimer,
  locationWatch,
  currentTrip,
  currentTracking,
  planeMarker,
  sheetTrigger,
  presenceSending = false;
const presenceMarkers = new Map();

const icon = (name, size = 20) => {
  const paths = {
    plane:
      '<path d="M21.5 16.2 13.5 13V7.4c0-1.6-.7-4.4-1.5-4.4s-1.5 2.8-1.5 4.4V13l-8 3.2v2l8-1.3v3.5L8 21.8v1l4-1 4 1v-1l-2.5-1.4v-3.5l8 1.3Z"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    locate:
      '<circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  };
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ""}</svg>`;
};

function escapeHtml(value = "") {
  const node = document.createElement("div");
  node.textContent = String(value);
  return node.innerHTML;
}
function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}
function avatarHtml(avatar, alt = "") {
  return avatar?.kind === "photo"
    ? `<img src="${avatar.value}" alt="${escapeHtml(alt)}">`
    : `<span aria-hidden="true">${escapeHtml(avatar?.value || initials(alt))}</span>`;
}

function flightFields(index) {
  const when = new Date(Date.now() + (index - 1) * 4 * 60 * 60 * 1000);
  const local = new Date(
    when.getTime() - when.getTimezoneOffset() * 60_000,
  ).toISOString();
  return `<div class="flight-row" data-leg="${index}"><label><span>Numéro de vol</span><input id="flight-${index}" placeholder="AF123" maxlength="10" required autocapitalize="characters"></label><label><span>Date</span><input id="date-${index}" type="date" value="${local.slice(0, 10)}" required></label><label><span>Heure prévue</span><input id="time-${index}" type="time" value="${local.slice(11, 16)}" required></label>${index === 2 ? `<button class="icon-button remove-leg" type="button" aria-label="Supprimer l’escale">${icon("close")}</button>` : ""}</div>`;
}

function previewPlane() {
  return `<div class="preview-flight" aria-hidden="true"><div class="preview-orbit"></div><div class="preview-crew">${passengers
    .slice(0, 5)
    .map(
      (person, index) =>
        `<i style="--i:${index};--c:${person.color}">${avatarHtml(person)}</i>`,
    )
    .join(
      "",
    )}</div><div class="preview-plane">${icon("plane", 54)}</div></div>`;
}

function randomFrom(alphabet, size) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

const suggestSlug = () =>
  randomFrom("abcdefghijkmnpqrstuvwxyz23456789", 10);
const suggestPassword = () =>
  randomFrom("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789", 14);

function renderCreate() {
  clearRuntime();
  const slug = suggestSlug(),
    password = suggestPassword();
  app.innerHTML = `<main class="create-page"><nav class="landing-nav"><a class="brand" href="/">Bulle d’Air <span>${icon("plane", 18)}</span></a><span>Le vol, mais en plus vivant.</span></nav><section class="create-hero"><div class="hero-copy"><h1>Suivez-les<br>dans le ciel.</h1><p>Un lien simple, une carte vivante et toute la bande juste au-dessus de l’avion.</p><div class="hero-stamps"><span>Position live</span><span>Photos & emojis</span><span>48 h puis pouf</span></div></div>${previewPlane()}</section><section class="maker-wrap"><form id="create-form" class="maker"><div class="maker-title"><h2>Créer le voyage</h2><span>En 1 minute</span></div><label class="full-field"><span>Votre nom</span><input id="username" placeholder="Camille" maxlength="30" minlength="2" required autocomplete="username"></label><fieldset><legend>Le vol</legend><div id="flights">${flightFields(1)}</div><button id="add-leg" class="add-button" type="button">${icon("plus")} Ajouter une escale</button></fieldset><fieldset><legend>Qui est dans l’avion ?</legend><div id="passengers"></div><button id="add-passenger" class="add-button" type="button">${icon("plus")} Ajouter quelqu’un</button></fieldset><fieldset><legend>Lien & mot de passe</legend><label class="full-field"><span>Adresse du lien <small>générée, modifiable</small></span><div class="slug-field"><span class="slug-prefix">${location.host}/?trip=</span><input id="custom-id" value="${slug}" maxlength="24" minlength="4" pattern="[A-Za-z0-9_-]{4,24}" spellcheck="false" autocomplete="off" required></div></label><label class="full-field"><span>Mot de passe de gestion <small>généré, modifiable</small></span><input id="custom-password" value="${password}" maxlength="80" minlength="6" spellcheck="false" autocomplete="new-password" required></label><p class="privacy-note">Les deux sont créés automatiquement : changez-les si vous préférez les vôtres.</p></fieldset><p id="form-error" class="form-error" role="alert"></p><button class="cta" type="submit"><span>Créer le lien</span>${icon("arrow")}</button><p class="privacy-note">Le lien et ses positions disparaissent automatiquement après 48 h.</p></form></section></main>`;
  bindCreate();
}

function passengerRow(person, index) {
  return `<div class="person-row" data-id="${person.id}"><button class="person-avatar" type="button" style="--c:${person.color}" aria-label="Changer l’avatar de ${escapeHtml(person.name)}">${avatarHtml(person)}</button><label><span class="sr-only">Nom ${index + 1}</span><input class="person-name" value="${escapeHtml(person.name)}" maxlength="28"></label>${passengers.length > 1 ? `<button class="icon-button remove-person" type="button" aria-label="Supprimer ${escapeHtml(person.name)}">${icon("close")}</button>` : ""}<div class="avatar-popover" hidden><div class="emoji-list">${emojis.map((emoji) => `<button type="button" data-emoji="${emoji}">${emoji}</button>`).join("")}</div><label class="photo-button">Choisir une photo<input type="file" accept="image/png,image/jpeg,image/webp"></label><button class="initials-button" type="button">Utiliser mes initiales</button></div></div>`;
}

function drawPassengers() {
  document.querySelector("#passengers").innerHTML = passengers
    .map(passengerRow)
    .join("");
  document.querySelector("#add-passenger").disabled = passengers.length >= 6;
  const preview = document.querySelector(".preview-flight");
  if (preview) preview.outerHTML = previewPlane();
}

function bindCreate() {
  document.querySelector("#custom-id").pattern = "[A-Za-z0-9_\\-]{4,24}";
  drawPassengers();
  document.querySelector("#add-leg").addEventListener("click", () => {
    document
      .querySelector("#flights")
      .insertAdjacentHTML("beforeend", flightFields(2));
    document.querySelector("#add-leg").hidden = true;
  });
  document.querySelector("#flights").addEventListener("click", (event) => {
    if (event.target.closest(".remove-leg")) {
      event.target.closest(".flight-row").remove();
      document.querySelector("#add-leg").hidden = false;
    }
  });
  document.querySelector("#add-passenger").addEventListener("click", () => {
    const index = passengers.length;
    if (index >= 6) return;
    passengers.push({
      id: crypto.randomUUID(),
      name: `Voyageur ${index + 1}`,
      kind: "emoji",
      value: emojis[index],
      color: colors[index % colors.length],
    });
    drawPassengers();
  });
  const list = document.querySelector("#passengers");
  list.addEventListener("input", (event) => {
    if (!event.target.matches(".person-name")) return;
    const person = passengers.find(
      (item) => item.id === event.target.closest(".person-row").dataset.id,
    );
    person.name = event.target.value;
    if (person.kind === "initials") person.value = initials(person.name);
  });
  list.addEventListener("click", onPersonClick);
  list.addEventListener("change", onPersonFile);
  document.querySelector("#create-form").addEventListener("submit", createTrip);
}

function onPersonClick(event) {
  const row = event.target.closest(".person-row");
  if (!row) return;
  const person = passengers.find((item) => item.id === row.dataset.id);
  if (event.target.closest(".remove-person")) {
    passengers = passengers.filter((item) => item.id !== person.id);
    drawPassengers();
    return;
  }
  if (event.target.closest(".person-avatar")) {
    const popover = row.querySelector(".avatar-popover");
    document.querySelectorAll(".avatar-popover").forEach((item) => {
      if (item !== popover) item.hidden = true;
    });
    popover.hidden = !popover.hidden;
    return;
  }
  const emoji = event.target.closest("[data-emoji]");
  if (emoji) {
    person.kind = "emoji";
    person.value = emoji.dataset.emoji;
    drawPassengers();
    return;
  }
  if (event.target.closest(".initials-button")) {
    person.kind = "initials";
    person.value = initials(person.name);
    drawPassengers();
  }
}

async function onPersonFile(event) {
  if (event.target.type !== "file" || !event.target.files[0]) return;
  const person = passengers.find(
    (item) => item.id === event.target.closest(".person-row").dataset.id,
  );
  person.kind = "photo";
  person.value = await shrinkPhoto(event.target.files[0]);
  drawPassengers();
}
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const size = 180,
          canvas = document.createElement("canvas"),
          side = Math.min(image.width, image.height);
        canvas.width = size;
        canvas.height = size;
        canvas
          .getContext("2d")
          .drawImage(
            image,
            (image.width - side) / 2,
            (image.height - side) / 2,
            side,
            side,
            0,
            0,
            size,
            size,
          );
        resolve(canvas.toDataURL("image/jpeg", 0.76));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function createTrip(event) {
  event.preventDefault();
  const button = event.submitter,
    error = document.querySelector("#form-error");
  button.disabled = true;
  button.querySelector("span").textContent = "Création…";
  error.textContent = "";
  const flights = [...document.querySelectorAll(".flight-row")].map(
    (row, index) => ({
      number: row.querySelector(`#flight-${index + 1}`).value,
      scheduledDeparture: new Date(
        `${row.querySelector(`#date-${index + 1}`).value}T${row.querySelector(`#time-${index + 1}`).value}`,
      ).toISOString(),
    }),
  );
  try {
    const response = await fetch("/api/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: document.querySelector("#username").value,
        customId: document.querySelector("#custom-id").value.trim(),
        password: document.querySelector("#custom-password").value,
        flights,
        passengers,
      }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Impossible de créer le voyage.");
    renderSuccess(data);
  } catch (reason) {
    error.textContent = reason.message;
    button.disabled = false;
    button.querySelector("span").textContent = "Créer le lien";
  }
}

function renderSuccess(data) {
  const url = `${location.origin}${location.pathname}?trip=${data.trip.id}`;
  app.innerHTML = `<main class="success-page"><section class="success-ticket"><div class="success-plane">${icon("plane", 64)}</div><p class="ticket-label">Prêt au décollage</p><h1>Votre carte est en ligne.</h1><label>Lien à partager<div class="copy-field"><input id="share-link" value="${url}" readonly><button data-copy="share-link" type="button">${icon("copy")} Copier</button></div></label><label>Votre mot de passe<div class="copy-field"><code id="generated-password">${escapeHtml(data.password)}</code><button data-copy="generated-password" type="button">${icon("copy")} Copier</button></div></label><p class="save-warning">Gardez ce mot de passe : il n’est affiché qu’une fois.</p><a class="cta" href="${url}"><span>Voir la carte</span>${icon("arrow")}</a></section></main>`;
  document.querySelectorAll("[data-copy]").forEach((button) =>
    button.addEventListener("click", async () => {
      const target = document.querySelector(`#${button.dataset.copy}`);
      await navigator.clipboard.writeText(target.value || target.textContent);
      button.innerHTML = `${icon("copy")} Copié`;
    }),
  );
}

function renderTracker(id) {
  clearRuntime();
  app.innerHTML = `<main class="tracker-page"><div id="map" aria-label="Carte du trajet"></div><div class="map-wash"></div><header class="tracker-top"><a class="brand compact" href="/">Bulle d’Air <span>${icon("plane", 17)}</span></a><div id="flight-summary" class="flight-summary"><span class="skeleton short"></span><span class="skeleton"></span></div><button id="notifications" class="round-button" type="button" aria-label="Régler les notifications">${icon("bell")}</button></header><section id="flight-card" class="flight-card" aria-live="polite"><span class="skeleton"></span><span class="skeleton short"></span></section><div id="friends-count" class="friends-count" hidden></div><button id="here-button" class="here-button" type="button">${icon("pin", 24)} <span>Je suis là</span></button><aside id="presence-sheet" class="presence-sheet" aria-labelledby="presence-title" hidden><button class="sheet-close icon-button" type="button" aria-label="Fermer">${icon("close")}</button><h2 id="presence-title">Faites coucou sur la carte</h2><p>Votre position est partagée seulement pendant que cette page reste ouverte.</p><form id="presence-form"><label><span>Votre prénom</span><input id="viewer-name" maxlength="28" required placeholder="Alex"></label><fieldset><legend>Votre tête sur la carte</legend><div class="viewer-emojis">${emojis
    .slice(0, 8)
    .map(
      (emoji, index) =>
        `<label><input type="radio" name="viewer-emoji" value="${emoji}" ${index === 0 ? "checked" : ""}><span>${emoji}</span></label>`,
    )
    .join(
      "",
    )}</div><label class="photo-button viewer-photo">Ou une photo<input id="viewer-photo" type="file" accept="image/png,image/jpeg,image/webp"></label></fieldset><label><span>Petit message <small>facultatif</small></span><input id="viewer-message" maxlength="100" placeholder="On vous attend avec des croissants !"></label><p id="presence-error" class="form-error" role="alert"></p><button class="cta" type="submit"><span>Partager ma position</span>${icon("locate")}</button><button id="stop-sharing" class="stop-button" type="button" hidden>${icon("stop")} Arrêter le partage</button></form><p class="sheet-privacy">Vous pourrez arrêter à tout moment. Tout est supprimé avec ce voyage.</p></aside><aside id="notification-sheet" class="presence-sheet notification-sheet" aria-labelledby="notification-title" hidden><button class="sheet-close icon-button" type="button" aria-label="Fermer">${icon("close")}</button><h2 id="notification-title">Gardez un œil sur l’heure.</h2><p>Les alertes continuent même si vous fermez cette page.</p><form id="notification-form"><label class="alert-option"><input id="delay-enabled" type="checkbox" checked><span><strong>Retard important</strong><small>Me prévenir à partir de</small></span><span class="minute-field"><input id="delay-minutes" type="number" min="5" max="180" step="5" value="15" aria-label="Minutes de retard"> min</span></label><label class="alert-option"><input id="departure-enabled" type="checkbox" checked><span><strong>Quand dois-je partir ?</strong><small>Calculer la route depuis ma position</small></span><span class="minute-field"><input id="arrival-buffer-minutes" type="number" min="0" max="120" step="5" value="15" aria-label="Marge avant l’arrivée"> min avant</span></label><label class="alert-option simple"><input id="arrived-enabled" type="checkbox" checked><span><strong>L’avion est arrivé</strong><small>Me prévenir dès que son arrivée est confirmée</small></span></label><p id="route-estimate" class="route-estimate" aria-live="polite"></p><p id="notification-error" class="form-error" role="alert"></p><button class="cta" type="submit"><span>Activer mes alertes</span>${icon("bell")}</button></form><p class="sheet-privacy">Le calcul routier utilise votre position une fois. Elle disparaît avec ce voyage après 48 h.</p></aside><div id="toast" class="toast" role="status" aria-live="polite"></div></main>`;
  document.querySelectorAll(".presence-sheet").forEach((sheet) => {
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
  });
  document.querySelector("#presence-sheet").querySelector(":scope > p").textContent =
    "Votre position se met à jour tant que cette page reste ouverte.";
  bindTracker(id);
}

function bindTracker(id) {
  currentTrip = id;
  document.querySelector("#here-button").addEventListener("click", (event) => {
    sheetTrigger = event.currentTarget;
    toggleSheet("#presence-sheet", true, "#viewer-name");
  });
  document
    .querySelector("#presence-sheet .sheet-close")
    .addEventListener("click", () => toggleSheet("#presence-sheet", false));
  document
    .querySelector("#presence-sheet")
    .addEventListener("keydown", trapSheetKeys);
  document
    .querySelector("#presence-form")
    .addEventListener("submit", startSharing);
  document
    .querySelector("#stop-sharing")
    .addEventListener("click", stopSharing);
  document.querySelector("#notifications").addEventListener("click", openNotificationSettings);
  document
    .querySelector("#notification-sheet .sheet-close")
    .addEventListener("click", () => toggleSheet("#notification-sheet", false));
  document.querySelector("#notification-sheet").addEventListener("keydown", trapSheetKeys);
  document.querySelector("#notification-form").addEventListener("submit", enableNotifications);
  loadNotificationSettings();
  initMap();
  refreshTrip(true);
  pollTimer = setInterval(() => refreshTrip(false), 12_000);
}
function initMap() {
  map = new maplibregl.Map({
    container: "map",
    style: "https://tiles.openfreemap.org/styles/positron",
    center: [2, 30],
    zoom: 1.45,
    attributionControl: false,
  });
  map.addControl(
    new maplibregl.AttributionControl({ compact: true }),
    "bottom-right",
  );
  map.addControl(
    new maplibregl.NavigationControl({ showCompass: false }),
    "bottom-right",
  );
  map.on("zoom", applyMarkerScale);
  applyMarkerScale();
}

function applyMarkerScale() {
  const scale = Math.min(1.15, Math.max(0.4, 0.36 + map.getZoom() * 0.115));
  map
    .getContainer()
    .style.setProperty("--marker-scale", scale.toFixed(3));
}

async function refreshTrip(first) {
  try {
    const response = await fetch(`/api/trips/${currentTrip}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    currentTracking = data.tracking;
    drawTracker(data, first);
  } catch (reason) {
    document.querySelector("#flight-card").innerHTML =
      `<strong>Le voyage s’est envolé.</strong><span>${escapeHtml(reason.message || "Lien expiré")}</span>`;
  }
}

function drawTracker(data, first) {
  const leg =
      data.tracking.legs[data.tracking.activeIndex] || data.tracking.legs[0],
    origin = leg.origin?.iata || "•••",
    destination = leg.destination?.iata || "•••";
  const sourceLabel = leg.position
    ? "Position ADS-B récente"
    : "Aucune position récente";
  document.querySelector("#flight-summary").innerHTML =
    `<strong>${escapeHtml(leg.number)}</strong><span>${origin} <b>→</b> ${destination}</span>`;
  maybeNotify(leg);
  document.querySelector("#flight-card").innerHTML =
    `<div class="flight-state"><i class="status-dot ${leg.position ? "" : "estimated"}"></i><div><strong>${escapeHtml(leg.status.label)}</strong><span>${escapeHtml(sourceLabel)}</span></div></div><div class="flight-times"><span><small>Départ prévu</small><strong>${formatTime(leg.scheduledDeparture, leg.origin?.timeZone)}</strong></span><b>${leg.progress == null ? "—" : `${Math.round(leg.progress * 100)}%`}</b><span><small>Arrivée estimée</small><strong>${formatTime(leg.estimatedArrival, leg.destination?.timeZone)}</strong></span></div>`;
  drawMapData(leg, data.trip.passengers, data.presences || [], first);
  const count = (data.presences || []).length,
    badge = document.querySelector("#friends-count");
  badge.hidden = count === 0;
  badge.innerHTML = count
    ? `<span>${count}</span> proche${count > 1 ? "s" : ""} sur la carte`
    : "";
}

function drawMapData(leg, crew, presences, first) {
  const ready = () => {
    const coordinates = [];
    if (leg.origin && leg.destination) {
      setRoute(routePoints(leg.origin, leg.destination));
      coordinates.push(
        [leg.origin.longitude, leg.origin.latitude],
        [leg.destination.longitude, leg.destination.latitude],
      );
    }
    if (leg.position) {
      setPlaneMarker(leg.position, crew);
      coordinates.push([leg.position.longitude, leg.position.latitude]);
    } else if (planeMarker) {
      planeMarker.remove();
      planeMarker = null;
    }
    syncPresenceMarkers(presences);
    presences.forEach((person) =>
      coordinates.push([person.longitude, person.latitude]),
    );
    if (first && coordinates.length > 1) fitCoordinates(coordinates);
  };
  if (map.loaded()) ready();
  else map.once("load", ready);
}
function routePoints(origin, destination, count = 80) {
  let delta = destination.longitude - origin.longitude;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return Array.from({ length: count + 1 }, (_, index) => {
    const p = index / count;
    let lng = origin.longitude + delta * p;
    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;
    return [
      lng,
      origin.latitude +
        (destination.latitude - origin.latitude) * p +
        Math.sin(Math.PI * p) * Math.min(18, Math.abs(delta) * 0.12),
    ];
  });
}
function setRoute(points) {
  const data = {
    type: "Feature",
    geometry: { type: "LineString", coordinates: points },
  };
  if (map.getSource("route")) map.getSource("route").setData(data);
  else {
    map.addSource("route", { type: "geojson", data });
    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      paint: {
        "line-color": "#ff5f57",
        "line-width": 4,
        "line-dasharray": [1.5, 1.5],
        "line-opacity": 0.9,
      },
    });
  }
}

function setPlaneMarker(position, crew) {
  if (!planeMarker) {
    const element = document.createElement("div");
    element.className = "plane-marker";
    element.innerHTML = `<div class="plane-toy"><div class="air-crew">${crew
      .slice(0, 6)
      .map(
        (person, index) =>
          `<span style="--i:${index};--n:${Math.min(crew.length, 6)};--c:${person.color}" title="${escapeHtml(person.name)}">${avatarHtml(person, person.name)}</span>`,
      )
      .join("")}</div><div class="map-plane">${icon("plane", 42)}</div></div>`;
    planeMarker = new maplibregl.Marker({ element, anchor: "center" })
      .setLngLat([position.longitude, position.latitude])
      .addTo(map);
  } else planeMarker.setLngLat([position.longitude, position.latitude]);
}
function syncPresenceMarkers(presences) {
  const active = new Set(presences.map((person) => person.id));
  presenceMarkers.forEach((marker, id) => {
    if (!active.has(id)) {
      marker.remove();
      presenceMarkers.delete(id);
    }
  });
  presences.forEach((person) => {
    let marker = presenceMarkers.get(person.id);
    if (!marker) {
      const element = document.createElement("div");
      element.className = `friend-marker ${person.isLive ? "is-live" : ""}`;
      element.innerHTML = `<div class="friend-scale"><div class="friend-message">${escapeHtml(person.message || "Je suis là !")}</div><div class="friend-pin" style="--c:${person.avatar.color}">${avatarHtml(person.avatar, person.name)}</div><strong>${escapeHtml(person.name)}</strong></div>`;
      marker = new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([person.longitude, person.latitude])
        .addTo(map);
      presenceMarkers.set(person.id, marker);
    } else marker.setLngLat([person.longitude, person.latitude]);
  });
}
function fitCoordinates(points) {
  const bounds = points.reduce(
    (box, point) => box.extend(point),
    new maplibregl.LngLatBounds(points[0], points[0]),
  );
  map.fitBounds(bounds, {
    padding: { top: 130, right: 70, bottom: 190, left: 70 },
    maxZoom: 5,
    duration: 900,
  });
}
function toggleSheet(selector, show, focusSelector) {
  const sheet = document.querySelector(selector);
  document.querySelectorAll(".presence-sheet").forEach((item) => {
    if (item !== sheet) item.hidden = true;
  });
  sheet.hidden = !show;
  document.body.classList.toggle("sheet-open", show);
  if (show)
    setTimeout(() => document.querySelector(focusSelector || `${selector} .sheet-close`).focus(), 80);
  else sheetTrigger?.focus();
}

function trapSheetKeys(event) {
  const sheet = event.currentTarget;
  if (event.key === "Escape") {
    toggleSheet(`#${sheet.id}`, false);
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [
    ...sheet.querySelectorAll(
      'button:not([hidden]):not(:disabled),input:not([type="hidden"]):not(:disabled),[href]',
    ),
  ].filter((item) => item.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0],
    last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

async function startSharing(event) {
  event.preventDefault();
  const error = document.querySelector("#presence-error"),
    button = event.submitter;
  error.textContent = "";
  if (!navigator.geolocation) {
    error.textContent =
      "La localisation n’est pas disponible sur cet appareil.";
    return;
  }
  button.disabled = true;
  button.querySelector("span").textContent = "Recherche de votre position…";
  const photo = document.querySelector("#viewer-photo").files[0],
    avatar = photo
      ? { kind: "photo", value: await shrinkPhoto(photo), color: colors[3] }
      : {
          kind: "emoji",
          value: document.querySelector('[name="viewer-emoji"]:checked').value,
          color: colors[3],
        };
  const profile = {
    name: document.querySelector("#viewer-name").value.trim(),
    message: document.querySelector("#viewer-message").value.trim(),
    avatar,
  };
  if (!profile.name) {
    error.textContent = "Ajoutez votre prénom.";
    button.disabled = false;
    return;
  }
  document.querySelector("#stop-sharing").hidden = false;
  locationWatch = navigator.geolocation.watchPosition(
    (position) => sendPresence(position, profile),
    (reason) => {
      sharingFailed(
        reason.code === 1
          ? "Vous avez refusé la localisation. Vous pouvez l’autoriser dans les réglages du navigateur."
          : "Votre position est introuvable pour le moment.",
      );
    },
    { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
  );
}

async function sendPresence(position, profile) {
  if (presenceSending) return;
  presenceSending = true;
  const storageKey = `bulle-presence-${currentTrip}`,
    saved = JSON.parse(localStorage.getItem(storageKey) || "null"),
    payload = {
      ...profile,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  try {
    const response = await fetch(
      saved
        ? `/api/trips/${currentTrip}/presences/${saved.id}`
        : `/api/trips/${currentTrip}/presences`,
      {
        method: saved ? "PATCH" : "POST",
        headers: {
          "content-type": "application/json",
          ...(saved ? { "x-presence-secret": saved.secret } : {}),
        },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Partage impossible.");
    if (!saved)
      localStorage.setItem(
        storageKey,
        JSON.stringify({ id: data.presence.id, secret: data.secret }),
      );
    document.querySelector("#presence-form .cta").hidden = true;
    document.querySelector("#presence-error").textContent = "";
    showToast("Vous êtes sur la carte !");
    refreshTrip(false);
  } catch (reason) {
    sharingFailed(reason.message || "Partage impossible.");
  } finally {
    presenceSending = false;
  }
}

function sharingFailed(message) {
  if (locationWatch != null) navigator.geolocation.clearWatch(locationWatch);
  locationWatch = null;
  const cta = document.querySelector("#presence-form .cta");
  cta.hidden = false;
  cta.disabled = false;
  cta.querySelector("span").textContent = "Partager ma position";
  document.querySelector("#stop-sharing").hidden = true;
  document.querySelector("#presence-error").textContent = message;
}

async function stopSharing() {
  const storageKey = `bulle-presence-${currentTrip}`,
    saved = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (locationWatch != null) navigator.geolocation.clearWatch(locationWatch);
  locationWatch = null;
  if (saved)
    await fetch(`/api/trips/${currentTrip}/presences/${saved.id}`, {
      method: "DELETE",
      headers: { "x-presence-secret": saved.secret },
    });
  localStorage.removeItem(storageKey);
  const cta = document.querySelector("#presence-form .cta");
  cta.hidden = false;
  cta.disabled = false;
  cta.querySelector("span").textContent = "Partager ma position";
  document.querySelector("#stop-sharing").hidden = true;
  toggleSheet("#presence-sheet", false);
  showToast("Partage arrêté.");
  refreshTrip(false);
}

function alertStorageKey() {
  return `bulle-alerts-${currentTrip}`;
}
function readStoredJson(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}
function loadNotificationSettings() {
  const saved = readStoredJson(alertStorageKey());
  const settings = normalizeAlertSettings(saved || defaultAlertSettings);
  document.querySelector("#delay-enabled").checked = settings.delayEnabled;
  document.querySelector("#delay-minutes").value = settings.delayMinutes;
  document.querySelector("#departure-enabled").checked = settings.departureEnabled;
  document.querySelector("#arrival-buffer-minutes").value = settings.arrivalBufferMinutes;
  document.querySelector("#arrived-enabled").checked = settings.arrivedEnabled;
  const route = document.querySelector("#route-estimate");
  route.textContent = settings.travelMinutes
    ? `Trajet calculé : environ ${Math.round(settings.travelMinutes)} min jusqu’à l’aéroport.`
    : "Votre trajet sera calculé au moment de l’activation.";
  document.querySelector("#notifications").classList.toggle("active", Boolean(saved));
}
function openNotificationSettings(event) {
  sheetTrigger = event.currentTarget;
  loadNotificationSettings();
  toggleSheet("#notification-sheet", true, "#delay-minutes");
}
async function enableNotifications(event) {
  event.preventDefault();
  const error = document.querySelector("#notification-error");
  const button = event.submitter;
  error.textContent = "";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    showToast("Notifications non disponibles ici.");
    return;
  }
  button.disabled = true;
  button.querySelector("span").textContent = "Activation…";
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    const settings = normalizeAlertSettings({
      delayEnabled: document.querySelector("#delay-enabled").checked,
      delayMinutes: document.querySelector("#delay-minutes").value,
      departureEnabled: document.querySelector("#departure-enabled").checked,
      arrivalBufferMinutes: document.querySelector("#arrival-buffer-minutes").value,
      arrivedEnabled: document.querySelector("#arrived-enabled").checked,
    });
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const configResponse = await fetch("/api/alerts/config");
      const config = await configResponse.json();
      if (!configResponse.ok) throw new Error(config.error || "Configuration push indisponible.");
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription || await withTimeout(registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToBytes(config.publicKey),
        }), 15_000, "Le service de notifications met trop de temps à répondre. Réessayez.");
      const location = settings.departureEnabled ? await currentLocation() : null;
      const savedPush = readStoredJson(`bulle-push-${currentTrip}`, {});
      const response = await fetch(`/api/trips/${currentTrip}/alerts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...savedPush,
          subscription: subscription.toJSON(),
          settings,
          latitude: location?.coords.latitude,
          longitude: location?.coords.longitude,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Activation impossible.");
      const complete = normalizeAlertSettings({ ...settings, travelMinutes: data.travelMinutes });
      localStorage.setItem(alertStorageKey(), JSON.stringify(complete));
      localStorage.setItem(`bulle-push-${currentTrip}`, JSON.stringify({ id: data.id, secret: data.secret }));
      localStorage.removeItem(`bulle-alert-state-${currentTrip}`);
      document.querySelector("#notifications").classList.add("active");
      const routeMessage = data.travelMinutes
        ? `Route : ${data.travelMinutes} min · départ conseillé ${formatTime(data.recommendedDeparture)}.`
        : "Alertes activées. Le trajet routier n’a pas pu être calculé.";
      toggleSheet("#notification-sheet", false);
      showToast(routeMessage);
    } catch (reason) {
      error.textContent = reason.message || "Activation impossible.";
    }
  } else error.textContent = "Autorisez les notifications pour activer les alertes.";
  button.disabled = false;
  button.querySelector("span").textContent = "Activer mes alertes";
}
function maybeNotify(leg) {
  const settings = readStoredJson(alertStorageKey());
  if (!settings || !("Notification" in window) || Notification.permission !== "granted") return;
  if (readStoredJson(`bulle-push-${currentTrip}`)) return;
  const stateKey = `bulle-alert-state-${currentTrip}`;
  const previousState = readStoredJson(stateKey, {});
  const result = notificationEvents(leg, settings, previousState);
  localStorage.setItem(stateKey, JSON.stringify(result.state));
  result.events.forEach((notice) => new Notification(notice.title, { body: notice.body }));
}
function base64UrlToBytes(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const binary = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
function withTimeout(promise, milliseconds, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), milliseconds)),
  ]);
}
function currentLocation() {
  if (!navigator.geolocation) return Promise.reject(new Error("La localisation n’est pas disponible sur cet appareil."));
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
    resolve,
    (reason) => reject(new Error(reason.code === 1
      ? "Autorisez votre position pour calculer l’heure de départ."
      : "Votre position est introuvable pour le moment.")),
    { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 },
  ));
}
function stopPresenceOnExit() {
  if (!currentTrip) return;
  const saved = JSON.parse(
    localStorage.getItem(`bulle-presence-${currentTrip}`) || "null",
  );
  if (saved)
    fetch(`/api/trips/${currentTrip}/presences/${saved.id}`, {
      method: "DELETE",
      headers: { "x-presence-secret": saved.secret },
      keepalive: true,
    });
}
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}
function formatTime(value, timeZone) {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timeZone || undefined,
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }
}
function clearRuntime() {
  clearInterval(pollTimer);
  if (locationWatch != null && navigator.geolocation)
    navigator.geolocation.clearWatch(locationWatch);
  pollTimer = locationWatch = null;
  if (map) map.remove();
  map = planeMarker = null;
  presenceMarkers.clear();
  document.body.classList.remove("sheet-open");
}

const tripId = new URLSearchParams(location.search).get("trip");
window.addEventListener("pagehide", stopPresenceOnExit);
if (tripId) renderTracker(tripId);
else renderCreate();
