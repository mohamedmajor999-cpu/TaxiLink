'use client'

import { useState } from 'react'
import type { TopUser } from '@/services/adminAnalyticsService'

type SortField = 'name' | 'requests' | 'costUsd'
type SortDir = 'asc' | 'desc'

export function TopUsersTable({ rows }: { rows: TopUser[] }) {
  const [sortField, setSortField] = useState<SortField>('costUsd')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')

  function toggle(field: SortField) {
    if (field === sortField) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const sorted = [...rows].sort((a, b) => {
    const sign = sortDir === 'asc' ? 1 : -1
    if (sortField === 'name') return sign * a.name.localeCompare(b.name)
    return sign * (Number(a[sortField]) - Number(b[sortField]))
  })

  return (
    <div className="rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-4 py-3 text-sm font-semibold text-secondary">
        Top consommateurs (par utilisateur)
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bgsoft text-xs uppercase tracking-wide text-muted">
            <tr>
              <Th label="Utilisateur" field="name"     sortField={sortField} sortDir={sortDir} onClick={toggle} />
              <Th label="Appels"      field="requests" sortField={sortField} sortDir={sortDir} onClick={toggle} align="right" />
              <Th label="Coût $"      field="costUsd"  sortField={sortField} sortDir={sortDir} onClick={toggle} align="right" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">Aucun appel enregistré</td></tr>
            )}
            {sorted.map((r, i) => (
              <tr key={r.userId ?? `anon-${i}`} className="border-t border-line/60">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2 text-right">{r.requests.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-2 text-right">${r.costUsd.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({
  label, field, sortField, sortDir, onClick, align = 'left',
}: {
  label:     string
  field:     SortField
  sortField: SortField
  sortDir:   SortDir
  onClick:   (f: SortField) => void
  align?:    'left' | 'right'
}) {
  const active = field === sortField
  return (
    <th className={`px-4 py-2 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button onClick={() => onClick(field)} className="inline-flex items-center gap-1 hover:text-secondary">
        {label}
        {active && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  )
}
