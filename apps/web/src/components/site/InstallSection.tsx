'use client'

import Link from 'next/link'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { Smartphone, Share, Plus, CheckCircle2, ArrowRight } from 'lucide-react'
import { useInstallSection } from './useInstallSection'
import { InstallButton } from './InstallButton'

const STEPS = [
  { icon: Share,        title: 'Ouvrez le menu Partager',        desc: 'Sur Safari (iOS) ou Chrome (Android).' },
  { icon: Plus,         title: 'Sur l\'écran d\'accueil',         desc: '"Ajouter à l\'écran d\'accueil" depuis le menu.' },
  { icon: CheckCircle2, title: 'Ouvrez TaxiLink Pro',            desc: 'L\'icône apparaît comme une vraie app.' },
]

export function InstallSection() {
  const { appUrl } = useInstallSection()

  return (
    <section id="installer" className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[1.5px] px-3 py-1.5 rounded-md bg-teal-50 text-teal-600 mb-4">
          <Smartphone className="w-3.5 h-3.5" strokeWidth={2.2} />
          Installer sur mobile
        </div>
        <h2 className="font-extrabold tracking-[-1.8px] leading-[1.05] text-[clamp(32px,5vw,56px)] max-w-[18ch] mx-auto">
          TaxiLink, <span className="text-warm-300">dans votre poche.</span>
        </h2>
        <p className="text-[16.5px] text-warm-500 max-w-[520px] mx-auto mt-4 leading-relaxed">
          Pas d&apos;App Store, pas de Play Store. Une PWA légère, rapide, qui fonctionne hors ligne.
        </p>
      </div>

      <div className="grid md:grid-cols-[1.1fr_1fr] gap-6 md:gap-10 items-stretch">
        <div className="bg-white border border-warm-200 rounded-[22px] p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="flex-shrink-0 p-4 bg-white rounded-2xl border-2 border-warm-100 shadow-soft">
            <QRCodeSVG value={appUrl} size={168} bgColor="#FFFFFF" fgColor="#000000" level="M" />
          </div>

          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-warm-500 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              Scannez avec votre téléphone
            </div>
            <h3 className="font-extrabold tracking-[-0.8px] text-[22px] md:text-[26px] leading-tight mb-3">
              Installez en 30 secondes.
            </h3>
            <p className="text-[14.5px] text-warm-500 leading-relaxed mb-5">
              Pointez l&apos;appareil photo vers le QR code ci-contre. Ou ouvrez directement <span className="font-semibold text-ink">{appUrl.replace(/^https?:\/\//, '')}</span> sur votre téléphone.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <InstallButton label="Installer en 1 clic" />
              <Link
                href="/telecharger"
                className="inline-flex items-center gap-1 h-11 px-4 rounded-full text-[13.5px] font-semibold text-warm-600 hover:text-ink transition-colors"
              >
                Guide détaillé
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-ink text-white rounded-[22px] p-6 md:p-10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-brand opacity-[0.12] blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/brand/icon.svg" alt="" width={44} height={44} className="w-11 h-11" />
              <div>
                <div className="font-extrabold text-[17px] tracking-tight">TaxiLink Pro</div>
                <div className="text-[12px] text-warm-300">App · iOS &amp; Android</div>
              </div>
            </div>

            <ol className="space-y-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand text-ink grid place-items-center font-black text-[13px]">
                    {i + 1}
                  </span>
                  <div className="pt-0.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <s.icon className="w-4 h-4 text-brand" strokeWidth={2.2} />
                      <h4 className="font-bold text-[14px]">{s.title}</h4>
                    </div>
                    <p className="text-[13px] text-warm-300 leading-relaxed">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-300">
              <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand" />Hors ligne</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand" />Notifications</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand" />Auto-mis à jour</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
