# TaxiLink — Stratégie de migration vers les apps mobiles natives (iOS + Android)

**Date** : 2026-05-08
**Auteur** : Mohamed + Claude
**Statut** : plan validé, exécution non démarrée

---

## 1. Vision et objectifs

Trois apps natives **React Native (Expo)** publiées sur App Store + Google Play :

1. **TaxiLink Chauffeur** — l'app critique. GPS background, notifs push de missions, mode mains-libres, fluidité 60fps. Priorité 1.
2. **TaxiLink Patron** — gestion d'organisation : Vue / Courses / Agenda. Priorité 2 (le PC reste le canal principal des patrons, cf. mémoire `feedback_patron_dashboard_pc_first`).
3. **TaxiLink Patient/Famille** — suivi de la course en temps réel + historique + factures. Priorité 3.

**Cible qualité** : indistinguable d'une app native premium type Heetch/Bolt côté chauffeur, Doctolib côté patient. Pas de webview wrapper, pas de hybride.

Le web (`apps/web`) reste en production et continue d'évoluer en parallèle. Aucune régression web n'est acceptable pendant la migration.

---

## 2. Stack technique retenue

| Brique | Choix | Justification |
|---|---|---|
| Framework | **Expo SDK 51+** (Managed) | EAS Build/Submit cloud, OTA updates, dev client custom, écosystème natif sans Xcode/Android Studio en routine |
| Routing | **Expo Router v3** | File-based routing, mental model identique à Next.js App Router que l'équipe maîtrise déjà |
| Style | **NativeWind v4** | Réutilise les classes Tailwind du `apps/web/tailwind.config.ts` (primary, ink, paper, warm, danger…) |
| Animations | **Reanimated 3** + **Gesture Handler 2** | 60fps natif obligatoire pour le ressenti premium |
| Cartes | **react-native-maps** (Apple Maps iOS / Google Maps Android, natives) | Gratuit, performant, intégration native parfaite. Compromis assumé : 2 styles différents à gérer |
| GPS background | **expo-location** + **expo-task-manager** | Tâche persistante survivant à l'app fermée, indispensable côté chauffeur en course |
| Push notifs | **expo-notifications** + Expo Push API (FCM + APNs) | Gratuit, branché via Edge Function Supabase |
| Voix | **expo-audio** (enregistrement) → upload vers `/api/missions/parse-voice` (Whisper existant) | Réutilise l'infra serveur déjà en place |
| Déclenchement voix | **Bouton volume hardware + bouton écran** | Pas de wake-word en phase 1 |
| Storage auth | **expo-secure-store** | Keychain iOS / Keystore Android, sécurisé |
| Storage non-sensible | **@react-native-async-storage/async-storage** | Cache local des stores Zustand |
| Monitoring | **@sentry/react-native** | Même DSN que le web, source maps automatiques via plugin EAS |
| Tests unit | **Jest + React Native Testing Library** | Calque la convention de tests web |
| Tests E2E | **Maestro** | Scripts YAML déterministes, beaucoup moins flaky que Detox |
| CI/Distribution | **EAS Build + EAS Submit** | Build cloud signé, soumission auto stores |

**Ce qu'on n'utilise pas, et pourquoi** :
- ❌ **Capacitor** : webview hybride, ne donne pas la qualité native demandée.
- ❌ **Flutter** : duplique tout l'écosystème, perd la réutilisation des services TS existants.
- ❌ **React Native CLI bare** : Expo Managed couvre 100% des besoins, l'éjection serait une régression DX.
- ❌ **Mapbox / MapLibre** : décision validée 2026-05-08 → cartes natives gratuites suffisantes.
- ❌ **Wake-word vocal** : trop complexe phase 1, bouton volume couvre le besoin.

---

## 3. Architecture monorepo cible

L'archi web actuelle (CLAUDE.md) impose `composant → hook → service → Supabase`. Cette discipline rend **60-70% du code réutilisable directement** en RN. Seule la couche UI (`.tsx`) est réécrite.

### 3.1 Avant la migration

```
TaxiLink/
├── apps/
│   └── web/                        ← Next.js 14
└── packages/
    ├── core/                       ← types + mocks
    └── ui/                         ← tokens design legacy
```

### 3.2 Après la migration

```
TaxiLink/
├── apps/
│   ├── web/                        ← Next.js 14 (inchangé en surface)
│   ├── mobile-driver/              ← Expo (priorité 1)
│   ├── mobile-patron/              ← Expo (priorité 2)
│   └── mobile-patient/             ← Expo (priorité 3)
└── packages/
    ├── core/                       ← types + mocks (inchangé)
    ├── ui/                         ← tokens legacy (inchangé)
    ├── services/                   ← NOUVEAU : extrait depuis apps/web/src/services/
    ├── stores/                     ← NOUVEAU : extrait depuis apps/web/src/store/
    ├── ui-mobile/                  ← NOUVEAU : composants RN partagés (Button, Card, MissionRow…)
    └── design-tokens/              ← NOUVEAU : tokens unifiés (web Tailwind + NativeWind)
```

### 3.3 Règles de partage

| Couche | Web | Mobile-driver | Mobile-patron | Mobile-patient | Source |
|---|---|---|---|---|---|
| Types métier | ✅ | ✅ | ✅ | ✅ | `packages/core` |
| Services Supabase + API | ✅ | ✅ | ✅ | ✅ | `packages/services` |
| Stores Zustand | ✅ | ✅ | ✅ | ✅ | `packages/stores` |
| Hooks métier (non-DOM) | ✅ | ✅ | ✅ | ✅ | `packages/services/hooks` |
| Composants UI | web only | mobile only | mobile only | mobile only | non partagé |
| Composants RN partagés | ❌ | ✅ | ✅ | ✅ | `packages/ui-mobile` |
| Tokens design | ✅ | ✅ | ✅ | ✅ | `packages/design-tokens` |

### 3.4 Hooks à auditer pour migration

Liste des hooks `apps/web/src/hooks/` et leur statut :

| Hook | Réutilisable RN ? | Adaptation requise |
|---|---|---|
| `useAuth` | ✅ direct | aucune |
| `useToasts` | ⚠️ logique OK, UI à refaire | extraire la logique, créer `<ToastHost>` RN |
| `useAudioRecorder` | ❌ Web Audio API | réécrire avec `expo-audio` |
| `useAutoMissionProgress` | ✅ direct | aucune |
| `useCourseGeofence` | ✅ direct | aucune (calculs géo purs) |
| `useCurrentOrg` | ✅ direct | aucune |
| `useDeptPreferences` | ✅ direct | aucune |
| `useDocumentUpload` | ⚠️ FormData OK, picker à refaire | utiliser `expo-document-picker` + `expo-image-picker` |
| `useDriverHeartbeat` | ✅ direct | aucune |
| `useDriverPositionPush` | ✅ direct | aucune |
| `useGlobalDriverGps` | ❌ navigator.geolocation | réécrire avec `expo-location` + task manager |
| `useIncomingMissionOffer` | ✅ direct | aucune |
| `useInstallPrompt` | ❌ PWA-only | supprimé (inutile en natif) |
| `useMissionProgressActions` | ✅ direct | aucune |
| `useMissionRealtime` | ✅ direct | aucune |
| `useNightMode` | ⚠️ media query | utiliser `useColorScheme` de RN |
| `useOrgRealtimeRefresh` | ✅ direct | aucune |
| `usePostedMissionAcceptNotifier` | ⚠️ Notification API | réécrire avec `expo-notifications` |
| `usePostedMissionUntakenNotifier` | ⚠️ Notification API | réécrire avec `expo-notifications` |
| `useWakeLock` | ❌ Wake Lock API | utiliser `expo-keep-awake` |

**Bilan** : 10 hooks réutilisables tels quels, 6 à adapter, 1 à supprimer. Très bon ratio.

---

## 4. Plan phasé global

| Phase | Durée nette | Buffer | Total | Réel | Livrable |
|---|---|---|---|---|---|
| **0 — Refactor monorepo** | 1 sem | +0 | 1 sem | **1 jour (2026-05-10)** ✅ | `packages/services`, `packages/stores`, `packages/design-tokens`, web toujours vert |
| **1 — App chauffeur** | 12 sem | +30% | 16 sem | — | TestFlight + Play Internal Testing, 10 chauffeurs beta |
| **2 — App patron** | 5 sem | +20% | 6 sem | — | App patron en lecture, notifs employés |
| **3 — App patient/famille** | 5 sem | +20% | 6 sem | — | Suivi temps réel + historique |
| **4 — Polish + soumission stores** | 3 sem | +30% | 4 sem | — | Apps disponibles publiquement |
| **Total** | 26 sem | | **~33 semaines** | | 3 apps en production |

> Les estimations restent la baseline prudente (planification + délais externes Apple/Google). La colonne **Réel** est remplie au fil de l'eau — utile pour comparer plus tard et affiner le pilotage des phases suivantes.

**~7,5 mois en cadence soutenue solo**, ~5 mois à 2 dev expérimentés RN.

Chaîne critique parallèle : **comptes stores** (cf. §6) à démarrer dès la semaine 1.

---

## 5. Phase 1 (App chauffeur) — détail semaine par semaine

C'est la phase qui justifie le saut au natif. Tout le reste s'appuie dessus.

### Semaine 1 — Bootstrap

- `npx create-expo-app apps/mobile-driver --template tabs` puis convertir en Expo Router
- Brancher Turbo (`turbo.json` : `mobile-driver#dev`, `mobile-driver#build`)
- Setup TypeScript strict, ESLint, Prettier alignés sur le web
- Setup `packages/design-tokens` : exporter les tokens Tailwind (primary, ink, paper…) en deux formats : `tailwind.config.ts` (web) et NativeWind preset (mobile)
- Premier build EAS Development sur device physique iOS (TestFlight interne) et Android (APK)
- Sentry branché (`@sentry/react-native`), test crash volontaire visible dans Sentry

**Critère de sortie** : l'app boot sur device, affiche "Hello TaxiLink", crash Sentry visible.

### Semaine 2 — Authentification

- Écrans : Login (email + password), Signup avec OAuth Google (`expo-auth-session`), Complete Profile, Mot de passe oublié
- Storage : `expo-secure-store` pour le refresh token Supabase (override le storage par défaut `@supabase/supabase-js`)
- Persistance "type Instagram" (mémoire `project_persistent_auth`) : refresh token longue durée, déconnexion uniquement via bouton explicite
- Réutiliser : `authService`, `profileService`
- Adapter : middleware redirect (web `src/middleware.ts`) → guard d'écran avec Expo Router `<Stack.Protected>` ou redirect dans layout

**Critère de sortie** : un chauffeur peut s'inscrire, compléter son profil, et l'app le redirige vers `/dashboard` sur ouverture suivante sans réauth.

### Semaine 3 — Liste missions + realtime

- Écran principal : `app/(driver)/missions.tsx` — `FlatList` virtualisée des missions disponibles
- Filtres : `dept_preferences` côté serveur (déjà fait par `missionQueries.getAvailable`), tri par distance / heure
- Realtime : `useMissionRealtime` (réutilisable direct), patch-diff pas full reload
- Pull-to-refresh, empty state, loading skeleton
- Composant `<MissionRow>` dans `packages/ui-mobile`

**Critère de sortie** : 50+ missions chargées, scroll 60fps, ajout d'une mission via dashboard web apparaît en <1s sur mobile.

### Semaine 4 — Détail mission + carte + accept/refuse

- Écran détail : `app/(driver)/missions/[id].tsx`
- `react-native-maps` : marqueurs départ/arrivée, polyline du trajet OSRM
- Bouton "Accepter" → `missionService.acceptMission()`, optimistic update, rollback si erreur
- Bouton "Refuser" → log silencieux côté `missionOfferService` (pas une vraie suppression)
- Géolocalisation foreground : `expo-location getCurrentPositionAsync` pour calculer distance chauffeur → départ

**Critère de sortie** : un chauffeur peut accepter une mission depuis son téléphone, et le patron voit l'acceptation en realtime sur le dashboard web.

### Semaine 5 — GPS foreground + heartbeat

- Hook `useDriverPositionPush` adapté pour `expo-location.watchPositionAsync` (10m precision, 5s interval)
- Heartbeat `useDriverHeartbeat` réutilisé tel quel
- Toggle "En ligne / Hors ligne" persistant via Zustand + secure-store
- Indicateur visuel UX : pulse animé + texte état GPS

**Critère de sortie** : la position du chauffeur en ligne est trackée côté serveur, visible sur le dashboard admin.

### Semaine 6 — GPS background (la phase la plus risquée)

C'est LA fonctionnalité qui nécessite la plus grande vigilance technique et la plus grande négociation avec Apple lors de la review.

- `expo-task-manager` : `defineTask('GPS_TASK', …)` qui pousse les positions vers Supabase
- `expo-location.startLocationUpdatesAsync` avec `accuracy: BestForNavigation`, `deferredUpdatesInterval: 10000`
- iOS : permission `NSLocationAlwaysAndWhenInUseUsageDescription` dans `app.json`, justification claire en français : "TaxiLink suit votre position pendant les courses pour informer le patient en temps réel et tracer le parcours pour la facturation CPAM."
- Android : `FOREGROUND_SERVICE_LOCATION` + notification persistante "Course en cours — TaxiLink"
- Battery optimization : whitelist Android via `expo-battery` + tutorial in-app
- Test : laisser l'app fermée 1h, vérifier que les positions arrivent toutes les 5-10s sur la table `driver_positions`

**Critère de sortie** : un chauffeur peut démarrer une course, mettre son téléphone en poche écran éteint, et la trajectoire est complète et fluide sur le dashboard patron.

### Semaine 7 — Push notifications

- `expo-notifications` : token de chaque device stocké côté Supabase (table `device_push_tokens`)
- Edge Function Supabase déclenchée sur INSERT `missions` :
  - Filtre les chauffeurs en ligne dans le bon département
  - Filtre les groupes autorisés (mémoire `project_groups_no_auto_cascade`)
  - Filtre les blocages (mémoire `project_driver_blocks`)
  - POST batch sur `https://exp.host/--/api/v2/push/send`
- Notification interactive : actions "Voir" / "Ignorer"
- Tap sur notif → deep-link vers `/missions/[id]`
- Stratégie d'attribution : pour Phase 1, on garde la diffusion à tous les chauffeurs en ligne dans le département (mémoire `project_dispatch_strategy` parle de ronds élargissants — à implémenter après le MVP)

**Critère de sortie** : poste mission depuis dashboard web, tous les chauffeurs en ligne du département reçoivent une notif en <3s.

### Semaine 8 — Mode course actif

- Auto-progression GPS : réutilise `useAutoMissionProgress` (déjà 100% logique, pas de DOM)
- Géofence arrivée : réutilise `useCourseGeofence`
- Écran "course en cours" full-screen avec map + ETA temps réel
- Bouton SOS (appel chauffeur de secours / patron)
- Wake lock : `expo-keep-awake` activé pendant la course
- Mode nuit : couleurs sombres sur la map, brightness via `expo-brightness` (optionnel)

**Critère de sortie** : course type Marseille → Aix complétée en mode mains-libres avec auto-progression et notification au patient.

### Semaine 9 — Voix mains-libres

- Bouton volume ↑ : listener natif (pas de plugin Expo officiel, utiliser `react-native-volume-manager` ou expo-modules-core custom)
- Bouton écran flottant gros (FAB) : `expo-audio` enregistre pendant maintien
- Upload vers `/api/missions/parse-voice` (Whisper) — endpoint existant
- Si réponse manque info → suite via `/api/missions/parse-voice-answer`
- Feedback haptique : `expo-haptics` à chaque étape (start, stop, succès, échec)
- Test critique : enregistrement Bluetooth HFP mono 8kHz (mémoire `project_voice_stack`) → Whisper gère bien

**Critère de sortie** : le chauffeur dit "course de Marseille à Aubagne dans 30 minutes pour Mme Martin", l'app crée la mission sans toucher l'écran.

### Semaine 10 — Profil + documents + admin

- Écrans : Profil, Documents (carte pro, assurance, CG), Préférences départements, Blocking collègues
- Réutilise : `documentService`, `driverService`, `userPrefsService`, `driverBlockService`
- Picker images : `expo-image-picker` + redimensionnement local pour économiser bande passante
- Upload Supabase Storage : streaming via `FileSystem.uploadAsync`

**Critère de sortie** : un nouveau chauffeur peut compléter son onboarding entièrement depuis l'app sans ouvrir le web.

### Semaine 11 — Polish UI/UX

- Animations Reanimated sur transitions d'écrans, swipe-to-accept missions, pull-to-refresh custom
- Splash screen branded (logo wordmark Plus Jakarta Sans, mémoire `project_logo_wordmark`)
- Icône app : générée via `expo-icon` à partir d'un SVG 1024×1024
- Dark mode (déjà présent côté web, à transposer)
- Empty states / error states soignés
- Internationalisation : préparer i18n même si on lance en français only (clés `t('mission.accept')`)

**Critère de sortie** : l'app passe le test "screenshot review" — chaque écran est présentable en App Store screenshots.

### Semaine 12 — Beta interne et externe

- TestFlight : invite par email (jusqu'à 10k testeurs sans review Apple, mais review légère pour la première soumission)
- Play Internal Testing : groupe email
- 10 chauffeurs beta sélectionnés (mix Android/iOS, mix Marseille/Paris)
- Hotline Slack ou Discord pour bug reports
- Sentry actif, dashboard hebdomadaire (crashes, ANR, taux de delivery push)

**Critère de sortie** : 10 chauffeurs utilisent l'app en conditions réelles pendant 1 semaine, <2 crashes/100 sessions.

---

## 6. Phase 2 (App patron) — synthèse 5 semaines

L'app patron est secondaire car le patron travaille majoritairement sur PC (mémoire `feedback_patron_dashboard_pc_first`). Mobile = vues simplifiées, alertes, actions rapides.

| Sem | Livrable |
|---|---|
| 1 | Bootstrap `apps/mobile-patron`, partage `packages/services`, auth |
| 2 | Onglet "Vue" : KPIs jour, courses en cours, alertes (employé refuse course, course non prise) |
| 3 | Onglet "Courses" : liste filtrable, détail, action "republier dans autres groupes" |
| 4 | Onglet "Agenda" : vue planning lecture seule (création reste sur PC) |
| 5 | Push notifs critiques (course non prise après X min, employé hors ligne pendant course active), polish |

**Note** : pas de partage de mission depuis l'app patron en phase 2. Le formulaire `PartagerMissionModal` (mémoire `project_mission_form`) reste PC-only — trop complexe pour mobile (BAN + OSRM + voice + tarif CPAM). Phase 2.5 si demande forte.

---

## 7. Phase 3 (App patient/famille) — synthèse 5 semaines

| Sem | Livrable |
|---|---|
| 1 | Bootstrap `apps/mobile-patient`, auth simplifiée (SMS OTP via Supabase Phone Auth) |
| 2 | Liste des courses passées et à venir, filtres |
| 3 | Suivi temps réel : map du chauffeur qui arrive, ETA actualisé, photo + nom + plaque + tel |
| 4 | Historique + factures (PDF) + RGPD self-service |
| 5 | Push notifs (chauffeur en route, arrivé, course terminée), polish |

**Note** : la plupart des patients sont des seniors (transport CPAM). UX large polices, contraste fort, peu d'écrans, gros boutons. Tester avec utilisateurs réels seniors avant lancement.

---

## 8. Phase 4 — Polish + soumission stores (3 semaines)

| Sem | Livrable |
|---|---|
| 1 | Screenshots iOS (5,5", 6,5", 6,7"), Android (téléphone + tablette), copywriting ASO en 3 versions A/B, vidéo preview optionnelle |
| 2 | Politique de confidentialité dédiée mobile, EULA, support email/téléphone, soumission Apple + Google |
| 3 | Itérations sur retours review (souvent 1-3 cycles avec Apple), publication progressive (10% → 100%) |

---

## 9. Comptes stores et chemin critique

**À démarrer la semaine 1, en parallèle du code, car les délais administratifs peuvent bloquer la publication finale.**

### 9.1 Apple Developer Program

- **Coût** : 99 €/an
- **Type de compte** : individuel OU organisation
- **Si organisation (recommandé long terme)** :
  - Numéro **D-U-N-S** obligatoire (gratuit chez Dun & Bradstreet, demande sur https://developer.apple.com/enroll/duns-lookup/)
  - Délai D-U-N-S en France : **5 à 14 jours ouvrés**
  - Vérification Apple ensuite : 2-7 jours
- **Si individuel (plus rapide)** :
  - Pas de D-U-N-S, vérification 24-48h
  - Mais tu apparais avec ton nom personnel sur l'App Store
  - Transfert vers compte organisation possible plus tard mais pénible

**Recommandation** : démarrer en compte **individuel** pour ne pas bloquer la publication, transférer plus tard si TaxiLink devient une SAS dédiée.

### 9.2 Google Play Console

- **Coût** : 25 € one-shot
- **Vérification d'identité obligatoire** depuis 2024 :
  - Personnel : pièce d'identité + adresse
  - Organisation : pièce d'identité du représentant + D-U-N-S + statuts
- **Délai** : 3-7 jours ouvrés
- **Publication** : il faut **20 testeurs internes pendant 14 jours minimum** avant publication publique pour les nouveaux comptes (depuis nov. 2023). À anticiper dans le calendrier.

**Recommandation** : créer le compte **personnel** dès la semaine 1, recruter 20 testeurs internes (famille, amis, premiers chauffeurs partenaires) pour démarrer le compteur de 14 jours dès la phase 1 beta.

### 9.3 Politique de confidentialité

URL publique obligatoire pour les deux stores. Doit lister :
- Toutes les permissions demandées (localisation always, micro, notifications, photos, etc.)
- Les données collectées et leur finalité
- Les sous-traitants (Supabase, OpenAI Whisper, Sentry, Expo)
- Le DPO (toi en l'occurrence) et la procédure RGPD

À publier sur `taxilink.fr/legal/privacy-mobile`. Tu as déjà du RGPD côté web (mémoire `project_mission_form`), il faut juste le compléter pour le natif.

### 9.4 Comptes développeurs Google et Apple : qui les détient ?

Question importante : les comptes doivent être au nom de **TaxiLink** (entité ou personne propriétaire à long terme), pas d'un sous-traitant. Si tu travailles avec un dev externe, donne-lui un accès en tant que **développeur sur ton compte**, ne crée pas son propre compte qu'il faudrait transférer plus tard.

---

## 10. Tokens design — transposition web vers mobile

### 10.1 Couleurs

Toutes les couleurs du `apps/web/tailwind.config.ts` sont transposables 1:1 dans NativeWind. Il faut juste extraire dans `packages/design-tokens/colors.ts` :

```typescript
// packages/design-tokens/src/colors.ts
export const colors = {
  primary: '#FFD23F',
  secondary: '#1A1A1A',
  accent: '#3B82F6',
  ink: '#000000',
  paper: '#FFFFFF',
  warm: { 50: '...', /* ... */ 800: '...' },
  danger: { DEFAULT: '...', soft: '...' },
  brand: { DEFAULT: '#FFD23F', soft: '...' },
  // ...
};
```

Puis :
- `apps/web/tailwind.config.ts` importe `colors` depuis `@taxilink/design-tokens`
- `apps/mobile-*/tailwind.config.js` (NativeWind) importe les mêmes

### 10.2 Typographie

| Web | Mobile | Notes |
|---|---|---|
| Inter (font-sans) | `@expo-google-fonts/inter` | charge async via `useFonts()`, splash jusqu'au load |
| Instrument Serif (font-serif) | NON utilisée sur driver | mémoire `feedback_dashboard_typo_sans_serif` |
| Plus Jakarta Sans (logo wordmark) | `@expo-google-fonts/plus-jakarta-sans` | uniquement sur splash et logo en-tête |

### 10.3 Icônes

Migration `Material Symbols` (web) → `@expo/vector-icons MaterialIcons + MaterialCommunityIcons` :

- Mapper chaque nom utilisé dans `<Icon name="...">` web vers son équivalent RN
- Créer un wrapper `<Icon>` dans `packages/ui-mobile` qui prend la même prop `name` et résout vers le bon set
- Tableau de mapping documenté dans `packages/ui-mobile/src/Icon/iconMap.ts`

### 10.4 Composants à créer dans `packages/ui-mobile`

Estimation : **~15 composants partagés** entre les 3 apps.

| Composant | Description | Équivalent web |
|---|---|---|
| `Button` | Variants primary/secondary/ghost/danger | `<button>` Tailwind |
| `Card` | Conteneur arrondi avec shadow | `<div className="bg-white rounded-3xl shadow-card">` |
| `MissionRow` | Item de liste mission compact | `MissionRow.tsx` web |
| `Sheet` | Bottom sheet modal (équivalent Modal web) | `<Modal>` web |
| `TextInput` | Input avec label flottant + error state | `<input>` Tailwind |
| `Icon` | Wrapper @expo/vector-icons | `Icon.tsx` web |
| `Toast` + `ToastHost` | Notifications éphémères | `useToasts` + `<ToastHost>` web |
| `Badge` | Pastille colorée | `RideBadge` web |
| `Avatar` | Photo profil avec fallback initiales | inline web |
| `Chip` | Filtre tap-able | `<button>` arrondi web |
| `EmptyState` | Illustration + texte + CTA | inline web |
| `Loader` | Skeleton + spinner | inline web |
| `MapView` | Wrapper react-native-maps avec style TaxiLink | nouveau |
| `BottomBar` | Barre nav 5 onglets | nouveau |
| `Header` | En-tête écran avec back + actions | inline web |

---

## 11. Coûts récurrents

| Poste | An 1 | An 2+ |
|---|---|---|
| Apple Developer Program | 99 € | 99 € |
| Google Play Console | 25 € (one-shot) | 0 € |
| EAS Production (build cloud + OTA) | ~360 €/an | ~360 €/an |
| Cartes natives (Apple + Google Maps) | 0 € | 0 € |
| Sentry (mutualisé avec web) | 0 € additionnel | 0 € |
| Push notifs Expo | 0 € | 0 € |
| Whisper (déjà payé OPENAI_API_KEY) | 0 € additionnel | 0 € |
| **Total mobile-only** | **~485 €** | **~460 €** |

Coûts marginaux faibles. Le poste principal est EAS Production, indispensable pour les OTA updates.

---

## 12. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Apple rejette pour permission Always-Location floue | Moyenne | Bloque publication 1-2 semaines | Justification claire + screen vidéo de démo + demo account avec scénario CPAM |
| Battery optimization Android tue le service GPS | Élevée | UX dégradée chauffeurs | Tutorial in-app pour whitelist + `expo-battery` + fallback notif "redémarrer la course" |
| Push notifs perdues iOS background | Moyenne | Missions ratées | Backend retry + WebSocket de fallback quand l'app est ouverte |
| OTA update casse l'app en prod | Faible | Crash massif | Channels (preview/production), rollback rapide via EAS dashboard |
| Délai D-U-N-S bloque la soumission | Moyenne | Retard de 2 semaines | Démarrer en compte personnel, transférer plus tard |
| Nouveaux comptes Play exigent 20 testeurs × 14j | Certaine | Retard de 2 semaines après dev | Recruter testeurs dès le début phase 1 |
| Régression web pendant extraction services | Faible | Bug en prod web | Tests existants + extraction graduelle service par service, jamais en bloc |
| Voice Whisper trop lent sur 4G médiocre | Moyenne | UX vocale frustrante | Compression audio mp3 64kbps, fallback "essayez en wifi", indicateur réseau |

---

## 13. Décisions validées (2026-05-08)

- ✅ **Stratégie** : React Native partout (3 apps natives), pas de Capacitor, pas de Flutter
- ✅ **Cibles prioritaires** : chauffeur > patron > patient
- ✅ **Plateformes** : iOS et Android ensemble, pas de priorité
- ✅ **Cartes** : natives (Apple Maps iOS, Google Maps Android), pas de Mapbox
- ✅ **Voice** : bouton volume hardware + bouton écran, pas de wake-word
- ✅ **Doc** : ce fichier `MOBILE_STRATEGY.md`

## 14. Décisions encore ouvertes (à trancher avant Phase 0)

- ⏳ Compte Apple Developer : individuel ou organisation ?
- ⏳ Compte Play Console : individuel ou organisation ?
- ⏳ Qui dev : Mohamed solo, ou recrutement d'un dev RN expérimenté en complément ?
- ⏳ Beta chauffeurs : qui sont les 10 testeurs pré-identifiés ?
- ⏳ Splash + icône : design custom ou itération sur le wordmark existant ?
- ⏳ Politique d'OTA : channel preview pour beta, channel production pour stable ?

---

## 15. Prochaines étapes immédiates

1. **Cette semaine** :
   - Trancher comptes individuels vs organisations (cf. §14)
   - Démarrer dossier D-U-N-S si choix organisation Apple
   - Créer compte Apple Developer (paiement 99 €)
   - Créer compte Google Play Console (paiement 25 €)
   - Identifier 10 chauffeurs beta + 20 testeurs internes Play

2. **Semaine prochaine** (si feu vert) : Phase 0 — extraction `packages/services` et `packages/stores` depuis `apps/web/src/`. C'est un travail de plomberie de 1-2 jours, qui ne casse pas le web (les imports `@/services/...` deviennent `@taxilink/services/...`).

3. **Décision Phase 0 → Phase 1** : si l'extraction se passe bien et que le web reste vert, on enchaîne directement sur le bootstrap `apps/mobile-driver`.

---

## 16. Références

- Architecture web actuelle : [CLAUDE.md](./CLAUDE.md)
- Stratégie d'attribution missions : `project_dispatch_strategy` (mémoire)
- Persistance auth : `project_persistent_auth` (mémoire)
- Patron PC-first : `feedback_patron_dashboard_pc_first` (mémoire)
- Voice stack : `project_voice_stack` (mémoire)
- Logo wordmark : `project_logo_wordmark` (mémoire)
- Doc Expo : https://docs.expo.dev/
- Doc EAS : https://docs.expo.dev/eas/
- Doc Apple App Review : https://developer.apple.com/app-store/review/guidelines/
- Doc Google Play : https://play.google.com/console/about/
