'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Download, CheckCircle2, Loader2 } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

interface Props {
  /** Style principal noir sur brand jaune (hero) ou secondaire (inline). */
  variant?: 'primary' | 'secondary'
  /** Libellé affiché quand l'installation est possible. */
  label?: string
  className?: string
}

/**
 * Bouton d'installation PWA en 1 clic. Tombe sur /telecharger si le navigateur
 * ne propose pas la prompt native (Safari iOS notamment).
 */
export function InstallButton({ variant = 'primary', label = 'Télécharger l’app', className = '' }: Props) {
  const { canInstall, isInstalled, install } = useInstallPrompt()
  const [busy, setBusy] = useState(false)

  const base =
    variant === 'primary'
      ? 'bg-ink text-paper hover:bg-warm-800 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.35)]'
      : 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'
  const cls = `inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl md:rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] ${base} ${className}`

  if (isInstalled) {
    return (
      <Link href="/dashboard/chauffeur" className={cls}>
        <CheckCircle2 className="w-4 h-4 text-brand" strokeWidth={2.4} />
        Ouvrir l&apos;app
      </Link>
    )
  }

  if (canInstall) {
    const onClick = async () => {
      setBusy(true)
      try { await install() } finally { setBusy(false) }
    }
    return (
      <button type="button" onClick={onClick} disabled={busy} className={`${cls} disabled:opacity-60`}>
        {busy
          ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
          : <Download className="w-4 h-4 text-brand" strokeWidth={2.4} />}
        {busy ? 'Installation…' : label}
      </button>
    )
  }

  // Safari iOS / navigateurs sans beforeinstallprompt : on redirige vers la page guidée.
  return (
    <Link href="/telecharger" className={cls}>
      <Download className="w-4 h-4 text-brand" strokeWidth={2.4} />
      {label}
    </Link>
  )
}
