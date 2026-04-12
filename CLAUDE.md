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

# From apps/web
npm run dev          # next dev --port 3000
npm run test         # vitest run (single run)
npm run test:watch   # vitest (interactive)
npm run type-check   # tsc --noEmit
```

## Architecture

**Monorepo** (npm workspaces + Turbo):
- `apps/web` — Next.js 14 App Router, the entire product
- `packages/core` — Shared TypeScript types (`Driver`, `Mission`, `MissionType`, `MissionStatus`) and mock data
- `packages/ui` — Design tokens (colors, shadows, border radii) — single source of truth for the design system

**Path alias**: `@/*` → `apps/web/src/*`

### State: Zustand stores (`src/store/`)

Four stores. Two are data-heavy:
- `driverStore` — driver profile, `isOnline`, today's stats. Has `load()`, `setOnline()`, `updateDriver()`, `incrementTodayStats()`. Calls `profileService` and `driverService`.
- `missionStore` — available missions + current mission. Has `load()`, `acceptMission()`, `completeMission()`, `toggleSort()`. Exposes `useSortedMissions()` helper hook.

Two are UI-only:
- `modalStore` — which modal is open
- `navStore` — active navigation tab

### Services (`src/services/`)

Thin wrappers around Supabase + the internal API. Components and hooks must never call Supabase directly — always go through a service. Services return typed data (`Driver`, `Mission`, etc. from `packages/core`).

For mission creation, `missionService.create()` POSTs to `/api/missions` (server-side validation). All other mission ops call Supabase directly.

### API client (`src/lib/api.ts`)

Centralized `fetch` wrapper for `/api/*` routes. Always use `api.get/post/patch/delete` — never raw `fetch` inside components.

### Supabase clients

- **Browser**: `src/lib/supabase/client.ts` → `createBrowserClient()` (uses `NEXT_PUBLIC_*` env vars)
- **Server**: `src/lib/supabase/server.ts` → `createServerClient()` (handles cookies for SSR auth)
- **Types**: `src/lib/supabase/types.ts` — auto-generated from schema, represents DB shape (different from `@taxilink/core` types which are the app-level shape)

### Component convention: one responsibility per file

Every interactive component must extract its logic into a co-located hook:
- `ComponentName.tsx` → pure JSX only, calls `useComponentName()`
- `useComponentName.ts` → all `useState`, `useEffect`, handlers, service calls

The hook lives **in the same `components/` subdirectory** as its component (not in `src/hooks/`). `src/hooks/` is only for generic, reusable hooks (`useAuth`, `useToasts`, `useMissionRealtime`, `useDocumentUpload`).

Layout orchestrators (components whose only job is composing child components) and components using only plain `<a href="tel:...">` / `<a href="sms:...">` links are exempt from this rule.

### Auth & routing

`src/middleware.ts` protects `/dashboard/*` — unauthenticated users are redirected to `/auth/login`. Role-based redirect: `driver` → `/dashboard/chauffeur`, `client` → `/dashboard/client`.

`useAuth()` hook (`src/hooks/useAuth.ts`) subscribes to `onAuthStateChange` and is the canonical way to get the current user in client components.

### Real-time

`useMissionRealtime()` hook subscribes to Supabase real-time changes on the `missions` table. It receives `onInsert` and `onUpdate` callbacks. Used in `useDriverMissions` to push toast notifications and reload the mission list.

## Design system

Tailwind custom tokens (defined in `tailwind.config.ts`):
- `primary` = `#FFD23F` (yellow), `secondary` = `#1A1A1A` (near-black), `accent` = `#3B82F6` (blue)
- `bgsoft`, `line`, `muted` for subtle backgrounds/borders/text
- Custom border radii: `2xl` (16px), `3xl` (20px), `4xl` (32px)
- Icons: Material Symbols loaded via Google Fonts; rendered through `<Icon name="..." />` component

## Environment

Required in `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
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
| Utilitaire (utils/)       | 20–50 lignes  | 100     |

Test du "et" : si tu ne peux pas décrire ce que fait un fichier
en une phrase sans utiliser le mot "et", il fait trop de choses.

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
- Tout hook ou service modifié doit avoir un test correspondant dans `*.test.ts`
- Lancer `npm run test` après chaque modification pour vérifier qu'aucun test existant ne casse
- Couverture cible : 80% sur les services et les hooks
