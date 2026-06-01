// Injection point pour rediriger les appels Google Places + Routes vers un proxy
// serveur (typiquement une Edge Function Supabase avec cache partagé).
//
// - Côté web : on n'injecte pas → fetch direct Google (le code existant continue).
// - Côté mobile : init.ts appelle setGoogleProxyClient() au boot → tous les
//   appels passent par l'Edge Function `google-cache` (cache partagé entre 10K
//   drivers, clé Google côté serveur).
//
// Le proxy reçoit `{ kind, payload }`, retourne la même structure que renvoie
// Google directement (réponse JSON brute). Les services parsent côté client
// comme avant — pas de changement de schéma.

export type GoogleProxyKind = 'places_autocomplete' | 'place_details' | 'route'

export type GoogleProxyClient = (
  kind: GoogleProxyKind,
  payload: unknown,
  signal?: AbortSignal,
) => Promise<unknown>

let _proxy: GoogleProxyClient | undefined

export function setGoogleProxyClient(fn: GoogleProxyClient | undefined): void {
  _proxy = fn
}

export function getGoogleProxyClient(): GoogleProxyClient | undefined {
  return _proxy
}
