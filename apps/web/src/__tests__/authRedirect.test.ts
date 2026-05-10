import { describe, it, expect } from 'vitest'
import { safeDashboardRedirect, decodeAuthErrorReason } from '@/lib/authRedirect'

describe('safeDashboardRedirect — whitelist', () => {
  it('accepte /dashboard/* tel quel', () => {
    expect(safeDashboardRedirect('/dashboard/chauffeur/agenda', 'driver')).toBe('/dashboard/chauffeur/agenda')
    expect(safeDashboardRedirect('/dashboard/client', 'client')).toBe('/dashboard/client')
  })

  it('accepte /rejoindre/<id> (flow invitation groupe)', () => {
    expect(safeDashboardRedirect('/rejoindre/abc-123', 'driver')).toBe('/rejoindre/abc-123')
  })

  it('accepte /invite/<token> (flow invitation org)', () => {
    expect(safeDashboardRedirect('/invite/tok-xyz', 'driver')).toBe('/invite/tok-xyz')
  })

  it('refuse les protocol-relative URLs (//evil.com)', () => {
    expect(safeDashboardRedirect('//evil.com', 'driver')).toBe('/dashboard/chauffeur')
    expect(safeDashboardRedirect('//evil.com/dashboard/', 'driver')).toBe('/dashboard/chauffeur')
  })

  it('refuse les URLs absolues (http(s)://)', () => {
    expect(safeDashboardRedirect('https://evil.com', 'driver')).toBe('/dashboard/chauffeur')
    expect(safeDashboardRedirect('http://evil.com/dashboard/', 'driver')).toBe('/dashboard/chauffeur')
  })

  it('refuse les paths hors whitelist', () => {
    expect(safeDashboardRedirect('/auth/login', 'driver')).toBe('/dashboard/chauffeur')
    expect(safeDashboardRedirect('/admin', 'driver')).toBe('/dashboard/chauffeur')
    expect(safeDashboardRedirect('javascript:alert(1)', 'driver')).toBe('/dashboard/chauffeur')
  })

  it('fallback role-based si raw vide ou null', () => {
    expect(safeDashboardRedirect(null, 'driver')).toBe('/dashboard/chauffeur')
    expect(safeDashboardRedirect(undefined, 'client')).toBe('/dashboard/client')
    expect(safeDashboardRedirect('', null)).toBe('/dashboard/chauffeur')
  })

  it('role inconnu → fallback driver dashboard', () => {
    expect(safeDashboardRedirect(null, 'patron')).toBe('/dashboard/chauffeur')
    expect(safeDashboardRedirect(null, undefined)).toBe('/dashboard/chauffeur')
  })
})

describe('decodeAuthErrorReason', () => {
  it('decode un reason URL-encode', () => {
    expect(decodeAuthErrorReason('Lien%20expir%C3%A9')).toBe('Lien expiré')
  })

  it('renvoie null si vide', () => {
    expect(decodeAuthErrorReason(null)).toBeNull()
    expect(decodeAuthErrorReason(undefined)).toBeNull()
    expect(decodeAuthErrorReason('')).toBeNull()
  })

  it('renvoie tel quel si non-decodable', () => {
    expect(decodeAuthErrorReason('%E0%A4%A')).toBe('%E0%A4%A')
  })
})
