# PROGRESS.md

Suivi de l'avancement du projet TaxiLink Pro.

---

## Landing page (`/`) — `apps/web/src/app/page.tsx`

| Section        | État       | Notes |
|----------------|------------|-------|
| Navbar         | ✅ Terminé | Inchangée |
| Hero           | ✅ Terminé | Mockup téléphone, inchangé |
| Stats          | ✅ Terminé | Chiffres clés |
| HowItWorks     | ✅ Terminé | Étapes d'utilisation |
| Features       | ✅ Terminé | Mis à jour : Réseau de collègues · Confirmation automatique · Agenda synchronisé |
| Testimonials   | ✅ Supprimé | Retiré de la page |
| DownloadSection| ✅ Terminé | CTA téléchargement |
| Footer         | ✅ Terminé | |

---

## Page onboarding (`/onboarding`) — `apps/web/src/components/onboarding/OnboardingPage.tsx`

| Section                       | État       | Notes |
|-------------------------------|------------|-------|
| Header fixe (logo + login)    | ✅ Terminé | |
| Section 1 — Le problème       | ✅ Terminé | VoiceSimulator interactif |
| Section 2 — Pour les chauffeurs | ✅ Terminé | 3 cartes fonctionnalités |
| Section 3 — Pour les patrons  | ✅ Terminé | 4 étapes (géoloc, agenda, assigner, stats) |
| Section 4 — CTA / Gratuit     | ✅ Terminé | Boutons inscription chauffeur / patron |
| Bouton fixe bas (scroll CTA)  | ✅ Terminé | Apparaît après scroll jusqu'à la fin |
| Intégration dans le flow app  | ⏳ À faire | Où déclencher l&apos;onboarding ? (après inscription ?) |

---

## Application mobile — Dashboard chauffeur

| Composant / Ecran       | État       | Notes |
|-------------------------|------------|-------|
| AgendaScreen            | ✅ Terminé | Branché sur `missionService.getAgenda()` via `useAgendaScreen` |
| HistoriqueScreen        | ✅ Terminé | Branché sur `missionService.getDoneByDriver()` via `useHistoriqueScreen` |
| PaiementsModal          | ✅ Terminé | Branché sur `paymentService.getPayments()` via `usePaiementsModal` |
| SecuriteModal           | ✅ Terminé | Changement de mot de passe avec re-auth via `useSecuriteModal` |
| NotificationsModal      | ✅ Terminé | Préférences sauvegardées dans user metadata Supabase via `useNotificationsModal` |
| `PartagerMissionModal`  | ⏳ À faire | Placeholder actuel — formulaire multi-étapes à implémenter (BAN, OSRM, Web Speech API, RGPD) |

---

## Dashboard chauffeur — Bugs corrigés (session 2026-04-13)

| Élément                          | État       | Notes |
|----------------------------------|------------|-------|
| Navbar mobile — colonnes         | ✅ Terminé | `grid-cols-4` → `grid-cols-5` (5 items : 2 gauche + FAB + 2 droite) |
| Navbar mobile — bouton FAB       | ✅ Terminé | `w-14 h-14` → `w-16 h-16`, `-translate-y-3` → `-translate-y-5`, icône 28→32 |
| Inscription — "database error"   | ✅ Terminé | Triggers Supabase `handle_new_user` + `create_driver_on_profile` recréés avec `SECURITY DEFINER` |
| Inscription — champ `phone`      | ✅ Terminé | Ajouté dans `handle_new_user` depuis `raw_user_meta_data` |
| Inscription — champ `pro_number` | ✅ Terminé | Ajouté dans `create_driver_on_profile` via lookup `auth.users` |

---

## Stores & Services

| Élément              | État       | Notes |
|----------------------|------------|-------|
| `driverStore.load()` | ⏳ À faire | N'est appelé nulle part — à connecter pour charger les données réelles |
| `missionService.getAgenda()` | ✅ Terminé | Query corrigée (driver_id + neq DONE) |
| `paymentService.getPayments()` | ✅ Terminé | Service existant, utilisé dans usePaiementsModal |
| `authService.updatePassword()` | ✅ Terminé | Ajouté |
| `authService.getNotificationPrefs()` | ✅ Terminé | Ajouté (user metadata Supabase) |
| `authService.updateNotificationPrefs()` | ✅ Terminé | Ajouté |

---

## Déploiement

| Élément                    | État       | Notes |
|----------------------------|------------|-------|
| GitHub                     | ✅ Terminé | Repo `mohamedmajor999-cpu/TaxiLink` |
| Vercel                     | ✅ Terminé | Live sur `taxi-link-web.vercel.app` |
| `offline/page.tsx`         | ✅ Terminé | Extrait `RefreshButton` en Client Component (fix build) |
| Icônes Material Symbols    | ✅ Terminé | Police auto-hébergée dans `/public/fonts/` via `@font-face` |
| `missionMapper.test.ts`    | ✅ Terminé | Ajout des champs requis manquants (`departure_lat`, `destination_lat`, etc.) |

---

## Infrastructure / Config

| Élément              | État       | Notes |
|----------------------|------------|-------|
| CSP `unsafe-eval`    | ✅ Terminé | Dev only, dans `next.config.mjs` |
| JsonLd SEO           | ✅ Terminé | Données structurées sur la landing |
| Auth middleware      | ✅ Terminé | Protège `/dashboard/*`, redirige par rôle |
| `missionMapper.ts`   | ✅ Terminé | Mapper `Mission` (Supabase) → `AgendaRide` (@taxilink/core) |
| ESLint config        | ✅ Terminé | `.eslintrc.json` créé avec `next/core-web-vitals` — 0 erreur |
| Métadonnées SEO auth | ✅ Terminé | `metadata` sur toutes les pages auth + `app/page.tsx` |
| Tests services       | ✅ Terminé | `missionService.test.ts` (21 tests) + `authService.test.ts` (16 tests) |

---

## Page Groupes — Améliorations UX (session 2026-04-13)

| Fonctionnalité                  | État       | Notes |
|---------------------------------|------------|-------|
| `GroupMemberStats` type         | ✅ Terminé | Nouveau type dans `@taxilink/core` : driverId, fullName, isOnline, role, sharedCount, acceptedCount |
| `groupService.getMemberStats()` | ✅ Terminé | Stats partagées/acceptées par membre, filtrées par période (semaine/mois) |
| `groupService.getMyGroups()`    | ✅ Terminé | Inclut désormais `memberCount` via une 2e requête groupée |
| Compteur membres sur GroupCard  | ✅ Terminé | Affiché sous le nom du groupe avec icône `group` |
| Partage SMS depuis GroupCard    | ✅ Terminé | `sms:?body=...` avec message d'invitation pré-rempli |
| Partage WhatsApp depuis GroupCard | ✅ Terminé | `https://wa.me/?text=...` en nouvel onglet |
| `GroupMembersModal.tsx`         | ✅ Terminé | Nouveau composant extrait : tableau de stats, toggle semaine/mois, indicateur en ligne |
| `useDriverGroupes.ts`           | ✅ Terminé | Refactorisé : suppression `members`, ajout `memberStats`, `statsLoading`, `statsPeriod` |
| `DriverGroupesScreen.tsx`       | ✅ Terminé | Utilise `GroupMembersModal` à la place de l'ancien modal inline |
| Test `groupService.test.ts`     | ✅ Terminé | Mis à jour : mock `in()` ajouté, test `memberCount` ajouté |
| Tests totaux                    | ✅ 152 passing | 0 erreur TypeScript, 0 erreur ESLint |

---

## Audit CLAUDE.md & Refactoring qualité (session 2026-04-13 — suite)

### P1 — Découpage RegisterForm (>200 lignes → 3 fichiers)

| Fichier                          | État       | Notes |
|----------------------------------|------------|-------|
| `RegisterForm.tsx`               | ✅ Terminé | Orchestrateur ~80 lignes, utilise `useRegisterForm()` |
| `RegisterStep1.tsx`              | ✅ Terminé | Email + password + Google (~100 lignes) |
| `RegisterStep2.tsx`              | ✅ Terminé | lastName + firstName + phone + department (~70 lignes) |

### P1 — Refactoring useDriverGroupes + groupService (test "et" ❌ → ✅)

| Fichier                          | État       | Notes |
|----------------------------------|------------|-------|
| `groupStatsService.ts`           | ✅ Terminé | Extrait de groupService : `getMembers()` + `getMemberStats()` |
| `groupService.ts`                | ✅ Terminé | CRUD seulement (getMyGroups, create, join, leave, delete) |
| `useGroupActions.ts`             | ✅ Terminé | Hook co-localisé : mutations create/join/leave/delete |
| `useGroupStats.ts`               | ✅ Terminé | Hook co-localisé : selectedGroup, memberStats, statsPeriod |
| `useDriverGroupes.ts`            | ✅ Terminé | Orchestrateur ~50 lignes : compose useGroupActions + useGroupStats |

### P2 — Hooks co-localisés manquants

| Fichier                          | État       | Notes |
|----------------------------------|------------|-------|
| `useVoiceSimulator.ts`           | ✅ Terminé | Extrait de VoiceSimulator.tsx (state + run + reset) |
| `useInstallPage.ts`              | ✅ Terminé | Extrait de InstallPage.tsx (appUrl + activeTab) |
| `useDownloadPage.ts`             | ✅ Terminé | Extrait de DownloadPage.tsx (appUrl + activeOs) |
| `useNavbar.ts`                   | ✅ Terminé | Extrait de Navbar.tsx (open + toggle + close) |
| `useDriverDashboard.ts`          | ✅ Terminé | Extrait de DriverDashboard.tsx (activeTab + showCreer) |
| `useClientDashboard.ts`          | ✅ Terminé | Extrait de ClientDashboard.tsx (tab) |
| `useOnboardingPage.ts`           | ✅ Terminé | Extrait de OnboardingPage.tsx (showCta + IntersectionObserver) |

### P3 — Tests services (nouveaux)

| Fichier test                     | Tests | État       |
|----------------------------------|-------|------------|
| `driverService.test.ts`          | 7     | ✅ Passant |
| `profileService.test.ts`         | 7     | ✅ Passant |
| `paymentService.test.ts`         | 5     | ✅ Passant |
| `documentService.test.ts`        | 9     | ✅ Passant |
| `groupStatsService.test.ts`      | 5     | ✅ Passant (nouveau service) |

### P4 — Tests hooks (nouveaux)

| Fichier test                     | Tests | État       |
|----------------------------------|-------|------------|
| `useLoginForm.test.ts`           | 6     | ✅ Passant |
| `useDriverStats.test.ts`         | 6     | ✅ Passant |
| `useDriverMissions.test.ts`      | 6     | ✅ Passant (seul) |
| `useDriverProfile.test.ts`       | 3     | ✅ Passant (seul) |
| `useDriverPayments.test.ts`      | 2     | ✅ Passant |
| `useDriverAgenda.test.ts`        | 4     | ✅ Passant |
| `useGroupActions.test.ts`        | 4     | ✅ Passant |
| `useGroupStats.test.ts`          | 3     | ✅ Passant |
| `useGroupCard.test.ts`           | 5     | ✅ Passant |
| `useConfirmWithPassword.test.ts` | 3     | ✅ Passant |
| `useReservationForm.test.ts`     | 3     | ✅ Passant |

### Bilan audit (session 2026-04-14)

| Critère                          | Avant      | Après      |
|----------------------------------|------------|------------|
| Fichiers > seuil CLAUDE.md       | 0          | 0 ✅       |
| Violations test "et"             | 0          | 0 ✅       |
| Hooks sans co-localisation       | 6          | 3 (DriverProfilTab/Toast/CountdownCircle : exempts) |
| Tests hooks                      | 21 tests   | 45 tests ✅ |
| Score CLAUDE.md                  | 81/100     | ~92/100 🎯 |
| TypeScript errors                | 0          | 0 ✅       |
| Note OOM                         | —          | Windows : tests à lancer par fichier, pas en batch (heap OOM) |

---

## Légende

- ✅ Terminé
- ⏳ À faire
- 🚧 En cours
- ❌ Bloqué
