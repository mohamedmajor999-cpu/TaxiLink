'use client'

import { useState } from 'react'
import { useGoogleCostsSection } from './useGoogleCostsSection'
import { SectionShell } from './ui/SectionShell'

export function GoogleCostsSection() {
  const { items, total, loading, saving, error, upsert, remove } = useGoogleCostsSection()
  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [service, setService]         = useState('places')
  const [costUsd, setCostUsd]         = useState('')
  const [requestCount, setRequestCount] = useState('')
  const [notes, setNotes]             = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const c = Number(costUsd)
    if (!Number.isFinite(c) || c < 0) return
    await upsert({
      periodMonth,
      service,
      costUsd: c,
      requestCount: requestCount ? Number(requestCount) : null,
      notes: notes.trim() || null,
    })
    setCostUsd('')
    setRequestCount('')
    setNotes('')
  }

  const right = (
    <div className="rounded-full bg-bgsoft px-3 py-1.5 text-xs">
      Total : <span className="font-semibold text-secondary">${total.toFixed(2)}</span>
    </div>
  )

  return (
    <SectionShell
      title="Coûts API Google"
      subtitle="Places, Routes, Directions — saisie manuelle mensuelle"
      icon={<span className="text-lg">🌐</span>}
      iconBg="bg-blue-100 text-blue-700"
      right={right}
    >
      <p className="mb-4 text-xs text-muted">
        Source officielle :{' '}
        <a
          href="https://console.cloud.google.com/billing/reports"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          console.cloud.google.com → Facturation → Rapports
        </a>
        . Filtre par service (Places API, Routes API, Directions API) puis reporte le coût mensuel ici.
      </p>

      {error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-2xl bg-bgsoft p-4 sm:grid-cols-5">
        <Field label="Mois">
          <input
            type="month"
            required
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Service">
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="places">Places API</option>
            <option value="routes">Routes API</option>
            <option value="directions">Directions API</option>
            <option value="geocoding">Geocoding API</option>
            <option value="autre">Autre</option>
          </select>
        </Field>
        <Field label="Coût $ (USD)">
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={costUsd}
            onChange={(e) => setCostUsd(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Nb requêtes (optionnel)">
          <input
            type="number"
            min="0"
            value={requestCount}
            onChange={(e) => setRequestCount(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
          />
        </Field>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-secondary shadow-button transition hover:brightness-95 disabled:opacity-50"
          >
            {saving ? 'Enreg…' : 'Enregistrer'}
          </button>
        </div>
        <div className="sm:col-span-5">
          <Field label="Notes (optionnel)">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Crédit gratuit Google appliqué"
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </form>

      {loading ? (
        <div className="text-sm text-muted">Chargement…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-bgsoft text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2 text-left">Mois</th>
                <th className="px-4 py-2 text-left">Service</th>
                <th className="px-4 py-2 text-right">Coût $</th>
                <th className="px-4 py-2 text-right">Requêtes</th>
                <th className="px-4 py-2 text-left">Notes</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted">
                    Aucune saisie. Reporte tes coûts Google ci-dessus.
                  </td>
                </tr>
              )}
              {items.map((it) => (
                <tr key={it.id} className="border-t border-line/60">
                  <td className="px-4 py-2 font-mono text-xs">{it.period_month.slice(0, 7)}</td>
                  <td className="px-4 py-2 capitalize">{it.service}</td>
                  <td className="px-4 py-2 text-right">${Number(it.cost_usd).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">
                    {it.request_count != null ? it.request_count.toLocaleString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted">{it.notes ?? ''}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => remove(it.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  )
}
