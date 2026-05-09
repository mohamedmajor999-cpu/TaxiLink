import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimiter'
import { createLogger } from '@/lib/logger'

const log = createLogger('test-transcribe')

const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions'
const TIMEOUT_MS = 30000

// Biais Whisper : liste de noms propres marseillais et termes médicaux courants
// pour orienter la reconnaissance. Whisper accepte jusqu'a 224 tokens.
const WHISPER_PROMPT =
  'Course en taxi a Marseille et Bouches-du-Rhone. ' +
  'Quartiers : Frais Vallon, La Castellane, La Rose, Saint-Antoine, La Joliette, ' +
  'Castellane, Bonneveine, La Timone, La Conception, Endoume, Saint-Loup, Mazargues, ' +
  'Le Panier, Sainte-Marguerite, Les Caillols, Saint-Just, Saint-Jerome. ' +
  'Hopitaux : La Timone, La Conception, Hopital Nord, Hopital Europeen, ' +
  'Saint-Joseph, Sainte-Marguerite, Clairval, Beauregard, Desbief. ' +
  'Reperes : Gare Saint-Charles, Aeroport Marseille Provence, Vieux-Port, ' +
  'Stade Velodrome, Stade Frais Vallon, Plage du Prado. ' +
  'Villes : Aix-en-Provence, Aubagne, Marignane, Vitrolles, Martigues, ' +
  'Salon-de-Provence, Cassis, La Ciotat, Allauch, Plan-de-Cuques. ' +
  'Termes : CPAM, dialyse, consultation, hopital de jour, kine, radio, scanner, IRM.'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  if (!rateLimit(`test-transcribe:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, { status: 429 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY manquante' }, { status: 500 })

  let form: FormData
  try { form = await request.formData() } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  const audio = form.get('audio')
  if (!(audio instanceof File)) return NextResponse.json({ error: 'Fichier audio manquant' }, { status: 400 })

  const upstream = new FormData()
  upstream.append('file', audio, audio.name || 'audio.webm')
  upstream.append('model', 'whisper-1')
  upstream.append('language', 'fr')
  upstream.append('response_format', 'json')
  upstream.append('prompt', WHISPER_PROMPT)

  const start = Date.now()
  let res: Response
  try {
    res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    log.error('network error', (err as Error).message)
    return NextResponse.json({ error: 'Délai Whisper dépassé' }, { status: 504 })
  }

  const elapsed = Date.now() - start
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    log.error(`whisper ${res.status} in ${elapsed}ms`, body.slice(0, 300))
    return NextResponse.json({ error: `Whisper ${res.status}` }, { status: 502 })
  }

  const json = (await res.json()) as { text?: string }
  log.info(`OK in ${elapsed}ms → ${(json.text ?? '').length} chars`)
  return NextResponse.json({ text: json.text ?? '', elapsedMs: elapsed })
}
