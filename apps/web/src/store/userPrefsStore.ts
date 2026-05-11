// Re-export depuis @taxilink/stores. Bridge importe pour declencher
// setSupabaseClient (le store consomme userPrefsService).
import '@/services/_bridge'
export { useUserPrefs } from '@taxilink/stores'
