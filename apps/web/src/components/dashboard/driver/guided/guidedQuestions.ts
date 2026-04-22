// Liste déclarative des questions du flux guidé, ordonnée par catégorie.
// Le prix n'est pas demandé ici : il est auto-estimé puis modifiable sur la prévisu.
import {
  always,
  isCpam,
  isCpamReturn,
  isGroupVisibility,
  isPrive,
  type GuidedQuestion,
  type GuidedVisibilityState,
} from './guidedTypes'

export const GUIDED_QUESTIONS: GuidedQuestion[] = [
  // 1. Type de course
  {
    id: 'type',
    category: 'type',
    prompt: 'Est-ce une course CPAM ou une course privée ?',
    shortLabel: 'Type de course',
    kind: 'choice',
    isVisible: always,
    options: [
      { value: 'CPAM', label: 'CPAM', aliases: ['cpam', 'médical', 'medical', 'sécu', 'secu'] },
      { value: 'PRIVE', label: 'Privé', aliases: ['privé', 'prive', 'privée', 'privee'] },
    ],
  },
  {
    id: 'medicalMotif',
    category: 'type',
    prompt: 'Quel est le motif médical : hôpital de jour ou consultation ?',
    shortLabel: 'Motif médical',
    kind: 'choice',
    isVisible: isCpam,
    options: [
      { value: 'HDJ', label: 'Hôpital de jour', aliases: ['hdj', 'hôpital de jour', 'hopital de jour', 'hospitalisation de jour'] },
      { value: 'CONSULTATION', label: 'Consultation', aliases: ['consultation', 'rdv', 'rendez-vous', 'rendez vous'] },
    ],
  },

  // 2. Patient / Client
  {
    id: 'patientName',
    category: 'patient',
    prompt: 'Quel est le nom du patient ?',
    shortLabel: 'Nom du patient',
    kind: 'text',
    isVisible: isCpam,
  },
  {
    id: 'transportType',
    category: 'patient',
    prompt: 'Type de transport : assis, fauteuil roulant ou brancard ?',
    shortLabel: 'Type de transport',
    kind: 'choice',
    isVisible: isCpam,
    options: [
      { value: 'SEATED', label: 'Assis', aliases: ['assis', 'assise', 'classique', 'normal'] },
      { value: 'WHEELCHAIR', label: 'Fauteuil roulant', aliases: ['fauteuil', 'fauteuil roulant', 'roulant'] },
      { value: 'STRETCHER', label: 'Brancard', aliases: ['brancard', 'allongé', 'allonge', 'couché', 'couche'] },
    ],
  },
  {
    id: 'phone',
    category: 'patient',
    prompt: 'Un numéro de téléphone de contact ? Vous pouvez passer si non.',
    shortLabel: 'Téléphone',
    kind: 'phone',
    optional: true,
    isVisible: always,
  },

  // 3. Trajet
  {
    id: 'departure',
    category: 'trajet',
    prompt: 'Quelle est l’adresse de départ ?',
    shortLabel: 'Adresse de départ',
    kind: 'address',
    isVisible: always,
  },
  {
    id: 'destination',
    category: 'trajet',
    prompt: 'Quelle est l’adresse d’arrivée ?',
    shortLabel: 'Adresse d’arrivée',
    kind: 'address',
    isVisible: always,
  },

  // 4. Date & horaire
  { id: 'date', category: 'horaire', prompt: 'Pour quelle date ?', shortLabel: 'Date', kind: 'date', isVisible: always },
  { id: 'time', category: 'horaire', prompt: 'À quelle heure de départ ?', shortLabel: 'Heure de départ', kind: 'time', isVisible: always },
  { id: 'returnTrip', category: 'horaire', prompt: 'S’agit-il d’un aller-retour ?', shortLabel: 'Aller-retour', kind: 'boolean', isVisible: isCpam },
  { id: 'returnTime', category: 'horaire', prompt: 'À quelle heure le retour ?', shortLabel: 'Heure de retour', kind: 'time', isVisible: isCpamReturn },

  // 5. Accompagnement
  { id: 'passengers', category: 'accompagnement', prompt: 'Combien de passagers ?', shortLabel: 'Nombre de passagers', kind: 'passengers', isVisible: isPrive },
  { id: 'companion', category: 'accompagnement', prompt: 'Un accompagnant sera-t-il présent ?', shortLabel: 'Accompagnant', kind: 'boolean', isVisible: isCpam },

  // 6. Diffusion
  {
    id: 'visibility',
    category: 'diffusion',
    prompt: 'Course visible publiquement ou limitée à vos groupes ?',
    shortLabel: 'Visibilité',
    kind: 'choice',
    isVisible: always,
    options: [
      { value: 'PUBLIC', label: 'Publique', aliases: ['publique', 'public', 'tout le monde', 'ouverte'] },
      { value: 'GROUP', label: 'Groupes', aliases: ['groupe', 'groupes', 'mes groupes', 'privée', 'limitée'] },
    ],
  },
  { id: 'groupIds', category: 'diffusion', prompt: 'Quels groupes ?', shortLabel: 'Groupes', kind: 'groups', isVisible: isGroupVisibility },
]

export function getVisibleQuestions(state: GuidedVisibilityState): GuidedQuestion[] {
  return GUIDED_QUESTIONS.filter((q) => q.isVisible(state))
}
