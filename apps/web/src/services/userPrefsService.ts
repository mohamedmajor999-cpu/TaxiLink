import { createClient } from '@/lib/supabase/client'
import { isValidDepartement } from '@/lib/departement'
import {
  DEFAULT_GPS_PREFERENCE,
  isValidGpsPreference,
  type GpsPreference,
} from '@/lib/gpsNavigation'

export const userPrefsService = {
  async getNotificationPrefs(): Promise<Record<string, boolean> | null> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return (data.user?.user_metadata?.notification_prefs as Record<string, boolean>) ?? null
  },

  async updateNotificationPrefs(prefs: Record<string, boolean>): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { notification_prefs: prefs } })
    if (error) throw new Error(error.message)
  },

  /**
   * Départements sur lesquels le chauffeur veut recevoir des missions.
   * Liste vide ⇒ pas de scoping (voit tout, comportement legacy).
   */
  async getDeptPreferences(): Promise<string[]> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return []
    const raw = data.user?.user_metadata?.dept_preferences
    if (!Array.isArray(raw)) return []
    return raw.filter((v): v is string => typeof v === 'string' && isValidDepartement(v))
  },

  async updateDeptPreferences(depts: string[]): Promise<void> {
    const clean = Array.from(new Set(depts.filter(isValidDepartement)))
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { dept_preferences: clean } })
    if (error) throw new Error(error.message)
  },

  /**
   * Application GPS préférée du chauffeur ('waze' | 'maps' | 'ask').
   * 'ask' = proposer les deux à chaque navigation (valeur par défaut).
   */
  async getGpsPref(): Promise<GpsPreference> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return DEFAULT_GPS_PREFERENCE
    const raw = data.user?.user_metadata?.gps_pref
    return isValidGpsPreference(raw) ? raw : DEFAULT_GPS_PREFERENCE
  },

  async updateGpsPref(pref: GpsPreference): Promise<void> {
    if (!isValidGpsPreference(pref)) throw new Error('Préférence GPS invalide')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { gps_pref: pref } })
    if (error) throw new Error(error.message)
  },
}
