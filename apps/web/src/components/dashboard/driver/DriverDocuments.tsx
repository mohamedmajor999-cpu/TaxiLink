'use client'

import { Icon } from '@/components/ui/Icon'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { DocProgressBar } from './DocProgressBar'
import { DocCard } from './DocCard'
import { useDriverDocuments } from './useDriverDocuments'

export function DriverDocuments() {
  const { docs, loading, allTypes, validCount, uploading, error, fileInputRef, triggerUpload, handleFileChange } =
    useDriverDocuments()

  if (loading) return <SkeletonLoader count={3} height="h-24" />

  return (
    <div className="max-w-2xl space-y-6 pb-20 md:pb-0">
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

      <div>
        <h2 className="text-2xl font-black text-secondary mb-1">Documents</h2>
        <p className="text-muted text-sm">Gérez vos documents professionnels</p>
      </div>

      <DocProgressBar validCount={validCount} total={allTypes.length} />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <Icon name="error" size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {allTypes.map((type) => (
          <DocCard
            key={type}
            type={type}
            doc={docs.find((d) => d.type === type)}
            isUploading={uploading === type}
            onUpload={triggerUpload}
          />
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Icon name="info" size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Les documents sont vérifiés manuellement sous 24-48h ouvrées. Formats acceptés : PDF, JPG, PNG.
        </p>
      </div>
    </div>
  )
}
