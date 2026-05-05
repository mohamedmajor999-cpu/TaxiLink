'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePatronOverview } from './usePatronOverview'
import { Centered, KPIGrid, RevenueChart, TopDrivers, ActivityList, DocAlertsList } from './PatronOverviewSections'
import { FleetList } from './FleetList'
import { Icon } from '@/components/ui/Icon'
import { InviteMemberModal } from '@/components/dashboard/patron/invitations/InviteMemberModal'
import { DriverDetailDrawer } from '@/components/dashboard/patron/DriverDetailDrawer'
import { MarketplacePreview } from '@/components/dashboard/patron/marketplace/MarketplacePreview'
import { useCurrentOrg } from '@/hooks/useCurrentOrg'

const PatronFleetMap = dynamic(() => import('./PatronFleetMap').then((m) => m.PatronFleetMap), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface h-[400px] flex items-center justify-center text-sm text-warm-600 dark:text-night-text-soft">
      Chargement de la carte…
    </div>
  ),
})

interface Props {
  onGoToMarketplace?: () => void
}

export function PatronOverview({ onGoToMarketplace }: Props = {}) {
  const router = useRouter()
  const { kpis, fleet, activity, docAlerts, isLoading, error } = usePatronOverview()
  const { orgId, role } = useCurrentOrg()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [detailDriverId, setDetailDriverId] = useState<string | null>(null)
  const canManage = role === 'owner' || role === 'admin'

  if (isLoading) return <OverviewSkeleton />
  if (error) return <Centered className="text-danger">Erreur : {error}</Centered>

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink dark:text-night-text">Tableau de bord</h1>
          <p className="text-sm text-warm-600 dark:text-night-text-soft mt-1">Vue d&apos;ensemble de votre flotte</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => router.push('/dashboard/patron/publier-course')} className="h-10 px-4 rounded-xl border border-ink dark:border-night-text text-ink dark:text-night-text text-sm font-bold flex items-center gap-2">
              <Icon name="add_road" size={18} />
              Poster une course
            </button>
            <button type="button" onClick={() => setInviteOpen(true)} className="h-10 px-4 rounded-xl bg-ink dark:bg-night-brand text-paper dark:text-night-bg text-sm font-bold flex items-center gap-2">
              <Icon name="person_add" size={18} />
              Inviter un chauffeur
            </button>
          </div>
        )}
      </header>

      <KPIGrid kpis={kpis} />
      <PatronFleetMap fleet={fleet} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RevenueChart kpis={kpis} />
        <TopDrivers fleet={fleet} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FleetList fleet={fleet} orgId={orgId} canManage={canManage} onPickDriver={setDetailDriverId} />
        <ActivityList activity={activity} />
      </div>

      <MarketplacePreview onGoToMarketplace={onGoToMarketplace} />

      <DocAlertsList alerts={docAlerts} />

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <DriverDetailDrawer driverId={detailDriverId} orgId={orgId} canManage={canManage} onClose={() => setDetailDriverId(null)} />
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-warm-100 dark:bg-night-elevated" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-warm-100 dark:bg-night-elevated" />
        ))}
      </div>
      <div className="h-[400px] rounded-2xl bg-warm-100 dark:bg-night-elevated" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-40 rounded-2xl bg-warm-100 dark:bg-night-elevated lg:col-span-2" />
        <div className="h-40 rounded-2xl bg-warm-100 dark:bg-night-elevated" />
      </div>
    </div>
  )
}
