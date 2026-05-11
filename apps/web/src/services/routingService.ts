// Re-export depuis @taxilink/services. Pas de bridge Supabase/api necessaire
// (fetch direct + Google Maps API key + OSRM).
export {
  computeRoute,
  computeRouteGoogle,
  type RouteResult,
} from '@taxilink/services'
