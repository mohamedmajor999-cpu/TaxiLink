// Stub expo-secure-store pour les tests Vitest (Node). Le vrai module est
// natif et plante a l'import en environnement Node. Les fonctions testees ne
// touchent jamais ces APIs, mais elles sont importees au top du module sous
// test (trackingConfig.ts) — il suffit que l'import resolve.
export const getItemAsync = async (_key: string): Promise<string | null> => null;
export const setItemAsync = async (_key: string, _value: string): Promise<void> => {};
export const deleteItemAsync = async (_key: string): Promise<void> => {};
