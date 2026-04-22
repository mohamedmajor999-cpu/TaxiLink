import { NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from './prompt'

const MODEL_CHAIN = ['gemini-flash-latest', 'gemini-2.5-flash']
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_TIMEOUT_MS = 5000
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-haiku-4-5'
const CLAUDE_TIMEOUT_MS = 10000

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

interface ClaudeResponse {
  content?: { type: string; text?: string }[]
  usage?: { input_tokens?: number; output_tokens?: number }
}

// Claude Haiku 4.5 pricing (USD per million tokens).
const CLAUDE_PRICE_IN = 1
const CLAUDE_PRICE_OUT = 5

async function callGemini(model: string, apiKey: string, prompt: string): Promise<Response> {
  return fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  })
}

async function callClaude(apiKey: string, prompt: string): Promise<Response> {
  return fetch(CLAUDE_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0.1,
      system: 'Tu réponds UNIQUEMENT avec un JSON valide, sans markdown ni commentaire.',
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(CLAUDE_TIMEOUT_MS),
  })
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  const claudeKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey && !claudeKey) {
    return NextResponse.json({ error: 'Configuration IA manquante' }, { status: 500 })
  }

  let body: { transcript?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const transcript = (body.transcript ?? '').trim()
  if (transcript.length < 3) return NextResponse.json({ error: 'Transcription trop courte' }, { status: 400 })
  if (transcript.length > 2000) return NextResponse.json({ error: 'Transcription trop longue' }, { status: 400 })

  const today = new Date()
  const weekday = today.toLocaleDateString('fr-FR', { weekday: 'long' })
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const prompt = `${SYSTEM_PROMPT}\n\nDate d'aujourd'hui : ${todayIso} (${weekday}).\nTexte du chauffeur :\n"${transcript}"`

  let text: string | null = null
  let usedProvider = ''
  let lastStatus = 0
  const totalStart = Date.now()

  // 1) Claude Haiku en primaire (Gemini instable côté Google actuellement).
  if (claudeKey) {
    const start = Date.now()
    try {
      const res = await callClaude(claudeKey, prompt)
      const elapsed = Date.now() - start
      if (res.ok) {
        const json = (await res.json()) as ClaudeResponse
        text = json.content?.[0]?.text ?? null
        usedProvider = CLAUDE_MODEL
        const inTok = json.usage?.input_tokens ?? 0
        const outTok = json.usage?.output_tokens ?? 0
        const cost = (inTok * CLAUDE_PRICE_IN + outTok * CLAUDE_PRICE_OUT) / 1_000_000
        console.log(`[parse-voice] ${CLAUDE_MODEL} → 200 in ${elapsed}ms (in:${inTok} out:${outTok} = $${cost.toFixed(6)})`)
      } else {
        lastStatus = res.status
        const errBody = await res.text().catch(() => '')
        console.error(`[parse-voice] ${CLAUDE_MODEL} → ${res.status} in ${elapsed}ms`, errBody.slice(0, 200))
      }
    } catch (err) {
      const elapsed = Date.now() - start
      console.error(`[parse-voice] ${CLAUDE_MODEL} → error after ${elapsed}ms`, (err as Error).message)
    }
  }

  // 2) Fallback Gemini si Claude a raté (key absente, rate limit, timeout…).
  if (!text && apiKey) {
    outer: for (const model of MODEL_CHAIN) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        if (attempt > 1) await new Promise((r) => setTimeout(r, 800))
        const start = Date.now()
        let res: Response
        try {
          res = await callGemini(model, apiKey, prompt)
        } catch (err) {
          const elapsed = Date.now() - start
          const isTimeout = (err as Error).name === 'TimeoutError' || (err as Error).name === 'AbortError'
          console.error(`[parse-voice] ${model} #${attempt} → ${isTimeout ? 'timeout' : 'network error'} after ${elapsed}ms`)
          if (!isTimeout) break outer
          continue
        }
        const elapsed = Date.now() - start
        if (res.ok) {
          const json = (await res.json()) as GeminiResponse
          text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? null
          usedProvider = model
          console.log(`[parse-voice] ${model} #${attempt} → 200 in ${elapsed}ms`)
          break outer
        }
        lastStatus = res.status
        const errBody = await res.text().catch(() => '')
        console.error(`[parse-voice] ${model} #${attempt} → ${res.status} in ${elapsed}ms`, errBody.slice(0, 200))
        if (res.status !== 503 && res.status !== 429) continue outer
      }
    }
  }

  if (!text) {
    if (lastStatus === 429) return NextResponse.json({ error: 'Quota IA atteint, réessayez dans 1 minute' }, { status: 429 })
    if (lastStatus === 503) return NextResponse.json({ error: 'Serveurs IA saturés, réessayez dans quelques secondes' }, { status: 503 })
    if (lastStatus === 0) return NextResponse.json({ error: 'Délai IA dépassé, réessayez' }, { status: 504 })
    return NextResponse.json({ error: `Erreur IA (${lastStatus})` }, { status: 502 })
  }

  // Claude peut wrapper le JSON dans ```json ... ``` malgré la consigne ; on strip.
  const cleanText = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  let parsed: unknown
  try {
    parsed = JSON.parse(cleanText)
  } catch {
    return NextResponse.json({ error: 'Réponse IA illisible' }, { status: 502 })
  }

  console.log(`[parse-voice] total ${Date.now() - totalStart}ms via ${usedProvider}`)
  return NextResponse.json(parsed)
}
