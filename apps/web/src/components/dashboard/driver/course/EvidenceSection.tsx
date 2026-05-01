'use client'
import { useRef, useState } from 'react'
import { Camera, Check, FileSignature, Loader2, type LucideIcon } from 'lucide-react'

interface Props {
  signatureSaved: boolean
  voucherSaved: boolean
  uploading: 'signature' | 'voucher' | null
  onOpenSignature: () => void
  onPickVoucher: (file: File) => void
}

export function EvidenceSection({
  signatureSaved,
  voucherSaved,
  uploading,
  onOpenSignature,
  onPickVoucher,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (file) {
      try {
        onPickVoucher(file)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Échec du téléversement')
      }
    }
    e.target.value = ''
  }

  return (
    <section className="rounded-2xl border border-warm-200 bg-paper p-4 mb-3">
      <header className="mb-3">
        <h3 className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-warm-500">
          Preuves CPAM
        </h3>
        <p className="text-[11px] text-warm-500 mt-0.5">
          Indispensables pour la facturation sécu.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Tile
          label="Signature patient"
          done={signatureSaved}
          loading={uploading === 'signature'}
          icon={FileSignature}
          onClick={onOpenSignature}
        />
        <Tile
          label="Bon de transport"
          done={voucherSaved}
          loading={uploading === 'voucher'}
          icon={Camera}
          onClick={() => inputRef.current?.click()}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {error && (
        <p className="mt-2 text-[12px] text-danger">{error}</p>
      )}
    </section>
  )
}

interface TileProps {
  label: string
  done: boolean
  loading: boolean
  icon: LucideIcon
  onClick: () => void
}

function Tile({ label, done, loading, icon: Icon, onClick }: TileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={[
        'relative flex flex-col items-center justify-center gap-1.5 h-20 rounded-xl border text-[12px] font-bold transition',
        done
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : 'bg-paper border-warm-200 text-ink hover:bg-warm-50',
      ].join(' ')}
      aria-label={`${label}${done ? ' — fait' : ''}`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
      ) : done ? (
        <Check className="w-5 h-5" strokeWidth={2.6} />
      ) : (
        <Icon className="w-5 h-5" strokeWidth={2} />
      )}
      <span>{done ? `${label} ✓` : label}</span>
    </button>
  )
}
