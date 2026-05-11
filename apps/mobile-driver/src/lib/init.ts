// Bootstrap des packages partages au demarrage de l'app mobile.
// Appele UNE FOIS depuis app/_layout.tsx (root layout) avant tout rendu.
// Equivalent mobile de apps/web/src/services/_bridge.ts.

import {
  setSupabaseClient,
  setApiBaseUrl,
  setErrorReporter,
  setRoutingGoogleMapsKey,
  setPlacesGoogleMapsKey,
  setPlaceDetailsGoogleMapsKey,
} from '@taxilink/services'

import { createMobileSupabaseClient } from './supabase'
import { captureException, initSentry } from './sentry'

let bridged = false

export function initApp(): void {
  if (bridged) return

  initSentry()

  setSupabaseClient(createMobileSupabaseClient())

  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://taxilink.fr'
  setApiBaseUrl(apiBase)

  setErrorReporter({ captureException })

  const gKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY
  if (gKey) {
    setRoutingGoogleMapsKey(gKey)
    setPlacesGoogleMapsKey(gKey)
    setPlaceDetailsGoogleMapsKey(gKey)
  }

  bridged = true
}
