'use client'

interface Props {
  count: number
  total: number
  km: number
}

export function AgendaStats({ count, total, km }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      <StatCard label="COURSES" value={count.toString()} />
      <StatCard label="REVENU" value={`${Math.round(total)} €`} />
      <StatCard label="KM" value={Math.round(km).toString()} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-paper px-3 py-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-warm-500 mb-1">{label}</p>
      <p className="text-[18px] font-extrabold text-ink tabular-nums leading-none">{value}</p>
    </div>
  )
}
