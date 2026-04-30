'use client'

import { useState } from 'react'
import { useTopGroupsSection } from './useTopGroupsSection'
import type { GroupRanking } from '@/services/adminAnalyticsService'
import { SectionShell } from './ui/SectionShell'
import { Icon } from '@/components/ui/Icon'

type SortField = 'name' | 'members' | 'missionsTotal' | 'missions30d' | 'acceptanceRate' | 'lastMissionAt'
type SortDir = 'asc' | 'desc'

export function TopGroupsSection() {
  const { items, counters, loading, error } = useTopGroupsSection()
  const [sortField, setSortField] = useState<SortField>('missions30d')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')

  function toggle(f: SortField) {
    if (f === sortField) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('desc') }
  }

  const sorted = [...items].sort((a, b) => {
    const sign = sortDir === 'asc' ? 1 : -1
    if (sortField === 'name')          return sign * a.name.localeCompare(b.name)
    if (sortField === 'lastMissionAt') return sign * ((a.lastMissionAt ?? '').localeCompare(b.lastMissionAt ?? ''))
    return sign * (Number(a[sortField]) - Number(b[sortField]))
  })

  return (
    <SectionShell
      title="Groupes"
      subtitle="Classement par activité (30 derniers jours)"
      iconName="apartment"
    >
      {counters && (
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <Stat label="Total groupes"     value={counters.totalGroups.toString()} />
          <Stat label="Actifs (30j)"      value={counters.activeGroups30d.toString()} />
          <Stat label="Total membres"     value={counters.totalMembers.toLocaleString('fr-FR')} />
        </div>
      )}

      {loading && <div className="text-sm text-muted">Chargement…</div>}
      {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-bgsoft text-xs uppercase tracking-wide text-muted">
              <tr>
                <Th label="Groupe"           field="name"           s={sortField} d={sortDir} on={toggle} />
                <Th label="Membres"          field="members"        s={sortField} d={sortDir} on={toggle} align="right" />
                <Th label="Courses 30j"      field="missions30d"    s={sortField} d={sortDir} on={toggle} align="right" />
                <Th label="Courses total"    field="missionsTotal"  s={sortField} d={sortDir} on={toggle} align="right" />
                <Th label="Taux accept."     field="acceptanceRate" s={sortField} d={sortDir} on={toggle} align="right" />
                <Th label="Dernière course"  field="lastMissionAt"  s={sortField} d={sortDir} on={toggle} />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Aucun groupe</td></tr>
              )}
              {sorted.map((r) => <Row key={r.groupId} r={r} />)}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  )
}

function Row({ r }: { r: GroupRanking }) {
  return (
    <tr className="border-t border-line/60">
      <td className="px-3 py-2">
        <div className="font-medium text-secondary">{r.name}</div>
        {r.description && <div className="text-xs text-muted line-clamp-1">{r.description}</div>}
      </td>
      <td className="px-3 py-2 text-right">{r.members}</td>
      <td className="px-3 py-2 text-right font-semibold">{r.missions30d}</td>
      <td className="px-3 py-2 text-right">{r.missionsTotal}</td>
      <td className="px-3 py-2 text-right">{r.acceptanceRate}%</td>
      <td className="px-3 py-2 text-xs">
        {r.lastMissionAt ? new Date(r.lastMissionAt).toLocaleDateString('fr-FR') : '—'}
      </td>
    </tr>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bgsoft p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-secondary">{value}</div>
    </div>
  )
}

function Th({
  label, field, s, d, on, align = 'left',
}: {
  label: string
  field: SortField
  s:     SortField
  d:     SortDir
  on:    (f: SortField) => void
  align?: 'left' | 'right'
}) {
  const active = field === s
  return (
    <th className={`px-3 py-2 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button onClick={() => on(field)} className="inline-flex items-center gap-1 hover:text-secondary">
        {label}
        {active && <Icon name={d === 'asc' ? 'arrow_upward' : 'arrow_downward'} size={12} />}
      </button>
    </th>
  )
}
