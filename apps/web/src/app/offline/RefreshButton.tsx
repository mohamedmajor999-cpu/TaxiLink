'use client'

export function RefreshButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="h-12 px-6 rounded-2xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
      Réessayer
    </button>
  )
}
