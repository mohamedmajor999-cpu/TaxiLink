# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# From repo root (Turbo orchestration)
npm run dev          # Start all apps in dev mode
npm run web          # Start only apps/web (port 3000)
npm run build        # Build all packages (turbo build)
npm run lint         # Lint all packages
npm run type-check   # TypeScript check across all packages
npm run test         # Run web test suite (turbo test --filter=web)

# From apps/web
npm run dev          # next dev --port 3000
npm run test         # vitest run (single run)
npm run test:watch   # vitest (interactive)
npm run type-check   # tsc --noEmit

# From any apps/mobile-driver* (v1, v2, v3) — Expo SDK 54
npm run dev          # expo start (Metro). v1 : QR Expo Go OK. v2/v3 : INCOMPATIBLES Expo Go
                     #   (Mapbox natif, google-signin, expo-location background, task-manager) →
                     #   build dev client requis : eas build --profile development, puis expo start --dev-client
npm run android      # expo run:android
npm run ios          # expo run:ios
npm run type-check   # tsc --noEmit

# EAS builds — uniquement v1 a des scripts npm. Pour v2/v3, lancer directement :
cd apps/mobile-driver-v3
npx eas build --profile preview    --platform android   # APK signe, distribution interne
npx eas build --profile development --platform android  # dev client (hot-reload)
npx eas build --profile production  --platform android  # AAB pour Play Store
# IMPORTANT : ne JAMAIS lancer un eas build sans autorisation explicite du user.
```

## Architecture

**Monorepo** (npm workspaces + Turbo) :
- `apps/web` — Next.js 14.2 (App Router). Tout le produit web : landing, dashboards driver/client/patron/admin, API routes `/api/*`. Path alias `@/* → apps/web/src/*`.
- `apps/mobile-driver` — Expo SDK 54 + Expo Router 6. **POC initial 2026-05-10, plus actif** ; sert de référence historique uniquement.
- `apps/mobile-driver-v2` — **Prod active** (APK chauffeur en utilisation). Rewrite propre en SDK 54, tracking GPS V8 HyperSense, notifications 3 channels.
- `apps/mobile-driver-v3` — **Redesign V7** (depuis 2026-05-15). Copie de v2 + BottomNav permanente + Mapbox natif + dark mode Tesla. Feature-complete (auth + dashboard chauffeur complets, GPS V8, push 3 channels, suite Vitest) ; **NON compatible Expo Go** (dev client requis).
- `packages/core` — Types TypeScript partages (`Driver`, `Mission`, `Agenda`, `Group`), helpers de calcul (`computeDisplayFare`, `departement`), mock data. Importe via `@taxilink/core`.
- `packages/design-tokens` — Tokens unifies cross-plateforme (`colors`, `shadows`, `borderRadius`, `fontFamily`, `fontSize`, `animation`, `keyframes`, `mobileFontFamily`). Importes par `apps/web/tailwind.config.ts` ET par chaque `apps/mobile-driver*/tailwind.config.js` (NativeWind preset).
- `packages/supabase-types` — Types Supabase generes (`Database`, `Json`, types de tables `Driver`/`Mission`/etc.). Source unique pour web et mobile. `apps/web/src/lib/supabase/types.ts` re-exporte depuis ce package.
- `packages/services` — Services Supabase et API cross-platform avec injection de client (`getSupabaseClient`/`setSupabaseClient`). **~27 services** + helpers. Re-exports dans `apps/web/src/services/*.ts` via `bridgeService()` (Proxy) pour brancher le client web au premier appel — voir `apps/web/src/services/_bridge.ts`. Cote mobile, le bridge est dans `apps/mobile-driver*/src/lib/init.ts` (eager au boot).
- `packages/stores` — **11 stores Zustand** cross-platform. Persistence opt-in via `localStorage` (web) ou `AsyncStorage` (mobile, branche via `setPersistStorage()` dans `initApp()`).
- `packages/ui-mobile` — Composants RN partages entre `apps/mobile-driver*`. **Squelette vide** (cf. `src/index.ts`), populated incrementally selon la regle des 3. Composants planifies : Button, Card, Sheet, TextInput, Icon, Toast, Badge, Avatar, Chip, EmptyState, Loader, MapView, BottomBar, Header, MissionRow.
- `packages/ui` — `tokens.ts` legacy. **Plus aucun consommateur** depuis la migration vers `@taxilink/design-tokens`.

**Path alias** : `@/*` → `apps/web/src/*` (web) ou `apps/mobile-driver{,-v2,-v3}/src/*` (mobile, declare dans chaque `tsconfig.json`).

### State: Zustand stores

11 stores dans `packages/stores/src/`, re-exportes via `@taxilink/stores` et utilises identiquement par web (`apps/web/src/store/*` = re-export) et mobile.

**Core** :
- `driverStore` — driver profile, `isOnline`, today's stats. `load()`, `setOnline()`, `updateDriver()`, `incrementTodayStats()`, `signOut()`. Calls `profileService` + `driverService` + `authService`.
- `missionStore` — available missions + current mission. `load()`, `acceptMission()`, `completeMission()`, `dismissCurrentMission()`, `setSortField()`, `toggleSort()`. Helper `useSortedMissions()`. Convertit DB shape vers `@taxilink/core` shape via `toCoreMission()`.
- `missionEditStore` — signale une edition de mission (declenche `PartagerMissionModal` en mode update).
- `postedAcceptStore` — notifications "annonce acceptee" non vues, persistees. Badge `useUnseenAcceptCount()`.

**Spécialisés** :
- `gpsStore` — coords GPS courantes + precision + flag `isBackgroundActive`. Coords persistees (cold-start centre la carte sur derniere position).
- `nightModeStore` — preference mode nuit (`'auto' | 'on' | 'off'`, persistee).
- `userPrefsStore` — preferences user persistees en BD (`popupNewMission`, `geolocPushEnabled`). `load()` sync depuis `userPrefsService`.
- `missionEditSheetStore` — bottom sheet d'edition de mission (`'corrections' | 'price'`). Distinct de `missionEditStore`.
- `publishedFeedbackStore` — toast "Annonce publiee" apres creation.
- `postedUntakenStore` — notifications "course pas prise" pour annonces stuck (AVAILABLE > 2 min). Alimenté par `usePostedMissionUntakenNotifier`.
- `driverAgendaStore` — agenda du chauffeur (creneaux planifies, vue calendrier).

### Services (`packages/services/src/`)

Thin wrappers autour de Supabase, des routes `/api/*` internes, ou des APIs HTTP externes. **Les composants et hooks ne doivent jamais appeler Supabase directement** — toujours passer par un service.

**Convention erreurs** : methodes Supabase re-throw via `throw new Error(error.message)` et retournent `data ?? []` / `data ?? null`. Methodes API laissent `ApiRequestError` bubble up. Consumers (hooks) wrap dans `try/catch` et surfacent via `useToasts()`.

Services groupes par domaine :
- **Auth / profile** : `authService`, `profileService`, `driverService`, `userPrefsService`, `driverBlockService`
- **Missions** : `missionService`, `missionMutations`, `missionQueries`, `missionCorrectionService`, `missionManualService`, `missionOfferService`, `missionProgressMutations`, `missionGroupsService`, `untakenMissionService`, `paymentService`, `earningsService`
- **Groups** : `groupService`, `groupStatsService` (+ `groupStatsService.helpers`)
- **Documents** : `documentService`
- **Addresses & routing** : `addressService`, `googlePlacesSearchService`, `googlePlaceDetailsService`, `routingService` (Google Maps / OSRM), `knownPlacesMarseille`
- **Voice (mobile + web)** : `voiceParseService` (POSTs `/api/missions/parse-voice`), `voiceAnswerService` (POSTs `/api/missions/parse-voice-answer`), `transcribeService` (Whisper standalone)
- **Push (mobile)** : `pushTokenService` (Expo Push tokens, table `push_tokens`)

**Services web-only** (dans `apps/web/src/services/`, non bridges) : `adminAnalyticsService`, `adminModerationService`, `organizationService`, `publicMissionService`, `userRgpdService`, `missionViewsService`, `groupActivityService`, et toute la famille `patron*Service` (`patronAgendaService`, `patronCoursesService`, `patronDriverDetailService`, `patronFinancesService`, `patronFleetService`, `patronMarketplaceService`, `patronOverviewService`).

### API client (`apps/web/src/lib/api.ts`)

Wrapper `fetch` centralise pour `/api/*`. Toujours `api.get/post/patch/delete` — jamais `fetch` direct dans un composant. Erreurs : `ApiRequestError` (cf. `api.types.ts`).

### Supabase

- **Browser client** : `apps/web/src/lib/supabase/client.ts` → `createBrowserClient()`
- **Server client** : `apps/web/src/lib/supabase/server.ts` → `createServerSupabaseClient()` (cookies SSR)
- **Admin (service role)** : `apps/web/src/lib/supabase/admin.ts` — bypass RLS pour `/api/admin/*`
- **Types** : `apps/web/src/lib/supabase/types.ts` (re-export de `@taxilink/supabase-types`)
- **Mobile client** : chaque app mobile a son `src/lib/supabase.ts` avec `createMobileSupabaseClient()`. Storage de session : `expo-secure-store` sur v1 (legacy), mais **AsyncStorage sur v2/v3** — choix délibéré : le keystore SecureStore (~2 Ko) perdait les sessions à `user_metadata` enrichi (cf. commentaire dans `supabase.ts`). SecureStore n'y sert plus que pour `courseState` (petite valeur). **Ne PAS « corriger » v2/v3 vers SecureStore** (réintroduit le bug de perte de session).

### Backend Supabase (`apps/web/supabase/`)

- `migrations/` — SQL versionne (80+ fichiers, format `YYYYMMDD_description.sql`). Modifie via le Supabase MCP (`mcp__claude_ai_Supabase__apply_migration`) plutot que copier-coller dans le dashboard.
- `functions/` — Edge functions Deno :
  - `dispatch_mission` — cascade d'offres aux drivers (3 → 6 → 12 → 20 → 30 km, 20s par palier)
  - `notify_drivers_new_mission` — push FCM/APNs sur une nouvelle annonce
  - `notify_poster_mission_accepted` — notif au poster quand sa course est acceptee
  - `google-cache` — proxy Google Places / Routes avec cache Postgres partage (1 appel Google pour N drivers tapant la meme adresse)

### Component convention : one responsibility per file

Tout composant interactif extrait sa logique dans un hook co-localise :
- `ComponentName.tsx` → JSX pur, appelle `useComponentName()`
- `useComponentName.ts` → tout `useState`, `useEffect`, handlers, appels service

Le hook vit **dans le meme dossier `components/`** que son composant, pas dans `src/hooks/`. `src/hooks/` (inventaire **web** ci-dessous ; la v3 mobile a son propre `src/hooks/` : `useDriverGpsTracking`, `useDriverOnlineTracking`, `useDriverHeartbeat`, `useDriverMissions`, `useMissionRealtime`, `useIncomingMissionOffer`, `useNewMissionAlert`, etc.) contient uniquement les hooks generiques reutilisables : `useAuth`, `useToasts`, `useMissionRealtime`, `useDocumentUpload`, `useVoiceDictation`, `useWakeLock`, `useInstallPrompt`, `useAudioRecorder`, `useAutoMissionProgress`, `useCurrentOrg`, `useDeptPreferences`, `useDriverHeartbeat`, `useDriverPositionPush`, `useDriverPrimaryGroupName`, `useGlobalDriverGps`, `useIncomingMissionOffer`, `useMissionProgressActions`, `useNightMode`, `useNotificationPermission`, `useOrgRealtimeRefresh`, `usePostedMissionAcceptNotifier`, `usePostedMissionUntakenNotifier`.

**Exemptions** :
- **Orchestrateurs** — composants dont le body est purement composition + routing/tab state. Peuvent garder un `useState` pour l'onglet actif ou un flag modal-open. Exemples : `DriverDashboard.tsx`, `ClientDashboard.tsx`, `DriverCoursesScreen.tsx`. Si l'orchestrateur commence a faire des fetches ou appels services, la regle se reapplique.
- **Composants purement presentationnels** — pas de state, pas d'effets, props uniquement. Exemple : `RideBadge`, `DocCard`.
- **Wrappers tel/SMS** — composants utilisant uniquement `<a href="tel:...">` / `<a href="sms:...">`.

### Auth & routing

`apps/web/src/middleware.ts` matche `/dashboard/:path*`. **Depuis migration 20260501**, le middleware lit les claims JWT (`profile_complete`, `role`) en local (~1ms) au lieu d'une requete Supabase par navigation. Le trigger `sync_profile_claims_to_auth` seed ces claims dans `auth.users.raw_app_meta_data`. Fallback DB pour les sessions emises avant la migration.

Trois checks :
1. **Non authentifie** → redirect `/auth/login?redirect=<pathname>`.
2. **Profil incomplet** (missing `first_name`, `last_name`, ou `phone`) → redirect `/auth/complete-profile?redirect=<pathname>`. Necessaire car Google OAuth ne fournit jamais de telephone.
3. **Mauvais role** : `driver` → `/dashboard/chauffeur`, `client` → `/dashboard/client`, `patron` → `/dashboard/patron`, `admin` → `/dashboard/admin`. Cross-role redirige, pas 403.

`useAuth()` (`apps/web/src/hooks/useAuth.ts`) souscrit a `onAuthStateChange` — way canonique d'avoir le user courant en client component.

> **Mobile (v2/v3)** : `useAuth` (`src/hooks/useAuth.ts`) utilise `getSession()` (lecture du storage local, **sans réseau**) et **non** `getUser()` — un `getUser()` réseau timeoutait au cold-start sur réseau lent → redirect `/login` à tort. L'auto-refresh est gaté sur `AppState === 'active'`. Ne pas repasser en `getUser()`.

### Real-time

**Web** — `useMissionRealtime()` souscrit a Supabase real-time sur la table `missions` (callbacks `onInsert`/`onUpdate`/`onDelete`). `useDriverMissions` applique patch-diff (pas de full reload). Filtre client-side hors `dept_preferences` du chauffeur.

**Mobile v2/v3** — `MissionRealtimeProvider` (1 paire de channels pour toute la session) :
- `missions-realtime` (broadcast trigger Postgres `broadcast_mission_event` sur INSERT/UPDATE/DELETE)
- `mission-events` (broadcast 'accepted')
- `useIncomingMissionOffer` souscrit a `postgres_changes` sur `mission_offers` filtre `driver_id=eq.${driverId}` pour les offres directes de la cascade `dispatch_mission`.

### Voice (stack OpenAI)

Tout le voice passe par OpenAI :
- **Transcription** : Whisper via `apps/web/src/lib/openai/transcribe.ts`
- **Parsing intent** : GPT-4o-mini via `apps/web/src/lib/openai/chat.ts` avec garde-fous anti-hallucination (`whisperHallucinations.ts`)
- Routes API : `/api/missions/transcribe`, `/api/missions/parse-voice`, `/api/missions/parse-voice-answer`
- Cle requise : `OPENAI_API_KEY` (server-side uniquement).

### Scoping géographique par département

Chaque mission porte un champ `departement` (TEXT, migration `20260423_mission_departement.sql`) calcule depuis le code postal de `departure` via `lib/departement.ts`. Formats : `"01"`–`"95"` (sauf `"20"`), `"2A"`/`"2B"` pour la Corse, `"971"`–`"978"` pour les DROM-COM.

Chauffeur declare ses departements :
- **A l'inscription** (obligatoire) — `RegisterStep2.tsx` ; `authService.finalizeSignUp` seed `dept_preferences: [department]`.
- **Apres coup** via `DeptPreferencesCard.tsx` dans le profil.

Stockage : `auth.users.raw_user_meta_data.dept_preferences: string[]`. `missionQueries.getAvailable(departments?)` filtre serveur via `.in('departement', ...)` si liste non vide ; sinon aucun filtre (fallback legacy « vois tout »).

## Design system

Tokens Tailwind centralises dans `@taxilink/design-tokens`, consommes :
- **Web** : `apps/web/tailwind.config.ts` importe `colors`, `shadows`, `borderRadius`, `fontFamily`, `fontSize`, `animation`, `keyframes` et les passe a `theme.extend`.
- **Mobile (v2/v3)** : chaque `apps/mobile-driver*/tailwind.config.js` consomme le meme package via NativeWind v4 preset. Classes utility identiques (`bg-bgsoft`, `text-ink`, etc.).

**Colors**:
- Dashboard (legacy, kept) : `primary` = `#FFD23F` (jaune), `secondary` = `#1A1A1A`, `accent` = `#3B82F6`, `bgsoft`, `line`, `muted`.
- Landing/refonte : `ink` (#000), `paper` (#FFF), `brand` / `brand.soft`, `warm.50→800` (beige scale), `danger` / `danger.soft`.

**Typography** :
- `font-sans` → Inter (via `--font-inter`).
- `font-serif` → Instrument Serif (via `--font-serif`). **Reserve aux surfaces landing/refonte** ; le dashboard chauffeur reste Inter (logo, titres, prix, stats).
- `text-display-xl/lg/md/sm` pour les headings hero.

**Shadows** : `soft`, `card`, `button`, `fab`, `fab-hover`, `subtle`, `float`, `toast`.
**Border radii** : `2xl` (16px), `3xl` (20px), `4xl` (32px).
**Animations / keyframes** : `gradient-shift`, `status-pulse`, `slide-up`, `fade-in`, `float-a…d`, `mic-pulse`, `mic-ring`, `voice-bar`, `pop-in`.

**Icons** : Web → Material Symbols via `globals.css`, rendus par `<Icon name="..." />` (`apps/web/src/components/ui/Icon.tsx`). Mobile v3 → set custom dans `apps/mobile-driver-v3/src/components/icons/Icon.tsx` (pas de `@expo/vector-icons` pour eviter l'embarquement de families completes dans l'APK).

## Environment

`apps/web/.env.local` :
```
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Maps & routing (optional — fallback OSRM/OSM)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=

# Voice (server-side, route /api/missions/parse-voice + transcribe)
OPENAI_API_KEY=

# Admin dashboard (Phase 1 — /dashboard/admin)
ADMIN_EMAIL=
SUPABASE_SERVICE_ROLE_KEY=     # bypass RLS pour /api/admin/* UNIQUEMENT, JAMAIS cote client

# Sentry (optional)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

**Mobile (v2/v3)** : les vars `EXPO_PUBLIC_*` sont définies (a) en dev local dans `apps/mobile-driver-v3/.env.local` (gitignored) et (b) pour les builds dans `eas.json` par profile (development / preview / production — actuellement valeurs **identiques**, même projet Supabase ; pas de séparation staging, cf. audit L-14). Clés attendues : `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (clé publishable, publique par design), `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_MAPBOX_TOKEN` (token **public** `pk.*`), `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Le rendu Mapbox runtime n'a besoin que du `pk.*`.

> ⚠️ **Token Mapbox secret `sk.*`** (téléchargement du SDK natif au moment du build) : il **devrait** être un EAS secret `RNMAPBOX_DOWNLOAD_TOKEN` injecté via un `app.config.js`, **mais ce mécanisme n'est PAS en place** — `app.config.js` n'existe pas et `app.json` configure `@rnmapbox/maps` sans options. TODO ouvert : révoquer le `sk.*` fuité + créer l'EAS secret avant le prochain build. Aucun `sk.*` n'est committé aujourd'hui.

> **Compte EAS** : owner `mamo999`, projectId v3 `30d6fc7d-e0db-42e3-9ecc-bfc7489e1d9a`. Nouveau keystore depuis 2026-05-25 → désinstaller l'ancien APK avant d'installer un nouveau build.

## Quirks démarrage mobile (Windows)

Avant le premier `npm run dev` d'une app mobile :
- **Node 22 requis** (Node 20 echoue sur certaines deps RN 0.81).
- **Junction PowerShell** vers `node_modules/@expo` du root vers l'app (hoisting workspace casse l'autolinking Expo).
- **Junction `async-storage`** vers `node_modules/@react-native-async-storage/async-storage` (a refaire apres chaque `npm install`).
- `async-limiter` en optional dependency.
- `EXPO_OFFLINE=1` parfois necessaire si le tunnel Expo plante.

(Voir memoires `project-mobile-driver-setup-quirks` et `project-mobile-driver-v2-async-storage-junction` pour les commandes exactes.)

---

## Règles de qualité du code

### Taille des fichiers — seuils maximum

| Type                      | Idéal         | Maximum |
|---------------------------|---------------|---------|
| Composant (.tsx)          | 50–100 lignes | 200     |
| Page (app/**/page.tsx)    | 80–150 lignes | 200     |
| Hook (use*.ts)            | 30–80 lignes  | 150     |
| Service (*Service.ts)     | 40–100 lignes | 150     |
| Store (*Store.ts)         | 50–100 lignes | 200     |
| Utilitaire (utils/, lib/) | 20–50 lignes  | 100     |

Test du "et" : si tu ne peux pas decrire ce que fait un fichier en une phrase sans utiliser le mot "et", il fait trop de choses.

**Enforcement automatique** : `apps/web/src/__tests__/fileSize.test.ts` fait echouer `npm run test` si un fichier sous `apps/web/src/` depasse son seuil. Exclusion : fichiers auto-generes listes dans la constante `EXCLUDED` (`lib/supabase/types.ts`).

⚠️ **L'enforcement ne couvre PAS les apps mobile ni les packages**. Les seuils restent la regle, mais a respecter manuellement cote mobile-driver* et packages/*.

### Conventions de nommage
- Composant    : PascalCase            → MissionCard.tsx
- Hook         : camelCase + use       → useMissionCard.ts
- Service      : camelCase + Service   → missionService.ts
- Store        : camelCase + Store     → missionStore.ts
- Page         : page.tsx (Next.js App Router convention)
- Utilitaire   : camelCase descriptif  → formatDate.ts, calculateFare.ts

Interdit : utils2.ts, helpers.ts, stuff.ts, temp.ts, misc.ts. Un nom de fichier doit dire exactement ce qu'il contient.

### Règle des 3
Si un bloc de code apparait a 3 endroits ou plus :
- C'est un composant → creer dans `components/`
- C'est une fonction → creer dans `utils/` (ou `packages/core` si cross-app)
- C'est de la logique → creer un hook dans le meme dossier

### Séparation des couches — interdictions
- Jamais de `fetch()` ou appel Supabase direct dans un `.tsx`
- Jamais de logique metier (calculs, regles) dans un fichier de style
- Jamais d'etat global dans un composant local
- Toujours : composant → hook co-localise → service → Supabase

### Avant chaque modification de fichier
1. Compter les lignes du fichier cible
2. Si depasse le seuil apres modification → proposer un decoupage
3. Verifier que la modification respecte la separation des couches
4. Verifier que le nommage suit les conventions

### Règles mobile spécifiques

**Tracking GPS, online state, heartbeat → toujours dans `(driver)/_layout.tsx`**, jamais dans un ecran feuille. La BottomNav v3 demonte les ecrans a chaque clic d'onglet ; si `useDriverOnlineTracking` / `useDriverHeartbeat` vivent sur la home, le foregroundService GPS et le ping `last_seen_at` tombent toutes les ~30s → DB marque le chauffeur offline en 3 min → plus d'offres. L'etat partage (`isOnline`, `courseState`) vit dans `src/lib/driverOnlineStore.ts`.

**Pas de `<UserLocation />` Mapbox** quand `useDriverGpsTracking` (expo-location foregroundService) tourne deja → 2 radios GPS en parallele = drain batterie + jitter coords.

### Tests
- Web : `npm run test` (vitest), declenche aussi `fileSize.test.ts`.
- Hooks et services modifies devraient avoir un test correspondant dans `apps/web/src/__tests__/`.
- Cible : 80% sur services et hooks (non enforced).
- Mobile (v3) : suite **Vitest** sur les fonctions pures — `npm run test` dans `apps/mobile-driver-v3` (~84 tests, 6 fichiers : `trackingConfig`, `driverOnlineStore`, `missionDetailHelpers`, `fares`, `boundedSet`, `posterFormUtils`). Pas de tests de composants/hooks RN ; validation UI par dev client + APK preview. La tarification (`@taxilink/core` : CPAM/Marseille/ZUPC) est désormais couverte par `fares.test.ts` (audit M-07 résolu).

### Git / déploiement
- Ne JAMAIS pousser sur `main` ou ouvrir une PR sans demande explicite.
- Ne JAMAIS lancer un `eas build` sans autorisation explicite — l'autorisation passee ne vaut PAS pour les suivants.
- Migrations Supabase : utiliser le MCP (`mcp__claude_ai_Supabase__apply_migration`) plutot que le dashboard.
