'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
import { PatronSidebar } from '@/components/dashboard/patron/PatronSidebar'
import { PosterHeader } from '@/components/dashboard/publier-course/PosterHeader'
import { PosterVoiceBanner } from '@/components/dashboard/publier-course/PosterVoiceBanner'
import { PosterPreflight } from '@/components/dashboard/publier-course/PosterPreflight'
import { PosterCourseForm } from '@/components/dashboard/publier-course/PosterCourseForm'
import { MissionPublishedCelebration } from '@/components/ui/MissionPublishedCelebration'
import { usePosterCourse } from '@/components/dashboard/publier-course/usePosterCourse'
import { usePosterPreflight } from '@/components/dashboard/publier-course/usePosterPreflight'

export function PatronPublierCoursePage() {
  const router = useRouter()
  const { user } = useAuth()
  const loadDriver = useDriverStore((s) => s.load)
  // Le patron arrive ici sans avoir transité par /dashboard/chauffeur, donc
  // le driverStore n'a jamais été init. usePosterCourse en a besoin pour
  // récupérer driverId (sinon getMyGroups renvoie vide).
  useEffect(() => {
    if (user) loadDriver(user.id, user.email ?? '')
  }, [user, loadDriver])

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

  const goBack = () => router.push('/dashboard/patron')
  const handleBack = () => {
    if (preflight.gatePassed) preflight.resetGate()
    else goBack()
  }
  const handlePost = () => { /* on est déjà sur la page poster */ }

  const footerProps = {
    type: form.type, medicalMotif: form.medicalMotif, returnTrip: form.returnTrip, tpmr: c.tpmr,
    previewFare: c.previewFare, distanceKm: c.distanceKm, durationMin: c.durationMin,
    loadingRoute: c.loadingRoute, saving: c.saving, canSubmit: c.canSubmit, error: c.error,
    onSubmit: c.submit,
  }

  return (
    <div className="bg-paper dark:bg-night-bg min-h-[100dvh] md:flex" style={{ fontFeatureSettings: '"tnum"' }}>
      <PatronSidebar activeTab="agenda" onTabChange={goBack} onPostCourse={handlePost} />

      <main className="flex-1 min-w-0 pb-[200px] max-w-[480px] md:max-w-none lg:pb-12 mx-auto md:mx-0">
        <PosterHeader onMenu={() => undefined} onBack={handleBack} hasNotif={false} />
        <PosterVoiceBanner flow={c.voiceFlow} />

        {!preflight.gatePassed && (
          <PosterPreflight
            myGroups={c.myGroups}
            type={form.type}
            visibility={form.visibility}
            groupIds={form.groupIds}
            onChangeType={(t) => {
              form.setType(t)
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
    </div>
  )
}
