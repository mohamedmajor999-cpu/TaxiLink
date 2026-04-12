import { Icon } from '@/components/ui/Icon'

interface Props {
  validCount: number
  total: number
}

export function DocProgressBar({ validCount, total }: Props) {
  const remaining = total - validCount
  return (
    <div className="bg-white rounded-2xl shadow-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-secondary">Dossier complété</p>
        <p className="font-black text-secondary">{validCount}/{total}</p>
      </div>
      <div className="h-2.5 bg-bgsoft rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(validCount / total) * 100}%` }} />
      </div>
      {validCount === total ? (
        <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
          <Icon name="verified" size={13} />Dossier complet — compte vérifié
        </p>
      ) : (
        <p className="text-xs text-muted mt-2">
          {remaining} document{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
