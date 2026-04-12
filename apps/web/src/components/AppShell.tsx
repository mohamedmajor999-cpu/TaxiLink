'use client'

import { useNavStore } from '@/store/navStore'
import { BottomNav } from '@/components/navigation/BottomNav'
import { FluxScreen } from '@/components/flux/FluxScreen'
import { AgendaScreen } from '@/components/agenda/AgendaScreen'
import { ProfilScreen } from '@/components/profil/ProfilScreen'
import { CreerScreen } from '@/components/creer/CreerScreen'
import { HistoriqueScreen } from '@/components/historique/HistoriqueScreen'

export function AppShell() {
  const { activeScreen } = useNavStore()

  return (
    <div
      className="relative bg-white overflow-hidden"
      style={{
        width: 'min(100vw, 390px)',
        height: '100dvh',
        maxHeight: 844,
        borderRadius: 'clamp(0px, (100vw - 390px) * 99, 32px)',
        boxShadow: '0 30px 80px rgba(0,0,0,.25)',
      }}
    >
      {/* Screen content */}
      <div
        className="absolute inset-0 overflow-y-auto overflow-x-hidden hide-scrollbar"
        style={{ paddingBottom: 80 }}
      >
        {activeScreen === 'flux' && <FluxScreen />}
        {activeScreen === 'creer' && <CreerScreen />}
        {activeScreen === 'calendrier' && <AgendaScreen />}
        {activeScreen === 'historique' && <HistoriqueScreen />}
        {activeScreen === 'profil' && <ProfilScreen />}
      </div>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}
