'use client'

import { useState } from 'react'
import { DriverProfile } from './DriverProfile'
import { DriverStats } from './DriverStats'
import { DriverDocuments } from './DriverDocuments'

type SubTab = 'profil' | 'stats' | 'documents'

const subTabs: { id: SubTab; label: string }[] = [
  { id: 'profil',     label: 'Mon profil'  },
  { id: 'stats',      label: 'Statistiques' },
  { id: 'documents',  label: 'Documents'   },
]

export function DriverProfilTab({ driverName }: { driverName: string }) {
  const [active, setActive] = useState<SubTab>('profil')

  return (
    <div>
      <div className="flex gap-1 bg-bgsoft rounded-2xl p-1 mb-6 w-fit">
        {subTabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              active === id
                ? 'bg-white text-secondary shadow-soft'
                : 'text-muted hover:text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {active === 'profil'    && <DriverProfile driverName={driverName} />}
      {active === 'stats'     && <DriverStats />}
      {active === 'documents' && <DriverDocuments />}
    </div>
  )
}
