import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import "./style.css";

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
  moveTimer,
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

function renderCreate() {
  clearRuntime();
  app.innerHTML = `<main class="create-page"><nav class="landing-nav"><a class="brand" href="/">Bulle d’Air <span>${icon("plane", 18)}</span></a><span>Le vol, mais en plus vivant.</span></nav><section class="create-hero"><div class="hero-copy"><h1>Suivez-les<br>dans le ciel.</h1><p>Un lien simple, une carte vivante et toute la bande juste au-dessus de l’avion.</p><div class="hero-stamps"><span>Position live</span><span>Photos & emojis</span><span>48 h puis pouf</span></div></div>${previewPlane()}</section><section class="maker-wrap"><form id="create-form" class="maker"><div class="maker-title"><h2>Créer le voyage</h2><span>En 1 minute</span></div><label class="full-field"><span>Votre nom</span><input id="username" placeholder="Camille" maxlength="30" minlength="2" required autocomplete="username"></label><fieldset><legend>Le vol</legend><div id="flights">${flightFields(1)}</div><button id="add-leg" class="add-button" type="button">${icon("plus")} Ajouter une escale</button></fieldset><fieldset><legend>Qui est dans l’avion ?</legend><div id="passengers"></div><button id="add-passenger" class="add-button" type="button">${icon("plus")} Ajouter quelqu’un</button></fieldset><p id="form-error" class="form-error" role="alert"></p><button class="cta" type="submit"><span>Créer le lien</span>${icon("arrow")}</button><p class="privacy-note">Le lien et ses positions disparaissent automatiquement après 48 h.</p></form></section></main>`;
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
  app.innerHTML = `<main class="success-page"><section class="success-ticket"><div class="success-plane">${icon("plane", 64)}</div><p class="ticket-label">Prêt au décollage</p><h1>Votre carte est en ligne.</h1><label>Lien à partager<div class="copy-field"><input id="share-link" value="${url}" readonly><button data-copy="share-link" type="button">${icon("copy")} Copier</button></div></label><label>Votre mot de passe<div class="copy-field"><code id="generated-password">${data.password}</code><button data-copy="generated-password" type="button">${icon("copy")} Copier</button></div></label><p class="save-warning">Gardez ce mot de passe : il n’est affiché qu’une fois.</p><a class="cta" href="${url}"><span>Voir la carte</span>${icon("arrow")}</a></section></main>`;
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
  app.innerHTML = `<main class="tracker-page"><div id="map" aria-label="Carte du trajet"></div><div class="map-wash"></div><header class="tracker-top"><a class="brand compact" href="/">Bulle d’Air <span>${icon("plane", 17)}</span></a><div id="flight-summary" class="flight-summary"><span class="skeleton short"></span><span class="skeleton"></span></div><button id="notifications" class="round-button" type="button" aria-label="Activer les notifications">${icon("bell")}</button></header><section id="flight-card" class="flight-card" aria-live="polite"><span class="skeleton"></span><span class="skeleton short"></span></section><div id="friends-count" class="friends-count" hidden></div><button id="here-button" class="here-button" type="button">${icon("pin", 24)} <span>Je suis là</span></button><aside id="presence-sheet" class="presence-sheet" aria-labelledby="presence-title" hidden><button class="sheet-close icon-button" type="button" aria-label="Fermer">${icon("close")}</button><h2 id="presence-title">Faites coucou sur la carte</h2><p>Votre position est partagée seulement pendant que cette page reste ouverte.</p><form id="presence-form"><label><span>Votre prénom</span><input id="viewer-name" maxlength="28" required placeholder="Alex"></label><fieldset><legend>Votre tête sur la carte</legend><div class="viewer-emojis">${emojis
    .slice(0, 8)
    .map(
      (emoji, index) =>
        `<label><input type="radio" name="viewer-emoji" value="${emoji}" ${index === 0 ? "checked" : ""}><span>${emoji}</span></label>`,
    )
    .join(
      "",
    )}</div><label class="photo-button viewer-photo">Ou une photo<input id="viewer-photo" type="file" accept="image/png,image/jpeg,image/webp"></label></fieldset><label><span>Petit message <small>facultatif</small></span><input id="viewer-message" maxlength="100" placeholder="On vous attend avec des croissants !"></label><p id="presence-error" class="form-error" role="alert"></p><button class="cta" type="submit"><span>Partager ma position</span>${icon("locate")}</button><button id="stop-sharing" class="stop-button" type="button" hidden>${icon("stop")} Arrêter le partage</button></form><p class="sheet-privacy">Vous pourrez arrêter à tout moment. Tout est supprimé avec ce voyage.</p></aside><div id="toast" class="toast" role="status" aria-live="polite"></div></main>`;
  const sheet = document.querySelector("#presence-sheet");
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.querySelector(":scope > p").textContent =
    "Votre position se met à jour tant que cette page reste ouverte.";
  bindTracker(id);
}

function bindTracker(id) {
  currentTrip = id;
  document.querySelector("#here-button").addEventListener("click", (event) => {
    sheetTrigger = event.currentTarget;
    toggleSheet(true);
  });
  document
    .querySelector(".sheet-close")
    .addEventListener("click", () => toggleSheet(false));
  document
    .querySelector("#presence-sheet")
    .addEventListener("keydown", trapSheetKeys);
  document
    .querySelector("#presence-form")
    .addEventListener("submit", startSharing);
  document
    .querySelector("#stop-sharing")
    .addEventListener("click", stopSharing);
  document
    .querySelector("#notifications")
    .addEventListener("click", enableNotifications);
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
  const sourceLabel = leg.position?.estimated
    ? "Trajet horaire estimé"
    : leg.position
      ? "Position ADS-B en direct"
      : "En attente du signal";
  document.querySelector("#flight-summary").innerHTML =
    `<strong>${escapeHtml(leg.number)}</strong><span>${origin} <b>→</b> ${destination}</span>`;
  maybeNotify(leg);
  document.querySelector("#flight-card").innerHTML =
    `<div class="flight-state"><i class="status-dot ${leg.position?.estimated ? "estimated" : ""}"></i><div><strong>${escapeHtml(leg.status.label)}</strong><span>${escapeHtml(sourceLabel)}</span></div></div><div class="flight-times"><span><small>Départ prévu</small><strong>${formatTime(leg.scheduledDeparture, leg.origin?.timeZone)}</strong></span><b>${Math.round((leg.progress || 0) * 100)}%</b><span><small>Arrivée estimée</small><strong>${formatTime(leg.estimatedArrival, leg.destination?.timeZone)}</strong></span></div>`;
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
      animateEstimatedPlane(leg);
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
          `<span style="--i:${index};--c:${person.color}" title="${escapeHtml(person.name)}">${avatarHtml(person, person.name)}</span>`,
      )
      .join("")}</div><div class="map-plane">${icon("plane", 42)}</div></div>`;
    planeMarker = new maplibregl.Marker({ element, anchor: "center" })
      .setLngLat([position.longitude, position.latitude])
      .addTo(map);
  } else planeMarker.setLngLat([position.longitude, position.latitude]);
}
function animateEstimatedPlane(leg) {
  clearInterval(moveTimer);
  if (
    !leg.position?.estimated ||
    !leg.origin ||
    !leg.destination ||
    !leg.plannedDurationMinutes
  )
    return;
  moveTimer = setInterval(() => {
    const progress = Math.max(
        0.02,
        Math.min(
          0.98,
          (Date.now() - Date.parse(leg.scheduledDeparture)) /
            (leg.plannedDurationMinutes * 60_000),
        ),
      ),
      point = routePoints(leg.origin, leg.destination, 200)[
        Math.round(progress * 200)
      ];
    if (planeMarker && point) planeMarker.setLngLat(point);
  }, 1000);
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
      element.innerHTML = `<div class="friend-message">${escapeHtml(person.message || "Je suis là !")}</div><div class="friend-pin" style="--c:${person.avatar.color}">${avatarHtml(person.avatar, person.name)}</div><strong>${escapeHtml(person.name)}</strong>`;
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
function toggleSheet(show) {
  const sheet = document.querySelector("#presence-sheet");
  sheet.hidden = !show;
  document.body.classList.toggle("sheet-open", show);
  if (show)
    setTimeout(() => document.querySelector("#viewer-name").focus(), 80);
  else sheetTrigger?.focus();
}

function trapSheetKeys(event) {
  const sheet = event.currentTarget;
  if (event.key === "Escape") {
    toggleSheet(false);
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
  toggleSheet(false);
  showToast("Partage arrêté.");
  refreshTrip(false);
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    showToast("Notifications non disponibles ici.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    localStorage.setItem(`bulle-notify-${currentTrip}`, "yes");
    document.querySelector("#notifications").classList.add("active");
    showToast("Notifications activées.");
  } else showToast("Notifications non activées.");
}
function maybeNotify(leg) {
  const key = `bulle-status-${currentTrip}`;
  const previous = localStorage.getItem(key);
  localStorage.setItem(key, leg.status.code);
  if (
    previous &&
    previous !== leg.status.code &&
    leg.status.code.includes("delayed") &&
    localStorage.getItem(`bulle-notify-${currentTrip}`) === "yes" &&
    Notification.permission === "granted"
  )
    new Notification(`${leg.number} · Retard estimé`, {
      body: leg.status.detail,
    });
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
  clearInterval(moveTimer);
  if (locationWatch != null && navigator.geolocation)
    navigator.geolocation.clearWatch(locationWatch);
  pollTimer = moveTimer = locationWatch = null;
  if (map) map.remove();
  map = planeMarker = null;
  presenceMarkers.clear();
  document.body.classList.remove("sheet-open");
}

const tripId = new URLSearchParams(location.search).get("trip");
window.addEventListener("pagehide", stopPresenceOnExit);
if (tripId) renderTracker(tripId);
else renderCreate();
