'use client'

import Image from 'next/image'

export function OnboardingSplash() {
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

      <p className="absolute bottom-12 left-0 right-0 text-center text-ink/55 text-[11px] font-semibold uppercase tracking-[0.22em]">
        Built by drivers · for drivers
      </p>
    </div>
  )
}
