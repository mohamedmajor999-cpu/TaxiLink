import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/LegalPageShell'

export const metadata: Metadata = {
  title: 'RGPD — Vos droits sur vos données — TaxiLink',
  description: 'Comment exercer vos droits RGPD sur les données personnelles traitées par TaxiLink.',
  robots: { index: true, follow: true },
}

export default function RGPDPage() {
  return (
    <LegalPageShell title="Vos droits sur vos données" lastUpdated="27 avril 2026">
      <p>
        Le règlement général sur la protection des données (RGPD, règlement UE 2016/679) vous
        accorde des droits sur les données personnelles que TaxiLink traite. Cette page résume
        ces droits et la procédure pour les exercer.
      </p>
      <p>
        Pour le détail complet des données collectées et de leurs finalités, consultez la
        {' '}<a href="/confidentialite" className="underline font-semibold">politique de confidentialité</a>.
      </p>

      <Section title="Droit d'accès">
        <p>
          Vous pouvez demander à tout moment une copie des données personnelles que nous détenons
          sur vous. Nous y répondons sous un délai d&apos;un mois maximum (Art. 15 RGPD).
        </p>
      </Section>

      <Section title="Droit de rectification">
        <p>
          Vous pouvez modifier vous-même vos informations dans Profil → Informations personnelles.
          Pour les champs non éditables (email lié au compte, numéro professionnel),
          contactez-nous (Art. 16 RGPD).
        </p>
      </Section>

      <Section title="Droit à l'effacement (« droit à l'oubli »)">
        <p>
          Vous pouvez demander la suppression de vos données. Nous procédons à la suppression
          sous 30 jours, à l&apos;exception des données soumises à conservation légale obligatoire
          (factures conservées 6 ans, Art. L.123-22 du Code de commerce). Les données médicales
          des courses CPAM passées sont supprimées ou anonymisées dès la fin du délai de
          réclamation CPAM (Art. 17 RGPD).
        </p>
      </Section>

      <Section title="Droit à la portabilité">
        <p>
          Vous pouvez demander la copie de vos données dans un format structuré et lisible
          (JSON ou CSV) afin de les transférer à un autre service (Art. 20 RGPD).
        </p>
      </Section>

      <Section title="Droit d'opposition">
        <p>
          Vous pouvez vous opposer au traitement de vos données pour motif légitime, ainsi
          qu&apos;à toute prospection commerciale (Art. 21 RGPD).
        </p>
      </Section>

      <Section title="Droit à la limitation du traitement">
        <p>
          Dans certains cas (contestation de l&apos;exactitude, traitement illicite, conservation
          non nécessaire), vous pouvez demander à ce que vos données ne soient plus traitées
          tout en restant conservées (Art. 18 RGPD).
        </p>
      </Section>

      <Section title="Droit de retirer votre consentement">
        <p>
          Pour les traitements fondés sur votre consentement (notamment les données médicales
          dans le cadre des courses CPAM), vous pouvez retirer votre consentement à tout moment.
          Le retrait n&apos;affecte pas la licéité du traitement effectué auparavant.
        </p>
      </Section>

      <Section title="Comment exercer vos droits">
        <p>
          Adressez votre demande, accompagnée d&apos;une copie d&apos;une pièce d&apos;identité, à :
        </p>
        <ul className="list-none space-y-1 ml-0">
          <li><strong>Email</strong> : <a href="mailto:support@taxilink.fr" className="underline font-semibold">support@taxilink.fr</a></li>
          <li><strong>Courrier</strong> : <span className="italic text-amber-700">[À COMPLÉTER : adresse postale du DPO ou du responsable de traitement]</span></li>
        </ul>
        <p>
          Nous vous répondons dans un délai d&apos;un mois (prolongeable de deux mois en cas de
          demande complexe, avec notification motivée).
        </p>
      </Section>

      <Section title="Réclamation auprès de la CNIL">
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une
          réclamation auprès de la Commission nationale de l&apos;informatique et des libertés (CNIL) :
        </p>
        <ul className="list-none space-y-1 ml-0">
          <li>3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07</li>
          <li>Téléphone : 01 53 73 22 22</li>
          <li>Site : <a href="https://www.cnil.fr/plaintes" className="underline" target="_blank" rel="noopener noreferrer">cnil.fr/plaintes</a></li>
        </ul>
      </Section>

      <Section title="Délégué à la protection des données (DPO)">
        <p className="italic text-amber-700">
          [À COMPLÉTER : un DPO est obligatoire si TaxiLink traite des données de santé à grande
          échelle (Art. 37 RGPD). À évaluer avec un avocat. Si désigné, indiquer ici son nom et
          son contact.]
        </p>
      </Section>

      <Section title="Notification de violation">
        <p>
          En cas de violation de données susceptible d&apos;engendrer un risque pour vos droits
          et libertés, nous vous informerons dans les meilleurs délais et notifierons la CNIL
          dans les 72 heures conformément aux Art. 33 et 34 RGPD.
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
