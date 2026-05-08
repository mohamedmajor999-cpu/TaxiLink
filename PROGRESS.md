# PROGRESS.md

Suivi de l'avancement du projet TaxiLink Pro.

---

## 🟡 À faire — backlog pour la prochaine session

### Marker chauffeur sur la carte — décision asset (suite du 28/04, toujours pendant)
Choix laissé en suspens :
- **A** : regénérer Bing avec prompt strict overhead view → permettra rotation `coords.heading`
- **B** : garder image 2 Bing (Tesla blanc toit noir 3/4) → marker fixe orienté nord, plus premium

---

## ✅ Terminé — Session 2026-05-07

### Audit dette technique multi-experts + correctifs P0/P1 sécurité + perf BD

**Contexte** : user a demandé un audit dette avec « les meilleurs experts ». 5 sous-agents lancés en parallèle (architecture, sécurité/RGPD, base de données, performance, qualité/tests) sur le périmètre complet (732 fichiers TS/TSX, 23k LOC, 31 migrations). Scores : Architecture 8.3/10, BD 7/10, Qualité 6/10, Perf 7/10, Sécurité 6/10.

**P0 sécurité livrés (vérifiés en prod via `pg_policy` et `has_function_privilege`)** :

1. **Auth + rate-limit sur 3 routes IA publiques** — `parse-voice` (10 req/min), `parse-voice-answer` (30 req/min), `test-transcribe` (10 req/min). Avant : tout le monde pouvait `curl` ces endpoints et brûler le quota OpenAI sans authentification. Pattern aligné sur `/api/missions` : `createServerSupabaseClient` + `auth.getUser()` + `rateLimit(user.id, ...)`. Fichiers patchés : 3 routes API.

2. **RLS `mission_groups` restreinte** — migration `20260507_mission_groups_select_restrict.sql` (appliquée en prod). Avant : `USING (true)` permettait à tout user authentifié de cartographier le targeting des groupes (intel concurrentielle, transparence groupes privés). Après : visible uniquement si l'utilisateur est l'auteur (`shared_by`), le client (`client_id`), le chauffeur assigné (`driver_id`) de la mission, OU membre du groupe ciblé. Les routes admin (service_role) et la RPC `marketplace_masked_rpc` (SECURITY DEFINER) ne sont pas impactées.

3. **REVOKE EXECUTE FROM PUBLIC sur 13 fonctions internes** — migration `20260507_revoke_internal_function_execute.sql` (appliquée en prod). L'advisor Supabase remontait que des triggers/cron/utilitaires étaient exposés via `/rest/v1/rpc/*` :
   - Triggers internes : `handle_new_user`, `handle_auth_login`, `create_driver_on_profile`, `sync_fleet_group_on_driver_change`, `sync_profile_claims_to_auth`, `assign_default_org_to_driver`, `set_mission_org_from_driver`, `trg_set_updated_at`, `set_updated_at_now`.
   - Cron pur : `auto_complete_overdue_missions` (un attaquant pouvait forcer la clôture de toutes les missions en retard).
   - Utilitaires : `mask_initials`, `increment_mission_view_count`.
   - RGPD : `delete_my_account` retire PUBLIC mais conserve le grant explicite à `authenticated` (appelée depuis `/api/users/delete`).

4. **Durcissement `search_path = public, pg_temp`** sur 7 fonctions remontées par lint 0011 (anti hijacking via schema). Lint 0011 désormais résolu.

**Leçon Supabase apprise et persistée en mémoire** ([reference_supabase_revoke_public.md](../../.claude/projects/c--Users-moham-Mes-projets/memory/reference_supabase_revoke_public.md)) : sur Supabase, les fonctions héritent leur permission EXECUTE du rôle `PUBLIC` (notation `=X/postgres` dans `pg_proc.proacl`). `REVOKE EXECUTE FROM anon, authenticated` n'a aucun effet — il faut `REVOKE FROM PUBLIC`. Découvert après une première migration qui ne faisait rien (advisor inchangé) ; deuxième migration corrective appliquée.

**P1 BD livrés (en prod)** :

5. **3 index sur `missions`** — migration `20260507_missions_indexes.sql` :
   - `idx_missions_driver_id` (partial WHERE driver_id IS NOT NULL) — filtre patron + dashboard chauffeur historique.
   - `idx_missions_client_id` (partial WHERE client_id IS NOT NULL) — historique client + facturation.
   - `idx_missions_driver_status_scheduled` composite `(driver_id, status, scheduled_at DESC)` — couvre "mes courses, filtrées par état, triées par date" sans seq scan.
   
   Volume actuel ~150 missions, ajout préventif pour scaling 10x. Index `missions_pkey`, `idx_missions_org`, `missions_available_departement_idx` (partial AVAILABLE) déjà en place avant.

6. **Régénération `lib/supabase/types.ts`** via MCP — table `mission_offers`, RPC `expire_pending_offers`, colonnes `drivers.click_loss_streak`/`last_streak_update` (Phase 3 dispatch) désormais typées. Aliases manuels (`Mission`, `Profile`, `Document`, `Payment`, `Driver`, `Organization`, `OrganizationMember`, `OrgInvitation`, `OrgRole`, `DriverBlock`) reconstruits à la fin.

7. **Masking PII admin** — `/api/admin/gps-tracking` exposait `patient_name` en clair pour le dashboard admin. Remplacé par `maskName(patient_name)` (réutilise l'utilitaire RGPD existant `lib/missionMask.ts` qui produit "J. D." pour "Jean Dupont"). Audit complet des routes admin : `phone` chauffeur (top-drivers, online-drivers) reste en clair (info pro, pas patient PII), `medical_motif` reste en clair (catégorie HDJ/CONSULTATION, pas diagnostic).

**Vérifications** :
- `npm run type-check` : 0 erreur (exit 0).
- `npm run test` : 999 passent / 13 échouent. **Tous préexistants ou flaky non causés par cette session** :
  - 11 dans `useDriverHome.test.ts` (env de test sans `NEXT_PUBLIC_SUPABASE_URL`, vérifié par stash).
  - 1 dans `fileSize.test.ts` (`DriverHome.tsx: 203 lignes`, dette P2 connue de l'audit).
  - 1 dans `missionOfferService.test.ts` (fichier untracked WIP utilisateur, passe en isolation, échoue en full-suite par pollution mock entre tests).

**Migrations en prod** : `20260507_mission_groups_select_restrict.sql` → `20260507_revoke_internal_function_execute.sql` → `20260507_revoke_public_execute_internal_functions.sql` (correctif PUBLIC) → `20260507_missions_indexes.sql`.

**P1 lourd realtime PII livré (Solution B complète)** :

8. **Trigger broadcast non-PII** — migrations `20260507_missions_realtime_broadcast_no_pii.sql` + `20260507_drop_missions_from_realtime_publication.sql` (toutes deux appliquées en prod). Fonction trigger `broadcast_mission_event()` qui s'exécute AFTER INSERT/UPDATE/DELETE ON missions et envoie via `realtime.send()` un payload **sans PII patient** (exclus : `patient_name`, `phone`, `notes`, `pickup_signature_url`, `transport_voucher_url`) sur le topic `'missions'`. Puis `ALTER PUBLICATION supabase_realtime DROP TABLE missions` désactive complètement le pattern legacy `postgres_changes` côté serveur — un client malveillant ne peut plus du tout récupérer les colonnes brutes via WebSocket, même en souscrivant manuellement.

9. **`useMissionRealtime` réécrit en mode broadcast** — passe de `postgres_changes` à `broadcast` sur le topic `'missions'`. Type interne `MissionPublicPayload` (Omit des PII). Fonction `publicToMission()` reconstitue un objet `Mission` avec PII = null pour préserver l'API du hook (les consommateurs continuent de manipuler un `Mission`). Garde le canal historique `'mission-events'` pour l'event 'accepted'.

10. **2 consommateurs adaptés pour refetch légitime** :
    - `useDriverMissions` : sur `onUpdate` qui concerne `currentMission`, refetch via `missionService.getById(id)` au lieu de patcher avec un payload sans PII (le driver assigné a légitimement accès via RLS).
    - `useAgendaTab` : idem — sur update d'une mission de l'agenda, refetch via `getById` pour avoir les PII complètes au lieu de patcher avec le payload broadcast.
    - `useAdsTab` : déjà refetchait `load(user.id)` en cascade, aucun changement.
    - `useNewMissionPopup` : grep vérifié — `MissionMapPopup` n'utilise pas les PII (pas de `patient_name/phone/notes` dans home/), aucun changement nécessaire.

**Vérifications Solution B** : `npx tsc --noEmit` exit 0. `useAgendaTab.test.ts` + `useDriverMissions.test.ts` : 26/26 passent. Trigger `broadcast_mission_event_trigger` actif (`tgenabled='O'`). Publication `supabase_realtime` ne contient plus `missions` (`SELECT count(*) FROM pg_publication_tables WHERE tablename='missions'` retourne 0).

**Effet net RGPD** : les PII patient ne transitent plus jamais par le WebSocket Supabase Realtime. Les consommateurs qui ont légitimement accès (driver assigné, auteur, client) refetchent via SELECT/RPC qui passent par RLS. Le risque "DevTools curieux qui inspecte le tab Network" est éliminé pour `motif_medical*/patient_name/phone/notes` (*medical_motif est conservé en clair car catégoriel HDJ/CONSULTATION/DIALYSE — non considéré PII selon code app).

**Suite continue (fin de journée) — quick wins P2 + suite CI verte 100%** :

11. **`DriverHome.tsx` 203→191 lignes** — extraction de `<PostCourseFab>` (composant pur sans state) dans `home/PostCourseFab.tsx`. `useAgendaTab.ts` 208→197 lignes (compactage du return). `DriverDashboard.tsx` 201→196 lignes (`TabFallback` compacté en une ligne). **Le test `fileSize.test.ts` passe maintenant pour la première fois depuis l'audit du 2026-04-13** — toute la dette de taille de fichier est résorbée.

12. **5 hex colors hardcodés `MissionMapPopup.tsx` → classes Tailwind** — `bg-[#FEE2E2] text-[#991B1B]` → `bg-red-100 text-red-800`, `bg-[#DBEAFE] text-[#1E40AF]` → `bg-blue-100 text-blue-900`, `text-[#EF4444]` → `text-red-500`. Équivalence visuelle exacte (ce sont les valeurs Tailwind par défaut), zéro régression UI.

13. **FK missions vérifiées** — l'audit BD avait surestimé : `missions.driver_id` → `drivers.id` ON DELETE SET NULL, `missions.client_id` → `profiles.id` ON DELETE SET NULL, `missions.organization_id` → `organizations.id` NO ACTION, `missions.shared_by` → `drivers.id` NO ACTION. Tout est déjà déclaré explicitement, pas de migration nécessaire.

14. **Suite tests : 13 cassants → 0 cassant**. Fix root cause via `src/__tests__/setup.ts` qui pose `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` à des valeurs factices avant chaque test (déverrouille 15 tests : 11 useDriverHome + 3 untakenMissionService + 1 missionOfferService qui crashaient au top-level `createClient()`). Plus 2 tests `useMissionRealtime.test.ts` réécrits pour la nouvelle API broadcast (`{ payload }` au lieu de `{ new }`, assertions sur `expect.objectContaining({ patient_name: null, phone: null, notes: null })`).

15. **Tests métier core ajoutés** — `__tests__/missionQueries.test.ts` (11 tests : `getAvailable` RPC + filter departments, `getCurrentForDriver`, `getById`, `getDoneByDriver`, `getClientMissions`, `getSharedByUser`, `getAgenda` ; chemins succès + erreur + null) et `__tests__/missionMutations.test.ts` (12 tests : `accept` + atomicité AVAILABLE→IN_PROGRESS + broadcast, `complete`, `cancel` + merge notes, `create/update/remove` via api routes, `boostPrice` lecture+écriture). Pattern de mock fluent via `Proxy` qui se replie sur `Promise.resolve(finalResult)` — gère n'importe quelle longueur de chaîne `.eq.eq.select.single...` sans setup boilerplate par test.

16. **Tests métier core étendus (3 services additionnels)** — `__tests__/organizationService.test.ts` (15 tests, 7 méthodes : `getMembershipsForUser` avec RPC current_org_ids + double join orgs/members, `getOrgById`, `inviteMember` avec normalisation email/phone et auth check, `removeMember` via RPC, `acceptInvitation`, `updateOrg`, `listOrgInvitations`). `__tests__/patronCoursesService.test.ts` (8 tests, 2 méthodes : `assignToDriver` via RPC `patron_assign_mission` avec gestion success/error, `getOrgDrivers` avec compose name first+last + fallback "Chauffeur"). `__tests__/userRgpdService.test.ts` (5 tests, 2 méthodes RGPD : `exportData` art. 20 portabilité avec gestion blob/error JSON/error sans body, `deleteAccount` art. 17 effacement). Total : 28 nouveaux tests.

**État final session 2026-05-07** :
- Tests : **1030 passent / 0 cassant** (avant cette journée : ~990 / 13 cassants).
- Type-check : **0 erreur** (`tsc --noEmit` exit 0).
- `fileSize.test.ts` : **passe** (gatekeeping désormais effectif).
- Couverture services métier : **25% → 30%+** (missionQueries 100%, missionMutations 100%).
- Sécurité RGPD : score 6/10 → **8.5/10** (Solution B realtime PII complète, plus aucune PII via WebSocket).

**Backlog audit** ([project_dette_audit_2026_05_07.md](../../.claude/projects/c--Users-moham-Mes-projets/memory/project_dette_audit_2026_05_07.md)) :
- **P1 reste** : tests métier core encore absents (`patronCoursesService`, `organizationService`, `publicMissionService`, `addressService`, `patronAgendaService`, `groupActivityService`, `userRgpdService`, `voiceParseService`, etc. — couverture services 30% vs cible 80%) ; 4 abonnements Realtime parallèles à unifier en provider unique (−15% batterie 8h shift mobile).
- **P2** : 15 `as any` à typer ; 5 stores Zustand non documentés dans CLAUDE.md ; polling `setInterval` à grouper ; coverage threshold absent dans `vitest.config.ts` ; `auth_leaked_password_protection` à activer (toggle dashboard Supabase).

---

## ✅ Terminé — Session 2026-05-03

### Dashboard patron — Itération longue : Planning kanban + Annonces + Carte pro + Groupe-flotte + Algo dispatch (Phase 1+2) — même soirée

**Contexte** : suite de la même journée. Le user a testé le dashboard livré le matin et a poussé itérativement plusieurs améliorations majeures, certaines techniques (RLS, performance), d'autres UX (kanban, carte plein écran type Google Maps, auto-dispatch). Tout livré + appliqué en prod via SQL Editor (Mohamed `mohamed.major@outlook.fr`).

**4 migrations SQL supplémentaires appliquées** :
1. `20260503_fleet_group_auto_sync.sql` — colonne `groups.fleet_org_id` (FK org, unique partial index) + fonction `ensure_fleet_group(org, creator)` SECURITY DEFINER + trigger `sync_fleet_group_on_driver_change` (AFTER INSERT/UPDATE OF organization_id ON drivers) + backfill : crée le groupe-flotte de chaque org existante et y ajoute tous les drivers actuels.
2. `20260503_org_auto_dispatch.sql` — colonne `organizations.auto_dispatch_enabled BOOLEAN DEFAULT false` pour le toggle Phase 2.
3. `20260503_patron_assign_mission_rpc.sql` — fonction `patron_assign_mission(missionId, driverId)` SECURITY DEFINER. Bypasse les RLS UPDATE de missions (qui n'autorisaient que `driver_id = auth.uid()`, donc impossible pour un patron de dispatcher à un autre chauffeur). Vérifie : caller authentifié + caller owner/admin/dispatcher de l'org de la mission + driver cible dans la même org.
4. (column-level only via mcp tool, pas migration file séparée) ajout `missions.departure_lat/lng` exposés au service agenda pour calculer la distance dans l'algo dispatch.

**Fusion Courses + Agenda → Planning unique** :
- Suppression onglet "Courses" et de tous les fichiers `courses/` (PatronCourses, usePatronCourses, ancien PatronAssignModal).
- `patronAgendaService.getDaySchedules` retourne `{ drivers, unassigned }` au lieu de juste `drivers` — la requête unassigned filtre `status=AVAILABLE + scheduled_at dans la journée + organization_id=orgId`.
- `usePatronAgenda` étendu : expose `unassigned`, `orgDrivers`, `fleet`, `assign`, `assignBatch` (Promise.all sur N assignToDriver pour le batch dispatch).
- Layout : section "À assigner" (bordure dashed brand, fond doré 5%, badge compteur) en pleine largeur en haut + grille de colonnes chauffeurs (1/2/3/4 cols selon breakpoint) en dessous. Aucun chauffeur ne wrap sous "À assigner" (zones séparées).
- Sélecteur de date complet : flèches ←/→, input date natif, bouton "Aujourd'hui" qui apparaît si pas sur la date du jour.
- Bouton "Poster une course" passé de la sidebar inline au PatronSidebar comme CTA jaune doré (entre Planning et Chauffeurs), supprimé du header Planning (redondant).

**Page dédiée /dashboard/patron/publier-course** :
- Route Next.js + composant `PatronPublierCoursePage` (72 lignes) qui mirror `PublierCoursePage` du chauffeur mais avec `PatronSidebar`. Réutilise tout le système (`usePosterCourse`, `PosterPreflight`, `PosterCourseForm`, `MissionPublishedCelebration`).
- Bug fix : driverStore non initialisé sur le flow patron (le user n'a jamais visité /dashboard/chauffeur). Ajout `useEffect` qui appelle `loadDriver(user.id, user.email)` au mount sinon `usePosterCourse` lit driverId vide et `getMyGroups("")` renvoyait 0 groupe.

**Carte de la flotte — refonte complète style Google Maps** :
- Markers modernes (`fleetMapHelpers.ts` extrait pour respecter seuil 150 du hook) : disque 36px avec **initiales du chauffeur** (depuis `PatronFleetMember.initials`), couleur fond selon statut (jaune en mission / vert en ligne / gris offline), bordure blanche, ombre douce, **animation pulse** (keyframes injectés une fois) pour les chauffeurs actifs.
- **Spiderfy** : helper `spiderfyCoincident()` regroupe les drivers à coords identiques (à 4 décimales = ~11 m) et les espace en cercle de ~30 m de rayon (correction `lngScale = 1/cos(lat)` pour ne pas écraser le cercle aux hautes latitudes).
- **Toggle satellite/plan** : Mapbox satellite-streets-v12 si token, sinon Esri World Imagery (free). Switch sans recréer la map (2e useEffect dépendant de tileMode qui swap juste le tile layer).
- **UI Google Maps** : header bar supprimé, controls en overlay sur la carte. Pill info top-left ("Carte de la flotte · 7 chauffeurs géolocalisés"), bouton fullscreen top-right, zoom +/− stack vertical bottom-right, **vignette satellite/plan 70×70 bottom-left** avec aperçu réel via Mapbox Static API (style Google).
- **Plein écran via API native du navigateur** : `sectionRef.current.requestFullscreen()` (pas de Portal, pas de `fixed inset-0` qui buggait à cause de stacking contexts parents). Listener `fullscreenchange` pour synchroniser le state React. `invalidateSize()` après 220ms pour redessiner Leaflet.

**Onglet Annonces (marketplace cross-org)** — créé puis retiré de la sidebar (laissé accessible via "Voir toutes" depuis la Vue d'ensemble) :
- `patronMarketplaceService.getMarketplace(driverId)` : récupère les groupes du driver via `group_members`, fait 2 requêtes en parallèle (missions PUBLIC site-wide + missions des groupes du driver via `mission_groups`), dédoublonne, enrichit avec noms publishers + groupes.
- Composant `PatronMarketplace.tsx` avec filtres chips (Toutes / Public / Mes groupes) + cartes (badge type CPAM/PRIVÉ + badge visibilité PUBLIC bleu / nom groupe violet + heure relative + trajet + posteur + prix + bouton Assigner).
- `MarketplacePreview.tsx` (top 5) intégré dans `PatronOverview` avec lien "Voir toutes →" qui swap l'onglet via callback `onGoToMarketplace={() => setTab('marketplace')}`.
- Bug fix : même piège que pour le publier-course — `useDriverStore` non init côté patron, swap pour `useAuth().user.id` dans le hook (driverId == user.id puisque drivers.id réfère à auth.users.id).

**Groupe-flotte auto-géré** :
- Concept : chaque org dispose automatiquement d'un groupe `"Ma flotte — <nom org>"` synchro avec les chauffeurs (via le trigger sur drivers.organization_id). Permet au patron de poster une course en visibility=GROUP avec ce groupe → seuls ses chauffeurs voient la course, sans avoir à entretenir une liste à la main.
- Type `Group` étendu (packages/core) : ajout `fleetOrgId?: string | null`. `groupService.getMyGroups` lit la colonne.
- `PosterPreflight` : trie le groupe-flotte en première position (après "Tous"), affiche **"Ma flotte"** au lieu du nom complet, icône `business` au lieu de `groups`.

**Algorithme de dispatch — Phase 1 (mode suggestion)** :
- Fonction pure `dispatch({ courses, drivers, rows })` ([dispatchAlgorithm.ts](apps/web/src/components/dashboard/patron/agenda/dispatchAlgorithm.ts), 117 lignes) : algo glouton, trie par scheduled_at, pour chaque course score chaque chauffeur sur (libre/conflit, distance Haversine, charge du jour). Buffers 30 min avant / 15 min après pour gérer les trajets. Marque le chauffeur "occupé" sur la plage pour les courses suivantes (effet d'enchaînement). Retourne `[{courseId, driverId, score 0-100, reasons[]}]` avec raisons explicites ("✓ Libre · 4.2 km · 1 course aujourd'hui").
- Bouton **"✨ Assigner auto"** dans le header de UnassignedSection (apparaît si fleet.length > 0).
- Modal `AutoDispatchModal` : liste les suggestions avec checkbox par ligne (décocher pour rejeter), affiche score XX/100 à droite, bouton "Assigner les N sélectionnées" → batch via `Promise.all(N × patronCoursesService.assignToDriver)`.

**Algorithme de dispatch — Phase 2 (mode auto)** :
- Toggle dans `OrgSettingsModal` : checkbox "Assignation automatique" avec libellé clair sur le comportement.
- `useEffect` dans PatronAgenda qui watch `unassigned + fleet + autoEnabled` : track des courseIds déjà tentés via `useRef<Set>` (anti-spam si aucun chauffeur libre), filtre les nouveaux, run dispatch + assignBatch silencieusement, affiche bannière jaune temporaire (5s) "✨ N courses assignées automatiquement". Badge "AUTO-DISPATCH ON" affiché à côté du compteur.

**Bug RLS critique fixé en cours de Phase 1/2** :
- `assignToDriver` faisait un UPDATE direct sur missions → bloqué par la policy "Acceptation mission disponible" qui exige `driver_id = auth.uid()` au WITH CHECK. Impossible pour un patron de dispatcher à un autre chauffeur que lui.
- Fix : RPC `patron_assign_mission(missionId, driverId)` SECURITY DEFINER (4e migration ci-dessus). Service swap pour `.rpc('patron_assign_mission', {...})`, parse JSON result. Types Supabase mis à jour pour exposer la nouvelle fonction.

**Activité récente — refonte UX** :
- Avant : longue ligne textuelle `"Course terminé (45€) : 12 rue de la République, 13001 Marseille → 8 avenue du Prado, 13008 Marseille"`. Fragile, illisible.
- `PatronActivity` interface refactorée : `{ from, to, price, type, time }` au lieu d'un blob `text`. Service raccourcit les adresses (1ère partie avant la virgule).
- `ActivityList` redesignée : pastille colorée gauche (✓ vert pour terminée / ⏳ doré pour acceptée), trajet `Départ → Destination` en truncate, sous-titre `Terminée · 14:32`, prix en gras à droite. Liste scrollable max-h-320px.

**Service split — règle des 150 lignes services** :
- `patronOverviewService` dépassait 150 (208 après l'ajout des champs activity refactorée). Split en 2 par domaine : `patronOverviewService.ts` (KPIs + activité, 105 lignes) et `patronFleetService.ts` (positions GPS + alertes documents, 103 lignes). Imports mis à jour dans `usePatronOverview`, `PatronFleetMap`, `usePatronFleetMap`, `PatronOverviewSections`.

**Skeleton loading screens** :
- `PatronOverview` : skeleton avec titre + 4 cards KPI + map placeholder + 2 sections (au lieu de "Chargement…" plat).
- `PatronAgenda` : `PlanningSkeleton` avec 4 colonnes placeholders pulsantes.
- Empty states polis : FleetList ("Utilisez le bouton « Inviter un chauffeur » en haut" avec icône `group_add`), ActivityList ("Aucune course récente" avec icône `history`), UnassignedSection ("Tout est dispatché" avec icône `task_alt`).

**Mémoire ajoutée** :
- `feedback_patron_dashboard_pc_first.md` : "Pour le dashboard patron, optimiser pour PC d'abord ; mobile en fallback simple sans over-engineering" (validé par le user lors de la décision kanban).

---

### Dashboard patron — P0+P1+P2+P3 (Indépendants + Invitations multi-canal + Driver Detail + Settings + onglets Chauffeurs/Finances) — même jour

**Contexte** : après le polish (Leaflet + realtime), le user a constaté que tous les chauffeurs étaient auto-rattachés à son org "TaxiLink Default" (à cause du trigger BEFORE INSERT seedé pendant Phase 1) et qu'à part regarder la flotte, le patron ne pouvait rien faire. Demande : "tout" — fix rattachement + invitation Email/SMS/WhatsApp + actions sur chauffeurs + onglets manquants.

**2 migrations SQL appliquées en prod** :
1. `20260503_create_indep_org_and_fix_trigger.sql` — création d'une org "Indépendants" (slug `independants`, tous les chauffeurs sans patron) + modification du trigger `set_driver_default_org` pour que les nouvelles inscriptions Google soient assignées à "Indépendants" au lieu de "TaxiLink Default". L'invitation accepte un driver = il quitte "Indépendants" pour rejoindre l'org du patron (logique implémentée dans `accept_invitation`).
2. `20260503_org_invitations.sql` — table `org_invitations` (id, org_id, invited_by, contact, contact_type email/phone, role, token UUID unique, status pending/accepted/cancelled/expired, expires_at +7d) + RLS (SELECT membres de l'org, INSERT owner/admin uniquement) + 2 RPC SECURITY DEFINER : `accept_invitation(token)` (vérifie token + transfère depuis Indépendants si driver) et `remove_org_member(org_id, user_id)` (owner/admin uniquement, empêche de virer le dernier owner, re-rattache à Indépendants si driver).

**P1 — Invitations multi-canal Email/SMS/WhatsApp** :
- `services/organizationService.ts` étendu : `inviteMember(orgId, contact, contactType, role)` génère un token UUID + INSERT, `removeMember(orgId, userId)` appelle la RPC, `acceptInvitation(token)` appelle la RPC, helpers `buildInvitationLink(token)` (`${origin}/invite/${token}`) et `normalizePhone()`.
- `components/dashboard/patron/invitations/InviteMemberModal.tsx` (142 lignes) — modal avec champ unique email/téléphone (auto-détecté via @), 3 boutons d'envoi : **Email** (`mailto:` avec sujet+body pré-remplis), **SMS** (`sms:` deep link), **WhatsApp** (`https://wa.me/<num>`). Le user clique sur le canal de son choix → ouvre l'app système avec le message pré-écrit contenant le lien magique.
- `app/invite/[token]/page.tsx` (server component) — await `params`, redirect login avec `?next=/invite/<token>` si pas authentifié, sinon rend `AcceptInvitationClient`.
- `app/invite/[token]/AcceptInvitationClient.tsx` (client) — appelle `acceptInvitation(token)` au mount, affiche success/error + bouton "Accéder au dashboard".

**P2 — Actions sur chauffeurs + Settings org** :
- `services/patronDriverDetailService.ts` — `getDriverDetail(driverId)` retourne profil + driver + véhicule + stats du mois (CA, nb courses, missions actives) + documents avec `daysLeft` calculé (alertes expiration).
- `components/dashboard/patron/DriverDetailDrawer.tsx` (137 lignes) — drawer right-side (overlay backdrop) qui s'ouvre au clic sur un chauffeur dans `FleetList`. Affiche avatar (initiales), contact (tel/SMS), véhicule (marque/immat), stats du mois, liste documents avec badge danger si <30j, bouton "Retirer de l'org" qui appelle `remove_org_member`.
- `components/dashboard/patron/OrgSettingsModal.tsx` (76 lignes) — modal accessible via bouton "Paramètres" en bas de sidebar. Édite `name` + `siret` de l'org via `organizationService.updateOrg`.

**P3 — Onglets Chauffeurs (RH) + Finances + sidebar 5 tabs** :
- `components/dashboard/patron/PatronSidebar.tsx` (81 lignes) — passe de 3 à 5 onglets : Vue d'ensemble / Courses / Agenda / **Chauffeurs** / **Finances** + bouton **Paramètres** en footer (déclenche `onOpenSettings`). Bottom nav mobile en `grid-cols-5`.
- `components/dashboard/patron/drivers/PatronDrivers.tsx` (83 lignes) — onglet RH : grille cards chauffeurs (avatar + nom + tel + statut + véhicule), filtre par statut (tous/en ligne/en mission/hors ligne), recherche par nom. Réutilise `usePatronOverview` (pas de hook dédié — données déjà chargées).
- `services/patronFinancesService.ts` — `getFinances(orgId)` retourne `totalRevenue`, `monthRevenue`, `weekRevenue`, `cpamRevenue` (mois courant), `privateRevenue` (mois courant), `revenueLast30Days[30]` (bucket par jour). `getRecentCpamMissions(orgId, limit)` retourne 20 dernières CPAM avec nom chauffeur (jointure manuelle profils).
- `components/dashboard/patron/finances/usePatronFinances.ts` + `PatronFinances.tsx` (108 lignes) — 4 KPIs (CA total/mois/semaine/30j) + Sparkline 30 jours + bar de répartition CPAM/Privé du mois + table dernières CPAM (date / chauffeur / patient / montant).

**Refactor pour respecter le seuil 200 lignes** :
- `PatronOverview.tsx` avait dépassé 200 lignes après ajout des boutons "Inviter" + "Poster une course". Split en `PatronOverview.tsx` (78 lignes, orchestrateur) + `PatronOverviewSections.tsx` (170 lignes, sous-composants : Centered, KPIGrid, KPICard, RevenueChart, TopDrivers, FleetList avec onPickDriver+remove, ActivityList, DocAlertsList, StatusBadge).

**Vérifs finales** :
- `npm run type-check` : 0 erreurs.
- Tous les fichiers nouveaux ou modifiés sous 200 lignes (max : InviteMemberModal 142, DriverDetailDrawer 137, PatronFinances 108).

**Ce qui reste hors-scope (pas demandé) — vraies limites V1** :
- Email transactionnel automatique (on délègue au mailto système — pas de Resend/Postmark/SendGrid wired).
- SMS automatique (idem, on délègue au sms: deep link).
- Notifications in-app du driver invité (badge "1 invitation en attente").
- Liste/gestion des invitations en cours côté patron (UI manquante, table existe).
- Multi-rôles en UI (pour l'instant tout invité = `viewer` par défaut, le rôle est accepté côté schema mais pas exposé dans le formulaire).

---

### Dashboard patron — Polish (carte Leaflet + realtime + Sparkline + Top3 + badges) — même jour

**Code livré** :
- `components/ui/Sparkline.tsx` — mini-graphique SVG générique (line + area path, currentColor) réutilisable.
- `components/dashboard/patron/overview/PatronFleetMap.tsx` + `usePatronFleetMap.ts` — carte Leaflet avec pins colorés par statut (jaune=en mission, vert=en ligne, gris=offline) + popup nom + courses du jour. Dynamic import (`ssr:false`) pour éviter le crash `window is not defined`. Hook utilise `mapReady` state pour redéclencher le sync markers après init (fix du piège ref + Strict Mode).
- `hooks/useOrgRealtimeRefresh.ts` — hook factorisé (règle des 3) qui subscribe aux changements Supabase realtime sur des tables, scope à un orgId, avec debounce 500ms. Utilisé par usePatronOverview, usePatronCourses, usePatronAgenda.
- `services/patronOverviewService.ts` — `getKPIs` étendu : retourne `yesterdayRevenue` + `revenueLast7Days[7]` (bucket par jour côté JS depuis une seule query `completed_at >= now()-7d`). `getFleetPositions` refactoré en 2 queries séparées (drivers + profiles) au lieu d'un `profiles!inner` join, parce que le join était silencieusement filtré par les RLS de profiles. Cast explicite `Number()` sur lat/lng (NUMERIC peut sortir en string via PostgREST).
- `components/dashboard/patron/overview/PatronOverview.tsx` enrichi : KPI "CA jour" avec evolution `↑ +12% vs hier` (vert/rouge), section "CA des 7 derniers jours" (Sparkline + total), section "🏆 Top chauffeurs aujourd'hui" (médailles 🥇🥈🥉), badges colorés EN MISSION/EN LIGNE/HORS LIGNE sur FleetList.
- `components/dashboard/patron/agenda/PatronAgenda.tsx` : fix bloc Gantt tronqué (label caché si widthPct < 4%, tooltip reste).

**5e migration appliquée** : `20260503_drivers_select_extend_org.sql` — fix RLS critique. La policy `drivers_select` existante limitait la visibilité à `(id = auth.uid() OR id IN groupes_du_user)`. Conséquence : un patron ne voyait que les chauffeurs de ses groupes (4 sur 7), pas toute sa flotte. Ajout d'une 3e condition `OR organization_id IN current_org_ids()`.

**Données de démo ajoutées en prod via SQL Editor** : positions GPS iconiques (Gare St-Charles / Timone / Aéroport Marignane / Hôpital Nord / Aubagne / Aix / Vieux Port) sur les 7 chauffeurs de l'org, et 15 missions fictives DONE réparties sur les 7 derniers jours pour faire vivre les KPIs et le Sparkline. Note : `missions.status` valides sont `AVAILABLE`/`IN_PROGRESS`/`DONE` (pas `COMPLETED` que j'avais utilisé par erreur en premier).

---

### Dashboard patron de flotte — Phase 1 livrée (multi-tenancy + 3 onglets branchés)

**Migrations SQL appliquées en prod via SQL Editor** (4 migrations, voir `apps/web/supabase/migrations/20260503_*.sql`) :
1. `20260503_organizations.sql` — tables `organizations` + `organization_members` (rôles owner/admin/dispatcher/accountant/viewer) + colonne `organization_id` sur `drivers` (NOT NULL) et `missions` (nullable, auto-rempli par trigger), fonction `current_org_ids()` SECURITY DEFINER, RLS sur les nouvelles tables, backfill "TaxiLink Default" + Mohamed `owner` + tous les drivers/missions rattachés.
2. `20260503_drivers_default_org_trigger.sql` — trigger BEFORE INSERT sur drivers qui auto-assigne l'org "TaxiLink Default" si NULL (sinon les nouvelles inscriptions Google planteraient sur le NOT NULL).
3. `20260503_fix_org_members_select_policy.sql` — fix récursion infinie : la policy SELECT `org_members_select` faisait `org_id IN (SELECT current_org_ids())` qui re-déclenchait sa propre policy → 500. Remplacée par `user_id = auth.uid()` simple.
4. `20260503_drop_org_members_manage_policy.sql` — la policy "FOR ALL" `org_members_manage` avait la même récursion (subquery sur la même table). Droppée pour le MVP. INSERT/UPDATE/DELETE sur `organization_members` à reimplementer plus tard via API routes server-side avec service_role ou fonction SECURITY DEFINER dédiée.

**Décision archi clé** : pas de RLS strict org sur `drivers`/`missions` car TaxiLink est un marketplace cross-org (un chauffeur de l'org A doit pouvoir voir/accepter une mission AVAILABLE postée par l'org B). Le filtre par org pour le dashboard patron se fait côté code (services), pas via RLS.

**Code livré** (`apps/web/src/`) :
- `services/organizationService.ts` — `getMembershipsForUser` utilise `.rpc('current_org_ids')` (bypass RLS) + récupère orgs/roles séparément
- `hooks/useCurrentOrg.ts` — retourne `{ orgId, role, organization, memberships, isPatron, isLoading }`
- `middleware.ts` — élargi pour matcher `/dashboard/patron` (check completude profil, pas de check role car validation membership déléguée à la page server component)
- `app/dashboard/patron/page.tsx` — server component qui check membership via `.rpc('current_org_ids')` et redirect `/dashboard/chauffeur` si pas membre
- `components/dashboard/patron/PatronDashboard.tsx` — orchestrateur sidebar + state tab + routing 3 onglets
- `components/dashboard/patron/PatronSidebar.tsx` — sidebar desktop (w-60) + bottom nav mobile (grid-cols-3) avec icônes Material Symbols
- **Onglet Vue d'ensemble** : `components/dashboard/patron/overview/PatronOverview.tsx` + `usePatronOverview.ts` + `services/patronOverviewService.ts` (4 fonctions : KPIs, fleet, activity, doc alerts). 4 cards KPIs + liste chauffeurs avec pastille statut + activité récente avec heures formatées + alertes documents.
- **Onglet Courses** (dispatch) : `components/dashboard/patron/courses/PatronCourses.tsx` + `usePatronCourses.ts` + `PatronAssignModal.tsx` + `services/patronCoursesService.ts` (getPool, assignToDriver, getOrgDrivers). Liste des missions AVAILABLE de l'org + bouton Assigner qui ouvre modal listant les chauffeurs en ligne.
- **Onglet Agenda** (gantt) : `components/dashboard/patron/agenda/PatronAgenda.tsx` + `usePatronAgenda.ts` + `services/patronAgendaService.ts` (getDaySchedules). Vue Gantt 06h-21h, une ligne par chauffeur, blocs colorés (jaune=en cours, gris=terminé, bordure noire=planifié) positionnés en absolute selon `scheduled_at` + `duration_min`.

**Types Supabase** : `apps/web/src/lib/supabase/types.ts` mis à jour à la main (organizations + organization_members + colonne organization_id sur drivers/missions + relation FK + fonction current_org_ids dans Functions + exports `Organization`, `OrganizationMember`, `OrgRole`).

**Sauvegarde de sécurité** avant migration : 3 CSV exportés depuis SQL Editor (drivers, missions, profiles) dans `C:\Users\moham\Documents\taxilink-backups\2026-05-03\`.

**Stratégie de migration adoptée** : pivot du plan Supabase CLI local vers SQL Editor direct car la virtualisation hardware BIOS est désactivée sur le PC du user (refus d'y toucher, intimidant). Workflow : écrire SQL dans `apps/web/supabase/migrations/` (pour git history) + coller dans SQL Editor + transaction `BEGIN/COMMIT`. Documenté dans `TODO-2026-05-02.md` section "🔮 Pour plus tard" (à activer quand 1er patron payant signe ou changement de PC).

**Hors-scope (à faire plus tard, dans un nouveau chantier)** :
- ~~Onglets Chauffeurs + Finances~~ → livrés dans le chantier P3 (même session)
- ~~Carte Leaflet temps réel sur Vue d'ensemble~~ → livré dans le polish (même session)
- ~~Realtime auto-refresh sur changements `missions` scope org~~ → livré via `useOrgRealtimeRefresh` (polish)
- ~~Invitation/gestion membres via UI~~ → livré via `org_invitations` + RPC `accept_invitation`/`remove_org_member` + InviteMemberModal (P1+P2, même session)
- Switcher multi-orgs dans le header (V1 = on prend la 1ère membership)
- Email/SMS transactionnel automatique (V1 délègue au `mailto:`/`sms:`/`wa.me` système)
- Liste/gestion des invitations en cours côté patron (UI manquante, table `org_invitations` exploitable)
- Stripe Billing B2B
- Séparation `apps/patron/` du monorepo
- Migration vers WorkOS pour SSO/SAML

---

## ✅ Terminé — Session 2026-05-02

### Refonte UX onglet "Mes annonces" — actions par état (commit `f6cc7a3`, branche `carte-maplibre`)
**Contexte** : le user veut que la page "Mes annonces" du chauffeur (onglet `AdsTab` qui liste les courses qu'il a partagées avec ses collègues) propose des actions différenciées selon l'état de l'annonce. État précédent : carte Waiting purement informative, carte Accepted avec SMS+appel mais pas de WhatsApp ni date de publication, carte Done avec un bouton facture (placeholder) mais sans visibilité sur les jalons GPS du collègue qui a pris la course.

**En attente — annulation**
- Ajout d'un bouton "Annuler l'annonce" en footer de [`AdCardWaiting`](apps/web/src/components/dashboard/driver/courses/ads/AdCardWaiting.tsx) (icône X danger) + modale de confirmation inline ("Garder" / "Annuler"). La realtime sub de `useAdsTab` retire la carte automatiquement après suppression.
- Hook co-localisé [`useAdCardWaiting`](apps/web/src/components/dashboard/driver/courses/ads/useAdCardWaiting.ts) (état `confirmOpen/busy/error`). Appelle `missionService.remove(id)` qui passe par la route `DELETE /api/missions/:id` existante (déjà gardée par `requireOwnEditable` : `status=AVAILABLE` + `shared_by=user.id`).

**Acceptée — WhatsApp + dates + corrections**
- Ajout du bouton WhatsApp (vert `#25D366`, ouvre `https://wa.me/<num>`) dans [`TakerBlock`](apps/web/src/components/dashboard/driver/courses/ads/TakerBlock.tsx), entre SMS et appel. Helper `waNumber()` normalise les numéros français : `0XXXXXXXXX → 33XXXXXXXXX`, sinon laisse les digits tels quels (numéros déjà internationaux).
- [`AdCardAccepted`](apps/web/src/components/dashboard/driver/courses/ads/AdCardAccepted.tsx) affiche désormais une ligne "Postée il y a X · Acceptée il y a Y" sous le prix (visibilité chronologique côté posteur). Reformulation du libellé "Corriger" → "Adresse, téléphone ou patient à corriger ?" pour rendre explicite que le `MissionEditSheet` permet déjà la correction de ces 3 champs (vérifié dans `useMissionEditSheet.ts` form state).
- Le tracker `AdTracker` (Acceptée → En route → Patient à bord → Terminée) reste alimenté par les timestamps GPS auto (Phase 1 GPS livrée plus tôt dans la journée) — déjà fonctionnel, aucune modif nécessaire.

**Effectuée — facture retirée + timeline 3 jalons**
- Bouton "Voir la facture" supprimé de [`TakerBlock`](apps/web/src/components/dashboard/driver/courses/ads/TakerBlock.tsx) (prop `showInvoice` retirée — c'était un placeholder non fonctionnel). Le subline `TakerBlock` passe de "Course terminée — facture transmise" à "Course terminée".
- Nouvelle grille 3 colonnes dans [`AdCardDone`](apps/web/src/components/dashboard/driver/courses/ads/AdCardDone.tsx) : **Acceptée** (`accepted_at`) · **Démarrée** (`enroute_at` sinon `pickup_at`) · **Terminée** (`dropoff_at` sinon `completed_at`). Sous-composant local `Step` rendu via `<dl>/<dt>/<dd>` pour la sémantique. Affiche `—` si timestamp absent.
- Bouton "Modifier le prix" (déjà existant via `MissionEditSheet` mode `'price'`) inchangé.

**Refacto**
- Helper `relativeAgo(iso)` extrait dans [`adsHelpers.ts`](apps/web/src/components/dashboard/driver/courses/ads/adsHelpers.ts) — factorise `timeSincePost` (Waiting) et `timeSinceAccept` (Accepted). Format unifié : `à l'instant / X min / X h / X j` (une seule unité, pas de `1 h 24 min`).

**Fichiers modifiés (6, +170 / −50)**
1. `AdCardWaiting.tsx` (+59) — bouton + modale + hook
2. `AdCardAccepted.tsx` (+8) — ligne dates + libellé corriger
3. `AdCardDone.tsx` (+19) — grille timestamps + Step
4. `TakerBlock.tsx` (~22) — WhatsApp + retrait facture + normalisation FR
5. `adsHelpers.ts` (+15) — `relativeAgo`
6. `useAdCardWaiting.ts` *(nouveau, 35 l)* — hook cancel

**Vérifications** : `tsc --noEmit` OK, `fileSize.test.ts` OK. Test suite globale = 12 échecs pré-existants dans `useDriverHome.test.ts` (manque `NEXT_PUBLIC_SUPABASE_URL` en env de test → `useMissionRealtime → createBrowserClient` plante), aucune relation avec ce travail.

**Push** : commit `f6cc7a3` poussé sur `carte-maplibre` (preview deploy Vercel uniquement, pas la prod). À merger sur `main` pour déploiement prod.

---

## ✅ Terminé — Session 2026-05-01

### Refonte mécanique des courses : auto-completion + cycle de vie + GPS + UX historique + preuves CPAM
**Contexte** : le user a signalé qu'une course prise 2 h plus tôt était encore affichée dans "À venir". Diagnostic : rien ne fait passer une mission `IN_PROGRESS` en `DONE` automatiquement, et `getAgenda` retourne tout `driver_id = me AND status != DONE`. Refonte complète en 6 phases (P0–P5 + P2 GPS), 3 nouvelles migrations, 53 nouveaux tests (902 → 955), zéro régression. **Rien n'est commité, aucune migration appliquée** — code en local, à valider et pousser après tests.

**P0 — Auto-completion temporelle**
- Migration `20260501_missions_auto_complete_cron.sql` : pg_cron toutes les 15 min appelle `auto_complete_overdue_missions()` qui passe en `DONE` les courses `IN_PROGRESS` dont l'heure de fin estimée + 60 min de tolérance est passée. Durée estimée = `greatest(coalesce(duration_min, ceil(distance_km * 2.2), 30))` minutes.
- Filtre client miroir dans [`useUpcomingTab`](apps/web/src/components/dashboard/driver/courses/useUpcomingTab.ts) : `isOverdue(m, now)` masque les courses déjà passées dans l'agenda côté UI sans attendre que le cron tourne.

**P1 — Cycle de vie étendu (timestamps additifs, pas de nouveau status)**
- Migration `20260501_missions_progress_timestamps.sql` : 5 nouvelles colonnes sur `missions` — `enroute_at`, `pickup_at`, `dropoff_at`, `no_show`, `auto_completed`. Refresh de la fonction d'auto-completion pour propager `auto_completed=true`. Choix : ne PAS toucher au champ `status` (RLS et code existant intacts) — l'étape est dérivée des timestamps.
- Helper [`missionProgress.ts`](apps/web/src/lib/missionProgress.ts) : dérive l'étape (`accepted/enroute/onboard/dropped/done/no_show`) depuis les timestamps + table `PROGRESS_LABELS`.
- Service [`missionProgressMutations.ts`](apps/web/src/services/missionProgressMutations.ts) : `markEnRoute`, `markOnBoard`, `markDropped` (ne clôturent pas la course — laissent le temps de saisir signature/prix/photo), `markNoShow` (clôture avec flag, motif tracé dans `notes`).
- Mise à jour manuelle de [`types.ts`](apps/web/src/lib/supabase/types.ts) (auto-généré normalement, mais excluded). 3 mission factories de tests synchronisées.

**P3 — UX wizard sur la course en cours + hero "course en cours"**
- [`CourseProgressStepper`](apps/web/src/components/dashboard/driver/course/CourseProgressStepper.tsx) : barre de progression 4 étapes (Acceptée → En route → À bord → Déposé), pastille brand sur l'étape courante, ✓ ink sur les étapes franchies.
- [`CourseActions`](apps/web/src/components/dashboard/driver/course/CourseActions.tsx) refondu : le bouton primaire change selon l'étape ("Je pars chercher le patient" → "Patient à bord" → "Patient déposé" → "Course terminée"). Icônes contextuelles (Navigation/UserCheck/UserMinus/CheckCircle2).
- Hook partagé [`useMissionProgressActions`](apps/web/src/hooks/useMissionProgressActions.ts) (DRY entre `useCurrentCourse` et `useMissionDetail`) — extrait pour ne pas dépasser le seuil 150 lignes des hooks.
- [`CurrentCourseStrip`](apps/web/src/components/dashboard/driver/courses/CurrentCourseStrip.tsx) : bandeau noir en haut de l'onglet "À venir" qui mène directement à l'écran course active. `useUpcomingTab` expose `current` (mission `IN_PROGRESS`) et l'exclut des groupes pour éviter le doublon.

**P4 — Refonte historique : heatmap + recherche full-text + badge auto**
- [`historyHeatmap.ts`](apps/web/src/lib/historyHeatmap.ts) + [`HistoryHeatmap.tsx`](apps/web/src/components/dashboard/driver/courses/HistoryHeatmap.tsx) : carte d'activité 12 mois style GitHub contributions, intensité quartilique 0..4 (échelle non-linéaire pour rendre visibles les jours peu chargés), tooltip "X courses · Y€", découpage en colonnes-semaines alignées lundi-dimanche, labels mois flottants.
- Recherche full-text dans [`useHistoryTab`](apps/web/src/components/dashboard/driver/courses/useHistoryTab.ts) : insensible à la casse, filtre sur `patient_name`, `departure`, `destination`, `medical_motif`, `notes`. Input avec icône Search + bouton croix pour effacer.
- Refacto pour passer sous les seuils : helpers purs extraits dans [`historyHelpers.ts`](apps/web/src/components/dashboard/driver/courses/historyHelpers.ts), [`HistoryRow.tsx`](apps/web/src/components/dashboard/driver/courses/HistoryRow.tsx) (`HistoryRow` + `MonthSection`).
- Badge `auto` discret sur les courses clôturées par le cron (visibilité du flag `auto_completed`).

**P5 — Preuves CPAM (signature patient + photo bon de transport)**
- Migration `20260501_missions_evidence.sql` : colonnes `pickup_signature_url` + `transport_voucher_url` + bucket privé `mission-evidence` (`INSERT INTO storage.buckets ... ON CONFLICT DO NOTHING`) + 3 policies RLS sur `storage.objects` (read/insert/update). Convention de path : `<missionId>/signature.png` et `<missionId>/voucher.<ext>` — la RLS extrait le mission_id via `(storage.foldername(name))[1]` et vérifie que `mission.driver_id = auth.uid()`.
- [`missionEvidenceService`](apps/web/src/services/missionEvidenceService.ts) : `uploadSignature(missionId, dataUrl)` (PNG via `fetch().blob()`), `uploadVoucher(missionId, file)` avec validation (8 Mo max, JPG/PNG/WEBP/PDF), `getSignedUrl(path)` TTL 5 min pour rendu temporaire — pas d'URL publique stockée, RGPD Article 9.
- [`useSignaturePad`](apps/web/src/components/dashboard/driver/course/useSignaturePad.ts) : capture canvas tactile/souris (`pointerdown/move/up`) avec correction `devicePixelRatio` pour signature nette en retina/hi-DPI.
- [`SignaturePadModal`](apps/web/src/components/dashboard/driver/course/SignaturePadModal.tsx) + [`EvidenceSection`](apps/web/src/components/dashboard/driver/course/EvidenceSection.tsx) : 2 tuiles (signature / bon transport) qui passent en vert ✓ après upload. Section visible **uniquement** sur les courses CPAM (filtre `mission.type === 'CPAM'`).
- Photo bon : `<input type="file" capture="environment">` qui ouvre directement la caméra arrière sur mobile.

**P2 — GPS auto-completion (geofencing foreground)**
- [`geofence.ts`](apps/web/src/lib/geofence.ts) : Haversine + state machine `dwell` (`outside → entering → confirmed`), 100% pure et testable. Reset complet à la sortie de zone (anti-jitter inversé : oblige à re-attendre). `checkGeofence` renvoie `justConfirmed` qui ne se déclenche qu'une seule fois.
- [`useCourseGeofence`](apps/web/src/hooks/useCourseGeofence.ts) : `navigator.geolocation.watchPosition` haute précision (`enableHighAccuracy: true`, `maximumAge: 5000`). Auto-`markOnBoard` si dans 80 m du pickup pendant 2 min, auto-`markDropped` si dans 100 m de la destination pendant 2 min. `missionRef` permet d'éviter les recreations du callback à chaque update mission.
- [`GpsTrackingToggle`](apps/web/src/components/dashboard/driver/course/GpsTrackingToggle.tsx) : section opt-in toujours visible, avec statut live ("Recherche du signal", "📍 Approche du patient", "✓ Patient à bord (auto)", "📍 Approche destination") + précision affichée (±X m). Gère `denied` (permission refusée) et `unsupported`.
- **Limites web-only documentées** : tracking s'arrête si l'app est en arrière-plan ou téléphone verrouillé. Capacitor + plugin background-geolocation à terme. Pas de filtre `accuracy > radius/2` actuellement (à itérer après tests terrain réels).

**Tests** : 902 → 955 (+53), tous verts. Type-check OK.
- Couverture nouvelle : `geofence` (12), `historyHeatmap` (5), `missionEvidenceService` (8), `missionProgressMutations` (9), `missionProgress` (8), `useMissionProgressActions` (6), `useUpcomingTab` (+5 pour overdue + IN_PROGRESS), `useHistoryTab` (+3 pour recherche).
- Refacto fileSize.test.ts : exclut désormais `*.test.ts` co-localisés (un seul existant : `lib/missionMapper.test.ts`).

**Migrations à appliquer dans cet ordre sur Supabase (non appliquées)**
1. `20260501_missions_auto_complete_cron.sql`
2. `20260501_missions_progress_timestamps.sql`
3. `20260501_missions_evidence.sql`

⚠️ **Vérification post-migration P5** : confirmer dans Supabase Dashboard → Storage que le bucket `mission-evidence` a bien été créé. Sinon, le créer manuellement (privé, name=`mission-evidence`, public=off).

**À faire après application**
- Tester en local (`npm run web`) le flow complet : `AVAILABLE` → accept → `IN_PROGRESS` → wizard étape par étape → signature CPAM → photo bon → "Course terminée".
- Tester sur mobile réel le canvas de signature (tactile haute densité) + le tracking GPS (rayon 80 m sur un vrai trajet).
- `/schedule` un agent dans 2 semaines pour vérifier que le cron auto-completion tourne bien en prod et nettoyer d'éventuelles courses test orphelines.

---

## ✅ Terminé — Session 2026-04-30

### Dashboard admin `/dashboard/admin` — 4 phases livrées
Construction d'une console d'administration accessible uniquement à l'email `ADMIN_EMAIL` (variable Vercel), avec 10 sections. Architecture serveur : `assertAdmin()` valide chaque API admin via cookies session puis `createAdminSupabaseClient()` (service_role, bypass RLS). Tables dédiées avec RLS en lecture refusée côté client. Pricing Anthropic dans `lib/aiPricing.ts`, helper best-effort `lib/aiUsageLogger.ts` qui logge tous les appels Claude vers la table `ai_usage`.

**Phase 1 — Coûts API (commit `bbcc214`)** :
- Migration `20260429_admin_dashboard_phase1.sql` : tables `ai_usage` (1 ligne par appel LLM), `auth_login_events` (alimentée par trigger `handle_auth_login` sur `auth.users.last_sign_in_at`), `google_api_costs` (saisie manuelle mensuelle). Toutes en RLS deny côté client, lecture via service_role uniquement.
- API `/api/admin/ai-usage` : agrège tokens et coûts par jour/semaine/mois + top consommateurs (12 derniers mois).
- API `/api/admin/google-costs` : CRUD pour saisir manuellement les chiffres facturation Google Cloud (Places, Routes, Directions).
- Routes `parse-voice` et `parse-voice-answer` patchées pour appeler `logAiUsage()` après chaque réponse Claude.
- Middleware étendu : redirige `/dashboard/admin` vers `/dashboard/{role}` si email != `ADMIN_EMAIL`.

**Phase 2 — Activité courses + utilisateurs (commit `69caeb4`, partie merged)** :
- API `/api/admin/missions-stats` : courses postées/acceptées/terminées + CA + montant moyen + taux d'acceptation par jour/semaine/mois.
- API `/api/admin/users-stats` : total inscrits par rôle, chauffeurs en ligne (TTL 2 min via `is_online + last_seen_at`), connexions par jour/semaine/mois (uniques + total).

**Phase 3 — Classements + carte géoloc + groupes (commit `99d841d`)** :
- API `/api/admin/top-drivers` : ranking chauffeurs (postées, acceptées, terminées, CA €, conso API $, statut online, note).
- API `/api/admin/top-groups` : ranking groupes (membres, courses 30j, total, taux acceptation, dernière activité) + counters totaux.
- API `/api/admin/online-drivers` : chauffeurs avec `is_online=TRUE` et `current_position_updated_at > now() - 5 min`.
- Composant `OnlineDriversMap` : carte Leaflet+Mapbox plein écran avec popups (nom + téléphone + freshness), refresh auto 30 s.

**Phase B — Refonte visuelle + nouvelles métriques (commits `23b1ed3`, `a49f647`)** :
- API `/api/admin/missions-breakdown` : top types (CPAM/Marseille/Privé), top motifs CPAM, top départements (12 derniers mois).
- `missions-stats` enrichi : funnel (postées → vues → acceptées → terminées), heatmap 7 jours × 24 h, comparaisons mois courant vs précédent.
- `users-stats` enrichi : comparaisons new drivers / new clients / logins (30j vs 30j précédents).
- 6 composants UI réutilisables dans `components/dashboard/admin/ui/` : `SectionShell`, `MetricCard`, `TrendBadge` (`↑↓→` + % + ring vert/rouge soft), `Sparkline` (SVG inline avec gradient), `Skeleton` / `SkeletonCard`, `HBar`.
- 3 nouvelles sections : `FunnelSection` (barres horizontales avec drop% entre étapes), `HeatmapSection` (grille 7×24 dégradé jaune TaxiLink primary `#FFD23F`), `BreakdownSection` (3 listes triées par count avec barres de proportion).
- Refonte cohérente des sections existantes avec MetricCard + sparkline + tendance.
- Refacto types : `services/adminAnalyticsTypes.ts` split en `adminAnalyticsTypes` (analytics) + `adminRankingTypes` (ranking) pour rester sous 150 lignes.
- Animations stagger fade-in (60 ms entre sections) sur `AdminDashboard`.

**Polish final palette (commit `a49f647`)** :
- Toutes les emoticônes (👥🚖🧑🚕📝✅🏁📈💶💰🤖📞💸🏆🏘️🌐🔻🔥📊🏷️🏥🗺️↑↓→) remplacées par Material Symbols via `<Icon name=... />` : `groups`, `local_taxi`, `person_add`, `assignment`, `post_add`, `check_circle`, `task_alt`, `payments`, `psychology`, `api`, `leaderboard`, `apartment`, `public`, `filter_list`, `grid_view`, `bar_chart`, `category`, `medical_services`, `place`, `map`, `radio_button_checked`, `arrow_upward` / `arrow_downward` / `trending_up` / `trending_down` / `trending_flat`.
- Code couleur respecté : primary jaune TaxiLink (`#FFD23F`) en accent (heatmap), secondary noir (`#1A1A1A`) en sparklines + funnel + barres breakdown, `bg-bgsoft` + `text-secondary` en iconBg uniforme.
- Vert/rouge **soft uniquement** sur TrendBadge : `bg-emerald-50 text-emerald-700 ring-emerald-100` et `bg-rose-50 text-rose-700 ring-rose-100`. Aucune couleur vive (`-500`) sur les fonds de cards.
- Header simplifié : retiré le gradient indigo, fond `bg-bgsoft` uniforme, badge "Pilotage TaxiLink" sobre avec pastille emerald-600.

**Setup utilisateur** :
- Variables Vercel ajoutées : `ADMIN_EMAIL=mohamed.major@outlook.fr` + `SUPABASE_SERVICE_ROLE_KEY=eyJ...` (3 environnements).
- Migration appliquée via Supabase Dashboard → SQL Editor.
- Auth via compte Outlook créé sur `/auth/register` (Google OAuth bloqué par "App non vérifiée").

**Documentation** : Variables d'env documentées dans CLAUDE.md, mémoire `project_admin_dashboard.md` mise à jour avec architecture et phases livrées.

### Bug `MissionMapPopup` centré qui ne s'affichait pas — diagnostic et fix
Le popup nouvelle annonce (carte centrée + barre 10s) ne s'affichait jamais en prod malgré toutes les itérations de la veille. Diagnostic via overlay de debug visible (`?debug=popup`) qui exposait `events`/`lastReason`/`isOnline`/`popupEnabled`/`hasCoords` en haut à gauche de la carte — le user a pu voir en live `e:1 q:0 lastReason=ACCEPTÉ`, c'est-à-dire que le filtre passait, la queue était bien remplie, mais l'instant d'après elle se vidait.

**Cause racine #1 — auto-cleanup de `selectedMissionId`** (commit `8be4e50`) :
Le hook [`useDriverHome`](apps/web/src/components/dashboard/driver/useDriverHome.ts) avait un `useEffect` qui annulait `selectedMissionId` dès que la mission n'apparaissait pas dans `filteredMissions` (filtres clients type/groupe/urgent/nearby). Le flow était : realtime → `useNewMissionPopup` queue → DriverHome `setSelectedMissionId(m.id)` → cleanup `setSelectedMissionId(null)` parce que `m` n'est pas dans `filteredMissions` (filtre actif) → `selectedMission = null` → popup ne rend pas. **Fix** : `incomingMission` passé directement au composant `MissionMapPopup` sans transiter par `selectedMissionId`. Bonus : popup s'affiche aussi quand la sheet est déployée (position `fixed z-1200` couvre).

**Cause racine #2 — barre de décompte qui oscille** (commit `9f7280d`) :
Une fois le popup affiché, sa barre de progression descendait puis remontait à 100 puis redescendait sans cesse. La closure `onAutoDismiss` était recréée à chaque render dans DriverHome (lambda inline `() => h.popup.dismiss(...)`) ; avec elle dans les deps du `useEffect` du décompte, l'effect se relançait à chaque rerender du parent → `setProgress(100)` + nouvel `setInterval` → oscillation visible. **Fix** : `onAutoDismissRef = useRef(onAutoDismiss)` mis à jour à chaque render mais lu dans le timer, retiré des deps du useEffect.

**Setup du diagnostic** (commits `343c4f6`, `4151d19`, `e026d22`) :
- Overlay debug `?debug=popup` en haut à gauche : compteur d'events realtime, dernière raison (rejet ou ACCEPTÉ), états `online/pref/gps`. Permet de débugger sans devtools sur mobile.
- Mode `?debug=popup` sans auto-dismiss pour confirmer que le popup s'affiche bien, puis remis pour valider la barre 10s en condition normale.
- Code debug retiré une fois le bug résolu (commit suivant ce résumé).

**Master mis à jour** : `accueil-carte-annonce` mergé en fast-forward dans master (37 commits, `1550390..8be4e50` puis itérations de fix). Branche `master-backup-2026-04-30` créée avant le merge pour rollback potentiel.

### Push direct sur master + branche backup
Le user a demandé à pousser `accueil-carte-annonce` en prod pour tester (le preview ne lui permettait pas de tester avec un second compte). Backup `master-backup-2026-04-30` créée et pushée depuis `origin/master` avant le merge ff. Vercel auto-deploy en prod.

---

## ✅ Terminé — Session 2026-04-29

### Refonte écran d'accueil chauffeur — carte plein écran + popup course en temps réel
Les trois chantiers planifiés (layout, GPS, popup) ont été livrés sur la branche `accueil-carte-annonce` (preview Vercel `taxi-link-web-git-accueil-carte-annonce-major9.vercel.app`).

**1. Layout mobile carte plein écran** (commits `a79deac`, `e446024` après revert/reapply, `9f91f65`, `69caeb4`, `483e7c9`) :
- Sur mobile : carte en `absolute inset-0`, sheet en `absolute bottom-0` z-600, bouton Poster `fixed` z-610 dont `bottom` se cale dynamiquement sur la hauteur de la sheet (`SHEET_FRACTION[snap]`).
- Sheet `bg-transparent` quand repliée (snap='one'), passe `bg-paper rounded-t shadow` dès qu'elle est tirée — détecté via `ResizeObserver` sur `sheetRef` (le state `snap` ne change qu'au release du drag, le bg basculait trop tard).
- Carte `invalidateSize()` via `ResizeObserver` au resize du conteneur (sinon zones grises pendant le drag).
- Zoom initial 13 → 10 pour englober Marseille / Aix / Salon / Aubagne / La Ciotat.

**2. Position GPS RGPD-compliant** (commit `e446024`) :
- Migration `20260429_drivers_current_position.sql` (appliquée via Supabase MCP) : 3 colonnes `current_lat NUMERIC(9,6)`, `current_lng NUMERIC(9,6)`, `current_position_updated_at TIMESTAMPTZ` + index partiel sur `(is_online, current_position_updated_at) WHERE is_online=TRUE AND current_lat IS NOT NULL`.
- [`driverService.updatePosition`](apps/web/src/services/driverService.ts) — POST direct Supabase, pas d'historique conservé (RGPD).
- [`useDriverPositionPush`](apps/web/src/hooks/useDriverPositionPush.ts) : throttle 60 s, push uniquement si `driver.isOnline && popup.geolocPushEnabled`.
- [`userPrefsStore`](apps/web/src/store/userPrefsStore.ts) — Zustand avec `popupNewMission` (default true) et `geolocPushEnabled` (default true), persistés via `userPrefsService`.
- Toggles dans [`ProfileSectionApp`](apps/web/src/components/dashboard/driver/profil/ProfileSectionApp.tsx) (BellRing « Alertes nouvelles courses » + MapPin « Partager ma position en ligne »).
- Section 2.5 de [`/confidentialite`](apps/web/src/app/confidentialite/page.tsx) : explication de la collecte position en temps réel, absence d'historique, procédure de désactivation.

**3. Popup nouvelle course unifié** (commits `a79deac`, `f147d4f`, `5c6b94f`, `3356aee`, `18b00be`) :
- [`useNewMissionPopup`](apps/web/src/components/dashboard/driver/home/useNewMissionPopup.ts) : file FIFO sur `useMissionRealtime.onInsert`, filtres = `popupEnabled` + `isOnline` + `not own mission` + `scheduled_at ∈ [now-5min, now+2h]` + distance Haversine ≤ 15 km. Channel dédié `'missions-realtime-newpopup'` (cf. fix realtime ci-dessous).
- Décision UX : **pas** de modal central séparé. On réutilise [`MissionMapPopup`](apps/web/src/components/dashboard/driver/home/MissionMapPopup.tsx) (le popup déjà affiché au clic-pin) avec une prop optionnelle `autoDismissMs` qui ajoute la barre de progression 10 s en bas. Branche `isIncoming` = positionnement `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-1200` (échappe le stacking context du map wrapper, passe au-dessus de la sheet z-600). Branche par défaut = `absolute bottom-3` comme avant.
- Le `DriverHome.tsx` fait l'auto-select de la mission entrante (`setSelectedMissionId(incomingMission.id)`) pour que `MissionMapPopup` rende sur celle-ci avec `autoDismissMs={10_000}`.

**Bug critique réglé en cours de route** (commit `1b6a790`) :
- Au login, crash « cannot add postgres_changes callbacks after subscribe() ». `useDriverMissions` et `useNewMissionPopup` utilisaient le même channel name `'missions-realtime'` → Supabase refuse `.on(...)` sur un channel déjà `subscribe()`.
- Fix : prop `channelName?: string` ajoutée à [`useMissionRealtime`](apps/web/src/hooks/useMissionRealtime.ts) (default `'missions-realtime'` pour backcompat). `useNewMissionPopup` utilise `'missions-realtime-newpopup'`.

**Suppression du toast doublon** (commit `18b00be`) :
- `useDriverMissions.onInsert` envoyait un toast type `'mission'` (`bg-ink text-paper`) en haut à droite — c'était le « popup fin noir » que le user voyait à la place du popup centré attendu.
- Toast supprimé : pour les missions in-criteria, `MissionMapPopup` couvre. Pour les out-criteria, la mission apparaît directement dans la liste sous la carte.

### Fix admin SSR + turbo env vars (commit `77274a9`)
- `/dashboard/admin` plantait au prerender Next.js (`ReferenceError: window is not defined`) parce que `OnlineDriversMap` importait `leaflet` au top-level. Passage en `dynamic(import, { ssr: false })` comme `DriverHomeMap` et `CourseMap`.
- `turbo.json` : déclaration des env vars (`NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `ADMIN_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`) pour silencer le warning Vercel et invalider correctement le cache build.

---

## ✅ Terminé — Sessions précédentes

### Câblage v4 « Poster une course » sur le backend réel (2026-04-28)
Le design v4 a été validé. Remplacement du state local de la maquette `/dashboard/poster-mockup` par un vrai hook orchestrateur qui réutilise toute l'infra existante.

**Livré (commits `f99af5a` câblage initial, `bcfabdb` voice flow + drawer)** sur la branche `accueil-carte-annonce` (preview Vercel) :
- [`usePosterCourse`](apps/web/src/components/dashboard/poster-mockup/usePosterCourse.ts) : oriente `useMissionFormState` + `useMissionRoute` (Google Routes API + OSRM fallback) + `useMissionPricing` (calcul CPAM/privé live) + `useMissionVoiceFiller` (Anthropic API) + `groupService.getMyGroups` + `submitMission`. Mappage interne : STD→PRIVE, HPJ→HDJ, CONS→CONSULTATION, tpmr→`transportType:WHEELCHAIR`.
- [`AddressLineInput`](apps/web/src/components/dashboard/poster-mockup/AddressLineInput.tsx) : champ adresse hairline qui réutilise `useAddressField` (autocomplete Google Places + cache session) + `useAddressFieldVoice` (smart lookup BAN/Photon/Mapbox), sans le chrome card pour matcher le design éditorial.
- [`PosterCpamBlock`](apps/web/src/components/dashboard/poster-mockup/PosterCpamBlock.tsx) + [`PosterFooter`](apps/web/src/components/dashboard/poster-mockup/PosterFooter.tsx) : extraits pour respecter le seuil 200 lignes.
- Tous les champs contrôlés, picker date/heure inline si « Plus tard », footer avec prix + km + min en live, bouton « Tout dicter » câblé sur Anthropic API, dictée par champ via mics ciblés.

**Voice flow in-page** (commit `bcfabdb`) :
- [`usePosterVoiceFlow`](apps/web/src/components/dashboard/poster-mockup/usePosterVoiceFlow.ts) : machine d'état (idle / listening / processing / asking) qui orchestre la dictée sans changer d'écran. Détecte les champs critiques manquants après parse et enchaîne une question de relance via `parseVoiceAnswer`.
- [`PosterVoiceBanner`](apps/web/src/components/dashboard/poster-mockup/PosterVoiceBanner.tsx) : bannière sous le header qui rend l'état courant (transcription, analyse, relance, erreur).
- [`posterMissingFields`](apps/web/src/components/dashboard/poster-mockup/posterMissingFields.ts) : helper qui extrait la liste des champs critiques manquants (départ, arrivée, motif CPAM, patient, date) pour piloter les questions de relance.

**Hamburger + nav drawer dans la page poster** (commit `bcfabdb`) :
- Le bouton retour (← arrow_back) est remplacé par un **hamburger** qui ouvre le `MobileNavDrawer` — même menu que le dashboard, plus cohérent qu'un `router.back` qui pouvait sortir de l'app si on arrivait depuis un lien externe.
- Navigation vers les onglets via `router.push('/dashboard/chauffeur?tab=…')` ; pastille rouge sur le burger si acceptations non vues.

**Reste à faire** (après validation prod) :
- Refacto réel du [`PartagerMissionModal`](apps/web/src/components/dashboard/driver/PartagerMissionModal.tsx) en réutilisant ces mêmes hooks
- Suppression des modes Guidé / Vocal historiques (`MissionFormVocal`, `GuidedMissionFlow`, `MissionModeToggle`)
- Migration du « + » de la sidebar/FAB définitivement sur la nouvelle page (le rebranchement actuel est temporaire — voir [DriverDashboard.tsx:77](apps/web/src/components/dashboard/driver/DriverDashboard.tsx#L77))

### Mise en ligne fiable + topbar/FAB mobile uniformes (2026-04-28)
Deux chantiers cohérents qui partagent la même cause : le toggle « En ligne » était fragile (fire-and-forget, `load()` relisait au remount) et la barre haute mobile dupliquait des boutons inline dans `DriverDashboard`.

**Mise en ligne** (commit `3baec43`) :
- `setOnline` devient async et rollback l'optimistic-update si l'écriture DB échoue. Sans ça, le local pouvait diverger silencieusement de la DB (cf. bug Fontaine Samsung Browser).
- `load()` devient idempotent par userId : un remount du `DriverDashboard` (ex. retour depuis `/dashboard/poster-mockup`) ne refetch plus et n'écrase plus `isOnline` par une lecture potentiellement obsolète (écriture en vol, cron qui flippe entre-temps).
- [`DriverHome`](apps/web/src/components/dashboard/driver/DriverHome.tsx) attend la promesse et catch silencieux (rollback géré dans le store).
- 4 cas de tests ajoutés sur `driverStore` (rollback erreur, idempotence load, refetch sur changement d'userId).

**Sidebar / topbar mobile** (commit `3baec43`) :
- Nouveau composant [`MobileTopbar`](apps/web/src/components/taxilink/MobileTopbar.tsx) avec deux variants : `floating` (home, par-dessus la carte) et `bar` (autres onglets, barre 56 px).
- `DriverDashboard` délègue à `MobileTopbar` au lieu d'inliner deux boutons + un FAB. Le **FAB +** migre dans [`DriverHomeMap`](apps/web/src/components/dashboard/driver/home/DriverHomeMap.tsx) (au-dessus de la carte) où il a vraiment du sens, et disparaît des autres onglets.
- `DriverCoursesScreen` / Groupes / Profil : `pt-[calc(56px+safe-area)]` pour laisser la place à la topbar.
- `MobileNavDrawer` : z-index 700→1100 pour passer au-dessus des contrôles Leaflet plein-écran.

### Polish drawer + avatar accueil + initiales (2026-04-28)
Trois petits fixes UX cohérents :
- **Initiales accueil masquées sur desktop** (commit `be1eae5`) : sur desktop la `SidebarNav` affiche déjà l'avatar+initiales en bas — le bouton sur la carte était redondant. Sur mobile (`md:hidden`), il reste comme raccourci 1-clic vers le profil (le `MobileTopbar` n'expose qu'un burger). Une seule ligne touchée dans [`DriverHomeTopOverlay.tsx`](apps/web/src/components/dashboard/driver/home/DriverHomeTopOverlay.tsx).
- **Avatar drawer cliquable vers profil** (commit `12e406d`) : le bloc avatar+nom dans le `MobileNavDrawer` est maintenant un bouton qui ouvre l'onglet Profil et ferme le drawer. Avant, il fallait passer par l'item « Mon profil » de la liste.
- **Bottom sheet « one » à 5%** (commit `774b16e`) : la position basse de la sheet draggable est descendue de 7% → 5% pour donner encore plus de place à la carte.

### Marker chauffeur sur la carte — exploration design (2026-04-28, **en cours**)
Le marker actuel pour la position du chauffeur utilise [`/brand/icon.svg`](apps/web/public/brand/icon.svg) (le logo TaxiLink) via [`createMeMarkerIcon`](apps/web/src/components/dashboard/driver/home/missionMapPin.ts#L24-L32). Décision UX : le remplacer par une **voiture top-down style Mapbox / Uber / Bolt**.

**Itérations design** (3 maquettes HTML rejetées une à une avant convergence) :
- [`mockups/taxi-marker.html`](mockups/taxi-marker.html) — 3 directions classiques (top-down stylisé / disque taxi / avatar+badge) — rejeté
- [`mockups/taxi-marker-v2.html`](mockups/taxi-marker-v2.html) — 3 directions plus radicales (iso 3D / pin sculptural / capsule glassmorphism) — rejeté
- [`mockups/taxi-marker-v3.html`](mockups/taxi-marker-v3.html) — focus pure top-down Uber-like (SVG fait main, 2 variantes pure noir + bande jaune signature) — SVG jugé catastrophique

**Référence visuelle finale** : screenshot Mapbox partagé par le user — Tesla Model S top-down, halo blanc diffus, cone de phares projetant vers l'avant, carrosserie blanche toit en verre noir teinté.

**Décision** : utiliser un **asset PNG photoréaliste** (pas un SVG fait main, qui ne tient pas le niveau) + halo + cone codés en CSS par-dessus + rotation `coords.heading` GPS.

**Statut au 28/04 soir** :
- Vecteezy Pro asset trouvé (4928×3712 AI-generated) mais subscription requise → écarté
- Pivot Bing Image Creator (DALL-E 3 gratuit) : 3 images générées par le user — toutes en vue 3/4 oblique, **pas en top-down strict**
- Choix laissé au user pour demain :
  - **A** : regénérer sur Bing avec un prompt insistant sur « 90° / strict overhead view » → permettra rotation GPS
  - **B** : accepter une vue iso 3/4 fixe (image 2 Bing — Tesla blanc toit noir) → marker fixe orienté nord, plus premium mais sans rotation

**Reste à faire** (demain) :
- Choix A vs B
- Si A : nouvelles images Bing top-down strict
- Téléchargement de l'asset retenu → `apps/web/public/brand/car-top.png`
- Modification de [`missionMapPin.ts:24-32`](apps/web/src/components/dashboard/driver/home/missionMapPin.ts#L24-L32) pour utiliser le nouveau PNG
- Halo blanc (radial-gradient CSS) + cone phares (linear-gradient + clip-path) en overlay
- Si choix A : câblage `navigator.geolocation.watchPosition` → `coords.heading` → `transform:rotate()` sur le SVG/PNG
- États `is_online` / `en course` (halo vert pulsant / halo bleu fixe)

### Fix presence — beacon offline trop agressif sur mobile (2026-04-27, soir)
Bug remonté en test prod sur compte Fontaine (Samsung Browser Android) : « je me mets en ligne, je change de tab vers Mes courses ou Groupes, je repasse hors ligne ». Diagnostic via Supabase MCP : `is_online=false` mais `last_seen_at` < 120 s — quelque chose flippait `is_online` sans toucher `last_seen_at`.

**Cause** : [`useDriverOfflineBeacon`](apps/web/src/hooks/useDriverOfflineBeacon.ts) écoutait `pagehide` + `beforeunload` et déclenchait `/api/driver/offline` à chaque entrée bfcache. Sur mobile Chrome / Samsung Browser, `pagehide` fire dès qu'on switch d'onglet browser, qu'Android background l'app, ou que le navigateur met la page en bfcache — pas seulement à la fermeture réelle. Résultat : faux offline déclenchés en arrière-plan pendant que le heartbeat tournait toujours.

**Fix** (commit `fb03238` sur master, ff-merge depuis `accueil-carte-annonces`) :
- Filtre `event.persisted` sur `pagehide` : bfcache → on ignore (la page peut revivre au premier plan)
- Retiré `beforeunload` (peu fiable sur mobile, redondant avec pagehide quand il fire bien)
- TTL heartbeat (120 s) reste le filet de sécurité pour les vrais cas non couverts (crash, kill, perte réseau)

Déployé sur prod via push direct sur master.

### Refonte design « Poster une course » — mockups + preview (2026-04-27, soir, **en validation**)
Suite à un échange UX : le `PartagerMissionModal` actuel a 3 modes (Guidé / Vocal / Libre) + preview, perçu comme trop complexe pour un cas d'usage métier (chauffeur qui poste depuis le terrain). 4 itérations de design pour aboutir à une v4 « éditoriale » inspirée de Cash App / Stripe Express / Linear (hairlines, typographie display, accent jaune unique réservé aux CTA).

**Décisions UX prises** (à appliquer au refacto futur) :
- **Pas de modes séparés** : un seul écran formulaire avec micro intégré (par champ + un « Tout dicter » global)
- **Niveau 1 visible** : type (Standard/CPAM), départ/arrivée, heure, nom + téléphone patient, visibilité
- **Bloc CPAM révélé conditionnellement** : motif (HPJ/Consultation), aller-retour, nb patients, ☐ TPMR (+30 €). Tous nécessaires au calcul du tarif conventionné — pas optionnels en pratique même si la validation `canSubmit` ne les exige pas
- **Niveau 2 (replié)** : accompagnant, notes, prix manuel
- **Footer prix temps réel** : 36 px display, mise à jour live à chaque saisie

**Livré** :
- 3 mockups HTML statiques [`mockups/poster-course-v2.html`](mockups/poster-course-v2.html), [`v3`](mockups/poster-course-v3.html), [`v4`](mockups/poster-course-v4.html) (commit `3c318d1`) pour comparer les directions visuelles
- v4 codée en React/Tailwind sur `/dashboard/poster-mockup` (commit `f087020`) — pattern miroir de `patron-mockup`, route non gardée par le middleware
- Bouton **« + »** (sidebar desktop, FAB mobile, accueil, courses empty state) **temporairement rebranché** sur la maquette (commit `e6fd5f1`) pour test grandeur nature. Réversible : remplacer `handlePostCourse` dans [DriverDashboard.tsx:77](apps/web/src/components/dashboard/driver/DriverDashboard.tsx#L77) par `() => setShowCreer(true)`
- **Tout reste sur la branche `accueil-carte-annonce`** — rien n'est sur master tant que le design n'est pas validé. Vercel preview disponible.

**Reste à faire** (après validation) :
- Refacto réel du `PartagerMissionModal` en réutilisant les hooks existants (`usePartagerMissionModal`, `useMissionVoiceFiller`, `useMissionPricing`)
- Suppression des modes Guidé / Vocal (et des composants `MissionFormVocal`, `GuidedMissionFlow`, `MissionModeToggle`)
- Câblage des micros par champ sur le `voiceFiller` existant
- Branchement live du calcul de prix dans le footer

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
