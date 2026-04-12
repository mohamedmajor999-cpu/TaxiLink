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
| Intégration dans le flow app  | ⏳ À faire | Où déclencher l'onboarding ? (après inscription ?) |

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

## Infrastructure / Config

| Élément              | État       | Notes |
|----------------------|------------|-------|
| CSP `unsafe-eval`    | ✅ Terminé | Dev only, dans `next.config.mjs` |
| JsonLd SEO           | ✅ Terminé | Données structurées sur la landing |
| Auth middleware      | ✅ Terminé | Protège `/dashboard/*`, redirige par rôle |
| `missionMapper.ts`   | ✅ Terminé | Mapper `Mission` (Supabase) → `AgendaRide` (@taxilink/core) |
| ESLint config        | ⏳ À faire | Créer `apps/web/.eslintrc.json` avec `next/core-web-vitals` |
| Métadonnées SEO auth | ⏳ À faire | Ajouter `metadata` sur `auth/register/page.tsx` et `auth/forgot-password/page.tsx` |
| Tests services       | ⏳ À faire | Créer `missionService.test.ts` + `authService.test.ts` |

---

## Légende

- ✅ Terminé
- ⏳ À faire
- 🚧 En cours
- ❌ Bloqué
