import type { Mission } from '@/lib/supabase/types'

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export interface InvoiceDriver {
  name: string
  email?: string | null
  phone?: string | null
}

export function renderInvoiceHtml(opts: {
  driver: InvoiceDriver
  year: number
  quarter: number
  missions: Mission[]
  invoiceNumber: string
}): string {
  const { driver, year, quarter, missions, invoiceNumber } = opts
  const startMonth = (quarter - 1) * 3
  const endMonth = startMonth + 2
  const periodLabel = `${MONTHS_FR[startMonth]} – ${MONTHS_FR[endMonth]} ${year}`
  const total = missions.reduce((s, m) => s + Number(m.price_eur ?? 0), 0)
  const cpamTotal = missions.filter((m) => m.type === 'CPAM').reduce((s, m) => s + Number(m.price_eur ?? 0), 0)
  const priveTotal = missions.filter((m) => m.type === 'PRIVE').reduce((s, m) => s + Number(m.price_eur ?? 0), 0)
  const generated = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const rows = missions
    .slice()
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .map((m) => {
      const date = new Date(m.completed_at ?? m.scheduled_at).toLocaleDateString('fr-FR')
      const type = m.type === 'CPAM' ? 'CPAM' : m.type === 'PRIVE' ? 'Privé' : '—'
      const price = Number(m.price_eur ?? 0).toFixed(2).replace('.', ',')
      const trip = `${escapeHtml(m.departure)} → ${escapeHtml(m.destination)}`
      return `<tr><td>${date}</td><td>${type}</td><td class="trip">${trip}</td><td class="price">${price} €</td></tr>`
    })
    .join('')

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Facture TaxiLink ${invoiceNumber}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif; color: #1A1A1A; max-width: 900px; margin: 0 auto; padding: 32px; background: #fff; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1A1A1A; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { font-size: 28px; font-weight: 900; letter-spacing: -0.02em; }
  .brand .y { color: #FFD11A; }
  .meta { text-align: right; font-size: 12px; color: #555; line-height: 1.6; }
  .meta strong { color: #1A1A1A; }
  h1 { font-size: 18px; margin: 0 0 4px; font-weight: 800; }
  .period { font-size: 13px; color: #555; margin-bottom: 24px; }
  .driver-block { background: #F7F5EF; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 12.5px; line-height: 1.6; }
  .driver-block .label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { text-align: left; background: #1A1A1A; color: #fff; font-weight: 700; padding: 8px 10px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; }
  thead th:last-child { text-align: right; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #E8E6DF; }
  tbody td.price { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  tbody td.trip { color: #555; }
  tbody tr:nth-child(even) td { background: #FAFAF6; }
  .totals { margin-top: 24px; display: flex; justify-content: flex-end; }
  .totals-table { min-width: 280px; font-size: 12.5px; }
  .totals-table td { padding: 5px 10px; }
  .totals-table tr.sep td { border-top: 1px solid #E8E6DF; }
  .totals-table tr.grand td { border-top: 2px solid #1A1A1A; font-size: 15px; font-weight: 900; padding-top: 8px; }
  .totals-table td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #E8E6DF; font-size: 10.5px; color: #888; line-height: 1.5; }
  .actions { margin-top: 24px; text-align: center; }
  .actions button { background: #1A1A1A; color: #FFD11A; border: none; padding: 10px 20px; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; }
  @media print { .actions { display: none; } body { padding: 16px; } }
</style>
</head>
<body>
<header>
  <div>
    <div class="brand">Taxi<span class="y">Link</span></div>
    <div class="period">Facture trimestrielle – ${periodLabel}</div>
  </div>
  <div class="meta">
    <strong>Facture n°</strong> ${invoiceNumber}<br/>
    <strong>Émise le</strong> ${generated}<br/>
    <strong>${missions.length}</strong> course${missions.length > 1 ? 's' : ''}
  </div>
</header>

<div class="driver-block">
  <div class="label">Émetteur</div>
  <div><strong>${escapeHtml(driver.name)}</strong></div>
  ${driver.email ? `<div>${escapeHtml(driver.email)}</div>` : ''}
  ${driver.phone ? `<div>${escapeHtml(driver.phone)}</div>` : ''}
</div>

<h1>Détail des courses</h1>

<table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Type</th>
      <th>Trajet</th>
      <th>Montant</th>
    </tr>
  </thead>
  <tbody>${rows || '<tr><td colspan="4" style="text-align:center; color:#999; padding:24px;">Aucune course sur la période</td></tr>'}</tbody>
</table>

<div class="totals">
  <table class="totals-table">
    <tr><td>Total CPAM</td><td>${cpamTotal.toFixed(2).replace('.', ',')} €</td></tr>
    <tr><td>Total Privé</td><td>${priveTotal.toFixed(2).replace('.', ',')} €</td></tr>
    <tr class="grand"><td>TOTAL HT</td><td>${total.toFixed(2).replace('.', ',')} €</td></tr>
  </table>
</div>

<footer>
  Document généré automatiquement par TaxiLink. TVA non applicable, art. 293 B du CGI (sauf mention contraire).
  Pour toute correction, contactez le support TaxiLink.
</footer>

<div class="actions">
  <button onclick="window.print()">Imprimer / Sauvegarder en PDF</button>
</div>

<script>setTimeout(function(){ try { window.print() } catch (e) {} }, 400)</script>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
