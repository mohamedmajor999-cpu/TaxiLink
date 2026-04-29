'use client'

import { useState } from 'react'
import { useTopDriversSection } from './useTopDriversSection'
import type { DriverRanking } from '@/services/adminAnalyticsService'

type SortField = 'name' | 'isOnline' | 'rating' | 'posted' | 'accepted' | 'completed' | 'caEur' | 'apiCostUsd'
type SortDir = 'asc' | 'desc'

export function TopDriversSection() {
  const { items, loading, error } = useTopDriversSection()
  const [sortField, setSortField] = useState<SortField>('completed')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')

  function toggle(f: SortField) {
    if (f === sortField) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('desc') }
  }

  const sorted = [...items].sort((a, b) => {
    const sign = sortDir === 'asc' ? 1 : -1
    if (sortField === 'name') return sign * a.name.localeCompare(b.name)
    if (sortField === 'isOnline') return sign * (Number(a.isOnline) - Number(b.isOnline))
    return sign * (Number(a[sortField]) - Number(b[sortField]))
  })

  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
      <h2 className="mb-4 text-xl font-semibold text-secondary">Classement chauffeurs</h2>

      {loading && <div className="text-sm text-muted">Chargement…</div>}
      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-bgsoft text-xs uppercase tracking-wide text-muted">
              <tr>
                <Th label="Chauffeur"  field="name"        s={sortField} d={sortDir} on={toggle} />
                <Th label="Statut"     field="isOnline"    s={sortField} d={sortDir} on={toggle} />
                <Th label="Note"       field="rating"      s={sortField} d={sortDir} on={toggle} align="right" />
                <Th label="Postées"    field="posted"      s={sortField} d={sortDir} on={toggle} align="right" />
                <Th label="Acceptées"  field="accepted"    s={sortField} d={sortDir} on={toggle} align="right" />
                <Th label="Terminées"  field="completed"   s={sortField} d={sortDir} on={toggle} align="right" />
                <Th label="CA €"       field="caEur"       s={sortField} d={sortDir} on={toggle} align="right" />
                <Th label="Conso API $" field="apiCostUsd" s={sortField} d={sortDir} on={toggle} align="right" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-muted">Aucun chauffeur enregistré</td></tr>
              )}
              {sorted.map((r) => <Row key={r.userId} r={r} />)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Row({ r }: { r: DriverRanking }) {
  return (
    <tr className="border-t border-line/60">
      <td className="px-3 py-2">
        <div className="font-medium text-secondary">{r.name}</div>
        {r.phone && <div className="text-xs text-muted">{r.phone}</div>}
      </td>
      <td className="px-3 py-2">
        {r.isOnline
          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700"><span className="size-2 rounded-full bg-green-500" />En ligne</span>
          : <span className="text-xs text-muted">Hors ligne</span>}
      </td>
      <td className="px-3 py-2 text-right">{r.rating > 0 ? r.rating.toFixed(1) : '—'}</td>
      <td className="px-3 py-2 text-right">{r.posted}</td>
      <td className="px-3 py-2 text-right">{r.accepted}</td>
      <td className="px-3 py-2 text-right font-semibold">{r.completed}</td>
      <td className="px-3 py-2 text-right">{r.caEur.toFixed(0)}</td>
      <td className="px-3 py-2 text-right text-xs">${r.apiCostUsd.toFixed(4)}</td>
    </tr>
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
        {active && <span>{d === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  )
}
