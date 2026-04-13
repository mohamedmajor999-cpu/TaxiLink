'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { useDriverStore } from '@/store/driverStore'
import { useDriverAuth } from './useDriverAuth'
import { DriverMissions } from './DriverMissions'
import { DriverAgenda } from './DriverAgenda'
import { DriverProfilTab } from './DriverProfilTab'

type Tab = 'missions' | 'agenda' | 'profil'

const leftItems:  { tab: Tab; icon: string; label: string }[] = [
  { tab: 'missions', icon: 'explore',        label: 'Missions' },
  { tab: 'agenda',   icon: 'calendar_month', label: 'Agenda'   },
]
const rightItems: { tab: Tab; icon: string; label: string }[] = [
  { tab: 'profil', icon: 'person', label: 'Profil' },
]

export function DriverDashboard() {
  const { driverName, loading, handleLogout } = useDriverAuth()
  const [activeTab, setActiveTab] = useState<Tab>('missions')
  const [showCreer, setShowCreer] = useState(false)
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
                  driver.isOnline
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-bgsoft text-muted border border-line'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${driver.isOnline ? 'bg-green-500 status-pulse' : 'bg-muted'}`} />
                {driver.isOnline ? 'En ligne' : 'Hors ligne'}
              </button>

              <button
                onClick={handleLogout}
                aria-label="Déconnexion"
                className="w-9 h-9 rounded-xl bg-bgsoft border border-line flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
              >
                <Icon name="logout" size={16} />
              </button>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 -mb-px">
            {leftItems.map(({ tab, icon, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-secondary'
                    : 'border-transparent text-muted hover:text-secondary'
                }`}
              >
                <Icon name={icon} size={16} />
                {label}
              </button>
            ))}

            <button
              onClick={() => setShowCreer(true)}
              aria-label="Partager une mission"
              className="mx-3 flex items-center gap-2 h-9 px-5 rounded-xl bg-primary text-secondary font-bold text-sm hover:bg-yellow-400 transition-all shadow-sm"
            >
              <Icon name="add" size={20} />
              Partager une mission
            </button>

            {rightItems.map(({ tab, icon, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-secondary'
                    : 'border-transparent text-muted hover:text-secondary'
                }`}
              >
                <Icon name={icon} size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'missions' && <DriverMissions isOnline={driver.isOnline} />}
        {activeTab === 'agenda'   && <DriverAgenda />}
        {activeTab === 'profil'   && <DriverProfilTab driverName={driverName} />}
      </main>

      {/* Modal — Partager une mission */}
      {showCreer && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreer(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-secondary">Partager une mission</h2>
              <button onClick={() => setShowCreer(false)} aria-label="Fermer"
                className="w-9 h-9 rounded-xl bg-bgsoft flex items-center justify-center hover:bg-line transition-colors">
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon name="share" size={32} className="text-primary" />
              </div>
              <p className="font-bold text-secondary">Fonctionnalité en cours de développement</p>
              <p className="text-sm text-muted max-w-xs">
                Tu pourras bientôt créer une mission et la partager avec les autres chauffeurs du réseau.
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-line px-1 pt-2 pb-2 grid grid-cols-4 z-40"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {leftItems.map(({ tab, icon, label }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-label={label}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${
              activeTab === tab ? 'bg-primary text-secondary' : 'text-muted'
            }`}
          >
            <Icon name={icon} size={20} />
            <span className="text-[10px] font-semibold mt-1">{label}</span>
          </button>
        ))}

        {/* Bouton + central surélevé */}
        <div className="flex items-end justify-center pb-1">
          <button
            onClick={() => setShowCreer(true)}
            aria-label="Partager une mission"
            className="w-14 h-14 rounded-full bg-primary text-secondary flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-all -translate-y-3 border-4 border-white"
          >
            <Icon name="add" size={28} />
          </button>
        </div>

        {rightItems.map(({ tab, icon, label }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-label={label}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${
              activeTab === tab ? 'bg-primary text-secondary' : 'text-muted'
            }`}
          >
            <Icon name={icon} size={20} />
            <span className="text-[10px] font-semibold mt-1">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
