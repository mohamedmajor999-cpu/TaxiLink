# Audit FONCTIONNEL — App chauffeur TaxiLink V3 (mobile-driver-v3)

**Date :** 2026-05-29
**Périmètre :** audit FONCTIONNEL pratique — « est-ce que l'app marche aussi bien que le Uber des taxis pour un vrai chauffeur ? ». On vérifie si les fonctionnalités font réellement ce qu'elles promettent de bout en bout : être vu, suivi, notifié, recevoir et accepter des courses, tenir la batterie. **Ce rapport ne couvre PAS la sécurité ni le RGPD** (audit distinct du même jour). Les constats ci-dessous ont chacun été soumis à une vérification adverse (confirmé/réfuté, niveau de confiance), et les corrections issues de cette vérification ont été intégrées.

---

## 1. Résumé exécutif

**Non, l'app ne fonctionne pas encore comme Uber pour le chauffeur.** Le suivi GPS (foreground + background) est réellement solide et vérifié en prod, mais **toute la chaîne « recevoir une course » est cliniquement morte sur mobile** : une annonce postée depuis l'app ne déclenche ni le live feed temps réel, ni la cascade d'offres par proximité, ni les notifications push. Concrètement, un chauffeur en attente, app fermée, **ne reçoit rien** et doit surveiller un tableau d'annonces passif à la main.

### Les 5 ruptures fonctionnelles les plus graves

1. **[ANN-01 / bloquant] Le temps réel des annonces est cassé depuis le 2026-05-25** — régression SQL : le trigger DB diffuse sur le topic `missions` alors que les clients écoutent `missions-realtime`. Plus aucun event in-app n'est livré : feed non rafraîchi, pins fantômes de courses déjà prises, popup « Nouvelle annonce » jamais affichée. Confirmé en prod (haute confiance). *Correctif = un one-liner SQL.*

2. **[ANN-02 / DISP-01 / bloquant] La cascade d'offres par proximité ne se déclenche JAMAIS pour une course postée depuis mobile** — `createMissionMobile` fait un insert direct sans appeler `dispatch_mission`, et aucun trigger DB ne le fait (contrairement à ce qu'affirme le commentaire du code). Preuve irréfutable : la table `mission_offers` est **VIDE** en prod (0 ligne), malgré 15 courses postées sur 7 jours. La promesse « Uber » (offre exclusive 3→30 km) est inerte. Confirmé (haute confiance).

3. **[DISP-02 / bloquant→majeur] La push « Nouvelle course » ne part jamais depuis mobile** — `notify_drivers_new_mission` n'est invoqué que par le web. App fermée = le chauffeur n'est jamais réveillé. Confirmé (haute confiance).

4. **[DISP-03 / majeur] Quasi aucun token push enregistré en prod (1 token pour 13 utilisateurs)** — même si les points 2 et 3 étaient corrigés, 12 chauffeurs sur 13 ne recevraient aucune notification. Cause = flotte en Expo Go / build non distribué. Confirmé (haute confiance).

5. **[PRES-01 / majeur] Sans partage de position (RGPD off), un chauffeur « En ligne » n'est jamais candidat aux offres** — la vérification a corrigé le mécanisme : ce n'est pas le heartbeat gelé après 3 min, c'est immédiat et permanent (le dispatch exige `current_position_updated_at < 5 min` et des coordonnées non nulles, jamais écrites sans le service GPS). État « En ligne » trompeur.

**Ce qui marche réellement et bien :** le tracking GPS foreground et background (source unique, centrage cold-start, push DB toutes les ~8-10 s, cron présence 30 s / TTL 180 s), le garde-fou batterie < 20 %, le prompt d'opt-out d'optimisation batterie OEM, et la gestion de l'acceptation concurrente (anti-double-accept atomique). Le moteur de dispatch backend est sain et déployé — il n'est simplement **jamais appelé** depuis le mobile.

---

## 2. Verdict par sous-système

| Sous-système | Score | Marche bout-en-bout ? | Justification (1 ligne) |
|---|---|---|---|
| GPS foreground + carte + cold-start | **7,5 / 10** | **Oui** | Carte stable, source GPS unique, centrage cold-start propre ; perfectible sur la sobriété de collecte hors-ligne et la temporalité des permissions. |
| GPS background (TaskManager + foreground service) | **8,5 / 10** | **Oui** | Tracking background fiable vérifié en prod ; session/token rafraîchis même app tuée ; machinerie HyperSense devenue du poids mort mais sans bug bloquant. |
| Online/Offline + heartbeat + présence | **7 / 10** | **Partiel** | Cron et présence sains ; mais sans partage GPS le chauffeur est invisible au dispatch (PRES-01), et le re-flip cold-start crée une fausse présence admin transitoire (PRES-02, rétrogradé). |
| Batterie (tiers adaptatifs, motion gate) | **5,5 / 10** | **Partiel** | Tracking fiable, mais les « optimisations batterie » vantées sont en grande partie décoratives : tiers 15/3/5 s supprimés, motion gate jamais lu, deferred updates inactifs hors < 20 %. |
| Annonce — visibilité d'une course | **3,2 / 10** | **Non** | Realtime cassé (ANN-01) + cascade jamais déclenchée (ANN-02) ; survit un feed PULL passif (focus/refetch), avec fuite de visibilité GROUP. |
| Dispatch + offres directes + push | **3 / 10** | **Non** | Moteur backend sain et déployé mais jamais câblé au flux mobile ; `mission_offers` vide en prod ; 1 token push pour 13 users. |

---

## 3. Synthèse des constats

Effort estimé : **T** = trivial (commentaire/constante), **S** = small (qq heures), **M** = medium (1-2 j), **L** = large (chantier).

| ID | Sévérité | Sous-système | Titre | Marche ? | Effort |
|---|---|---|---|---|---|
| ANN-01 | Bloquant | Annonce | Topic broadcast serveur `missions` ≠ canal client `missions-realtime` (régression 25/05) | Non | S |
| ANN-02 | Bloquant | Annonce | Cascade d'offres jamais déclenchée pour les courses mobile | Non | M |
| DISP-01 | Bloquant | Dispatch | `dispatch_mission` jamais appelé depuis mobile (`mission_offers` vide) | Non | M |
| DISP-02 | Majeur *(était bloquant)* | Dispatch | Push « Nouvelle course » jamais émise depuis mobile | Non | S |
| PRES-01 | Majeur | Présence | RGPD geoloc off ⇒ chauffeur jamais candidat au dispatch (immédiat, pas après 3 min) | Non | M |
| PRES-02 | Mineur *(était majeur)* | Présence | Re-flip cold-start = fausse présence admin transitoire (pas de risque d'attribution) | Partiel | S |
| GPS-FG-01 | Mineur/modéré *(était majeur)* | GPS FG | Watch GPS 5 s continu même hors-ligne (gaspillage batterie modéré) | Non | S |
| BAT-01 | Majeur | Batterie | Tiers adaptatifs 15/3/5 s supprimés — profil unique 10 s (décision produit) | Non | M |
| BAT-02 | Moyen/mineur *(était majeur)* | Batterie | Motion gate accéléromètre calculé mais jamais lu — coût net négatif | Non | S |
| BAT-03 | Mineur *(était majeur)* | Batterie | Deferred updates Android = 0 hors < 20 % (opportunité, pas régression) | Partiel | S |
| ANN-03 | Majeur | Annonce | Visibilité GROUP non appliquée côté serveur dans le feed pull (fuite dept) | Non | S |
| ANN-04 | Majeur | Annonce | Deux feeds divergents : Carte (dept) vs Disponibles (toute France, sans realtime) | Non | M |
| DISP-03 | Majeur | Dispatch | 1 token push pour 13 users — fan-out n'atteint personne | Non | M |
| DISP-04 | Mineur *(était majeur — RÉFUTÉ)* | Dispatch | Offre directe en background : la push EST câblée (premisse fausse) | Partiel | — |
| GPS-FG-02 | Mineur | GPS FG | Popup permission GPS au 1er dashboard, sans contexte, en doublon | Non | S |
| GPS-CONSENT-04 | Mineur | GPS FG | Toggle « Partager ma position » non resynchronisé à chaud | Oui | S |
| GPS-FG-08 | Mineur | GPS FG | `getCurrentPositionAsync` sans timeout (non fatal, rattrapé) | Oui | T |
| GPS-03 | Mineur | GPS BG | Pas de `startAutoRefresh`/AppState (rattrapé par `getSession`) | Oui | S |
| GPS-05 | Mineur | GPS BG | Race : changement de signal pendant un `sync()` perdu | Non | S |
| GPS-08 | Mineur | GPS BG | Verrou `permissionAttemptedRef` sur-complexe (rattrapé) | Oui | T |
| PRES-03 | Mineur | Présence | Heartbeat foreground redondant + doc trompeuse | Oui | T |
| PRES-04 | Mineur | Présence | Pref geoloc lue une seule fois au mount (effet différé) | Non | S |
| BAT-04 | Mineur | Batterie | Heartbeat non mis en pause en background (redondant) | Oui | S |
| BAT-05 | Mineur | Batterie | Notif « mode éco à l'arrêt » alors que GPS plein régime | Non | T |
| ANN-06 | Mineur | Annonce | Seuils « Urgent » incohérents (120 min vs 10 min) | Non | T |
| ANN-07 | Mineur | Annonce | Reconnexion : onglet Disponibles et popup ne rattrapent rien | Non | S |
| GPS-CONSENT-03 | Info | GPS FG | `BackgroundLocationPrompt` = code mort (suppression assumée) | Non | T |
| GPS-04 | Info | GPS BG | Machinerie HyperSense devenue poids mort | Oui | S |
| GPS-06 | Info | GPS BG | Canal notif `gps-tracking` custom non utilisé (cosmétique) | Oui | — |
| GPS-10 | Info | GPS BG | `courseState` non persisté (impact quasi nul aujourd'hui) | Oui | — |
| PRES-07 | Info | Présence | Commentaire d'état de course obsolète (active.tsx) | Oui | T |
| BAT-08 | Info | Batterie | `pausesUpdatesAutomatically=false` — draine en continu idle (choix) | Oui | S |
| **Positifs** | | | | | |
| GPS-MAP-05 | Positif | GPS FG | Source GPS unique confirmée (pas de conflit deux-radios) | Oui | — |
| GPS-COLD-06 | Positif | GPS FG | Centrage cold-start + auto-vol au 1er fix | Oui | — |
| GPS-DB-07 | Positif | GPS FG | Position foreground locale uniquement, push DB par la task | Oui | — |
| GPS-01 | Positif | GPS BG | Tracking background vérifié en prod (fix frais ~9 s) | Oui | — |
| GPS-02 | Positif | GPS BG | Session rechargée / token rafraîchi app tuée | Oui | — |
| GPS-07 | Positif | GPS BG | Permission refusée ⇒ flip offline propre | Oui | — |
| GPS-09 | Positif | GPS BG | Erreur DB rendue visible (Sentry) | Oui | — |
| PRES-05 | Positif | Présence | Nettoyage d'état au logout correctement câblé | Oui | — |
| PRES-06 | Positif | Présence | Cron présence sain (30 s / TTL 180 s, 0 échec/2 h) | Oui | — |
| BAT-06 | Positif | Batterie | Garde-fou batterie < 20 % correctement branché | Oui | — |
| BAT-07 | Positif | Batterie | Prompt opt-out optimisation batterie OEM bien conçu | Oui | — |
| BAT-09 | Positif | Batterie | Pause des intervalles UI en background | Oui | — |
| BAT-10 | Positif | Batterie | Chaîne GPS background → DB vérifiée live | Oui | — |
| ANN-05 | Positif | Annonce | Ciblage « Personnes choisies » (target_user_ids) enforced côté serveur | Oui | — |
| DISP-05 | Positif | Dispatch | Moteur cascade/offres/accept correctement construit et déployé | Oui | — |
| DISP-06 | Positif | Dispatch | Acceptation concurrente atomique (un seul gagne) | Oui | — |
| DISP-07 | Positif | Dispatch | Notif au poster à l'acceptation robuste (retry + cleanup token) | Oui | — |
| DISP-08 | Positif | Dispatch | hold-to-accept vs tap direct cohérents, pas de collision de channel | Oui | — |

---

## 4. Détail des constats

### 4.1 BLOQUANTS

#### ANN-01 / DISP-01 / ANN-02 — La chaîne « recevoir une course » est morte (confirmé, haute confiance)

Ces trois constats décrivent la même réalité sous trois angles : **une course postée depuis le mobile ne déclenche ni temps réel, ni cascade, ni push.**

**ANN-01 — Realtime broadcast cassé (régression du 2026-05-25)**
- *Impact chauffeur :* le feed ne se met plus à jour en temps réel ; une course postée par un collègue n'apparaît que si le chauffeur quitte et revient sur l'écran (refetch au focus, throttle 30 s). Les pins de courses déjà prises restent affichées (pins fantômes). La popup « Nouvelle annonce » (`IncomingMissionAlertModal`) ne s'affiche jamais.
- *Déclencheur :* permanent depuis le 25/05 pour toute course (mobile ou web).
- *Emplacement :* serveur `public.broadcast_mission_event()` → `realtime.send(v_payload, v_event, 'missions', false)` ; client `apps/mobile-driver-v3/src/components/realtime/MissionRealtimeProvider.tsx:56/66` → `.channel('missions-realtime', ...)`.
- *Preuve :* la migration `20260516231519_fix_broadcast_mission_event_topic_to_missions_realtime` avait corrigé le topic en `missions-realtime` (commentaire : « L'ancien topic 'missions' ne matchait aucun client → events jamais reçus »). La migration suivante `20260525210155_broadcast_mission_event_include_target_user_ids` a ré-introduit le bug. Données live `realtime.messages` : topic `missions-realtime` jusqu'au 25/05 18:18, puis `missions` à partir du 27/05 07:29. **Touche aussi le web.**
- *Nuance vérifiée :* les push système (FCM/APNs) sont un canal séparé et ne sont **pas** touchées par ce bug — mais elles ne partent de toute façon pas pour les courses mobile (cf. DISP-02).
- *Reco :* remettre `realtime.send(..., 'missions-realtime', false)` (ou aligner le client sur `missions`). Ajouter un test garde-fou qui vérifie l'égalité topic serveur ⇄ nom de channel web ET mobile.

**DISP-01 / ANN-02 — Cascade `dispatch_mission` jamais déclenchée**
- *Impact chauffeur :* aucun dispatch dirigé (cercles 3→6→12→20→30 km, 20 s/palier), pas d'offre exclusive « Course pour toi ! », pas de modal « NOUVELLE MISSION », pas de bonus streak. La course n'existe que dans le feed passif.
- *Déclencheur :* à chaque création de course mobile (~100 % des courses postées sur mobile).
- *Emplacement :* `apps/mobile-driver-v3/src/components/courses/poster/createMissionMobile.ts:14-17` (commentaire faux affirmant qu'un trigger DB s'en charge) et `:33` (insert direct). À comparer : `apps/web/src/app/api/missions/route.ts:96` + `apps/web/src/lib/dispatchTrigger.ts:25`.
- *Preuve :* `SELECT count(*) FROM mission_offers = 0` (table VIDE, jamais alimentée), alors que 15 courses driver-posted en 7 jours et 1 chauffeur online géolocalisé. Les seuls triggers sur `public.missions` sont `broadcast_mission_event`, `compute_mission_departement_fallback`, `set_mission_org_from_driver` — aucun n'appelle dispatch. Extensions `pg_net`/`http` **absentes** en base : un trigger ne pourrait physiquement pas appeler l'edge function. L'edge `dispatch_mission` (v13, ACTIVE) n'est invoquée que par le web.
- *Reco :* invoquer `dispatch_mission` en fire-and-forget après l'insert dans `createMissionMobile` (`supabase.functions.invoke('dispatch_mission', { body: { mission_id } })`), comme le web. Corriger le commentaire mensonger.

#### DISP-02 — Push « Nouvelle course » jamais émise depuis mobile (confirmé, haute confiance — sévérité ramenée de bloquant à majeur)

- *Impact chauffeur :* aucun chauffeur du département n'est réveillé quand une course est postée depuis l'app. App fermée = il ne le sait pas.
- *Emplacement :* `createMissionMobile.ts:33-92` (aucun invoke de `notify_drivers_new_mission`) ; seul appelant = `apps/web/src/app/api/missions/route.ts:100`.
- *Preuve / correction de la vérification :* l'edge `notify_drivers_new_mission` (v9, ACTIVE) et son RPC `get_drivers_for_dept_push` sont corrects, mais jamais invoqués depuis mobile et aucun trigger DB ne le fait. **Nuance corrigée :** la cible réellement joignable aujourd'hui est **0, pas 6** — aucun des 6 users avec `dept_preferences='13'` ne satisfait simultanément (token présent ET `popupNewMission != false`). À noter aussi que le push ciblé « Course pour toi ! » de `dispatch_mission` ne part pas non plus depuis le flux mobile, ce qui aggrave plutôt le constat.
- *Reco :* invoquer `notify_drivers_new_mission` en fire-and-forget dans `createMissionMobile`, ou via le même trigger pg_net que DISP-01.

---

### 4.2 MAJEURS

#### PRES-01 — Sans partage de position (RGPD off), le chauffeur « En ligne » n'est JAMAIS candidat au dispatch (confirmé sur la conclusion, mécanisme corrigé)

- *Impact chauffeur :* un chauffeur qui a désactivé « Partager ma position en ligne » mais clique « En ligne » croit recevoir des courses ; il n'en recevra aucune (offre directe).
- *Correction majeure de la vérification :* le mécanisme décrit (heartbeat `setInterval` gelé en background → flip cron après 180 s) est **réfuté**. La vraie cause : le dispatch (`dispatch_mission` → `compute_visible_drivers`) exige `is_online=true AND current_lat/lng NOT NULL AND current_position_updated_at > now()-5min`. Le dispatch **ne regarde pas** `last_seen_at`. Sans le service GPS, `current_position_updated_at` n'est jamais frais et `current_lat/lng` restent NULL ⇒ exclusion **immédiate et permanente**, au premier plan comme en arrière-plan, dès la première seconde.
- *Emplacement clé (corrigé) :* `compute_visible_drivers` + dépendance de `current_position_updated_at` au foreground service GPS, et le gate `useDriverOnlineTracking.ts:147` (`shouldTrack = isOnline && geolocEnabled`). (Pas `useDriverHeartbeat:25-71` comme initialement pointé.)
- *NB :* le marketplace in-app (`get_marketplace_missions`) ne filtre ni `is_online` ni position, donc le chauffeur voit encore les annonces départementales tant que l'app est ouverte.
- *Reco :* soit interdire « En ligne » sans partage de position (comme Uber), soit afficher un avertissement clair, soit démarrer un foreground service « présence only ».

#### ANN-03 — Visibilité GROUP non appliquée côté serveur dans le feed pull (confirmé, haute confiance, légèrement sous-estimé)

- *Impact chauffeur :* une course `visibility='GROUP'` apparaît dans le feed et sur la carte de **tous** les chauffeurs du département, pas seulement des membres du groupe. Un chauffeur hors-groupe peut la voir et l'accepter.
- *Emplacement :* serveur `public.get_marketplace_missions` (le WHERE ne filtre que `target_user_ids` et `driver_blocks`, jamais l'appartenance via `mission_groups`/`group_members`) ; client `useDriverHomeFilters.ts:31` (« Pas de filtre groupes pour cette étape »).
- *Preuve :* 15 missions GROUP AVAILABLE/STALE en prod, dont 14 avec `target_user_ids=NULL` → elles passent vers tout le département. À l'inverse, `compute_visible_drivers` (chemin dispatch) filtre bien via `mission_groups JOIN group_members`. **Facteur aggravant :** la RLS de `missions` autorise aussi la lecture ET l'acceptation de toute mission AVAILABLE sans gate groupe.
- *Reco :* ajouter au WHERE de `get_marketplace_missions` : `(visibility <> 'GROUP' OR shared_by = auth.uid() OR EXISTS (SELECT 1 FROM mission_groups mg JOIN group_members gm ON gm.group_id=mg.group_id WHERE mg.mission_id=m.id AND gm.driver_id=auth.uid()))`.

#### ANN-04 — Deux feeds divergents : Carte (dept) vs Disponibles (toute France, sans realtime) (confirmé, haute confiance)

- *Impact chauffeur :* la Carte montre les courses des départements préférés ; l'onglet « Disponibles » montre **toutes** les courses de France. Compteurs et contenus incohérents. L'onglet Disponibles ne reçoit aucun patch realtime.
- *Emplacement :* Home `useDriverMissions.ts:45` (`getAvailable(depts)`) ; onglet `useAvailableTab.ts:34` → `missionService.getAvailable()` **sans `depts`** → `p_departments NULL` → RPC renvoie tout. Aucun abonnement realtime dans `useAvailableTab`.
- *Aggravant :* `courses.tsx:25` fixe « available » comme onglet **par défaut** (demande user 25/05) — la surface non filtrée et sans realtime est donc primaire, pas un edge case. 7/13 users ont des `dept_preferences` non vides ⇒ la divergence est réelle pour la majorité.
- *Reco :* unifier sur un seul store/chemin filtré par préférences dept, brancher le realtime sur Disponibles (après ANN-01), ou afficher explicitement « toute la France » vs « mes départements ».

#### DISP-03 — 1 token push pour 13 utilisateurs (confirmé, haute confiance)

- *Impact chauffeur :* même DISP-01/02 corrigés, 12 chauffeurs sur 13 ne recevraient aucune push. Le seul token enregistré (Galaxy S20) date du 15/05 → potentiellement périmé. Reachability réelle ≈ 0.
- *Emplacement :* `usePushRegistration.ts:77-86` (no-op en Expo Go SDK 53+ et sur émulateur). La chaîne d'upsert (`pushTokenService.ts`) est correcte ; c'est le runtime (Expo Go / build non distribué) qui court-circuite.
- *Preuve :* `count(push_tokens)=1`, `count(auth.users)=13`, tous role='driver'.
- *Reco :* distribuer un build EAS dev-client/preview à la flotte (déjà noté en mémoire), instrumenter le taux d'enregistrement. Le code de registration n'est pas à changer.

#### BAT-01 — Tiers adaptatifs 15/3/5 s supprimés, profil unique 10 s (confirmé, haute confiance — décision produit)

- *Impact chauffeur :* même consommation à l'arrêt (idle) qu'en course — GPS `high` toutes les 10 s en permanence. La promesse « 15 s en idle pour économiser » n'est jamais tenue. En course, la position n'est pas plus fraîche (toujours 10 s).
- *Emplacement :* `src/lib/trackingConfig.ts:57-79` (`profileFor` ne lit que `{ courseState, batteryLevel }`, renvoie un profil unique 10 s/high). Test `src/__tests__/trackingConfig.test.ts:13-49` verrouille ce comportement.
- *Précision vérifiée :* c'est une **décision produit assumée** (commentaire L48 « Demande user » 25/05 ; rationale « pin disparaît tél verrouillé »), **pas un bug accidentel** — à re-arbitrer plutôt qu'à corriger en urgence. Le seul différenciateur restant est le garde-fou batterie < 20 % hors course (30 s/balanced).
- *Reco :* trancher au niveau produit — soit documenter que les 15/3/5 s n'existent plus (MEMORY.md obsolète), soit rallonger l'intervalle en idle (15-20 s) et garder 10 s/high uniquement en course active.

---

### 4.3 MINEURS

#### PRES-02 — Re-flip cold-start = fausse présence admin transitoire (rétrogradé de majeur à mineur)

- *Correction de la vérification :* l'impact « peut recevoir une course sans GPS » est **réfuté**. La réconciliation seed uniquement `last_seen_at` + `is_online`, jamais `current_position_updated_at` ; or le dispatch filtre sur ce dernier (> now()-5 min). Un chauffeur re-flippé sans GPS qui redémarre ne reçoit **aucune** offre, puis est flippé offline par le cron. Le défaut résiduel = **fausse présence côté tableau admin** pendant ~2-5 min, auto-corrigée, sans risque d'attribution de course.
- *Emplacement :* `app/(driver)/_layout.tsx:103-110` (`setOnline(user.id, true)` sans attendre confirmation GPS) ; `driverService.ts:33-35` (seed `last_seen_at=now()`).
- *Reco (durcissement optionnel) :* ne re-flip `is_online=true` qu'après confirmation que la task GPS a redémarré, ou conditionner au `current_position_updated_at` frais.

#### GPS-FG-01 — Watch GPS 5 s continu même hors-ligne (rétrogradé de majeur à mineur/modéré)

- *Correction :* l'impact « drain GPS continu sévère » est surévalué. `accuracy=Balanced` (fused/network, pas la puce GPS pleine puissance), gates distance 20 m/5 m réduisant les réveils à l'arrêt, scénario limité aux longues sessions ouvertes-mais-hors-ligne. Reformuler en « gaspillage batterie modéré sur sessions de consultation prolongées hors-ligne ». La localisation (`useDriverGpsTracking.ts:142-159`) et le diagnostic (aucun gate online) sont exacts.
- *Reco :* hors-ligne, remplacer le watch continu par un fix unique au mount + recentrage à la demande, ou gater le watch sur `AppState==='active'`.

#### BAT-02 — Motion gate accéléromètre calculé mais jamais lu (rétrogradé de majeur à moyen/mineur)

- *Correction :* le constat factuel est exact (motion gate mort, coût net négatif ~0,1 %/h), mais l'impact est cosmétique/perf, pas fonctionnel. À noter : `appBackgrounded` est aussi un dead-input (même cas qu'`isMoving`). Le commentaire d'en-tête `useDriverOnlineTracking.ts:46-51` est mensonger.
- *Emplacement :* `trackingConfig.ts:57` (`isMoving` non destructuré) ; `useDriverOnlineTracking.ts:120,159` (subscribe + passage ignoré). Seul usage réel : `notificationBodyFor`.
- *Reco :* retirer `subscribeToMotion` + les params `isMoving`/`appBackgrounded` (option la plus honnête), ou re-câbler le motion gate dans `profileFor`. Corriger le commentaire d'en-tête.

#### BAT-03 — Deferred updates Android = 0 hors < 20 % (rétrogradé de majeur à mineur)

- *Correction :* le cœur factuel tient (deferred batching câblé mais inerte hors < 20 %), mais ce n'est pas une régression silencieuse — c'est un trade-off délibéré documenté (commentaires L45-52, tests verts). Affirmations à retirer : « doze mode jamais atteint à cause de deferredMs=0 » (faux — une app foreground-service est exemptée de Doze par design) et le chiffre « 6-12 %/h » (non sourcé). Les leviers dominants réellement actionnables sont `accuracy`/`pausesUpdatesAutomatically`.
- *Emplacement :* `trackingConfig.ts:71-78` (deferred=0 nominal) vs `:62-68` (60 s sous 20 %).
- *Reco :* réactiver `deferredUpdates` en background + idle hors course, corriger le commentaire « HyperSense » devenu mensonger.

#### Autres mineurs (confirmés, impact limité)

- **GPS-FG-02** (confirmé, haute confiance) : popup permission GPS au tout premier dashboard, sans contexte, en doublon avec la demande contextualisée au tap « En ligne ». `useDriverGpsTracking.ts:108-123` ; `useGeolocPref.ts:14`. *Reco :* demander la permission au tap « En ligne »/« Me localiser ».
- **GPS-CONSENT-04 / PRES-04** (confirmés, haute confiance) : le toggle « Partager ma position » est lu une seule fois au mount (`useGeolocPref.ts:13-36`, deps `[]`) ; changer le toggle en session ne démarre/coupe pas le tracking sans remount. La valeur persistée backend est correcte ; c'est la prise d'effet **immédiate** qui manque. *Reco :* exposer la pref via un store zustand mis à jour à l'écriture.
- **GPS-05** (confirmé, haute confiance) : race — un changement de signal pendant un `sync()` bloqué (prompt permission) est perdu, pas de re-trigger (`useDriverOnlineTracking.ts:143-145,272-274`). Sous-cas aggravant : si la collision tombe pendant le 1er prompt, le tracking ne démarre carrément pas jusqu'au signal suivant. Rare, auto-corrigé. *Reco :* flag `needsResync` relancé dans le `finally`.
- **GPS-03** : pas de `startAutoRefresh`/AppState (`supabase.ts:21-28`), rattrapé par `getSession` à chaque heartbeat. Faible priorité.
- **GPS-08 / GPS-FG-08** : verrou `permissionAttemptedRef` sur-complexe mais robuste ; `getCurrentPositionAsync` sans timeout non fatal (fallbacks watch + poll 15 s).
- **PRES-03 / BAT-04** : heartbeat foreground redondant avec la task GPS ; doc dit « 30 s » alors que la constante est `60_000` (`useDriverHeartbeat.ts:15,17`) ; non mis en pause en background contrairement aux autres intervalles. *Reco :* corriger les commentaires, migrer vers `useBackgroundAwareInterval`.
- **BAT-05** (confirmé, haute confiance) : la notif annonce « Position partagée (à l'arrêt, mode éco) » alors que le profil reste 10 s/high (`useDriverOnlineTracking.ts:314`). *Reco :* supprimer la mention « mode éco à l'arrêt » tant que BAT-02/03 ne sont pas re-câblés.
- **ANN-06** (confirmé, haute confiance) : seuils « Urgent » incohérents — Carte ≤ 120 min (`useDriverHomeFilters.ts:28`), badge pin ≤ 10 min (`index.tsx:25`), onglet Disponibles ≤ 10 min (`useAvailableTab.ts:43`). Le chip Carte affiche « Urgent (sous 2h) » (qualificatif visible) ; le chip Disponibles est un « Urgent » nu non documenté. *Reco :* centraliser dans une constante partagée, clarifier le vocabulaire.
- **ANN-07** (confirmé, haute confiance) : la Carte rattrape au focus/poll, mais l'onglet Disponibles ne refetch qu'au mount et la popup n'a aucun rescan sur reconnexion. Aggravant : l'onglet Disponibles n'a **aucun realtime du tout** (`useMissionStore` séparé, non branché). Modèle correct à répliquer : `useIncomingMissionOffer.ts:104` (rescan sur `SUBSCRIBED` + fallback poll 60 s).

---

### 4.4 INFO

- **GPS-CONSENT-03** (confirmé, haute confiance) : `BackgroundLocationPrompt.tsx` + `backgroundLocationPromptStore.ts` = code mort (jamais monté, `.show()` sans appelant). La suppression du pré-prompt est une **décision produit délibérée** (commentaire `useDriverOnlineTracking.ts:390`, 24/05 : le modal revenait trop souvent), pas un orphelinage accidentel. *Reco :* supprimer les 2 fichiers morts.
- **GPS-04** : machinerie HyperSense (accéléro, AppState, deferredUpdates) devenue poids mort après la refonte 25/05. *Reco :* retirer `subscribeToMotion` + le signal AppState des deps de `sync`.
- **GPS-06** : canal notif `gps-tracking` custom non utilisé par le foreground service (expo-location SDK 54 ne permet pas de l'attacher) ; le vrai garde-fou (POST_NOTIFICATIONS + vérif post-start `hasStarted=false` → Alert) est en place.
- **GPS-10** : `courseState` non persisté ; impact quasi nul aujourd'hui (profil unique). À reconsidérer si les profils redeviennent différenciés.
- **PRES-07** : commentaire d'état de course obsolète dans `active.tsx:73-84` (décrit l'ancien modèle multi-cadence). *Reco :* mettre à jour.
- **BAT-08** : `pausesUpdatesAutomatically=false` (`useDriverOnlineTracking.ts:231`) — choix délibéré pour la fiabilité admin, mais draine en continu idle. *Reco :* réintroduire un deferred en idle/background (cf. BAT-03).

---

### 4.5 Constats écartés à la vérification

> **DISP-04 — RÉFUTÉ (haute confiance).** Le constat affirmait qu'un chauffeur en background/app tuée « ne peut JAMAIS recevoir une offre directe » car la push « ne part jamais ». La vérification de la source live de l'edge `dispatch_mission` (v13, ACTIVE) montre que la push **est** câblée de bout en bout : `void pushDirectOfferToDrivers(...)` appelée par palier, channel `direct-offer`, `IMPORTANCE.MAX`, title « Course pour toi ! », token enregistré, handler de tap côté mobile. Le chauffeur en background reste éligible via le GPS background (foreground service) et recevrait la push. **Sévérité ramenée de majeur à mineur/non-bug.** *Résidu à investiguer séparément :* robustesse de la livraison push quand l'app est totalement swipée sur certains OEM Android (throttling FCM) — mais ce n'est pas « JAMAIS ». À noter : ce point devient théorique tant que DISP-01 (dispatch jamais invoqué depuis mobile) n'est pas corrigé.
>
> **Mécanisme de PRES-01 — partiellement réfuté.** La conclusion (chauffeur invisible au dispatch) tient, mais le mécanisme avancé (gel du `setInterval` heartbeat → flip cron après 180 s) est faux : l'exclusion est immédiate et permanente via `compute_visible_drivers` (filtre `current_position_updated_at`), indépendante du foreground/background et de `last_seen_at`.
>
> **Impact de PRES-02 — réfuté.** « Peut recevoir une course en étant sans GPS » est faux (le re-flip n'écrit jamais `current_position_updated_at`). Rétrogradé de majeur à mineur (fausse présence admin transitoire seulement).
>
> **Sévérités batterie revues à la baisse :** BAT-02 (majeur → moyen/mineur), BAT-03 (majeur → mineur). Le tracking GPS fonctionne ; les « optimisations » manquantes sont des opportunités/dette et un trade-off documenté, pas des régressions silencieuses.

---

## 5. Parcours utilisateur bout-en-bout

Scénario d'un vrai chauffeur, étape par étape, d'après les constats vérifiés.

| # | Étape | État | Ce qui se passe réellement |
|---|---|---|---|
| **a** | **Le chauffeur se met en ligne** | **DÉGRADÉ** | S'il a accepté la localisation, tout va bien : position + last_seen_at poussés toutes les ~8-10 s, présence confirmée côté admin (GPS-01, BAT-10, PRES-06). **MAIS** si « Partager ma position » est OFF, il passe « En ligne » sans jamais devenir candidat au dispatch (PRES-01) — état trompeur. Au tout premier lancement, la popup permission s'affiche sans contexte (GPS-FG-02). |
| **b** | **Une annonce est postée près de lui** | **CASSÉ** | Le temps réel est mort (ANN-01) : pas de popup « Nouvelle annonce », pas de mise à jour live, pins fantômes. La cascade d'offres par proximité ne se déclenche jamais (ANN-02/DISP-01 — `mission_offers` vide). La push « Nouvelle course » ne part pas (DISP-02) et n'atteindrait personne de toute façon (DISP-03). Il ne verra la course que s'il a l'app ouverte et qu'il quitte/revient sur l'écran pour forcer un refetch. |
| **c** | **App en arrière-plan 1 h en roulant** | **OK (suivi) / DÉGRADÉ (batterie)** | Le suivi continue de façon fiable même tél verrouillé (GPS-01, GPS-02 : token rafraîchi à la demande). Le cron TTL 180 s laisse une large marge. **Mais** le GPS tourne 10 s/high non-éco en continu (BAT-01, BAT-08) : drain plus élevé que la cible affichée, et la notif ment (« mode éco », BAT-05). Aucune offre directe ne pourra l'atteindre tant que DISP-01 n'est pas câblé. |
| **d** | **Il reçoit / accepte une course** | **DÉGRADÉ** | *Réception :* via le feed passif uniquement (pull au focus), pas en temps réel (ANN-01). *Acceptation :* solide — hold-to-accept atomique, anti-double-clic, « Course déjà prise » clair (DISP-06, DISP-08). Le poster est notifié de façon robuste (DISP-07). Le ciblage « Personnes choisies » est correctement enforced (ANN-05) — mais une course GROUP fuite à tout le département (ANN-03). |
| **e** | **Batterie à 15 %** | **OK** | Le garde-fou bascule en 30 s/balanced + deferred 60 s hors course, sans le faire disparaître de l'admin (BAT-06). En course active < 20 %, il reste délibérément à 10 s/high. Le prompt d'opt-out d'optimisation batterie OEM est bien conçu et re-vérifie l'état réel (BAT-07). C'est le seul tier adaptatif réellement fonctionnel. |

**Verdict du parcours :** le chauffeur peut **se mettre en ligne** et **être suivi** correctement, et l'**acceptation** d'une course qu'il voit fonctionne. Mais l'étape centrale — **être notifié/sollicité activement quand une course apparaît** — est **cassée de bout en bout** sur mobile. C'est exactement l'inverse de la promesse « Uber des taxis ».

---

## 6. Écart avec Uber

| Dimension | Uber | TaxiLink V3 aujourd'hui | Constats |
|---|---|---|---|
| **Latence d'annonce** | Offre poussée en < 1 s | Aucune (realtime cassé) ; visible seulement au refetch manuel | ANN-01, ANN-07 |
| **Sollicitation active** | Cascade par proximité, offre exclusive chronométrée | Inexistante sur mobile (`mission_offers` vide) | ANN-02, DISP-01 |
| **Réveil app fermée** | Push système immédiate | Push jamais émise + ~0 token enregistré | DISP-02, DISP-03 |
| **Fiabilité de la présence** | Toujours visible quand online | Visible **si et seulement si** GPS autorisé ; sinon invisible silencieux | PRES-01 |
| **Robustesse background** | Tracking continu fiable | **Au niveau** : suivi fiable même tél verrouillé/app tuée | GPS-01, GPS-02 ✓ |
| **Cohérence des feeds** | Une liste cohérente | Deux feeds divergents (dept vs France), seuils « Urgent » incohérents | ANN-04, ANN-06 |
| **Ciblage de visibilité** | Respecté | OK pour « personnes choisies », **cassé** pour les groupes | ANN-05 ✓ / ANN-03 ✗ |
| **Autonomie batterie** | Tiers adaptatifs | Profil unique 10 s/high (décision produit), optimisations vantées décoratives | BAT-01/02/03 |
| **Acceptation concurrente** | Atomique | **Au niveau** : un seul gagne, message clair | DISP-06 ✓ |

**En une phrase :** le « tuyau de suivi » est de qualité quasi-Uber, mais le « tuyau d'attribution de courses » (annonce → notification → offre → acceptation déclenchée) est débranché côté mobile.

---

## 7. Plan d'action priorisé

### Quick wins (à faire en premier — débloquent l'essentiel)

1. **[ANN-01 — S] Corriger le topic broadcast realtime.** Remettre `realtime.send(..., 'missions-realtime', false)` dans `broadcast_mission_event()` (ou aligner le client). **Restaure le live feed, supprime les pins fantômes, réactive la popup in-app.** Ajouter un test garde-fou topic ⇄ channel (web + mobile) pour empêcher la 3ᵉ régression. *Le correctif le plus rentable de tout l'audit.*

2. **[DISP-01 / ANN-02 — M] Câbler le dispatch au flux mobile.** Dans `createMissionMobile.ts`, après l'insert : `supabase.functions.invoke('dispatch_mission', { body: { mission_id } })` en fire-and-forget (comme `apps/web/.../route.ts:96`). Corriger le commentaire mensonger `:14-17`. **Réactive la cascade d'offres par proximité.**

3. **[DISP-02 — S] Câbler la push « Nouvelle course ».** Invoquer `notify_drivers_new_mission` en fire-and-forget dans `createMissionMobile` (comme `route.ts:100`).

4. **[DISP-03 — M] Distribuer un build EAS à la flotte** (dev-client/preview) pour activer l'enregistrement des tokens push, puis instrumenter le ratio `push_tokens` / utilisateurs actifs. *Sans ça, les actions 2-3 n'atteignent personne.*

5. **[ANN-03 — S] Ajouter le filtre GROUP** au WHERE de `get_marketplace_missions` (clause d'appartenance via `mission_groups`/`group_members`), pour aligner le pull sur `compute_visible_drivers`.

6. **[PRES-01 — S/M] Gérer l'état « online sans GPS ».** Interdire « En ligne » sans partage de position OU afficher un avertissement clair que le chauffeur ne sera pas sollicité.

7. **[Triviaux groupés — T] Nettoyage de cohérence/doc :** corriger la notif « mode éco » (BAT-05), unifier les seuils « Urgent » dans une constante (ANN-06), corriger les commentaires heartbeat 30 s→60 s (PRES-03/BAT-04) et `active.tsx` (PRES-07), supprimer le code mort `BackgroundLocationPrompt` (GPS-CONSENT-03), corriger le commentaire « HyperSense » mensonger (BAT-03).

### Chantiers de fond (après les quick wins)

8. **[ANN-04 — M] Unifier les feeds Carte / Disponibles** sur un seul store filtré par préférences dept, et brancher le realtime sur l'onglet Disponibles (une fois ANN-01 corrigé). Au minimum, étiqueter explicitement « toute la France » vs « mes départements ».

9. **[ANN-07 — S] Ajouter le rattrapage sur reconnexion** (refetch au focus / pull-to-refresh sur Disponibles, rescan léger à la reconnexion du provider), sur le modèle de `useIncomingMissionOffer.ts:104`.

10. **[BAT-01 — M, décision produit] Re-arbitrer la stratégie batterie :** soit assumer le profil unique 10 s et mettre à jour MEMORY.md, soit réintroduire des tiers (idle rallongé 15-20 s + deferred en background, course active 10 s/high). Trancher avant de toucher au code.

11. **[BAT-02 / BAT-03 / GPS-04 — S] Réconcilier la machinerie d'optimisation :** soit retirer le motion gate + AppState dead-inputs (`subscribeToMotion`, params `isMoving`/`appBackgrounded`) pour arrêter de payer l'accéléro pour rien, soit les re-câbler dans `profileFor` ; réactiver `deferredUpdates` en background+idle hors course.

12. **[GPS-FG-01 / GPS-FG-02 — S] Sobriété de collecte hors-ligne :** gater le watch GPS sur online/`AppState`, et déplacer la demande de permission au tap « En ligne »/« Me localiser » plutôt qu'au cold-start.

13. **[GPS-CONSENT-04 / PRES-04 — S] Propager la pref geoloc via un store zustand** (mis à jour à l'écriture dans Profil) pour une prise d'effet immédiate sans remount.

14. **[GPS-05 — S] Corriger la race de `sync()`** : flag `needsResync` relancé dans le `finally` (utile surtout pour le franchissement du seuil batterie 20 % et le 1er prompt de permission).

15. **[DISP-07 — S, robustesse] Déplacer l'envoi push poster côté serveur** (depuis `accept_mission_offer` / un trigger) pour ne plus dépendre du réseau du preneur. Non bloquant.

---

*Fin du rapport. Priorité absolue : actions 1 → 4, qui ressuscitent la chaîne « recevoir une course » aujourd'hui inerte sur mobile.*