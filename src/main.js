import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import "./style.css";

const app = document.querySelector("#app");
const themes = [
  {
    id: "minecraft",
    name: "Minecraft",
    note: "Blocs & prairies",
    colors: ["#6ecb63", "#7b5c46", "#b9e769"],
  },
  {
    id: "mario",
    name: "Super Mario",
    note: "Tuyaux & nuages",
    colors: ["#ff5757", "#4b9fff", "#ffe36e"],
  },
  {
    id: "pokemon",
    name: "Pokémon",
    note: "Énergie & badges",
    colors: ["#ffd84d", "#3557a3", "#ff6b6b"],
  },
  {
    id: "lego",
    name: "LEGO",
    note: "Briques & couleurs",
    colors: ["#ff4545", "#ffd52f", "#2f7cff"],
  },
];
const emojiChoices = [
  "😎",
  "🥳",
  "🦊",
  "🐼",
  "🐸",
  "🦄",
  "🤠",
  "🚀",
  "🌈",
  "🧳",
];
const palette = [
  "#FF5D5D",
  "#FFD84D",
  "#66D9B8",
  "#70A7FF",
  "#A97AFF",
  "#FF8DC7",
  "#FF9B55",
  "#1E2430",
];
let passengers = [
  {
    id: crypto.randomUUID(),
    name: "Moi",
    kind: "emoji",
    value: "😎",
    color: palette[0],
  },
];
let map;
let pollTimer;

const icon = (name, size = 22) => {
  const paths = {
    plane:
      '<path d="M22 16.5 13.5 13V7.2c0-1.5-.7-4.2-1.5-4.2s-1.5 2.7-1.5 4.2V13L2 16.5v2l8.5-1.5v3.6L8 22v1l4-1 4 1v-1l-2.5-1.4V17l8.5 1.5Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    map: '<path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2Z"/><path d="M8 4v13M16 7v13"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    alert: '<path d="M12 3 2.5 20h19Z"/><path d="M12 9v4M12 17h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    spark:
      '<path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5Z"/><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7Z"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
  };
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ""}</svg>`;
};

function shell(content, theme = "minecraft") {
  document.body.dataset.theme = theme;
  app.innerHTML = `<header class="topbar">
    <a class="brand" href="/" aria-label="Accueil Bulle d’Air"><span class="brand-mark">${icon("plane", 26)}</span><strong>Bulle d’Air</strong></a>
    <div class="top-tag">Le ciel est plus sympa à plusieurs</div>
  </header>${content}`;
}

function renderCreate() {
  shell(`<main class="create-layout">
    <section class="create-copy">
      <h1>Votre vol.<br><span>Leur petite aventure.</span></h1>
      <p class="lead">Créez un lien de suivi vivant pour celles et ceux qui vous attendent. Position, retard estimé et bande de voyageurs inclus.</p>
      <div class="sky-demo" aria-hidden="true">
        <div class="demo-route"></div><div class="demo-plane">${icon("plane", 42)}</div>
        ${["😎", "🐼", "🦄", "🚀"].map((face, i) => `<span style="--i:${i}">${face}</span>`).join("")}
        <b>CDG</b><b>JFK</b>
      </div>
      <ul class="promise-list">
        <li>${icon("map")} Position ADS-B en direct quand disponible</li>
        <li>${icon("bell")} Notification de retard sur demande</li>
        <li>${icon("clock")} Disparaît automatiquement après 48 h</li>
      </ul>
    </section>

    <section class="builder" aria-labelledby="builder-title">
      <div class="builder-head"><h2 id="builder-title">Préparer le voyage</h2><span>2 min</span></div>
      <form id="create-form">
        <div class="field"><label for="username">Votre nom d’utilisateur</label><input id="username" name="username" required minlength="2" maxlength="30" placeholder="ex. Camille" autocomplete="username"></div>

        <fieldset><legend>Le vol</legend><div id="flights">
          ${flightFields(1)}
        </div><button class="text-button" type="button" id="add-leg">${icon("plus", 18)} Ajouter une escale</button></fieldset>

        <fieldset><legend>L’univers de la carte</legend><div class="theme-grid">
          ${themes.map((theme, i) => `<label class="theme-option"><input type="radio" name="theme" value="${theme.id}" ${i === 0 ? "checked" : ""}><span class="theme-preview ${theme.id}">${theme.colors.map((c) => `<i style="background:${c}"></i>`).join("")}</span><strong>${theme.name}</strong><small>${theme.note}</small></label>`).join("")}
        </div><p class="brand-note">Univers visuels non officiels, sans affiliation aux marques citées.</p></fieldset>

        <fieldset><legend>La bande à bord</legend><div id="passenger-list"></div><button class="text-button" type="button" id="add-passenger">${icon("plus", 18)} Ajouter un voyageur</button></fieldset>

        <div class="form-error" id="form-error" role="alert"></div>
        <button class="primary-action" type="submit"><span>${icon("spark")} Créer le lien magique</span><small>Actif pendant 48 heures</small></button>
      </form>
    </section>
  </main>`);
  bindCreate();
}

function flightFields(index) {
  const now = new Date(Date.now() + (index - 1) * 5 * 60 * 60 * 1000);
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  return `<div class="flight-row" data-leg="${index}"><div class="flight-number"><label for="flight-${index}">N° de vol ${index === 2 ? "après l’escale" : ""}</label><input id="flight-${index}" name="flight-${index}" placeholder="AF123" required maxlength="10" autocapitalize="characters"></div><div><label for="date-${index}">Date</label><input id="date-${index}" name="date-${index}" type="date" value="${date}" required></div><div><label for="time-${index}">Départ prévu</label><input id="time-${index}" name="time-${index}" type="time" value="${time}" required></div>${index === 2 ? `<button class="remove-leg" type="button" aria-label="Supprimer l’escale">${icon("close", 18)}</button>` : ""}</div>`;
}

function passengerRow(passenger, index) {
  const avatar =
    passenger.kind === "photo"
      ? `<img src="${passenger.value}" alt="">`
      : passenger.value;
  return `<div class="passenger-row" data-id="${passenger.id}"><button class="avatar-button" type="button" style="--avatar:${passenger.color}" aria-label="Personnaliser l’avatar de ${passenger.name}">${avatar}</button><input class="passenger-name" value="${escapeHtml(passenger.name)}" aria-label="Nom du voyageur ${index + 1}" maxlength="30"><button class="remove-passenger" type="button" aria-label="Supprimer ${escapeHtml(passenger.name)}">${icon("close", 18)}</button><div class="avatar-picker" hidden><div class="emoji-grid">${emojiChoices.map((e) => `<button type="button" data-emoji="${e}">${e}</button>`).join("")}</div><label class="photo-pick">Ajouter une photo<input type="file" accept="image/png,image/jpeg,image/webp"></label><div class="color-row">${palette.map((c) => `<button type="button" data-color="${c}" style="background:${c}" aria-label="Couleur ${c}"></button>`).join("")}</div><button type="button" data-initials>Utiliser les initiales</button></div></div>`;
}

function renderPassengers() {
  document.querySelector("#passenger-list").innerHTML = passengers
    .map(passengerRow)
    .join("");
  document.querySelector("#add-passenger").disabled = passengers.length >= 8;
}

function bindCreate() {
  renderPassengers();
  document.querySelector("#add-leg").addEventListener("click", () => {
    const flights = document.querySelector("#flights");
    if (flights.children.length > 1) return;
    flights.insertAdjacentHTML("beforeend", flightFields(2));
    document.querySelector("#add-leg").hidden = true;
  });
  document.querySelector("#flights").addEventListener("click", (event) => {
    if (event.target.closest(".remove-leg")) {
      event.target.closest(".flight-row").remove();
      document.querySelector("#add-leg").hidden = false;
    }
  });
  document.querySelector("#add-passenger").addEventListener("click", () => {
    if (passengers.length >= 8) return;
    const index = passengers.length;
    passengers.push({
      id: crypto.randomUUID(),
      name: `Voyageur ${index + 1}`,
      kind: "emoji",
      value: emojiChoices[index % emojiChoices.length],
      color: palette[index % palette.length],
    });
    renderPassengers();
  });
  document
    .querySelector("#passenger-list")
    .addEventListener("click", onPassengerClick);
  document
    .querySelector("#passenger-list")
    .addEventListener("input", onPassengerInput);
  document
    .querySelector("#passenger-list")
    .addEventListener("change", onPassengerFile);
  document.querySelector("#create-form").addEventListener("submit", createTrip);
}

function onPassengerClick(event) {
  const row = event.target.closest(".passenger-row");
  if (!row) return;
  const passenger = passengers.find((p) => p.id === row.dataset.id);
  if (event.target.closest(".remove-passenger")) {
    if (passengers.length === 1) return;
    passengers = passengers.filter((p) => p.id !== row.dataset.id);
    renderPassengers();
    return;
  }
  if (event.target.closest(".avatar-button")) {
    const picker = row.querySelector(".avatar-picker");
    document.querySelectorAll(".avatar-picker").forEach((p) => {
      if (p !== picker) p.hidden = true;
    });
    picker.hidden = !picker.hidden;
    return;
  }
  const emoji = event.target.closest("[data-emoji]");
  if (emoji) {
    passenger.kind = "emoji";
    passenger.value = emoji.dataset.emoji;
    renderPassengers();
    return;
  }
  const color = event.target.closest("[data-color]");
  if (color) {
    passenger.color = color.dataset.color;
    renderPassengers();
    return;
  }
  if (event.target.closest("[data-initials]")) {
    passenger.kind = "initials";
    passenger.value = initials(passenger.name);
    renderPassengers();
  }
}

function onPassengerInput(event) {
  const row = event.target.closest(".passenger-row");
  if (!row || !event.target.matches(".passenger-name")) return;
  const passenger = passengers.find((p) => p.id === row.dataset.id);
  passenger.name = event.target.value;
  if (passenger.kind === "initials") passenger.value = initials(passenger.name);
}

async function onPassengerFile(event) {
  if (!event.target.matches('input[type="file"]') || !event.target.files[0])
    return;
  const row = event.target.closest(".passenger-row");
  const passenger = passengers.find((p) => p.id === row.dataset.id);
  try {
    passenger.value = await compressImage(event.target.files[0]);
    passenger.kind = "photo";
    renderPassengers();
  } catch {
    document.querySelector("#form-error").textContent =
      "Cette photo ne peut pas être utilisée. Choisissez un fichier JPG, PNG ou WebP de moins de 8 Mo.";
    event.target.value = "";
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 8 * 1024 * 1024)
      return reject(new Error("Photo trop lourde"));
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 180;
      canvas.height = 180;
      const ctx = canvas.getContext("2d");
      const scale = Math.max(180 / image.width, 180 / image.height);
      ctx.drawImage(
        image,
        (180 - image.width * scale) / 2,
        (180 - image.height * scale) / 2,
        image.width * scale,
        image.height * scale,
      );
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

async function createTrip(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  const error = document.querySelector("#form-error");
  error.textContent = "";
  submit.disabled = true;
  submit.classList.add("loading");
  const data = new FormData(form);
  const flights = [...document.querySelectorAll(".flight-row")].map((row) => ({
    number: row.querySelector('input[id^="flight-"]').value,
    scheduledDeparture: new Date(
      `${row.querySelector('input[type="date"]').value}T${row.querySelector('input[type="time"]').value}`,
    ).toISOString(),
  }));
  try {
    const response = await fetch("/api/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: data.get("username"),
        theme: data.get("theme"),
        flights,
        passengers,
      }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Impossible de créer le voyage.");
    renderCreated(result.trip, result.password);
  } catch (cause) {
    error.textContent = cause.message;
    submit.disabled = false;
    submit.classList.remove("loading");
  }
}

function renderCreated(trip, password) {
  const link = `${location.origin}/?trip=${trip.id}`;
  shell(`<main class="success-layout">
    <section class="success-orbit"><div class="orbit-plane">${icon("plane", 78)}</div>${trip.passengers.map((p, i) => `<span class="success-avatar" style="--i:${i};--total:${trip.passengers.length};--avatar:${p.color}">${avatarContent(p)}</span>`).join("")}</section>
    <section class="success-panel"><span class="success-check">${icon("check", 34)}</span><h1>Le voyage est prêt à décoller.</h1><p>Partagez ce lien. Il s’effacera automatiquement le ${formatDate(trip.expiresAt)}.</p>
      <label>Lien public</label><div class="credential"><input id="share-link" value="${link}" readonly><button data-copy="#share-link">${icon("copy")} Copier</button></div>
      <div class="password-box"><div>${icon("lock")}<span><small>Votre mot de passe de gestion</small><strong id="generated-password">${password}</strong></span></div><button data-copy="#generated-password">${icon("copy")} Copier</button></div>
      <p class="warning-note">Notez ce mot de passe maintenant : il ne sera plus jamais affiché.</p>
      <a class="primary-action link-action" href="${link}"><span>${icon("map")} Ouvrir le suivi</span></a>
    </section></main>`);
  document.querySelectorAll("[data-copy]").forEach((button) =>
    button.addEventListener("click", async () => {
      const target = document.querySelector(button.dataset.copy);
      await navigator.clipboard.writeText(target.value || target.textContent);
      button.innerHTML = `${icon("check")} Copié`;
    }),
  );
}

async function renderTrack(id) {
  shell(
    `<main class="track-loading"><div class="loader-plane">${icon("plane", 60)}</div><h1>On cherche l’avion…</h1><p>Les radars remuent ciel et terre.</p></main>`,
  );
  try {
    const response = await fetch(`/api/trips/${encodeURIComponent(id)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Voyage introuvable.");
    renderTracker(result.trip, result.tracking);
  } catch (cause) {
    renderError(cause.message);
  }
}

function renderTracker(trip, tracking) {
  const active = tracking.legs[tracking.activeIndex];
  shell(
    `<main class="tracker theme-${trip.theme}">
    <section class="tracker-head">
      <div><div class="flight-chips">${tracking.legs.map((leg, i) => `<span class="flight-chip ${i === tracking.activeIndex ? "active" : ""}">${leg.number}${i < tracking.legs.length - 1 ? " · escale" : ""}</span>`).join("")}</div><h1>${active.origin?.iata || "Départ"} <span>${icon("plane", 34)}</span> ${active.destination?.iata || "Arrivée"}</h1><p>${active.airline || "Compagnie non identifiée"} · créé par ${escapeHtml(trip.ownerUsername)}</p></div>
      <div class="status-block status-${active.status.code}"><i></i><span><small>Statut</small><strong>${active.status.label}</strong></span></div>
    </section>
    <section class="map-stage">
      <div id="map" aria-label="Carte mondiale du suivi du vol"></div>
      <div class="theme-ornaments" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="map-overlay top-left"><strong>${active.status.detail}</strong><small>Actualisé à ${new Date(active.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · source ${active.source}</small></div>
      <div class="theme-switcher" aria-label="Changer le thème de la carte">${themes.map((t) => `<button data-theme="${t.id}" class="${t.id === trip.theme ? "active" : ""}"><span class="mini-theme ${t.id}"></span>${t.name}</button>`).join("")}</div>
      ${!active.position ? `<div class="no-signal">${icon("alert", 26)}<span><strong>Position en attente</strong><small>L’avion apparaîtra dès qu’un signal ADS-B public sera disponible.</small></span></div>` : ""}
    </section>
    <section class="flight-facts" aria-label="Informations détaillées du vol">${flightFacts(active)}</section>
    <section class="flight-dock">
      <div class="route-progress"><span><b>${active.origin?.city || active.origin?.iata || "Départ"}</b><small>${formatTime(active.scheduledDeparture)}</small></span><div><i style="width:${Math.round(active.progress * 100)}%"></i><b style="left:${Math.round(active.progress * 100)}%">${icon("plane", 18)}</b></div><span><b>${active.destination?.city || active.destination?.iata || "Arrivée"}</b><small>${active.destination?.iata || ""}</small></span></div>
      <div class="crew"><div class="crew-stack">${trip.passengers.map((p, i) => `<span style="--avatar:${p.color};--i:${i}" title="${escapeHtml(p.name)}">${avatarContent(p)}</span>`).join("")}</div><p><strong>${trip.passengers.length} à bord</strong><small>${trip.passengers.map((p) => escapeHtml(p.name)).join(" · ")}</small></p></div>
      <div class="dock-actions"><button id="notifications">${icon("bell")} M’alerter d’un retard</button><button id="manage">${icon("settings")} Gérer</button></div>
    </section>
    <footer class="tracker-footer"><span>Ce lien expire le ${formatDate(trip.expiresAt)}</span><span>Retard estimé, non officiel, sans clé de données commerciale.</span></footer>
    <section class="manage-drawer" id="manage-drawer" role="dialog" aria-modal="true" aria-labelledby="manage-title" hidden><div><button class="drawer-close" aria-label="Fermer">${icon("close")}</button><h2 id="manage-title">Gérer ce voyage</h2><p>Identifiez-vous pour changer le thème partagé.</p><form id="manage-form"><label>Nom d’utilisateur<input name="username" autocomplete="username" required></label><label>Mot de passe<input name="password" type="password" autocomplete="current-password" required></label><label>Thème<select name="theme">${themes.map((t) => `<option value="${t.id}" ${t.id === trip.theme ? "selected" : ""}>${t.name}</option>`).join("")}</select></label><div class="form-error" role="alert"></div><button class="primary-action" type="submit"><span>Enregistrer</span></button></form></div></section>
  </main>`,
    trip.theme,
  );
  initMap(trip, active);
  bindTracker(trip, active);
  checkDelayNotification(trip, active);
  clearInterval(pollTimer);
  pollTimer = setInterval(() => refreshTracking(trip.id), 30000);
}

async function refreshTracking(id) {
  try {
    const response = await fetch(`/api/trips/${encodeURIComponent(id)}`);
    const result = await response.json();
    if (!response.ok) return;
    const active = result.tracking.legs[result.tracking.activeIndex];
    const currentActive =
      document.querySelector(".flight-chip.active")?.textContent || "";
    if (!currentActive.startsWith(active.number)) {
      renderTracker(result.trip, result.tracking);
      return;
    }
    const status = document.querySelector(".status-block");
    status.className = `status-block status-${active.status.code}`;
    status.querySelector("strong").textContent = active.status.label;
    document.querySelector(".map-overlay strong").textContent =
      active.status.detail;
    const facts = document.querySelector(".flight-facts");
    if (facts) facts.innerHTML = flightFacts(active);
    checkDelayNotification(result.trip, active);
    if (active.position && map) updatePlaneMarker(result.trip, active);
  } catch {
    /* Next poll will retry. */
  }
}

function initMap(trip, active) {
  map = new maplibregl.Map({
    container: "map",
    style: "https://tiles.openfreemap.org/styles/liberty",
    center: active.position
      ? [active.position.longitude, active.position.latitude]
      : active.origin && active.destination
        ? [
            (active.origin.longitude + active.destination.longitude) / 2,
            (active.origin.latitude + active.destination.latitude) / 2,
          ]
        : [2, 30],
    zoom: active.position ? 4.5 : 1.7,
    attributionControl: false,
  });
  map.addControl(
    new maplibregl.NavigationControl({ showCompass: false }),
    "top-right",
  );
  map.addControl(
    new maplibregl.AttributionControl({ compact: true }),
    "bottom-right",
  );
  map.on("load", () => {
    if (active.origin && active.destination) {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [active.origin.longitude, active.origin.latitude],
              [active.destination.longitude, active.destination.latitude],
            ],
          },
        },
      });
      const design = themeDesign(trip.theme);
      map.addLayer({
        id: "route-shadow",
        type: "line",
        source: "route",
        paint: {
          "line-color": design.shadow,
          "line-width": design.shadowWidth,
          "line-opacity": 0.88,
        },
      });
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        paint: {
          "line-color": design.route,
          "line-width": design.width,
          "line-dasharray": design.dash,
        },
      });
      [active.origin, active.destination].forEach((airport, i) =>
        new maplibregl.Marker({
          element: airportMarker(airport.iata, i ? "arrival" : "departure"),
          anchor: "bottom",
        })
          .setLngLat([airport.longitude, airport.latitude])
          .addTo(map),
      );
      const bounds = new maplibregl.LngLatBounds(
        [active.origin.longitude, active.origin.latitude],
        [active.destination.longitude, active.destination.latitude],
      );
      map.fitBounds(bounds, {
        padding: { top: 120, bottom: 120, left: 80, right: 80 },
        maxZoom: 5,
        duration: 0,
      });
    }
    if (active.position) updatePlaneMarker(trip, active);
  });
}

function airportMarker(code, type) {
  const el = document.createElement("div");
  el.className = `airport-marker ${type}`;
  el.textContent = code;
  return el;
}

function updatePlaneMarker(trip, active) {
  document.querySelector(".plane-marker")?.remove();
  const el = document.createElement("div");
  el.className = "plane-marker";
  el.innerHTML = `<div class="plane-core" style="transform:rotate(${active.position.heading - 45}deg)">${icon("plane", 38)}</div>${trip.passengers.map((p, i) => `<span style="--i:${i};--total:${trip.passengers.length};--avatar:${p.color}">${avatarContent(p)}</span>`).join("")}`;
  new maplibregl.Marker({ element: el })
    .setLngLat([active.position.longitude, active.position.latitude])
    .addTo(map);
  map.easeTo({
    center: [active.position.longitude, active.position.latitude],
    duration: 1000,
  });
}

function bindTracker(trip, active) {
  document
    .querySelector("#notifications")
    .addEventListener("click", async (event) => {
      const button = event.currentTarget;
      if (!("Notification" in window))
        return setButtonMessage(button, "Non disponible sur ce navigateur");
      const permission = await Notification.requestPermission();
      localStorage.setItem(
        `notify:${trip.id}`,
        permission === "granted" ? "yes" : "no",
      );
      setButtonMessage(
        button,
        permission === "granted" ? "Alertes activées" : "Alertes refusées",
      );
      if (permission === "granted") checkDelayNotification(trip, active);
    });
  document
    .querySelectorAll("[data-theme]")
    .forEach((button) =>
      button.addEventListener("click", () => applyTheme(button.dataset.theme)),
    );
  const drawer = document.querySelector("#manage-drawer");
  const manageButton = document.querySelector("#manage");
  const closeDrawer = () => {
    drawer.hidden = true;
    manageButton.focus();
  };
  manageButton.addEventListener("click", () => {
    drawer.hidden = false;
    drawer.querySelector('input[name="username"]').focus();
  });
  drawer.querySelector(".drawer-close").addEventListener("click", closeDrawer);
  drawer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") return closeDrawer();
    if (event.key !== "Tab") return;
    const focusable = [
      ...drawer.querySelectorAll("button,input,select,[href]"),
    ].filter((el) => !el.disabled);
    const first = focusable[0],
      last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  document
    .querySelector("#manage-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const error = event.currentTarget.querySelector(".form-error");
      try {
        const response = await fetch(`/api/trips/${trip.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(Object.fromEntries(data)),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        applyTheme(result.trip.theme);
        closeDrawer();
      } catch (cause) {
        error.textContent = cause.message;
      }
    });
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const tracker = document.querySelector(".tracker");
  tracker.className = `tracker theme-${theme}`;
  document
    .querySelectorAll("[data-theme]")
    .forEach((button) =>
      button.classList.toggle("active", button.dataset.theme === theme),
    );
  if (map?.getLayer("route")) {
    const design = themeDesign(theme);
    map.setPaintProperty("route", "line-color", design.route);
    map.setPaintProperty("route", "line-width", design.width);
    map.setPaintProperty("route", "line-dasharray", design.dash);
    map.setPaintProperty("route-shadow", "line-color", design.shadow);
    map.setPaintProperty("route-shadow", "line-width", design.shadowWidth);
  }
}

function themeDesign(theme) {
  return (
    {
      minecraft: {
        route: "#315f2e",
        shadow: "#e9ffd7",
        width: 4,
        shadowWidth: 9,
        dash: [1, 1],
      },
      mario: {
        route: "#e03636",
        shadow: "#ffffff",
        width: 4,
        shadowWidth: 10,
        dash: [2, 1],
      },
      pokemon: {
        route: "#28488f",
        shadow: "#ffe65a",
        width: 4,
        shadowWidth: 11,
        dash: [3, 1.5],
      },
      lego: {
        route: "#ed2d2d",
        shadow: "#ffd62f",
        width: 5,
        shadowWidth: 12,
        dash: [1, 0.7],
      },
    }[theme] || {
      route: "#272333",
      shadow: "#ffffff",
      width: 3,
      shadowWidth: 7,
      dash: [2, 2],
    }
  );
}

function checkDelayNotification(trip, active) {
  const key = `last-status:${trip.id}`;
  const previous = localStorage.getItem(key);
  localStorage.setItem(key, active.status.code);
  if (
    active.status.code === "delayed_estimate" &&
    previous !== "delayed_estimate" &&
    localStorage.getItem(`notify:${trip.id}`) === "yes" &&
    Notification.permission === "granted"
  ) {
    new Notification(`${active.number} · retard estimé`, {
      body: active.status.detail,
      icon: "/plane.svg",
      tag: `delay-${trip.id}`,
    });
  }
}

function setButtonMessage(button, message) {
  button.innerHTML = `${icon("check")} ${message}`;
}
function initials(name) {
  return (
    String(name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}
function avatarContent(p) {
  return p.kind === "photo"
    ? `<img src="${p.value}" alt="${escapeHtml(p.name)}">`
    : escapeHtml(p.value || initials(p.name));
}
function formatDate(value) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatTime(value) {
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatFlightDateTime(value, timeZone) {
  if (!value) return "Non disponible";
  const options = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  };
  if (timeZone) options.timeZone = timeZone;
  try {
    return new Date(value).toLocaleString("fr-FR", options);
  } catch {
    delete options.timeZone;
    return new Date(value).toLocaleString("fr-FR", options);
  }
}
function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return "—";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours ? `${hours} h ` : ""}${String(rest).padStart(2, "0")} min`;
}
function headingLabel(value) {
  if (!Number.isFinite(value)) return "—";
  const points = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return `${points[Math.round(value / 45) % 8]} · ${Math.round(value)}°`;
}
function flightFacts(active) {
  const live = active.timingSource === "live-estimate";
  const position = active.position;
  const arrival = active.estimatedArrival || active.plannedArrival;
  const fact = (label, value, note = "") => `<div class="fact"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong>${note ? `<span>${escapeHtml(note)}</span>` : ""}</div>`;
  return `<div class="facts-heading"><div><span class="eyebrow">Carnet de vol</span><h2>Les infos utiles, sans jargon</h2></div><span class="estimate-chip">${live ? "ETA recalculée en direct" : "Estimation selon la route"}</span></div>
    <div class="time-board">
      <article><span class="board-dot departure"></span><small>Départ prévu</small><strong>${formatFlightDateTime(active.scheduledDeparture, active.origin?.timeZone)}</strong><p>${escapeHtml(active.origin?.name || "Aéroport de départ non identifié")}</p><em>${escapeHtml(active.origin?.city || "")}${active.origin?.country ? ` · ${escapeHtml(active.origin.country)}` : ""}</em></article>
      <div class="board-journey"><span>${icon("plane", 20)}</span><strong>${formatDuration(active.plannedDurationMinutes)}</strong><small>${Number.isFinite(active.distanceKm) ? `${active.distanceKm.toLocaleString("fr-FR")} km` : "Distance indisponible"}</small></div>
      <article><span class="board-dot arrival"></span><small>${live ? "Arrivée estimée en direct" : "Arrivée estimée"}</small><strong>${formatFlightDateTime(arrival, active.destination?.timeZone)}</strong><p>${escapeHtml(active.destination?.name || "Aéroport d’arrivée non identifié")}</p><em>${escapeHtml(active.destination?.city || "")}${active.destination?.country ? ` · ${escapeHtml(active.destination.country)}` : ""}</em></article>
    </div>
    <div class="live-facts">
      ${fact("Distance restante", Number.isFinite(active.remainingKm) ? `${active.remainingKm.toLocaleString("fr-FR")} km` : "En attente")}
      ${fact("Altitude", position && position.altitude !== "ground" && Number.isFinite(Number(position.altitude)) ? `${Math.round(Number(position.altitude)).toLocaleString("fr-FR")} ft` : position?.altitude === "ground" ? "Au sol" : "En attente")}
      ${fact("Vitesse sol", position && Number.isFinite(Number(position.speed)) ? `${Math.round(Number(position.speed))} kt` : "En attente")}
      ${fact("Cap", position ? headingLabel(Number(position.heading)) : "En attente")}
      ${fact("Avion", position?.aircraftType || "Non communiqué", position?.registration || "")}
      ${fact("Terminal & porte", "Non communiqués", "Source gratuite")}
    </div>
    <p class="facts-note">Les heures sont affichées dans le fuseau de chaque aéroport. Le départ est celui saisi lors de la création. L’arrivée et la durée sont calculées depuis la route ADSBdb${live ? ", puis l’ETA est ajustée avec la position et la vitesse ADS-B" : ""}. Ce ne sont pas des horaires officiels de compagnie.</p>`;
}
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
}
function renderError(message) {
  shell(
    `<main class="error-page"><div>${icon("alert", 46)}</div><h1>Ce voyage a raté sa correspondance.</h1><p>${escapeHtml(message)}</p><a href="/">Créer un nouveau lien</a></main>`,
  );
}

const tripId = new URLSearchParams(location.search).get("trip");
if (tripId) renderTrack(tripId);
else renderCreate();
