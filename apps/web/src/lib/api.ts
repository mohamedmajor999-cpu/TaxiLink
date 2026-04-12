/**
 * Wrapper centralisé pour les appels fetch vers les API routes Next.js.
 */
import { ApiRequestError } from './api.types'
import type { ApiError } from './api.types'

export { ApiRequestError } from './api.types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const body = json as ApiError
    const message = body.errors?.[0]?.message ?? body.error ?? `Erreur HTTP ${res.status}`
    throw new ApiRequestError(res.status, message)
  }
  return json as T
}

export const api = {
  post<T>(path: string, body: unknown):   Promise<T> { return request<T>(path, { method: 'POST',   body: JSON.stringify(body) }) },
  get<T>(path: string):                   Promise<T> { return request<T>(path, { method: 'GET'   }) },
  patch<T>(path: string, body: unknown):  Promise<T> { return request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }) },
  delete<T>(path: string):                Promise<T> { return request<T>(path, { method: 'DELETE' }) },
}
