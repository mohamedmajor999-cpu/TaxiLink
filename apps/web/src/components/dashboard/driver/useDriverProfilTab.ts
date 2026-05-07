import { useState } from 'react'

export type SubTab = 'profil' | 'stats' | 'documents' | 'bloques'

export const subTabs: { id: SubTab; label: string }[] = [
  { id: 'profil',    label: 'Mon profil'   },
  { id: 'stats',     label: 'Statistiques' },
  { id: 'documents', label: 'Documents'    },
  { id: 'bloques',   label: 'Bloqués'      },
]

export function useDriverProfilTab() {
  const [active, setActive] = useState<SubTab>('profil')
  return { active, setActive, subTabs }
}
