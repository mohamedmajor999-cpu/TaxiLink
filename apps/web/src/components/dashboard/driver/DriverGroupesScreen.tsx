'use client'

import { Icon } from '@/components/ui/Icon'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { GroupCard } from './GroupCard'
import { useDriverGroupes } from './useDriverGroupes'

export function DriverGroupesScreen() {
  const {
    groups, members, selectedGroup, loading, membersLoading, error,
    showCreate, setShowCreate, showJoin, setShowJoin,
    newName, setNewName, newDesc, setNewDesc,
    joinId, setJoinId, saving,
    openMembers, closeMembers, handleCreate, handleJoin, handleLeave, isAdmin,
  } = useDriverGroupes()

  return (
    <div className="max-w-2xl space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-secondary mb-1">Mes groupes</h2>
          <p className="text-muted text-sm">Partagez des missions avec vos collègues de confiance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowJoin(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border-2 border-line text-secondary font-semibold text-sm hover:bg-bgsoft transition-colors">
            <Icon name="link" size={16} />
            Rejoindre
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-secondary font-bold text-sm hover:bg-yellow-400 transition-colors">
            <Icon name="add" size={16} />
            Créer
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <SkeletonLoader count={3} height="h-20" />
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bgsoft flex items-center justify-center">
            <Icon name="group" size={32} className="text-muted" />
          </div>
          <p className="font-bold text-secondary">Aucun groupe pour l'instant</p>
          <p className="text-sm text-muted max-w-xs">
            Créez un groupe avec vos collègues ou rejoignez-en un avec son identifiant.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isAdmin={isAdmin(group)}
              onViewMembers={openMembers}
              onLeave={handleLeave}
            />
          ))}
        </div>
      )}

      {/* Modal — Créer un groupe */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-secondary">Créer un groupe</h3>
              <button onClick={() => setShowCreate(false)} aria-label="Fermer"
                className="w-8 h-8 rounded-xl bg-bgsoft flex items-center justify-center">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Nom du groupe *</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex : Les collègues du lundi"
                className="w-full h-11 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Description (optionnel)</label>
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Ex : Groupe des chauffeurs de la région Ouest"
                className="w-full h-11 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-colors" />
            </div>
            <button onClick={handleCreate} disabled={saving || !newName.trim()}
              className="w-full h-11 rounded-xl bg-primary text-secondary font-bold text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors disabled:opacity-50">
              {saving ? <><Icon name="sync" size={16} className="animate-spin" />Création...</> : <><Icon name="check" size={16} />Créer le groupe</>}
            </button>
          </div>
        </div>
      )}

      {/* Modal — Rejoindre un groupe */}
      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowJoin(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-secondary">Rejoindre un groupe</h3>
              <button onClick={() => setShowJoin(false)} aria-label="Fermer"
                className="w-8 h-8 rounded-xl bg-bgsoft flex items-center justify-center">
                <Icon name="close" size={16} />
              </button>
            </div>
            <p className="text-sm text-muted">Demandez l'identifiant du groupe à son administrateur et collez-le ci-dessous.</p>
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Identifiant du groupe</label>
              <input value={joinId} onChange={(e) => setJoinId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full h-11 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-mono transition-colors" />
            </div>
            <button onClick={handleJoin} disabled={saving || !joinId.trim()}
              className="w-full h-11 rounded-xl bg-secondary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors disabled:opacity-50">
              {saving ? <><Icon name="sync" size={16} className="animate-spin" />Rejoindre...</> : <><Icon name="login" size={16} />Rejoindre le groupe</>}
            </button>
          </div>
        </div>
      )}

      {/* Modal — Membres du groupe */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeMembers} />
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 shadow-xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-secondary">{selectedGroup.name}</h3>
              <button onClick={closeMembers} aria-label="Fermer"
                className="w-8 h-8 rounded-xl bg-bgsoft flex items-center justify-center">
                <Icon name="close" size={16} />
              </button>
            </div>

            {isAdmin(selectedGroup) && (
              <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-2">
                <Icon name="info" size={16} className="text-secondary flex-shrink-0" />
                <p className="text-xs font-semibold text-secondary">
                  ID à partager : <span className="font-mono">{selectedGroup.id}</span>
                </p>
              </div>
            )}

            {membersLoading ? (
              <SkeletonLoader count={3} height="h-12" />
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-bgsoft rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary font-black text-sm">
                        {(m.fullName ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-secondary">{m.fullName ?? 'Chauffeur'}</span>
                    </div>
                    {m.role === 'admin' && (
                      <span className="text-[10px] font-black uppercase bg-secondary text-primary px-2 py-0.5 rounded-lg">Admin</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
