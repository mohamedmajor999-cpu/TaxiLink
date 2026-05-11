// Re-export depuis @taxilink/services. Pas de bridge Supabase ni d'api
// necessaire ici (utilise fetch direct + Google Maps API key).
export {
  searchGoogle,
  primeGoogleAutocompleteCache,
  isGoogleMapsKeyConfigured,
  type AddressSuggestion,
} from '@taxilink/services'
