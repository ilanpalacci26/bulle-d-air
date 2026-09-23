# QA Report — Bulle d’Air

**Date:** 2026-09-23  
**Scope:** notifications, création de voyage, position ADS-B réelle, carte desktop/mobile, présence d’un proche  
**Résultat:** 8 réussites, 0 échec, 0 blocage

## Correction issue du test

Le suivi serveur recevait un HTTP 403 d’ADSB.lol car son `User-Agent` était devenu insuffisant. L’erreur était masquée par l’état « Aucune position récente ». La requête s’identifie maintenant avec le nom et l’URL publics de l’application.

## Scénarios validés

| Scénario | Résultat |
|---|---|
| Création d’un lien et génération du mot de passe | Réussi |
| Réglage d’un seuil de retard à 20 min | Réussi |
| Réglage d’un rappel 60 min avant l’arrivée | Réussi |
| Une alerte déjà envoyée ne se répète pas | Réussi |
| Le rappel d’arrivée exige une ETA ADS-B fraîche | Réussi |
| Vol réel DL262, JFK → CDG, callsign DAL262 | Réussi |
| Le marqueur avion change de position après le rafraîchissement | Réussi |
| Présence volontaire créée puis supprimée, desktop et mobile sans débordement | Réussi |

## Preuves

- `screenshots/live-tracker.png` — avion et avatar sur la route réelle JFK → CDG.
- `screenshots/live-alerts.png` — panneau des deux alertes personnalisables.
- `npm test`, `npm run build`, test E2E local et test Playwright du vol réel réussis.

## Limite connue et affichée

Les notifications du navigateur nécessitent que la page du voyage reste ouverte. Le rappel « il faut partir » est un seuil choisi avant l’arrivée estimée, pas un calcul du temps de trajet routier jusqu’à l’aéroport.
