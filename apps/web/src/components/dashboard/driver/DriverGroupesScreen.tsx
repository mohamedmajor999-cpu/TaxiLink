'use client'

import { Plus, Search, Users } from 'lucide-react'
import { GroupCard } from './GroupCard'
import { GroupMembersModal } from './GroupMembersModal'
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
    selectedGroup, memberStats, statsLoading, statsPeriod, setStatsPeriod,
    openMembers, closeMembers, handleCreate, handleJoin, handleLeave, handleDelete, isAdmin,
    query, setQuery, filteredGroups,
  } = useDriverGroupesScreen()

  return (
    <div className="max-w-2xl mx-auto pb-4">
      <GroupesHeader
        count={groups.length}
        onCreate={() => setShowCreate(true)}
        onJoin={() => setShowJoin(true)}
      />

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-500" strokeWidth={1.8} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher ou rejoindre un groupe"
          className="w-full h-11 pl-10 pr-4 rounded-full border border-warm-200 bg-paper text-[13px] text-ink placeholder:text-warm-500 focus:outline-none focus:border-ink transition-colors"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : groups.length === 0 ? (
        <EmptyState onCreate={() => setShowCreate(true)} />
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
              onViewMembers={openMembers}
              onLeave={handleLeave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-warm-300 bg-paper hover:bg-warm-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
          <Plus className="w-5 h-5 text-ink" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-ink">Créer votre groupe</div>
          <div className="text-[12px] text-warm-500 mt-0.5">
            Invitez vos collègues · Gratuit jusqu&apos;à 10 membres
          </div>
        </div>
      </button>

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

      {selectedGroup && (
        <GroupMembersModal
          group={selectedGroup}
          stats={memberStats}
          loading={statsLoading}
          period={statsPeriod}
          onPeriod={setStatsPeriod}
          isAdmin={isAdmin(selectedGroup)}
          onClose={closeMembers}
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center mb-6">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center mb-3">
        <Users className="w-5 h-5 text-warm-600" strokeWidth={1.8} />
      </div>
      <p className="text-[16px] font-bold text-ink mb-1">
        Aucun groupe pour l&apos;instant
      </p>
      <p className="text-[13px] text-warm-600 mb-4 max-w-xs mx-auto">
        Créez un groupe avec vos collègues ou rejoignez-en un avec son identifiant.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-paper text-[13px] font-semibold hover:bg-warm-800 transition-colors"
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
        Créer un groupe
      </button>
    </div>
  )
}
