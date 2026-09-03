---
name: Bulle d’Air
description: Un tableau de vol transforme en jouet pop partageable.
colors:
  violet: "#7957ff"
  pink: "#ff5fb7"
  yellow: "#ffd84d"
  mint: "#66d9b8"
  ink: "#24202d"
  muted: "#6d6877"
  paper: "#fffdf7"
  line: "#ddd7e5"
  surface: "#f6f1ff"
typography:
  display:
    fontFamily: "Bricolage, Segoe UI, sans-serif"
    fontSize: "clamp(3.5rem, 6.5vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Bricolage, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  field: "12px"
  card: "18px"
  map: "24px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "18px"
  lg: "28px"
  xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.violet}"
    textColor: "#ffffff"
    rounded: "{rounded.field}"
    padding: "14px 20px"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 13px"
---

# Design System: Bulle d’Air

## Overview

**Creative North Star: "Le distributeur de capsules aeroportuaire"**

Bulle d’Air reprend la precision d’un tableau de trafic aerien et lui donne le plaisir tactile d’un jouet pop. Les grandes informations restent immediates; la couleur, les bulles de voyageurs et les mondes de carte apportent la surprise sans masquer le statut reel.

**Key Characteristics:**

- Typographie massive et compacte pour la route.
- Papier chaud, encre aubergine et accents francs.
- Profondeur douce, angles genereux et petites formes-jouets.
- Donnees incertaines toujours expliquees en toutes lettres.

## Colors

Le violet porte l’action et la marque; jaune, rose et menthe signalent les moments joyeux sans remplacer les etats fonctionnels. Le papier chaud domine afin que la carte et les avatars restent les objets les plus vivants.

**The Confetti, Not Wallpaper Rule.** Les accents s’emploient en petites zones nettes; les grandes surfaces restent papier ou lavande.

## Typography

**Display Font:** Bricolage Grotesque (avec Segoe UI en repli)  
**Body Font:** Bricolage Grotesque (avec Segoe UI en repli)

La graisse forte fait ressembler les routes a une signaletique d’aeroport contemporaine. Le corps garde une lecture familiere et compacte.

**The Route Is the Hero Rule.** Une route ne concurrence jamais un autre titre de meme poids dans le premier ecran.

## Layout

La creation utilise un ecran scinde jusqu’a 1000 px, puis une seule colonne. Le suivi reserve le maximum de place a une carte encadree, avec les informations de vol au-dessus et un quai de voyageurs en dessous. Les espacements suivent une cadence de 6, 12, 18, 28 et 56 px; le contenu ne depasse pas 1440 px.

## Elevation & Depth

Le systeme combine surfaces tonales et ombres diffuses. Les ombres servent uniquement a soulever les commandes, les bulles et les panneaux flottants au-dessus de la carte.

**The One Lift Rule.** Un element ne cumule jamais contour lourd, ombre dure et halo.

## Shapes

Les champs ont des coins de 12 px, les cartes 18 px, la scene cartographique 24 px et les statuts une forme pilule. Les avatars restent circulaires; chaque univers peut modifier la silhouette de l’avion et des aeroports.

## Components

### Buttons

- **Primary:** violet plein, blanc, graisse forte, angle 12 px et ombre violette diffuse.
- **Focus:** contour violet de 3 px decale de 3 px.
- **Secondary:** papier blanc, trait lavande et aucune ombre permanente.

### Chips

Les vols et statuts sont des pilules courtes. La selection reprend une couleur du theme mais conserve un contraste d’encre.

### Cards / Containers

Les surfaces sont blanches ou lavande pale, avec un contour fin et une ombre ambiante seulement lorsqu’elles flottent.

### Inputs / Fields

Fond blanc, trait lavande et angle 12 px. Le focus combine trait violet et halo translucide de 4 px.

### Flight Map

La carte est la scene signature. Chaque theme change simultanement la route, les marqueurs, l’avion et les ornements; les controles et messages de donnees gardent une grammaire commune.

## Do's and Don'ts

### Do:

- **Do** laisser respirer la route et le statut avant les controles.
- **Do** montrer chaque voyageur comme une bulle distincte.
- **Do** nommer explicitement les estimations et absences de signal.

### Don't:

- **Don't** utiliser des illustrations ou logos officiels des univers cites.
- **Don't** remplacer la hierarchie par une pluie de couleurs.
- **Don't** cacher une information de vol importante dans une animation.
