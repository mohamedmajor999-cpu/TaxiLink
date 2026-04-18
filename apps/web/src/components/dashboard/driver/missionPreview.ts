import type { CourseCardData } from '@/components/taxilink/CourseCard'
import type { RideBadgeVariant } from '@/components/taxilink/RideBadge'
import type { Group } from '@taxilink/core'
import type { MissionFormType } from './missionFormHelpers'

const TYPE_BADGE: Record<MissionFormType, { variant: RideBadgeVariant; label: string }> = {
  CPAM: { variant: 'medical', label: 'Médical' },
  PRIVE: { variant: 'private', label: 'Privé' },
}

const PAYMENT_FROM_TYPE: Record<MissionFormType, 'CPAM' | 'CB' | 'Espèces'> = {
  CPAM: 'CPAM',
  PRIVE: 'Espèces',
}

function fmtClient(name: string): string {
  const raw = name.trim()
  if (!raw) return 'Client'
  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0]}.`
}

export interface BuildPreviewArgs {
  type: MissionFormType
  patientName: string
  departure: string
  destination: string
  distanceKm: number | null
  durationMin: number | null
  priceEur: number
  scheduledAtIso: string | null
  groupName?: string | null
  medicalMotif?: 'HDJ' | 'CONSULTATION' | null
}

export function buildPreviewCard(args: BuildPreviewArgs): CourseCardData {
  const badges: { variant: RideBadgeVariant; label: string }[] = [TYPE_BADGE[args.type]]
  if (args.groupName) badges.push({ variant: 'fleet', label: args.groupName })

  const minutesAhead = args.scheduledAtIso
    ? Math.round((new Date(args.scheduledAtIso).getTime() - Date.now()) / 60_000)
    : 0
  const isUrgent = args.type === 'CPAM' && minutesAhead >= 0 && minutesAhead <= 5

  return {
    id: 'preview',
    urgent: isUrgent ? { etaMin: Math.max(minutesAhead, 1) } : undefined,
    scheduledInMin: minutesAhead,
    clientName: fmtClient(args.patientName),
    badges,
    from: { name: args.departure },
    to: { name: args.destination },
    distanceKm: args.distanceKm ?? 0,
    durationMin: args.durationMin ?? Math.max(Math.round((args.distanceKm ?? 0) * 2.2), 0),
    payment: PAYMENT_FROM_TYPE[args.type],
    medicalMotif: args.medicalMotif ?? null,
    priceEur: args.priceEur,
  }
}

export function findGroupName(groups: Group[], groupId: string | null): string | null {
  if (!groupId) return null
  const g = groups.find((x) => x.id === groupId)
  return g?.name ?? null
}
