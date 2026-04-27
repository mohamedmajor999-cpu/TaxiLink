'use client'

import { Search, Users, Link2 } from 'lucide-react'
import { GroupCard } from './GroupCard'
import { CreateGroupModal } from './groupes/CreateGroupModal'
import { JoinGroupModal } from './groupes/JoinGroupModal'
import { GroupesHeader } from './groupes/GroupesHeader'
import { useDriverGroupesScreen } from './useDriverGroupesScreen'

export function DriverGroupesScreen() {
  const {
    groups, loading, error,
    showCreate, setShowCreate, showJoin, setShowJoin,
    newName, setNewName, newDesc, setNewDesc,
    joinId, setJoinId, saving,
    handleCreate, handleJoin, handleLeave, handleDelete, isAdmin,
    query, setQuery, filteredGroups,
    activeGroupId, summaries, togglePin, openGroup,
  } = useDriverGroupesScreen()

  return (
    <div className="max-w-2xl mx-auto pb-4">
      <GroupesHeader
        privateCount={groups.length}
        onCreate={() => setShowCreate(true)}
        onJoin={() => setShowJoin(true)}
      />

      {groups.length > 0 && (
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-500" strokeWidth={1.8} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans mes groupes"
            className="w-full h-11 pl-10 pr-4 rounded-full border border-warm-200 bg-paper text-[13px] text-ink placeholder:text-warm-500 focus:outline-none focus:border-ink transition-colors"
          />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : groups.length === 0 ? (
        <EmptyState onCreate={() => setShowCreate(true)} onJoin={() => setShowJoin(true)} />
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-warm-200 bg-paper p-8 text-center text-[13px] text-warm-600 mb-6">
          Aucun groupe ne correspond à « {query} »
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isAdmin={isAdmin(group)}
              isActive={group.id === activeGroupId}
              summary={summaries[group.id] ?? null}
              onOpen={openGroup}
              onLeave={handleLeave}
              onDelete={handleDelete}
              onTogglePin={() => togglePin(group.id)}
            />
          ))}
        </div>
      )}

      {groups.length > 0 && (
        <button
          type="button"
          onClick={() => setShowJoin(true)}
          className="w-full text-center text-[12.5px] font-semibold text-warm-600 hover:text-ink py-2 inline-flex items-center justify-center gap-1.5 transition-colors"
        >
          <Link2 className="w-3.5 h-3.5" strokeWidth={1.8} />
          Rejoindre un autre groupe avec un code
        </button>
      )}

      {showCreate && (
        <CreateGroupModal
          newName={newName}
          setNewName={setNewName}
          newDesc={newDesc}
          setNewDesc={setNewDesc}
          saving={saving}
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {showJoin && (
        <JoinGroupModal
          joinId={joinId}
          setJoinId={setJoinId}
          saving={saving}
          onSubmit={handleJoin}
          onClose={() => setShowJoin(false)}
        />
      )}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3 mb-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
      ))}
    </div>
  )
}

function EmptyState({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center mb-6">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center mb-3">
        <Users className="w-5 h-5 text-warm-600" strokeWidth={1.8} />
      </div>
      <p className="text-[16px] font-bold text-ink mb-1">
        Aucun groupe pour l&apos;instant
      </p>
      <p className="text-[13px] text-warm-600 mb-4 max-w-xs mx-auto">
        Rejoins un groupe avec son code, ou crée le tien pour inviter tes collègues.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        <button
          type="button"
          onClick={onJoin}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full border border-warm-200 bg-paper text-ink text-[13px] font-semibold hover:bg-warm-50 transition-colors"
        >
          <Link2 className="w-4 h-4" strokeWidth={1.8} />
          J&apos;ai un code
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-paper text-[13px] font-semibold hover:bg-warm-800 transition-colors"
        >
          Créer un groupe
        </button>
      </div>
    </div>
  )
}
