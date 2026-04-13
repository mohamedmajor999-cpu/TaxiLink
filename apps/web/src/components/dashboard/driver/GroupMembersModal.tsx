'use client'

import { Icon } from '@/components/ui/Icon'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import type { Group, GroupMemberStats } from '@taxilink/core'

interface Props {
  group:      Group
  stats:      GroupMemberStats[]
  loading:    boolean
  period:     'week' | 'month'
  onPeriod:   (p: 'week' | 'month') => void
  isAdmin:    boolean
  onClose:    () => void
}

export function GroupMembersModal({ group, stats, loading, period, onPeriod, isAdmin, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-secondary">{group.name}</h3>
            {group.memberCount !== undefined && (
              <p className="text-xs text-muted mt-0.5">{group.memberCount} membre{group.memberCount > 1 ? 's' : ''}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Fermer"
            className="w-8 h-8 rounded-xl bg-bgsoft flex items-center justify-center">
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* ID admin */}
        {isAdmin && (
          <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-2">
            <Icon name="info" size={16} className="text-secondary flex-shrink-0" />
            <p className="text-xs font-semibold text-secondary">
              ID à partager : <span className="font-mono break-all">{group.id}</span>
            </p>
          </div>
        )}

        {/* Sélecteur de période */}
        <div className="flex bg-bgsoft rounded-xl p-1 gap-1">
          {(['week', 'month'] as const).map((p) => (
            <button key={p} onClick={() => onPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                period === p ? 'bg-white shadow-soft text-secondary' : 'text-muted'
              }`}>
              {p === 'week' ? 'Cette semaine' : 'Ce mois'}
            </button>
          ))}
        </div>

        {/* Tableau des stats */}
        {loading ? (
          <SkeletonLoader count={4} height="h-14" />
        ) : stats.length === 0 ? (
          <p className="text-center text-sm text-muted py-6">Aucun membre trouvé</p>
        ) : (
          <div className="space-y-2">
            {/* En-têtes */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 pb-1">
              <span className="text-[10px] font-black uppercase text-muted tracking-wider">Membre</span>
              <span className="text-[10px] font-black uppercase text-muted tracking-wider text-center w-14">Partagées</span>
              <span className="text-[10px] font-black uppercase text-muted tracking-wider text-center w-14">Acceptées</span>
            </div>

            {stats.map((m, i) => (
              <div key={m.driverId}
                className="grid grid-cols-[1fr_auto_auto] gap-2 items-center bg-bgsoft rounded-xl px-3 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Rang */}
                  <span className="text-xs font-black text-muted w-4 flex-shrink-0">{i + 1}</span>
                  {/* Avatar + indicateur en ligne */}
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-primary font-black text-sm">
                      {(m.fullName ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      m.isOnline ? 'bg-green-400' : 'bg-line'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-secondary truncate">
                      {(() => {
                        const ln = m.lastName || m.fullName || null
                        const fn = m.firstName
                        if (ln && fn) return `${ln} ${fn.charAt(0).toUpperCase()}.${m.department ? ` · ${m.department}` : ''}`
                        if (ln) return ln
                        if (fn) return fn
                        return 'Chauffeur'
                      })()}
                    </p>
                    {m.role === 'admin' && (
                      <span className="text-[9px] font-black uppercase bg-secondary text-primary px-1.5 py-0.5 rounded">Admin</span>
                    )}
                  </div>
                </div>

                {/* Partagées */}
                <div className="w-14 flex flex-col items-center">
                  <span className="text-base font-black text-secondary">{m.sharedCount}</span>
                  <Icon name="upload" size={12} className="text-accent" />
                </div>

                {/* Acceptées */}
                <div className="w-14 flex flex-col items-center">
                  <span className="text-base font-black text-secondary">{m.acceptedCount}</span>
                  <Icon name="download" size={12} className="text-green-500" />
                </div>
              </div>
            ))}

            {/* Légende */}
            <div className="flex items-center justify-end gap-4 pt-1">
              <div className="flex items-center gap-1">
                <Icon name="upload" size={12} className="text-accent" />
                <span className="text-[10px] text-muted">Partagées</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="download" size={12} className="text-green-500" />
                <span className="text-[10px] text-muted">Acceptées</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                <span className="text-[10px] text-muted">En ligne</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
