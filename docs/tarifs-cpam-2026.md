# Tarifs CPAM / Convention CNAM 2025-2026 — Transport de malades assis

> Régulation : **Convention-cadre nationale CNAM** (arrêté du 16 mai 2025 / 29 juillet 2025), en vigueur depuis le **1er novembre 2025**.
> Valeurs applicables à TaxiLink pour l'estimation automatique du prix CPAM (motifs HDJ / Consultation).

---

## 1. Structure tarifaire nationale

| Élément | Valeur | Note |
|---|---|---|
| Forfait de prise en charge | **13,00 €** | Inclut les 4 premiers km |
| Tarif au km | **1,22 €/km** | À partir du 5e km — valeur variable par département, 1,22 utilisé comme référence à défaut de barème BDR publié |
| Supplément grande ville | **+15,00 €** | Si prise en charge OU dépôt dans une des 12 villes listées |
| Majoration nuit / WE / férié | **+50 %** sur l'ensemble | Non cumulable entre elles |
| Retour à vide (hospitalisation) — <50 km | **+25 %** sur partie km | Une seule extrémité avec patient |
| Retour à vide (hospitalisation) — ≥50 km | **+50 %** sur partie km | Idem |
| Supplément TPMR (fauteuil roulant) | **+30,00 €** | Non modélisé dans l'estimateur |
| Transport partagé | **-23 % / -35 % / -37 %** | 2 / 3 / 4+ patients — non modélisé |
| Frais d'approche + attente | **Supprimés** | Intégrés au forfait de 13 € |

Source principale : [soraya.fr — Convention CNAM 2025](https://soraya.fr/convention-cnam-2025-ce-que-doivent-savoir-les-taxis-effectuant-le-transport-de-malades-assis/)
Source secondaire : [caree.fr — Convention CNAM 2025](https://www.caree.fr/blog-article/convention-cnam-2025-ce-qui-va-changer-pour-les-taxis-conventionnes)
Textes officiels : [Légifrance JORFTEXT000051605326](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051605326) — [Légifrance JORFTEXT000052060568](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000052060568)

---

## 2. Liste des 12 villes avec supplément grande ville (+15 €)

Marseille, Paris, Nice, Toulouse, Lyon, Strasbourg, Montpellier, Rennes, Bordeaux, Lille, Grenoble, Nantes.
S'ajoutent les **départements 92, 93, 94** (Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne).

Déclenchement : la course commence OU se termine dans une de ces zones.
Détection dans TaxiLink : recherche textuelle (case-insensitive) du nom de la ville dans les adresses OSRM/BAN + motif regex `/\b(92|93|94)\d{3}\b/` pour les codes postaux d'Île-de-France.

---

## 3. Plages horaires majorées (+50 %)

| Plage | Période |
|---|---|
| Semaine — nuit | **20h00 → 07h59**, du lundi au vendredi |
| Samedi | **à partir de 12h00** jusqu'à lundi 08h00 |
| Dimanche | toute la journée |
| Jours fériés | toute la journée — 8 fixes + 3 mobiles (cf. `frenchHolidays.ts`) |

> **Non cumulables entre elles** : si plusieurs conditions sont vraies (ex. férié tombant un dimanche), on applique **une seule** majoration de +50 %.

**Algo utilisé dans TaxiLink** (`isCpamMajoredPeriod` dans `cpamFareEstimate.ts`) :

```text
si jour férié FR                → majoré
si dimanche                     → majoré
si samedi et heure ∈ [0-8[ ∪ [12-∞[ → majoré
si lundi et heure ∈ [0-8[ ∪ [20-∞[  → majoré
si mardi-vendredi et heure ∈ [0-8[ ∪ [20-∞[ → majoré
sinon                           → normal
```

---

## 4. Logique HDJ vs Consultation

Pour un transport CPAM, TaxiLink distingue deux motifs médicaux :

### Hôpital de jour (`HDJ`)
- **2 courses distinctes** : matin (domicile → hôpital) + soir (hôpital → domicile).
- Chaque course est un **aller simple avec retour à vide** (le taxi repart sans patient, ou arrive sans patient).
- Application de la **majoration retour à vide** (+25 % ou +50 % selon `distanceKm ≥ 50`) sur la partie kilométrique des deux courses.

### Consultation (`CONSULTATION`)
- **Aller-retour en charge** : le patient est dans le véhicule dans les deux sens.
- **2 courses** (aller + retour), chacune facturée avec forfait + partie km.
- **Pas de majoration retour à vide**.

> **Hypothèse de simplification** : l'heure indiquée dans le formulaire est l'heure de la première course. La majoration horaire et le supplément grande ville sont appliqués à chaque course (l'estimateur ne sait pas si le retour en soirée bascule dans une plage majorée — conservatisme en faveur du chauffeur : on garde la même majoration pour les deux courses).

---

## 5. Formule d'estimation utilisée par TaxiLink

```text
Entrées :
  distanceKm       (OSRM, aller simple, domicile ↔ hôpital)
  date             (YYYY-MM-DD) — prise en charge
  heure            (HH:MM)      — prise en charge
  medicalMotif     ('HDJ' | 'CONSULTATION')
  departure, destination (adresses texte)

Variables calculées :
  majored          = isCpamMajoredPeriod(date, heure)
  bigCity          = isBigCityAddress(departure) OU isBigCityAddress(destination)
  kmBillable       = max(0, distanceKm − 4)
  emptyReturnMult  = medicalMotif == 'HDJ'
                       ? (distanceKm ≥ 50 ? 0.50 : 0.25)
                       : 0

Une course :
  kmPart           = kmBillable × 1,22 × (1 + emptyReturnMult)
  course           = 13 + kmPart
  si bigCity       : course += 15
  si majored       : course ×= 1,50

Total :
  prixFinal        = arrondi(course × 2)
```

---

## 6. Exemples chiffrés

Hypothèses pour tous : départ Marseille, arrivée Marseille (grande ville ✓), 2026 tarif 1,22 €/km.

| Scénario | distanceKm | Date/heure | Motif | Détail calcul | Prix estimé |
|---|---|---|---|---|---|
| Consultation urbaine jour | 8 km | mer. 14:00 | CONSULTATION | 2 × (13 + 4×1,22 + 15) = 2 × 32,88 | **~66 €** |
| HDJ urbain jour | 8 km | mer. 08:00 | HDJ | 2 × (13 + 4×1,22×1,25 + 15) = 2 × 34,10 | **~68 €** |
| Consultation nuit | 8 km | mer. 22:00 | CONSULTATION | 2 × (13 + 4×1,22 + 15) × 1,5 = 2 × 49,32 | **~99 €** |
| HDJ dimanche | 8 km | dim. 09:00 | HDJ | 2 × (13 + 4×1,22×1,25 + 15) × 1,5 = 2 × 51,15 | **~102 €** |
| HDJ longue distance | 60 km | jeu. 08:00 | HDJ | 2 × (13 + 56×1,22×1,50 + 15) = 2 × 130,48 | **~261 €** |
| Consultation 14 juillet | 12 km | férié 11:00 | CONSULTATION | 2 × (13 + 8×1,22 + 15) × 1,5 = 2 × 56,64 | **~113 €** |
| HDJ aéroport Marignane | 28 km | mar. 07:30 | HDJ | 2 × (13 + 24×1,22×1,25 + 15) × 1,5 = 2 × 96,90 | **~194 €** |

> L'arrondi final est au nombre entier d'euros.

---

## 7. Implémentation technique

- **Helpers partagés** : `apps/web/src/components/dashboard/driver/frenchHolidays.ts`
  - `isFrenchHoliday(date)` — algo de Pâques (Meeus/Jones/Butcher) + 8 fériés fixes + 3 mobiles.
- **Fichier utilitaire** : `apps/web/src/components/dashboard/driver/cpamFareEstimate.ts`
- **Export** : `estimateCpamFare({ distanceKm, date, time, medicalMotif, departure, destination }) → number | null`
  - Retourne `null` si : distance inconnue/négative, motif médical non défini, date/heure mal formatées.
- **Intégration** : `apps/web/src/components/dashboard/driver/FareEstimateButton.tsx` — composant unifié qui choisit entre l'estimateur CPAM et l'estimateur Marseille privé en fonction du `type` de la course.
  - Affiché sous le champ **Prix** dans `PartagerMissionModal.tsx`.
  - Visible uniquement si : champ Prix vide, distance connue, date + heure valides, motif médical renseigné (pour CPAM).

---

## 8. Limites connues / améliorations possibles

- [ ] **Tarif km BDR précis** : aucun barème officiel pour le département 13 publié dans les sources consultées. On utilise 1,22 €/km (exemple Isère cité comme référence nationale). À ajuster dès publication.
- [ ] **TPMR** (+30 €) : non modélisé — nécessiterait un champ booléen dans le formulaire.
- [ ] **Transport partagé** : non modélisé — les remises -23/-35/-37 % supposent la connaissance du nombre de patients dans le même véhicule.
- [ ] **Bonus solo >30 km en mutualisé** (-5 %) : non modélisé.
- [ ] **Heure de la course retour en HDJ** : non demandée au chauffeur — la majoration horaire est calquée sur l'heure d'aller. Plus précis serait de demander une fourchette horaire retour.
- [ ] **Détection grande ville** : basée sur le texte libre de l'adresse ; peut générer des faux positifs si un mot de ville apparaît dans un nom de rue (ex. "rue de Nantes à Paris"). Amélioration possible : utiliser les codes INSEE retournés par l'API BAN.
- [ ] **Mise à jour annuelle** : convention CNAM révisée potentiellement chaque année → valeurs à revoir.
- [ ] **Franchise patient 2 €/trajet** : non appliquée ici car côté patient, pas côté chauffeur.

---

## 9. Sources

- [Convention CNAM 2025 — soraya.fr](https://soraya.fr/convention-cnam-2025-ce-que-doivent-savoir-les-taxis-effectuant-le-transport-de-malades-assis/)
- [Convention CNAM 2025 — caree.fr](https://www.caree.fr/blog-article/convention-cnam-2025-ce-qui-va-changer-pour-les-taxis-conventionnes)
- [TIERS PAYANT — Nouvelle convention 2025](https://tierspayant.net/taxis-nouvelle-convention-2025/)
- [Tarifs taxi par département (fond 2019)](https://france-taxi-conventionne-cpam.fr/tarifs-taxis-france.php)
- [Arrêté du 16 mai 2025 — Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051605326)
- [Arrêté du 29 juillet 2025 — Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000052060568)
- [Ameli — Nouvelle convention-cadre](https://www.ameli.fr/taxi-conventionne/actualites/nouvelle-convention-cadre-meilleur-acces-aux-soins-et-tarification-plus-equitable-et-plus-simple-0)
