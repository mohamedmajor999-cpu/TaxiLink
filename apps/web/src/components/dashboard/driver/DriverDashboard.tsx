'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { useDriverStore } from '@/store/driverStore'
import { useDriverAuth } from './useDriverAuth'
import { DriverMissions } from './DriverMissions'
import { DriverAgenda } from './DriverAgenda'
import { DriverStats } from './DriverStats'
import { DriverProfile } from './DriverProfile'
import { DriverPayments } from './DriverPayments'
import { DriverDocuments } from './DriverDocuments'

type Tab = 'missions' | 'agenda' | 'stats' | 'paiements' | 'documents' | 'profil'

const navItems: { tab: Tab; icon: string; label: string }[] = [
  { tab: 'missions',  icon: 'explore',        label: 'Missions'  },
  { tab: 'agenda',    icon: 'calendar_month',  label: 'Agenda'    },
  { tab: 'stats',     icon: 'bar_chart',       label: 'Stats'     },
  { tab: 'paiements', icon: 'payments',        label: 'Paiements' },
  { tab: 'documents', icon: 'folder',          label: 'Documents' },
  { tab: 'profil',    icon: 'person',          label: 'Profil'    },
]

export function DriverDashboard() {
  const { driverName, loading, handleLogout } = useDriverAuth()
  const [activeTab, setActiveTab] = useState<Tab>('missions')
  const { driver, setOnline } = useDriverStore()

  if (loading) {
    return (
      <div className="min-h-screen bg-bgsoft flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Icon name="sync" size={24} className="animate-spin text-primary" />
          <span className="font-semibold text-muted">Chargement...</span>
        </div>
      </div>
    )
  }

  const firstName = driverName.split(' ')[0]

  return (
    <div className="min-h-screen bg-bgsoft flex flex-col">
      <header className="bg-white border-b border-line sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-lg font-black text-secondary">T</div>
                <span className="font-black text-secondary hidden sm:block">TaxiLink <span className="text-primary">Pro</span></span>
              </Link>
              <div className="hidden sm:block w-px h-6 bg-line" />
              <div className="hidden sm:block">
                <span className="text-sm text-muted">Bonjour, </span>
                <span className="text-sm font-bold text-secondary">{firstName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setOnline(!driver.isOnline)}
                aria-label={driver.isOnline ? 'Passer hors ligne' : 'Passer en ligne'}
                className={`flex items-center gap-2 h-9 px-4 rounded-xl font-semibold text-sm transition-all ${
                  driver.isOnline ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-bgsoft text-muted border border-line'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${driver.isOnline ? 'bg-green-500 status-pulse' : 'bg-muted'}`} />
                {driver.isOnline ? 'En ligne' : 'Hors ligne'}
              </button>

              <button onClick={handleLogout} aria-label="Déconnexion"
                className="w-9 h-9 rounded-xl bg-bgsoft border border-line flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors">
                <Icon name="logout" size={16} />
              </button>
            </div>
          </div>

          <nav className="hidden md:flex gap-1 -mb-px">
            {navItems.map(({ tab, icon, label }) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab ? 'border-primary text-secondary' : 'border-transparent text-muted hover:text-secondary'
                }`}>
                <Icon name={icon} size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'missions'  && <DriverMissions isOnline={driver.isOnline} />}
        {activeTab === 'agenda'    && <DriverAgenda />}
        {activeTab === 'stats'     && <DriverStats />}
        {activeTab === 'paiements' && <DriverPayments />}
        {activeTab === 'documents' && <DriverDocuments />}
        {activeTab === 'profil'    && <DriverProfile driverName={driverName} />}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-line px-1 py-2 grid grid-cols-6 gap-0.5 z-40">
        {navItems.map(({ tab, icon, label }) => (
          <button key={tab} onClick={() => setActiveTab(tab)} aria-label={label}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${
              activeTab === tab ? 'bg-primary text-secondary' : 'text-muted'
            }`}>
            <Icon name={icon} size={20} />
            <span className="text-[10px] font-semibold mt-1">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
