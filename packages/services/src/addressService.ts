// Barrel : retro-compatibilite pour les imports existants. Les implementations
// vivent dans googlePlacesSearchService / googlePlaceDetailsService / routingService.

export {
  searchGoogle,
  primeGoogleAutocompleteCache,
  isGoogleMapsKeyConfigured,
  type AddressSuggestion,
} from './googlePlacesSearchService'

export { resolveGooglePlace, type PlaceDetails } from './googlePlaceDetailsService'

export { computeRoute, computeRouteGoogle, type RouteResult } from './routingService'
