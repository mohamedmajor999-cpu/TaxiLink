'use client'

import { AnimatePresence } from 'framer-motion'
import { useDriverStore } from '@/store/driverStore'
import { useSortedMissions } from '@/store/missionStore'
import { useNavStore } from '@/store/navStore'
import { OnlineToggle } from './OnlineToggle'
import { DayStats } from './DayStats'
import { CurrentMissionCard } from './CurrentMissionCard'
import { MissionCard } from './MissionCard'
import { SortFilters } from './SortFilters'
import { Icon } from '@/components/ui/Icon'

export function FluxScreen() {
  const { driver } = useDriverStore()
  const missions = useSortedMissions()
  const { setScreen } = useNavStore()

  const firstName = driver.name.split(' ')[0]

  return (
    <div className="px-5 pt-5 pb-28 hide-scrollbar">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-muted font-medium uppercase tracking-wider mb-1">
              Bonjour,
            </div>
            <div className="text-2xl font-bold tracking-tight text-secondary">
              {driver.name}
            </div>
          </div>

          <button
            onClick={() => setScreen('profil')}
            aria-label="Voir le profil"
            className="avatar-border w-12 h-12 rounded-xl overflow-hidden shadow-soft"
          >
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {firstName[0]}
            </div>
          </button>
        </div>

        {/* Online Toggle */}
        <OnlineToggle />
      </div>

      {/* Day stats */}
      <div className="mb-5">
        <DayStats />
      </div>

      {/* Current mission */}
      <CurrentMissionCard />

      {/* Sort filters */}
      <div className="mb-4">
        <SortFilters />
      </div>

      {/* Available missions header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight text-secondary">
          Courses disponibles
        </h2>
        <div className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-full">
          {missions.length} nouvelles
        </div>
      </div>

      {/* Mission list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {missions.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-bgsoft flex items-center justify-center mb-3">
                <Icon name="explore_off" size={32} className="text-muted" />
              </div>
              <div className="font-semibold text-secondary mb-1">
                Aucune mission disponible
              </div>
              <div className="text-xs text-muted">
                Revenez dans quelques instants
              </div>
            </div>
          ) : (
            missions.map((mission, i) => (
              <MissionCard key={mission.id} mission={mission} index={i} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <button
        onClick={() => setScreen('creer')}
        aria-label="Nouvelle mission manuelle"
        className="fab fixed right-6 bottom-28 w-14 h-14 rounded-2xl bg-primary flex items-center justify-center z-40"
      >
        <Icon name="add" size={30} className="text-secondary" />
      </button>
    </div>
  )
}
