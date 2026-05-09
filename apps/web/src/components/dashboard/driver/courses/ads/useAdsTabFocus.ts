'use client'
import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { usePostedAcceptStore } from '@/store/postedAcceptStore'
import { usePostedUntakenStore } from '@/store/postedUntakenStore'
import type { AdView } from './adsHelpers'
import type { Mission } from '@/lib/supabase/types'

/**
 * Pilote le `selected` (jour affiche dans le WeekStrip) :
 *   1. Auto-focus sur la mission non-vue la plus recente (accept ou untaken),
 *      une seule fois par session "non-vu" pour ne pas bloquer la navigation
 *      libre apres l'atterrissage.
 *   2. Focus explicite via URL `?focus=<id>` depuis le bouton "Voir" du toast :
 *      force le jour cible meme apres navigation manuelle, puis nettoie le param.
 */
export function useAdsTabFocus(
  ads: AdView[],
  missions: Mission[],
  setSelected: (d: Date) => void,
) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const focusParam = searchParams.get('focus')

  const unseenAcceptIds = usePostedAcceptStore((s) => s.unseen)
  const unseenUntakenIds = usePostedUntakenStore((s) => s.unseen)
  const focusedRef = useRef<string | null>(null)

  useEffect(() => {
    const acceptIds = Object.keys(unseenAcceptIds)
    const untakenIds = Object.keys(unseenUntakenIds)
    if (acceptIds.length === 0 && untakenIds.length === 0) { focusedRef.current = null; return }
    const target = ads
      .filter((a) =>
        (a.state === 'accepted' && unseenAcceptIds[a.mission.id]) ||
        (a.state === 'waiting'  && unseenUntakenIds[a.mission.id])
      )
      .sort((x, y) => {
        const xt = new Date(x.mission.accepted_at ?? x.mission.created_at).getTime()
        const yt = new Date(y.mission.accepted_at ?? y.mission.created_at).getTime()
        return yt - xt
      })[0]
    if (!target) return
    if (focusedRef.current === target.mission.id) return
    focusedRef.current = target.mission.id
    setSelected(new Date(target.mission.scheduled_at))
  }, [unseenAcceptIds, unseenUntakenIds, ads, setSelected])

  useEffect(() => {
    if (!focusParam) return
    const target = missions.find((m) => m.id === focusParam)
    if (target) {
      focusedRef.current = focusParam
      setSelected(new Date(target.scheduled_at))
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete('focus')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }, [focusParam, missions, pathname, router, searchParams, setSelected])
}
