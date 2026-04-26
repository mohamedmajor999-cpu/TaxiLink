'use client'
import { CalendarClock, Share2, History, Plus } from 'lucide-react'

interface Props {
  onPostCourse: () => void
}

export function CoursesEmptyOnboarding({ onPostCourse }: Props) {
  return (
    <div className="py-6 text-center">
      <div
        aria-hidden="true"
        className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand text-ink flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #FFD23F, #FFAA00)' }}
      >
        <Share2 className="w-10 h-10" strokeWidth={2} />
      </div>
      <h3 className="text-[18px] font-extrabold text-ink leading-tight">Bienvenue sur TaxiLink&nbsp;!</h3>
      <p className="text-[13px] text-warm-500 mt-1.5 mb-5 max-w-sm mx-auto leading-snug">
        Voici comment fonctionne votre espace courses :
      </p>

      <div className="flex flex-col gap-2 max-w-md mx-auto text-left">
        <Card icon={<CalendarClock className="w-5 h-5" strokeWidth={1.8} />} bg="bg-[#FEF3C7]" fg="text-[#92400E]" title="À venir" desc="Vos courses du jour, triées par heure. Une carte mise en avant pour la prochaine, alerte rouge si imminente." />
        <Card icon={<Share2 className="w-5 h-5" strokeWidth={1.8} />} bg="bg-[#DBEAFE]" fg="text-[#1E40AF]" title="Postées" desc="Les courses que vous publiez à votre réseau (Taxi13, etc.) pour qu'un confrère les prenne quand vous êtes occupé." />
        <Card icon={<History className="w-5 h-5" strokeWidth={1.8} />} bg="bg-[#D1FAE5]" fg="text-[#065F46]" title="Historique" desc="Toutes vos courses terminées avec stats, filtres CPAM/Privé et facture PDF trimestrielle pour la compta." />
      </div>

      <button
        type="button"
        onClick={onPostCourse}
        className="mt-5 inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-ink text-brand text-[13.5px] font-extrabold hover:bg-warm-800 transition-colors"
      >
        <Plus className="w-4 h-4" strokeWidth={2.4} />
        Poster ma 1ʳᵉ course
      </button>
    </div>
  )
}

function Card({ icon, bg, fg, title, desc }: { icon: React.ReactNode; bg: string; fg: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-3 flex gap-3 items-center">
      <div className={`w-10 h-10 rounded-lg flex-shrink-0 inline-flex items-center justify-center ${bg} ${fg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[12.5px] font-extrabold text-ink">{title}</div>
        <div className="text-[10.5px] text-warm-500 mt-0.5 leading-tight">{desc}</div>
      </div>
    </div>
  )
}
