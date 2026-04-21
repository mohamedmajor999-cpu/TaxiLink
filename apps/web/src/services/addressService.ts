// Barrel : rétro-compatibilité pour les imports existants. Les implémentations
// vivent dans googlePlacesSearchService / googlePlaceDetailsService / routingService.

export {
  searchGoogle,
  primeGoogleAutocompleteCache,
  type AddressSuggestion,
} from './googlePlacesSearchService'

export { resolveGooglePlace } from './googlePlaceDetailsService'

export { computeRoute, computeRouteGoogle } from './routingService'
