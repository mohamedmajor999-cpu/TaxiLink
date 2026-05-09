'use client'
import { ArrowLeft, ShieldOff, Ban } from 'lucide-react'
import { useBlockedDriversScreen } from './useBlockedDriversScreen'

interface Props {
  onBack: () => void
}

export function BlockedDriversScreen({ onBack }: Props) {
  const { list, loading, error, unblock } = useBlockedDriversScreen()

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="w-9 h-9 rounded-full grid place-items-center hover:bg-warm-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2} />
        </button>
        <h1 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
          Chauffeurs bloqués
        </h1>
      </header>

      {loading ? (
        <div className="rounded-2xl bg-warm-100 p-6 text-center text-[13px] text-warm-600 motion-safe:animate-pulse">
          Chargement…
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-danger-soft text-danger text-[13px] px-3 py-2">
          {error}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-warm-200 bg-paper p-8 text-center">
          <Ban className="mx-auto w-10 h-10 text-warm-500 mb-3" strokeWidth={1.5} />
          <p className="text-[14px] font-bold text-ink mb-1">Aucun chauffeur bloqué</p>
          <p className="text-[12px] text-warm-600 leading-relaxed max-w-xs mx-auto">
            Les collègues que tu bloques apparaissent ici. Tu ne vois plus leurs
            annonces, et eux ne voient plus les tiennes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[12px] text-warm-600 leading-relaxed mb-3 px-1">
            Pour chacun·e : ils ne voient pas tes annonces et tu ne vois pas les leurs.
            Clique sur <strong>Débloquer</strong> pour rétablir la visibilité.
          </p>
          {list.map((b) => (
            <div key={b.blockedId} className="flex items-center gap-3 p-3 rounded-2xl bg-paper border border-warm-200">
              <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center shrink-0">
                <span className="text-brand text-sm font-bold">
                  {(b.fullName ?? '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-ink truncate">
                  {b.fullName ?? 'Chauffeur'}
                </p>
                <p className="text-[12px] text-warm-600">
                  Bloqué·e le {new Date(b.blockedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => unblock(b.blockedId)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-ink text-paper text-[12px] font-bold hover:bg-ink/90 transition-colors"
              >
                <ShieldOff className="w-3.5 h-3.5" strokeWidth={2.2} />
                Débloquer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
