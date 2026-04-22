import { CurrentCourseScreen } from '@/components/dashboard/driver/CurrentCourseScreen'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Course en cours' }

export default function Page() {
  return (
    <main className="min-h-screen bg-paper">
      <CurrentCourseScreen />
    </main>
  )
}
