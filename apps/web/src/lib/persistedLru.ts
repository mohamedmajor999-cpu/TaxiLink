// Re-export depuis @taxilink/services/lib/persistedLru — implementation
// cross-platform avec guard `typeof window` pour le storage.
export {
  createPersistedLru,
  type PersistedLru,
} from '@taxilink/services/src/lib/persistedLru'
