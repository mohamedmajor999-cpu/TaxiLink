import { GroupDetailScreen } from '@/components/dashboard/driver/groupes/GroupDetailScreen'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Détail du groupe' }

interface Props {
  params: { id: string }
}

export default function Page({ params }: Props) {
  return (
    <main className="min-h-screen bg-paper">
      <GroupDetailScreen groupId={params.id} />
    </main>
  )
}
