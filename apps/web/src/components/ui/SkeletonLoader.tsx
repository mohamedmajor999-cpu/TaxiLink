interface SkeletonLoaderProps {
  count?: number
  height?: string
  className?: string
}

export function SkeletonLoader({ count = 3, height = 'h-40', className = '' }: SkeletonLoaderProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-white rounded-2xl shadow-soft animate-pulse ${className}`}
        />
      ))}
    </div>
  )
}
