'use client'
import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { patronDriverDetailService, type DriverDetail } from '@/services/patronDriverDetailService'
import { organizationService } from '@/services/organizationService'

interface Props {
  driverId: string | null
  orgId: string | null
  canManage: boolean
  onClose: () => void
}

export function DriverDetailDrawer({ driverId, orgId, canManage, onClose }: Props) {
  const [detail, setDetail] = useState<DriverDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!driverId) {
      setDetail(null)
      return
    }
    setLoading(true)
    patronDriverDetailService
      .getDriverDetail(driverId, orgId)
      .then(setDetail)
      .finally(() => setLoading(false))
  }, [driverId, orgId])

  if (!driverId) return null

  const handleRemove = async () => {
    if (!orgId || !detail) return
    if (!confirm(`Retirer ${detail.name} de votre flotte ?`)) return
    try {
      await organizationService.removeMember(orgId, detail.id)
      onClose()
    } catch (e) {
      alert(`Erreur : ${(e as Error).message}`)
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex justify-end bg-ink/50 backdrop-blur-sm" onClick={onClose}>
      <aside className="w-full max-w-md h-full bg-paper dark:bg-night-surface overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-warm-200 dark:border-night-border flex items-center justify-between">
          <h2 className="text-base font-extrabold text-ink dark:text-night-text">Fiche chauffeur</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-warm-100 dark:hover:bg-night-elevated">
            <Icon name="close" size={20} />
          </button>
        </div>

        {loading && <p className="px-6 py-12 text-sm text-warm-600 dark:text-night-text-soft text-center">Chargement…</p>}

        {detail && !loading && (
          <div className="px-6 py-5 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-full bg-warm-200 dark:bg-night-elevated flex items-center justify-center text-base font-extrabold text-ink dark:text-night-text">
                {detail.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-extrabold text-ink dark:text-night-text truncate">{detail.name}</h3>
                <p className="text-xs text-warm-600 dark:text-night-text-soft mt-0.5">
                  {detail.is_online ? '🟢 En ligne' : '⚪ Hors ligne'} · ⭐ {detail.rating.toFixed(1)} · {detail.total_rides} courses
                </p>
              </div>
            </div>

            {(detail.phone || detail.email) && (
              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-warm-600 dark:text-night-text-soft mb-2">Contact</h4>
                <div className="space-y-1">
                  {detail.phone && (
                    <a href={`tel:${detail.phone}`} className="flex items-center gap-2 text-sm text-ink dark:text-night-text hover:underline">
                      <Icon name="call" size={16} /> {detail.phone}
                    </a>
                  )}
                </div>
              </section>
            )}

            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-warm-600 dark:text-night-text-soft mb-2">Véhicule</h4>
              <p className="text-sm text-ink dark:text-night-text">{detail.vehicle_model ?? '—'} <span className="text-warm-600 dark:text-night-text-soft">({detail.vehicle_plate ?? 'plaque ?'})</span></p>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <Stat label="Courses ce mois" value={detail.monthMissions} />
              <Stat label="CA ce mois" value={`${detail.monthRevenue} €`} />
            </section>

            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-warm-600 dark:text-night-text-soft mb-2">Documents ({detail.documents.length})</h4>
              {detail.documents.length === 0 ? (
                <p className="text-xs text-warm-600 dark:text-night-text-soft">Aucun document renseigné.</p>
              ) : (
                <ul className="space-y-1.5">
                  {detail.documents.map((d) => (
                    <DocLine key={d.id} doc={d} />
                  ))}
                </ul>
              )}
            </section>

            {canManage && (
              <button type="button" onClick={handleRemove} className="w-full h-10 rounded-xl border border-danger text-danger text-sm font-bold flex items-center justify-center gap-2">
                <Icon name="person_remove" size={18} /> Retirer de ma flotte
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-warm-200 dark:border-night-border p-3">
      <p className="text-[10px] uppercase tracking-wide text-warm-600 dark:text-night-text-soft">{label}</p>
      <p className="text-lg font-extrabold text-ink dark:text-night-text mt-1">{value}</p>
    </div>
  )
}

function DocLine({ doc }: { doc: import('@/services/patronDriverDetailService').DriverDocument }) {
  const isExpired = doc.daysLeft != null && doc.daysLeft <= 0
  const isSoon = doc.daysLeft != null && doc.daysLeft > 0 && doc.daysLeft <= 30
  const color = isExpired ? 'text-danger font-bold' : isSoon ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-warm-600 dark:text-night-text-soft'
  const stateLabel = isExpired ? `Expiré il y a ${Math.abs(doc.daysLeft!)}j` : doc.daysLeft != null ? `dans ${doc.daysLeft}j` : '—'
  return (
    <li className="flex justify-between text-sm">
      <span className="text-ink dark:text-night-text">{doc.label}</span>
      <span className={`text-xs ${color}`}>{stateLabel}</span>
    </li>
  )
}
