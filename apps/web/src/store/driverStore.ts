// Re-export depuis @taxilink/stores. Bridge importe pour declencher
// setSupabaseClient + setErrorReporter (driverStore appelle
// driverService/profileService/authService + reportError sur signOut).
import '@/services/_bridge'
export { useDriverStore } from '@taxilink/stores'
