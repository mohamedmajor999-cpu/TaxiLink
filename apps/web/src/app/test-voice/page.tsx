import { notFound } from 'next/navigation'
import { isAdminPage } from '@/lib/adminAuth'
import { TestVoiceClient } from './TestVoiceClient'

// Page debug Whisper. Reservee a l'admin (ADMIN_EMAIL) pour eviter
// l'acces public — la transcription elle-meme est gatee cote API mais on
// ne veut pas exposer le bouton a tout le monde.
export default async function Page() {
  if (!(await isAdminPage())) notFound()
  return <TestVoiceClient />
}
