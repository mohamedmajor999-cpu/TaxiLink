import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { redirectIfAuthed } from '@/lib/authPageGuard'

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  description: 'Réinitialisez votre mot de passe TaxiLink Pro.',
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage() {
  await redirectIfAuthed(null)
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
