// LRU persistee (localStorage cote web, no-op cote mobile) avec TTL.
// Eviction FIFO au-dela de maxSize. Utilisee par les caches Google Places
// et Routes : evite de refacturer une meme requete apres fermeture de la PWA.
//
// Cote mobile : `typeof window === 'undefined'` ou window.localStorage absent
// → cache memoire seulement. Pour persister sur mobile, brancher AsyncStorage
// via une variante future de cette fonction.

interface Entry<V> {
  value: V
  ts: number
}

export interface PersistedLru<V> {
  get(key: string): V | undefined
  set(key: string, value: V): void
}

export function createPersistedLru<V>(opts: {
  storageKey: string
  maxSize: number
  ttlMs: number
}): PersistedLru<V> {
  const cache = new Map<string, Entry<V>>()
  let loaded = false

  function load(): void {
    if (loaded) return
    loaded = true
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      const raw = window.localStorage.getItem(opts.storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as Array<[string, Entry<V>]>
      if (!Array.isArray(parsed)) return
      const now = Date.now()
      for (const [k, e] of parsed) {
        if (!e || typeof e.ts !== 'number') continue
        if (now - e.ts > opts.ttlMs) continue
        cache.set(k, e)
      }
    } catch {
      // JSON invalide / quota / mode prive → on repart de zero
    }
  }

  function persist(): void {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      window.localStorage.setItem(opts.storageKey, JSON.stringify(Array.from(cache.entries())))
    } catch {
      // Quota depasse → on ignore, le cache memoire continue
    }
  }

  return {
    get(key) {
      load()
      const e = cache.get(key)
      if (!e) return undefined
      if (Date.now() - e.ts > opts.ttlMs) {
        cache.delete(key)
        persist()
        return undefined
      }
      return e.value
    },
    set(key, value) {
      load()
      if (cache.has(key)) cache.delete(key)
      cache.set(key, { value, ts: Date.now() })
      if (cache.size > opts.maxSize) {
        const first = cache.keys().next().value
        if (first !== undefined) cache.delete(first)
      }
      persist()
    },
  }
}
