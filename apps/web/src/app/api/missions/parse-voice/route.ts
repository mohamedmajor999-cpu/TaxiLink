import { NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from './prompt'
import { logAiUsage } from '@/lib/aiUsageLogger'
import { transcribeAudio, TranscribeError } from '@/lib/openai/transcribe'
import { chatJson, ChatError, GPT_MINI_MODEL } from '@/lib/openai/chat'

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
  if (audio.size > 25 * 1024 * 1024) return NextResponse.json({ error: 'Audio trop volumineux (>25 Mo)' }, { status: 400 })

  const totalStart = Date.now()
  let transcript = ''
  try {
    const r = await transcribeAudio(audio, apiKey)
    transcript = r.text
    console.log(`[parse-voice] whisper → ${transcript.length} chars in ${r.elapsedMs}ms`)
  } catch (err) {
    if (err instanceof TranscribeError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  if (transcript.length < 3) return NextResponse.json({ error: 'Transcription trop courte', transcript }, { status: 422 })
  if (transcript.length > 2000) return NextResponse.json({ error: 'Transcription trop longue', transcript }, { status: 422 })

  const today = new Date()
  const weekday = today.toLocaleDateString('fr-FR', { weekday: 'long' })
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const userPrompt = `Date d'aujourd'hui : ${todayIso} (${weekday}).\nTexte du chauffeur :\n"${transcript}"`

  let parseText = ''
  try {
    const r = await chatJson({ apiKey, systemPrompt: SYSTEM_PROMPT, userPrompt })
    parseText = r.text
    console.log(`[parse-voice] ${GPT_MINI_MODEL} → 200 in ${r.elapsedMs}ms (in:${r.inputTokens} out:${r.outputTokens})`)
    await logAiUsage({ endpoint: 'parse-voice', model: GPT_MINI_MODEL, inputTokens: r.inputTokens, outputTokens: r.outputTokens })
  } catch (err) {
    if (err instanceof ChatError) return NextResponse.json({ error: err.message, transcript }, { status: err.status })
    throw err
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(parseText) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Réponse IA illisible', transcript }, { status: 502 })
  }

  console.log(`[parse-voice] total ${Date.now() - totalStart}ms`)
  return NextResponse.json({ ...parsed, transcript })
}
