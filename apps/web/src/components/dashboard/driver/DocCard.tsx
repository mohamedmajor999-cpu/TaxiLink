import { Icon } from '@/components/ui/Icon'
import { formatDateShort } from '@/lib/dateUtils'
import { DOC_CONFIG, DOC_STATUS_MAP, type DocType, type DocStatus } from '@/constants/documentConfig'
import type { Document } from '@/lib/supabase/types'

interface Props {
  type: DocType
  doc: Document | undefined
  isUploading: boolean
  onUpload: (type: DocType) => void
}

export function DocCard({ type, doc, isUploading, onUpload }: Props) {
  const config = DOC_CONFIG[type]
  const status = doc ? DOC_STATUS_MAP[doc.status as DocStatus] : null

  return (
    <div className="bg-white rounded-2xl shadow-soft p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-bgsoft flex items-center justify-center flex-shrink-0">
        <Icon name={config.icon} size={22} className={doc?.status === 'valid' ? 'text-green-600' : 'text-muted'} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-secondary text-sm">{config.label}</p>
          {status && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${status.className}`}>
              <Icon name={status.icon} size={10} />{status.label}
            </span>
          )}
        </div>
        <p className="text-xs text-muted mt-0.5">{config.description}</p>
        {doc?.expiry_date && (
          <p className="text-xs text-muted mt-1 flex items-center gap-1">
            <Icon name="event" size={11} />Expire le {formatDateShort(doc.expiry_date)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {doc?.file_url && (
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-xl bg-bgsoft border border-line flex items-center justify-center hover:bg-accent/10 transition-colors"
            aria-label="Voir le document">
            <Icon name="open_in_new" size={15} className="text-accent" />
          </a>
        )}
        <button onClick={() => onUpload(type)} disabled={isUploading}
          aria-label={doc ? 'Remplacer le document' : 'Ajouter le document'}
          className="h-9 px-3 rounded-xl bg-primary font-bold text-xs text-secondary flex items-center gap-1.5 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-50">
          {isUploading
            ? <><Icon name="sync" size={14} className="animate-spin" />Envoi...</>
            : doc
            ? <><Icon name="upload" size={14} />Remplacer</>
            : <><Icon name="add" size={14} />Ajouter</>}
        </button>
      </div>
    </div>
  )
}
