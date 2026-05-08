import { Plus } from 'lucide-react'

interface Props {
  visible: boolean
  sheetHeightPx: number
  onClick: () => void
}

export function PostCourseFab({ visible, sheetHeightPx, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Poster une course"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`md:hidden fixed left-1/2 -translate-x-1/2 z-[610] inline-flex items-center gap-2 h-12 px-5 rounded-full bg-ink text-paper text-[13px] font-bold shadow-[0_10px_28px_rgba(0,0,0,0.32)] active:scale-95 transition-all duration-300 whitespace-nowrap ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ bottom: `calc(${sheetHeightPx}px + 12px + env(safe-area-inset-bottom))` }}
    >
      <Plus className="w-5 h-5" strokeWidth={2.6} />
      Poster une course
    </button>
  )
}
