import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Nouveau mot de passe',
  description: 'Choisissez un nouveau mot de passe pour votre compte TaxiLink Pro.',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
