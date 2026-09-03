# Bulle d’Air

Bulle d’Air transforme un ou deux numéros de vol en lien public de suivi, actif pendant 48 heures. Le destinataire voit la route sur une carte mondiale, les voyageurs sous forme de petites bulles et peut demander une notification navigateur si un retard est estimé.

## Fonctionnalités

- création d’un lien sans compte pour un ou deux vols ;
- résolution des routes et aéroports via ADSBdb ;
- position ADS-B en direct via ADSB.lol lorsqu’elle est disponible ;
- cartes Minecraft, Super Mario, Pokémon et LEGO sous forme d’univers visuels originaux non officiels ;
- 1 à 8 avatars par emoji, initiales ou photo compressée ;
- nom d’utilisateur et mot de passe de gestion généré une seule fois ;
- notifications navigateur activées uniquement après consentement ;
- expiration stricte à 48 heures et nettoyage horaire ;
- stockage temporaire dans Netlify Blobs.

## Limite importante

Sans clé de fournisseur aérien commercial, le retard est une estimation transparente : l’application compare l’heure prévue saisie par le créateur et la présence d’un signal ADS-B en vol. Ce n’est pas un statut officiel de compagnie. Les notifications de ce MVP nécessitent que la page reste ouverte.

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

## Données et confidentialité

Les photos sont compressées dans le navigateur avant l’envoi. Le voyage complet, photos incluses, est supprimé à l’expiration. Les mots de passe sont stockés sous forme de condensat SHA-256 salé par l’identifiant du voyage et ne sont jamais renvoyés par l’API.

## Licence

Code sous licence MIT. La police Bricolage Grotesque conserve sa licence SIL OFL dans `public/OFL.txt`.
