// Helper GPT-4o-mini : appel chat completions avec format JSON forcé.

const CHAT_URL = 'https://api.openai.com/v1/chat/completions'
const TIMEOUT_MS = 10000

export const GPT_MINI_MODEL = 'gpt-4o-mini'

interface ChatResponse {
  choices?: { message?: { content?: string } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

export interface ChatResult {
  text: string
  inputTokens: number
  outputTokens: number
  elapsedMs: number
}

export class ChatError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

interface ChatArgs {
  apiKey: string
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}

export async function chatJson({ apiKey, systemPrompt, userPrompt, maxTokens = 1024, temperature = 0.1 }: ChatArgs): Promise<ChatResult> {
  const start = Date.now()
  let res: Response
  try {
    res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GPT_MINI_MODEL,
        max_tokens: maxTokens,
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    const isTimeout = (err as Error).name === 'TimeoutError' || (err as Error).name === 'AbortError'
    throw new ChatError(isTimeout ? 504 : 502, isTimeout ? 'Délai OpenAI dépassé' : 'Erreur réseau OpenAI')
  }

  const elapsedMs = Date.now() - start
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[gpt-4o-mini] ${res.status} in ${elapsedMs}ms`, body.slice(0, 300))
    throw new ChatError(res.status, `OpenAI ${res.status}`)
  }

  const json = (await res.json()) as ChatResponse
  return {
    text: json.choices?.[0]?.message?.content ?? '',
    inputTokens: json.usage?.prompt_tokens ?? 0,
    outputTokens: json.usage?.completion_tokens ?? 0,
    elapsedMs,
  }
}
