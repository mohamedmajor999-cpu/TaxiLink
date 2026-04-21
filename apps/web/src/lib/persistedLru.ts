// LRU persistée (localStorage) avec TTL. Éviction FIFO au-delà de maxSize.
// Utilisée par les caches Google Places et Routes : évite de refacturer
// une même requête après fermeture de la PWA.

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
    if (typeof window === 'undefined') return
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
      // JSON invalide / quota / mode privé → on repart de zéro
    }
  }

  function persist(): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(opts.storageKey, JSON.stringify(Array.from(cache.entries())))
    } catch {
      // Quota dépassé → on ignore, le cache mémoire continue
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
