// Bridge entre les modules apps/web (`@/lib/*`) et le singleton du package
// `@taxilink/services`.
//
// Pourquoi un bridge LAZY (Proxy) plutot qu'un appel au module load ?
// - Les tests utilisent `vi.mock('@/lib/...', () => ({ ... }))`. Le mock est
//   hoiste au top, mais le contenu peut referencer des `const` declares plus
//   bas dans le fichier de test (vitest TDZ). Si on appelle createClient/api
//   au module load du re-export, on declenche cette TDZ.
// - En differant l'enregistrement au premier acces a une methode du service,
//   les consts du test sont initialises et les mocks fonctionnent.
//
// Cote SSR (window undefined), on skip — les services ne doivent pas etre
// invoques cote serveur (les services Supabase server-side passent par
// `apps/web/src/lib/supabase/server.ts`, pas par @taxilink/services).

import { createClient } from '@/lib/supabase/client'
import { api as webApi } from '@/lib/api'
import { broadcastMissionAccepted as webBroadcast } from '@/lib/missionBroadcast'
import { setSupabaseClient, setApiImpl, setBroadcastImpl } from '@taxilink/services'

let _bridged = false

export function ensureBridge(): void {
  if (_bridged) return
  if (typeof window === 'undefined') return
  setSupabaseClient(createClient())
  setApiImpl(webApi)
  setBroadcastImpl(webBroadcast)
  _bridged = true
}

// Reset utilise par les tests qui veulent re-bridger entre suites.
export function __resetBridge(): void {
  _bridged = false
}

export function bridgeService<T extends object>(service: T): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      ensureBridge()
      return Reflect.get(target, prop, receiver)
    },
  })
}
