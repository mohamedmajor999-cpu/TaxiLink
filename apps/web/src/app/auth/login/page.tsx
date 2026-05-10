import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { redirectIfAuthed } from '@/lib/authPageGuard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre espace TaxiLink Pro pour gérer vos missions, votre agenda et vos revenus.',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { redirect } = await searchParams
  await redirectIfAuthed(redirect)
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
