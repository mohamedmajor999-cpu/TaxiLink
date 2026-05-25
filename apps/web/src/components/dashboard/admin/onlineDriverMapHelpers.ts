import L from 'leaflet'

// Pin chauffeur avec chrono : couleur + badge "Xs" indiquant le temps depuis
// le dernier fix GPS. Permet a l'admin de voir D'UN COUP D'OEIL si chaque
// chauffeur est frais (vert <15s) ou bloque (rouge >60s = service GPS coupe).
// Demande user 2026-05-25.
//
// 4 paliers :
//   < 15s  : vert  (cadence GPS attendue ~10s, on tolere 5s de marge)
//   < 30s  : jaune (signal en retard mais OK)
//   < 60s  : orange (suspect, l'optim batterie commence peut-etre a couper)
//   >= 60s : rouge (probablement plus en ligne, le tel a coupe le service)
function pickPinColors(ageSec: number): { bg: string; border: string; label: string } {
  if (ageSec < 15) {
    return { bg: '#10B981', border: '#064E3B', label: `${ageSec}s` }
  }
  if (ageSec < 30) {
    return { bg: '#FACC15', border: '#854D0E', label: `${ageSec}s` }
  }
  if (ageSec < 60) {
    return { bg: '#F97316', border: '#9A3412', label: `${ageSec}s` }
  }
  // > 1 min : affiche en minutes, max 99 pour eviter overflow visuel.
  const min = Math.min(99, Math.floor(ageSec / 60))
  return { bg: '#EF4444', border: '#7F1D1D', label: `${min}m` }
}

/**
 * Cree un divIcon Leaflet avec un cercle colore + badge chrono.
 *
 * @param updatedAtIso ISO timestamp du dernier fix GPS (current_position_updated_at).
 * @param nowMs Timestamp courant (Date.now()) — passe en parametre pour que la
 *   fonction reste pure et que le tick d'horloge se fasse cote consommateur.
 */
export function buildDriverIcon(updatedAtIso: string, nowMs: number): L.DivIcon {
  const ageSec = Math.max(0, Math.floor((nowMs - new Date(updatedAtIso).getTime()) / 1000))
  const { bg, border, label } = pickPinColors(ageSec)
  const html = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:18px;height:18px;border-radius:50%;
        background:${bg};border:3px solid ${border};
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
      "></div>
      <div style="
        margin-top:2px;padding:1px 5px;border-radius:8px;
        background:${border};color:#fff;font-size:9px;font-weight:800;
        font-family:Inter,sans-serif;letter-spacing:-0.2px;
        white-space:nowrap;
      ">${label}</div>
    </div>
  `
  return L.divIcon({
    className: 'admin-driver-pin',
    html,
    iconSize: [40, 36],
    iconAnchor: [20, 9],
  })
}

// Conserve pour retro-compat (au cas ou un consommateur l'importerait sans
// chrono). N'est plus utilise par useOnlineDriversMap.
export const driverIcon = L.divIcon({
  className: 'admin-driver-pin',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#FFD11A;border:3px solid #0A0A0A;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c))
}

export function formatRelative(iso: string): string {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSec < 60) return `il y a ${diffSec}s`
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`
  return `il y a ${Math.floor(diffSec / 3600)} h`
}

export function driverPopupHtml(name: string, phone: string | null, updatedAt: string): string {
  const phoneLine = phone ? `<br/><a href="tel:${phone}" style="color:#3B82F6">${escapeHtml(phone)}</a>` : ''
  return `<div style="font-family:Inter,sans-serif"><strong>${escapeHtml(name)}</strong>${phoneLine}<br/><small style="color:#6b7280">Mis à jour: ${formatRelative(updatedAt)}</small></div>`
}
