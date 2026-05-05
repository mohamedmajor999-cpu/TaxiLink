'use client'
import { useState } from 'react'
import { useCurrentOrg } from '@/hooks/useCurrentOrg'
import { organizationService, buildInvitationLink } from '@/services/organizationService'
import { Icon } from '@/components/ui/Icon'

type Channel = 'email' | 'sms' | 'whatsapp'

interface Props {
  open: boolean
  onClose: () => void
}

export function InviteMemberModal({ open, onClose }: Props) {
  const { orgId, organization } = useCurrentOrg()
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState<Channel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [linkSent, setLinkSent] = useState<string | null>(null)

  if (!open) return null

  const isEmail = contact.includes('@')
  const isPhone = !isEmail && /[0-9+]{6,}/.test(contact)
  const valid = isEmail || isPhone

  const handleInvite = async (channel: Channel) => {
    if (!orgId || !valid) return
    setSubmitting(channel)
    setError(null)
    try {
      const result = await organizationService.inviteMember(
        orgId,
        contact,
        isEmail ? 'email' : 'phone',
        'viewer'
      )
      const link = result.link
      const orgName = organization?.name ?? 'ma flotte'
      const message = `Salut ! Je t'invite a rejoindre ${orgName} sur TaxiLink. Clique : ${link}`
      const deepLink = buildDeepLink(channel, contact, message, isEmail)
      setLinkSent(link)
      window.open(deepLink, '_blank')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(null)
    }
  }

  const handleClose = () => {
    setContact('')
    setError(null)
    setLinkSent(null)
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="max-w-md w-full rounded-2xl bg-paper dark:bg-night-surface border border-warm-200 dark:border-night-border p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-extrabold text-ink dark:text-night-text">Inviter un chauffeur</h3>
        <p className="text-xs text-warm-600 dark:text-night-text-soft mt-1">
          Envoyez un lien d&apos;invitation par email, SMS ou WhatsApp
        </p>

        <label className="block mt-4">
          <span className="text-xs font-bold text-warm-700 dark:text-night-text-soft uppercase tracking-wide">Email ou téléphone</span>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="ex: chauffeur@mail.com  ou  06 12 34 56 78"
            className="mt-1 w-full h-11 px-3 rounded-xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-bg text-sm text-ink dark:text-night-text placeholder:text-warm-400"
            autoFocus
          />
        </label>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        {linkSent && (
          <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
            <p className="text-xs text-green-700 dark:text-green-400 font-medium">
              ✓ Invitation créée. Si la fenêtre ne s&apos;est pas ouverte, copiez le lien :
            </p>
            <p className="text-[11px] text-warm-700 dark:text-night-text-soft mt-1 break-all font-mono">{linkSent}</p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <ChannelButton label="Email" icon="mail" disabled={!isEmail || submitting !== null} loading={submitting === 'email'} onClick={() => handleInvite('email')} />
          <ChannelButton label="SMS" icon="sms" disabled={!isPhone || submitting !== null} loading={submitting === 'sms'} onClick={() => handleInvite('sms')} />
          <ChannelButton label="WhatsApp" icon="chat" disabled={!isPhone || submitting !== null} loading={submitting === 'whatsapp'} onClick={() => handleInvite('whatsapp')} brand />
        </div>

        <button type="button" onClick={handleClose} className="mt-4 w-full h-10 rounded-xl border border-warm-200 dark:border-night-border text-sm font-medium text-warm-700 dark:text-night-text-soft">
          Fermer
        </button>
      </div>
    </div>
  )
}

function ChannelButton({ label, icon, disabled, loading, onClick, brand }: { label: string; icon: string; disabled: boolean; loading: boolean; onClick: () => void; brand?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 ${
        brand ? 'bg-[#25D366] text-white hover:bg-[#1eb858]' : 'bg-ink dark:bg-night-brand text-paper dark:text-night-bg hover:opacity-90'
      }`}
    >
      <Icon name={loading ? 'progress_activity' : icon} size={20} className={loading ? 'animate-spin' : ''} />
      {label}
    </button>
  )
}

function buildDeepLink(channel: Channel, contact: string, message: string, isEmail: boolean): string {
  const encoded = encodeURIComponent(message)
  if (channel === 'email' && isEmail) {
    return `mailto:${contact}?subject=${encodeURIComponent('Invitation TaxiLink')}&body=${encoded}`
  }
  if (channel === 'sms' && !isEmail) {
    return `sms:${normalizePhoneForLink(contact)}?body=${encoded}`
  }
  if (channel === 'whatsapp' && !isEmail) {
    return `https://wa.me/${waNumber(contact)}?text=${encoded}`
  }
  return '#'
}

function normalizePhoneForLink(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits
}

function waNumber(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '')
  if (digits.startsWith('0')) return '33' + digits.slice(1)
  if (digits.startsWith('33')) return digits
  return digits
}
