---
name: Bulle d'Air
description: Un atlas d'aéropostale vivant pour suivre un vol avec ses proches.
colors:
  ink: "#182134"
  paper: "#F7F1DF"
  sky: "#76A8FF"
  coral: "#FF5F57"
  yellow: "#FFD84D"
  mint: "#61D8B3"
  cobalt: "#506DFF"
typography:
  display:
    fontFamily: "Bricolage, Arial, sans-serif"
    fontSize: "clamp(4rem, 8vw, 8.5rem)"
    fontWeight: 800
    lineHeight: 0.82
    letterSpacing: "-0.075em"
  body:
    fontFamily: "Bricolage, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
  label:
    fontFamily: "Bricolage, Arial, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 800
    letterSpacing: "0.045em"
rounded:
  square: "0px"
  message: "12px"
  round: "50%"
  pill: "30px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0 18px 0 24px"
    height: "58px"
  input:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0 14px"
    height: "52px"
---

# Design System: Bulle d'Air

## Overview

**Creative North Star: "L'Atlas d'Aéropostale Vivant"**

Une carte-jouet pop où le papier, les tampons et les objets détourés rendent le suivi aérien immédiat et chaleureux. L'avion est le personnage principal ; les passagers forment un bouquet de bulles au-dessus de lui et les proches deviennent des épingles-portraits au sol.

**Key Characteristics:**

- Carte plein écran avant les données techniques.
- Une action dominante par surface.
- Couleurs franches, trait encre et ombres décalées.
- Mouvement réservé au léger flottement de l'avion.

## Colors

La palette associe un papier crème et une encre bleu nuit à des accents francs de carnet de voyage.

**The Ink Outline Rule.** Les objets interactifs importants portent un trait encre de 2 px ; la couleur ne remplace jamais leur silhouette.

## Typography

**Display Font:** Bricolage Grotesque (Arial fallback)
**Body Font:** Bricolage Grotesque (Arial fallback)

Les titres sont très compacts et expressifs. Dans l'application de suivi, les textes conservent des tailles fixes et lisibles afin que la carte reste stable.

## Layout

La création utilise une grande scène asymétrique puis un formulaire blanc centré. Le suivi est fixé au viewport : carte plein écran, barre de vol en haut, état en bas à gauche et action « Je suis là » en bas à droite. Sous 760 px, le formulaire passe en deux colonnes compactes et la présence devient une feuille remontant du bas.

## Elevation & Depth

Les ombres sont structurelles, opaques et décalées (`4px 5px 0 #182134` en standard). Elles donnent aux éléments le caractère d'autocollants posés sur la carte ; aucune ombre diffuse décorative ni effet de verre.

## Shapes

Les panneaux, champs et boutons principaux restent carrés. Les portraits, le bouton de présence et les marqueurs utilisent le cercle ou la pilule uniquement lorsque leur fonction l'exige.

## Components

### Buttons

Les actions primaires sont corail, carrées, bordées de 2 px et accompagnées d'une ombre encre. Le focus utilise un contour cobalt de 3 px ; l'état actif réduit physiquement l'ombre.

### Inputs / Fields

Fond blanc, hauteur 52 px, bord encre de 2 px et aucun arrondi. Au focus, le bord devient cobalt avec un halo discret.

### Navigation

La barre est une bande de papier compacte avec une marque ronde jaune. Sur la carte, elle flotte à 10–20 px des bords et reste visuellement secondaire au trajet.

### Avion-bouquet

Le marqueur signature associe l'avion corail à des portraits circulaires reliés au-dessus. MapLibre possède toujours le transform du marqueur ; le flottement s'applique uniquement à son enfant pour préserver la position géographique.

## Do's and Don'ts

### Do:

- **Do** laisser la carte dominer l'écran de suivi.
- **Do** étiqueter explicitement une position ou une arrivée estimée.
- **Do** conserver une seule action corail dominante.

### Don't:

- **Don't** transformer l'expérience en tableau de bord ou en grille de cartes.
- **Don't** employer de verre, de dégradé décoratif ou de texte en dégradé.
- **Don't** animer le transform du marqueur MapLibre lui-même.
