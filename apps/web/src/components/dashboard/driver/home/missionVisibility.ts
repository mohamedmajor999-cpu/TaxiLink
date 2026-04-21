import type { Mission } from '@/lib/supabase/types'
import type { Group } from '@taxilink/core'
import type { CourseCardData } from '@/components/taxilink/CourseCard'
import type { RideBadgeVariant } from '@/components/taxilink/RideBadge'
import { addressAsPoint } from '@/lib/splitFrenchAddress'
import { computeDisplayFare } from '@/lib/missionFare'

const TYPE_BADGE: Record<string, { variant: RideBadgeVariant; label: string }> = {
  CPAM: { variant: 'medical', label: 'Médical' },
  PRIVE: { variant: 'private', label: 'Privé' },
  TAXILINK: { variant: 'fleet', label: 'TaxiLink' },
}

const PAYMENT_FROM_TYPE: Record<string, 'CPAM' | 'CB' | 'Espèces'> = {
  CPAM: 'CPAM',
  PRIVE: 'Espèces',
  TAXILINK: 'CB',
}

function fmtClient(m: Mission): string {
  const raw = typeof m.patient_name === 'string' ? m.patient_name.trim() : ''
  if (!raw) return 'Client'
  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0]}.`
}

/**
 * Extrait la liste des groupes ciblés par une mission.
 * Source 1 : relation `mission_groups` (embarquée par les queries enrichies).
 * Source 2 (fallback historique) : mention « Visible: id1, id2 » dans `notes`
 *   — pattern laissé pour les missions antérieures à la migration.
 */
export function extractMissionGroupIds(m: Mission): string[] {
  const ids = new Set<string>()
  if (Array.isArray(m.mission_groups)) {
    for (const r of m.mission_groups) {
      if (r?.group_id) ids.add(r.group_id)
    }
  }
  if (m.notes) {
    const match = /Visible\s*:\s*([^·\n]+)/i.exec(m.notes)
    if (match) {
      for (const raw of match[1].split(',')) {
        const v = raw.trim()
        if (v) ids.add(v)
      }
    }
  }
  return Array.from(ids)
}

/** Une mission est « publique » si aucune visibilité de groupe n'est déclarée. */
export function isPublicMission(m: Mission): boolean {
  return extractMissionGroupIds(m).length === 0
}

export function toCourseCard(m: Mission, groupsById: Map<string, Group>): CourseCardData {
  const scheduled = new Date(m.scheduled_at)
  const minutesAhead = Math.round((scheduled.getTime() - Date.now()) / 60_000)
  const isUrgent = m.type === 'CPAM' && minutesAhead >= 0 && minutesAhead <= 5
  const typeBadge = TYPE_BADGE[m.type] ?? TYPE_BADGE.PRIVE

  const groupIds = extractMissionGroupIds(m)
  const groupBadge = groupIds
    .map((id) => groupsById.get(id))
    .find((g): g is Group => !!g)

  const badges: { variant: RideBadgeVariant; label: string }[] = [typeBadge]
  if (groupBadge) badges.push({ variant: 'fleet', label: groupBadge.name })

  const fare = computeDisplayFare(m)

  return {
    id: m.id,
    urgent: isUrgent ? { etaMin: Math.max(minutesAhead, 1) } : undefined,
    scheduledInMin: minutesAhead,
    clientName: fmtClient(m),
    badges,
    from: addressAsPoint(m.departure),
    to: addressAsPoint(m.destination),
    distanceKm: m.distance_km ?? 0,
    durationMin: Math.max(Math.round((m.distance_km ?? 0) * 2.2), 5),
    payment: PAYMENT_FROM_TYPE[m.type] ?? 'Espèces',
    medicalMotif: normalizeMotif(m.medical_motif),
    priceEur: fare.value,
    priceIsEstimated: fare.isEstimated,
    priceMinEur: m.price_min_eur ?? null,
    priceMaxEur: m.price_max_eur ?? null,
  }
}

function normalizeMotif(raw: string | null | undefined): 'HDJ' | 'CONSULTATION' | null {
  if (raw === 'HDJ' || raw === 'CONSULTATION') return raw
  return null
}

