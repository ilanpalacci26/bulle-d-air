# Bulle d’Air

Bulle d’Air transforme un ou deux numéros de vol en lien public de suivi, actif pendant 48 heures. Le destinataire voit l’avion se déplacer sur une carte mondiale, les voyageurs flotter au-dessus de lui, et peut faire coucou depuis sa propre position.

## Fonctionnalités

- création d’un lien sans compte pour un ou deux vols ;
- résolution des routes et aéroports via ADSBdb ;
- position ADS-B en direct via ADSB.lol lorsqu’elle est disponible ;
- carte plein écran : l’avion apparaît uniquement lorsqu’une position ADS-B récente correspondant au vol est reçue ; aucun déplacement horaire inventé ;
- ETA recalculée pendant le vol et horaires affichés dans le fuseau de chaque aéroport via Open-Meteo ;
- 1 à 6 avatars par emoji, initiales ou photo compressée ;
- partage volontaire et révocable de la position d’un proche, accompagné de son avatar et d’un message ;
- nom d’utilisateur et mot de passe de gestion généré une seule fois ;
- notifications navigateur activées uniquement après consentement, avec seuil réglable de retard et rappel réglable avant l’arrivée ADS-B estimée ;
- expiration stricte à 48 heures et nettoyage horaire ;
- stockage temporaire dans Netlify Blobs.

## Limite importante

Sans clé de fournisseur aérien commercial, le retard, l’arrivée et la durée sont des estimations transparentes : l’application combine l’heure prévue saisie par le créateur, la distance de la route et, en vol, la position et la vitesse ADS-B. Si le signal ADS-B est absent ou ancien, l’avion n’est pas localisé sur la carte et le rappel avant l’arrivée ne se déclenche pas. Ce ne sont pas des informations officielles de compagnie. Les notifications de ce MVP nécessitent que la page reste ouverte.

## Développement

```bash
npm install
npx netlify dev
```

Puis ouvrir `http://localhost:8888`.

## Tests et build

```bash
npm run build
npm run test:e2e
```

Le test de bout en bout suppose que `netlify dev` fonctionne sur le port 8888.

## Déploiement

Le site est en production sur **https://bulle-d-air.netlify.app**.

- Netlify est connecté au repo GitHub `ilanpalacci26/bulle-d-air` : **chaque push sur `main` déclenche automatiquement un build et un déploiement** (commande `npm run build`, dossier publié `dist`, fonctions dans `netlify/functions`).
- Plus besoin de `netlify deploy` manuel : pousser sur `main` suffit.
- Tableau de bord : https://app.netlify.com/projects/bulle-d-air

### État d'avancement (15 septembre 2026)

- MVP complet et déployé : création de lien, carte live MapLibre, télémétrie ADS-B, avatars, partage de position, expiration 48 h.
- Trois fonctions Netlify en production : `trips`, `presences`, `cleanup` (cron horaire).
- Derniers correctifs : badge Netlify ne recouvre plus les actions de la carte ; timing de vol et télémétrie détaillés.
- Le déploiement continu via GitHub a été mis en place le 15 septembre 2026 (clé de déploiement + webhook `api.netlify.com/hooks/github`).

## Données et confidentialité

Les photos sont compressées dans le navigateur avant l’envoi. Un proche déclenche lui-même la permission de localisation et peut arrêter le partage depuis la carte. Les présences expirent avec le voyage. Les mots de passe et clés de présence sont stockés sous forme de condensats SHA-256 et ne sont jamais renvoyés par l’API.

## Licence

Code sous licence MIT. La police Bricolage Grotesque conserve sa licence SIL OFL dans `public/OFL.txt`.
