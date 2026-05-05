'use client'
import { useState } from 'react'
import { useCurrentOrg } from '@/hooks/useCurrentOrg'
import { usePatronOverview } from '@/components/dashboard/patron/overview/usePatronOverview'
import { Icon } from '@/components/ui/Icon'
import { InviteMemberModal } from '@/components/dashboard/patron/invitations/InviteMemberModal'
import { DriverDetailDrawer } from '@/components/dashboard/patron/DriverDetailDrawer'

type Filter = 'all' | 'online' | 'in-mission' | 'offline'

export function PatronDrivers() {
  const { fleet, isLoading, error } = usePatronOverview()
  const { orgId, role } = useCurrentOrg()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [detailDriverId, setDetailDriverId] = useState<string | null>(null)
  const canManage = role === 'owner' || role === 'admin'

  if (isLoading) return <p className="py-12 text-center text-warm-600 dark:text-night-text-soft text-sm">Chargement…</p>
  if (error) return <p className="py-12 text-center text-danger text-sm">Erreur : {error}</p>

  const filtered = fleet
    .filter((d) => filter === 'all' || d.status === filter)
    .filter((d) => !search.trim() || d.name.toLowerCase().includes(search.toLowerCase().trim()))

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink dark:text-night-text">Chauffeurs</h1>
          <p className="text-sm text-warm-600 dark:text-night-text-soft mt-1">{fleet.length} chauffeur{fleet.length > 1 ? 's' : ''} dans votre flotte</p>
        </div>
        {canManage && (
          <button type="button" onClick={() => setInviteOpen(true)} className="h-10 px-4 rounded-xl bg-ink dark:bg-night-brand text-paper dark:text-night-bg text-sm font-bold flex items-center gap-2">
            <Icon name="person_add" size={18} /> Inviter un chauffeur
          </button>
        )}
      </header>

      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chercher par nom…" className="h-10 px-3 rounded-xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-bg text-sm flex-1 min-w-[200px] text-ink dark:text-night-text" />
        <div className="flex gap-1.5">
          {([['all', 'Tous'], ['online', 'En ligne'], ['in-mission', 'En mission'], ['offline', 'Hors ligne']] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFilter(k)} className={`h-10 px-3 rounded-xl text-xs font-bold ${filter === k ? 'bg-ink dark:bg-night-brand text-paper dark:text-night-bg' : 'bg-warm-100 dark:bg-night-elevated text-warm-700 dark:text-night-text-soft'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-warm-600 dark:text-night-text-soft text-sm">Aucun chauffeur ne correspond à ce filtre.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => setDetailDriverId(d.id)} className="w-full text-left p-4 rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warm-200 dark:bg-night-elevated flex items-center justify-center text-sm font-extrabold text-ink dark:text-night-text">
                    {d.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink dark:text-night-text truncate">{d.name}</p>
                    <p className="text-xs text-warm-600 dark:text-night-text-soft">{d.vehicle ?? 'Pas de véhicule'} · ⭐ {d.rating.toFixed(1)}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${d.status === 'in-mission' ? 'bg-brand' : d.status === 'online' ? 'bg-green-500' : 'bg-warm-300'}`} />
                </div>
                <div className="mt-3 flex justify-between text-xs">
                  <span className="text-warm-600 dark:text-night-text-soft">{d.todayMissions} courses aujourd&apos;hui</span>
                  <span className="text-ink dark:text-night-text font-bold">{d.todayRevenue} €</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <DriverDetailDrawer driverId={detailDriverId} orgId={orgId} canManage={canManage} onClose={() => setDetailDriverId(null)} />
    </div>
  )
}
