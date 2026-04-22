'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMobileStickyCta } from './useMobileStickyCta'

export function MobileStickyCta() {
  const { visible } = useMobileStickyCta()

  return (
    <div
      aria-hidden={!visible}
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none transition-all duration-300 pwa-safe-bottom ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="absolute inset-x-0 bottom-0 h-[140%] bg-gradient-to-t from-white via-white/95 to-white/0 pointer-events-none" />
      <div className="relative px-4 pt-3 pb-3 pointer-events-auto">
        <Link
          href="/auth/register"
          className="group flex items-center justify-center gap-2 w-full bg-ink text-white font-semibold text-[16px] py-[18px] rounded-2xl shadow-toast active:scale-[0.98] transition-transform"
        >
          S&apos;inscrire gratuitement
          <ArrowRight className="w-4 h-4 transition-transform group-active:translate-x-0.5" strokeWidth={2.4} />
        </Link>
      </div>
    </div>
  )
}
