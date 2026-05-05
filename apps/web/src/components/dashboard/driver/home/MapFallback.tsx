export function MapFallback() {
  return (
    <div className="w-full h-full bg-paper flex items-center justify-center">
      <span className="text-[12px] font-semibold text-warm-500 motion-safe:animate-pulse">
        Chargement de la carte…
      </span>
    </div>
  )
}
