'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface Props {
  onEnter: () => void
}

export function OnboardingWelcome({ onEnter }: Props) {
  return (
    <div className="min-h-[100dvh] w-full bg-white flex flex-col pwa-safe-top pwa-safe-bottom animate-fade-in">
      <div className="flex-1 flex flex-col items-center px-6 pt-16">
        <Image
          src="/brand/icon.svg"
          alt=""
          width={112}
          height={112}
          priority
          className="w-20 h-20 md:w-24 md:h-24 drop-shadow-sm"
        />

        <h1 className="mt-8 text-[36px] md:text-[40px] font-extrabold tracking-[-0.035em] leading-[1.05] text-center text-ink">
          Prêt à{' '}
          <span className="inline-block bg-brand px-2 rounded-md -rotate-[1.5deg]">
            rouler
          </span>{' '}
          ?
        </h1>

        <p className="mt-4 text-[15px] md:text-[16px] leading-[1.5] text-warm-500 text-center max-w-[34ch]">
          Rejoignez les chauffeurs qui ont dit adieu à WhatsApp. Postez une course à la voix, un collègue l&apos;attrape.
        </p>

        <div className="mt-10 flex items-center gap-3">
          {['Inscription', 'Vérification', 'En route'].map((t, i) => (
            <div key={t} className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-warm-500">
                <span className="w-6 h-6 rounded-full bg-brand grid place-items-center text-ink font-black text-[11px]">
                  {i + 1}
                </span>
                {t}
              </span>
              {i < 2 && <span aria-hidden className="w-4 h-px bg-warm-200" />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-6 flex flex-col gap-3">
        <Link
          href="/auth/register"
          onClick={onEnter}
          className="inline-flex items-center justify-center gap-2 w-full h-14 rounded-full bg-ink text-white font-bold text-[16px] active:scale-[0.98] transition-transform"
        >
          Créer un compte
          <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
        </Link>
        <Link
          href="/auth/login"
          onClick={onEnter}
          className="inline-flex items-center justify-center w-full h-14 rounded-full border-2 border-ink text-ink font-semibold text-[16px] active:scale-[0.98] transition-transform"
        >
          J&apos;ai déjà un compte
        </Link>

        <p className="text-center text-[11px] text-warm-500 leading-[1.5] px-4 mt-2">
          En continuant, vous acceptez nos <span className="font-semibold text-ink">Conditions</span> et notre{' '}
          <span className="font-semibold text-ink">Politique de confidentialité</span>. Données hébergées en France 🇫🇷
        </p>
      </div>
    </div>
  )
}
