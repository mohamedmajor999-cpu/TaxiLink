import type { TaxilinkSupabaseClient } from './client'

// Notifie les autres chauffeurs qu'une mission a ete acceptee. Necessaire
// car la policy SELECT ne retourne plus la ligne IN_PROGRESS aux chauffeurs
// non concernes, donc Supabase filtre l'event postgres_changes UPDATE.
// Best-effort : on ne bloque pas l'acceptation si le broadcast echoue.

export type BroadcastMissionAccepted = (
  supabase: TaxilinkSupabaseClient,
  missionId: string
) => Promise<void>

const defaultImpl: BroadcastMissionAccepted = (supabase, missionId) =>
  new Promise<void>((resolve) => {
    try {
      const channel = supabase.channel('mission-events')
      const cleanup = () => {
        try {
          supabase.removeChannel(channel)
        } catch {
          /* noop */
        }
        resolve()
      }
      const timeout = setTimeout(cleanup, 3000)
      channel.subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return
        clearTimeout(timeout)
        try {
          await channel.send({
            type: 'broadcast',
            event: 'accepted',
            payload: { id: missionId },
          })
        } catch {
          /* noop */
        }
        cleanup()
      })
    } catch {
      resolve()
    }
  })

let _impl: BroadcastMissionAccepted = defaultImpl

export function setBroadcastImpl(impl: BroadcastMissionAccepted): void {
  _impl = impl
}

export function resetBroadcastImpl(): void {
  _impl = defaultImpl
}

export const broadcastMissionAccepted: BroadcastMissionAccepted = (s, id) => _impl(s, id)
