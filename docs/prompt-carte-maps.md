# Prompt — Composant carte interactive (réutilisable)

Construis un composant carte React réutilisable avec ces fonctionnalités :

## Fonctionnalités

- Affichage carte interactive plein conteneur
- Boutons zoom + / − (natifs Leaflet, en bas à gauche)
- Bouton « Recentrer » sur la position GPS de l'utilisateur (icône LocateFixed)
- Bouton « Vue plan / Vue satellite » (icône Layers) — bascule à chaud sans démonter la carte
- Bouton « Plein écran » (icône Maximize2 / Minimize2) qui élargit la carte sur tout le viewport
- Barre de recherche en haut : adresse, lieu, ou établissement (snack, cinéma, padel, hôtel…)
  - Autocomplete au-delà de 3 caractères, debounce 300 ms
  - Au clic sur un résultat : pose un pin, recadre la carte (flyTo, zoom 16)

## Stack (sans clé API requise)

- React 18 + TypeScript + Next.js (App Router, `"use client"`)
- `leaflet` (import dynamique côté client uniquement, jamais en SSR)
- `lucide-react` pour les icônes
- Tailwind pour le style

## Tuiles

- **Vue plan** : OpenStreetMap par défaut. Si `NEXT_PUBLIC_MAPBOX_TOKEN` est défini, utiliser Mapbox `streets-v12` à la place (rendu plus propre, retina @2x, `tileSize: 512`, `zoomOffset: -1`).
- **Vue satellite** : empile 2 couches →
  - Esri World Imagery en base : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
  - CartoDB Voyager labels-only par-dessus : `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png` (`subdomains: 'abcd'`)
  - Labels blancs lisibles, look Apple Maps, pas de frontières roses.

## Recherche de lieux (sans clé)

- Endpoint Nominatim : `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=<query>`
- Header `Accept-Language: fr` pour résultats francisés
- Respecter la fair-use : 1 requête max par 300 ms (debounce)
- Afficher chaque résultat avec son `display_name` et son type (`amenity`, `shop`, etc.)
- Au clic : `map.flyTo([result.lat, result.lon], 16, { duration: 0.5 })` + ajout d'un marker avec popup

## UI / Style

- Boutons ronds 44×44, fond blanc, ombre douce (`shadow-[0_4px_14px_rgba(0,0,0,0.2)]`), bordure gris clair, `active:scale-95 transition-transform`
- Pile droite, du bas vers le haut : Recentrer → Plein écran → Satellite/Plan
- Barre de recherche : en haut, fond blanc arrondi `rounded-2xl`, ombre, dropdown résultats juste en dessous
- Couleur d'accent du marker utilisateur : bleu `#3B82F6` avec halo de précision GPS (cercle semi-transparent)

## Architecture (1 responsabilité par fichier)

- `MapCard.tsx` — JSX pur, appelle `useMapCard()`
- `useMapCard.ts` — toute la logique (init Leaflet, swap tuiles, recenter, fullscreen, search)
- `tileLayers.ts` — fonction `tilesFor(view: 'street' | 'satellite')` qui renvoie les specs de tuiles
- `useNominatimSearch.ts` — hook debounce + fetch + résultats typés

## Détails techniques importants

- Import Leaflet : `const L = (await import('leaflet')).default` dans un `useEffect` — sinon SSR crash
- Importer le CSS Leaflet une fois au top du composant : `import 'leaflet/dist/leaflet.css'`
- `ResizeObserver` sur le conteneur → `map.invalidateSize()` à chaque resize (sinon zones grises au passage fullscreen)
- Cleanup propre : `map.remove()` + `observer.disconnect()` dans le return du `useEffect`
- Hot-swap des tuiles sans démonter la carte : ajouter les nouvelles couches, attendre 200 ms, retirer les anciennes (évite le flash blanc)
- `attributionControl: false` pour un rendu épuré (mais garde l'attribution OSM/Esri/Carto quelque part — obligation légale)
- Plein écran : état React `fullscreen` qui applique `fixed inset-0 z-50` sur le wrapper

## Props du composant

```ts
interface MapCardProps {
  initialCenter?: { lat: number; lng: number }   // défaut : Paris [48.8566, 2.3522]
  initialZoom?: number                            // défaut : 12
  className?: string
  onLocationSelect?: (loc: { lat: number; lng: number; label: string }) => void
}
```

## Livrables attendus

1. Les 4 fichiers ci-dessus, complets, fonctionnels
2. La liste des dépendances à installer :
   ```bash
   npm i leaflet lucide-react
   npm i -D @types/leaflet
   ```
3. Un exemple d'usage :
   ```tsx
   <MapCard className="w-full h-[600px]" />
   ```
