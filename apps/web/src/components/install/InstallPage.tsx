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
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-secondary px-6 pt-8 pb-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🚖</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">TaxiLink Pro</h1>
          <p className="text-white/60 text-sm">App chauffeurs de taxi & VTC</p>
        </div>

        <div className="px-6 py-6 space-y-6">

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">
              Scannez pour ouvrir l&apos;app
            </div>
            <div className="p-4 bg-white rounded-2xl border-2 border-line shadow-soft">
              <QRCodeSVG
                value={appUrl}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#1A1A1A"
                level="M"
                style={{ display: 'block' }}
              />
            </div>
            <div className="mt-3 text-xs text-muted text-center break-all px-2">
              {appUrl}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-muted font-semibold">Puis installez l&apos;app</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          {/* Platform tabs */}
          <div>
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
                    <span className="text-xs font-semibold text-secondary">
                      <span className="text-muted font-bold mr-1">{i + 1}.</span>
                      {step.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open in browser button */}
          <a
            href="/"
            className="w-full h-12 rounded-2xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Icon name="open_in_browser" size={18} />
            Ouvrir l&apos;application
          </a>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line">
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
