import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/LegalPageShell'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — TaxiLink',
  description: 'Comment TaxiLink collecte, utilise et protège vos données personnelles.',
  robots: { index: true, follow: true },
}

export default function ConfidentialitePage() {
  return (
    <LegalPageShell title="Politique de confidentialité" lastUpdated="27 avril 2026">
      <Section title="1. Responsable du traitement">
        <p>
          Le responsable du traitement des données personnelles est l&apos;éditeur de TaxiLink
          (cf. <a href="/mentions-legales" className="underline font-semibold">mentions légales</a>).
        </p>
        <p>
          Pour toute question relative au traitement des données :
          {' '}<a href="mailto:support@taxilink.fr" className="underline font-semibold">support@taxilink.fr</a>.
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p>TaxiLink collecte les catégories de données suivantes :</p>

        <H3>2.1 Compte et profil</H3>
        <List>
          <li>Identification : email, prénom, nom, mot de passe (haché en base, jamais lisible)</li>
          <li>Contact : numéro de téléphone</li>
          <li>Profil chauffeur : numéro professionnel (carte pro), modèle et plaque du véhicule, type de véhicule, statut de conventionnement CPAM</li>
          <li>Préférences : départements d&apos;activité, mode d&apos;affichage (clair/sombre), groupes épinglés</li>
        </List>

        <H3>2.2 Documents (chauffeurs)</H3>
        <List>
          <li>Pièces justificatives : carte professionnelle, permis de conduire, attestation d&apos;assurance, carte grise, conventionnement CPAM</li>
          <li>Date d&apos;expiration de chaque document</li>
        </List>

        <H3>2.3 Missions et courses</H3>
        <List>
          <li>Adresses : départ, destination (texte + coordonnées GPS)</li>
          <li>Trajet : distance, durée, prix calculé</li>
          <li>Type de course : CPAM, privée, partagée via groupe</li>
          <li>Pour les courses CPAM uniquement : nom du patient, motif médical, accompagnant, transport TPMR</li>
        </List>
        <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[13px]">
          <strong>Données sensibles (Article 9 RGPD) :</strong> le motif médical et l&apos;identité du patient sont
          des données concernant la santé. Leur traitement est strictement limité à l&apos;exécution
          du transport sanitaire et au remboursement CPAM, sur la base du consentement explicite
          du patient recueilli par le chauffeur. <strong>[À VALIDER : procédure de recueil du consentement
          patient à formaliser et à documenter dans une fiche DPIA.]</strong>
        </p>

        <H3>2.4 Paiement</H3>
        <List>
          <li>Coordonnées bancaires du chauffeur : IBAN (chiffré au repos)</li>
          <li>Historique des paiements : montants, dates, statuts</li>
        </List>

        <H3>2.5 Géolocalisation et présence</H3>
        <List>
          <li>Position GPS du chauffeur : collectée uniquement quand il a activé le statut « En ligne », pour afficher les missions à proximité</li>
          <li>État de présence : `is_online`, `last_seen_at` (mis à jour toutes les 60 s pendant la connexion)</li>
        </List>

        <H3>2.6 Données techniques</H3>
        <List>
          <li>Logs serveur : adresse IP, user-agent, timestamps des requêtes (à des fins de sécurité et de débogage)</li>
          <li>Cookies fonctionnels : authentification, préférence de mode sombre, état d&apos;épinglage</li>
        </List>
      </Section>

      <Section title="3. Finalités et bases légales">
        <List>
          <li><strong>Exécution du contrat</strong> (Art. 6.1.b RGPD) : création du compte, mise en relation chauffeur-client, partage de courses entre chauffeurs, calcul des tarifs, paiement</li>
          <li><strong>Obligation légale</strong> (Art. 6.1.c RGPD) : conservation des factures (6 ans, Art. L.123-22 du Code de commerce), conformité CPAM</li>
          <li><strong>Consentement explicite</strong> (Art. 9.2.a RGPD) : traitement des données médicales (motif, identité patient) pour les courses CPAM</li>
          <li><strong>Intérêt légitime</strong> (Art. 6.1.f RGPD) : sécurité de la plateforme, prévention de la fraude, amélioration du service</li>
        </List>
      </Section>

      <Section title="4. Durées de conservation">
        <List>
          <li>Compte actif : pendant toute la durée de la relation contractuelle</li>
          <li>Compte clôturé : suppression dans les 30 jours suivant la demande, sauf obligations légales (factures)</li>
          <li>Factures et données comptables : <strong>6 ans</strong> à compter de leur émission (obligation légale)</li>
          <li>Données médicales (motif, patient) : <strong>[À VALIDER avec un avocat — recommandation : durée minimale strictement nécessaire au remboursement CPAM, typiquement 90 jours après paiement, puis archivage anonymisé ou suppression]</strong></li>
          <li>Géolocalisation : non persistée — uniquement présente le temps de la session en ligne</li>
          <li>Logs techniques : <strong>1 an</strong> maximum</li>
        </List>
      </Section>

      <Section title="5. Destinataires des données">
        <List>
          <li>Personnel autorisé de TaxiLink (support, administration technique)</li>
          <li>Hébergeur Supabase Inc. (sous-traitant) — infrastructure AWS région Europe-Paris</li>
          <li>Pour les courses CPAM : transmission des justificatifs au régime obligatoire d&apos;assurance maladie (CNAM/CPAM) dans le cadre du tiers-payant, conformément à la convention nationale</li>
          <li>En cas d&apos;obligation légale : autorités judiciaires ou administratives sur réquisition</li>
        </List>
        <p>
          Aucune donnée n&apos;est revendue à des tiers à des fins commerciales ou publicitaires.
        </p>
      </Section>

      <Section title="6. Transferts hors Union européenne">
        <p>
          Les données sont stockées en région Europe-Paris (AWS eu-west-3). Le sous-traitant
          Supabase Inc. (États-Unis) peut accéder aux données dans le cadre de l&apos;administration
          technique de l&apos;infrastructure. Ces accès sont encadrés par des Clauses Contractuelles
          Types (CCT) approuvées par la Commission européenne.
        </p>
      </Section>

      <Section title="7. Sécurité">
        <List>
          <li>Chiffrement TLS 1.3 pour toutes les communications</li>
          <li>Mots de passe hachés (bcrypt) — jamais stockés en clair</li>
          <li>Row Level Security (RLS) PostgreSQL : un chauffeur ne peut accéder qu&apos;à ses propres données</li>
          <li>Authentification forte recommandée (Google OAuth)</li>
          <li>Sauvegardes quotidiennes chiffrées</li>
        </List>
      </Section>

      <Section title="8. Vos droits">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <List>
          <li>Droit d&apos;accès, de rectification, d&apos;effacement</li>
          <li>Droit à la portabilité de vos données</li>
          <li>Droit d&apos;opposition et de limitation du traitement</li>
          <li>Droit de retirer votre consentement à tout moment</li>
          <li>Droit d&apos;introduire une réclamation auprès de la CNIL</li>
        </List>
        <p>
          Voir la <a href="/rgpd" className="underline font-semibold">page RGPD</a> pour la procédure d&apos;exercice de chaque droit.
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
