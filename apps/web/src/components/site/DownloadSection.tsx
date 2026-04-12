import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

export function DownloadSection() {
  return (
    <section id="telecharger" className="py-24 bg-bgsoft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-secondary rounded-3xl overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left */}
            <div className="px-10 py-14">
              <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-2 mb-6">
                <Icon name="smartphone" size={16} className="text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Application mobile</span>
              </div>
              <h2 className="text-4xl font-black text-white mb-4 leading-tight">
                Toujours avec vous,<br />
                <span className="text-primary">même hors ligne</span>
              </h2>
              <p className="text-white/60 text-base leading-relaxed mb-8">
                Installez l'application depuis votre navigateur en 30 secondes.
                Pas besoin de l'App Store. Fonctionne sur iPhone et Android. Notifications push incluses.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/telecharger"
                  className="h-12 px-6 rounded-xl bg-primary text-secondary font-bold text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple">
                  <Icon name="qr_code" size={18} />
                  Scanner le QR code
                </Link>
                <Link href="/telecharger"
                  className="h-12 px-6 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors btn-ripple">
                  <Icon name="open_in_browser" size={18} />
                  Voir les instructions
                </Link>
              </div>
              {/* Features */}
              <div className="space-y-2.5">
                {[
                  'Fonctionne hors ligne',
                  'Notifications push',
                  'Mise à jour automatique',
                  'Léger — zéro espace de stockage',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="check" size={12} className="text-primary" />
                    </div>
                    <span className="text-white/70 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — QR preview */}
            <div className="flex items-center justify-center p-10 bg-white/5">
              <div className="text-center">
                <div className="bg-white rounded-2xl p-6 inline-block shadow-2xl mb-4">
                  {/* QR placeholder — sur /telecharger le vrai QR est généré dynamiquement */}
                  <div className="w-40 h-40 bg-secondary rounded-lg flex items-center justify-center">
                    <div className="grid grid-cols-7 grid-rows-7 gap-0.5 p-2">
                      {Array.from({ length: 49 }).map((_, i) => {
                        const corners = [0,1,2,6,7,13,14,15,16,20,21,27,28,29,30,34,35,41,42,43,48]
                        const isOn = corners.includes(i) || Math.random() > 0.5
                        return <div key={i} className={`w-2 h-2 rounded-[1px] ${isOn ? 'bg-primary' : 'bg-transparent'}`} />
                      })}
                    </div>
                  </div>
                </div>
                <p className="text-white/70 text-sm font-semibold mb-1">Scannez pour installer</p>
                <p className="text-white/40 text-xs">Voir le vrai QR → <Link href="/telecharger" className="text-primary underline">Page téléchargement</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
