'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Icon } from '@/components/ui/Icon'
import { useInstallPage } from './useInstallPage'

export function InstallPage() {
  const { appUrl, activeTab, setActiveTab } = useInstallPage()

  const steps = {
    ios: [
      { icon: 'ios_share', text: 'Ouvrez Safari et tapez "Partager" (⬆)' },
      { icon: 'add_box', text: 'Appuyez sur "Sur l\'écran d\'accueil"' },
      { icon: 'check_circle', text: 'Confirmez avec "Ajouter"' },
    ],
    android: [
      { icon: 'more_vert', text: 'Ouvrez Chrome et tapez "⋮ Menu"' },
      { icon: 'install_mobile', text: 'Sélectionnez "Ajouter à l\'écran d\'accueil"' },
      { icon: 'check_circle', text: 'Confirmez l\'installation' },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-sm md:max-w-3xl lg:max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden md:grid md:grid-cols-[1fr_1.2fr]">

        {/* Header */}
        <div className="bg-secondary px-6 pt-8 pb-6 text-center md:px-10 md:py-10 md:flex md:flex-col md:justify-center md:text-left">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 md:mx-0 md:w-24 md:h-24 md:mb-6">
            <span className="text-4xl md:text-5xl">🚖</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white mb-1 md:mb-3">TaxiLink Pro</h1>
          <p className="text-white/60 text-sm md:text-base">App chauffeurs de taxi & VTC</p>

          {/* Features (desktop only ici) */}
          <div className="hidden md:grid grid-cols-3 gap-3 mt-10">
            {[
              { icon: 'offline_bolt', label: 'Hors ligne' },
              { icon: 'notifications', label: 'Notifications' },
              { icon: 'speed', label: 'Rapide' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Icon name={icon} size={18} className="text-primary" />
                </div>
                <span className="text-[11px] text-white/80 font-semibold text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 md:px-10 md:py-10 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">

          {/* QR Code */}
          <div className="flex flex-col items-center md:items-start">
            <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">
              Scannez pour ouvrir l&apos;app
            </div>
            <div className="p-4 bg-white rounded-2xl border-2 border-line shadow-soft self-center md:self-start">
              <QRCodeSVG
                value={appUrl}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#1A1A1A"
                level="M"
                style={{ display: 'block' }}
              />
            </div>
            <div className="mt-3 text-xs text-muted text-center md:text-left break-all px-2 md:px-0">
              {appUrl}
            </div>

            {/* Open in browser button — visible toujours */}
            <a
              href="/"
              className="w-full h-12 rounded-2xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mt-6"
            >
              <Icon name="open_in_browser" size={18} />
              Ouvrir l&apos;application
            </a>
          </div>

          {/* Divider mobile */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-muted font-semibold">Puis installez l&apos;app</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          {/* Platform tabs */}
          <div>
            <p className="hidden md:block text-xs font-bold text-muted uppercase tracking-wider mb-4">
              Puis installez l&apos;app
            </p>
            <div className="flex bg-bgsoft rounded-xl p-1 mb-4">
              {(['ios', 'android'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab
                      ? 'bg-white shadow-soft text-secondary'
                      : 'text-muted'
                  }`}
                >
                  {tab === 'ios' ? '🍎 iPhone' : '🤖 Android'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {steps[activeTab].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon name={step.icon} size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 pt-1.5">
                    <span className="text-xs md:text-sm font-semibold text-secondary">
                      <span className="text-muted font-bold mr-1">{i + 1}.</span>
                      {step.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features mobile-only */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line md:hidden col-span-full">
            {[
              { icon: 'offline_bolt', label: 'Hors ligne' },
              { icon: 'notifications', label: 'Notifications' },
              { icon: 'speed', label: 'Rapide' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-bgsoft flex items-center justify-center">
                  <Icon name={icon} size={18} className="text-secondary" />
                </div>
                <span className="text-[10px] text-muted font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
