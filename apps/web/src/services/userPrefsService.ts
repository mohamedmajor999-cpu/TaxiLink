import { createClient } from '@/lib/supabase/client'
import { isValidDepartement } from '@/lib/departement'
import {
  DEFAULT_GPS_PREFERENCE,
  isValidGpsPreference,
  type GpsPreference,
} from '@/lib/gpsNavigation'
import type { MissionVisibility } from '@/lib/validators'

/**
 * Préréglages que le chauffeur peut mémoriser pour ne pas avoir à re-choisir
 * groupe + type de course à chaque création d'annonce. Stocké dans
 * `auth.users.raw_user_meta_data.mission_defaults`. Pas critique : si la
 * lecture échoue, on retombe sur les valeurs par défaut côté UI.
 */
export interface MissionDefaults {
  type: 'CPAM' | 'PRIVE' | null
  visibility: MissionVisibility | null
  groupIds: string[]
}

const EMPTY_DEFAULTS: MissionDefaults = { type: null, visibility: null, groupIds: [] }

function isMissionType(v: unknown): v is 'CPAM' | 'PRIVE' {
  return v === 'CPAM' || v === 'PRIVE'
}
function isVisibility(v: unknown): v is MissionVisibility {
  return v === 'PUBLIC' || v === 'GROUP'
}

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

  async getMissionDefaults(): Promise<MissionDefaults> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return EMPTY_DEFAULTS
    const raw = data.user?.user_metadata?.mission_defaults
    if (!raw || typeof raw !== 'object') return EMPTY_DEFAULTS
    const obj = raw as Record<string, unknown>
    return {
      type: isMissionType(obj.type) ? obj.type : null,
      visibility: isVisibility(obj.visibility) ? obj.visibility : null,
      groupIds: Array.isArray(obj.groupIds) ? obj.groupIds.filter((v): v is string => typeof v === 'string') : [],
    }
  },

  async updateMissionDefaults(defaults: MissionDefaults): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { mission_defaults: defaults } })
    if (error) throw new Error(error.message)
  },

  /**
   * Groupes mis en favori par le chauffeur. Stocké côté serveur pour survivre
   * aux évictions de localStorage (iOS Safari PWA, nettoyage navigateur).
   */
  async getFavoriteGroupIds(): Promise<string[]> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return []
    const raw = data.user?.user_metadata?.favorite_group_ids
    if (!Array.isArray(raw)) return []
    return raw.filter((v): v is string => typeof v === 'string')
  },

  async updateFavoriteGroupIds(ids: string[]): Promise<void> {
    const clean = Array.from(new Set(ids.filter((v): v is string => typeof v === 'string')))
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { favorite_group_ids: clean } })
    if (error) throw new Error(error.message)
  },
}
