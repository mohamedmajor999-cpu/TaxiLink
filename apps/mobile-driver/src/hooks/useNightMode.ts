import { useEffect, useState } from 'react'
import { colorScheme as nwColorScheme } from 'nativewind'

// Hook de gestion du theme clair/sombre.
// `nativewind` expose `colorScheme.set('dark' | 'light' | 'system')` qui pilote
// le rendering des classes `dark:`. On expose un toggle simple.
// La persistance entre sessions est volontairement SKIPPEE Sem 4 v2 :
// chaque ouverture d'app revient en mode clair par defaut. Polish Sem 11.
export function useNightMode() {
  const [isDark, setIsDark] = useState<boolean>(false)

  useEffect(() => {
    nwColorScheme.set(isDark ? 'dark' : 'light')
  }, [isDark])

  return {
    isDark,
    toggle: () => setIsDark((v) => !v),
  }
}
