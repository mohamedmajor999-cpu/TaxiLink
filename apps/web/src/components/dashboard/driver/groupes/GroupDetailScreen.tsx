'use client'

import { ArrowLeft, Plus, ChevronRight, Star, UserPlus, MoreVertical } from 'lucide-react'
import { useGroupDetail } from './useGroupDetail'
import { useGroupInvite } from './useGroupInvite'
import { MyGroupStatsPanel } from './MyGroupStatsPanel'
import { GroupLiveBanner } from './GroupLiveBanner'
import { GroupOnlineStrip } from './GroupOnlineStrip'
import { GroupActivityFeed } from './GroupActivityFeed'
import { GroupInviteSheet } from './GroupInviteSheet'
import { GroupMemberRow } from './GroupMemberRow'
import { useGroupFavorites } from '../useGroupFavorites'

interface Props { groupId: string }

export function GroupDetailScreen({ groupId }: Props) {
  const c   = useGroupDetail(groupId)
  const fav = useGroupFavorites()
  const inv = useGroupInvite(c.group)

  if (c.loading) return <Shell onBack={c.back}><div className="h-64 rounded-3xl bg-warm-100 motion-safe:animate-pulse" /></Shell>
  if (!c.group) return (
    <Shell onBack={c.back}>
      <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center">
        <p className="text-[20px] font-bold text-ink mb-2">Groupe introuvable</p>
        {c.error && <p className="text-[13px] text-warm-500">{c.error}</p>}
      </div>
    </Shell>
  )

  const g = c.group
  const isFav = fav.has(g.id)
  const membersCount = g.memberCount ?? 0
  const visibleMembers = c.members.slice(0, 4)

  return (
    <Shell
      onBack={c.back}
      rightSlot={
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => inv.setOpen(!inv.open)}
            aria-label="Inviter un confrère"
            className="w-9 h-9 rounded-full border border-warm-200 bg-paper text-warm-700 flex items-center justify-center hover:bg-warm-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="Plus d'options"
            className="w-9 h-9 rounded-full border border-warm-200 bg-paper text-warm-700 flex items-center justify-center hover:bg-warm-50 transition-colors"
          >
            <MoreVertical className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <GroupInviteSheet
            open={inv.open}
            onClose={() => inv.setOpen(false)}
            copied={inv.copied}
            copyLink={inv.copyLink}
            shareViaSms={inv.shareViaSms}
            shareViaWhatsApp={inv.shareViaWhatsApp}
          />
        </div>
      }
    >
      <section className="rounded-3xl border border-warm-200 bg-paper px-6 pt-7 pb-5 mb-3 text-center">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-ink flex items-center justify-center mb-3">
          <span className="text-brand text-[36px] font-bold leading-none">
            {g.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-[22px] font-bold text-ink tracking-tight">{g.name}</h1>
        {g.description && (
          <p className="text-[13px] text-warm-500 mt-1 max-w-md mx-auto">{g.description}</p>
        )}
        <button
          type="button"
          onClick={() => fav.toggle(g.id)}
          aria-pressed={isFav}
          className={`mt-3 inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
            isFav ? 'bg-brand text-ink' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
          }`}
        >
          <Star className="w-3.5 h-3.5" strokeWidth={2} fill={isFav ? 'currentColor' : 'none'} />
          {isFav ? 'Favori' : 'Ajouter aux favoris'}
        </button>
      </section>

      <GroupLiveBanner available={c.summary?.available ?? 0} onOpen={c.viewAvailable} />

      <section className="mb-3 grid grid-cols-3 rounded-2xl border border-warm-200 bg-paper py-3 divide-x divide-warm-200">
        <Stat value={`${membersCount}`}                 label="Membres" />
        <Stat value={`${c.summary?.onlineCount ?? 0}`}  label="En ligne" dot />
        <Stat value={`${c.summary?.exchanged7d ?? 0}`}  label="Échangées (7j)" />
      </section>

      <GroupOnlineStrip members={c.members} />

      <div className="mb-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={c.postCourse}
          className="w-full h-14 rounded-2xl bg-ink text-paper text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Plus className="w-5 h-5 text-brand" strokeWidth={2.5} />
          Poster une course
        </button>
        <button
          type="button"
          onClick={() => inv.setOpen(true)}
          className="w-full h-11 rounded-2xl border border-warm-200 bg-paper text-ink text-[13.5px] font-bold flex items-center justify-center gap-2 hover:bg-warm-50 transition-colors"
        >
          <UserPlus className="w-4 h-4 text-warm-600" strokeWidth={1.8} />
          Inviter un confrère
        </button>
      </div>

      {c.myStats && <MyGroupStatsPanel stats={c.myStats} />}

      <GroupActivityFeed
        total={c.summary?.exchanged7d ?? 0}
        daily={c.daily}
        events={c.events}
      />

      <section className="mt-4">
        <header className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-[15px] font-bold text-ink">Membres</h2>
          {membersCount > visibleMembers.length && (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-warm-600">
              Voir les {membersCount}
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </span>
          )}
        </header>
        <div className="flex flex-col gap-2">
          {visibleMembers.map((m) => <GroupMemberRow key={m.driverId} member={m} />)}
          {visibleMembers.length === 0 && (
            <p className="text-[13px] text-warm-500 text-center py-6">Aucun membre chargé</p>
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={c.leave}
        disabled={c.leaving}
        className="mt-5 w-full h-12 rounded-2xl border border-warm-200 bg-paper text-[14px] font-bold text-danger hover:bg-danger-soft disabled:opacity-50 transition-colors"
      >
        {c.leaving ? 'Sortie…' : 'Quitter le groupe'}
      </button>
    </Shell>
  )
}

function Shell({ children, onBack, rightSlot }: { children: React.ReactNode; onBack: () => void; rightSlot?: React.ReactNode }) {
  return (
    <div className="px-4 md:px-8 py-3 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <header className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-warm-600 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Retour
        </button>
        {rightSlot}
      </header>
      {children}
    </div>
  )
}

function Stat({ value, label, dot = false }: { value: string; label: string; dot?: boolean }) {
  return (
    <div className="px-2 text-center">
      <p className="text-[20px] font-bold text-ink leading-none tabular-nums">
        {dot && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 align-middle mr-1.5" />}
        {value}
      </p>
      <p className="text-[11px] text-warm-500 mt-1.5">{label}</p>
    </div>
  )
}
