# Tarifs CPAM / Convention CNAM 2025-2026 — Transport de malades assis

> Régulation : **Convention-cadre nationale CNAM** (arrêté du 16 mai 2025 / 29 juillet 2025), en vigueur depuis le **1er novembre 2025**.
> Valeurs applicables à TaxiLink pour l'estimation automatique du prix CPAM (motifs HDJ / Consultation).

---

## 1. Structure tarifaire nationale

| Élément | Valeur | Note |
|---|---|---|
| Forfait de prise en charge | **13,00 €** | Inclut les 4 premiers km (patient à bord) |
| Tarif au km (BDR) | **1,38 €/km** | À partir du 5e km — vérifié sur [calcul-taxi-conventionne.fr](https://calcul-taxi-conventionne.fr/simulateur) (2026) |
| Plancher national | **1,07 €/km** | Aucun département ne peut descendre sous ce seuil |
| Supplément grande ville | **+15,00 €** | Si prise en charge OU dépôt dans une des 12 villes listées — **sauf si intra-ZUPC** |
| Majoration nuit / WE / férié | **× 1,5 sur socle** | Règle nuit : >50% du trajet entre 20h-8h |
| Retour à vide (HDJ) — <50 km | **+25 %** sur partie km | Uniquement HDJ et hors intra-ZUPC |
| Retour à vide (HDJ) — ≥50 km | **+50 %** sur partie km | Idem |
| Supplément TPMR (fauteuil roulant) | **+30 €** | Détecté via `transport_type = 'WHEELCHAIR'`. **Hors majoration et abattement** |
| Transport partagé | **-23 % / -35 % / -37 %** | Abattement par patient. Chaque patient est facturé séparément à la CPAM ; total chauffeur = somme des facturations (donc 2 patients génèrent 2× le prix réduit, etc.) |
| Frais d'approche + attente | **Supprimés** | Intégrés au forfait de 13 € |

Source principale : [Légifrance — Arrêté 29 juillet 2025](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000052060568)
Références secondaires : [Ameli — Nouvelle convention-cadre](https://www.ameli.fr/taxi-conventionne/actualites/nouvelle-convention-cadre-meilleur-acces-aux-soins-et-tarification-plus-equitable-et-plus-simple-0) · [TiersPayant.net](https://tierspayant.net/taxis-nouvelle-convention-2025/) · [Tilimed](https://tilimed.fr/taxi-nouvelle-convention-cpam-2025-regles-de-facturation/)

---

## 2. Liste des 12 villes avec supplément grande ville (+15 €)

Marseille, Paris, Nice, Toulouse, Lyon, Strasbourg, Montpellier, Rennes, Bordeaux, Lille, Grenoble, Nantes.
S'ajoutent les **départements 92, 93, 94** (Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne).

### ⚠️ Règle ZUPC — interdiction du GV si intra-ZUPC

Le forfait de +15 € **ne s'applique PAS** si la prise en charge ET la dépose sont dans la **même ZUPC BDR** (définie dans [zupcBdr.ts](../apps/web/src/components/dashboard/driver/zupcBdr.ts)).

Exemples :
- Marseille → Marseille (intra-ZUPC Marseille) → **pas de +15 €**
- Marseille → Allauch (même ZUPC) → **pas de +15 €**
- Marseille → Cassis (inter-ZUPC) → **+15 €** (Marseille est en GV)
- Marseille → Aix (inter-ZUPC) → **+15 €**
- Aix → Cassis (aucune GV) → **pas de +15 €**

Détection via `extractCommune()` + `determineReturnMode()` dans [zupcBdr.ts](../apps/web/src/components/dashboard/driver/zupcBdr.ts).

---

## 3. Règle nuit "> 50% du temps"

La majoration ×1,5 s'applique si **plus de 50 % de la durée du trajet en charge** est entre 20h et 8h.

```text
start  = date + heure_prise_en_charge
end    = start + durationMin
nightMin = somme des minutes de [start, end] tombant entre 20h-8h
majoré = nightMin / durationMin > 0.5
```

Exemples :
- Trajet 19h45 (20 min) → 15 min normales + 5 min nuit = 25% → **pas majoré**
- Trajet 19h30 (90 min) → 30 min normales + 60 min nuit = 66% → **majoré**

Implémenté dans [cpamFareEstimate.ts](../apps/web/src/components/dashboard/driver/cpamFareEstimate.ts), fonction `isNightPeriod()`.

---

## 4. Autres plages majorées (+50 %)

| Plage | Condition |
|---|---|
| **Samedi** | à partir de **12h00** (heure de prise en charge) |
| **Dimanche** | toute la journée |
| **Jour férié** | toute la journée — 8 fixes + 3 mobiles (cf. [frenchHolidays.ts](../apps/web/src/components/dashboard/driver/frenchHolidays.ts)) |

> Non cumulables : si plusieurs conditions sont vraies (ex. férié un dimanche), une seule majoration ×1,5 s'applique.

---

## 5. Formule d'estimation utilisée par TaxiLink

```text
Entrées :
  distanceKm       (Google/OSRM, aller avec patient)
  durationMin      (pour règle nuit >50% temps)
  date, heure      (prise en charge, fuseau Europe/Paris)
  medicalMotif     ('HDJ' | 'CONSULTATION')
  departure, destination (adresses complètes)
  passengers       (nombre de patients simultanés, défaut 1)
  transportType    ('SEATED' | 'WHEELCHAIR' | 'STRETCHER')
  returnTrip       (boolean — aller + retour patient)

Variables calculées :
  sameZupc          = même ZUPC BDR en départ et arrivée
  bigCity           = !sameZupc ET (depart ∈ 12 GV OU destination ∈ 12 GV)
  kmBillable        = max(0, distanceKm − 4)
  eligibleRetourVide = medicalMotif == 'HDJ' ET !sameZupc
  emptyReturnMult   = eligibleRetourVide
                        ? (distanceKm ≥ 50 ? 0.50 : 0.25)
                        : 0

Par patient (1 facture CPAM) :
  kmPart    = kmBillable × 1,38 × (1 + emptyReturnMult)
  socle     = 13 + kmPart
  si bigCity           : socle += 15
  si majoré (nuit/WE/férié) : socle ×= 1,5
  si passengers 2      : socle ×= 0,77   (-23%)
  si passengers 3      : socle ×= 0,65   (-35%)
  si passengers ≥ 4    : socle ×= 0,63   (-37%)
  si WHEELCHAIR        : perPatient = socle + 30   (hors majo/abattement)
  sinon                : perPatient = socle

Total chauffeur (somme des factures CPAM patient) :
  oneWay    = perPatient × passengers
  prixFinal = round(returnTrip ? oneWay × 2 : oneWay)
```

---

## 6. Exemples chiffrés

Hypothèses : départ et arrivée Marseille 2026, tarif BDR officiel 1,38 €/km. Total = revenu chauffeur (somme des factures CPAM patient).

| Scénario | dist | Date/heure | Motif | Patients | Calcul | Prix |
|---|---|---|---|---|---|---|
| Consultation intra-Marseille jour | 8 km | mardi 14:00 | CONSULT. | 1 | 13 + 4×1,38 = 18,52 | **19 €** |
| Idem + aller-retour patient | 8 km | mardi 14:00 | CONSULT. | 1 | 18,52 × 2 = 37,04 | **37 €** |
| Consultation nuit | 8 km | mardi 22:00 | CONSULT. | 1 | 18,52 × 1,5 = 27,78 | **28 €** |
| Consultation Marseille → Cassis | 20 km | mardi 10:00 | CONSULT. | 1 | 13 + 16×1,38 + 15 = 50,08 | **50 €** |
| HDJ Marseille → Cassis | 20 km | mardi 10:00 | HDJ | 1 | 13 + (16×1,38×1,25) + 15 = 55,60 | **56 €** |
| HDJ Marseille → Aix dimanche | 60 km | dim. 10:00 | HDJ | 1 | (13+(56×1,38×1,5)+15) × 1,5 = 215,88 | **216 €** |
| Fauteuil roulant (TPMR) intra | 8 km | mardi 14:00 | CONSULT. | 1 | 18,52 + 30 = 48,52 | **49 €** |
| **Partagé 2 patients intra** (5 km HDJ) | 5 km | mardi 14:00 | HDJ | 2 | (13+1×1,38)×0,77×2 = 22,14 | **22 €** ✓ vs simulateur officiel |
| Partagé 3 patients intra | 8 km | mardi 14:00 | CONSULT. | 3 | 18,52×0,65×3 = 36,11 | **36 €** |
| Partagé 4+ patients intra | 8 km | mardi 14:00 | CONSULT. | 5 | 18,52×0,63×5 = 58,33 | **58 €** |

---

## 7. Implémentation technique

- **Helpers partagés** :
  - [frenchHolidays.ts](../apps/web/src/components/dashboard/driver/frenchHolidays.ts) — calcul Pâques (Meeus/Jones/Butcher) + 8 fériés fixes + 3 mobiles
  - [zupcBdr.ts](../apps/web/src/components/dashboard/driver/zupcBdr.ts) — `extractCommune()` + `determineReturnMode()` (10 ZUPC BDR)

- **Fichier utilitaire** : [cpamFareEstimate.ts](../apps/web/src/components/dashboard/driver/cpamFareEstimate.ts)

- **Signature** :
  ```ts
  estimateCpamFare({
    distanceKm, durationMin, date, time, medicalMotif,
    departure, destination, passengers, transportType, returnTrip
  }) → number | null
  ```
  Retourne `null` si : distance inconnue/négative, motif médical non défini, date/heure mal formatées.

- **Consommateurs** :
  - [missionFare.ts](../apps/web/src/lib/missionFare.ts) — affichage prix des missions stockées (`computeDisplayFare`)
  - [computeEffectivePrice.ts](../apps/web/src/components/dashboard/driver/computeEffectivePrice.ts) — calcul pendant le form
  - [FareEstimateButton.tsx](../apps/web/src/components/dashboard/driver/FareEstimateButton.tsx) — bouton "Estimer"

---

## 8. Limites connues / améliorations possibles

- [x] **Tarif km BDR officiel** : 1,38 €/km — valeur vérifiée sur le simulateur calcul-taxi-conventionne.fr (avril 2026).
- [x] **Règle ZUPC sur grande ville** : implémentée (intra-ZUPC → pas de +15 €)
- [x] **Règle nuit >50% temps** : implémentée via `durationMin`
- [x] **Extraction commune propre** (pas de `.includes()` naïf)
- [x] **TPMR** : implémenté via `transport_type = 'WHEELCHAIR'`
- [x] **Transport partagé** : implémenté via `passengers` (-23/-35/-37%)
- [x] **Aller-retour explicite** : contrôlé par `return_trip` de la mission (pas de ×2 silencieux)
- [ ] **Dérogation -5 % longue distance patient seul ≥30 km** : non modélisée (cas rare)
- [ ] **Retour à vide autres motifs** : actuellement seul HDJ déclenche. Convention officielle couvre aussi chimio, radio, dialyse — on pourrait étendre si un nouveau champ `type_transport_medical` est ajouté à la mission
- [ ] **Supplément DOM (+3 €)** : non applicable en BDR (Outre-mer uniquement)
- [ ] **Péages sur justificatif** : non modélisés dans l'estimation (à la charge client, non soumis aux majorations)
- [ ] **Mise à jour annuelle** : convention CNAM révisable annuellement

---

## 9. Sources officielles

- [Arrêté du 29 juillet 2025 — Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000052060568)
- [Arrêté du 16 mai 2025 — Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051605326)
- [Ameli — Nouvelle convention-cadre](https://www.ameli.fr/taxi-conventionne/actualites/nouvelle-convention-cadre-meilleur-acces-aux-soins-et-tarification-plus-equitable-et-plus-simple-0)
- [Ameli — Supplément TPMR cahier des charges](https://www.ameli.fr/taxi-conventionne/exercice-professionnel/prise-charge-transport/supplement-forfaitaire-tpmr-cahier-des-charges)
- [Tilimed — Règles de facturation CPAM 2025](https://tilimed.fr/taxi-nouvelle-convention-cpam-2025-regles-de-facturation/)
- [TiersPayant.net](https://tierspayant.net/taxis-nouvelle-convention-2025/)
- [Soraya.fr](https://soraya.fr/convention-cnam-2025-ce-que-doivent-savoir-les-taxis-effectuant-le-transport-de-malades-assis/)
- [Caree.fr — Ce qui change](https://www.caree.fr/blog-article/convention-cnam-2025-ce-qui-va-changer-pour-les-taxis-conventionnes)
