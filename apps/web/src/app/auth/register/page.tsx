import { Suspense } from 'react'
import { RegisterForm } from '@/components/auth/RegisterForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Rejoignez +2 400 chauffeurs professionnels sur TaxiLink Pro. Inscription gratuite pour chauffeurs de taxi et VTC.',
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
