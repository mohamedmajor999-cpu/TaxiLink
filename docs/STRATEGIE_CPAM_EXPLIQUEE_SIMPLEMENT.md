# TaxiLink — Stratégie CPAM (V2 — Lancement Marseille)

> Document écrit pour Mohamed, sans jargon, **focus Marseille**, prix réels marché.
> Date : 2026-05-04 (V2)
> Note : la V1 surestimait largement les coûts (modèle "tout SMS", équipe trop grande, ambition trop large trop tôt). On recalibre.

---

## Légende des couleurs (à utiliser dans tout le document)

| Symbole | Sens | Que ça veut dire |
|---|---|---|
| 🔴 | **OBLIGATOIRE LÉGAL** | La loi te l'impose. Sans ça → amende + faillite. |
| 🟠 | **OBLIGATOIRE PRATIQUE** | Pas dans la loi mais imposé par les assureurs, banques, gros clients. |
| 🟢 | **OPTIONNEL — APPORT POSSIBLE** | Pas vital. À ajouter quand tu en as les moyens, ça booste l'offre. |

---

## Partie 1 — Ta cible : Marseille

Tu lances **uniquement à Marseille**. C'est la bonne approche.

### Le marché marseillais

- **Marseille intra-muros** : ~1 800 taxis dont **~1 200 conventionnés CPAM**
- **Métropole Aix-Marseille-Provence** : ~3 000 taxis dont **~1 800 conventionnés**
- **Région PACA totale** (Marseille + Aix + Toulon + Nice + Avignon) : ~6 000 taxis dont **~3 800 conventionnés**

### Pourquoi Marseille c'est intelligent

1. **Tu y connais le terrain** (proximité, réseau)
2. **Marché concentré** : 1 commercial à temps plein peut couvrir toute la ville
3. **Forte demande CPAM** (population âgée, hôpitaux nombreux : La Timone, Nord, Conception)
4. **Concurrents historiques (Saphir, Cegedim) peu présents en proximité** — ils vendent à distance
5. **Coût acquisition très bas** : tu peux toquer aux portes des stations + ADTM 13

### Plan géographique

| Phase | Cible | Quand |
|---|---|---|
| **Phase 1** | 200 taxis Marseille intra-muros (15% du marché) | Mois 0-12 |
| **Phase 2** | 500 taxis Marseille (40% du marché) | Mois 12-24 |
| **Phase 3** | 1 000 taxis Marseille + Aix (>50% du marché métropolitain) | Mois 24-36 |
| **Phase 4** | 1 500 taxis (Marseille saturé) | Mois 36-48 |
| **Phase 5 (bonus)** | Extension PACA (Toulon + Nice) → 3 000 taxis | Année 5 |

---

## Partie 2 — Ton projet en 1 minute

Tu as **TaxiLink**, une appli pour taxis qui marche déjà :
- Le chauffeur reçoit ses courses
- Le patron voit ses chauffeurs et ses revenus
- Le patient peut être suivi en GPS

Tu veux ajouter **la grosse douleur des patrons taxi** : tout ce qui touche à la **CPAM** (la sécu).

### C'est quoi un "taxi conventionné CPAM" ?

Un taxi qui transporte des **patients malades** vers l'hôpital, le médecin, la dialyse, la chimio. La sécu rembourse la course.

Pour 1 course CPAM, le chauffeur doit aujourd'hui :
1. Récupérer un **bon de transport papier** (signé par le médecin)
2. Vérifier que le patient a bien **droit** (carte vitale valide)
3. Faire la course
4. Faire signer le patient
5. Envoyer la **facture à la sécu** (format SESAM-Vitale, sinon refusée)
6. Attendre le paiement (30-90 jours, parfois rejet)
7. Si rejet : recommencer

**Aujourd'hui, c'est l'enfer.** La plupart des artisans tiennent un cahier papier ou Excel. Les centrales utilisent des logiciels vieillots (Saphir, Taxinea) à 60-150€/mois.

**Toi tu apportes** : appli moderne, mobile, dashboard temps réel, comme Uber.

---

## Partie 3 — Pourquoi c'est piégeux : le secret médical

Quand tu transportes Mme Martin pour sa chimio, tu sais sur elle :
- Son nom, prénom, adresse
- Son **numéro de sécurité sociale** (13 chiffres)
- Le fait qu'elle a une **ALD** (donc une maladie grave)
- Le **médecin prescripteur**
- L'**hôpital de destination** (qui révèle la pathologie : Curie = cancer, Sainte-Anne = psy)

**C'est du SECRET MÉDICAL.** En cas de fuite ou négligence :
- **Amende RGPD** : jusqu'à 20 M€ ou 4% du CA mondial
- **Prison** : jusqu'à 5 ans pour le dirigeant
- **Code santé L1110-4** : 1 an + 15 000€ pour violation secret médical
- **Fermeture administrative** par la CNIL

---

## Partie 4 — L'analogie de la bijouterie

```
+--------------------------------------------------------+
|                    TA BIJOUTERIE                       |
|                                                        |
|  [VITRINE]            [TIROIR-CAISSE]      [COFFRE]   |
|  Site web public      Données normales     Données     |
|  - prix affichés      - chauffeurs         médicales   |
|  - photos             - courses            - NSS       |
|  - contact            - GPS                - ALD       |
|                                            - prescription|
|                                                        |
|  Aucune protection    RGPD standard        RGPD + HDS  |
+--------------------------------------------------------+
```

**Règle d'or** : tu ne mets JAMAIS de donnée santé dans Supabase. Tu mets juste un "ticket" qui pointe vers le coffre HDS.

---

## Partie 5 — Les briques avec code couleur clair

Pour chaque brique : **couleur**, prix RÉEL marché (revu à la baisse vs V1), si tu peux t'en passer.

---

### 🔴 BRIQUE 1 — Hébergeur HDS

**C'est quoi simplement ?**
Un coffre-fort certifié par l'État pour stocker les données médicales.

**Combien ça coûte EN VRAI à Marseille ?**
- **OVHcloud HDS Eco** : à partir de **80 €/mois** (largement suffisant pour 0-500 taxis)
- À 1 500 taxis (Marseille saturé) : **~400 €/mois**
- Outscale (plus cher) : 200-800€/mois
- Pas de frais de mise en place chez OVH

**Tu peux t'en passer ?** ❌ NON. Hors-la-loi sinon.

---

### 🔴 BRIQUE 2 — DPO (Délégué Protection Données)

**C'est quoi simplement ?**
Un gardien légal qui s'assure que tu respectes le RGPD.

**Combien ça coûte EN VRAI ?**
- **DPO mutualisé** (Dastra, Witik, DPO-Consulting) : **150 €/mois** au démarrage
- Avec plus de patrons : **300-400 €/mois**
- DPO interne salarié : seulement à partir de 5 000+ patrons (5 000€/mois)

**Tu peux t'en passer ?** ❌ NON. Obligatoire dès la 1ère donnée santé.

---

### 🔴 BRIQUE 3 — PIA (Analyse d'Impact)

**C'est quoi simplement ?**
Un document obligatoire qui prouve à la CNIL que tu as réfléchi aux risques.

**Combien ça coûte EN VRAI ?**
- **Mode malin** : logiciel PIA gratuit CNIL + relecture avocat = **1 500-2 500€** one-shot
- Mode confort : cabinet RGPD spécialisé santé = 5 000-8 000€
- À mettre à jour seulement si grosse évolution (gratuit avec ton DPO)

**Tu peux t'en passer ?** ❌ NON. Document n°1 demandé en contrôle CNIL.

---

### 🔴 BRIQUE 4 — Setup juridique RGPD

**C'est quoi simplement ?**
CGU + mentions légales + politique confidentialité + contrats sous-traitants + formulaires consentement.

**Combien ça coûte EN VRAI ?**
- **Templates RGPD santé existants + avocat 2-3h** : **1 500-3 000€** one-shot
- Cabinet premium santé numérique : 5 000-8 000€

**Tu peux t'en passer ?** ❌ NON. Avant le 1er patient.

---

### 🟠 BRIQUE 5 — Tiers télétransmission CPAM

**C'est quoi simplement ?**
L'entreprise agréée qui envoie tes factures à la sécu au format SESAM-Vitale.

**Combien ça coûte EN VRAI ?**
- **Au démarrage : 0 €** ! Tu commences SANS télétransmission auto. Le patron fait sa TT chez son éditeur actuel ou via SCOR. Toi tu fais juste l'export Excel/CSV.
- **À partir de la formule Premium 149€** : forfait Cegedim/Almerys ~**2 000-3 000€/mois fixe + variable**
- Frais de mise en place : 1 500-3 000€ one-shot

**Tu peux t'en passer ?** ✅ OUI au démarrage. À ajouter au mois 12-18 quand tu as 30+ patrons Premium.

---

### 🟠 BRIQUE 6 — Audit sécurité

**C'est quoi simplement ?**
Une boîte spécialisée qui essaie de pirater ton appli pour trouver les failles.

**Combien ça coûte EN VRAI ?**
- **Mini-audit démarrage** : **1 500-3 000€** one-shot (avant lancement)
- Pentest annuel à partir de 500+ patrons : **3 000-5 000€/an**
- Bug bounty (à partir de 5 000 patrons) : 200-500€/mois

**Tu peux t'en passer ?** 🟡 Au démarrage tu peux faire l'impasse 6 mois, mais c'est risqué. Recommandé dès le pilote.

---

### 🟠 BRIQUE 7 — Assurance cyber

**C'est quoi simplement ?**
Une assurance qui paye si tu te fais pirater ou si tu fais fuiter des données.

**Combien ça coûte EN VRAI ?**
- **Stoïk, Hiscox, AssurOne (early stage)** : **1 200-2 500 €/an** au démarrage (~100-200€/mois)
- À 1 000 patrons : 3 000-5 000€/an
- Plus tard (5 000+ patrons) : 10-30k€/an

**Tu peux t'en passer ?** 🟡 Légalement oui, mais 1 piratage = faillite. À prendre dès 50 patrons réels.

---

### 🟢 BRIQUE 8 — ADRi (vérif droits CPAM en temps réel)

**C'est quoi simplement ?**
API officielle gratuite de la sécu pour vérifier en 1 clic que le patient a ses droits ouverts.

**Combien ça coûte EN VRAI ?**
- **API : GRATUITE** (offerte par l'Assurance Maladie)
- **MAIS** : agrément requis (dossier 6-12 mois)
- Coût du dossier : **2 000-5 000€** one-shot

**Tu peux t'en passer ?** ✅ OUI au démarrage. À viser pour le mois 12-18, c'est un gros argument commercial Premium.

---

### 🟢 BRIQUE 9 — Pro Santé Connect

**C'est quoi simplement ?**
Login France-Connect pour les médecins. Permet aux médecins d'envoyer directement les bons de transport.

**Combien ça coûte EN VRAI ?**
- Intégration : **3 000-5 000€** one-shot
- Pas de frais récurrents

**Tu peux t'en passer ?** ✅ OUI. À ajouter quand tu auras prouvé le modèle (année 2-3).

---

### 🟢 BRIQUE 10 — App mobile native iOS/Android

**C'est quoi simplement ?**
Vraie appli téléchargeable sur l'App Store / Play Store.

**Combien ça coûte EN VRAI ?**
- **PWA (Progressive Web App)** : **0€**, déjà inclus dans Vercel. Marche sur tous les téléphones.
- App native React Native : **8 000-15 000€** dev + 99€/an Apple + 25€ Google
- Pour Marseille au démarrage, **la PWA suffit largement**.

**Tu peux t'en passer ?** ✅ OUI. PWA jusqu'à 1 000+ taxis sans souci.

---

### 🟢 BRIQUE 11 — Notifications

**C'est quoi simplement ?**
Alertes automatiques chauffeur/patient/patron.

**Combien ça coûte EN VRAI ?**
- **Push** (Firebase) : **0€**, illimité
- **Email** (Brevo, AWS SES) : ~0,0005€/email = **0-150€/mois** au démarrage
- ~~SMS~~ : **abandonnés** (60× plus cher que email, valeur ajoutée faible)

**Tu peux t'en passer ?** ✅ OUI. Mais c'est quasi-gratuit donc autant le faire.

---

## RÉCAP : tableau de toutes les briques

| Brique | Couleur | Coût démarrage | Coût récurrent à 200 taxis | À 1 500 taxis |
|---|---|---|---|---|
| 1. Hébergeur HDS | 🔴 | 0€ | 80€/mois | 400€/mois |
| 2. DPO externe | 🔴 | 0€ | 150€/mois | 400€/mois |
| 3. PIA | 🔴 | 2 000€ | 0€ (inclus DPO) | 0€ |
| 4. Setup juridique | 🔴 | 2 000€ | 0€ | 0€ |
| 5. Tiers télétransmission | 🟠 | 0€ (skip) | 0€ (skip) | 1 000€/mois |
| 6. Audit sécu | 🟠 | 2 000€ mini | 100€/mois (amorti) | 400€/mois |
| 7. Assurance cyber | 🟠 | 0€ | 100€/mois | 350€/mois |
| 8. ADRi | 🟢 | 0€ (skip) | 0€ | 0€ (gratuit) |
| 9. Pro Santé Connect | 🟢 | 0€ (skip) | 0€ | 0€ |
| 10. App native | 🟢 | 0€ (PWA) | 0€ | 0€ |
| 11. Push + email | 🟢 | 0€ | 100€/mois | 600€/mois |

**Total démarrage one-shot : ~6 000 €**
**Total récurrent à 200 taxis : ~530 €/mois**
**Total récurrent à 1 500 taxis : ~3 150 €/mois**

C'est **bien moins** que ce que je disais en V1 (~17 000€/mois pour 1 000 taxis avant SMS). La V1 incluait des choses pas obligatoires au démarrage.

---

## Partie 6 — Comparatif des concurrents (prix réels marché 2026)

| Solution | Type | Tarif /mois /véhicule | Ce qu'il fait | Limite |
|---|---|---|---|---|
| **Saphir** (Cegedim) | Logiciel installé | **80-150€** | Tout-en-un (planning, TT, facturation) | Vieillot, formation lourde, support lent |
| **Taxinea** | SaaS | **50-80€** | TT CPAM + planning basique | UX dépassée |
| **Dister** | SaaS | **60-100€** | TT + planning | Peu mobile-friendly |
| **CT2P** | SaaS | **40-70€** | TT minimaliste | Pas d'évolution |
| **Bee2link Taxi** | SaaS récent | **60-100€** | Moderne | Pas spécialisé santé |
| **Logitaxi** | Light | **35-60€** | Essentiel artisans | Manque features pro |
| **Excel + papier** | DIY | **0€** | Rien | Risque d'erreur énorme |

### Ce que tu apportes par rapport à eux

| Feature | Toi | Saphir | Taxinea | Logitaxi |
|---|---|---|---|---|
| Mobile-first (smartphone chauffeur) | ✅ | ❌ | ❌ | ⚠️ |
| Suivi GPS auto | ✅ | ❌ | ❌ | ❌ |
| Dashboard patron temps réel | ✅ | ⚠️ | ⚠️ | ❌ |
| Alertes prescription | ✅ | ❌ | ❌ | ❌ |
| Facturation auto CPAM | 🔜 | ✅ | ✅ | ⚠️ |
| Multi-tenancy moderne | ✅ | ❌ | ❌ | ❌ |
| Support en français rapide | ✅ | ❌ | ⚠️ | ⚠️ |
| Tarif accessible artisan | ✅ (30€) | ❌ | ⚠️ | ✅ |

**Ton angle d'attaque** : "Saphir mais en moderne, mobile, et 2× moins cher pour les artisans."

---

## Partie 7 — Tarifs adaptés au marché (3 formules)

### 🟢 Solo — **30 €/mois** (1 véhicule)

**Pour qui ?** Artisans seuls (70% du marché taxi conventionné).

**Inclus :**
- Dashboard chauffeur + appli mobile (PWA)
- Création de courses CPAM avec patient + adresses + médecin
- GPS suivi de course
- Bons de transport dématérialisés
- Export CSV/Excel pour télétransmission via leur logiciel actuel ou SCOR
- Statistiques mensuelles personnelles
- Support email

**Comparé au marché** : Logitaxi 35-60€, Excel 0€. Tu te positionnes **juste au-dessus de la gratuité** mais avec un vrai outil moderne.

---

### 🟢 Pro — **79 €/mois** (jusqu'à 5 véhicules)

**Pour qui ?** Petites centrales / patrons avec 2-5 chauffeurs (25% du marché).

**Inclus (en plus de Solo) :**
- Multi-chauffeurs avec gestion plannings
- Dashboard patron complet
- Alertes fin de prescription patient
- Suivi des rejets CPAM (manuel : tu importes tes rejets, on t'aide à les comprendre)
- Statistiques avancées (CA par chauffeur, par période, par patient)
- Support téléphonique heures bureau

**Comparé au marché** : Saphir 80-150€/véhicule × 5 = 400-750€/mois. **Tu es 5-10× moins cher.**

---

### 🟢 Premium — **149 €/mois** (illimité véhicules)

**Pour qui ?** Centrales 6+ véhicules (5-10% du marché).

**Inclus (en plus de Pro) :**
- Véhicules illimités
- Télétransmission auto CPAM (via Cegedim/Almerys, à partir mois 12-18)
- ADRi temps réel (à partir mois 18, après agrément)
- Relevés URSSAF auto
- Support prioritaire + KAM dédié
- Personnalisation logo / couleurs

**Comparé au marché** : Saphir 80-150€ × 10 véhicules = 800-1 500€/mois. **Tu es 5-10× moins cher.**

---

### Hypothèse de répartition Marseille

D'après les patterns du marché taxi conventionné français :
- **65 %** Solo (artisans seuls dominants)
- **25 %** Pro
- **10 %** Premium

**Revenu moyen par patron** = 0,65 × 30 + 0,25 × 79 + 0,10 × 149 = **~54 €/mois**

---

## Partie 8 — Notifications : push + email gratuits, pas de SMS

Choix de conception : **0 SMS**.

| Type | Coût | Usage |
|---|---|---|
| **Push** (Firebase) | **0 €** illimité | Notif chauffeur/patron dans l'appli |
| **Email** (Brevo) | **~0,0005 €/email** | Confirmations, rejets, factures |
| ~~SMS~~ | abandonné | Trop cher (0,03-0,05€/SMS) pour valeur ajoutée faible |

Économie : ~95% sur les coûts de notification.

---

## Partie 9 — 4 scénarios chiffrés MARSEILLE

### Hypothèses communes
- 1 patron = ~1,33 taxi (mix artisans + petites centrales)
- 1 taxi conventionné = ~300 courses CPAM/mois
- Mix tarifaire : 65% Solo, 25% Pro, 10% Premium
- Revenu moyen : 54€/mois/patron

---

### 🟦 Scénario A — Phase 1 : 200 taxis (mois 0-12)

**Cible** : 15% du marché Marseille intra-muros conventionné.

**Patrons** : ~150

#### Revenus
- 98 Solo × 30€ = **2 940 €**
- 38 Pro × 79€ = **3 000 €**
- 15 Premium × 149€ = **2 235 €**
- **Total : ~8 175 €/mois (98 100 €/an)**

#### Coûts tech & conformité
| Poste | Couleur | €/mois |
|---|---|---|
| Hébergement HDS OVHcloud | 🔴 | 80 |
| Supabase + Vercel + monitoring | — | 80 |
| DPO externe mutualisé | 🔴 | 150 |
| Email transactionnel (180k mails) | 🟢 | 90 |
| Tiers télétransmission | 🟠 | 0 (skip Phase 1) |
| Assurance cyber | 🟠 | 100 |
| Audit sécu mini (amorti) | 🟠 | 170 |
| **Sous-total** | | **~670 €/mois** |

#### Coûts équipe (LEAN)
| Poste | €/mois |
|---|---|
| Toi (CEO + commercial Marseille) | 3 500 |
| 1 dev senior freelance (½ temps) | 4 500 |
| Compta externe | 250 |
| Coworking 1 poste | 250 |
| Marketing local Marseille | 500 |
| **Sous-total** | **~9 000 €/mois** |

#### Résultat Phase 1
| | €/mois | €/an |
|---|---|---|
| Revenu | +8 175 | +98 100 |
| Coûts tech | -670 | -8 040 |
| Coûts équipe | -9 000 | -108 000 |
| **NET** | **-1 500** | **-18 000** |

🟡 **Tu es en déficit léger.** Normal en phase de lancement. Cash à brûler : ~30k€.

---

### 🟦 Scénario B — Phase 2 : 500 taxis (mois 12-24)

**Cible** : 40% du marché Marseille intra-muros.

**Patrons** : ~370

#### Revenus
- 240 Solo × 30€ = **7 200 €**
- 92 Pro × 79€ = **7 270 €**
- 37 Premium × 149€ = **5 510 €**
- **Total : ~20 000 €/mois (240 000 €/an)**

#### Coûts tech & conformité
| Poste | €/mois |
|---|---|
| HDS OVHcloud | 150 |
| Supabase + Vercel + monitoring | 150 |
| DPO externe | 200 |
| Email (450k mails) | 220 |
| Tiers télétransmission (37 Premium × 300 courses × 0,04€) | 440 |
| Assurance cyber | 150 |
| Audit sécu mini | 250 |
| **Sous-total** | **~1 560 €/mois** |

#### Coûts équipe
| Poste | €/mois |
|---|---|
| Toi | 4 000 |
| 1 dev senior plein temps | 6 500 |
| 1 support client mi-temps | 1 800 |
| 1 commercial Marseille mi-temps | 2 500 |
| Compta externe | 300 |
| Coworking 3 postes | 600 |
| Marketing | 1 000 |
| **Sous-total** | **~16 700 €/mois** |

#### Résultat Phase 2
| | €/mois | €/an |
|---|---|---|
| Revenu | +20 000 | +240 000 |
| Coûts tech | -1 560 | -18 720 |
| Coûts équipe | -16 700 | -200 400 |
| **NET** | **+1 740** | **+20 880** |

🟢 **Tu deviens bénéficiaire (+21 k€/an).** Modeste mais solide. Cash brûlé Phase 1+2 cumulé : ~30k€.

---

### 🟦 Scénario C — Phase 3 : 1 000 taxis (mois 24-36)

**Cible** : >50% du marché métropolitain (Marseille + Aix).

**Patrons** : ~750

#### Revenus
- 488 Solo × 30€ = **14 640 €**
- 188 Pro × 79€ = **14 850 €**
- 75 Premium × 149€ = **11 175 €**
- **Total : ~40 700 €/mois (488 000 €/an)**

#### Coûts tech & conformité
| Poste | €/mois |
|---|---|
| HDS | 250 |
| Supabase + Vercel + monitoring | 280 |
| DPO externe | 300 |
| Email (900k mails) | 400 |
| Tiers télétransmission (75 × 300 × 0,03€) | 680 |
| Assurance cyber | 250 |
| Audit pentest amorti | 400 |
| **Sous-total** | **~2 560 €/mois** |

#### Coûts équipe
| Poste | €/mois |
|---|---|
| Toi (CEO) | 4 500 |
| 1 lead dev + 1 dev junior | 11 000 |
| 2 support clients | 5 000 |
| 1 commercial plein temps | 3 800 |
| Admin/compta externe | 500 |
| Bureau coworking 5 postes | 1 000 |
| Marketing | 2 000 |
| **Sous-total** | **~27 800 €/mois** |

#### Résultat Phase 3
| | €/mois | €/an |
|---|---|---|
| Revenu | +40 700 | +488 400 |
| Coûts tech | -2 560 | -30 720 |
| Coûts équipe | -27 800 | -333 600 |
| **NET** | **+10 340** | **+124 080** |

🟢 **Tu gagnes ~124 k€/an net.** Tu es chef d'entreprise rentable, équipe de 6.

---

### 🟦 Scénario D — Phase 4 : 1 500 taxis (Marseille saturé)

**Cible** : tout le marché conventionné Marseille + couverture Aix.

**Patrons** : ~1 100

#### Revenus
- 715 Solo × 30€ = **21 450 €**
- 275 Pro × 79€ = **21 725 €**
- 110 Premium × 149€ = **16 390 €**
- **Total : ~59 600 €/mois (715 000 €/an)**

#### Coûts tech & conformité
| Poste | €/mois |
|---|---|
| HDS | 400 |
| Supabase + Vercel + monitoring | 420 |
| DPO externe pro | 400 |
| Email (1,3M mails) | 600 |
| Tiers télétransmission (110 × 300 × 0,03€) | 990 |
| Assurance cyber | 350 |
| Audit pentest annuel amorti | 500 |
| **Sous-total** | **~3 660 €/mois** |

#### Coûts équipe
| Poste | €/mois |
|---|---|
| Toi (CEO) | 5 000 |
| 1 lead dev + 1 dev mid | 12 500 |
| 2 support clients | 5 500 |
| 1 commercial + 1 KAM | 7 500 |
| Admin/RH externalisé | 1 500 |
| Bureau (petit local) | 1 500 |
| Marketing | 3 000 |
| **Sous-total** | **~36 500 €/mois** |

#### Résultat Phase 4
| | €/mois | €/an |
|---|---|---|
| Revenu | +59 600 | +715 200 |
| Coûts tech | -3 660 | -43 920 |
| Coûts équipe | -36 500 | -438 000 |
| **NET** | **+19 440** | **+233 280** |

🟢🟢 **Tu gagnes ~233 k€/an net.** Boîte solide à 7 personnes, marché Marseille verrouillé.

---

## Partie 10 — LE TABLEAU QUI RÉSUME TOUT (Marseille)

| | **200 taxis** | **500 taxis** | **1 000 taxis** | **1 500 taxis** |
|---|---|---|---|---|
| Patrons clients | ~150 | ~370 | ~750 | ~1 100 |
| **Revenu /mois** | 8 k€ | 20 k€ | 41 k€ | 60 k€ |
| **Revenu /an** | 98 k€ | 240 k€ | 488 k€ | 715 k€ |
| Coûts tech /mois | -0,7 k€ | -1,6 k€ | -2,6 k€ | -3,7 k€ |
| Coûts équipe /mois | -9 k€ | -17 k€ | -28 k€ | -37 k€ |
| **NET /mois** | **-1,5 k€** 🟡 | **+1,7 k€** 🟢 | **+10 k€** 🟢 | **+19 k€** 🟢 |
| **NET /an** | **-18 k€** | **+21 k€** | **+124 k€** | **+233 k€** |
| Marge | -19% | +9% | +25% | +33% |
| Taille équipe | 2 (toi + 1) | 4 | 6 | 7 |

**Point mort réel : ~300 taxis** (vs 1 500 dans la V1). Tu y arrives en ~14-16 mois.

---

## Partie 11 — Bonus : extension PACA puis national (année 5+)

Si Marseille est verrouillé et que tu veux grossir, le marché PACA total ouvre 3 800 taxis conventionnés.

| Étape | Taxis | Net /an estimé |
|---|---|---|
| Marseille saturé | 1 500 | +233 k€ |
| Extension PACA (Aix + Toulon) | 2 500 | **+450 k€** |
| Région PACA totale + Côte d'Azur | 3 800 | **+780 k€** |
| Expansion nationale (Lyon, Bordeaux, etc.) | 8 000 | **+1,8 M€** |
| Leader national | 15 000 | **+4,5 M€** |

**Pour passer le cap national, levée de fonds nécessaire : 2-4 M€** (Série A, après preuve à Marseille).

---

## Partie 12 — Cash à mobiliser pour atteindre Marseille saturé

C'est là que la V1 surévaluait massivement (700k-1M€). En vrai :

### Phase 0 — Pré-lancement (mois -3 à 0)
**One-shot :**
- Setup juridique RGPD : **2 000 €**
- PIA + dossier CNIL : **2 000 €**
- Mini-audit sécu pré-lancement : **2 000 €**
- Mise en place HDS : **0€**
- Site web + branding : **2 000 €** (déjà fait pour toi)
- **Total : ~6 000 €**

### Phase 1 — Lancement (mois 0-12, 0→200 taxis)
- Brûle moyen : ~1 500€/mois × 12 = **~18 000€**
- + buffer de sécurité : **~12 000€**
- **Cash Phase 1 : ~30 000 €**

### Phase 2 — Croissance (mois 12-24, 200→500 taxis)
- Tu deviens rentable au mois ~15. Plus de cash net à brûler.
- Mais investissements R&D (TT auto, ADRi) : **~20 000 €**
- **Cash Phase 2 : ~20 000 €**

### Total à mobiliser pour atteindre 500 taxis (autonomie)
**~60 000 €** (vs 700k-1M€ V1, soit **>10× moins**).

### Au-delà
- Pour passer de 500 à 1 500 taxis : **autofinancé**, pas de cash externe.
- Pour expansion PACA puis nationale : levée de fonds 2-4M€ optionnelle.

### Comment trouver les 60 000 € ?
- **Apport personnel** : si tu peux mettre 20-30k€
- **Love money** (famille, amis) : 10-20k€
- **Prêt d'honneur Initiative Marseille** : jusqu'à 40k€ à 0%
- **Subvention BPI French Tech Tremplin** : jusqu'à 30k€ non remboursable
- **Prêt brassage banque** (avec garantie BPI) : 50-100k€

C'est **largement à ta portée** sans VC.

---

## Partie 13 — Ce qui peut te tuer (les vrais risques)

1. **Tu mets une donnée santé sur Supabase au lieu du HDS** → contrôle CNIL → 50 000€ amende minimum.
   ✅ Solution : architecture 2 coffres dès le jour 1.

2. **Tu lances la facturation auto trop tôt sans agrément** → procès du patron, image cramée.
   ✅ Solution : commencer en mode Solo/Pro sans TT auto, ajouter Premium au mois 12-18.

3. **Un patron se fait pirater son compte** → fuite des données de ses 50 patients → presse → fin.
   ✅ Solution : 2FA obligatoire dès le 1er compte.

4. **Saphir/Cegedim attaque ton positionnement à Marseille** → guerre des prix.
   ✅ Solution : verrouille les patrons via l'expérience produit (mobile, support rapide), pas le prix seul.

5. **Tu codes seul sans contrôle qualité** → bugs → données mélangées entre patrons.
   ✅ Solution : 1 dev senior dès Phase 1, code review systématique.

6. **L'agrément CPAM ADRi prend 18 mois au lieu de 12** → retard sur Premium.
   ✅ Solution : démarrer le dossier dès la Phase 1 (mois 3) en parallèle.

---

## Partie 14 — Mes recommandations claires

### Étape 1 — Tout de suite (mois 0-3)
1. ✅ **Trouver un avocat RGPD spécialisé santé** — 1 RDV gratuit + devis ~3 000€ (setup + PIA)
2. ✅ **Ouvrir un compte OVHcloud HDS** — gratuit
3. ✅ **Engager un DPO mutualisé** (Dastra ou Witik) à 150€/mois
4. ✅ **Mini-audit sécu** par une boîte locale Marseille (1 500-2 000€)
5. ✅ **Architecture 2 coffres** dans le code : aucune donnée santé sur Supabase
6. ✅ **Déposer le dossier ADRi** (pour gagner du temps, agrément en mois 12-15)

### Étape 2 — Lancement Marseille (mois 3-12)
7. ✅ **Recrute 1 dev senior freelance** (~5 000€/mois mi-temps)
8. ✅ **Signe 50-100 taxis pilotes** Marseille à prix promo (20€/mois Solo) en échange retours
9. ✅ **Toi en commercial terrain** : ADTM Marseille, stations de la gare St-Charles, places taxi, etc.
10. ✅ **Récolter témoignages vidéo** des patrons satisfaits → contenu pour acquisition

### Étape 3 — Croissance (mois 12-24)
11. ✅ **Recrute 1 commercial mi-temps** Marseille
12. ✅ **Lance la formule Premium** avec TT auto via Cegedim/Almerys
13. ✅ **Passe à 500 taxis** (40% du marché Marseille intra-muros)

### Étape 4 — Marseille saturé (mois 24-48)
14. ✅ **Étends à Aix-en-Provence** (350 taxis conventionnés)
15. ✅ **Recrute 1 KAM** pour les centrales Premium
16. ✅ **Solidifie l'équipe** à 7 personnes

### Étape 5 — Bonus : si tu veux aller plus loin (année 5+)
17. ⚪ **Prépare une levée Série A** (2-4M€) pour expansion PACA puis nationale
18. ⚪ **Recrute un CTO** salarié à temps plein

---

## Partie 15 — Les 5 questions à te poser MAINTENANT

1. **Tu peux mobiliser combien de cash personnel/love money ?**
   - 0-10k€ → Initiative Marseille + BPI obligatoires
   - 10-30k€ → tu peux faire la Phase 0+1 sans aide
   - 30k€+ → tu vas vite jusqu'à 500 taxis sans souci

2. **Tu fais ça seul ou avec associé ?**
   - Seul → 1 dev senior freelance dès le mois 0
   - Associé → idéalement quelqu'un avec compétence tech ou commerciale forte

3. **Tu veux rester maître à 100% ou OK pour diluer plus tard ?**
   - 100% maître → stop à Marseille saturé (~233k€/an net = très bonne vie)
   - Diluer OK → expansion PACA puis nationale, sortie potentielle 5-10 M€ à 5 ans

4. **Tu veux quel rythme ?**
   - Bootstrap pur → 4-5 ans pour atteindre 1 500 taxis
   - Avec petit prêt 60k€ → 3-4 ans
   - Avec mini-levée 200-300k€ → 2-3 ans

5. **Comment tu mesures la réussite ?**
   - Salaire confortable + indépendance → vise 500-1 000 taxis Marseille
   - Boîte respectée → 1 500 taxis (Marseille leader)
   - Aventure entrepreneuriale ambitieuse → expansion nationale

---

## Conclusion en 5 lignes

- **Tu peux lancer Marseille avec ~60 000 €** (vs 700k-1M€ que je disais en V1).
- **Le point mort est à ~300 taxis**, atteignable en **14-16 mois**.
- **À 1 500 taxis (Marseille saturé) tu gagnes ~233 k€/an net** avec une équipe de 7.
- **Ton angle d'attaque** : "Saphir mais en moderne, mobile, et 2× moins cher pour les artisans."
- **Le seul vrai risque mortel** : mettre des données santé hors HDS (architecture 2 coffres dès jour 1).

---

**Tu as des questions précises ? Dis-moi quelle partie est encore floue, on creuse SEULEMENT celle-là.**
