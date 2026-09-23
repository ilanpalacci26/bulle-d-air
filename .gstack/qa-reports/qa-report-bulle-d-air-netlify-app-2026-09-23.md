# QA Report — Bulle d’Air

**Date:** 2026-09-23  
**Scope:** notifications push, calcul routier, arrivée, création de voyage, position ADS-B réelle, carte desktop/mobile, présence d’un proche
**Résultat:** 12 réussites, 0 échec, 0 blocage

## Correction issue du test

Le suivi serveur recevait un HTTP 403 d’ADSB.lol car son `User-Agent` était devenu insuffisant. L’erreur était masquée par l’état « Aucune position récente ». La requête s’identifie maintenant avec le nom et l’URL publics de l’application.

## Scénarios validés

| Scénario | Résultat |
|---|---|
| Création d’un lien et génération du mot de passe | Réussi |
| Réglage d’un seuil de retard à 20 min | Réussi |
| Réglage d’une marge de 20 min avant l’arrivée | Réussi |
| Une alerte déjà envoyée ne se répète pas | Réussi |
| Le rappel d’arrivée exige une ETA ADS-B fraîche | Réussi |
| Calcul routier Séoul → ICN : 61 min | Réussi |
| Déclenchement « il faut partir » = route + marge utilisateur | Réussi |
| Notification « l’avion est arrivé » | Réussi |
| Service worker et abonnement push persistant | Réussi |
| Vol réel DL262, JFK → CDG, callsign DAL262 | Réussi |
| Le marqueur avion change de position après le rafraîchissement | Réussi |
| Présence volontaire créée puis supprimée, desktop et mobile sans débordement | Réussi |

## Preuves

- `screenshots/live-tracker.png` — avion et avatar sur la route réelle JFK → CDG.
- `screenshots/live-alerts.png` — panneau des deux alertes personnalisables.
- `npm test`, `npm run build`, test E2E local et test Playwright du vol réel réussis.

## Limite connue et affichée

La durée routière est une estimation OSRM sans trafic automobile en direct. L’heure d’arrivée de l’avion reste une estimation ADS-B et non une donnée officielle de compagnie.
