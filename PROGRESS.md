# PROGRESS.md

Suivi de l'avancement du projet TaxiLink Pro.

---

## ✅ Terminé

### Landing page (`/`) — refonte complète 2026-04-21
- Nouveaux composants : `LandingNav` · `HeroSection` + `HeroFloatingCards` + `HeroPhoneMockup` · `ProblemSolutionSection` + `ProblemWhatsappCard` + `SolutionTaxilinkCard` · `FeaturesSection` · `PricingSection` · `FaqSection` · `LandingFooter`
- Design system landing : tokens `ink`/`paper`/`brand`/`warm-*`/`danger` ajoutés dans `tailwind.config.ts` · Inter uniquement
- Logo `logo-with-tagline.svg` (nav 64px · footer 80px) · 11 SVG brand assets sauvegardés dans `public/brand/` + README
- Animations hero : 4 flottements déphasés (`float-a/b/c/d` 6–8s) · micro pulsant avec onde (`mic-pulse` + `mic-ring`) · barres vocales animées (`voice-bar` scaleY) · check notification `pop-in`
- Metadata : « Fini WhatsApp. Échangez vos courses entre chauffeurs. »
- **Nettoyage** : 18 fichiers orphelins supprimés (ancienne landing v1 : `Hero`, `HeroText`, `HeroMockup`, `Features`, `HowItWorks`, `Stats`, `Testimonials`, `CtaSection`, `DownloadSection`, `GratuitSection`, `PatronSection`, `PhoneMockup`, `ProblemeSection` + son hook et test, `TestimonialSection`, `HowItWorksSection`)

### Onboarding (`/onboarding`)
Header fixe · 4 sections (problème / chauffeurs / patrons / CTA) · Bouton fixe scroll · `useOnboardingPage` (IntersectionObserver)

### Dashboard chauffeur
- **Écrans** : AgendaScreen · HistoriqueScreen · PaiementsModal · SecuriteModal (re-auth password) · NotificationsModal (prefs user metadata)
- **PartagerMissionModal** (2026-04-20) :
  - Google Places API (New) — `searchGoogle()` + `resolveGooglePlace()` avec FieldMask · label enrichi post-sélection · `AddressSuggestion.mainText` + `placeId`
  - Google Routes API (`TRAFFIC_AWARE` + `departureTime`) avec fallback OSRM — `computeRouteGoogle()`
  - Tarif Marseille : A=1,11 / B=1,44 / C=2,22 / D=2,88 · horaire=34,60 · min=8,00 · marche lente pondérée 60% · switch via `ReturnEmptyField` (affiché si type=PRIVE)
  - `RouteInfoDisplay.tsx` extrait pour respecter seuil 200 lignes

### Navbar mobile
`grid-cols-5` (5 items) · bouton FAB `w-16 h-16` avec `-translate-y-5` · icône 32px

### Auth & inscription
- Middleware redirect par rôle (driver → `/dashboard/chauffeur` · client → `/dashboard/client`)
- Inscription 2 étapes (`RegisterStep1` email/password/Google · `RegisterStep2` nom/prénom/téléphone/dpt)
- Triggers Supabase `handle_new_user` + `create_driver_on_profile` avec `SECURITY DEFINER` · champs `phone` et `pro_number` propagés depuis `raw_user_meta_data`
- `authService` split → `userPrefsService` (notif prefs) extrait

### Groupes
- `GroupMemberStats` dans `@taxilink/core`
- `groupStatsService` (getMembers + getMemberStats) extrait de `groupService`
- `GroupMembersModal` avec toggle semaine/mois · partage SMS / WhatsApp / invitation
- Hooks co-localisés : `useGroupActions` + `useGroupStats`
- Compteur membres sur `GroupCard` (via `memberCount`)

### API IA vocal — `/api/missions/parse-voice` (2026-04-20)
- **Multi-provider robuste** : `claude-haiku-4-5` primaire (~2s) → fallback `gemini-flash-latest` → `gemini-2.5-flash`
- Retry 1× sur 503/429 avec backoff 800ms · timeout Gemini 5s / Claude 10s
- Logs tokens + coût USD réel : `[parse-voice] claude-haiku-4-5 → 200 in 1929ms (in:1261 out:151 = $0.002)`
- **Coût mesuré : ~0,20 centime / course** (Claude Haiku)
- Prompt caching testé puis retiré (Haiku exige 2048 tok min · prompt système ~1200 tok)

### Services & tests
- **152 tests au total** ✅ · 75 services · 59 hooks · 0 erreur TS · 0 erreur ESLint
- Services testés : mission, auth, driver, profile, payment, document, groupStats, userPrefs
- Hooks testés : login, driverStats/Missions/Profile/Payments/Agenda, groupActions/Stats/Card, reservation, voice, install/download, navbar, confirmWithPassword

### Déploiement & infra
- GitHub `mohamedmajor999-cpu/TaxiLink` · Vercel `taxi-link-web.vercel.app`
- ESLint config (`next/core-web-vitals`, 0 erreur) · CSP (`unsafe-eval` dev · `routes.googleapis.com` prod)
- SEO metadata (landing + auth) · Material Symbols auto-hébergé via `@font-face`
- Note Windows : tests à lancer par fichier (heap OOM en batch)

### Qualité code (CLAUDE.md) — dette soldée 2026-04-21
- ✅ `addressService.ts` (827l) éclaté → `googlePlacesSearchService` + `googlePlaceDetailsService` + `routingService` (barrel 12l)
- ✅ `CurrentCourseScreen.tsx` (213l) et `useVoiceDictation.ts` (158l) découpés
- ✅ `NextMissionBanner.tsx` → logique extraite dans `useNextMissionBanner` co-localisé
- ✅ 4 hooks >150l découpés : `useDriverHome` (176→86), `usePartagerMissionModal` (173→145), `useMissionVoiceFiller` (161→132), `useRegisterForm` (155→100)
- ✅ Nouvelles extractions : `useDriverHomeFilters`, `useMissionPricing`, `voiceFillerHelpers`, `passwordStrength`
- ✅ `useMissionRealtime.test.ts` régression corrigée · `useDriverDocuments.test.ts` fix appliqué
- **Résultat** : plus aucun fichier ne viole les seuils CLAUDE.md

---

## Maquettes HTML validées (session 2026-04-15)

- `mockup-redesign.html` (landing) + `mockup-app.html` (8 écrans : connexion, inscription 1/2, missions, agenda, groupes, profil, partager mission)
- **Direction design** : Inter · radius 6px max · 1px `#E5E7EB` · amber `#D97706` accent · SVG Feather inline · zéro emoji

---

## ⏳ À faire

| Tâche | Priorité |
|---|---|
| Tester course privée heure de pointe + retour à vide en prod (vérifier Routes API activé côté Google Cloud) | P1 |

> Tâches soldées (2026-04-21) :
> - ~~`driverStore.load()` dans `DriverDashboard`~~ — déjà connecté via `useDriverAuth` (ligne 23)
> - ~~Intégration `/onboarding` post-inscription~~ — CTA "Découvrir TaxiLink" ajouté sur écran succès `RegisterForm`
> - ~~Appliquer mockups auth/dashboard~~ — refonte visuelle faite dans `TaxiLink-refonte/`, pas dans `TaxiLink/`

---

## Légende
✅ Terminé · ⏳ À faire · 🚧 En cours · ❌ Bloqué
