import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Vitest pour les tests unitaires des fonctions PURES de mobile-driver-v3.
// On ne teste PAS de composants RN ni de hooks React ici — Vitest tourne en
// Node, sans React Native. Les tests visent uniquement les modules qui peuvent
// s'executer en Node : decisions de tracking, masquage RGPD, store zustand.
//
// Les modules natifs (expo-secure-store, react-native, etc.) sont alias-stubes
// pour eviter qu'une import dans une chaine de dependances ne casse le run.
export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'expo-secure-store': path.resolve(__dirname, 'src/__tests__/__stubs__/expo-secure-store.ts'),
    },
  },
});
