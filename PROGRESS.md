# PROGRESS.md

Suivi de l'avancement du projet TaxiLink Pro.

---

## ✅ Terminé

### Wave 5 — RGPD + observabilité + temps réel + accessibilité (2026-04-27)
Suite à un audit produit transverse qui a remonté 8 chantiers, tous shippés en 5 commits sur master. Bilan : 877/877 tests verts (+19 nouveaux), 3 migrations Supabase appliquées via MCP, type-check propre, 0 fonctionnalité cassée.

**Item 2 — pg_cron cleanup `is_online` stale** (commit `9c6bd57`)
- Migration `20260427_drivers_presence_cron.sql` : extension `pg_cron` activée + job `driver_presence_cleanup` qui passe `is_online=false` toutes les minutes pour les drivers dont `last_seen_at < now() - 120s` ou NULL.
- Vérifié actif sur prod via MCP, 0 fantôme restant. Sans ce cron, le filtre côté requête masquait les fantômes à l'affichage mais la table `drivers` restait sale (3 fantômes constatés).

**Item 6 — Audit Sentry + capture des catches silencieux** (commit `9752ab0`)
- Sentry était déjà câblé (client / server / edge configs + global error boundary + instrumentation Next.js) mais 3 catches en best-effort jetaient les erreurs : POST `/api/driver/offline`, `driverStore.signOut` flip offline, heartbeat ping. Tagging des erreurs par contexte pour faciliter le tri Sentry.

**Item 7 — Tests heartbeat** (commit `9752ab0`)
- 6 cas sur `useDriverHeartbeat` : mount/unmount, intervalle 60s, pas de ping si offline ou sans driverId, swallow d'erreur. Pas de test sur les pages légales (Server Components statiques avec contenu textuel — un test de rendu n'apporte rien).

**Item 3 — Real-time courses dans les groupes** (commit `efb10f8`)
- Canal Supabase dans `useDriverGroupesScreen` qui écoute `mission_groups` (insert/update/delete) et `missions` (update) ; debounce 600 ms ; refetch des `summaries`. Filtrage par `groupIds` côté client (Supabase realtime ne filtre que sur une colonne).
- Résultat : la pastille verte/grise + compteur « N courses dispo » sur chaque GroupCard réagit en live aux INSERT/UPDATE de missions des groupes du chauffeur. Avant : snapshot HTTP figé au mount.

**Item 4 — Compteur de vues sur missions postées** (commit `efb10f8`)
- Migration `20260427_mission_views.sql` : table `mission_views` (mission_id, viewer_id, viewed_at, UNIQUE) + colonne `missions.view_count` + trigger d'incrémentation + RLS INSERT pour authenticated, **pas de SELECT** (compteur agrégé uniquement, conforme décision UX/RGPD vue en revue produit — pas de fuite « qui a vu quand »).
- `missionViewsService.record(missionId, viewerId)` — best-effort, swallow ON CONFLICT et erreurs RLS bénignes.
- `useMissionDetail` enregistre la vue au mount (sauf si viewer = author).
- `PostedTab` affiche « N vues » inline dans la barre footer de la card quand mission en attente avec `view_count > 0`. Résout le problème pointé par Salim en revue produit : « sans les vus de WhatsApp, je ne sais pas si c'est lu, je retourne sur WhatsApp ».

**Item 5 — Stats individuelles privées par membre** (commit `3c1cf7a`)
- `useGroupDetail.myStats` : agrégat `sharedCount` + `acceptedCount` + percentile pour le chauffeur courant, calculé côté client à partir de `getMemberStats` (déjà câblé).
- `MyGroupStatsPanel` (composant extrait) : affichage **uniquement à soi**, jamais en leaderboard public. Mention « Top X% » uniquement si percentile ≤ 30 pour ne pas humilier les bas de classement (cf. décision Yohan en revue produit : « humilier les bas du tableau = churn »).

**Item 1 — Floutage RGPD données patient (Article 9)** (commit `3c1cf7a`) ⭐
- `lib/missionMask.ts` : helpers `maskMissionForViewer` / `canSeeFullMission` / `maskName`. Masque `patient_name` (initiales `J. D.`), `phone` (null), `notes` (null) sauf si viewer ∈ {`shared_by`, `driver_id`, `client_id`}.
- `useMissionDetail` applique le mask au mount avant exposition au composant ; expose `isMasked`.
- `MissionDetailScreen` affiche un bandeau RGPD « Données patient masquées, visibles après acceptation, conformément à la protection des données de santé (RGPD Art. 9) » quand mission CPAM + viewer non autorisé.
- 13 tests sur les helpers (initiales, viewers autorisés, champs préservés).
- **Limitation actuelle** : masking côté application uniquement. Hardening RLS-level (vue `missions_safe` + policies excluant colonnes sensibles) reste à faire pour passer compliance prod CPAM. Voir section « 🟡 À faire » ci-dessous.

**Item 8 — Audit accessibilité (passes ciblées)** (commit `755ed35`)
- `ToastContainer` wrappé en `role="status"` + `aria-live="polite"` → annonce des toasts par les lecteurs d'écran.
- `SidebarNav` `<aside>` aria-label « Barre latérale », `<nav>` aria-label « Navigation principale » → désambiguation des landmarks pour utilisateurs de NVDA/VoiceOver.
- Audit complet WCAG (contraste, focus management dans modals, skip-to-content) reste hors scope — à faire sur une vague dédiée si demandé par client/loi.

**Refactor pour respecter les seuils de fichier** (commit `755ed35`)
- Extraction de `MyGroupStatsPanel` hors `GroupDetailScreen` (225 → 192 lignes).
- Extraction de `missionViewsService` hors `missionService` (161 → 146 lignes).
- Mock `createClient` ajouté dans `useDriverGroupesScreen.test` (le hook s'abonne maintenant à un canal Supabase realtime au mount).

### Vague B — pages légales (mentions, confidentialité, CGU, RGPD) (2026-04-27)
4 pages légales créées + composant partagé [`LegalPageShell.tsx`](apps/web/src/components/legal/LegalPageShell.tsx). Élimine les 11 liens `href="#"` qui violaient l'obligation d'affichage des mentions légales (Art. 6 LCEN) et des informations RGPD.
- **`/mentions-legales`** : éditeur (placeholders), hébergement (Supabase Inc. / AWS Paris eu-west-3), propriété intellectuelle, cookies fonctionnels uniquement
- **`/confidentialite`** : catégorisation des données collectées **extraite du code réel** (compte/profil, documents, missions avec données de santé pour CPAM, paiements IBAN, géolocalisation `is_online`/`last_seen_at`, logs), bases légales (Art. 6 RGPD), durées de conservation (factures 6 ans), destinataires (CNAM en tiers-payant CPAM), transferts UE encadrés CCT, sécurité (TLS 1.3, RLS Postgres, bcrypt), droits utilisateur
- **`/cgu`** : nature du service positionné comme **intermédiaire technique** (pas transporteur, pas employeur), conditions d'inscription chauffeur (carte pro, ADS, assurance, conventionnement CPAM), tarification (arrêté préfectoral 13-2026 pour privé Marseille, CNAM 2025 pour CPAM), obligations chauffeur, limitation de responsabilité, juridiction française, médiateur conso
- **`/rgpd`** : récap des 7 droits + procédure CNIL (3 place de Fontenoy) + DPO + notification de violation 72 h
- **Branchements** : LoginForm CGU+confidentialité, Footer legacy 4 légaux + Contact mailto, LandingFooter ajout 4 légaux + suppression Blog/Statut morts, Centre d'aide → mailto support
- **Bandeau jaune visible « Version provisoire en cours de validation juridique »** sur chaque page, avec lien email contact et placeholders italiques `[À COMPLÉTER]` sur les champs réels (raison sociale, SIRET, adresse, médiateur, DPO)
- **Hors scope (action éditeur requise avant prod)** : remplir les placeholders, faire valider par un avocat, formaliser la procédure de recueil de consentement patient pour les courses CPAM (Art. 9 RGPD), évaluer obligation de désigner un DPO (Art. 37 RGPD)

### Vague A — nettoyage UI : retrait des boutons morts et liens menteurs (2026-04-27)
Suite à un audit produit transverse (mêmes patterns que le nettoyage Groupes), retrait de tous les éléments d'interface qui prétendent fonctionner mais ne font rien :
- **DriverCoursesScreen** : retrait du bouton **Agenda** mobile (sans `onClick`) et du bouton **Exporter** desktop (`disabled` + tooltip « Bientôt disponible »)
- **PostedBoostStrip / usePostedTab** : retrait du bouton **Élargir aux groupes** qui ouvrait un toast « fonctionnalité arrive bientôt » ; ne reste que `+5 € sur le prix` qui marche
- **DriverProfilScreen** : retrait de l'icône engrenage **Réglages** dont le handler `onOpenSettings` n'était jamais passé par le parent (toutes les options du profil sont déjà accessibles via les rangées de section)
- **Navbar (legacy `/telecharger`)** : retrait des 3 ancres mortes `#fonctionnalites`, `#comment-ca-marche`, `#temoignages` (IDs absents du code source)
- **LandingFooter** : `Démo → #etapes` (ID inexistant) remplacé par `Installer → #installer`
- **Footer (legacy)** : retrait des fausses icônes sociales (`<div>` décoratifs sans lien) et du lien **Gérer ma flotte** qui pré-remplissait un rôle `patron` qui n'existe pas dans l'inscription
- **Bilan** : −87 lignes, +12. 858/858 tests verts. Aucun changement fonctionnel — uniquement suppression de mensonges UI.
- **Reste hors scope (vague B identifiée)** : 11 liens légaux `href="#"` (CGU, confidentialité, mentions légales, RGPD) répartis sur LoginForm, LandingFooter et Footer ; aucune des 4 pages légales correspondantes n'existe (risque RGPD). À traiter en stub honnête (« page en construction ») ou en contenu réel validé par avocat.

### Présence chauffeur — fix faux « En ligne » (logout + heartbeat + sendBeacon) (2026-04-27)
Bug identifié sur prod : 3 chauffeurs sur 4 marqués `is_online=true` apparaissaient en ligne dans les groupes alors que leurs navigateurs étaient fermés depuis ~9 minutes. La page Groupes lisait `drivers.is_online` sans notion de fraîcheur.

**Fix A — flip serveur au logout (déconnexion volontaire)** :
- `driverStore.signOut()` centralise : flip `is_online=false` côté serveur via `driverService.setOnline(driverId, false)` (best-effort, non bloquant), puis `authService.signOut()`, puis reset du store local
- 4 sites de logout migrés vers cette nouvelle action : `useProfileSectionApp`, `useSettingsApp`, `useDriverAuth`, `SidebarNav` (avant : 4 implémentations divergentes dont aucune ne flippait l'état serveur)

**Fix B — heartbeat + TTL (fermetures brutales)** :
- Migration `20260427_drivers_last_seen_at.sql` : colonne `TIMESTAMPTZ` + index partiel `(is_online, last_seen_at) WHERE is_online=TRUE` + backfill `last_seen_at = now()` pour les chauffeurs déjà online
- `driverService.heartbeat(driverId)` `UPDATE last_seen_at = now()`
- `driverService.setOnline(true)` seed `last_seen_at` immédiatement pour éviter une fenêtre de 60 s où le chauffeur apparaît offline
- Hook `useDriverHeartbeat()` ping toutes les 60 s tant que `driver.isOnline === true` ; monté au niveau de `DriverDashboard` (orchestrateur)
- `groupStatsService.getActivitySummary` + `getMemberStats` filtrent via `isFreshlyOnline(is_online, last_seen_at)` avec TTL 120 s

**Fix C — sendBeacon offline (fermeture d'onglet quasi-instantanée)** :
- Endpoint `POST /api/driver/offline` flippe `is_online=false` ; auth via cookie SSR (les beacons portent les cookies mais pas de headers custom) ; silencieux en erreur (l'onglet meurt, pas de log utile)
- Hook `useDriverOfflineBeacon()` écoute `pagehide` + `beforeunload` (les deux pour couvrir Safari iOS où `beforeunload` est peu fiable)
- Couverture : fermeture d'onglet, lock écran iOS, navigation hors dashboard → ~0 s. Crash navigateur, kill -9, perte réseau → rattrapé par TTL 120 s.

**Vérifié sur prod via MCP Supabase** : avant le fix, 4 chauffeurs apparaissaient en ligne ; après le fix, 1 seul (le seul à pinguer). Les 3 fantômes (last_seen_at figé à l'heure du backfill) sont automatiquement masqués par le filtre TTL.

**Tests** : +9 cas (`driverStore.signOut` 4 cas, `driverService.heartbeat` 2 cas, `setOnline` avec `last_seen_at` 2 cas, mocks adaptés), 858/858 verts.

### Page Groupes — nettoyage P0 + indicateur de vie + pin utilisateur (2026-04-27)
- **UX page Mes groupes** : placeholder de search honnête (« Rechercher dans mes groupes » au lieu de « rechercher ou rejoindre » qui ne marchait pas) · suppression de la carte pointillée dupliquée « Créer votre groupe » · suppression de la mention paywall fantôme « Gratuit jusqu'à 10 membres » · 1 seul CTA « Créer » dans le header (au lieu de 3) · lien discret « Rejoindre un autre groupe avec un code » en bas
- **Empty state** : 2 CTA équivalents (« J'ai un code » prioritaire pour le cas dominant + « Créer un groupe »)
- **Pin utilisateur** : le « groupe actif » n'est plus le premier de la liste auto-sélectionné (UX trompeuse) mais celui que l'utilisateur épingle via icône `Pin` sur la carte · persisté en `localStorage` clé `taxilink:driver:pinnedGroupId`
- **Indicateur de vie** : pastille verte pulsante (motion-safe) ou grise sur l'avatar selon `summary.available > 0` · compteur inline « N courses dispo » sur **chaque** carte (plus seulement le pin) · fetch parallèle des `getActivitySummary()` pour tous les groupes via `Promise.allSettled`
- **Renommage stats** : « Taux de reprise » → « Acceptées » + tooltip explicatif au survol (`Stat` accepte un prop `hint`) · « Échangées (7j) » → « Partagées (7j) »
- **GroupDetailScreen** : bouton « Poster une course » branché sur `router.push('/dashboard/chauffeur?creer=1')` au lieu d'être un placeholder mort · suppression du bouton Téléchargement non implémenté
- **Refactor** : extraction du dropdown menu kebab dans `GroupCardMenu.tsx` pour respecter le seuil 200 lignes
- **Fichiers** : `DriverGroupesScreen.tsx`, `useDriverGroupesScreen.ts`, `GroupCard.tsx`, `GroupCardMenu.tsx` (nouveau), `groupes/GroupDetailScreen.tsx`, `groupes/useGroupDetail.ts`
- **Hors scope** (identifié en revue produit, à faire ensuite) : floutage RGPD avant acceptation (P0 légal CPAM, ~2 semaines), real-time canal `missions` filtré par groupes du chauffeur, opt-in « groupe découvrable » + listing public par département, page d'accueil publique sur lien d'invitation, stats individuelles privées (partagées/acceptées par membre), co-admin + succession d'ownership

### Profil chauffeur — complétion des écrans (infos, départements, IBAN, factures, support) (2026-04-27)
- **PersonalInfoScreen** : formulaire prénom / nom / téléphone (email read-only) · réutilise `useSettingsCompte` qui gère `profileService.updateProfile` + validation téléphone
- **DepartementsScreen** : wrap autour du `DeptPreferencesCard` existant avec back nav
- **BankAccountScreen** + `useBankAccountScreen` : saisie IBAN avec auto-format par blocs de 4 caractères et validation modulo 97 ISO 7064 · persistance via le `paymentService.updateIBAN` existant · affichage du dernier IBAN enregistré (•••XXXX) avec badge « Actif »
- **InvoicesScreen** + `useInvoicesScreen` + `InvoiceReceipt` : historique des courses terminées groupées par mois avec total annuel · modal de reçu détaillé (chauffeur, n° professionnel, trajet, distance, durée, motif CPAM, mention « TVA non applicable, art. 293 B ») · bouton « Imprimer / PDF » déclenchant `window.print()` · classes `print-only` / `print-hide` ajoutées dans `globals.css` (`@media print` masque tout sauf le reçu)
- **SupportScreen** : 3 contacts (`mailto:` / `tel:` / `wa.me`) + 6 questions FAQ avec accordéon (recevoir des missions, paiement, télécharger reçu, document expirant, partager mission, changer IBAN)
- **`isValidIban` / `formatIban`** ajoutés à `lib/authValidators.ts`
- **Routing** : tous les sub-screens du profil branchés via le query param `?profilSub=infos|departements|bank|invoices|support|documents` dans `DriverDashboard.tsx` · handlers passés à `DriverProfilScreen` qui les distribue à `ProfileSectionCompte` / `ProfileSectionPaiements` / `ProfileSectionApp`

### Profil chauffeur — sélecteur Auto / Clair / Sombre (2026-04-27)
- **`ThemeModeRow`** : segmented control 3 états (Auto / Clair / Sombre) avec icônes `SunMoon` / `Sun` / `Moon` · libellé « Apparence » + sous-titre « Auto · 20 h–8 h en sombre » · branché sur `useNightModeStore` existant (déjà persistant via `localStorage` clé `taxilink-night-mode`)
- **`useProfileSectionApp`** : expose `themePref` + `setThemePref(NightModePref)`
- **`useNightMode()` monté au niveau de `DriverDashboard`** (orchestrateur) au lieu de seulement `DriverHome` → la classe `.dark` s'applique maintenant sur tous les onglets (home / courses / groupes / profil), plus seulement sur l'écran d'accueil
- **Fichiers** : `ProfileSectionApp.tsx`, `useProfileSectionApp.ts`, `ThemeModeRow.tsx` (nouveau), `DriverDashboard.tsx`

### Maquette dashboard patron de flotte (2026-04-26, non committée)
- **Route** `/dashboard/patron-mockup` · 5 onglets : Vue d'ensemble · Courses · Agenda · Chauffeurs · Finances
- **Sidebar desktop** + **bottom nav mobile** avec bouton FAB `+` central (style driver app)
- **Vue d'ensemble** : KPIs (chauffeurs en ligne, courses en cours, CA jour, alertes) · carte flotte temps réel (pins stylisés) · top chauffeurs · activité en direct · alertes documents
- **Courses** : section « À attribuer » (pool 4 missions) avec modal Assigner (diffuser ou assigner à un chauffeur précis) + table filtrable
- **Agenda** : vue gantt 6h→21h, 1 ligne par chauffeur, blocs colorés par statut (terminé/en cours/planifié)
- **Finances** : KPIs CA jour/semaine/mois + CPAM en attente · graphique CA 30j en barres · liste factures CPAM avec délai et statut
- Tous composants en `night.*` palette + dark mode supporté
- Stub modal « Poster une course » qui réutilisera `PartagerMissionModal` à l'intégration réelle
- **Statut** : maquette navigable, **pas de backend ni d'auth patron** — discussion en cours sur l'intégration (multi-tenancy via `organizations` + RLS Supabase + Stripe Billing pour B2B)

### Mode nuit + harmonisation palette (2026-04-25/26)
- **Hook** `useNightMode` + store persisté Zustand (`nightModeStore.ts`) — préférence `auto` (20h-8h) / `on` / `off`
- **Toggle** dans `DriverHomeTopOverlay` (icône Clock/Moon/Sun selon état)
- **Palette nuit dédiée** dans `tailwind.config.ts` : `night.bg` (#15171C) / `surface` (#1E2026) / `elevated` (#292B32) / `border` (#383A42) / `text` (#E5E2DA warm off-white) / `text-soft` (#9A9890) / `brand` (#D9A923 amber-gold désaturé qui remplace le `#FFD11A` éblouissant)
- Tous les `dark:` variants des composants home migrent : DriverHome · DriverDashboard · DriverHomeSheet · DriverHomeTopOverlay · DriverHomeAcceptBar · DriverHomeFilterChips · DriverHomeMap · MissionMapPopup · MissionSheetItem · NextMissionBanner · HoldAcceptButton
- Contrôles Leaflet (zoom +/-, attribution) stylisés en nuit via `globals.css`
- **Bug fix** : popup `MissionMapPopup` z-[600] → z-[1100] pour passer devant les contrôles Leaflet (z-index 1000) en plein écran
- **Bug fix** : textes `text-ink` sans variants (carte course en cours blanche, prix, distances) corrigés sur 5 composants

### Refonte accueil chauffeur — carte + sheet draggable (2026-04-25)
- **DriverHome** mobile : carte plein écran + sheet draggable façon Uber, snap 4 fractions (1/5, 2/5, 3/5, 4/5)
- **useSheetDrag** : drag fluide en temps réel (mutation directe `style.height`, pas via React state) puis snap à la fraction la plus proche au relâchement avec transition CSS
- **Grabber** iOS-style : 56×6px gris-warm, zone tactile h-10 (40px min), stable sans animation grow/shrink
- **DriverHomeTopOverlay** + middle slot : filtres sur la même ligne que le statut En ligne en plein écran paysage
- **markerOffset** : annonces partageant la même adresse (hôpital, gare) placées sur cercle ~40m (ordre stable par id) — avant elles se superposaient et certaines étaient inaccessibles même zoom max
- **Popup pin** + bouton plein écran avec animation `popup-in` cubic-bezier (déjà existant)

### Tarification — CPAM v2026 (CNAM 2025) + privé Marseille v2026 (2026-04-24/25)
- **CPAM** : alignement complet convention CNAM 2025 (arrêté 29 juillet 2025, en vigueur 01/11/2025) après reverse-engineering du JS de calcul-taxi-conventionne.fr
  - `TARIF_KM_BDR = 1.10` (avant 1.38, qui était 1.10 × 1.25 hospi mal interprété)
  - Retour à vide HDJ s'applique aussi en intra-ZUPC (avant exclu)
  - TPMR : +30 € par véhicule × (returnTrip ? 2 : 1), pas par patient
  - Abattement solo longue distance : -5% si 1 patient et distance ≥ 30 km
  - Tests : 17 cas dont validation `5 km HDJ 2 patients = 22,14 €` matchant pile le simulateur
- **Privé Marseille** : tarifs préfectoraux v2026 (arrêté 13-2026-02-03-00010) — 2,40€ prise en charge / 1,12-2,90 €/km / 35,60 €/h
  - 10 ZUPC distinctes en BDR (Marseille+Allauch+Plan-de-Cuques+Septèmes / Aix / Aubagne / Aéroport=Marignane+Vitrolles / etc.) au lieu d'une zone commune
  - `extractCommune()` corrigé pour ignorer le segment « , France » final
  - Détection auto tarif A/B/C/D + retour à vide selon ZUPC départ/destination
- **Google Routes API** étendu avec `staticDuration` (FieldMask) → bascule tarif horaire si plus avantageux que la circulaire BDR (cf. `useMissionRoute`, `computeRouteGoogle`)
- Propagation `staticDurationMin` + `passengers` + `transport_type` + `return_trip` dans toute la chaîne (`computeDisplayFare`, `computeEffectivePrice`, `useMissionPricing`, `usePartagerMissionModal`, `MissionFormLibre`, `FareEstimateButton`, `PriceFields`)

### Filtrage missions par département + préférences chauffeur (2026-04-24)
- Migration `20260423_mission_departement.sql` : colonne TEXT calculée depuis CP (`lib/departement.ts`) — formats `"01"`–`"95"` (sauf `"20"`), `"2A"/"2B"` Corse, `"971"`–`"978"` DROM-COM
- À l'inscription : `RegisterStep2` force le choix d'un département → `authService.finalizeSignUp` seed `dept_preferences: [department]`
- Profil : `DeptPreferencesCard` pour ajouter/retirer après coup (stocké dans `auth.users.raw_user_meta_data.dept_preferences: string[]`)
- `missionQueries.getAvailable(departments?)` filtre serveur via `.in('departement', ...)` si liste non vide
- Tolérance 24h sur `scheduled_at` pour missions disponibles (avant filtrait trop strict)

### URL state synchronisé partout dans le dashboard (2026-04-23/24)
- Onglets · sous-onglets · modals (créer / éditer mission · groupes Créer/Rejoindre · détail mission) tous synchronisés avec `?tab=`/`?subtab=`/`?modal=`/`?editer=1`/`?missionId=` pour que **Précédent navigateur** fonctionne proprement
- Boutons « Retour » utilisent `router.back()` au lieu de re-pousser l'URL → pas d'historique pollué
- Avatar dashboard cliquable vers profil + `BackButton` uniforme

### Auth Google OAuth + complétion profil (2026-04-23)
- **Google OAuth activé** : Google Cloud Console OAuth client configuré (app publiée en prod, pas testeurs) · redirect URI Supabase `https://ivumykufinlniffxqlud.supabase.co/auth/v1/callback` · Client ID + Secret injectés dans Supabase provider · Site URL + Redirect URLs configurés
- **Complétion profil obligatoire** : Google fournit prénom/nom mais jamais le téléphone → middleware intercepte les profils incomplets avant tout accès dashboard
  - `src/middleware.ts` : SELECT étendu à `role, first_name, last_name, phone` · redirection vers `/auth/complete-profile?redirect=<pathname>` si un champ est vide
  - `src/app/auth/complete-profile/page.tsx` (server component) : vérifie auth + re-check complétude · redirige vers `redirectTo` si déjà complet
  - `src/components/auth/CompleteProfileForm.tsx` + `useCompleteProfileForm.ts` : formulaire 3 champs (nom/prénom/téléphone) avec validation `isValidPhone`
  - Pas de double-saisie : champs Google pré-remplis, seul le téléphone est réellement obligatoire à saisir
- Triggers DB existants (`handle_new_user` + `create_driver_on_profile`) déjà compatibles OAuth via COALESCE sur `first_name`/`given_name`

### Fix prix incohérent multi-device (2026-04-23)
- **Bug** : même mission affichée à 84€ sur un device et 126€ sur un autre (même compte)
- **Cause racine** : `new Date(scheduled_at).getHours()` retourne l'heure locale du device · un device en UTC (VPN, extension privacy) lit 06h30 UTC = nuit CPAM (×1.5) au lieu de 08h30 Paris
- **Fix** : `src/lib/missionFare.ts` force l'extraction via `Intl.DateTimeFormat` avec `timeZone: 'Europe/Paris'` · helper `parisDateTime()` retourne `{ date, time }` déterministes peu importe le fuseau du device
- Vérifié : mission Faculté des sciences → Campus Saint-Charles (15.4km · samedi 8h30) = 84€ sans majoration ✅

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
- **848 tests au total** ✅ · 101 fichiers · 0 erreur TS · 0 erreur ESLint
- Couverture atteinte (2026-04-22) : **Statements 84.7% · Functions 87.1% · Lines 89.9%** (cible 80% ✅)
- Services testés : mission, auth, driver, profile, payment, document, groupStats, userPrefs, address/routing
- Hooks P1 testés : login, driverStats/Missions/Profile/Payments/Agenda, groupActions/Stats/Card, reservation, voice, install/download, navbar, confirmWithPassword, courseMap, guidedVoicePrompt/Answer/Applier, missionVoiceFiller, guidedMissionScreen, nextMissionBanner, missionRoute, historyTab, agendaTab, ttsAnnouncer, cancelMissionDialog, missionPricing, courseTopStats
- Hooks P2 testés : voiceTipCard, settingsToggles, notificationPermissionBanner, landingNav, installSection, driverCoursesScreen, mobileStickyCta, pwaFirstLaunchGate, driverGroupesScreen, driverHomeFilters, addressFieldVoice, driverProfilScreen, voiceDictation, settingsApp, settingsCompte, settingsPreferences, addressField, voiceFreeFlow

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
| **RLS hardening masking patient** — aujourd'hui `maskMissionForViewer` est appliqué côté app uniquement. Pour passer compliance prod CPAM, créer une vue Postgres `missions_safe` qui exclut `patient_name`/`phone`/`notes` + policy RLS donnant accès à cette vue aux non-acceptants, et accès à la vue complète aux `shared_by`/`driver_id`/`client_id`. Sinon un attaquant qui s'authentifie peut bypasser le masking via requête directe Supabase. | P0 légal |
| **Remplir les `[À COMPLÉTER]` des pages légales** (raison sociale, SIRET, siège, médiateur conso, DPO) — ~15 min de saisie | P0 |
| **Faire valider les pages légales par un avocat** — particulièrement la procédure de recueil de consentement patient (Art. 9 RGPD) | P0 |
| **Évaluer obligation DPO** — TaxiLink traite des données de santé à grande échelle au sens Art. 37 RGPD ; un DPO est probablement obligatoire | P0 |
| Tester course privée heure de pointe + retour à vide en prod (vérifier Routes API activé côté Google Cloud) | P1 |
| Audit a11y WCAG complet (contraste, focus management dans modals, skip-to-content, navigation clavier) — vague dédiée | P2 |
| **Dashboard patron de flotte** — décision archi : monorepo + multi-tenancy via `organizations` + RLS Supabase + Stripe Billing B2B (~49 €/mois/véhicule). Validation marché préalable : trouver 5 patrons prêts à pré-payer avant de coder | P2 |
| Migration SQL `organizations` + `organization_id` sur missions/drivers/factures + RLS — pré-requis du dashboard patron | P2 |
| Étendre `useAuth`/middleware pour rôle `patron` + connecter maquette aux vraies données | P2 |
| Stripe Billing B2B + webhooks + portail self-service | P2 |
| Sortir site marketing dans `apps/marketing` (séparation B2B/B2C, SEO) | P3 |
| **Hors scope identifié sur Groupes** : opt-in « groupe découvrable » + listing public par département, page d'accueil publique sur lien d'invitation, co-admin + succession d'ownership | P3 |

> Tâches soldées (2026-04-21) :
> - ~~`driverStore.load()` dans `DriverDashboard`~~ — déjà connecté via `useDriverAuth` (ligne 23)
> - ~~Intégration `/onboarding` post-inscription~~ — CTA "Découvrir TaxiLink" ajouté sur écran succès `RegisterForm`
> - ~~Appliquer mockups auth/dashboard~~ — refonte visuelle faite dans `TaxiLink-refonte/`, pas dans `TaxiLink/`

---

## Légende
✅ Terminé · ⏳ À faire · 🚧 En cours · ❌ Bloqué
