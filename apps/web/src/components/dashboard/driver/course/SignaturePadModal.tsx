'use client'
import { Eraser, X } from 'lucide-react'
import { useSignaturePad } from './useSignaturePad'

interface Props {
  open: boolean
  submitting: boolean
  onClose: () => void
  onSubmit: (dataUrl: string) => void
}

export function SignaturePadModal({ open, submitting, onClose, onSubmit }: Props) {
  const pad = useSignaturePad()

  if (!open) return null

  const handleConfirm = () => {
    const dataUrl = pad.toDataUrl()
    if (dataUrl) onSubmit(dataUrl)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sig-title"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-paper rounded-t-3xl md:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-warm-200">
          <div>
            <h2 id="sig-title" className="text-[18px] font-bold text-ink tracking-tight">
              Signature du patient
            </h2>
            <p className="text-[11.5px] text-warm-500 mt-0.5">
              Faire signer dans le cadre ci-dessous
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-full hover:bg-warm-50 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-ink" strokeWidth={2} />
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-2xl border-2 border-dashed border-warm-300 bg-warm-50 overflow-hidden touch-none">
            <canvas
              ref={pad.canvasRef}
              onPointerDown={pad.onPointerDown}
              onPointerMove={pad.onPointerMove}
              onPointerUp={pad.onPointerUp}
              onPointerLeave={pad.onPointerUp}
              className="block w-full h-48 cursor-crosshair"
              aria-label="Zone de signature"
            />
          </div>
          <button
            type="button"
            onClick={pad.clear}
            disabled={!pad.hasInk || submitting}
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-warm-600 hover:text-ink disabled:opacity-50"
          >
            <Eraser className="w-3.5 h-3.5" strokeWidth={2.2} />
            Effacer
          </button>
        </div>

        <div className="p-5 pt-0 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-12 rounded-xl border border-warm-300 bg-paper text-ink text-[14px] font-semibold hover:bg-warm-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!pad.hasInk || submitting}
            className="h-12 rounded-xl bg-ink text-paper text-[14px] font-semibold hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? 'Envoi…' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}
