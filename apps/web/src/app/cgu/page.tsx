import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/LegalPageShell'

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation — TaxiLink',
  description: 'Conditions d\'utilisation de la plateforme TaxiLink pour les chauffeurs de taxi et leurs clients.',
  robots: { index: true, follow: true },
}

export default function CGUPage() {
  return (
    <LegalPageShell title="Conditions générales d'utilisation" lastUpdated="27 avril 2026">
      <Section title="1. Objet">
        <p>
          Les présentes conditions générales d&apos;utilisation (« CGU ») définissent les modalités
          d&apos;accès et d&apos;utilisation de la plateforme TaxiLink, qui met en relation des chauffeurs
          de taxi professionnels entre eux pour le partage de courses, ainsi qu&apos;avec leurs
          clients particuliers ou conventionnés.
        </p>
        <p>
          L&apos;utilisation de TaxiLink implique l&apos;acceptation pleine et entière des présentes CGU.
        </p>
      </Section>

      <Section title="2. Définitions">
        <List>
          <li><strong>Plateforme</strong> : l&apos;application web et mobile TaxiLink</li>
          <li><strong>Éditeur</strong> : la société éditrice de TaxiLink (cf. <a href="/mentions-legales" className="underline">mentions légales</a>)</li>
          <li><strong>Chauffeur</strong> : utilisateur professionnel titulaire d&apos;une carte professionnelle de taxi en cours de validité</li>
          <li><strong>Client</strong> : personne physique majeure réservant une course via la plateforme</li>
          <li><strong>Mission</strong> : course de taxi proposée, partagée ou acceptée via la plateforme</li>
          <li><strong>Groupe</strong> : ensemble de chauffeurs partageant des missions entre eux</li>
          <li><strong>Course CPAM</strong> : transport sanitaire conventionné, soumis à la convention nationale CNAM</li>
        </List>
      </Section>

      <Section title="3. Nature du service">
        <p className="bg-warm-50 border border-warm-200 rounded-xl p-3 text-[13.5px]">
          <strong>TaxiLink est un intermédiaire technique.</strong> L&apos;éditeur n&apos;est pas un transporteur,
          ni l&apos;employeur des chauffeurs. Chaque chauffeur exerce en toute indépendance,
          sous sa propre responsabilité professionnelle et avec ses propres assurances.
          La plateforme se borne à faciliter la mise en relation et la gestion des courses.
        </p>
      </Section>

      <Section title="4. Inscription et accès">
        <H3>4.1 Conditions chauffeur</H3>
        <List>
          <li>Être titulaire d&apos;une carte professionnelle de taxi en cours de validité</li>
          <li>Exploiter une autorisation de stationnement (ADS) valide ou être employé par un titulaire d&apos;ADS</li>
          <li>Disposer d&apos;une assurance professionnelle couvrant le transport de personnes</li>
          <li>Téléverser et maintenir à jour les pièces justificatives demandées (carte pro, permis, assurance, conventionnement CPAM si applicable)</li>
          <li>Être majeur</li>
        </List>

        <H3>4.2 Conditions client</H3>
        <List>
          <li>Être majeur (ou mineur représenté par un responsable légal)</li>
          <li>Fournir des informations exactes et à jour</li>
        </List>

        <H3>4.3 Compte unique</H3>
        <p>
          Chaque utilisateur s&apos;engage à n&apos;ouvrir qu&apos;un seul compte et à conserver ses
          identifiants confidentiels. L&apos;éditeur se réserve le droit de suspendre tout compte
          présentant des indices d&apos;usurpation ou de duplication.
        </p>
      </Section>

      <Section title="5. Fonctionnalités principales">
        <List>
          <li>Création et acceptation de missions entre chauffeurs (groupes privés)</li>
          <li>Réception de réservations clients</li>
          <li>Calcul automatique des tarifs (privé selon arrêté préfectoral, CPAM selon convention CNAM)</li>
          <li>Suivi documentaire (échéances de carte pro, assurance, etc.)</li>
          <li>Gestion des paiements et reçus</li>
        </List>
      </Section>

      <Section title="6. Tarification des courses">
        <H3>6.1 Courses privées</H3>
        <p>
          Les tarifs sont calculés conformément à <strong>l&apos;arrêté préfectoral en vigueur</strong> du
          département concerné. Pour les Bouches-du-Rhône : arrêté n° 13-2026-02-03-00010
          (à mettre à jour à chaque révision préfectorale).
        </p>

        <H3>6.2 Courses CPAM</H3>
        <p>
          Les courses conventionnées sont facturées selon la <strong>convention nationale entre la CNAM
          et les organisations représentatives des taxis</strong> (arrêté du 29 juillet 2025, en vigueur
          au 1er novembre 2025).
        </p>

        <H3>6.3 Service TaxiLink</H3>
        <p>
          L&apos;utilisation de la plateforme est <strong>gratuite</strong> pour les chauffeurs et les clients
          dans la version actuelle. <strong>[À VALIDER : modèle économique cible si évolution
          payante prévue.]</strong>
        </p>
      </Section>

      <Section title="7. Obligations du chauffeur">
        <List>
          <li>Respecter le code de la route, le code des transports et la réglementation taxi</li>
          <li>Maintenir à jour ses pièces justificatives et signaler toute suspension de licence</li>
          <li>Souscrire et maintenir une assurance professionnelle couvrant ses passagers</li>
          <li>Honorer les courses acceptées sauf cas de force majeure</li>
          <li>Respecter le secret professionnel pour les courses CPAM (identité et état de santé du patient)</li>
          <li>Ne pas utiliser la plateforme pour des activités illicites, discriminatoires ou contraires aux bonnes mœurs</li>
        </List>
      </Section>

      <Section title="8. Annulations">
        <List>
          <li>Une course acceptée ne peut être annulée par le chauffeur que pour motif légitime (panne, accident, urgence personnelle)</li>
          <li>Les annulations abusives répétées peuvent entraîner suspension du compte</li>
          <li>Le client peut annuler avant prise en charge ; les frais éventuels sont régis par les CGV en vigueur</li>
        </List>
      </Section>

      <Section title="9. Responsabilité">
        <H3>9.1 Responsabilité de l&apos;éditeur</H3>
        <p>
          L&apos;éditeur est tenu d&apos;une obligation de moyens concernant la disponibilité de la
          plateforme. Il ne saurait être tenu responsable des incidents survenant pendant la
          course (qui relèvent du chauffeur et de son assurance professionnelle), ni des contenus
          fournis par les utilisateurs.
        </p>

        <H3>9.2 Limitation</H3>
        <p>
          La responsabilité de l&apos;éditeur est, en tout état de cause, limitée au montant des
          sommes effectivement perçues au titre de l&apos;abonnement, le cas échéant, sur les douze
          mois précédant la survenance du dommage.
        </p>
      </Section>

      <Section title="10. Suspension et résiliation">
        <p>
          L&apos;éditeur peut suspendre ou clôturer un compte en cas de manquement aux présentes
          CGU, après notification (sauf urgence justifiée). L&apos;utilisateur peut clôturer son
          compte à tout moment depuis son profil ou par demande écrite à
          {' '}<a href="mailto:support@taxilink.fr" className="underline">support@taxilink.fr</a>.
        </p>
      </Section>

      <Section title="11. Données personnelles">
        <p>
          Le traitement des données est régi par la
          {' '}<a href="/confidentialite" className="underline font-semibold">politique de confidentialité</a>
          {' '}et la <a href="/rgpd" className="underline font-semibold">page RGPD</a>.
        </p>
      </Section>

      <Section title="12. Modifications">
        <p>
          L&apos;éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les
          utilisateurs sont informés des modifications par email ou notification dans
          l&apos;application au moins 30 jours avant l&apos;entrée en vigueur des nouvelles CGU.
        </p>
      </Section>

      <Section title="13. Droit applicable et juridiction">
        <p>
          Les présentes CGU sont soumises au <strong>droit français</strong>. Tout litige relatif à leur
          exécution ou interprétation relève, à défaut de résolution amiable, des tribunaux
          compétents du ressort du siège social de l&apos;éditeur.
        </p>
        <p>
          Conformément aux articles L.611-1 et suivants du Code de la consommation, le client
          consommateur peut recourir gratuitement à un médiateur de la consommation
          ({' '}<strong>[À COMPLÉTER : nom et coordonnées du médiateur de la consommation choisi par l&apos;éditeur]</strong>).
        </p>
      </Section>
    </LegalPageShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[18px] md:text-[20px] font-bold text-ink mt-8 mb-3 tracking-tight">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[15px] md:text-[16px] font-semibold text-ink mt-5 mb-2">{children}</h3>
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5">{children}</ul>
}
