import { useState } from 'react'

export type SubTab = 'profil' | 'stats' | 'documents'

export const subTabs: { id: SubTab; label: string }[] = [
  { id: 'profil',    label: 'Mon profil'   },
  { id: 'stats',     label: 'Statistiques' },
  { id: 'documents', label: 'Documents'    },
]

export function useDriverProfilTab() {
  const [active, setActive] = useState<SubTab>('profil')
  return { active, setActive, subTabs }
}
