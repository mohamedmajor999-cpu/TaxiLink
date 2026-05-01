import { MissionDetailScreen } from '@/components/dashboard/driver/MissionDetailScreen'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Détail de la course' }

interface Props {
  params: { id: string }
}

export default function Page({ params }: Props) {
  return (
    <main className="min-h-screen bg-paper">
      <MissionDetailScreen missionId={params.id} />
    </main>
  )
}
