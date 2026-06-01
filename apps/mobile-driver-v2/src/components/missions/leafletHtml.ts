// HTML embarqué dans la WebView pour rendre une carte Leaflet.
// Supporte light + dark Tesla Driver Display dans le meme HTML : le toggle
// est instantane via tlSetTheme(isDark) — pas de reload de Leaflet, pas de
// retiles complete (seul le tile layer streets est swappe).
//
// - streets light  : Mapbox streets-v12 retina @2x (PWA-faithful)
// - streets dark   : Mapbox dark-v11 retina @2x (Tesla Driver Display)
// - satellite      : Mapbox satellite-streets-v12 (commun aux 2 modes)
// - OSM fallback   : si pas de token Mapbox (degrade les 2 modes)

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

interface BuildLeafletHtmlOptions {
  mapboxToken?: string;
  // Centre initial : derniere coord connue (useGpsStore.coords) ou null
  // pour fallback "France entiere zoom 5".
  initial?: { lat: number; lng: number; zoom?: number } | null;
  // Mode sombre actif au mount. Apres le mount, utiliser tlSetTheme via
  // injectJavaScript pour basculer sans reload de la WebView.
  isDark?: boolean;
}

export function buildLeafletHtml({
  mapboxToken,
  initial,
  isDark = false,
}: BuildLeafletHtmlOptions): string {
  // 4 URLs de tuiles. Tous Mapbox @2x retina si token, sinon OSM en fallback
  // (qui ne distingue pas light/dark — on garde OSM dans les deux cas).
  const streetsLightUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
    : OSM_URL;
  // navigation-night-v1 : style optimise conduite de nuit (Mapbox), plus
  // lumineux et lisible que dark-v11. Routes secondaires visibles, noms
  // de villes/quartiers nets.
  const streetsDarkUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
    : OSM_URL;
  const satelliteUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
    : OSM_URL;
  const streetsOpts = mapboxToken
    ? "{ maxZoom: 19, tileSize: 512, zoomOffset: -1 }"
    : "{ maxZoom: 19 }";
  const satelliteOpts = "{ maxZoom: 19 }";

  const initLat = initial?.lat ?? 46.6;
  const initLng = initial?.lng ?? 2.4;
  const initZoom = initial?.zoom ?? (initial ? 12 : 5);
  const bodyClass = isDark ? 'dark' : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
    body { background: #F8F9FA; transition: background 200ms ease-out; }
    body.dark { background: #2A2F38; }

    /* Filtre tuiles : punch en clair. En dark on touche peu — le style
       navigation-night-v1 a deja le bon contraste. Juste un brightness
       1.1 pour reduire l'ecart avec le fond app et eviter le "trou noir". */
    .leaflet-tile-pane { filter: saturate(1.3) contrast(1.15) brightness(0.95); }
    body.dark .leaflet-tile-pane { filter: saturate(1.05) brightness(1.1); }

    /* Pin user — cercle JAUNE brand avec halo qui pulse lentement (3s) pour
       identifier ta position d'un coup d'œil sans clignotement épileptique.
       Inner dot fait aussi un breathing 1→0.7→1 sur 2s, doux. */
    .user-pin {
      width: 16px; height: 16px; border-radius: 9999px;
      background: #FFD11A; border: 2.5px solid #1A1A1A;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.3);
      position: relative;
      animation: userDotBlink 2s ease-in-out infinite;
    }
    .user-pin::before {
      content: ''; position: absolute; inset: -14px; border-radius: 9999px;
      background: rgba(255, 209, 26, 0.30);
      animation: userPulse 3s ease-out infinite;
    }
    @keyframes userPulse {
      0%   { transform: scale(0.6); opacity: 0.7; }
      100% { transform: scale(2.2); opacity: 0;   }
    }
    @keyframes userDotBlink {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.65; }
    }

    /* Pin mission — copie fidele PWA en clair, surface elevated en dark. */
    .mission-pin {
      position: relative;
      background: #fff; border: 2px solid #1A1A1A; border-radius: 999px;
      padding: 5px 10px 5px 4px;
      font-size: 12px; font-weight: 800; color: #1A1A1A;
      display: inline-flex; align-items: center; gap: 5px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      white-space: nowrap;
      transform: translate(-50%, calc(-100% - 8px));
      transform-origin: 50% calc(100% + 8px);
      transition: background 200ms ease-out, border-color 200ms ease-out, color 200ms ease-out;
    }
    body.dark .mission-pin {
      background: #434957; border-color: #FFFFFF; color: #FFFFFF;
      box-shadow: 0 4px 14px rgba(0,0,0,0.5);
    }
    .mission-pin::after {
      content: ''; position: absolute; bottom: -6px; left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 8px; height: 8px; background: #fff;
      border-right: 2px solid #1A1A1A; border-bottom: 2px solid #1A1A1A;
      transition: background 200ms ease-out, border-color 200ms ease-out;
    }
    body.dark .mission-pin::after {
      background: #434957;
      border-right-color: #FFFFFF; border-bottom-color: #FFFFFF;
    }
    /* Selected : brand jaune (#FFD11A) en mode clair, brand bleu (#3B82F6)
       en mode sombre pour matcher le bascule jaune→bleu du thème global. */
    .mission-pin.selected {
      background: #FFD11A; color: #1A1A1A;
      border-color: #1A1A1A;
      transform: translate(-50%, calc(-100% - 8px)) scale(1.1);
      z-index: 10;
    }
    .mission-pin.selected::after {
      background: #FFD11A;
      border-right-color: #1A1A1A; border-bottom-color: #1A1A1A;
    }
    body.dark .mission-pin.selected {
      background: #3B82F6; color: #FFFFFF;
      border-color: #FFFFFF;
    }
    body.dark .mission-pin.selected::after {
      background: #3B82F6;
      border-right-color: #FFFFFF; border-bottom-color: #FFFFFF;
    }

    .mission-pin.urgent::before {
      content: ''; position: absolute; top: -4px; right: -4px;
      width: 11px; height: 11px; background: #FFD11A;
      border: 1.5px solid #1A1A1A; border-radius: 50%; z-index: 2;
    }
    body.dark .mission-pin.urgent::before {
      background: #3B82F6;
      border-color: #FFFFFF;
    }
    .mission-pin .mp-rx {
      width: 18px; height: 18px; border-radius: 50%; color: #FFFFFF;
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.25);
    }
    .mission-pin .mp-rx svg { display: block; }
    .mission-pin.medical .mp-rx {
      background: linear-gradient(180deg, #F87171 0%, #DC2626 100%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.10), 0 1px 2px rgba(220,38,38,0.40);
    }
    .mission-pin.private .mp-rx {
      background: linear-gradient(180deg, #60A5FA 0%, #2563EB 100%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.10), 0 1px 2px rgba(37,99,235,0.40);
    }
    .mission-pin.medical.selected .mp-rx {
      background: linear-gradient(180deg, #FFFFFF 0%, #FEE2E2 100%); color: #DC2626;
    }
    .mission-pin.private.selected .mp-rx {
      background: linear-gradient(180deg, #FFFFFF 0%, #DBEAFE 100%); color: #2563EB;
    }
    .leaflet-div-icon { background: transparent; border: none; }

    /* ================================================================
     * Cluster d'offres (style Apple) — sphère blanche avec compteur.
     * Apparaît au dézoom, éclate au clic en pins prix individuels.
     * Tailles : default <10, .lg <50, .xl 50+.
     * Identique au pattern PWA (cf. apps/web/src/app/globals.css L254).
     * ================================================================ */
    .mission-cluster {
      width: 44px; height: 44px;
      border-radius: 9999px;
      background: radial-gradient(circle at 32% 28%, #FFFFFF 0%, #F5F5F5 100%);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 14px; letter-spacing: -0.01em;
      color: #1A1A1A;
      box-shadow:
        0 0 0 0.5px rgba(10,10,10,0.14),
        inset 0 1px 0 rgba(255,255,255,0.9),
        inset 0 -1px 0 rgba(0,0,0,0.06),
        0 4px 12px -2px rgba(0,0,0,0.18),
        0 16px 32px -10px rgba(0,0,0,0.20);
    }
    .mission-cluster.lg { width: 56px; height: 56px; font-size: 16px; }
    .mission-cluster.xl { width: 68px; height: 68px; font-size: 18px; }

    /* En dark : sphère gris-bleu surfaceElevated + texte blanc, halo plus
       prononcé pour contraster sur le tile sombre Mapbox nuit. */
    body.dark .mission-cluster {
      background: radial-gradient(circle at 32% 28%, #5A6173 0%, #434957 100%);
      color: #FFFFFF;
      box-shadow:
        0 0 0 0.5px rgba(255,255,255,0.18),
        inset 0 1px 0 rgba(255,255,255,0.18),
        inset 0 -1px 0 rgba(0,0,0,0.25),
        0 4px 12px -2px rgba(0,0,0,0.5),
        0 16px 32px -10px rgba(0,0,0,0.6);
    }

    /* Override des defaults markercluster (cercle bleu + label texte) — on
       n'utilise que notre divIcon custom .mission-cluster. */
    .marker-cluster, .marker-cluster div { background: transparent !important; }
    .marker-cluster span { display: none; }
  </style>
</head>
<body class="${bodyClass}">
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${initLat}, ${initLng}], ${initZoom});

    // 4 URLs : streets light/dark + satellite (commun) + OSM fallback
    // (utilise pour les 2 modes streets quand pas de token Mapbox).
    const TILES = {
      streetsLight: { url: '${streetsLightUrl}', opts: ${streetsOpts} },
      streetsDark:  { url: '${streetsDarkUrl}',  opts: ${streetsOpts} },
      satellite:    { url: '${satelliteUrl}',    opts: ${satelliteOpts} },
    };

    // L'etat du style courant : 'streets' ou 'satellite'. Combine avec
    // body.dark pour resoudre le bon tile layer dans TILES.
    let currentStyle = 'streets';
    let currentIsDark = ${isDark ? 'true' : 'false'};
    function streetsKey() { return currentIsDark ? 'streetsDark' : 'streetsLight'; }
    function activeTileSpec() {
      return currentStyle === 'satellite' ? TILES.satellite : TILES[streetsKey()];
    }
    let tileLayer = L.tileLayer(activeTileSpec().url, activeTileSpec().opts).addTo(map);

    function swapTileLayer() {
      const spec = activeTileSpec();
      if (tileLayer) map.removeLayer(tileLayer);
      tileLayer = L.tileLayer(spec.url, spec.opts).addTo(map);
    }

    let userMarker = null;
    // Pin user : div avec la classe CSS .user-pin (jaune brand + halo qui pulse
    // lentement + dot qui breathing). Wrapper transparent pour ne pas couper
    // le halo qui dépasse de 14px sur chaque côté (donc iconSize 44, anchor 22).
    const userPinHtml = '<div class="user-pin"></div>';
    const userIcon = L.divIcon({ className: '', html: userPinHtml, iconSize: [44, 44], iconAnchor: [22, 22] });

    // Clustering grid-based maison (zéro dépendance externe — leaflet.markercluster
    // via CDN bloquait la WebView quand le réseau était lent/filtré).
    // À chaque update OU mouvement de carte, on projette chaque mission en
    // coords pixel au zoom courant, on les groupe par cellule de 35×35 px
    // (= maxClusterRadius PWA leaflet.markercluster pour matcher le rendu).
    // Cellule avec ≥ 2 missions → 1 sphère "mission-cluster" avec compteur,
    // clic = zoom auto sur les missions du cluster. Sinon → pin individuel.
    const CLUSTER_CELL_PX = 35;
    const missionsData = new Map(); // id → { lat, lng, m (raw data) } — coords OFFSETÉES
    const visibleLayers = []; // layers actuellement sur la carte (markers + clusters)

    // Offset circulaire pour adresses identiques (port PWA markerOffset.ts) :
    // quand N missions partagent la même coord à ~1m près (hôpital, clinique…),
    // on les place sur un cercle de ~39m autour du point pour qu'elles soient
    // visibles individuellement après dézoom au lieu de se superposer.
    const COORD_PRECISION = 5;     // ~1m en degrés
    const RADIUS_DEG_LAT = 0.00035; // ~39m, séparation visible dès zoom 13
    const DEG_RAD = Math.PI / 180;
    function computeOffsetedPositions(rawList) {
      const groups = new Map();
      for (const m of rawList) {
        if (typeof m.lat !== 'number' || typeof m.lng !== 'number') continue;
        const key = m.lat.toFixed(COORD_PRECISION) + '|' + m.lng.toFixed(COORD_PRECISION);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(m);
      }
      const out = new Map();
      groups.forEach(function (arr) {
        if (arr.length === 1) {
          const m = arr[0];
          out.set(m.id, { lat: m.lat, lng: m.lng });
          return;
        }
        // Tri par id pour stabilité (mêmes pins → mêmes places à chaque update)
        const sorted = arr.slice().sort(function (a, b) { return String(a.id).localeCompare(String(b.id)); });
        const lat0 = sorted[0].lat;
        const lng0 = sorted[0].lng;
        const lngScale = 1 / Math.max(0.01, Math.cos(lat0 * DEG_RAD));
        sorted.forEach(function (m, i) {
          const a = (2 * Math.PI * i) / sorted.length;
          out.set(m.id, {
            lat: lat0 + RADIUS_DEG_LAT * Math.sin(a),
            lng: lng0 + RADIUS_DEG_LAT * Math.cos(a) * lngScale,
          });
        });
      });
      return out;
    }

    function clearLayers() {
      for (const lyr of visibleLayers) map.removeLayer(lyr);
      visibleLayers.length = 0;
    }

    function makeClusterIcon(count) {
      const sizeClass = count < 10 ? '' : count < 50 ? 'lg' : 'xl';
      const size = count < 10 ? 44 : count < 50 ? 56 : 68;
      return L.divIcon({
        className: '',
        html: '<div class="mission-cluster ' + sizeClass + '">' + count + '</div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }

    // Décale une coord lat/lng UNIQUEMENT si elle chevauche visuellement le
    // pin user ET qu'elle est physiquement très proche (< 50 m au sol).
    // Le test pixel seul est trompeur : en dézoom, 30 px = plusieurs km au
    // sol → on aurait poussé des bulles à des km de leur vrai lieu.
    // La double-condition garantit que le décalage ne sert que pour la
    // cliquabilité quand mission et user sont vraiment au même endroit.
    function offsetIfOverlapsUser(lat, lng, minDistPx) {
      if (!userMarker) return { lat: lat, lng: lng };
      const userLL = userMarker.getLatLng();
      // Garde-fou géographique : si la mission est à > 50 m du user au sol,
      // on n'y touche pas, peu importe le chevauchement pixel.
      const realDistM = map.distance([lat, lng], userLL);
      if (realDistM > 50) return { lat: lat, lng: lng };
      const zoom = map.getZoom();
      const userPt = map.project(userLL, zoom);
      const myPt = map.project([lat, lng], zoom);
      const dx = myPt.x - userPt.x;
      const dy = myPt.y - userPt.y;
      const distSq = dx * dx + dy * dy;
      if (distSq >= minDistPx * minDistPx) return { lat: lat, lng: lng };
      // Direction de poussée : si déjà non-coïncidente, on prolonge le vecteur
      // (user → cluster) jusqu'à atteindre minDistPx. Si coïncidente (dist ≈ 0),
      // direction NE par défaut (vecteur (1, -1) normalisé).
      let ux, uy;
      if (distSq < 0.5) {
        ux = 1 / Math.SQRT2; uy = -1 / Math.SQRT2;
      } else {
        const dist = Math.sqrt(distSq);
        ux = dx / dist; uy = dy / dist;
      }
      const shifted = L.point(userPt.x + ux * minDistPx, userPt.y + uy * minDistPx);
      const ll = map.unproject(shifted, zoom);
      return { lat: ll.lat, lng: ll.lng };
    }

    function rebuildClusters() {
      clearLayers();
      if (missionsData.size === 0) return;
      const zoom = map.getZoom();
      // Grouper par cellule de grille en coords pixel projetées.
      const cells = new Map();
      missionsData.forEach(function (data, id) {
        const pt = map.project([data.lat, data.lng], zoom);
        const cx = Math.floor(pt.x / CLUSTER_CELL_PX);
        const cy = Math.floor(pt.y / CLUSTER_CELL_PX);
        const key = cx + ',' + cy;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push({ id: id, data: data });
      });
      cells.forEach(function (items) {
        if (items.length === 1) {
          // Pin individuel — poussé du minimum pour ne pas chevaucher le pin
          // user (rayon halo ~14 + rayon pin mission ~12 + 4 marge = 30 px).
          const it = items[0];
          const pos = offsetIfOverlapsUser(it.data.lat, it.data.lng, 30);
          const marker = L.marker([pos.lat, pos.lng], {
            icon: buildMissionIcon(it.data.m),
            zIndexOffset: 1500,
          }).addTo(map);
          marker.on('click', function () { post({ type: 'selectMission', id: it.id }); });
          visibleLayers.push(marker);
        } else {
          // Cluster : sphère poussée du minimum pour ne pas chevaucher le pin
          // user (rayon halo ~14 + demi-sphère 22 + 4 marge = 40 px center-to-center).
          let sumLat = 0, sumLng = 0;
          for (const it of items) { sumLat += it.data.lat; sumLng += it.data.lng; }
          const clat = sumLat / items.length;
          const clng = sumLng / items.length;
          const pos = offsetIfOverlapsUser(clat, clng, 40);
          const cluster = L.marker([pos.lat, pos.lng], {
            icon: makeClusterIcon(items.length),
            zIndexOffset: 2000,
          }).addTo(map);
          // Au clic : zoom auto sur les bounds englobant les missions du cluster
          cluster.on('click', function () {
            const bounds = L.latLngBounds(items.map(function (it) { return [it.data.lat, it.data.lng]; }));
            map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 17, duration: 0.5 });
          });
          visibleLayers.push(cluster);
        }
      });
    }

    // Recompute clusters au zoom + après chaque mouvement (les cellules pixel
    // changent → groupement différent).
    map.on('zoomend', rebuildClusters);
    map.on('moveend', rebuildClusters);

    function post(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    const MEDICAL_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">'
      + '<path d="M4 4h5v6h6V4h5v16h-5v-6H9v6H4V4z" fill="currentColor"/></svg>';
    const PRIVATE_SVG = '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">'
      + '<circle cx="6" cy="3.4" r="1.8" fill="currentColor"/>'
      + '<path d="M2.2 10.2c0-2.1 1.7-3.8 3.8-3.8s3.8 1.7 3.8 3.8v0.3H2.2v-0.3z" fill="currentColor"/></svg>';

    function buildMissionIcon(m) {
      const variant = m.medical ? 'medical' : 'private';
      const classes = ['mission-pin', variant];
      if (m.urgent) classes.push('urgent');
      if (m.selected) classes.push('selected');
      const icon = m.medical ? MEDICAL_SVG : PRIVATE_SVG;
      const badge = '<span class="mp-rx">' + icon + '</span>';
      return L.divIcon({
        className: '',
        html: '<div class="' + classes.join(' ') + '">' + badge + '<span class="mp-price">' + (m.priceLabel || '') + '</span></div>',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
    }

    // Exposed pour injectJavaScript depuis React Native.
    window.tlPanTo = function (lat, lng, zoom) {
      map.flyTo([lat, lng], zoom || 15, { duration: 0.5 });
    };
    window.tlZoomIn = function () { map.zoomIn(); };
    window.tlZoomOut = function () { map.zoomOut(); };
    window.tlSetMapStyle = function (style) {
      // style: 'streets' | 'satellite'
      if (style !== 'streets' && style !== 'satellite') return;
      currentStyle = style;
      swapTileLayer();
    };
    // Toggle Tesla Driver Display : swap CSS body + tile layer streets dark/light.
    // Appele depuis MissionMap quand useTheme().isDark change.
    window.tlSetTheme = function (isDark) {
      currentIsDark = !!isDark;
      document.body.classList.toggle('dark', currentIsDark);
      if (currentStyle === 'streets') swapTileLayer();
    };
    window.tlSetUserPosition = function (lat, lng) {
      try {
        if (userMarker) {
          userMarker.setLatLng([lat, lng]);
        } else {
          userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        }
        // Recompute clusters → si un pin/sphère se trouve maintenant sous le
        // user, il sera décalé en NE (offsetIfOverlapsUser).
        rebuildClusters();
        post({ type: 'userPin', ok: true, lat: lat, lng: lng });
      } catch (e) {
        post({ type: 'userPin', ok: false, err: String(e) });
      }
    };
    // Queue pour rattraper les calls qui arrivent AVANT map.whenReady.
    // Sur Pixel 10 Pro le WebView peut emit le 'ready' tres vite mais avoir
    // un Leaflet pas encore stabilise — sans queue, le 1er setMissions throw
    // sur map.getZoom() et les pins restent invisibles jusqu'a la prochaine
    // mise a jour.
    let mapReady = false;
    let pendingMissionsJson = null;
    window.tlSetMissions = function (json) {
      try {
        if (typeof json !== 'string') return;
        if (!mapReady) { pendingMissionsJson = json; return; }
        const list = JSON.parse(json);
        const seen = new Set();
        // Calcule les positions offsetées (cercle autour du point pour adresses
        // identiques) AVANT de stocker. Sinon 2 courses au même hôpital se
        // superposent et restent inaccessibles même au zoom max.
        const positions = computeOffsetedPositions(list);
        for (const m of list) {
          if (typeof m.lat !== 'number' || typeof m.lng !== 'number') continue;
          const pos = positions.get(m.id) || { lat: m.lat, lng: m.lng };
          seen.add(m.id);
          missionsData.set(m.id, { lat: pos.lat, lng: pos.lng, m: m });
        }
        missionsData.forEach(function (_, id) {
          if (!seen.has(id)) missionsData.delete(id);
        });
        rebuildClusters();
      } catch (e) {
        post({ type: 'missionError', err: String(e) });
      }
    };

    map.whenReady(() => {
      mapReady = true;
      // Flush la queue si tlSetMissions a ete appelee avant le ready.
      if (pendingMissionsJson) {
        const json = pendingMissionsJson;
        pendingMissionsJson = null;
        window.tlSetMissions(json);
      }
      post({ type: 'ready' });
    });
  </script>
</body>
</html>`;
}
