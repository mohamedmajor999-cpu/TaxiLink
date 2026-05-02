'use client'
import { Plus, Star } from 'lucide-react'
import type { Group } from '@taxilink/core'
import type { GroupActivitySummary } from '@/services/groupStatsService'

interface Props {
  group:           Group
  summary:         GroupActivitySummary | null
  isFavorite:      boolean
  onOpen:          () => void
  onPostCourse:    () => void
  onToggleFavorite: () => void
}

// Hero du groupe principal — toujours affiché en haut de la liste pour
// donner un raccourci direct vers « Poster une course » sans entrer dans
// le détail. Si le groupe est un favori du chauffeur, badge « FAVORI » et
// étoile pleine ; sinon hero neutre + étoile vide pour permettre l'ajout.
export function GroupesHeroCard({ group, summary, isFavorite, onOpen, onPostCourse, onToggleFavorite }: Props) {
  const available = summary?.available ?? 0
  const online = summary?.onlineCount ?? 0
  const exchanged = summary?.exchanged7d ?? 0
  const members = group.memberCount ?? 0
  const subtitle = group.description
    ? (members > 0 ? `${group.description} · ${members} membre${members > 1 ? 's' : ''}` : group.description)
    : (members > 0 ? `${members} membre${members > 1 ? 's' : ''}` : null)

  return (
    <section className="relative mb-4 rounded-3xl border-2 border-ink bg-paper p-4 shadow-card">
      {isFavorite && (
        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 bg-brand text-ink text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
          <Star className="w-3 h-3" strokeWidth={2.4} fill="currentColor" />
          Favori
        </span>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="w-full flex items-center gap-3 text-left mb-3"
        aria-label={`Ouvrir le groupe ${group.name}`}
      >
        <div className="relative shrink-0">
          <div className="w-[52px] h-[52px] rounded-2xl bg-ink flex items-center justify-center">
            <span className="text-brand text-[22px] font-bold">
              {group.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span
            aria-hidden
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[3px] border-paper ${
              available > 0 ? 'bg-emerald-500 motion-safe:animate-pulse' : 'bg-warm-300'
            }`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-bold text-ink leading-tight tracking-tight truncate">
            {group.name}
          </p>
          {subtitle && (
            <p className="text-[12.5px] text-warm-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={isFavorite}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition border ${
            isFavorite
              ? 'bg-brand border-brand text-ink hover:brightness-95'
              : 'bg-paper border-warm-200 text-warm-500 hover:bg-warm-50'
          }`}
        >
          <Star className="w-4 h-4" strokeWidth={isFavorite ? 2 : 1.8} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </button>

      <div className="grid grid-cols-3 bg-warm-50 rounded-xl py-3 mb-3">
        <Stat
          value={
            <>
              {available > 0 && <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 align-middle mr-1 motion-safe:animate-pulse" />}
              {available}
            </>
          }
          label="Courses dispo"
        />
        <Stat value={online} label="En ligne" border />
        <Stat value={exchanged} label="Échangées (7j)" border />
      </div>

      <button
        type="button"
        onClick={onPostCourse}
        className="w-full h-12 rounded-2xl bg-ink text-paper text-[14.5px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Plus className="w-5 h-5 text-brand" strokeWidth={2.5} />
        Poster une course
      </button>
    </section>
  )
}

function Stat({ value, label, border = false }: { value: React.ReactNode; label: string; border?: boolean }) {
  return (
    <div className={`text-center ${border ? 'border-l border-warm-200' : ''}`}>
      <p className="text-[20px] font-bold text-ink leading-none tabular-nums">{value}</p>
      <p className="text-[10.5px] text-warm-500 mt-1.5 font-medium">{label}</p>
    </div>
  )
}
