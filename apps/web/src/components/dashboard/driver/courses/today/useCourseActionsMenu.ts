'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { missionService } from '@/services/missionService'
import { useMissionStore } from '@/store/missionStore'
import { notifyPatientSms } from '@/lib/notifyPatientSms'
import type { Mission } from '@/lib/supabase/types'

interface Options { mission: Mission }

export function useCourseActionsMenu({ mission }: Options) {
  const [open, setOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [noShowOpen, setNoShowOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Click hors menu = fermeture. Mousedown plutôt que click pour ne pas
  // fermer après le mouseup d'un bouton interne.
  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node | null
      if (!target) return
      if (menuRef.current?.contains(target) || btnRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const submitCancel = useCallback(async (reason: string) => {
    if (busy) return
    setBusy(true)
    try {
      await missionService.cancel(mission.id, reason)
      useMissionStore.getState().dismissCurrentMission()
      setCancelOpen(false)
    } finally {
      setBusy(false)
    }
  }, [busy, mission.id])

  const submitNoShow = useCallback(async (reason: string) => {
    if (busy) return
    setBusy(true)
    try {
      await missionService.markNoShow(mission.id, reason)
      useMissionStore.getState().dismissCurrentMission()
      setNoShowOpen(false)
    } finally {
      setBusy(false)
    }
  }, [busy, mission.id])

  return {
    open,
    toggle: () => setOpen((o) => !o),
    close: () => setOpen(false),
    menuRef, btnRef,
    cancelOpen, openCancel: () => { setCancelOpen(true); setOpen(false) }, closeCancel: () => setCancelOpen(false),
    noShowOpen, openNoShow: () => { setNoShowOpen(true); setOpen(false) }, closeNoShow: () => setNoShowOpen(false),
    submitCancel, submitNoShow, busy,
    notifyPatient: () => { notifyPatientSms(mission); setOpen(false) },
  }
}
