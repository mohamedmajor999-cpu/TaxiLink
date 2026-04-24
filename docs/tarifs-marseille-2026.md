# Tarifs taxi Marseille / Bouches-du-Rhône — 2026

> Régulation : **arrêté préfectoral des Bouches-du-Rhône** (dept. 13).
> Valeurs applicables à TaxiLink pour l'estimation automatique du prix.

---

## 1. Tarifs officiels 2026

| Élément | Valeur |
|---|---|
| Prise en charge (base) | **2,40 €** |
| Course minimum | **8,00 €** |
| Tarif A — jour, aller-retour en charge | **1,12 €/km** |
| Tarif B — nuit/dim/fériés, aller-retour en charge | **1,45 €/km** |
| Tarif C — jour, aller simple retour à vide | **2,24 €/km** |
| Tarif D — nuit/dim/fériés, aller simple retour à vide | **2,90 €/km** |
| Attente / marche lente | **35,60 €/h** |

Source : [taxis-de-france.com/tarifstaxis.php](https://www.taxis-de-france.com/tarifstaxis.php)
Arrêté officiel : [bouches-du-rhone.gouv.fr](https://www.bouches-du-rhone.gouv.fr/)

---

## 2. Plages horaires

| Plage | Période |
|---|---|
| **Jour** | **7h00 → 18h59**, du **lundi au samedi**, hors jours fériés |
| **Nuit** | **19h00 → 6h59**, + **tout dimanche**, + **tout jour férié** |

---

## 3. Jours fériés français pris en compte

**Fixes (8)** :
- 1er janvier — Jour de l'An
- 1er mai — Fête du Travail
- 8 mai — Victoire 1945
- 14 juillet — Fête nationale
- 15 août — Assomption
- 1er novembre — Toussaint
- 11 novembre — Armistice
- 25 décembre — Noël

**Mobiles (3)** — calculés via l'algorithme de **Pâques (Meeus/Jones/Butcher)** :
- Lundi de Pâques = dimanche de Pâques + 1 jour
- Jeudi de l'Ascension = dimanche de Pâques + 39 jours
- Lundi de Pentecôte = dimanche de Pâques + 50 jours

> Pâques 2026 : dimanche **5 avril 2026** → Lundi de Pâques = 6 avril, Ascension = 14 mai, Pentecôte = 25 mai.

---

## 4. Choix A/B vs C/D — règle officielle (arrêté 2026, article 3)

> - **Tarif A / B** : course avec **retour EN CHARGE à la station**.
> - **Tarif C / D** : course avec **retour À VIDE à la station**.

La "station" = commune de rattachement du taxi. Le tarif dépend donc de la **ZUPC** (Zone Unifiée de Prise en Charge) du chauffeur et de la destination.

### 4.1 Liste des ZUPC des Bouches-du-Rhône

| ZUPC | Communes regroupées |
|---|---|
| **Marseille** | Marseille, Allauch, Plan-de-Cuques, Septèmes-les-Vallons |
| **Aéroport Marignane** | Marignane, Vitrolles |
| **Aix-en-Provence** | Aix-en-Provence |
| **Aubagne** | Aubagne |
| **Arles** | Arles |
| **La Ciotat** | La Ciotat |
| **Martigues** | Martigues |
| **Istres** | Istres |
| **Miramas** | Miramas |
| **Salon-de-Provence** | Salon-de-Provence |

### 4.2 Logique appliquée par TaxiLink

```text
Détection tarif (colonne) :
  mêmeZUPC(départ, arrivée) = départ et arrivée appartiennent à la même ZUPC
  useAB = mêmeZUPC → A/B (retour en charge)
          sinon    → C/D (retour à vide)

Détection période (ligne) :
  estNuit = heure < 7 OU heure >= 19
  estDim  = (dayOfWeek == 0)
  estFérié = date ∈ liste jours fériés FR
  useNuit = estNuit OU estDim OU estFérié

Prix/km :
  useAB  + jour  → A = 1,12 €/km
  useAB  + nuit  → B = 1,45 €/km
  !useAB + jour  → C = 2,24 €/km
  !useAB + nuit  → D = 2,90 €/km

Calcul :
  prixBrut  = 2,40 + (distanceKm × prix/km)
             + (tempsPerduMin / 60 × 35,60)   // supplément trafic
  prixFinal = max(8,00 ; arrondi(prixBrut))
```

> **Note** : TaxiLink ne connaît pas à l'avance la station du chauffeur qui prendra la mission. La règle « même ZUPC = A/B » est donc une approximation favorable au client (hypothèse optimiste sur le retour en charge). Un trajet sortant de la ZUPC du chauffeur passe systématiquement en C/D (prix le plus sûr).

---

## 5. Exemples

| Scénario | Distance | Date/heure | ZUPC | Tarif | Calcul | Prix estimé |
|---|---|---|---|---|---|---|
| Intra-Marseille jour | 8 km | mer. 14:00 | même (Mars) | A (1,12) | 2,40 + 8×1,12 = 11,36 | **11 €** |
| Intra-Marseille nuit | 8 km | mer. 22:00 | même | B (1,45) | 2,40 + 8×1,45 = 14,00 | **14 €** |
| Intra-Marseille dimanche | 12 km | dim. 10:00 | même | B | 2,40 + 12×1,45 = 19,80 | **20 €** |
| Petite course jour | 2 km | lun. 10:00 | même | A | 2,40 + 2×1,12 = 4,64 → min 8 | **8 €** |
| Marseille → Aéroport Marignane | 21 km | jeu. 14:00 | différentes | **C (2,24)** | 2,40 + 21×2,24 = 49,44 | **50 €** |
| Marseille → Aix | 30 km | mar. 10:00 | différentes | **C** | 2,40 + 30×2,24 = 69,60 | **70 €** |
| Marseille → Cassis (hors BDR) | 20 km | mar. 10:00 | hors ZUPC | **C** | 2,40 + 20×2,24 = 47,20 | **47 €** |
| Marseille → Aix la nuit | 30 km | sam. 22:00 | différentes | **D (2,90)** | 2,40 + 30×2,90 = 89,40 | **89 €** |

---

## 6. Implémentation technique

- **Fichier utilitaire** : `apps/web/src/components/dashboard/driver/marseilleFareEstimate.ts`
- **Export** : `estimateMarseilleFare({ distanceKm, date, time }) → number | null`
  - Retourne `null` si : distance inconnue/négative, date ou heure mal formatée.
- **Intégration** : `PartagerMissionModal.tsx`, sous le champ « Prix ».
  - Bouton **« Estimer d'après le tarif Marseille : ~X € »** visible uniquement si :
    - champ Prix vide
    - `distanceKm` connue (OSRM a répondu)
    - date + heure valides
  - Clic → remplit le champ prix (modifiable ensuite par le chauffeur).

---

## 7. Limites connues / améliorations possibles

- [x] **Tarifs C/D** (retour à vide) : désormais appliqués automatiquement dès que le trajet sort de la ZUPC du chauffeur.
- [x] **Supplément trafic** : `duration - staticDuration` via Google Routes × 35,60 €/h.
- [ ] **Suppléments** non modélisés : ≥ 5ᵉ passager (+4 €/pers), bagages hors coffre (+2 €), 3ᵉ valise+ par passager (+2 €).
- [ ] **Péages** : à la charge du client, non modélisés (l'arrêté exige l'accord exprès du client avant emprunt).
- [ ] **Tarif CPAM médical** : implémenté séparément dans `cpamFareEstimate.ts` (barème conventionné Sécu).
- [ ] **Mise à jour annuelle** : l'arrêté 2027 sera publié typiquement en janvier → valeurs à revoir.
- [ ] **Pâques** : l'algorithme est valide pour années grégoriennes ≥ 1583.
- [ ] **ZUPC précises** : la composition de chaque ZUPC est une approximation basée sur les usages connus ; elle pourrait être affinée par commune via l'arrêté préfectoral de création de ZUPC (2017 pour Marseille).

---

## 8. Sources

- [Taxis de France — tarifs par département 2026](https://www.taxis-de-france.com/tarifstaxis.php)
- [Prix taxi aéroport de Marseille](https://www.taxismarseilleaeroport.fr/tarifs)
- [TaxiProxi — Bouches-du-Rhône](https://www.taxiproxi.fr/tarif-taxi-departement-bouches-du-rhone)
- [Arrêté préfectoral BDR n° 13-2026-02-03-00010 (29 janvier 2026)](https://www.bouches-du-rhone.gouv.fr/)
- [Arrêté national du 24 décembre 2025 — Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053228231)
