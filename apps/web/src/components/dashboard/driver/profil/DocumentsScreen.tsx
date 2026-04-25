'use client'
import { ArrowLeft } from 'lucide-react'
import { useDocumentsScreen, type DocumentRowData } from './useDocumentsScreen'
import { DocumentRow } from './DocumentRow'
import { DocumentExpiryBanner } from './DocumentExpiryBanner'

interface Props {
  onBack: () => void
  onOpenDocument?: (type: string) => void
}

export function DocumentsScreen({ onBack, onOpenDocument }: Props) {
  const s = useDocumentsScreen()

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="w-9 h-9 rounded-full grid place-items-center hover:bg-warm-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
            Documents
          </h1>
          {!s.loading && (
            <p className="text-[12.5px] text-warm-500 mt-0.5">
              {s.validCount} / {s.totalCount} à jour
            </p>
          )}
        </div>
      </header>

      {s.earliestExpiringAlert && (
        <DocumentExpiryBanner
          docLabel={s.earliestExpiringAlert.docLabel}
          daysLeft={s.earliestExpiringAlert.daysLeft}
        />
      )}

      {s.error && (
        <div className="bg-danger-soft text-danger text-[12px] px-3 py-2 rounded-xl mb-4">
          {s.error}
        </div>
      )}

      <DocSection title="Obligatoires" rows={s.mandatory} onOpen={onOpenDocument} />
      <DocSection title="Optionnels"   rows={s.optional}  onOpen={onOpenDocument} />
    </div>
  )
}

function DocSection({
  title, rows, onOpen,
}: {
  title: string
  rows: DocumentRowData[]
  onOpen?: (type: string) => void
}) {
  if (rows.length === 0) return null
  return (
    <section className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-500 px-1 mb-2">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <DocumentRow
            key={r.type}
            label={r.label}
            status={r.status}
            expiryLabel={r.expiryLabel}
            cta={r.cta}
            onClick={onOpen ? () => onOpen(r.type) : undefined}
          />
        ))}
      </div>
    </section>
  )
}
