import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre espace TaxiLink Pro pour gérer vos missions, votre agenda et vos revenus.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <LoginForm />
}
