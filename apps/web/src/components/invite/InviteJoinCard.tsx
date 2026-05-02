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
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-8 lg:grid lg:grid-cols-2 lg:py-0 lg:gap-0">
      <aside className="hidden lg:flex flex-col justify-between bg-ink text-paper p-12 xl:p-16 min-h-screen relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
        <Link href="/" className="relative inline-flex items-center" aria-label="TaxiLink Pro">
          <Image src="/brand/logo-primary.svg" alt="TaxiLink Pro" width={180} height={32} priority className="h-8 w-auto brightness-0 invert" />
        </Link>
        <div className="relative max-w-md">
          <p className="text-brand text-sm font-bold uppercase tracking-wider mb-4">Invitation chauffeur</p>
          <h2 className="text-4xl xl:text-5xl font-black leading-tight mb-6">Échangez des<br />courses entre<br />collègues.</h2>
          <p className="text-paper/70 leading-relaxed">Plus de désordre dans le groupe WhatsApp : appui long sur une course, elle est à vous.</p>
        </div>
        <div className="relative space-y-2 text-[13px] text-paper/70">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" strokeWidth={2} /> 100 % RGPD, données en France</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" strokeWidth={2} /> Aucune commission sur vos courses</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" strokeWidth={2} /> Compte gratuit, sans engagement</div>
        </div>
      </aside>

      <div className="w-full lg:flex lg:items-center lg:justify-center lg:px-8 lg:min-h-screen">
      <div className="w-full max-w-md bg-paper border border-warm-200 rounded-3xl shadow-card p-6 md:p-8 text-center mx-auto">
        <div className="flex items-center justify-center mb-4 lg:hidden">
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

        <p className="mt-5 text-[11px] text-warm-500 lg:hidden">
          © TaxiLink Pro · Partage de courses entre chauffeurs
        </p>
      </div>
      </div>
    </div>
  )
}
