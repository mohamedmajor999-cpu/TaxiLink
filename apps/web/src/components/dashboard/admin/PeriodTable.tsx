'use client'

import { useState } from 'react'
import type { PeriodBucket } from '@/services/adminAnalyticsService'
import { Icon } from '@/components/ui/Icon'

type SortField = 'period' | 'requests' | 'costUsd'
type SortDir = 'asc' | 'desc'

interface Props {
  title: string
  rows:  PeriodBucket[]
}

export function PeriodTable({ title, rows }: Props) {
  const [sortField, setSortField] = useState<SortField>('period')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')

  function toggle(field: SortField) {
    if (field === sortField) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const sorted = [...rows].sort((a, b) => {
    const sign = sortDir === 'asc' ? 1 : -1
    if (sortField === 'period') return sign * a.period.localeCompare(b.period)
    return sign * (Number(a[sortField]) - Number(b[sortField]))
  })

  return (
    <div className="rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-4 py-3 text-sm font-semibold text-secondary">{title}</div>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-bgsoft text-xs uppercase tracking-wide text-muted">
            <tr>
              <Th label="Période"  field="period"   sortField={sortField} sortDir={sortDir} onClick={toggle} />
              <Th label="Appels"   field="requests" sortField={sortField} sortDir={sortDir} onClick={toggle} align="right" />
              <Th label="Coût $"   field="costUsd"  sortField={sortField} sortDir={sortDir} onClick={toggle} align="right" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">Aucune donnée</td></tr>
            )}
            {sorted.map((r) => (
              <tr key={r.period} className="border-t border-line/60">
                <td className="px-4 py-2 font-mono text-xs">{r.period}</td>
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
        {active && <Icon name={sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'} size={12} />}
      </button>
    </th>
  )
}
