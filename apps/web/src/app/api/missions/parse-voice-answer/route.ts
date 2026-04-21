import { NextResponse } from 'next/server'

const CLAUDE_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-haiku-4-5'
const CLAUDE_TIMEOUT_MS = 10000

interface ClaudeResponse {
  content?: { type: string; text?: string }[]
}

interface AnswerRequest {
  questionId?: string
  kind?: string
  prompt?: string
  options?: { value: string; label: string; aliases?: string[] }[]
  availableGroups?: { id: string; name: string }[]
  allQuestionIds?: string[]
  transcript?: string
}

function buildPrompt(req: AnswerRequest, todayIso: string): string {
  const optionsList = (req.options ?? [])
    .map((o) => `- ${o.value} (libellé: ${o.label}${o.aliases?.length ? `, synonymes: ${o.aliases.join(', ')}` : ''})`)
    .join('\n')
  const groupsList = (req.availableGroups ?? [])
    .map((g) => `- id="${g.id}" nom="${g.name}"`)
    .join('\n')
  const idsList = (req.allQuestionIds ?? []).join(', ')

  return `Tu analyses une réponse vocale à UNE question d'un formulaire guidé.

Question courante :
- id: ${req.questionId}
- kind: ${req.kind}
- texte posé: "${req.prompt}"
${optionsList ? `Options possibles :\n${optionsList}` : ''}
${groupsList ? `Groupes disponibles (match tolérant aux espaces/casse/accents) :\n${groupsList}` : ''}

Ids de toutes les questions existantes: ${idsList}
Date d'aujourd'hui : ${todayIso}

Transcription vocale :
"""${req.transcript}"""

Retourne UNIQUEMENT un JSON valide, sans markdown :
{
  "intent": "answer" | "back" | "goto" | "skip" | "unclear",
  "value": <dépend du kind, null si intent != "answer">,
  "targetQuestionId": <string ou null, uniquement si intent="goto">
}

Règles d'intent :
- "back" si l'utilisateur demande de revenir en arrière ("revenir", "retour", "précédent", "annule", "reviens").
- "goto" si l'utilisateur nomme une question à corriger ("corrige le téléphone", "modifie le nom") → mappe vers un id parmi ${idsList}.
- "skip" si l'utilisateur passe explicitement ("passe", "ignore", "sans réponse", "pas de numéro", "je ne sais pas").
- "answer" si c'est une réponse directe.
- "unclear" sinon.

Règles value selon kind :
- choice       → string parmi les valeurs d'options (match par libellé ou synonyme, insensible casse/accents)
- text         → string (nom propre nettoyé, première lettre capitalisée)
- phone        → string de chiffres (10 chiffres FR) ou null
- passengers   → entier 1-8
- date         → string "YYYY-MM-DD" (résous "demain", "jeudi prochain", etc.)
- time         → string "HH:MM" (24h)
- boolean      → true/false (oui/non, "aller-retour" → true, "simple" → false)
- address      → string brute d'adresse/POI (sera résolue côté client)
- groups       → array d'IDs de groupes choisis parmi la liste ci-dessus. Match tolérant: ignore la casse, les accents, les espaces, les tirets. Exemple: "taxi 13" → id du groupe "taxi13". Si aucun match certain, renvoie un array vide.`
}

export async function POST(request: Request) {
  const claudeKey = process.env.ANTHROPIC_API_KEY
  if (!claudeKey) return NextResponse.json({ error: 'Configuration IA manquante' }, { status: 500 })

  let body: AnswerRequest
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const transcript = (body.transcript ?? '').trim()
  if (transcript.length < 1) return NextResponse.json({ error: 'Transcription vide' }, { status: 400 })
  if (transcript.length > 500) return NextResponse.json({ error: 'Transcription trop longue' }, { status: 400 })
  if (!body.questionId || !body.kind) return NextResponse.json({ error: 'Question manquante' }, { status: 400 })

  const today = new Date()
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const prompt = buildPrompt(body, todayIso)

  let res: Response
  try {
    res = await fetch(CLAUDE_URL, {
      method: 'POST',
      headers: {
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 256,
        temperature: 0,
        system: 'Tu réponds UNIQUEMENT avec un JSON valide, sans markdown ni commentaire.',
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(CLAUDE_TIMEOUT_MS),
    })
  } catch (err) {
    console.error('[parse-voice-answer] network error', (err as Error).message)
    return NextResponse.json({ error: 'Délai IA dépassé' }, { status: 504 })
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    console.error(`[parse-voice-answer] ${res.status}`, t.slice(0, 200))
    if (res.status === 429) return NextResponse.json({ error: 'Quota IA atteint' }, { status: 429 })
    return NextResponse.json({ error: `Erreur IA (${res.status})` }, { status: 502 })
  }

  const json = (await res.json()) as ClaudeResponse
  const text = json.content?.[0]?.text?.trim() ?? ''
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return NextResponse.json(JSON.parse(cleaned))
  } catch {
    return NextResponse.json({ error: 'Réponse IA illisible' }, { status: 502 })
  }
}
