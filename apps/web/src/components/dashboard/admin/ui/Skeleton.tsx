interface Props {
  className?: string
}

export function Skeleton({ className = 'h-4 w-full rounded' }: Props) {
  return <div className={`animate-pulse bg-bgsoft ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-line">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3 rounded animate-pulse bg-bgsoft" />
          <Skeleton className="h-7 w-2/3 rounded animate-pulse bg-bgsoft" />
        </div>
        <Skeleton className="h-7 w-16 rounded animate-pulse bg-bgsoft" />
      </div>
    </div>
  )
}
