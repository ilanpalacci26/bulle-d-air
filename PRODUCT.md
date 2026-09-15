# Bulle d’Air

Bulle d’Air permet de créer en une minute un lien éphémère pour suivre un vol avec ses proches.

## Expérience principale

- Le créateur saisit son nom, un ou deux numéros de vol, l’horaire prévu et les voyageurs.
- Chaque voyageur a un emoji, des initiales ou une photo. Les avatars flottent au-dessus de l’avion sur la carte.
- Le lien public affiche la route et anime l’avion. Un signal ADS-B réel est utilisé lorsqu’il est disponible ; sinon l’interface indique clairement qu’il s’agit d’une position horaire estimée.
- Un visiteur peut choisir « Je suis là », donner volontairement sa position, un avatar et un message. Sa présence est mise à jour pendant que la page reste ouverte et peut être supprimée immédiatement.
- Les notifications de retard restent facultatives et demandent l’autorisation du navigateur.

## Données et limites

- Le créateur reçoit un mot de passe généré une seule fois.
- Le voyage, les avatars, les messages et les positions expirent ensemble après 48 heures.
- Au maximum 2 vols, 6 personnes à bord et 30 proches présents sur une carte.
- Les horaires calculés et positions estimées ne sont pas des informations officielles de compagnie ou d’aéroport.

## Sources

ADSBdb fournit la route et les aéroports, ADSB.lol fournit la position reçue des transpondeurs, et Open-Meteo fournit le fuseau horaire. Le service reste fonctionnel en mode estimé lorsqu’une source gratuite est indisponible.
