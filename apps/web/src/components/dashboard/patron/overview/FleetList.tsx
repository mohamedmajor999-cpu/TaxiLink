'use client'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { organizationService } from '@/services/organizationService'
import type { PatronFleetMember } from '@/services/patronFleetService'

const BADGE = {
  'in-mission': ['EN MISSION', 'bg-brand/15 text-brand'],
  online: ['EN LIGNE', 'bg-green-500/15 text-green-700 dark:text-green-400'],
  offline: ['HORS LIGNE', 'bg-warm-200 dark:bg-night-elevated text-warm-700 dark:text-night-text-soft'],
} as const

function StatusBadge({ status }: { status: PatronFleetMember['status'] }) {
  return <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${BADGE[status][1]}`}>{BADGE[status][0]}</span>
}

export function FleetList({ fleet, orgId, canManage, onPickDriver }: { fleet: PatronFleetMember[]; orgId: string | null; canManage: boolean; onPickDriver: (id: string) => void }) {
  const [removing, setRemoving] = useState<string | null>(null)
  const handleRemove = async (driverId: string, name: string) => {
    if (!orgId) return
    if (!confirm(`Retirer ${name} de votre flotte ?\n\nIl rejoindra le pool "Indépendants".`)) return
    setRemoving(driverId)
    try { await organizationService.removeMember(orgId, driverId) }
    catch (e) { alert(`Erreur : ${(e as Error).message}`) }
    finally { setRemoving(null) }
  }
  return (
    <section className="rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-4">
      <h2 className="text-sm font-bold text-ink dark:text-night-text mb-3">Chauffeurs ({fleet.length})</h2>
      {fleet.length === 0 ? (
        <div className="py-6 text-center">
          <Icon name="group_add" size={32} />
          <p className="text-sm font-medium text-ink dark:text-night-text mt-2">Aucun chauffeur</p>
          <p className="text-xs text-warm-600 dark:text-night-text-soft mt-0.5">Utilisez le bouton « Inviter un chauffeur » en haut.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {fleet.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
              <button type="button" onClick={() => onPickDriver(d.id)} className="flex items-center gap-2 min-w-0 flex-1 text-left hover:bg-warm-50 dark:hover:bg-night-elevated rounded-md px-1 -mx-1 py-0.5">
                <span className="text-ink dark:text-night-text font-medium truncate">{d.name}</span>
                <StatusBadge status={d.status} />
              </button>
              <span className="text-warm-600 dark:text-night-text-soft text-xs shrink-0 tabular-nums">{d.todayMissions} · {d.todayRevenue}€</span>
              {canManage && (
                <button type="button" disabled={removing === d.id} onClick={() => handleRemove(d.id, d.name)} title="Retirer ce chauffeur de votre flotte" className="text-warm-400 hover:text-danger disabled:opacity-50 transition-colors">
                  <Icon name="person_remove" size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
