// Types pour la section "Suivi GPS automatique" du dashboard admin.
// Reflète ce que renvoie /api/admin/gps-tracking — agrégats sur 30 jours
// + les 30 dernières courses avec leurs jalons (timestamps remplis).

export interface GpsTrackingFlags {
  enroute:       boolean
  arrivedPickup: boolean
  pickup:        boolean
  arrivedDest:   boolean
  dropoff:       boolean
  completed:     boolean
}

export interface GpsTrackingCounters {
  total:            number
  fullAuto:         number
  partialAuto:      number
  noAuto:           number
  fullAutoPct:      number
  partialAutoPct:   number
  noAutoPct:        number
  avgWaitPickupMin: number | null
  avgWaitDestMin:   number | null
}

export interface GpsTrackingMission {
  id:          string
  type:        string | null
  scheduledAt: string
  patientName: string | null
  driverName:  string
  flags:       GpsTrackingFlags
}

export interface GpsTrackingReport {
  counters: GpsTrackingCounters
  recent:   GpsTrackingMission[]
}
