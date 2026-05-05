import { ImageResponse } from 'next/og'
import { fetchPublicMission } from '@/services/publicMissionService'
import { computeDisplayFare } from '@/lib/missionFare'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Ctx { params: { id: string } }

function dt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
}

/**
 * Génère l'image partagée (Open Graph) pour /c/[id]. WhatsApp/Messenger/SMS
 * la pré-affichent automatiquement dès que le lien est posté dans une conv.
 *
 * Format : 1200×630 (standard OG). Fond crème, accent jaune brand, typo
 * Inter (système). Affiche : route, date/heure, prix, badge type.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const m = await fetchPublicMission(params.id)
  if (!m) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5EF', color: '#1A1A1A', fontSize: 48, fontWeight: 800 }}>
          Course introuvable
        </div>
      ),
      { width: 1200, height: 630 },
    )
  }

  const isCpam = m.type === 'CPAM'
  const fare = computeDisplayFare(m)
  const price = fare.value > 0 ? `${fare.value.toFixed(0)} €` : '—'
  const date = dt(m.scheduled_at)
  const distance = m.distance_km != null ? `${m.distance_km.toFixed(1).replace('.', ',')} km` : '—'
  const duration = m.duration_min != null ? `${Math.round(m.duration_min)} min` : null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          background: '#F7F5EF',
          padding: '56px 64px',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Inter, sans-serif',
          color: '#1A1A1A',
          position: 'relative',
        }}
      >
        {/* Glow brand en haut à droite */}
        <div style={{ position: 'absolute', top: -180, right: -180, width: 480, height: 480, borderRadius: 9999, background: '#FFD11A', opacity: 0.35, display: 'flex' }} />

        {/* Header logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span>Taxi</span>
            <span style={{ color: '#FFD11A', margin: '0 6px' }}>·</span>
            <span>Link</span>
          </div>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 18px', borderRadius: 9999,
              background: isCpam ? '#FEE2E2' : '#1A1A1A',
              color: isCpam ? '#DC2626' : '#FFFFFF',
              fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 9999, background: isCpam ? '#DC2626' : '#FFD11A', display: 'flex' }} />
            {isCpam ? 'CPAM' : 'Privé'}{m.return_trip ? ' · A/R' : ''}
          </div>
        </div>

        {/* Eyebrow */}
        <div style={{ display: 'flex', marginTop: 56, fontSize: 18, fontWeight: 700, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Course taxi disponible
        </div>

        {/* Route */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14, fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.025em' }}>
          <span style={{ display: 'flex' }}>{m.departure}</span>
          <span style={{ display: 'flex', color: '#D3D1C7', fontWeight: 700, fontSize: 36, margin: '4px 0' }}>↓</span>
          <span style={{ display: 'flex' }}>{m.destination}</span>
        </div>

        {/* Footer card */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Quand</span>
            <span style={{ fontSize: 26, fontWeight: 700, marginTop: 6, textTransform: 'capitalize', display: 'flex' }}>{date}</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#5F5E5A', marginTop: 4, display: 'flex' }}>
              {distance}{duration ? ` · ${duration}` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Prix</span>
            <span style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', marginTop: 4 }}>{price}</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
