import Link from 'next/link'
import { HeroFloatingCardsLeft, HeroFloatingCardsRight } from './HeroFloatingCards'
import { HeroPhoneMockup } from './HeroPhoneMockup'

export function HeroSection() {
  return (
    <header className="py-10 md:py-16 text-center max-w-7xl mx-auto px-4 md:px-8">
      <div className="inline-flex items-center gap-2 bg-warm-50 border border-warm-200 rounded-full py-1.5 pl-2 pr-3.5 mb-5 md:mb-7">
        <span className="bg-ink text-brand text-[10.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
        <span className="text-[13px] font-medium text-warm-600">100% gratuit</span>
      </div>

      <h1 className="font-extrabold tracking-[-1.5px] md:tracking-[-2.5px] leading-[1.02] text-[clamp(36px,9vw,88px)] mx-auto max-w-[12ch]">
        Fini <span className="bg-brand px-2.5 rounded-lg inline-block -rotate-[1.5deg]">WhatsApp.</span>
        <br />
        <span className="text-warm-300 inline-block mt-2 md:mt-3">Place à</span> TaxiLink.
      </h1>

      <p className="text-[16px] md:text-[18px] text-warm-500 max-w-[540px] mx-auto mt-5 md:mt-6 mb-5 md:mb-6 leading-relaxed">
        Postez une course à la voix. Un collègue l&apos;accepte en un geste.{' '}
        <b className="text-ink font-semibold">30 secondes, zéro appel.</b>
      </p>

      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        <Link href="/auth/register" className="inline-flex items-center gap-2 bg-ink text-white font-semibold text-[15px] w-full sm:w-auto justify-center px-6 py-4 md:py-3.5 rounded-lg hover:bg-warm-800 transition-all hover:-translate-y-px">
          S&apos;inscrire
        </Link>
      </div>

      <div className="max-w-[960px] mx-auto mt-6 md:mt-8">
        <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-8">
          <div className="hidden md:block"><HeroFloatingCardsLeft /></div>
          <div className="mx-auto"><HeroPhoneMockup /></div>
          <div className="hidden md:block"><HeroFloatingCardsRight /></div>
        </div>
      </div>
    </header>
  )
}
