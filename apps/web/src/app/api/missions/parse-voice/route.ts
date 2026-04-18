import { NextResponse } from 'next/server'

const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const SYSTEM_PROMPT = `Tu es un assistant qui extrait les informations d'une course de taxi/VTC à partir d'un texte dicté par un chauffeur en français.
Retourne UNIQUEMENT un JSON valide, sans commentaire, sans markdown.

Schéma attendu :
{
  "type": "CPAM" | "PRIVE" | null,
  "medical_motif": "HDJ" | "CONSULTATION" | null,
  "departure": string | null,
  "destination": string | null,
  "date": string | null,
  "time": string | null,
  "price_eur": number | null,
  "patient_name": string | null
}

Règles :
- "type" = "CPAM" si course médicale/patient/hôpital/clinique sinon "PRIVE".
- "medical_motif" UNIQUEMENT si type = "CPAM", sinon null :
  * "HDJ" (hôpital de jour) = dialyse, chimiothérapie, radiothérapie, hôpital de jour, séance, rééducation, kiné en centre
  * "CONSULTATION" = consultation, rendez-vous médical, examen, radio, scanner, IRM, analyse, entrée ou sortie d'hospitalisation, transfert
- "date" au format ISO "YYYY-MM-DD". Calcule par rapport à la date d'aujourd'hui fournie ci-dessous.
  * "aujourd'hui" → date d'aujourd'hui
  * "demain" → date du lendemain
  * "après-demain" → date du surlendemain
  * "lundi", "mardi"… sans précision → prochaine occurrence de ce jour (si aujourd'hui c'est lundi et le chauffeur dit "lundi", prendre le lundi suivant)
  * "lundi prochain", "la semaine prochaine" → interpréter en ajoutant 7 jours à la prochaine occurrence
  * "le 25", "le 3 mai" → jour/mois explicite dans le mois courant ou le prochain
  * Si aucune date n'est mentionnée, laisser null.
- "time" au format "HH:MM" 24h (ex: "14:30"). Si le chauffeur dit "quatorze heures trente" → "14:30".
- "price_eur" en nombre (38, 42.50). Extraire seulement le montant en euros.
- "departure" et "destination" = adresse brute lisible (ex: "12 rue de la République Marseille"). Ne pas inventer une rue ou un numéro.
- DÉSAMBIGUÏSATION : si le chauffeur cite un lieu célèbre sans préciser la ville (stade, monument, gare, aéroport, hôpital connu, etc.), ajoute la ville la plus probable au format "Nom du lieu, Ville". Exemples : "stade vélodrome" → "Stade Vélodrome, Marseille" ; "tour eiffel" → "Tour Eiffel, Paris" ; "gare saint-charles" → "Gare Saint-Charles, Marseille" ; "aéroport orly" → "Aéroport d'Orly, Paris". Si plusieurs villes sont plausibles et qu'aucune ne domine clairement, laisse tel quel.
- "patient_name" uniquement si mentionné explicitement.
- Si une info n'est pas mentionnée, mettre null. Ne pas inventer.`

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

async function callGemini(model: string, apiKey: string, prompt: string): Promise<Response> {
  return fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    }),
  })
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
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

  let res: Response | null = null
  let lastStatus = 0
  for (const model of MODEL_CHAIN) {
    try {
      res = await callGemini(model, apiKey, prompt)
    } catch {
      return NextResponse.json({ error: 'Service IA injoignable' }, { status: 502 })
    }
    if (res.ok) break
    lastStatus = res.status
    const errBody = await res.text().catch(() => '')
    console.error(`[parse-voice] ${model} → ${res.status}`, errBody.slice(0, 200))
    if (res.status !== 503 && res.status !== 429) break
  }

  if (!res || !res.ok) {
    if (lastStatus === 429) return NextResponse.json({ error: 'Quota IA atteint, réessayez dans 1 minute' }, { status: 429 })
    if (lastStatus === 503) return NextResponse.json({ error: 'Serveurs IA saturés, réessayez dans quelques secondes' }, { status: 503 })
    return NextResponse.json({ error: `Erreur IA (${lastStatus})` }, { status: 502 })
  }

  const json = (await res.json()) as GeminiResponse
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) return NextResponse.json({ error: 'Réponse IA vide' }, { status: 502 })

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Réponse IA illisible' }, { status: 502 })
  }

  return NextResponse.json(parsed)
}
