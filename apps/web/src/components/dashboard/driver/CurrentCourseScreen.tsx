'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Navigation2, Phone, XCircle } from 'lucide-react'
import { RouteTimeline } from '@/components/taxilink/RouteTimeline'
import { addressAsPoint } from '@/lib/splitFrenchAddress'
import { useCurrentCourse } from './course/useCurrentCourse'
import { CancelMissionDialog } from './course/CancelMissionDialog'

const CourseMap = dynamic(() => import('./course/CourseMap').then((m) => m.CourseMap), { ssr: false })

export function CurrentCourseScreen() {
  const c = useCurrentCourse()

  if (c.loading) return <LoadingSkeleton />
  if (!c.mission) return <NoCurrentMission />

  const mission = c.mission
  const trafficMin = c.traffic ? Math.round(c.traffic.durationSec / 60) : null
  const routeMin = c.route ? Math.round(c.route.durationSec / 60) : null
  const km = c.route ? (c.route.distanceM / 1000).toFixed(1)
    : c.traffic ? (c.traffic.distanceM / 1000).toFixed(1)
    : null

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <header className="flex items-center justify-between gap-3 mb-4">
        <Link
          href="/dashboard/chauffeur"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-warm-600 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Retour
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-paper text-[12px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-brand motion-safe:animate-pulse" />
          Course en cours
        </span>
      </header>

      <article className="rounded-3xl border border-warm-200 bg-paper overflow-hidden shadow-soft mb-4">
        <div className="relative h-64 md:h-80 bg-warm-50">
          {c.from && c.to ? (
            <CourseMap from={c.from} to={c.to} routeGeometry={c.route?.geometry ?? null} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[13px] text-warm-500">
              Coordonnées GPS manquantes pour cette course
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 border-t border-warm-200">
          <Stat label="Distance" value={km ? `${km} km` : '—'} />
          <Stat
            label="Temps"
            value={trafficMin ? `${trafficMin} min` : routeMin ? `${routeMin} min` : '—'}
            sub={trafficMin ? 'trafic réel' : routeMin ? 'hors trafic' : undefined}
            border
          />
          <Stat
            label="Arrivée"
            value={computeEta(c.traffic?.durationSec ?? c.route?.durationSec ?? null)}
            border
          />
        </div>
      </article>

      <div className="rounded-2xl border border-warm-200 bg-paper p-5 mb-4">
        <RouteTimeline
          from={addressAsPoint(mission.departure)}
          to={addressAsPoint(mission.destination)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {c.gmapsHref && (
          <a
            href={c.gmapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="h-14 rounded-2xl bg-ink text-paper text-[14px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors"
          >
            <Navigation2 className="w-4 h-4" strokeWidth={2} />
            Google Maps
          </a>
        )}
        {c.wazeHref && (
          <a
            href={c.wazeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="h-14 rounded-2xl bg-[#33CCFF] text-ink text-[14px] font-semibold inline-flex items-center justify-center gap-2 hover:brightness-95 transition-colors"
          >
            <Navigation2 className="w-4 h-4" strokeWidth={2} />
            Waze
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {mission.phone && (
          <a
            href={`tel:${mission.phone.replace(/\s/g, '')}`}
            className="h-12 rounded-xl bg-paper border border-warm-300 text-ink text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-warm-50 transition-colors"
          >
            <Phone className="w-4 h-4" strokeWidth={2} />
            Appeler
          </a>
        )}
        {c.smsHref && (
          <a
            href={c.smsHref}
            className="h-12 rounded-xl bg-paper border border-warm-300 text-ink text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-warm-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" strokeWidth={2} />
            J&apos;arrive
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={() => c.setCancelOpen(true)}
        className="w-full h-12 rounded-xl border border-danger/40 bg-paper text-danger text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-danger-soft transition-colors"
      >
        <XCircle className="w-4 h-4" strokeWidth={2} />
        Annuler la course
      </button>

      <CancelMissionDialog
        open={c.cancelOpen}
        submitting={c.cancelling}
        onClose={() => c.setCancelOpen(false)}
        onSubmit={c.cancel}
      />
    </div>
  )
}

function computeEta(durationSec: number | null): string {
  if (!durationSec) return '—'
  const eta = new Date(Date.now() + durationSec * 1000)
  return eta.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function Stat({
  label, value, sub, border = false,
}: { label: string; value: string; sub?: string; border?: boolean }) {
  return (
    <div className={`p-4 ${border ? 'border-l border-warm-200' : ''}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-1">{label}</p>
      <p className="text-[20px] md:text-[22px] font-bold text-ink tabular-nums tracking-tight leading-none">{value}</p>
      {sub && <p className="text-[10px] text-warm-500 mt-1">{sub}</p>}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <div className="h-8 w-24 rounded-lg bg-warm-100 motion-safe:animate-pulse mb-4" />
      <div className="h-80 rounded-3xl bg-warm-100 motion-safe:animate-pulse mb-4" />
      <div className="h-24 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
    </div>
  )
}

function NoCurrentMission() {
  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <Link href="/dashboard/chauffeur" className="inline-flex items-center gap-2 text-[13px] font-semibold text-warm-600 hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        Retour
      </Link>
      <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center">
        <p className="text-[20px] font-bold text-ink mb-2 tracking-tight">Aucune course en cours</p>
        <p className="text-sm text-warm-600">Vous n&apos;avez pas de course active pour l&apos;instant.</p>
      </div>
    </div>
  )
}
