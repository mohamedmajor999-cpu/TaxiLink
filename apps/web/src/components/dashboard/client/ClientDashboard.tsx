'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { ReservationForm } from './ReservationForm'
import { MissionList } from './MissionList'
import { useClientAuth } from './useClientAuth'
import { useClientDashboard, Tab } from './useClientDashboard'

export function ClientDashboard() {
  const { clientName, loading, missions, missionsError, refreshMissions, handleLogout } = useClientAuth()
  const { tab, setTab } = useClientDashboard()

  if (loading) {
    return (
      <div className="min-h-screen bg-bgsoft flex items-center justify-center">
        <Icon name="sync" size={28} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bgsoft">
      <header className="bg-white border-b border-line sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-secondary">T</div>
            <span className="font-black text-secondary hidden sm:block">TaxiLink <span className="text-primary">Pro</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted hidden sm:block">
              Bonjour, <strong className="text-secondary">{clientName.split(' ')[0]}</strong>
            </span>
            <button
              onClick={handleLogout}
              aria-label="Déconnexion"
              className="w-9 h-9 rounded-xl bg-bgsoft border border-line flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-1 -mb-px">
          {([
            { t: 'reserver' as Tab, icon: 'add_circle', l: 'Réserver un taxi' },
            { t: 'mes-courses' as Tab, icon: 'history', l: 'Mes courses' },
          ]).map(({ t, icon, l }) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t ? 'border-primary text-secondary' : 'border-transparent text-muted hover:text-secondary'
              }`}
            >
              <Icon name={icon} size={16} />{l}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {missionsError && <ErrorBanner message={missionsError} onRetry={refreshMissions} />}

        {tab === 'reserver' && (
          <ReservationForm
            onBookSuccess={refreshMissions}
            onSwitchToMissions={() => setTab('mes-courses')}
          />
        )}

        {tab === 'mes-courses' && (
          <MissionList
            missions={missions}
            onReserve={() => setTab('reserver')}
          />
        )}
      </main>
    </div>
  )
}
