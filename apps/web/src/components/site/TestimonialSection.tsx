export function TestimonialSection() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-warm-50">
      <div className="max-w-3xl mx-auto px-6 text-center">

        <blockquote className="font-serif text-display-sm md:text-display-md italic text-ink mb-6 leading-tight">
          « Fini les 500 messages par jour sur WhatsApp. »
        </blockquote>

        <p className="text-base text-warm-600 leading-relaxed mb-8 max-w-xl mx-auto">
          « Une vraie alternative à nos vieux groupes WhatsApp. Enfin du calme — et je vois direct si mes collègues sont dispo. »
        </p>

        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-warm-200 flex items-center justify-center font-bold text-sm text-ink">
            PM
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-ink">Pascal M.</p>
            <p className="text-xs text-warm-500">Chauffeur Taxi13 · Marseille 13003</p>
          </div>
        </div>

      </div>
    </section>
  )
}
