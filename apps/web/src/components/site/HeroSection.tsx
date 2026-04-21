import Link from 'next/link'
import { ArrowRight, Shield, CreditCard, MapPin } from 'lucide-react'
import { HeroFloatingCardsLeft, HeroFloatingCardsRight } from './HeroFloatingCards'
import { HeroPhoneMockup } from './HeroPhoneMockup'

export function HeroSection() {
  return (
    <header className="relative pt-8 pb-12 md:py-16 text-center max-w-7xl mx-auto px-5 md:px-8 overflow-hidden">
      <div aria-hidden className="md:hidden absolute inset-x-0 top-0 h-[520px] pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_center_top,rgba(255,210,26,0.22),transparent_60%)]" />

      <div className="inline-flex items-center gap-2 bg-warm-50 border border-warm-200 rounded-full py-1.5 pl-2 pr-3.5 mb-5 md:mb-7">
        <span className="bg-ink text-brand text-[10.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
        <span className="text-[13px] font-medium text-warm-600">100% gratuit</span>
      </div>

      <h1 className="font-extrabold tracking-[-1.2px] md:tracking-[-2.5px] leading-[1.03] text-[clamp(40px,10.5vw,88px)] mx-auto max-w-[12ch]">
        Fini <span className="bg-brand px-2.5 rounded-lg inline-block -rotate-[1.5deg]">WhatsApp.</span>
        <br />
        <span className="text-warm-300 inline-block mt-2 md:mt-3">Place à</span> TaxiLink.
      </h1>

      <p className="text-[16px] md:text-[18px] text-warm-500 max-w-[540px] mx-auto mt-5 md:mt-6 mb-6 md:mb-6 leading-relaxed px-2">
        Postez une course à la voix. Un collègue l&apos;accepte en un geste.{' '}
        <b className="text-ink font-semibold">30 secondes, zéro appel.</b>
      </p>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-6">
        <Link href="/auth/register" className="group inline-flex items-center justify-center gap-2 bg-ink text-white font-semibold text-[16px] w-full sm:w-auto px-6 py-[18px] md:py-3.5 rounded-2xl md:rounded-lg shadow-button active:scale-[0.98] hover:bg-warm-800 transition-all md:hover:-translate-y-px">
          S&apos;inscrire gratuitement
          <ArrowRight className="w-4 h-4 transition-transform group-active:translate-x-0.5" strokeWidth={2.4} />
        </Link>
        <Link href="/auth/login" className="md:hidden text-[14px] font-semibold text-warm-600 px-4 py-2">
          Déjà inscrit ? <span className="text-ink underline underline-offset-4 decoration-2 decoration-brand">Se connecter</span>
        </Link>
      </div>

      <ul className="md:hidden flex items-center justify-center gap-4 text-[12px] text-warm-600 font-medium mb-8 flex-wrap">
        <li className="inline-flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-warm-500" strokeWidth={2} />Sans CB</li>
        <li aria-hidden className="w-1 h-1 rounded-full bg-warm-200" />
        <li className="inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-warm-500" strokeWidth={2} />Serveurs FR</li>
        <li aria-hidden className="w-1 h-1 rounded-full bg-warm-200" />
        <li className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-warm-500" strokeWidth={2} />Marseille</li>
      </ul>

      <div className="max-w-[960px] mx-auto mt-4 md:mt-8">
        <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-8">
          <div className="hidden md:block"><HeroFloatingCardsLeft /></div>
          <div className="mx-auto"><HeroPhoneMockup /></div>
          <div className="hidden md:block"><HeroFloatingCardsRight /></div>
        </div>
      </div>
    </header>
  )
}
