'use client'

import { useState } from 'react'
import { Plus, ChevronRight, Star, UserPlus, MoreVertical } from 'lucide-react'
import type { GroupMemberStats } from '@taxilink/core'
import { useAuth } from '@/hooks/useAuth'
import { useGroupDetail } from './useGroupDetail'
import { useGroupInvite } from './useGroupInvite'
import { MyGroupStatsPanel } from './MyGroupStatsPanel'
import { GroupLiveBanner } from './GroupLiveBanner'
import { GroupOnlineStrip } from './GroupOnlineStrip'
import { GroupActivityFeed } from './GroupActivityFeed'
import { GroupInviteSheet } from './GroupInviteSheet'
import { GroupMemberRow } from './GroupMemberRow'
import { BlockDriverModal } from './BlockDriverModal'
import { GroupDetailShell, GroupDetailStat } from './GroupDetailLayout'
import { useGroupFavorites } from '../useGroupFavorites'

interface Props { groupId: string }

export function GroupDetailScreen({ groupId }: Props) {
  const { user } = useAuth()
  const c   = useGroupDetail(groupId)
  const fav = useGroupFavorites()
  const inv = useGroupInvite(c.group)
  const [blockTarget, setBlockTarget] = useState<GroupMemberStats | null>(null)

  if (c.loading) return <GroupDetailShell onBack={c.back}><div className="h-64 rounded-3xl bg-warm-100 motion-safe:animate-pulse" /></GroupDetailShell>
  if (!c.group) return (
    <GroupDetailShell onBack={c.back}>
      <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center">
        <p className="text-[20px] font-bold text-ink mb-2">Groupe introuvable</p>
        {c.error && <p className="text-[13px] text-warm-500">{c.error}</p>}
      </div>
    </GroupDetailShell>
  )

  const g = c.group
  const isFav = fav.has(g.id)
  const membersCount = g.memberCount ?? 0
  const visibleMembers = c.members.slice(0, 4)

  return (
    <GroupDetailShell
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
        <GroupDetailStat value={`${membersCount}`}                 label="Membres" />
        <GroupDetailStat value={`${c.summary?.onlineCount ?? 0}`}  label="En ligne" dot />
        <GroupDetailStat value={`${c.summary?.exchanged7d ?? 0}`}  label="Échangées (7j)" />
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
          {visibleMembers.map((m) => (
            <GroupMemberRow
              key={m.driverId}
              member={m}
              isBlocked={c.blockedIds.includes(m.driverId)}
              hideBlockButton={m.driverId === user?.id}
              onBlockToggle={setBlockTarget}
            />
          ))}
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

      {blockTarget && user?.id && (
        <BlockDriverModal
          blockerId={user.id}
          targetId={blockTarget.driverId}
          targetName={memberDisplayName(blockTarget)}
          initialBlocked={c.blockedIds.includes(blockTarget.driverId)}
          onClose={() => setBlockTarget(null)}
          onChanged={(nowBlocked) => c.setBlockedLocal(blockTarget.driverId, nowBlocked)}
        />
      )}
    </GroupDetailShell>
  )
}

function memberDisplayName(m: GroupMemberStats): string {
  if (m.lastName && m.firstName) return `${m.lastName} ${m.firstName.charAt(0).toUpperCase()}.`
  return m.fullName || m.lastName || m.firstName || 'Ce chauffeur'
}
