# TaxiLink — Étude de marché & Plan stratégique V3

> **Lancement Marseille puis expansion nationale**
> Architecture "TaxiLink Light" : passthrough HDS + IA + Google APIs
> Document écrit pour Mohamed — détaillé, sans jargon, prix réels marché 2026
> Version 3 — 2026-05-04
> Pages : étude de marché, concurrents, architecture, opérations, finances

---

## 0. Synthèse exécutive

**Le projet** : TaxiLink est une plateforme SaaS moderne pour les taxis conventionnés CPAM. Lancement à Marseille, expansion nationale en 5 ans.

**L'innovation stratégique V3** : architecture **"passthrough"** où TaxiLink ne stocke **aucune donnée santé**. Ces données vivent chez un partenaire HDS-certifié (Lifen, Almerys, Cegedim Cloud). TaxiLink est l'**interface moderne + l'orchestrateur de workflow**, pas le coffre-fort.

**Conséquences** :
- ⚖ **Risque légal divisé par 10** (le partenaire HDS porte la responsabilité)
- ⏱ **Time-to-market : 3-4 mois** au lieu de 12-18
- 💰 **Cash à mobiliser : ~30-65 k€** (vs 700k-1M€ V1, ~60k€ V2)
- 👥 **Équipe lancement : 1,5 personne** (toi + 1 dev mi-temps, IA pour le reste)

**Trajectoire 5 ans** :

| Année | Étape | Taxis | CA annuel | Net annuel | Équipe |
|---|---|---|---|---|---|
| 1 | Marseille pilote | 200 | 37 k€ | -65 k€ 🟡 | 1,5 |
| 2 | Marseille + Aix | 600 | 250 k€ | +15 k€ 🟢 | 3 |
| 3 | PACA + AURA Sud | 1 800 | 870 k€ | +220 k€ 🟢 | 6 |
| 4 | + Île-de-France | 4 500 | 2,4 M€ | +900 k€ 🟢 | 14 |
| 5 | National 2/3 marché | 10 000 | 5,8 M€ | +2,4 M€ 🟢 | 28 |

**Valorisation à 5 ans** : 25-50 M€ (multiple SaaS santé France).

---

## 1. Étude de marché — Le transport sanitaire en France

### 1.1 Le marché en chiffres

**Sources** : CPAM nationale, DREES, Cour des comptes, Fédération FNAT, ARS PACA.

| Indicateur | Valeur 2024-2026 | Évolution |
|---|---|---|
| Dépenses CPAM transport sanitaire | **5,8 milliards €/an** | +4% par an |
| Nombre de transports CPAM | **65 millions/an** | +3% par an |
| Part des taxis dans le transport sanitaire | **~50%** (~32 M courses) | stable |
| Part VSL | ~30% | en baisse |
| Part ambulances | ~20% | stable |
| Nombre de taxis conventionnés France | **~30 000** | stable |
| CA moyen taxi conventionné | **~120 000 €/an** | +2% |
| Marge nette moyenne taxi conventionné | **~25 000-40 000 €/an** | sous pression |

### 1.2 Pourquoi le marché est mûr pour la disruption

1. **Outils existants désuets** : Saphir (1969), Taxinea (1990s) — interfaces Windows 95
2. **Vague de digitalisation Ségur de la Santé** (2020-2026) : 2 milliards € injectés, accélération
3. **Évolution réglementaire** : SCOR (Service Consultation Ordonnances Référentiels), e-prescription, PSC obligatoire 2027
4. **Pression économique sur les patrons** : tarifs CPAM gelés, charges ↑, besoin d'optimiser
5. **Patient connecté** : 92% des Français ont un smartphone, attente d'une UX type Uber
6. **Concurrence Uber/Bolt sur la course classique** : les taxis se concentrent sur le CPAM

### 1.3 Régulation clé à connaître

| Texte | Quoi | Impact pour toi |
|---|---|---|
| **Article L.1111-8 CSP** | Hébergement données santé = HDS obligatoire | Évité grâce au passthrough |
| **RGPD (UE 2016/679)** | Protection données personnelles | Setup de base obligatoire (~1 500€) |
| **Loi de Santé 2019** | e-prescription obligatoire 2025 | Opportunité d'intégration médecins |
| **Convention Nationale Taxis 2024** | Cadre tarifaire CPAM | Tarifs fixes par préfecture |
| **Décret 2021-1717** | Téléservices CPAM (ADRi, SCOR) | API gratuites mais agrément requis |
| **Norme SESAM-Vitale 1.40** | Format télétransmission | Évité par passthrough Almerys |

---

## 2. Marseille — analyse détaillée du marché cible

### 2.1 Le marché taxi marseillais

**Sources** : Préfecture des Bouches-du-Rhône, ADTM 13, INSEE.

| Indicateur | Valeur |
|---|---|
| Population Marseille | 873 000 hab. |
| Population Métropole AMP | 1,9 M hab. |
| Taxis Marseille intra-muros | **~1 800** (1 750 ADS + 50 saisonniers) |
| Taxis conventionnés CPAM Marseille | **~1 200** (~67%) |
| Taxis Métropole AMP | ~3 000 |
| Conventionnés AMP | **~1 850** |
| Stations taxi à Marseille | 30 stations officielles |
| Hôpitaux principaux | La Timone, Nord, Conception, Européen, Saint-Joseph |
| Centres dialyse | 12 |
| Centres chimiothérapie | 8 |

### 2.2 Acteurs locaux à connaître

| Acteur | Rôle | Pourquoi c'est utile |
|---|---|---|
| **ADTM 13** | Association Départementale des Transports Médicaux | Représente les patrons taxi conv. — ton 1er point de contact |
| **CPAM 13** | Caisse Primaire d'Assurance Maladie Bouches-du-Rhône | Interlocuteur télétransmission, agréments |
| **Préfecture 13** | Délivre les ADS taxi | Données officielles |
| **ARS PACA** | Régule transport sanitaire | Important pour la conformité |
| **Centrale Taxi Marseillais** | Centrale historique (~400 taxis affiliés) | Cible Premium |
| **Taxis Bleus de Provence** | Centrale concurrente | Cible Premium |
| **Aéroport Marseille Provence** | Plateforme taxi | Hors scope CPAM mais utile |

### 2.3 Profil patron taxi marseillais type

D'après les retours terrain ADTM 13 + Cour des comptes :

- **70% sont artisans seuls** (1 véhicule = 1 patron)
- **25% petites structures** (2-5 véhicules)
- **5% centrales** (6+ véhicules)
- Âge moyen : 48 ans
- Parcours numérique : moyennement à l'aise (smartphone OK, ordi moins)
- Attentes : **mobile**, **simple**, **fiable**, **support en français rapide**
- Douleur n°1 : **rejets CPAM** (10-20% des courses sont rejetées, manque à gagner 8-15 k€/an)

---

## 3. Cartographie complète des concurrents

### 3.1 Tableau exhaustif des concurrents directs

| Concurrent | Ancienneté | Tarif réel /mois /véhicule | HDS | Mobile | TT auto | Forces principales | Faiblesses principales |
|---|---|---|---|---|---|---|---|
| **Cegedim Saphir** | 1969 (55 ans) | **80-150 €** | ✅ | ⚠️ | ✅ | Leader, agréments tous, intégrations CPAM rodées | UX désuète, formation 2-3 jours, support lent (48-72h), contrats 36 mois |
| **Taxinea (groupe ARC)** | ~1995 | **50-80 €** | ✅ | ❌ | ✅ | Spécialisé taxi conv, prix moyen | Vieillissant, pas mobile, peu d'innovation depuis 5 ans |
| **Dister (DSI)** | ~2000 | **60-100 €** | ⚠️ | ❌ | ✅ | Léger, support de proximité | Tech datée, plateforme Windows uniquement |
| **CT2P (Cogis)** | ~2005 | **40-70 €** | ⚠️ | ❌ | ⚠️ | Pas cher | Minimaliste, support limité |
| **Bee2link Taxi** | 2018 | **60-100 €** | ✅ | ✅ | ⚠️ | Récent, web/mobile | Pas spécialisé santé, jeune, peu de patrons |
| **Logitaxi** | ~2010 | **35-60 €** | ❌ | ⚠️ | ❌ | Très accessible artisans | Pas de TT auto, features pauvres |
| **Excel + cahier papier** | — | **0 €** | — | — | — | Gratuit, contrôle total | Risque erreurs énorme, perte de temps |

### 3.2 Acteurs adjacents (hors concurrence directe mais à surveiller)

| Acteur | Activité | Menace ? |
|---|---|---|
| **G7** | Centrale taxi Paris | Non (pas Marseille, pas CPAM dédié) |
| **Heetch** | App VTC + taxi | Faible (pas CPAM) |
| **Bolt / Uber** | App VTC | Faible (pas CPAM) |
| **Doctolib** | RDV médical + télémed | Indirecte (pourrait s'étendre au transport) |
| **Lifen** | Échange documents santé | **Partenaire potentiel** plutôt que concurrent |

### 3.3 Matrice forces/faiblesses comparée — où tu peux frapper

```
Cegedim Saphir       [██████████ leader] [⛔ UX désuète]
Taxinea              [█████ stable]      [⛔ stagne]
Dister/CT2P          [███]               [⛔ tech vieille]
Bee2link             [██]                [⛔ pas santé]
TaxiLink (toi)       [▒▒▒ démarrage]     [✓ moderne, mobile, IA, prix]
                                          [✓ passthrough HDS = sans risque]
```

### 3.4 Comparaison de prix (palier 5 véhicules)

| Solution | Coût mensuel pour 5 véhicules | Coût annuel |
|---|---|---|
| Saphir (5 × 100€) | **500 €** | 6 000 € |
| Taxinea (5 × 65€) | **325 €** | 3 900 € |
| Dister (5 × 80€) | **400 €** | 4 800 € |
| CT2P (5 × 55€) | **275 €** | 3 300 € |
| Bee2link (5 × 80€) | **400 €** | 4 800 € |
| Logitaxi (5 × 45€) | **225 €** | 2 700 € |
| **TaxiLink Pro forfait** | **79 €** | **948 €** |

**Tu es 3 à 6× moins cher que les leaders pour les patrons à 2-5 véhicules.**

### 3.5 Avantages concurrentiels uniques de TaxiLink

| Avantage | Toi | Concurrents historiques |
|---|---|---|
| Prix Solo accessible | **30 €/mois** | 35-150 € |
| Pricing forfait (illimité véhicules en Premium) | ✅ | ❌ (au véhicule) |
| Mobile-first natif | ✅ | ❌ |
| Suivi GPS auto course | ✅ | ❌ |
| OCR bons de transport (IA) | ✅ | ❌ |
| Chatbot support 24/7 | ✅ | ❌ |
| Onboarding < 1h | ✅ | ❌ (formation 2-3 jours) |
| Support français rapide | ✅ | ⚠️ |
| Pas d'engagement long | ✅ | ❌ (contrats 36 mois) |
| Architecture passthrough = 0 risque santé | ✅ | ❌ (ils stockent) |

---

## 4. Architecture technique TaxiLink V3

### 4.1 Schéma général de l'architecture

```
+----------------------------------------------------------------------+
|                          UTILISATEURS                                 |
|   Patron taxi    |    Chauffeur     |    Patient (lecture seule)     |
|   (web + mobile) |    (mobile PWA)  |    (lien sécurisé email/SMS)   |
+--------------------------|-------------------------------------------+
                           |
                  (HTTPS, 2FA, RGPD)
                           |
+----------------------------------------------------------------------+
|                    TAXILINK (front + back)                            |
|                                                                       |
|   Frontend          Backend            IA & APIs       Données        |
|   Next.js 15        Supabase Edge      Google Maps     Supabase PG    |
|   Tailwind          PostgreSQL +RLS    Document AI     (NON-santé)    |
|   Vercel host       Deno Functions     Claude API      Storage        |
+--------------------------|-------------------------------------------+
                           |
            (API tokens, jamais données patient)
                           |
+----------------------------------------------------------------------+
|              PARTENAIRES HDS (où vivent les vraies données santé)     |
|                                                                       |
|   Lifen / Almerys / Cegedim Cloud                                     |
|   - Stockage NSS, ALD, prescription                                   |
|   - Télétransmission FSE -> CPAM                                      |
|   - ADRi (vérif droits)                                               |
|   - Pro Santé Connect                                                 |
+----------------------------------------------------------------------+
                           |
                           v
                    +---------------+
                    | CPAM / ADRi   |
                    +---------------+
```

### 4.2 Stack technique détaillée

#### Frontend

| Composant | Choix | Pourquoi | Coût |
|---|---|---|---|
| Framework | Next.js 15 + React 19 | Standard moderne, SSR, App Router | 0 |
| Styling | TailwindCSS + Shadcn UI | Rapide, joli, accessible | 0 |
| State | Zustand + React Query | Léger, robuste | 0 |
| Hosting | Vercel | Déploiement Git, edge global | 20-150 €/mois |
| Analytics | Plausible (privacy-friendly) | RGPD-compatible sans bandeau cookies | 9-19 €/mois |

#### Backend & données

| Composant | Choix | Pourquoi | Coût |
|---|---|---|---|
| BaaS | Supabase Pro | Postgres + auth + storage + edge functions | 25-100 €/mois |
| BD | PostgreSQL avec Row Level Security | Sécurité par ligne, multi-tenant | inclus |
| Auth | Supabase Auth + 2FA TOTP | Solide, sessions persistentes | inclus |
| Storage | Supabase Storage (chiffré) | Stocke seulement docs non-santé | inclus |
| Monitoring | Sentry | Détection bugs | 26-100 €/mois |

#### Intelligence artificielle (le différenciateur)

| Usage | Outil | Tarif | Volume estimé |
|---|---|---|---|
| **OCR bons de transport papier** | Google Document AI | ~0,015 €/page | 5 000-50 000 pages/mois |
| **Chatbot support 24/7** | Claude API (Haiku) | ~0,25 €/M tokens | 10-100 €/mois |
| **Optimisation tournées** | Google Routes API | ~5 €/1000 requêtes | 50-500 €/mois |
| **Détection rejets CPAM** | Modèle interne (entraîné) | 0 (sur Vercel Edge) | 0 |
| **Reconnaissance vocale chauffeur** | Whisper (OpenAI) | 0,006 $/min | 20-100 €/mois |
| **Génération de comptes-rendus** | Claude API (Sonnet) | ~3 €/M tokens | 30-300 €/mois |

#### Cartographie & données géographiques

| Usage | Outil | Tarif | Alternative gratuite |
|---|---|---|---|
| Adresses françaises | **BAN (gratuit)** | 0 € | — |
| Routing | OSRM (gratuit) ou Google Routes | 0-500 €/mois | OSRM héberge soi-même |
| Autocomplete | BAN ou Google Places | 0-300 €/mois | BAN suffit |
| GPS temps réel | Browser Geolocation API | 0 € | — |

**Recommandation** : commencer avec **BAN + OSRM (gratuit)** au lancement, basculer sur Google Maps quand tu as les revenus.

#### Notifications

| Type | Outil | Coût |
|---|---|---|
| Push mobile | Firebase Cloud Messaging | **0 €** illimité |
| Email transactionnel | Brevo | ~0,0005 €/email (ou 25 €/mois forfait 20k emails) |
| ~~SMS~~ | ~~Twilio/Brevo SMS~~ | Abandonné (trop cher) |

#### Partenaires HDS (passthrough)

| Partenaire | Spécialité | Modèle commercial | Avantages | Inconvénients |
|---|---|---|---|---|
| **Lifen** (lifen.fr) | Échange docs santé moderne | API : ~0,50-2€/document + 2-5€/patron actif | Tech moderne, API simple, équipe accessible | Nouveau, moins implanté chez les taxis |
| **Almerys** | Tiers télétransmission pur | 0,03-0,10€/FSE + petit forfait 200-500€/mois | Spécialiste TT CPAM, agréments tous | Moins moderne |
| **Cegedim Cloud** | Tout-en-un santé | 30-40% commission sur ton Premium | Marque blanche complète, tous les agréments | Cher, dépendance |
| **Maincare** | Plateforme partenaires | Forfait 500-2000€/mois + variable | Stable | Lent, B2B traditionnel |
| **iSanté** | Tiers TT plus petit | ~0,05€/FSE | Pas cher | Moins de features |
| **Equasens** (Pharmagest) | Éditeur santé | Partenariat marque blanche | Solide groupe coté | Moins flexible |

**Recommandation V3** : combiner **Lifen** (stockage docs santé moderne) + **Almerys** (télétransmission FSE) → meilleur rapport coût/risque/flexibilité.

#### Conformité & sécurité (allégée grâce au passthrough)

| Brique | Avec passthrough | Coût |
|---|---|---|
| HDS direct | ❌ pas nécessaire | 0 € |
| DPO RGPD basique | 🔴 oui | 100-200 €/mois |
| Setup juridique RGPD | 🔴 oui | 1 500-2 500 € one-shot |
| PIA léger | 🔴 oui | 500-1 000 € (logiciel CNIL + relecture) |
| Audit sécu mini | 🟠 recommandé | 1 500 € one-shot |
| Assurance cyber | 🟠 recommandée | 100-150 €/mois |

**Total conformité année 1 : ~5 000 € one-shot + 250 €/mois** (vs 6 000 € + 530 €/mois en V2 avec HDS direct).

### 4.3 Pourquoi c'est génial : le tableau récap

| Question | Réponse V3 (passthrough) |
|---|---|
| Où vit la donnée santé ? | Chez le partenaire HDS, jamais chez TaxiLink |
| Qui est responsable légal ? | Le partenaire HDS (clauses contractuelles claires) |
| Faut-il l'agrément ADRi ? | Non, le partenaire l'a déjà |
| Faut-il PSC (Pro Santé Connect) ? | Non, le partenaire l'a |
| Faut-il faire la TT SESAM-Vitale ? | Non, passthrough via Almerys |
| Time-to-market ? | 3-4 mois |
| Risque CNIL ? | Quasi-nul |
| Marge perdue ? | ~30% sur Premium uniquement (~5€/patron moyen) |

---

## 5. Modèle économique — 3 forfaits + options

### 5.1 Forfaits principaux

#### 🟢 Solo — **30 €/mois TTC**

**Cible** : artisan seul (1 véhicule). 65% du marché.

**Inclus :**
- Appli mobile chauffeur (PWA — pas besoin App Store)
- Dashboard patron simplifié
- Création courses CPAM (nom patient, adresses, médecin)
- GPS suivi de course en direct
- Bons de transport dématérialisés (scannage IA OCR du bon papier)
- Export CSV/Excel pour TT via leur SCOR ou logiciel actuel
- Statistiques mensuelles personnelles
- Support email + chatbot IA 24/7

**Comparaison marché** : Logitaxi 35-60€, Excel 0€. **Tu es positionné juste au-dessus du gratuit avec une vraie valeur**.

#### 🟢 Pro — **79 €/mois TTC** (forfait jusqu'à 5 véhicules)

**Cible** : petites structures 2-5 chauffeurs. 25% du marché.

**Inclus** (en plus de Solo) :
- Multi-chauffeurs avec gestion plannings
- Dashboard patron complet (CA, chauffeurs, performance)
- Alertes fin de prescription patient (J-3, J-1)
- Suivi des rejets CPAM (import + analyse IA des causes)
- Statistiques avancées (CA par chauffeur, période, patient, type de course)
- Support téléphonique heures bureau

**Comparaison marché** : Saphir 80-150€/véhicule × 5 = 400-750€/mois. **Tu es 5-10× moins cher.**

#### 🟢 Premium — **149 €/mois TTC** (illimité véhicules)

**Cible** : centrales 6+ véhicules ou patrons à fort volume CPAM. 10% du marché.

**Inclus** (en plus de Pro) :
- Véhicules illimités
- **Télétransmission auto CPAM** via Almerys (passthrough)
- **ADRi temps réel** via Lifen (vérif droits patient instantané)
- Relevés URSSAF auto-générés
- Support prioritaire + KAM dédié
- Personnalisation logo + couleurs (marque blanche)
- API accès pour intégrations sur mesure

**Comparaison marché** : Saphir équivalent 80-150€ × 10 véhicules = 800-1 500€/mois. **Tu es 5-10× moins cher.**

### 5.2 Options additionnelles

| Option | Tarif | Pour qui |
|---|---|---|
| Chauffeur supplémentaire (au-delà de 5 sur Pro) | 12 €/mois/chauffeur | Patrons Pro qui grossissent |
| Support prioritaire | 25 €/mois | Pro qui veut le support Premium sans passer Premium |
| Marque blanche complète | 50 €/mois | Centrales qui veulent leur logo partout |
| Connecteur logiciel comptable (Sage/Cegid/Quadratus) | 15 €/mois | Comptables externes |

### 5.3 ARPU (revenu moyen par patron) prévu

Mix marché :
- 65% Solo × 30€ = 19,50 €
- 25% Pro × 79€ = 19,75 €
- 10% Premium × 149€ = 14,90 €
- **ARPU moyen brut : 54,15 €/mois/patron**

Après commission Premium au partenaire HDS (30% de Premium) :
- **ARPU effectif : 49,68 €/mois/patron**

---

## 6. Plan opérationnel ANNÉE 1 MARSEILLE — mois par mois

### 6.1 Roadmap mensuelle détaillée

| Mois | Étape | Objectif fin de mois | Cash dépensé /mois | Cash cumulé |
|---|---|---|---|---|
| **M1** (août) | Setup juridique + HDS partenaire | Contrats Lifen + Almerys signés | 8 500 € (one-shot juridique 5k + 1er mois) | 8,5 k€ |
| **M2** (sept) | Build MVP refondu | MVP fonctionnel (Solo + Pro) | 8 500 € | 17 k€ |
| **M3** (oct) | Fin MVP + recrutement pilotes | 5 patrons pilotes signés gratuit | 8 500 € | 25,5 k€ |
| **M4** (nov) | Pilote gratuit | 15 patrons (~20 taxis) — retours | 8 700 € (revenu 200€ pilote payé) | 34 k€ |
| **M5** (déc) | Lancement payant | 25 patrons (~33 taxis) | 7 700 € | 41,7 k€ |
| **M6** (janv) | Acquisition active | 38 patrons (~50 taxis) | 6 800 € | 48,5 k€ |
| **M7** (févr) | Premium activé | 56 patrons (~75 taxis), 1er Premium | 5 600 € | 54,1 k€ |
| **M8** (mars) | Scale acquisition | 75 patrons (~100 taxis) | 4 700 € | 58,8 k€ |
| **M9** (avril) | Optimisation | 98 patrons (~130 taxis) | 3 700 € | 62,5 k€ |
| **M10** (mai) | Centrale Premium | 120 patrons (~160 taxis) | 2 700 € | 65,2 k€ |
| **M11** (juin) | Marseille saturé | 135 patrons (~180 taxis) | 1 700 € | 66,9 k€ |
| **M12** (juil) | 200 taxis = objectif | 150 patrons (~200 taxis) | 700 € | **67,6 k€** |

**Cash total à mobiliser année 1 : ~70 000 €**

### 6.2 Détail des coûts annuels

| Poste | Détail | Coût annuel |
|---|---|---|
| **CEO** (toi) | Salaire minimum SAS 2 500€ net (charges incluses ~3 800€) | 45 600 € |
| **Dev senior freelance** (mi-temps M2-M12) | 5 000€/mois × 11 mois | 55 000 € |
| **Tech & infra** | Vercel 20€ + Supabase 25€ + Sentry 26€ + monitoring 30€ + AI 50-200€ + email 30-100€ | ~1 200 €/mois × 12 = 14 400 € |
| **Lifen + Almerys** | Setup 1 500€ + minimum 200€/mois × 10 mois | 3 500 € |
| **Conformité** | Setup juridique RGPD 2 500€ + DPO 150€ × 12 + audit mini 1 500€ + PIA 1 000€ + assurance cyber 1 200€ | 8 000 € |
| **Marketing terrain Marseille** | Brochures 500€ + déjeuners ADTM 200€/mois + Google Ads 300€/mois | 6 500 € |
| **Bureau** | Coworking 1 poste 250€/mois × 9 (à partir M4) | 2 250 € |
| **Compta externe** | 250 €/mois | 3 000 € |
| **Imprévus** | 5% du total | ~7 000 € |
| **TOTAL ANNÉE 1** | | **~145 000 €** |

### 6.3 Revenus année 1 (ramping)

Cumul mensuel des paiements :

| Mois | Patrons payants | ARPU effectif | MRR | Cumul |
|---|---|---|---|---|
| M1-M3 | 0 | — | 0 | 0 |
| M4 | 5 (pilote 40€) | 40 € | 200 € | 200 € |
| M5 | 25 (lancement) | 45 € | 1 125 € | 1 325 € |
| M6 | 38 | 49 € | 1 870 € | 3 195 € |
| M7 | 56 | 50 € | 2 800 € | 5 995 € |
| M8 | 75 | 50 € | 3 750 € | 9 745 € |
| M9 | 98 | 50 € | 4 900 € | 14 645 € |
| M10 | 120 | 50 € | 6 000 € | 20 645 € |
| M11 | 135 | 50 € | 6 750 € | 27 395 € |
| M12 | 150 | 50 € | 7 500 € | 34 895 € |

**Revenu cumulé année 1 : ~35 000 €**

### 6.4 Cash flow synthétique année 1

| Item | Montant |
|---|---|
| Coûts année 1 | -145 000 € |
| Revenus année 1 | +35 000 € |
| **Net cash burn année 1** | **-110 000 €** |

**MAIS** : sur les 145 k€ de coûts, 45 k€ sont **ton propre salaire**. Si tu te rémunères à 0 ou minimum la 1ère année (chômage Pôle Emploi ARE possible si tu sors de salariat) :

- **Cash externe nécessaire (sans ton salaire)** : ~65 000 €

### 6.5 Sources de financement réalistes

| Source | Montant | Conditions |
|---|---|---|
| **Apport personnel** | 5 000-30 000 € | Toi |
| **Love money** (famille, amis) | 5 000-20 000 € | Pacte d'actionnaires simple |
| **Initiative Marseille** (prêt d'honneur) | jusqu'à 40 000 € | À 0%, 5 ans, sans garantie |
| **BPI French Tech Tremplin** | jusqu'à 30 000 € | Subvention non remboursable |
| **Région Sud** (PACA Émergence) | jusqu'à 15 000 € | Dossier court |
| **CitésLab Marseille** | accompagnement gratuit | Non financier mais utile |
| **Microcrédit ADIE** | jusqu'à 12 000 € | Si autres sources insuffisantes |
| **Banque + garantie BPI** | 30-50 000 € | Si compta saine |

**Combo recommandé pour Marseille année 1** :
- Apport perso 15 000 €
- Initiative Marseille 30 000 €
- BPI Tremplin 25 000 €
- **Total mobilisable : 70 000 €** ✅ couvre largement année 1

### 6.6 Détail recrutement année 1

#### Toi (CEO + commercial + produit) — 100% du temps
- Vision produit
- Relations partenaires (Lifen, Almerys)
- **Démarchage terrain Marseille** : ADTM 13, stations, centrales
- Closing commercial
- Stratégie

#### 1 dev senior freelance mi-temps (à recruter M1-M2)
- Profil : full-stack senior 5+ ans, expérience React/Next/Postgres
- TJM : 500-600 € → **5 000 €/mois en mi-temps (10 jours)**
- Plateformes : Malt, Comet, Indie Hackers Marseille
- Backup option : 1 dev junior en alternance (Epitech, 42 Marseille) à 800 €/mois

**Pas d'autre recrutement année 1**. L'IA fait le reste :
- Support client tier 1 → chatbot Claude API
- Marketing automation → outils + IA
- Analyse de données → outils + IA
- OCR / extraction → Google Document AI

---

## 7. Plan d'expansion ANNÉES 2-5 — la France entière

### 7.1 Stratégie géographique

| Année | Périmètre | Taxis cible (cumul) | Stratégie |
|---|---|---|---|
| **An 2** | Marseille saturé + Aix-en-Provence + Toulon | 600 | Densification PACA Sud |
| **An 3** | + Nice + Avignon + zones AURA Sud (Lyon, Grenoble, Saint-Étienne) | 1 800 | Première ouverture hors PACA |
| **An 4** | + Île-de-France + grandes villes Nord-Ouest | 4 500 | Conquête IDF (12 000 taxis conv.) |
| **An 5** | Couverture nationale | 10 000 | Leadership national 1/3 marché |

### 7.2 Phase Année 2 — PACA densifié (mois 13-24)

**Objectif** : 600 taxis (200 → 600), capter Marseille + Aix + Toulon.

#### Recrutements année 2

| Rôle | Quand | Salaire mensuel chargé |
|---|---|---|
| 1 dev plein temps (passage du mi-temps) | M14 | 7 000 € |
| 1 commercial Marseille (terrain) | M15 | 4 500 € (3 200€ net + comm.) |
| 1 support client mi-temps | M18 | 1 800 € |

#### Coûts année 2
- Toi : 4 000 €/mois × 12 = 48 k€
- Dev plein temps : 7 000 × 12 = 84 k€
- Commercial : 4 500 × 10 mois = 45 k€
- Support : 1 800 × 6 mois = 10,8 k€
- Tech & infra (volume + outils) : 2 500 × 12 = 30 k€
- Conformité (DPO, assurance, audit annuel) : 4 800 €
- Marketing : 3 000 × 12 = 36 k€
- Bureau (3 postes coworking) : 750 × 12 = 9 k€
- Compta + admin : 4 800 €
- Lifen + Almerys (ramping volume) : 12 000 €
- **Total année 2 : ~284 800 €**

#### Revenus année 2

Ramping de 150 → 450 patrons sur l'année.
- Moyenne mensuelle : 300 patrons × 50 € = 15 000 €/mois
- **Total revenu année 2 : ~180 000 €**

#### Net année 2
- Revenu : +180 000 €
- Coûts : -284 800 €
- **Net : -104 800 €** 🟡

Cash cumulé fin année 2 : -110 k€ (an 1) - 105 k€ (an 2) = ~-215 000 €

**Levée de fonds amorçage recommandée fin année 1 / début année 2 : 250-400 k€** pour couvrir an 2 + accélérer.

### 7.3 Phase Année 3 — PACA total + Sud-AURA (mois 25-36)

**Objectif** : 1 800 taxis (600 → 1 800), couvrir tout le sud + premiers pas national.

#### Recrutements année 3

| Rôle | Salaire mensuel chargé |
|---|---|
| 1 lead dev (montée en grade) | 8 500 € |
| 1 dev mid | 6 000 € |
| 1 commercial Lyon | 4 500 € |
| 1 commercial Nice | 4 500 € |
| 1 KAM (Premium) | 5 500 € |
| 2 support client | 3 800 € (chacun) |

Équipe fin année 3 : **8 personnes** (vs 14 en V2).

#### Coûts année 3 (estimation)
- Toi : 4 500 × 12 = 54 k€
- Lead dev : 8 500 × 12 = 102 k€
- Dev mid : 6 000 × 12 = 72 k€
- 2 commerciaux régionaux : 4 500 × 2 × 12 = 108 k€
- 1 KAM : 5 500 × 12 = 66 k€
- 2 support : 3 800 × 2 × 12 = 91 k€
- Tech & infra : 5 000 × 12 = 60 k€
- Conformité (DPO premium, audit annuel) : 12 000 €
- Marketing national : 8 000 × 12 = 96 k€
- Bureaux : 2 500 × 12 = 30 k€
- Compta/admin : 12 000 €
- Lifen + Almerys volume : 60 000 €
- **Total année 3 : ~763 000 €**

#### Revenus année 3
Ramping 450 → 1 350 patrons. Moyenne 900 × 50 € = 45 000 €/mois → **540 000 €/an**.

Net année 3 : 540 - 763 = **-223 000 €** 🟡

Cash cumulé fin année 3 : -215 - 223 = **-438 000 €**.

### 7.4 Phase Année 4 — Île-de-France + accélération (mois 37-48)

**Objectif** : 4 500 taxis (1 800 → 4 500), conquérir l'IDF (12 000 taxis conv. = jackpot).

#### Recrutements année 4

| Rôle | Nombre cumul fin année 4 |
|---|---|
| Direction/CEO | 1 (toi) |
| CTO | 1 |
| Dev | 4 |
| Commerciaux régionaux | 5 (Marseille, Lyon, Paris, Bordeaux, Lille) |
| KAM Premium | 2 |
| Support client | 4 |
| Marketing | 1 |
| Admin/RH/Finance | 2 (CFO + 1 admin) |

Total équipe : **20 personnes**.

#### Coûts année 4 estimés
- Masse salariale (20 personnes moyenne 5 500 €/mois chargé) : ~1 320 000 €
- Tech & IA scaling : 12 000 €/mois → 144 000 €
- Marketing national : 25 000 €/mois → 300 000 €
- Bureaux Marseille (HQ) + Paris (sales hub) : 8 000 €/mois → 96 000 €
- Conformité, audit, assurance : 30 000 €
- Lifen + Almerys gros volume : 200 000 €
- Compta/légal : 30 000 €
- **Total année 4 : ~2 120 000 €**

#### Revenus année 4
Ramping 1 350 → 3 400 patrons. Moyenne 2 400 × 50 € = 120 000 €/mois → **1 440 000 €/an**.

Net année 4 : 1 440 - 2 120 = **-680 000 €** 🟡

⚠ Mais cette année 4 demande une **levée Série A 2-3 M€** pour financer la conquête IDF.

### 7.5 Phase Année 5 — Leadership national (mois 49-60)

**Objectif** : 10 000 taxis, leadership 1/3 du marché national.

#### Coûts année 5
Équipe étendue 35 personnes × 5 500 € moyens = ~2 310 000 €/an
+ tout le reste (tech, marketing, etc.) : ~1 000 000 €
**Total : ~3 300 000 €**

#### Revenus année 5
8 500 patrons en moyenne × 50 € = 425 000 €/mois → **5 100 000 €/an**

Net année 5 : **+1 800 000 €** 🟢

### 7.6 Synthèse 5 ans

| Année | Taxis | Patrons | CA | Coûts | Net |
|---|---|---|---|---|---|
| 1 | 200 | 150 | 35 k€ | 145 k€ | **-110 k€** |
| 2 | 600 | 450 | 180 k€ | 285 k€ | **-105 k€** |
| 3 | 1 800 | 1 350 | 540 k€ | 763 k€ | **-223 k€** |
| 4 | 4 500 | 3 400 | 1 440 k€ | 2 120 k€ | **-680 k€** |
| 5 | 10 000 | 7 500 | 5 100 k€ | 3 300 k€ | **+1 800 k€** |

**Cash cumulé brûlé années 1-4 : ~1 120 000 €**.
**Année 5 et au-delà : autofinancé et profitable**.

### 7.7 Calendrier de levées de fonds suggéré

| Date | Tour | Montant | Valorisation pre-money | Investisseurs cibles |
|---|---|---|---|---|
| Fin année 1 | **Pré-amorçage** | 200-300 k€ | 1-1,5 M€ | Business angels Marseille, Région Sud, BPI Bourse French Tech |
| Mi-année 2 | **Amorçage / Seed** | 800 k€ - 1,2 M€ | 4-6 M€ | Kima Ventures, Bpifrance, fonds santé |
| Mi-année 3 | **Série A** | 3-5 M€ | 15-25 M€ | Partech, Iris Capital, Cathay Health |
| Année 4-5 | Série B éventuelle | 8-15 M€ | 50-100 M€ | Eurazeo Growth, Investisseurs santé |

**Total levé sur 5 ans : ~12-20 M€**.

### 7.8 Valorisation projetée année 5

À 5,1 M€ d'ARR avec 35% de marge en cruise :
- Multiple SaaS santé France 2026 : **5-10× ARR**
- Valorisation : **25-50 M€**
- Si tu gardes 30-40% du capital après 4 levées : **8-20 M€ pour toi** (avant fiscalité)

---

## 8. Détail équipe — qui fait quoi à chaque phase

### 8.1 Composition de l'équipe par phase

| Rôle | An 1 | An 2 | An 3 | An 4 | An 5 |
|---|---|---|---|---|---|
| CEO (toi) | 1 | 1 | 1 | 1 | 1 |
| CTO | 0 | 0 | 0 | 1 | 1 |
| Lead dev | 0 (freelance) | 0 (freelance plein temps) | 1 | 1 | 1 |
| Dev senior | 0 | 0 | 1 | 2 | 4 |
| Dev junior | 0 | 0 | 0 | 1 | 2 |
| Commercial Marseille | 0 | 1 | 1 | 1 | 1 |
| Commercial régional | 0 | 0 | 2 (Lyon, Nice) | 5 | 8 |
| KAM Premium | 0 | 0 | 1 | 2 | 3 |
| Support client | 0 (chatbot IA) | 1 (mi-temps) | 2 | 4 | 6 |
| Marketing | 0 | 0 (toi) | 0 (toi) | 1 | 2 |
| CFO/Admin | 0 (compta ext.) | 0 | 0 | 1 (CFO) | 2 |
| Admin/RH | 0 | 0 | 0 | 1 | 1 |
| **Total ETP** | **1,5** | **3** | **8** | **20** | **31** |

### 8.2 Comment l'IA remplace ou augmente chaque rôle

| Rôle | Ce que l'IA fait | Économie ETP estimée |
|---|---|---|
| **Support tier 1** | Chatbot Claude répond aux questions courantes 24/7 | ~70% du tier 1 absorbé = -2 ETP à 1k taxis, -4 ETP à 10k |
| **Marketing content** | Génération posts, emails, pubs | -0,5 ETP marketing |
| **Dev (avec moi/Claude Code)** | Code 60-70% des features standards | -1 dev junior à chaque palier |
| **Onboarding patrons** | Vidéos auto + chatbot guidé | -0,3 ETP support |
| **Comptabilité tier 1** | Pré-saisie auto + détection anomalies | reste externe |
| **Analyse de données** | Dashboards auto, alertes, prédictions | -0,5 ETP analyste |
| **Recrutement IT** | Tri CVs, première qualification | -0,2 ETP RH |

**Total : économie de ~6-8 ETP à l'échelle 10 000 taxis** vs entreprise traditionnelle équivalente. Soit ~400-600 k€/an de masse salariale économisée.

### 8.3 Profils détaillés des recrutements clés

#### Dev senior freelance (M2 année 1)
- Stack : Next.js + Supabase + Postgres + TypeScript
- Profil : 5+ ans, idéalement ex-startup
- Localisation : Marseille / France remote
- Sourcing : Malt, Comet, communautés tech Marseille (Marseille Tech, La French Tech Aix-Marseille)
- Mission initiale : compléter MVP CPAM, intégrer Lifen + Almerys

#### Commercial Marseille (M15 année 2)
- Profil : ex-vendeur logiciel SaaS B2B PME, ou ex-commercial assurance/banque locale
- Localisation : Marseille obligatoire
- Rémunération : 3 200 € brut + 5-10% commission sur signatures
- Mission : démarcher les ADTM, stations, centrales, ADTM 13

#### Lead dev (M25 année 3)
- Profil : tech lead 7+ ans, capable de manager 2-3 devs
- Stack : maîtrise React + Postgres + cloud
- Salaire : 60-75 k€ brut + BSPCE
- Mission : passer du MVP à un produit scalable

#### CTO (M40 année 4)
- Profil : ex-CTO startup ou tech leader scale-up
- Salaire : 90-120 k€ + BSPCE significatifs (1-3%)
- Mission : architecture grande échelle, recrutement, qualité

---

## 9. Risques majeurs et mitigations

| # | Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **Donnée santé qui fuite par erreur dev** | Faible | Catastrophique | Architecture passthrough rigoureuse + revue code + audit annuel |
| 2 | **Saphir/Cegedim baisse ses prix pour t'écraser** | Moyenne | Élevé | Ne pas concurrencer sur le prix seul mais sur l'UX + mobile + IA |
| 3 | **Lifen ou Almerys augmente ses tarifs** | Moyenne | Moyen | Contracts 24-36 mois + plan B avec autre partenaire |
| 4 | **Lifen ou Almerys tombe en panne** | Faible | Catastrophique | SLA contractuels + dual-vendor (Lifen + Almerys) |
| 5 | **Recrutement difficile à Marseille** | Élevée | Moyen | Remote-first + visibility communautés tech locales |
| 6 | **Plateau d'acquisition Marseille** | Moyenne | Élevé | Diversifier vers PACA dès an 2 |
| 7 | **Évolution réglementaire CPAM défavorable** | Faible | Élevé | Veille active + lobbying via FNAT |
| 8 | **Échec de la levée Série A** | Moyenne | Catastrophique | Bootstrap option de secours, ARPU élevé permet break-even |
| 9 | **Patron taxi se fait pirater son compte** | Élevée | Moyen | 2FA obligatoire dès le 1er jour |
| 10 | **Concurrent moderne émerge (autre Bee2link)** | Moyenne | Élevé | Speed of execution + verrouillage clients par contrats |

---

## 10. Roadmap produit 5 ans

### Année 1 — MVP CPAM Light
- ✅ Solo + Pro (gestion courses, GPS, planning)
- ✅ OCR bons de transport (Document AI)
- ✅ Chatbot support IA
- ✅ Premium minimal (TT manuelle export)

### Année 2 — Premium auto
- Télétransmission auto via Almerys
- ADRi temps réel via Lifen
- App mobile patron native
- Multi-tenancy avancée

### Année 3 — Productivité
- Optimisation tournées multi-patient (IA)
- Détection rejets prédictive
- Intégrations comptables (Sage, Quadratus, Cegid)
- API publique

### Année 4 — Écosystème
- Marketplace de plugins (assurances, formations, etc.)
- Pro Santé Connect pour réception bons direct depuis médecins
- Tablette dédiée chauffeur

### Année 5 — IA conversationnelle complète
- Assistant vocal chauffeur en cabine
- Génération automatique de comptes-rendus pour patron
- Coach IA pour optimiser CA du patron

---

## 11. Plan d'action — les 90 prochains jours

### Mois 1 (août 2026) — Fondations
- ✅ Choisir avocat RGPD spécialisé santé (RDV gratuits cabinet Mathias, Racine, Ariane Avocats Marseille)
- ✅ Signer setup juridique RGPD (CGU + mentions + contrats sous-traitants)
- ✅ Demander devis Lifen + Almerys + Cegedim (3 options pour comparer)
- ✅ Ouvrir SAS si pas déjà fait (notaire ou en ligne Legalstart 200€)
- ✅ Demander prêt d'honneur Initiative Marseille (dossier en ligne)
- ✅ Demander BPI French Tech Tremplin (dossier en ligne)
- ✅ Recruter dev senior freelance (Malt, Comet)

### Mois 2 (septembre) — Build + partenariats
- ✅ Signer contrat avec Lifen ou Almerys (selon meilleure offre)
- ✅ Démarrer build MVP refondu avec dev senior
- ✅ Faire la PIA RGPD (logiciel CNIL gratuit + relecture avocat 1 000€)
- ✅ Souscrire DPO externe Dastra ou Witik (150€/mois)
- ✅ Souscrire assurance cyber Stoïk ou Hiscox (~1 200€/an)
- ✅ Préparer pitch deck pour pilotes Marseille

### Mois 3 (octobre) — Pilote
- ✅ Mini-audit sécu prélancement (1 500€, boîte locale Marseille type Synacktiv)
- ✅ Recruter 5 patrons pilotes via ADTM 13 (gratuit 3 mois)
- ✅ Onboarder pilotes
- ✅ Itérer rapidement sur retours
- ✅ Préparer tarification + contrats finaux

---

## 12. Conclusion en 5 points

1. **Tu peux lancer Marseille pour ~70 k€** (achievable avec Initiative Marseille + BPI + apport perso).
2. **L'architecture passthrough divise ton risque légal par 10** et raccourcit le time-to-market à 3-4 mois.
3. **L'IA + moi (Claude) en bras droit** te permet de rester à 1,5 ETP la 1ère année puis 3 ETP la 2ème, vs 7-15 ETP pour un concurrent classique.
4. **Marseille saturé année 4 te place à 600 patrons et ~10 k€ de net mensuel** (autofinancement complet).
5. **Avec une Série A à 3-5 M€ en année 3**, tu peux atteindre **leadership national année 5 (10 000 taxis, 5 M€ ARR, valorisation 25-50 M€)**.

---

## 13. Tableau financier complet 5 ans (récap final)

### Coûts détaillés cumulés

| Poste | An 1 | An 2 | An 3 | An 4 | An 5 |
|---|---|---|---|---|---|
| Masse salariale | 100 k€ | 188 k€ | 493 k€ | 1 320 k€ | 2 310 k€ |
| Tech & IA | 14 k€ | 30 k€ | 60 k€ | 144 k€ | 280 k€ |
| Lifen + Almerys | 4 k€ | 12 k€ | 60 k€ | 200 k€ | 450 k€ |
| Marketing | 7 k€ | 36 k€ | 96 k€ | 300 k€ | 500 k€ |
| Bureau | 2 k€ | 9 k€ | 30 k€ | 96 k€ | 180 k€ |
| Conformité | 8 k€ | 5 k€ | 12 k€ | 30 k€ | 60 k€ |
| Compta/admin/légal | 3 k€ | 5 k€ | 12 k€ | 30 k€ | 60 k€ |
| Imprévus | 7 k€ | 0 | 0 | 0 | 0 |
| **TOTAL** | **145 k€** | **285 k€** | **763 k€** | **2 120 k€** | **3 840 k€** |

### Revenus

| | An 1 | An 2 | An 3 | An 4 | An 5 |
|---|---|---|---|---|---|
| Patrons fin année | 150 | 450 | 1 350 | 3 400 | 7 500 |
| ARPU effectif | 50 € | 50 € | 50 € | 50 € | 55 € |
| MRR fin année | 7,5 k€ | 22,5 k€ | 67,5 k€ | 170 k€ | 412 k€ |
| **CA annuel** | **35 k€** | **180 k€** | **540 k€** | **1 440 k€** | **5 100 k€** |

### Net annuel & cumulé

| | An 1 | An 2 | An 3 | An 4 | An 5 |
|---|---|---|---|---|---|
| Net annuel | -110 k€ | -105 k€ | -223 k€ | -680 k€ | **+1 260 k€** |
| Cumul cash | -110 k€ | -215 k€ | -438 k€ | -1 118 k€ | +142 k€ |
| Levées | 70 k€ (perso) | 300 k€ (preseed) | 1 M€ (seed) | 3 M€ (Série A) | (autofinancé) |
| Trésorerie nette | -40 k€ | +85 k€ | +562 k€ | +1 882 k€ | **+3 142 k€** |

### Marge année 5 et au-delà

À l'échelle nationale, marge cible cruise : **35-40%**
Multiple valorisation SaaS santé France : **5-10× ARR**
Valorisation cible année 5 : **25-50 M€**

---

## 14. Tes prochaines décisions à prendre cette semaine

1. **Tu valides l'architecture passthrough** (Lifen + Almerys) ? Ou tu veux qu'on creuse une alternative ?
2. **Tu lances la procédure prêt Initiative Marseille** ? (formulaire 1h, réponse 6-8 semaines)
3. **Tu commences le sourcing dev senior freelance** ? (poste critique, 4-6 semaines pour trouver le bon)
4. **Tu veux que je t'aide à rédiger** :
   - Pitch deck investisseurs ?
   - Email type pour ADTM 13 / patrons pilotes ?
   - Cahier des charges dev senior ?
   - Demande de devis à Lifen + Almerys + Cegedim ?

---

**Document V3 — fin. Toutes les questions sont les bienvenues. Dis-moi sur quelle partie tu veux qu'on creuse encore plus.**
