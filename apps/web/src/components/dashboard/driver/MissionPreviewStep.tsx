'use client'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { CourseCard, type CourseCardData } from '@/components/taxilink/CourseCard'

interface Props {
  card: CourseCardData
  isEdit: boolean
  saving: boolean
  error: string | null
  onBack: () => void
  onConfirm: () => void
}

export function MissionPreviewStep({ card, isEdit, saving, error, onBack, onConfirm }: Props) {
  return (
    <div className="bg-paper pb-24 md:pb-6">
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 max-w-2xl mx-auto">
        <h2 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
          Aperçu de la course
        </h2>
        <p className="text-[12px] text-warm-500 mt-0.5">
          Voici la carte telle qu&apos;elle apparaîtra aux autres chauffeurs.
        </p>
      </div>

      <div className="px-4 md:px-8 py-4 max-w-2xl mx-auto">
        <CourseCard course={card} footer={<></>} />

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger-soft p-3 text-[13px] text-danger">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="order-2 md:order-1 h-14 px-6 rounded-2xl border-2 border-warm-200 bg-paper text-ink text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:border-ink hover:bg-warm-50 transition-all disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
            Modifier
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="order-1 md:order-2 h-14 rounded-2xl bg-ink text-paper text-[15px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.35)] hover:bg-warm-800 hover:shadow-[0_10px_28px_-6px_rgba(10,10,10,0.45)] active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                {isEdit ? 'Enregistrement…' : 'Publication…'}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-[18px] h-[18px]" strokeWidth={2.2} />
                {isEdit ? 'Confirmer les modifications' : 'Confirmer et publier'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
