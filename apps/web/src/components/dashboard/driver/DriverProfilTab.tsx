'use client'

import { useDriverProfilTab } from './useDriverProfilTab'
import { DriverProfile } from './DriverProfile'
import { DriverStats } from './DriverStats'
import { DriverDocuments } from './DriverDocuments'

export function DriverProfilTab({ driverName }: { driverName: string }) {
  const { active, setActive, subTabs } = useDriverProfilTab()

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
