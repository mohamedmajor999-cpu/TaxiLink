'use client'

import Image from 'next/image'

interface Props {
  onNext: () => void
}

export function OnboardingSplash({ onNext }: Props) {
  return (
    <div className="min-h-[100dvh] w-full bg-brand flex flex-col items-center justify-center px-6 pwa-safe-top pwa-safe-bottom animate-fade-in">
      <div className="flex flex-col items-center gap-5">
        <Image
          src="/brand/icon.svg"
          alt=""
          width={120}
          height={120}
          priority
          className="w-24 h-24 md:w-28 md:h-28 drop-shadow-sm"
        />
        <Image
          src="/brand/logo-wordmark.svg"
          alt="TaxiLink Pro"
          width={360}
          height={71}
          priority
          className="h-11 md:h-12 w-auto"
        />
        <p className="text-ink/80 font-semibold tracking-tight text-[15px] md:text-[17px]">
          Partagez vos courses. Gagnez plus.
        </p>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="absolute bottom-24 left-6 right-6 h-14 rounded-2xl bg-ink text-paper font-semibold text-[15px] tracking-tight hover:bg-ink/90 active:scale-[0.98] transition"
      >
        Suivant
      </button>

      <p className="absolute bottom-10 left-0 right-0 text-center text-ink/55 text-[11px] font-semibold uppercase tracking-[0.22em]">
        Built by drivers · for drivers
      </p>
    </div>
  )
}
