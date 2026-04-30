'use client'

import dynamic from 'next/dynamic'
import { AiUsageSection } from './AiUsageSection'
import { GoogleCostsSection } from './GoogleCostsSection'
import { MissionsSection } from './MissionsSection'
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
    <main className="min-h-screen bg-gradient-to-br from-bgsoft via-bgsoft to-indigo-50/40">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-secondary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary ring-1 ring-secondary/10">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Pilotage TaxiLink
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary md:text-4xl">Dashboard Admin</h1>
            <p className="mt-1 text-sm text-muted">Activité, coûts API, classements, conversion et géolocalisation</p>
          </div>
          <div className="rounded-2xl bg-white/70 px-4 py-2 text-xs text-muted shadow-soft ring-1 ring-line/50 backdrop-blur">
            Données : 12 derniers mois · refresh à chaque chargement
          </div>
        </header>

        <div className="space-y-6">
          <Stagger index={0}><UsersSection /></Stagger>
          <Stagger index={1}><OnlineDriversMap /></Stagger>
          <Stagger index={2}><MissionsSection /></Stagger>
          <Stagger index={3}><FunnelSection /></Stagger>
          <Stagger index={4}><HeatmapSection /></Stagger>
          <Stagger index={5}><BreakdownSection /></Stagger>
          <Stagger index={6}><TopDriversSection /></Stagger>
          <Stagger index={7}><TopGroupsSection /></Stagger>
          <Stagger index={8}><AiUsageSection /></Stagger>
          <Stagger index={9}><GoogleCostsSection /></Stagger>
        </div>
      </div>
    </main>
  )
}

// Anime chaque section avec un délai progressif (stagger).
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
