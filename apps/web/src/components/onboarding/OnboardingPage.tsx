'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { VoiceSimulator } from './VoiceSimulator'
import { OnboardingCtaSection } from './OnboardingCtaSection'
import { OnboardingStickyBar } from './OnboardingStickyBar'

const PATRON_STEPS = [
  { n: '01', icon: 'gps_fixed',     title: 'Géolocaliser ses voitures en temps réel',  desc: 'Suivez chaque véhicule en direct. Sachez qui est disponible, où et quand.' },
  { n: '02', icon: 'calendar_month', title: "Gérer l'agenda de ses chauffeurs",         desc: "Visualisez l'emploi du temps de chaque chauffeur. Agenda jour ou semaine." },
  { n: '03', icon: 'send',           title: 'Assigner des courses à ses chauffeurs',    desc: 'Publiez une course depuis votre tableau de bord. Elle apparaît immédiatement.' },
  { n: '04', icon: 'bar_chart',      title: 'Voir les stats de chaque chauffeur',       desc: 'Distances, courses complétées, revenus — tout en un seul écran.' },
]

const SOLUTION_FEATURES = [
  { icon: 'group',                title: 'Réseau de collègues',        desc: 'Échangez des courses avec des chauffeurs que vous connaissez. Fini WhatsApp.',                                    color: 'bg-yellow-50 text-yellow-600', highlight: true  },
  { icon: 'notifications_active', title: 'Confirmation automatique',   desc: "Dès qu'un collègue récupère votre course, vous recevez une notification instantanée.",                          color: 'bg-blue-50 text-blue-600',   highlight: false },
  { icon: 'calendar_month',       title: 'Agenda synchronisé',         desc: "La course acceptée s'ajoute automatiquement à l'agenda du chauffeur. Zéro saisie.",                             color: 'bg-green-50 text-green-600', highlight: false },
]

export function OnboardingPage() {
  const lastSectionRef = useRef<HTMLDivElement>(null)
  const [showCta, setShowCta] = useState(false)

  useEffect(() => {
    const el = lastSectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShowCta(true) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-xl font-black text-secondary">T</div>
            <span className="text-lg font-black text-secondary tracking-tight">TaxiLink <span className="text-primary">Pro</span></span>
          </Link>
          <Link href="/auth/login" className="text-sm font-semibold text-muted hover:text-secondary transition-colors">
            Se connecter
          </Link>
        </div>
      </header>

      <div className="pt-16">
        {/* ══ SECTION 1 — Le problème ══════════════════════════════════════════ */}
        <section className="bg-secondary py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
              <Icon name="warning" size={16} className="text-red-400" />
              <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Le problème</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
              Poster une course en roulant ?{' '}
              <span className="text-red-400">Cauchemar.</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-xl">
              Taper une adresse, un prix, une heure… pendant que vous conduisez.
              C&apos;est long, dangereux, et souvent trop tard.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["Parlez, l'IA remplit tout", 'Poster en 30 secondes chrono', 'Créez une annonce sans quitter la route', "Dicter = poster, c'est tout"].map(t => (
                <span key={t} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs font-semibold text-white/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {t}
                </span>
              ))}
            </div>
            <VoiceSimulator />
          </div>
        </section>

        {/* ══ SECTION 2 — La solution chauffeur ════════════════════════════════ */}
        <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-secondary/5 rounded-full px-4 py-2 mb-8">
              <Icon name="handshake" size={16} className="text-secondary" />
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Pour les chauffeurs</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-secondary leading-tight mb-4">
              Votre réseau,{' '}
              <span className="text-primary">organisé et fiable.</span>
            </h2>
            <div className="grid sm:grid-cols-3 gap-5 mt-10">
              {SOLUTION_FEATURES.map(f => (
                <div key={f.title} className={`p-6 rounded-2xl border transition-all ${f.highlight ? 'border-primary bg-primary/5' : 'border-line hover:border-primary/40 hover:shadow-card'}`}>
                  <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-4`}>
                    <Icon name={f.icon} size={22} />
                  </div>
                  <h3 className="font-black text-secondary text-base mb-2">{f.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SECTION 3 — Le côté patron ═══════════════════════════════════════ */}
        <section className="bg-bgsoft py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-8">
              <Icon name="corporate_fare" size={16} className="text-secondary" />
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Pour les patrons de flotte</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-secondary leading-tight mb-4">Vous gérez une flotte ?</h2>
            <p className="text-muted text-lg leading-relaxed mb-10">TaxiLink vous donne une vue complète sur vos chauffeurs et vos véhicules, en temps réel.</p>
            <div className="space-y-5">
              {PATRON_STEPS.map(s => (
                <div key={s.n} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-black text-secondary text-sm">{s.n}</div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name={s.icon} size={16} className="text-secondary" />
                      <h4 className="font-bold text-secondary text-sm">{s.title}</h4>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <OnboardingCtaSection sectionRef={lastSectionRef} />
      </div>

      <OnboardingStickyBar show={showCta} />
    </div>
  )
}
