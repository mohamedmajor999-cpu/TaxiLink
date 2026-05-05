/**
 * Ouvre WhatsApp avec un message prérempli pointant vers la page publique
 * d'une course (`/c/[id]`). Le lien expose une preview Open Graph (image
 * dynamique) que WhatsApp/Messenger/SMS pré-affichent automatiquement.
 *
 * Mobile : navigation vers `wa.me` qui deeplink l'app installée.
 * Desktop : nouvel onglet vers WhatsApp Web.
 */
export function shareCourseOnWhatsApp(opts: {
  id: string
  departure: string
  destination: string
}) {
  const url = `${window.location.origin}/c/${opts.id}`
  const text = `Course taxi : ${opts.departure} → ${opts.destination}\n${url}`
  const a = document.createElement('a')
  a.href = `https://wa.me/?text=${encodeURIComponent(text)}`
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.click()
}
