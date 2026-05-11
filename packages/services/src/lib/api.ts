// Wrapper centralise pour les appels HTTP vers les API routes Next.js (`/api/*`).
//
// Cross-platform :
// - Web : URL relatives (`/api/missions`) qui resolvent vers le meme origin.
//   `setApiBaseUrl('')` (defaut, rien a faire).
// - Mobile : URL absolues vers le backend Next.js deploye.
//   Au boot, l'app Expo doit appeler `setApiBaseUrl('https://taxilink.fr')`.
//
// Pattern d'injection :
// - `api` est un proxy qui delegue a `_impl` (mutable via `setApiImpl`).
// - Permet a apps/web de pousser son propre wrapper `api` (avec auth cookies,
//   instrumentation Sentry...) ou de mocker en tests.
// - Defaut : implementation `defaultImpl` ci-dessous (fetch direct).

import { ApiRequestError } from './api.types'
import type { ApiError } from './api.types'

let _baseUrl = ''

export function setApiBaseUrl(url: string): void {
  _baseUrl = url.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  return _baseUrl
}

export interface ApiClient {
  get<T>(path: string, init?: RequestInit): Promise<T>
  post<T>(path: string, body: unknown, init?: RequestInit): Promise<T>
  patch<T>(path: string, body: unknown, init?: RequestInit): Promise<T>
  delete<T>(path: string, init?: RequestInit): Promise<T>
  postForm<T>(path: string, form: FormData, init?: RequestInit): Promise<T>
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData
  const url = path.startsWith('http') ? path : `${_baseUrl}${path}`
  const res = await fetch(url, {
    ...init,
    headers: isForm
      ? init?.headers
      : { 'Content-Type': 'application/json', ...init?.headers },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const body = json as ApiError
    const message =
      body.errors?.[0]?.message ?? body.error ?? `Erreur HTTP ${res.status}`
    throw new ApiRequestError(res.status, message)
  }
  return json as T
}

const defaultImpl: ApiClient = {
  post: (path, body, init) =>
    request(path, { ...init, method: 'POST', body: JSON.stringify(body) }),
  postForm: (path, form, init) =>
    request(path, { ...init, method: 'POST', body: form }),
  get: (path, init) => request(path, { ...init, method: 'GET' }),
  patch: (path, body, init) =>
    request(path, { ...init, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path, init) => request(path, { ...init, method: 'DELETE' }),
}

let _impl: ApiClient = defaultImpl

export function setApiImpl(impl: ApiClient): void {
  _impl = impl
}

export function resetApiImpl(): void {
  _impl = defaultImpl
}

// Proxy `api` : delegue chaque methode a `_impl` resolu a l'instant de l'appel.
// Permet a apps/web de pousser son wrapper `api` mocke en tests sans recopier
// le module au build. On forward EXACTEMENT les args recus (pas d'undefined
// supplementaire) pour preserver l'arity attendue par les mocks vitest.
export const api: ApiClient = new Proxy({} as ApiClient, {
  get(_target, prop) {
    const fn = (_impl as unknown as Record<string, unknown>)[prop as string]
    if (typeof fn !== 'function') return fn
    return (...args: unknown[]) => (fn as (...a: unknown[]) => unknown).apply(_impl, args)
  },
}) as ApiClient

export { ApiRequestError } from './api.types'
export type { ApiError } from './api.types'
