'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { Navbar } from '@/components/site/Navbar'
import { Footer } from '@/components/site/Footer'
import { Icon } from '@/components/ui/Icon'

export function DownloadPage() {
  const [appUrl, setAppUrl] = useState('https://taxilink-pro.app')
  useEffect(() => { setAppUrl(window.location.origin) }, [])

  const [activeOs, setActiveOs] = useState<'ios'|'android'>('ios')

  const steps = {
    ios: [
      { icon: 'open_in_browser', title: 'Ouvrez Safari', desc: 'Assurez-vous d\'utiliser Safari sur iPhone/iPad (pas Chrome ou Firefox).' },
      { icon: 'ios_share', title: 'Appuyez sur Partager', desc: 'Tapez l\'icône de partage ⬆ en bas de Safari.' },
      { icon: 'add_box', title: 'Sur l\'écran d\'accueil', desc: 'Faites défiler et appuyez sur "Sur l\'écran d\'accueil".' },
      { icon: 'check_circle', title: 'Confirmez', desc: 'Appuyez sur "Ajouter" en haut à droite. L\'app apparaît sur votre écran d\'accueil !' },
    ],
    android: [
      { icon: 'open_in_browser', title: 'Ouvrez Chrome', desc: 'Assurez-vous d\'utiliser Chrome sur Android.' },
      { icon: 'more_vert', title: 'Menu Chrome', desc: 'Appuyez sur les 3 points ⋮ en haut à droite.' },
      { icon: 'install_mobile', title: 'Ajouter à l\'écran', desc: 'Sélectionnez "Ajouter à l\'écran d\'accueil".' },
      { icon: 'check_circle', title: 'Installez', desc: 'Confirmez l\'installation. L\'app est prête !' },
    ],
  }

  return (
    <div className="min-h-screen bg-bgsoft">
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Hero */}
        <div className="bg-secondary py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-2 mb-6">
              <Icon name="smartphone" size={16} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Application mobile PWA</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              TaxiLink Pro<br /><span className="text-primary">dans votre poche</span>
            </h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Installez l'application en 30 secondes. Pas d'App Store, pas de Play Store. Juste votre navigateur.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-start">

            {/* QR Code */}
            <div className="bg-white rounded-3xl shadow-card p-8 text-center">
              <h2 className="text-xl font-black text-secondary mb-2">Scannez avec votre téléphone</h2>
              <p className="text-muted text-sm mb-8">Pointez l'appareil photo de votre téléphone vers ce QR code</p>

              <div className="inline-block p-5 bg-white rounded-2xl border-2 border-line shadow-soft">
                <QRCodeSVG value={appUrl} size={220} bgColor="#FFFFFF" fgColor="#1A1A1A" level="M" />
              </div>

              <p className="text-xs text-muted mt-4 break-all">{appUrl}</p>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { icon: 'offline_bolt', label: 'Hors ligne' },
                  { icon: 'notifications_active', label: 'Notifications' },
                  { icon: 'update', label: 'Auto-mis à jour' },
                ].map(f => (
                  <div key={f.label} className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Icon name={f.icon} size={18} className="text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-muted">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Installation steps */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-soft p-2 flex gap-1">
                {(['ios','android'] as const).map(os => (
                  <button key={os} onClick={() => setActiveOs(os)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeOs===os?'bg-secondary text-white shadow-button':'text-muted hover:text-secondary'}`}>
                    {os === 'ios' ? '🍎 iPhone / iPad' : '🤖 Android'}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {steps[activeOs].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-soft p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-black text-secondary text-lg flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name={s.icon} size={16} className="text-secondary" />
                        <h3 className="font-bold text-secondary">{s.title}</h3>
                      </div>
                      <p className="text-sm text-muted">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct link */}
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Icon name="info" size={18} className="text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-secondary text-sm mb-1">Déjà sur votre téléphone ?</p>
                    <p className="text-xs text-muted mb-3">Si vous lisez cette page depuis votre mobile, cliquez directement sur le bouton ci-dessous.</p>
                    <Link href="/"
                      className="inline-flex h-9 px-4 rounded-xl bg-primary text-secondary font-bold text-xs items-center gap-1.5 hover:bg-yellow-400 transition-colors">
                      <Icon name="open_in_browser" size={15} />Ouvrir l'application
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
