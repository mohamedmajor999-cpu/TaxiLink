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
      <div className="flex-1 flex flex-col items-center px-6 pt-14">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-brand grid place-items-center shadow-[0_10px_30px_-10px_rgba(10,10,10,0.25)]">
          <Image
            src="/brand/icon.svg"
            alt=""
            width={112}
            height={112}
            priority
            className="w-14 h-14 md:w-16 md:h-16"
          />
        </div>

        <h1 className="mt-7 text-[36px] md:text-[40px] font-extrabold tracking-[-0.035em] leading-[1.05] text-center text-ink">
          Prêt à{' '}
          <span className="inline-block bg-brand px-2 rounded-md -rotate-[1.5deg]">
            rouler
          </span>{' '}
          ?
        </h1>

        <p className="mt-4 text-[15px] md:text-[16px] leading-[1.5] text-warm-500 text-center max-w-[34ch]">
          Rejoignez les chauffeurs qui ont dit adieu à WhatsApp. Postez une course à la voix, un collègue l&apos;attrape.
        </p>

        <ol className="mt-8 flex flex-col items-start gap-3 self-center">
          {['Inscription', 'Vérification', 'En route'].map((t, i) => (
            <li key={t} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-brand grid place-items-center text-ink font-black text-[12px] shrink-0">
                {i + 1}
              </span>
              <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-ink">
                {t}
              </span>
            </li>
          ))}
        </ol>
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
