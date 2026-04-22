'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, LogIn, Users, CheckCircle2 } from 'lucide-react'
import { useInviteJoinCard } from './useInviteJoinCard'

interface Props {
  groupId: string
}

export function InviteJoinCard({ groupId }: Props) {
  const { isAuthenticated, authLoading, joining, error, done, handleJoin } = useInviteJoinCard(groupId)

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-paper border border-warm-200 rounded-3xl shadow-card p-6 md:p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/brand/logo-primary.svg"
            alt="TaxiLink Pro"
            width={180}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </div>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-ink" strokeWidth={2} />
        </div>

        <h1 className="text-[20px] md:text-[22px] font-bold text-ink tracking-tight mb-2">
          Tu as été invité(e) à rejoindre un groupe
        </h1>
        <p className="text-[13.5px] text-warm-600 mb-6 leading-relaxed">
          TaxiLink Pro — la plateforme de partage de courses entre taxis.
          Rejoins ce groupe pour échanger des courses avec tes collègues.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger-soft p-3 text-[12.5px] text-danger text-left">
            {error}
          </div>
        )}

        {done ? (
          <div className="flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-50 text-emerald-700 text-[13.5px] font-semibold">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            Groupe rejoint
          </div>
        ) : (
          <button
            type="button"
            onClick={handleJoin}
            disabled={authLoading || joining}
            className="w-full h-12 rounded-xl bg-ink text-paper font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors disabled:opacity-60"
          >
            {joining || authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                Connexion…
              </>
            ) : isAuthenticated ? (
              <>
                <Users className="w-4 h-4" strokeWidth={2} />
                Rejoindre le groupe
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" strokeWidth={2} />
                Se connecter pour rejoindre
              </>
            )}
          </button>
        )}

        <p className="mt-4 text-[12px] text-warm-500">
          Pas encore de compte ?{' '}
          <Link
            href={`/auth/register?redirect=${encodeURIComponent(`/rejoindre/${groupId}`)}`}
            className="font-semibold text-ink underline underline-offset-2"
          >
            Créer un compte
          </Link>
        </p>
      </div>

      <p className="mt-5 text-[11px] text-warm-500">
        © TaxiLink Pro · Partage de courses entre chauffeurs
      </p>
    </div>
  )
}
