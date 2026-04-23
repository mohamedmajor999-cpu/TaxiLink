import type { createClient } from '@/lib/supabase/client'

type Supabase = ReturnType<typeof createClient>

// Notifie les autres chauffeurs qu'une mission a ete acceptee. Necessaire
// car la policy SELECT ne retourne plus la ligne IN_PROGRESS aux chauffeurs
// non concernes, donc Supabase filtre l'event postgres_changes UPDATE.
// Best-effort : on ne bloque pas l'acceptation si le broadcast echoue.
export function broadcastMissionAccepted(supabase: Supabase, missionId: string): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const channel = supabase.channel('mission-events')
      const cleanup = () => {
        try { supabase.removeChannel(channel) } catch { /* noop */ }
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
        } catch { /* noop */ }
        cleanup()
      })
    } catch {
      resolve()
    }
  })
}
