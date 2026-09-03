# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Vite frontend, MapLibre GL map, Netlify Functions, and Netlify Blobs

## Users

- A traveler or organizer creates a temporary public tracking link for friends and family.
- A recipient opens the link to follow one traveler group without creating an account.

## Product Purpose

Turn a flight number into a friendly shared tracking page with live aircraft position when ADS-B coverage is available, route context, optional delay notifications, and playful passenger representations.

## Positioning

Flight tracking is presented as a shared social moment: the aircraft carries visible passenger bubbles, and each viewer can choose a familiar playful map theme.

## Operating Context

The creator enters one flight or two connecting flights, a planned departure date and time, a username, and traveler avatars. The recipient receives a public link, can opt into browser notifications, and watches the active leg on a world map.

## Capabilities and Constraints

- Flight lookup starts from an IATA or ICAO flight number.
- ADSBdb resolves route and airport information; ADSB.lol supplies public live ADS-B position when available.
- Delay without a commercial status provider is explicitly labeled as an estimate based on the planned departure time and absence of a live airborne signal.
- Links expire 48 hours after creation and are deleted lazily on access plus by an hourly cleanup function.
- One or two flight legs are supported.
- One to eight traveler avatars support emoji, initials, or a compressed photo.
- The creator chooses a username and receives a generated password once; credentials authorize later theme changes.
- The public tracking page asks before enabling browser notifications. Notifications require the page to remain open in this MVP.
- No airline, game, toy, or entertainment brand endorses the app.

## Brand Commitments

- Product name: Bulle d’Air.
- Pop, modern, playful, optimistic, and clear in French.
- Four optional map themes: Minecraft, Super Mario, Pokémon, and LEGO, expressed through original color and shape systems without copyrighted character art.

## Evidence on Hand

- ADSBdb public callsign route endpoint was verified with AF123.
- ADSB.lol public callsign and geographic endpoints were verified live.
- No paid aviation API key is available; official airline delay claims must not be fabricated.

## Product Principles

- Shared-link recipients get value without an account.
- Live data uncertainty is visible, never disguised.
- Permission prompts follow an explicit user action.
- Personal photos remain attached only to the temporary 48-hour link.
- The playful visual layer never obscures flight status or route information.

## Accessibility & Inclusion

Keyboard navigation, visible focus, reduced-motion support, sufficient contrast, meaningful status text, and non-color-only status cues are required.
