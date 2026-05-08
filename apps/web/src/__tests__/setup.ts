import '@testing-library/jest-dom'

// Variables d'env factices pour permettre aux tests qui creent un client
// Supabase (via createClient/createBrowserClient) de demarrer sans crash. Les
// vraies requetes sont mockees avec vi.mock dans chaque test.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'
