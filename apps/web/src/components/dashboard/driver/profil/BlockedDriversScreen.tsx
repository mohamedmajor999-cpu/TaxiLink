'use client'
import { ShieldOff, Ban } from 'lucide-react'
import { useBlockedDriversScreen } from './useBlockedDriversScreen'

export function BlockedDriversScreen() {
  const { list, loading, error, unblock } = useBlockedDriversScreen()

  if (loading) {
    return (
      <div className="rounded-2xl bg-bgsoft p-6 text-center text-sm text-muted">
        Chargement…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <Ban className="mx-auto w-10 h-10 text-muted mb-3" strokeWidth={1.5} />
        <p className="text-sm font-bold text-secondary mb-1">Aucun chauffeur bloqué</p>
        <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
          Les collègues que vous bloquez apparaissent ici. Vous ne voyez plus leurs
          annonces, et eux ne voient plus les vôtres.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted leading-relaxed mb-3 px-1">
        Pour chacun·e : ils ne voient pas vos annonces et vous ne voyez pas les leurs.
        Cliquez sur <strong>Débloquer</strong> pour rétablir la visibilité.
      </p>
      {list.map((b) => (
        <div key={b.blockedId} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-line">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <span className="text-primary text-sm font-bold">
              {(b.fullName ?? '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-secondary truncate">
              {b.fullName ?? 'Chauffeur'}
            </p>
            <p className="text-xs text-muted">
              Bloqué·e le {new Date(b.blockedAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => unblock(b.blockedId)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/80 transition-colors"
          >
            <ShieldOff className="w-3.5 h-3.5" strokeWidth={2.2} />
            Débloquer
          </button>
        </div>
      ))}
    </div>
  )
}
