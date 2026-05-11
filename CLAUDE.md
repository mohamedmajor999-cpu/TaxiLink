# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# From repo root (Turbo orchestration)
npm run dev          # Start all apps in dev mode
npm run web          # Start only apps/web (port 3000)
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run type-check   # TypeScript check across all packages
npm run test         # Run web test suite via turbo

# From apps/web
npm run dev          # next dev --port 3000
npm run test         # vitest run (single run)
npm run test:watch   # vitest (interactive)
npm run type-check   # tsc --noEmit

# From apps/mobile-driver
npm run dev                    # alias de `expo start` (bundler Metro + QR Expo Go)
npm run android                # `expo start --android` (lance sur emulateur ou device USB)
npm run type-check             # tsc --noEmit
npm run build:android:preview  # APK signe via EAS, distribution interne
npm run build:android:dev      # APK dev client (hot-reload sur device)
npm run build:ios:dev          # IPA dev client (TestFlight interne)
```

## Architecture

**Monorepo** (npm workspaces + Turbo):
- `apps/web` — Next.js 14 App Router, the entire product
- `apps/mobile-driver` — Expo SDK 52 + Expo Router 4, app chauffeur native (iOS + Android). Phase 1 Sem 1 bootstrappee 2026-05-10. Boot = `app/_layout.tsx` appelle `initApp()` (cf. `src/lib/init.ts`) qui branche les packages `@taxilink/services` au client Supabase mobile (storage = expo-secure-store), puis `setApiBaseUrl` + `setErrorReporter` (Sentry RN) + `setRoutingGoogleMapsKey`. Equivalent du `_bridge.ts` web. Style via NativeWind v4 + tokens `@taxilink/design-tokens`. Build via EAS (`eas.json` profils development/preview/production). Path alias : `@/*` → `apps/mobile-driver/src/*`.
- `packages/core` — Shared TypeScript types (`Driver`, `Mission`, `Agenda`, `Group`) and mock data (`mock/missions`, `mock/agenda`). Imported as `@taxilink/core`.
- `packages/design-tokens` — Tokens unifies cross-plateforme : `colors`, `shadows`, `borderRadius`, `fontFamily`, `fontSize`, `animation`, `keyframes`, `mobileFontFamily`. Importes par `apps/web/tailwind.config.ts` (Tailwind classique) ET par `apps/mobile-driver/tailwind.config.js` (NativeWind preset).
- `packages/supabase-types` — Types Supabase generes (`Database`, `Json`, types de tables `Driver`/`Mission`/etc.). Source unique pour web et mobile. `apps/web/src/lib/supabase/types.ts` re-exporte depuis ce package pour preserver les imports `@/lib/supabase/types`.
- `packages/services` — Services Supabase et API cross-platform avec injection client (`getSupabaseClient`/`setSupabaseClient`). 22 services migres en Phase 0 (auth, profile, driver, mission*, payment, voice*, routing*, etc.). Re-exports dans `apps/web/src/services/<name>.ts` via `bridgeService()` (Proxy) pour brancher le client web sur le singleton du package au premier appel — voir `apps/web/src/services/_bridge.ts`. Cote mobile, le bridge est dans `apps/mobile-driver/src/lib/init.ts` (eager au boot, pas lazy car pas de TDZ vitest a esquiver).
- `packages/stores` — 11 stores Zustand cross-platform (driverStore, missionStore, gpsStore, etc.). Persistence opt-in via `localStorage` (web) ou `@react-native-async-storage/async-storage` (mobile, a brancher via `createJSONStorage` dans le store consommateur).
- `packages/ui-mobile` — Composants RN partages entre apps/mobile-* (Button, Card, Sheet, Header, MapView…). **Squelette vide cree 2026-05-10**, populated incrementally pendant Phase 1. Suit la regle des 3 (cf. plus bas).
- `packages/ui` — `tokens.ts` legacy. **Plus aucun consommateur** depuis la migration vers `@taxilink/design-tokens`. Sera supprime ou repurpose (composants UI partages) en session future.

**Path alias**: `@/*` → `apps/web/src/*` (web) ou `apps/mobile-driver/src/*` (mobile, declare dans `apps/mobile-driver/tsconfig.json`)

### State: Zustand stores (`src/store/`)

Ten stores. Quatre core (data + flow principaux), six spécialisés (UI/preferences/notifications) :

**Core** :
- `driverStore` — driver profile, `isOnline`, today's stats. Has `load()`, `setOnline()`, `updateDriver()`, `incrementTodayStats()`. Calls `profileService` and `driverService`.
- `missionStore` — available missions + current mission. Has `load()`, `acceptMission()`, `completeMission()`, `dismissCurrentMission()`, `setSortField()`, `toggleSort()`. Exposes `useSortedMissions()` helper hook. Converts DB shape (`@/lib/supabase/types`) to app shape (`@taxilink/core`) via `toCoreMission()`.
- `missionEditStore` — signals an edit request for a posted mission. `DriverDashboard` observes `editing` and opens `PartagerMissionModal` in update mode.
- `postedAcceptStore` — unseen-acceptance notifications for missions the driver posted. Exposes `useUnseenAcceptCount()` badge hook.

**Spécialisés** :
- `gpsStore` — coordonnées GPS courantes du driver + précision (m). Alimenté par `useGlobalDriverGps`, consommé par tous les écrans qui calculent une distance pickup. Pas de persistance.
- `nightModeStore` — préférence mode nuit (`'auto' | 'on' | 'off'`, persisted). `'auto'` conservé pour deserialisation legacy mais traité comme `'off'`.
- `userPrefsStore` — préférences user persistées en BD (`popupNewMission`, `geolocPushEnabled`). `load()` synchronise depuis `userPrefsService`.
- `missionEditSheetStore` — bottom sheet ouverte pour éditer une mission existante (mode `'corrections' | 'price'`). Distinct de `missionEditStore` qui pilote `PartagerMissionModal`.
- `publishedFeedbackStore` — toast "Annonce publiée" affiché après création réussie d'une mission. `consume()` après affichage.
- `postedUntakenStore` — notifications "course pas prise" pour les annonces stuck (AVAILABLE > 2 min sans offre PENDING). Alimenté par `usePostedMissionUntakenNotifier`.

### Services (`src/services/`)

Thin wrappers around Supabase, internal `/api/*` routes, or external HTTP APIs. Components and hooks must never call Supabase directly — always go through a service. Services return typed data (`Driver`, `Mission`, etc. from `@taxilink/core`).

**Error handling convention**: Supabase-backed methods re-throw via `throw new Error(error.message)` on failure and return `data ?? []` / `data ?? null` on success. API-route methods let `ApiRequestError` bubble up from `api.post/get/...`. Consumers (hooks) wrap calls in `try/catch` and surface the message to the user via `useToasts()`.

Current services, grouped by domain:
- **Auth/profile**: `authService`, `profileService`, `driverService`, `userPrefsService`
- **Missions**: `missionService` (create POSTs `/api/missions` for server-side validation; other ops call Supabase), `missionGroupsService`, `paymentService`
- **Groups**: `groupService`, `groupStatsService`
- **Documents**: `documentService`
- **Addresses & routing**: `addressService`, `googlePlacesSearchService`, `googlePlaceDetailsService`, `routingService` (Google Maps / OSRM)
- **Voice**: `voiceParseService` (POSTs `/api/missions/parse-voice`), `voiceAnswerService` (POSTs `/api/missions/parse-voice-answer`)

### API client (`src/lib/api.ts`)

Centralized `fetch` wrapper for `/api/*` routes. Always use `api.get/post/patch/delete` — never raw `fetch` inside components. Errors surface as `ApiRequestError` (see `src/lib/api.types.ts`).

### Supabase clients

- **Browser**: `src/lib/supabase/client.ts` → `createBrowserClient()` (uses `NEXT_PUBLIC_*` env vars)
- **Server**: `src/lib/supabase/server.ts` → `createServerClient()` (handles cookies for SSR auth)
- **Types**: `src/lib/supabase/types.ts` — auto-generated from schema, represents DB shape (different from `@taxilink/core` types which are the app-level shape)

### Component convention: one responsibility per file

Every interactive component must extract its logic into a co-located hook:
- `ComponentName.tsx` → pure JSX only, calls `useComponentName()`
- `useComponentName.ts` → all `useState`, `useEffect`, handlers, service calls

The hook lives **in the same `components/` subdirectory** as its component (not in `src/hooks/`). `src/hooks/` is only for generic, reusable hooks (`useAuth`, `useToasts`, `useMissionRealtime`, `useDocumentUpload`, `useVoiceDictation`, `useWakeLock`, `useInstallPrompt`, `useNextMissionNotification`, `usePostedMissionAcceptNotifier`).

**Exemptions** — the co-located-hook rule does not apply to:
- **Orchestrators** — components whose body is *only* child composition + routing/tab state. They may keep a small `useState` for the active tab or a modal-open flag. Examples: [DriverDashboard.tsx](apps/web/src/components/dashboard/driver/DriverDashboard.tsx), [ClientDashboard.tsx](apps/web/src/components/dashboard/client/ClientDashboard.tsx), [DriverCoursesScreen.tsx](apps/web/src/components/dashboard/driver/DriverCoursesScreen.tsx). If an orchestrator starts doing fetches, form handling, or service calls, it stops being an orchestrator and the rule applies again.
- **Pure presentational components** — no state, no effects, props-only. Example: `RideBadge`, `DocCard`.
- **Tel/SMS link wrappers** — components using only `<a href="tel:...">` / `<a href="sms:...">`.

### Auth & routing

`src/middleware.ts` matches `/dashboard/:path*` and performs three checks:
1. **Unauthenticated** → redirect to `/auth/login?redirect=<pathname>`.
2. **Profile incomplete** (missing `first_name`, `last_name`, or `phone`) → redirect to `/auth/complete-profile?redirect=<pathname>`. This is required because Google OAuth never provides a phone number.
3. **Wrong role**: `driver` → `/dashboard/chauffeur`, `client` → `/dashboard/client`. Cross-role access is redirected, not 403.

`useAuth()` (`src/hooks/useAuth.ts`) subscribes to `onAuthStateChange` and is the canonical way to get the current user in client components.

### Real-time

`useMissionRealtime()` hook subscribes to Supabase real-time changes on the `missions` table. It receives `onInsert`/`onUpdate`/`onDelete` callbacks. `useDriverMissions` applies patch-diff updates to the local mission list (no full reload) — events outside the driver's `dept_preferences` are filtered client-side.

### Scoping géographique par département

Chaque mission porte un champ `departement` (colonne TEXT, cf. migration `20260423_mission_departement.sql`) calculé à partir du code postal de `departure` via [lib/departement.ts](apps/web/src/lib/departement.ts). Formats : `"01"`–`"95"` (sauf `"20"`), `"2A"`/`"2B"` pour la Corse, `"971"`–`"978"` pour les DROM-COM.

Chaque chauffeur déclare ses départements actifs de deux façons :
- **À l'inscription** (obligatoire) — [RegisterStep2](apps/web/src/components/auth/RegisterStep2.tsx) force le choix d'un département ; `authService.finalizeSignUp` seed `dept_preferences: [department]`.
- **Après coup** via [DeptPreferencesCard](apps/web/src/components/dashboard/driver/profil/DeptPreferencesCard.tsx) dans le profil pour en ajouter/retirer.

Stockage : `auth.users.raw_user_meta_data.dept_preferences: string[]`. `missionQueries.getAvailable(departments?)` filtre côté serveur via `.in('departement', ...)` si la liste est non vide ; sinon aucun filtre (fallback legacy « vois tout », gardé pour les comptes créés avant cette feature).

## Design system

Tous les tokens Tailwind viennent de `@taxilink/design-tokens` (un seul package, cross-platform web + mobile a venir). `apps/web/tailwind.config.ts` importe `colors`, `shadows`, `borderRadius`, `fontFamily`, `fontSize`, `animation`, `keyframes` et les passe au theme.extend tels quels.

**Colors**:
- Dashboard (legacy, kept): `primary` = `#FFD23F` (yellow), `secondary` = `#1A1A1A`, `accent` = `#3B82F6`, `bgsoft`, `line`, `muted`.
- Landing/refonte: `ink` (#000), `paper` (#FFF), `brand` / `brand.soft`, `warm.50→800` (beige scale), `danger` / `danger.soft`.

**Typography**:
- `font-sans` → Inter (via `--font-inter`).
- `font-serif` → Instrument Serif (via `--font-serif`). **Reserved for landing/refonte surfaces**; the driver dashboard must stay in Inter on logo, titles, prices, stats (hierarchy by weight, not family).
- `text-display-xl/lg/md/sm` for hero-sized headings.

**Shadows**: `soft`, `card`, `button`, `fab`, `fab-hover`, `subtle`, `float`, `toast`.

**Border radii**: `2xl` (16px), `3xl` (20px), `4xl` (32px).

**Animations/keyframes**: `gradient-shift`, `status-pulse`, `slide-up`, `fade-in`, `float-a…d`, `mic-pulse`, `mic-ring`, `voice-bar`, `pop-in`.

**Icons**: Material Symbols loaded via `globals.css`, rendered through `<Icon name="..." />` ([src/components/ui/Icon.tsx](apps/web/src/components/ui/Icon.tsx)).

## Environment

Required in `apps/web/.env.local` for full functionality:
```
# Supabase (required everywhere)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Address autocomplete + routing (optional — fallbacks to OSRM/OSM when absent)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=

# Voice parsing (server-side API routes)
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

# Dashboard admin (Phase 1 — /dashboard/admin)
ADMIN_EMAIL=                       # email du compte autorisé
SUPABASE_SERVICE_ROLE_KEY=         # bypass RLS pour /api/admin/* uniquement, NE PAS exposer côté client

# Error monitoring (optional; @sentry/nextjs is wired via src/instrumentation.ts)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## Règles de qualité du code

### Taille des fichiers — seuils maximum
Au-delà du seuil, le fichier doit être découpé sans exception.

| Type                      | Idéal         | Maximum |
|---------------------------|---------------|---------|
| Composant (.tsx)          | 50–100 lignes | 200     |
| Page (app/**/page.tsx)    | 80–150 lignes | 200     |
| Hook (use*.ts)            | 30–80 lignes  | 150     |
| Service (*Service.ts)     | 40–100 lignes | 150     |
| Store (*Store.ts)         | 50–100 lignes | 200     |
| Utilitaire (utils/, lib/) | 20–50 lignes  | 100     |

Test du "et" : si tu ne peux pas décrire ce que fait un fichier
en une phrase sans utiliser le mot "et", il fait trop de choses.

**Enforcé automatiquement** par [src/__tests__/fileSize.test.ts](apps/web/src/__tests__/fileSize.test.ts) — tout PR qui dépasse un seuil fait échouer `npm run test`. Seule exception tolérée : fichiers auto-générés listés dans la constante `EXCLUDED` du test (actuellement `lib/supabase/types.ts`).

### Conventions de nommage
- Composant    : PascalCase            → MissionCard.tsx
- Hook         : camelCase + use       → useMissionCard.ts
- Service      : camelCase + Service   → missionService.ts
- Store        : camelCase + Store     → missionStore.ts
- Page         : page.tsx (Next.js App Router convention)
- Utilitaire   : camelCase descriptif  → formatDate.ts, calculateFare.ts

Interdit : utils2.ts, helpers.ts, stuff.ts, temp.ts, misc.ts
Un nom de fichier doit dire exactement ce qu'il contient.

### Règle des 3
Si un bloc de code apparaît à 3 endroits ou plus :
- C'est un composant → créer dans components/
- C'est une fonction → créer dans utils/
- C'est de la logique → créer un hook dans le même dossier

### Séparation des couches — rappel des interdictions
- Jamais de fetch() ou appel Supabase direct dans un composant .tsx
- Jamais de logique métier (calculs, règles) dans un fichier de style
- Jamais d'état global dans un composant local
- Toujours : composant → hook co-localisé → service → Supabase

### Avant chaque modification de fichier
1. Compter les lignes du fichier cible
2. Si le fichier dépasse son seuil après modification → proposer un découpage
3. Vérifier que la modification respecte la séparation des couches
4. Vérifier que le nommage suit les conventions ci-dessus

### Tests
- Tout hook ou service modifié doit avoir un test correspondant dans `*.test.ts` (voir `apps/web/src/__tests__/`)
- Lancer `npm run test` après chaque modification pour vérifier qu'aucun test existant ne casse
- Couverture cible : 80% sur les services et les hooks
