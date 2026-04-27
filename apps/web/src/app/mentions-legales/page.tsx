import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/LegalPageShell'

export const metadata: Metadata = {
  title: 'Mentions légales — TaxiLink',
  description: 'Informations légales sur l\'éditeur du site TaxiLink, hébergement et contact.',
  robots: { index: true, follow: true },
}

export default function MentionsLegalesPage() {
  return (
    <LegalPageShell title="Mentions légales" lastUpdated="27 avril 2026">
      <Section title="1. Éditeur du site">
        <p>
          Le site et l&apos;application TaxiLink (ci-après « TaxiLink ») sont édités par :
        </p>
        <Placeholder label="Raison sociale" value="[À COMPLÉTER : raison sociale]" />
        <Placeholder label="Forme juridique" value="[À COMPLÉTER : SAS / SARL / EI / etc.]" />
        <Placeholder label="Capital social" value="[À COMPLÉTER : montant en €]" />
        <Placeholder label="Siège social" value="[À COMPLÉTER : adresse complète]" />
        <Placeholder label="RCS / SIRET" value="[À COMPLÉTER]" />
        <Placeholder label="N° TVA intracommunautaire" value="[À COMPLÉTER ou : non assujetti — TVA non applicable, art. 293 B du CGI]" />
        <Placeholder label="Email" value="support@taxilink.fr" />
      </Section>

      <Section title="2. Directeur de la publication">
        <Placeholder label="Nom et prénom" value="[À COMPLÉTER : Nom Prénom du représentant légal]" />
      </Section>

      <Section title="3. Hébergement">
        <p>
          L&apos;application est hébergée par <strong>Supabase Inc.</strong> (970 Toa Payoh North,
          Singapore — siège social) qui s&apos;appuie sur l&apos;infrastructure cloud Amazon Web
          Services (AWS). Les données du projet TaxiLink sont stockées sur la région
          <strong> Europe (Paris) — eu-west-3</strong>.
        </p>
        <p>
          AWS Europe — Amazon Web Services EMEA SARL, 38 avenue John F. Kennedy, L-1855 Luxembourg.
        </p>
      </Section>

      <Section title="4. Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments du site (textes, logos, code source, identité visuelle)
          sont la propriété exclusive de l&apos;éditeur ou de ses partenaires. Toute reproduction,
          représentation ou exploitation sans autorisation écrite préalable est interdite.
        </p>
        <p>
          Les marques « TaxiLink » et le logo associé sont la propriété de l&apos;éditeur.
        </p>
      </Section>

      <Section title="5. Données personnelles">
        <p>
          Le traitement des données personnelles est détaillé dans la <a href="/confidentialite" className="underline font-semibold">politique de confidentialité</a>.
          Les droits des utilisateurs sont rappelés dans la <a href="/rgpd" className="underline font-semibold">page RGPD</a>.
        </p>
      </Section>

      <Section title="6. Cookies">
        <p>
          TaxiLink utilise uniquement des cookies fonctionnels strictement nécessaires au
          fonctionnement du service (authentification, préférence de mode sombre, état d&apos;épinglage
          des groupes). Aucun cookie de mesure d&apos;audience tiers n&apos;est déposé sans consentement.
        </p>
      </Section>

      <Section title="7. Contact">
        <p>
          Pour toute question relative à ces mentions légales :
          {' '}<a href="mailto:support@taxilink.fr" className="underline font-semibold">support@taxilink.fr</a>.
        </p>
      </Section>
    </LegalPageShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-2">
      <h2 className="text-[18px] md:text-[20px] font-bold text-ink mt-8 mb-3 tracking-tight">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Placeholder({ label, value }: { label: string; value: string }) {
  const isToFill = value.startsWith('[À COMPLÉTER')
  return (
    <p>
      <span className="font-semibold text-ink">{label} : </span>
      <span className={isToFill ? 'text-amber-700 italic' : ''}>{value}</span>
    </p>
  )
}
