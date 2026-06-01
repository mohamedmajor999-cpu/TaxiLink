import type { StateStorage } from 'zustand/middleware'

/**
 * Storage partage cross-plateforme pour les stores `persist`.
 *
 * - Cote web : par defaut, lit/ecrit dans `localStorage` si dispo.
 * - Cote mobile : appeler `setPersistStorage(asyncStorageAdapter)` au boot
 *   (cf. apps/mobile-driver-v2/src/lib/init.ts) pour injecter AsyncStorage.
 * - Fallback : memoire process si aucun storage n'est dispo (tests, SSR).
 */

let injected: StateStorage | null = null

const memory = new Map<string, string>()

const memoryStorage: StateStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => { memory.set(key, value) },
  removeItem: (key) => { memory.delete(key) },
}

function browserStorage(): StateStorage | null {
  if (typeof localStorage === 'undefined') return null
  return {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => { localStorage.setItem(key, value) },
    removeItem: (key) => { localStorage.removeItem(key) },
  }
}

/**
 * Storage delegateur : resout l'implementation a chaque appel pour permettre
 * une injection apres l'evaluation des stores.
 */
export const sharedStorage: StateStorage = {
  getItem: (key) => (injected ?? browserStorage() ?? memoryStorage).getItem(key),
  setItem: (key, value) => (injected ?? browserStorage() ?? memoryStorage).setItem(key, value),
  removeItem: (key) => (injected ?? browserStorage() ?? memoryStorage).removeItem(key),
}

/**
 * A appeler au boot mobile pour injecter AsyncStorage (ou tout autre
 * StateStorage compatible). Sur web on garde le default localStorage en
 * n'appelant pas cette fonction.
 */
export function setPersistStorage(storage: StateStorage): void {
  injected = storage
}
