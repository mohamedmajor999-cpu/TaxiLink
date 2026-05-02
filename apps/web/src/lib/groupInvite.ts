// Construit le texte d'invitation à un groupe partagé via SMS/WhatsApp/etc.
// Centralisé pour rester cohérent entre la liste (useGroupCard) et le détail
// (GroupDetailScreen) — tout changement de copy se fait à un seul endroit.
//
// Philosophie du message :
// - 1ère ligne = pitch en 6 mots (ce que fait TaxiLink, pour qui)
// - 2ème bloc = bénéfice concret en langage de taxi (« confrère », « filer une course »)
// - Pas de jargon (« plateforme », « invité(e) ») — voir mémoire landing simple
export function buildGroupInviteText(args: {
  groupId:   string
  groupName: string
  /** Nom complet du chauffeur qui invite (ex: "Mohamed Major") */
  inviterName?: string
  /** Origin du site (auto-détecté côté browser, fallback prod sinon) */
  origin?: string
}): string {
  const origin = args.origin
    ?? (typeof window !== 'undefined' ? window.location.origin : 'https://taxilink.fr')
  const link  = `${origin}/rejoindre/${args.groupId}`
  const first = (args.inviterName?.split(' ')[0] ?? '').trim()
  const intro = first ? `${first} t'invite` : `Tu es invité`
  return (
    `🚕 TaxiLink — on se passe les courses entre taxis.\n\n` +
    `${intro} dans son groupe « ${args.groupName} ».\n` +
    `Quand un confrère ne peut pas prendre une course, il la file au groupe.\n\n` +
    `Rejoins ici 👇\n${link}`
  )
}
