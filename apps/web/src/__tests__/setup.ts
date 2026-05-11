import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'

// Variables d'env factices pour permettre aux tests qui creent un client
// Supabase (via createClient/createBrowserClient) de demarrer sans crash. Les
// vraies requetes sont mockees avec vi.mock dans chaque test.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'

// Polyfill localStorage / sessionStorage pour vitest 4 + jsdom 29.
// Le createJSONStorage de Zustand v5 appelle storage.setItem(), or sur certaines
// configs jsdom 29 le proxy localStorage perd les methodes prototype au moment
// ou Zustand les capture (l'objet est-bound mais les methodes ne sont pas
// enumerables). On force une implementation Map-based simple, identique en
// surface a l'API Web Storage. Suffit pour les tests unitaires des stores
// persistants (postedAcceptStore, useDriverHomeFilters, etc.).
function createMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    removeItem: (key: string) => {
      data.delete(key)
    },
    setItem: (key: string, value: string) => {
      data.set(key, String(value))
    },
  }
}

if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    writable: true,
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createMemoryStorage(),
    writable: true,
  })
}

// Reset entre chaque test pour eviter les fuites de state Zustand persiste
// (ex. useDriverGroupesScreen.test : `dismissed`/`favorites` d'un test
// precedent filtraient les groupes par defaut).
beforeEach(() => {
  if (typeof globalThis !== 'undefined') {
    globalThis.localStorage?.clear()
    globalThis.sessionStorage?.clear()
  }
})
