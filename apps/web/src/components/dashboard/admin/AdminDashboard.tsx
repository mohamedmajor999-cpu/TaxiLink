'use client'

import { AiUsageSection } from './AiUsageSection'
import { GoogleCostsSection } from './GoogleCostsSection'
import { MissionsSection } from './MissionsSection'
import { UsersSection } from './UsersSection'

export function AdminDashboard() {
  return (
    <main className="min-h-screen bg-bgsoft px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-secondary md:text-4xl">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-muted">Activité, coûts API et utilisateurs</p>
        </header>

        <div className="space-y-8">
          <UsersSection />
          <MissionsSection />
          <AiUsageSection />
          <GoogleCostsSection />
        </div>
      </div>
    </main>
  )
}
