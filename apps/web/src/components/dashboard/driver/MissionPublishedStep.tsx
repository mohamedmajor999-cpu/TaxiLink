'use client'
import { ThumbsUp } from 'lucide-react'

interface Props {
  isEdit: boolean
  onClose: () => void
}

export function MissionPublishedStep({ isEdit, onClose }: Props) {
  return (
    <div className="bg-paper pb-24 md:pb-6 min-h-[70vh] flex items-center justify-center">
      <div className="px-4 md:px-8 py-10 max-w-md mx-auto text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6">
          <ThumbsUp className="w-9 h-9 text-emerald-600" strokeWidth={2} />
        </div>
        <h2 className="text-[22px] font-bold text-ink leading-tight tracking-tight mb-2">
          {isEdit ? 'Course mise à jour' : 'Annonce publiée'}
        </h2>
        <p className="text-[14px] text-warm-500 mb-8">
          {isEdit
            ? 'Les modifications sont visibles par les autres chauffeurs.'
            : 'Votre course est désormais visible par les chauffeurs concernés.'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-2xl bg-ink text-paper text-[14px] font-semibold hover:bg-warm-800 transition-colors"
        >
          Terminer
        </button>
      </div>
    </div>
  )
}
