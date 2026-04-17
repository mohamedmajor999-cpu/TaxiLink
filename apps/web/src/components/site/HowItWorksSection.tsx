const STEPS = [
  {
    num: '01',
    title: 'Dictez la course',
    desc: "'Course médicale Hôpital Nord depuis La Rose, 38€, CPAM.' L'IA détecte tout et remplit le formulaire.",
  },
  {
    num: '02',
    title: 'Un collègue accepte',
    desc: "La course s'affiche dans vos groupes. Un chauffeur appuie 2 secondes pour confirmer. Vous êtes notifié.",
  },
  {
    num: '03',
    title: "Elle part dans l'agenda",
    desc: "La course s'ajoute automatiquement à son agenda avec l'heure, l'itinéraire et le paiement. Rien à faire.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-paper">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-warm-500 mb-3">Comment ça marche</p>
          <h2 className="font-serif text-display-md text-ink">3 étapes. 30 secondes. Zéro friction.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map(({ num, title, desc }) => (
            <div key={num} className="relative">
              <p className="font-serif text-[64px] leading-none text-warm-200 mb-4 select-none">{num}</p>
              <h3 className="font-semibold text-ink text-lg mb-3">{title}</h3>
              <p className="text-sm text-warm-600 leading-relaxed">{desc}</p>
              {num !== '03' && (
                <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 w-8 h-px bg-warm-300" />
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
