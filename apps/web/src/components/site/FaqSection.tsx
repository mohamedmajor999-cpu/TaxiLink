const FAQS = [
  { q: "C'est vraiment gratuit ?",               a: 'Oui. Aucune carte bancaire, aucune commission, aucune pub. Les chauffeurs ne paient jamais.' },
  { q: 'Différence avec WhatsApp ?',             a: 'WhatsApp est une messagerie. TaxiLink est un outil métier : une fiche par course, un propriétaire unique, pas de doublons, un historique complet.' },
  { q: 'La dictée vocale, comment ça marche ?',  a: "Maintenez le micro et parlez. L'IA extrait le type de course, les adresses, la date et l'heure. Vous validez d'un pouce." },
  { q: 'Mes données sont-elles en sécurité ?',   a: 'Serveurs français, chiffrement bout en bout, RGPD complet. Exportez ou supprimez à tout moment.' },
]

export function FaqSection() {
  return (
    <section id="faq" className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[1.5px] px-3 py-1.5 rounded-md bg-warm-100 text-warm-600 mb-4">
          FAQ
        </div>
        <h2 className="font-extrabold tracking-[-1.8px] leading-[1.05] text-[clamp(32px,5vw,56px)] max-w-[16ch] mx-auto">
          Questions <span className="text-warm-300">fréquentes.</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-x-12">
        {FAQS.map((item, i) => (
          <details key={i} className="group border-b border-warm-200 py-[22px] px-1 first:border-t md:[&:nth-child(2)]:border-t">
            <summary className="list-none cursor-pointer flex items-center justify-between gap-5 font-extrabold tracking-[-0.4px] text-[17px]">
              <span>{item.q}</span>
              <span className="w-[30px] h-[30px] rounded-full border-[1.5px] border-warm-200 flex items-center justify-center text-[18px] text-warm-500 transition-all shrink-0 group-open:bg-brand group-open:border-brand group-open:text-ink group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="mt-3 text-[14.5px] text-warm-500 leading-relaxed max-w-[60ch]">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
