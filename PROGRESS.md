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

## Légende

- ✅ Terminé
- ⏳ À faire
- 🚧 En cours
- ❌ Bloqué
