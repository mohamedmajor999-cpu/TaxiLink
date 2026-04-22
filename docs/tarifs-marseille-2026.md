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

## 4. Formule d'estimation utilisée par TaxiLink

**Choix « fourchette basse »** : tarifs A / B (aller-retour en charge), plus bas que C / D.
Raison : l'estimation doit rester conservatrice pour ne pas décourager le client.

```text
Entrées :
  distanceKm  (calculée via OSRM à partir des adresses départ + arrivée)
  date        (YYYY-MM-DD)
  heure       (HH:MM)

Détection tarif :
  estNuit   = heure < 7  OU  heure >= 19
  estDim    = (dayOfWeek == 0)
  estFérié  = date ∈ liste jours fériés FR
  useTarifB = estNuit OU estDim OU estFérié

  tarif     = useTarifB ? 1,45 €/km (B) : 1,12 €/km (A)

Calcul :
  prixBrut     = 2,40 + (distanceKm × tarif)
  prixFinal    = max(8,00 ; arrondi(prixBrut))
```

---

## 5. Exemples

| Scénario | Distance | Date/heure | Tarif | Calcul | Prix estimé |
|---|---|---|---|---|---|
| Course urbaine jour | 8 km | mer. 14:00 | A (1,12) | 2,40 + 8×1,12 = 11,36 | **11 €** |
| Course nuit | 8 km | mer. 22:00 | B (1,45) | 2,40 + 8×1,45 = 14,00 | **14 €** |
| Course dimanche | 12 km | dim. 10:00 | B | 2,40 + 12×1,45 = 19,80 | **20 €** |
| Course 14 juillet | 15 km | férié 11:00 | B | 2,40 + 15×1,45 = 24,15 | **24 €** |
| Petite course jour | 2 km | lun. 10:00 | A | 2,40 + 2×1,12 = 4,64 → min 8 | **8 €** |
| Aéroport Marignane | 28 km | mar. 09:00 | A | 2,40 + 28×1,12 = 33,76 | **34 €** |

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

- [ ] **Suppléments** non modélisés : 4e passager, bagages, animaux, prise en charge gare/aéroport (~3,24 €).
- [ ] **Tarif CPAM médical** : non implémenté (conventionné Sécu, barème différent — à définir séparément).
- [ ] **Tarifs C/D** (retour à vide) : non utilisés — possibilité d'afficher une fourchette haute/basse.
- [ ] **Mise à jour annuelle** : l'arrêté 2027 est publié typiquement en janvier → valeurs à revoir.
- [ ] **Pâques** : l'algorithme est valide pour années grégoriennes ≥ 1583.

---

## 8. Sources

- [Taxis de France — tarifs par département 2026](https://www.taxis-de-france.com/tarifstaxis.php)
- [Prix taxi aéroport de Marseille](https://www.taxismarseilleaeroport.fr/tarifs)
- [TaxiProxi — Bouches-du-Rhône](https://www.taxiproxi.fr/tarif-taxi-departement-bouches-du-rhone)
- [Arrêté préfectoral 13 (PDF)](https://www.bouches-du-rhone.gouv.fr/content/download/4553/26623/file/Arret%C3%A9%20Pr%C3%A9fectoral%2021%2001%202013.pdf)
- [Arrêté national — Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051106303)
