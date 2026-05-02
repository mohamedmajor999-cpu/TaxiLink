import { NextResponse } from 'next/server'

const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions'
const TIMEOUT_MS = 30000

export async function POST(request: Request) {
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
    console.error('[test-transcribe] network error', (err as Error).message)
    return NextResponse.json({ error: 'Délai Whisper dépassé' }, { status: 504 })
  }

  const elapsed = Date.now() - start
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[test-transcribe] ${res.status} in ${elapsed}ms`, body.slice(0, 300))
    return NextResponse.json({ error: `Whisper ${res.status}` }, { status: 502 })
  }

  const json = (await res.json()) as { text?: string }
  console.log(`[test-transcribe] OK in ${elapsed}ms → ${(json.text ?? '').length} chars`)
  return NextResponse.json({ text: json.text ?? '', elapsedMs: elapsed })
}
