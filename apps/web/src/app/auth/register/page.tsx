import { Suspense } from 'react'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { redirectIfAuthed } from '@/lib/authPageGuard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Rejoignez +2 400 chauffeurs professionnels sur TaxiLink Pro. Inscription gratuite pour chauffeurs de taxi et VTC.',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ redirect?: string }>
}

export default async function RegisterPage({ searchParams }: Props) {
  const { redirect } = await searchParams
  await redirectIfAuthed(redirect)
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
