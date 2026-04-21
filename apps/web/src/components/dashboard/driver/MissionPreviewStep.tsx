'use client'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { Group } from '@taxilink/core'
import { CourseCard, type CourseCardData } from '@/components/taxilink/CourseCard'
import { GuidedFieldsRecap } from './guided/GuidedFieldsRecap'

const CourseMap = dynamic(() => import('./course/CourseMap').then((m) => m.CourseMap), { ssr: false })
import type { GuidedQuestion } from './guided/guidedTypes'
import type { MissionFormState } from './useMissionFormState'

interface Coords { lat: number; lng: number }

interface Props {
  card: CourseCardData
  isEdit: boolean
  saving: boolean
  error: string | null
  onBack: () => void
  onConfirm: () => void
  /** Coords pour la carte de prévisualisation ; absent = pas de carte. */
  departureCoords?: Coords | null
  destinationCoords?: Coords | null
  /** Tracé de l'itinéraire calculé (Google Routes / OSRM) ; absent = ligne droite. */
  routeGeometry?: GeoJSON.LineString | null
  /** Récap éditable : chaque champ a un bouton « modifier » qui rappelle onEditField. */
  form?: MissionFormState
  myGroups?: Group[]
  visibleQuestions?: GuidedQuestion[]
  onEditField?: (id: string) => void
}

export function MissionPreviewStep({
  card, isEdit, saving, error, onBack, onConfirm,
  departureCoords, destinationCoords, routeGeometry,
  form, myGroups, visibleQuestions, onEditField,
}: Props) {
  const hasMap = !!departureCoords && !!destinationCoords
  const hasRecap = !!form && !!myGroups && !!visibleQuestions && !!onEditField

  return (
    <div className="bg-paper pb-24 md:pb-6">
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 max-w-2xl mx-auto">
        <h2 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
          Aperçu de la course
        </h2>
        <p className="text-[12px] text-warm-500 mt-0.5">
          Vérifiez tout, puis publiez. Touchez un champ pour le corriger.
        </p>
      </div>

      <div className="px-4 md:px-8 py-4 max-w-2xl mx-auto">
        {hasMap && (
          <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden border border-warm-200 mb-4">
            <CourseMap from={departureCoords!} to={destinationCoords!} routeGeometry={routeGeometry ?? null} />
          </div>
        )}

        <CourseCard course={card} footer={<></>} />

        {hasRecap && (
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-2">
              Détails — touchez pour corriger
            </p>
            <GuidedFieldsRecap
              form={form!} myGroups={myGroups!}
              visibleQuestions={visibleQuestions!}
              currentIndex={-1}
              onEdit={onEditField!}
              variant="summary"
            />
          </div>
        )}

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
            {hasRecap ? 'Continuer à modifier' : 'Modifier'}
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
