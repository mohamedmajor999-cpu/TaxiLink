import L from 'leaflet'

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
