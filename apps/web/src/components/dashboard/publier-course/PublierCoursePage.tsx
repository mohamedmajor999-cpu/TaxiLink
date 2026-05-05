'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDriverStore } from '@/store/driverStore'
import { useUnseenAcceptCount } from '@/store/postedAcceptStore'
import { MobileNavDrawer } from '@/components/taxilink/MobileNavDrawer'
import { SidebarNav } from '@/components/taxilink/SidebarNav'
import type { DriverTab } from '@/components/taxilink/navTypes'
import { PosterHeader } from './PosterHeader'
import { PosterVoiceBanner } from './PosterVoiceBanner'
import { PosterPreflight } from './PosterPreflight'
import { PosterCourseForm } from './PosterCourseForm'
import { MissionPublishedCelebration } from '@/components/ui/MissionPublishedCelebration'
import { usePosterCourse } from './usePosterCourse'
import { usePosterPreflight } from './usePosterPreflight'

function computeInitials(name: string): string {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'YB'
}

export function PublierCoursePage() {
  const router = useRouter()
  const c = usePosterCourse()
  const { form } = c
  const preflight = usePosterPreflight({
    driverId: c.driverId,
    myGroups: c.myGroups,
    type: form.type,
    visibility: form.visibility,
    groupIds: form.groupIds,
    setType: form.setType,
    setVisibility: form.setVisibility,
    setGroupIds: form.setGroupIds,
  })
  const { driver } = useDriverStore()
  const unseenAcceptCount = useUnseenAcceptCount()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const initials = computeInitials(driver.name || '')
  const goToTab = (tab: DriverTab) => router.push(`/dashboard/chauffeur?tab=${tab}`)
  // Retour : si on est en Étape 2 (formulaire), revient au sas Étape 1
  // au lieu de quitter la page. Sinon (Étape 1), retour au dashboard.
  const handleBack = () => {
    if (preflight.gatePassed) preflight.resetGate()
    else goToTab('home')
  }

  const footerProps = {
    type: form.type, medicalMotif: form.medicalMotif, returnTrip: form.returnTrip, tpmr: c.tpmr,
    previewFare: c.previewFare, distanceKm: c.distanceKm, durationMin: c.durationMin,
    loadingRoute: c.loadingRoute, saving: c.saving, canSubmit: c.canSubmit, error: c.error,
    onSubmit: () => c.submit(),
    onSubmitAndShare: () => c.submit({ share: true }),
  }

  return (
    <div className="bg-paper min-h-[100dvh] md:flex" style={{ fontFeatureSettings: '"tnum"' }}>
      <SidebarNav
        activeTab={'courses' as DriverTab}
        onTabChange={goToTab}
        onPostCourse={() => { /* on est déjà sur la page poster */ }}
        driverName={driver.name || 'Chauffeur'}
        driverInitials={initials}
        groupName="Taxi13"
        isOnline={driver.isOnline}
        badges={{ coursesNotif: unseenAcceptCount }}
      />

      <main className="flex-1 min-w-0 pb-[200px] max-w-[480px] md:max-w-none lg:pb-12 mx-auto md:mx-0">
        <PosterHeader
          onMenu={() => setDrawerOpen(true)}
          onBack={handleBack}
          hasNotif={unseenAcceptCount > 0}
        />
        <PosterVoiceBanner flow={c.voiceFlow} />

        {!preflight.gatePassed && (
          <PosterPreflight
            myGroups={c.myGroups}
            type={form.type}
            visibility={form.visibility}
            groupIds={form.groupIds}
            onChangeType={(t) => {
              form.setType(t)
              // Switch vers Standard : nettoie les champs CPAM pour eviter
              // qu'ils soient envoyes au submit ou re-affiches si l'user
              // re-bascule sur CPAM. Le bloc "Detail de la prescription"
              // est deja gate par form.type === 'CPAM' dans
              // PosterCourseForm — cette ligne assure juste l'hygiene de
              // l'etat.
              if (t === 'PRIVE') form.setMedicalMotif(null)
            }}
            onSelectPublic={c.onSelectPublic}
            onToggleGroup={c.toggleGroup}
            defaultsRemembered={preflight.matchesSavedDefaults}
            onContinue={preflight.passGate}
          />
        )}

        {preflight.gatePassed && <PosterCourseForm c={c} footerProps={footerProps} />}
      </main>

      {c.published && <MissionPublishedCelebration onDone={c.dismissCelebration} />}

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={'home' as DriverTab}
        onTabChange={goToTab}
        onPostCourse={() => setDrawerOpen(false)}
        driverName={driver.name || 'Chauffeur'}
        driverInitials={initials}
        groupName="Taxi13"
        isOnline={driver.isOnline}
        badges={{ coursesNotif: unseenAcceptCount }}
      />
    </div>
  )
}
