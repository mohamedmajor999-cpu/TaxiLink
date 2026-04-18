'use client'
import { useState } from 'react'

export type CoursesTab = 'upcoming' | 'agenda' | 'posted' | 'history'

export function useDriverCoursesScreen() {
  const [active, setActive] = useState<CoursesTab>('upcoming')

  const today = new Date()
  const dateLabel = today.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const subTabs: { id: CoursesTab; label: string; icon?: string }[] = [
    { id: 'upcoming', label: 'À venir' },
    { id: 'posted', label: 'Postées' },
    { id: 'agenda', label: 'Agenda', icon: '📅' },
    { id: 'history', label: 'Historique' },
  ]

  return { active, setActive, subTabs, dateLabel }
}
