import { NextResponse } from 'next/server'
import { transcribeAudio, TranscribeError } from '@/lib/openai/transcribe'

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY manquante' }, { status: 500 })

  let form: FormData
  try { form = await request.formData() } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const audio = form.get('audio')
  if (!(audio instanceof File)) return NextResponse.json({ error: 'Fichier audio manquant' }, { status: 400 })
  if (audio.size === 0) return NextResponse.json({ error: 'Audio vide' }, { status: 400 })
  if (audio.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Audio trop volumineux' }, { status: 400 })

  try {
    const r = await transcribeAudio(audio, apiKey)
    return NextResponse.json({ text: r.text, elapsedMs: r.elapsedMs })
  } catch (err) {
    if (err instanceof TranscribeError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }
}
