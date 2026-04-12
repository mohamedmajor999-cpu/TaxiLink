/**
 * In-memory sliding window rate limiter.
 * Works per-process — sufficient for single-instance deployments.
 * Replace with @upstash/ratelimit for multi-instance / serverless edge.
 */

interface Window {
  timestamps: number[]
}

const store = new Map<string, Window>()

/**
 * Returns true if the request is allowed.
 * @param key      Unique identifier (e.g. user ID or IP)
 * @param limit    Max requests allowed within the window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const cutoff = now - windowMs

  const entry = store.get(key) ?? { timestamps: [] }
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= limit) {
    store.set(key, entry)
    return false
  }

  entry.timestamps.push(now)
  store.set(key, entry)
  return true
}
