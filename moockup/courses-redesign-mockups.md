# Page Courses — Redesign mobile-driver-v3

> Maquettes ASCII pour le redesign de [apps/mobile-driver-v3/app/(driver)/courses.tsx](../apps/mobile-driver-v3/app/(driver)/courses.tsx).
> Date : 2026-05-24.

## Demande

Refondre la page Courses en **3 parties** :

1. **Disponibles** — liste de toutes les courses encore disponibles (marketplace), affichage façon sheet PWA, avec filtres.
2. **Mes courses** — courses du jour et des jours suivants.
3. **Annonces** — mes annonces postées, avec sous-onglets *Actives / Transférées / Expirées*.

## Choix validés

| Décision | Valeur |
|---|---|
| Navigation interne | **3 onglets segmentés** sticky en haut, avec compteurs |
| Densité carte Disponibles | **Carte riche style PWA** (timeline `● │ ◉`, prix gros, badge type, délai coloré, km pickup + km course) |
| Filtres Disponibles | **Chips visibles en permanence** sous l'onglet |

---

## Layout commun

```
┌─────────────────────────────────────┐
│  Courses                       🔔 3 │  ← header + badge annonces (unseen)
├─────────────────────────────────────┤
│ ╭─Dispo─╮  Mes (7)   Annonces (5)  │  ← 3 onglets segmentés
│ │  12   │                           │     (compteurs par onglet)
│ ╰───────╯                           │
├─────────────────────────────────────┤
│                                     │
│        [contenu de l'onglet]        │
│                                     │
├─────────────────────────────────────┤
│  ⌂      📋✱      💰      ☰         │  ← BottomNav v3 (déjà en place)
└─────────────────────────────────────┘
```

---

## Partie 1 — Courses disponibles (marketplace)

Reprend la mise en page de `apps/web/src/components/dashboard/driver/home/MissionSheetItem.tsx` :
timeline verticale `● │ ◉`, prix en gras à droite, badge type + délai coloré, km pickup + km course.

```
┌─────────────────────────────────────┐
│ ╭─Dispo─╮  Mes (7)   Annonces (5)  │
│ │  12   │                           │
│ ╰───────╯                           │
├─────────────────────────────────────┤
│ [Tous 24] [CPAM 8] [Privé 4] [⚡U] │  ← chips type + urgent
│ [📍 <5km]  [Aujourd'hui ▾]         │  ← proximité + jour
├─────────────────────────────────────┤
│ 12 / 24 résultats          ↕ Tri ▾ │  ← ratio filtré/total + tri
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ●  Marseille, Bd Libération     │ │
│ │ │                       14,50 € │ │
│ │ ◉  Aix-en-Provence, Gare        │ │
│ │    [CPAM] · Dans 1h 12 · A/R    │ │
│ │                  📍 2.3 · 🛣 38 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ●  La Ciotat, Plage             │ │
│ │ │                       42,00 € │ │
│ │ ◉  Hôpital Nord                 │ │
│ │    [Privé] · Dans 8 min ⚠ URGENT│ │
│ │                  📍 1.1 · 🛣 22 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ●  Aubagne, Centre              │ │
│ │ │                       65,00 € │ │
│ │ ◉  CHU Timone                   │ │
│ │    [CPAM] · Maintenant          │ │
│ │                          🛣 18  │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Filtres

- **Type** : Tous / CPAM / Privé (chips avec compteur)
- **⚡ Urgent** : toggle (missions à < 10 min)
- **📍 Proximité** : toggle « < 5 km du chauffeur » (désactivé si pas de coords GPS)
- **Jour ▾** : Aujourd'hui / Demain / Cette semaine
- **Tri** : par heure / distance pickup / prix

### Source données

- `missionService.getAvailable(deptPreferences)` → RPC Supabase `get_marketplace_missions`
- Store : `useMissionStore` (existe, pas encore branchée en v3)
- Realtime : `MissionRealtimeProvider` déjà actif en v3

### Délai coloré (depuis `MissionSheetItem`)

| Délai | Couleur |
|---|---|
| ≤ 10 min | rouge `#EF4444` + badge ⚠ URGENT |
| < 1 h | orange `#F59E0B` |
| < 24 h | ink (texte principal) |
| ≥ 24 h | warm-500 (texte secondaire) |

---

## Partie 2 — Mes courses (jour + jours suivants)

Reprend `apps/mobile-driver-v3/src/components/courses/DayCoursesList.tsx` + DateStrip déjà en place.

```
┌─────────────────────────────────────┐
│ Dispo (12) ╭──Mes──╮ Annonces (5)  │
│            │   7   │                │
│            ╰───────╯                │
├─────────────────────────────────────┤
│  ◯  ◯  ◯  ●  ◯  ◯  ◯               │  ← DateStrip
│ Lun Mar Mer JEU Ven Sam Dim         │     (dot = jour avec courses)
│ 25  26  27  28  29  30  31          │
├─────────────────────────────────────┤
│                                     │
│ 🚀  EN COURS                         │
│ ┌─────────────────────────────────┐ │
│ │ ●  Marseille Centre             │ │
│ │ ◉  CHU Nord — M. Dupont         │ │
│ │ [ Avancer étape ]  [ Terminer ] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ AUJOURD'HUI · 4 courses · 312 €    │
│ ┌─────────────────────────────────┐ │
│ │ 09:15 │ Aix → CHU Marseille     │ │
│ │       │ M. Garcia · 38km   65 € │ │
│ │       │                  [CPAM] │ │
│ │ ───── ┼ ─────────────────────── │ │
│ │ 11:30 │ Aubagne → Cabinet Dr K. │ │
│ │       │ Mme Petit · 12km   42 € │ │
│ │       │                 [PRIVÉ] │ │
│ │ ───── ┼ ─────────────────────── │ │
│ │ 14:00 │ Marseille 7e → Timone   │ │
│ │       │ M. Boyer · 6km     38 € │ │
│ │       │                  [CPAM] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ DEMAIN · 3 courses · 187 €          │
│ ┌─────────────────────────────────┐ │
│ │ 08:30 │ ... · ... km     ... €  │ │
│ │ ...                              │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Comportement

- Hero **EN COURS** sticky en haut si une mission est `IN_PROGRESS`.
- DateStrip = navigation rapide vers un jour.
- Sections par jour avec en-tête `JOUR · N courses · Total €`.
- Tap ligne → modale détail (existant : `CourseActionsMenu`).

### Source données

- Store : `useDriverAgendaStore` (déjà branchée).
- Service : `missionService.getAgenda(driverId)` (filtre `.neq('status', 'DONE')`).

---

## Partie 3 — Annonces (mes annonces postées)

Aspire le contenu de `apps/mobile-driver-v3/app/(driver)/annonces.tsx` + `AdCardV7`. L'écran annonces.tsx disparaît.

```
┌─────────────────────────────────────┐
│ Dispo (12) Mes (7) ╭─Annonces─╮    │
│                    │     5     │    │
│                    ╰───────────╯    │
├─────────────────────────────────────┤
│ ╭─Actives─╮  Transf. (1)  Exp. (1) │  ← sous-onglets
│ │    3    │                         │
│ ╰─────────╯                         │
├─────────────────────────────────────┤
│ ⚠ 2 annonces sans preneur > 2h     │  ← banner stuck
│   Augmente le tarif ou élargis      │     (si applicable)
│   le partage de groupe.             │
├─────────────────────────────────────┤
│  Tous · Lun 25 · Mar 26 · Mer 27   │  ← filtre jour optionnel
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [CPAM]   ·   postée il y a 35min│ │
│ │ ●  Marseille, Bd Libération     │ │
│ │ ◉  Aix-en-Provence, Gare        │ │
│ │ Auj. 16:30 · 38 km · 65 €       │ │
│ │ ⏳ EN ATTENTE                    │ │
│ │ [ Modifier ]   [ Annuler ]      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [PRIVÉ]  URGENT  · postée 6 min │ │
│ │ ●  La Ciotat, Plage             │ │
│ │ ◉  CHU Nord                     │ │
│ │ Auj. 14:45 · 22 km · 42 €       │ │
│ │ 🔴 AUCUN PRENEUR · 2h 30         │ │
│ │ [ Modifier ]   [ Annuler ]      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [CPAM]   ·   postée hier        │ │
│ │ ●  Aubagne, Centre              │ │
│ │ ◉  Hôpital Nord                 │ │
│ │ Demain 09:00 · 18 km · 48 €     │ │
│ │ ⏳ EN ATTENTE                    │ │
│ │ [ Modifier ]   [ Annuler ]      │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Sous-onglets

| Onglet | Critère |
|---|---|
| **Actives** | `status = AVAILABLE` ET `scheduled_at > now` |
| **Transférées** | `status IN (ACCEPTED, DONE)` (un collègue l'a prise) |
| **Expirées** | `status = AVAILABLE` ET `scheduled_at <= now` (jamais prise) |

### Banner stuck

Affiché si ≥ 1 annonce active a > 2 h sans preneur :
> ⚠ N annonces sans preneur depuis > 2 h. Augmente le tarif ou élargis le partage.

### Source données

- Service : `missionQueries.getSharedByUser(userId, sinceIso)` (filtre `.eq('shared_by', userId)`).
- Notifications badges : `useUnseenAcceptCount` + `useUnseenUntakenCount`.

---

## Récap impact code

| Fichier | Action |
|---|---|
| [apps/mobile-driver-v3/app/(driver)/courses.tsx](../apps/mobile-driver-v3/app/(driver)/courses.tsx) | **Refondu** en orchestrateur 3 onglets |
| [apps/mobile-driver-v3/app/(driver)/annonces.tsx](../apps/mobile-driver-v3/app/(driver)/annonces.tsx) | À décider : suppression OU redirige vers `/courses?tab=annonces` |
| `apps/mobile-driver-v3/src/components/courses/CoursesTabBar.tsx` | **Nouveau** — les 3 segments + compteurs |
| `apps/mobile-driver-v3/src/components/courses/AvailableTab.tsx` + `useAvailableTab.ts` | **Nouveau** — onglet 1 |
| `apps/mobile-driver-v3/src/components/courses/MyCoursesTab.tsx` | **Nouveau** — extrait l'existant de courses.tsx |
| `apps/mobile-driver-v3/src/components/courses/AnnoncesTab.tsx` | **Nouveau** — déplace annonces.tsx |

Découpage motivé par les seuils de [CLAUDE.md](../CLAUDE.md) (composant ≤ 200 lignes, page ≤ 200 lignes).

---

## Points à trancher avant de coder

1. **L'écran annonces.tsx doit-il disparaître** ou rester accessible via la BottomNav (raccourci vers `/courses?tab=annonces`) ?
2. **Marketplace Disponibles** : on branche `useMissionStore` + bouton « Accepter » directement, ou lecture seule pour cette étape ?
3. **Découpage 5 fichiers** validé tel que listé ci-dessus ?
