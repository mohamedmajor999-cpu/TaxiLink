'use client'

import dynamic from 'next/dynamic'
import { AiUsageSection } from './AiUsageSection'
import { GoogleCostsSection } from './GoogleCostsSection'
import { MissionsSection } from './MissionsSection'
import { GpsTrackingSection } from './GpsTrackingSection'
import { UsersSection } from './UsersSection'
import { TopDriversSection } from './TopDriversSection'
import { TopGroupsSection } from './TopGroupsSection'
import { FunnelSection } from './FunnelSection'
import { HeatmapSection } from './HeatmapSection'
import { BreakdownSection } from './BreakdownSection'

const OnlineDriversMap = dynamic(
  () => import('./OnlineDriversMap').then((m) => m.OnlineDriversMap),
  { ssr: false }
)

export function AdminDashboard() {
  return (
    <main className="min-h-screen bg-bgsoft">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted ring-1 ring-line/60">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              Pilotage TaxiLink
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-secondary md:text-3xl">Dashboard Admin</h1>
            <p className="mt-1 text-sm text-muted">Activité, coûts API, classements et géolocalisation</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-2 text-xs text-muted shadow-soft ring-1 ring-line/60">
            Données : 12 derniers mois · refresh à chaque chargement
          </div>
        </header>

        <div className="space-y-6">
          <Stagger index={0}><UsersSection /></Stagger>
          <Stagger index={1}><OnlineDriversMap /></Stagger>
          <Stagger index={2}><MissionsSection /></Stagger>
          <Stagger index={3}><GpsTrackingSection /></Stagger>
          <Stagger index={4}><FunnelSection /></Stagger>
          <Stagger index={5}><HeatmapSection /></Stagger>
          <Stagger index={6}><BreakdownSection /></Stagger>
          <Stagger index={7}><TopDriversSection /></Stagger>
          <Stagger index={8}><TopGroupsSection /></Stagger>
          <Stagger index={9}><AiUsageSection /></Stagger>
          <Stagger index={10}><GoogleCostsSection /></Stagger>
        </div>
      </div>
    </main>
  )
}

function Stagger({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div
      className="animate-slide-up opacity-0 [animation-fill-mode:forwards]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {children}
    </div>
  )
}
