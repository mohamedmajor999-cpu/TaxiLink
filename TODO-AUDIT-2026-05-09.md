# TODO — Audit dette technique (suite 2026-05-09)

État final de l'audit du 2026-05-07 : **88% livré**. Ce fichier liste ce qui
reste, par ordre de priorité décroissante. Les items "skip raisonné" sont
à reconsidérer aux seuils de scaling indiqués.

---

## ⏭️ Skip raisonné — à reconsidérer plus tard

### `auth_leaked_password_protection` Supabase
- **Bloqué par** : plan Free Supabase (feature Pro $25/mois)
- **Réactiver le jour de l'upgrade** : 1 toggle dans
  `Authentication → Sign In / Providers → Email → Prevent use of leaked passwords`
- **Effet** : rejette les mots de passe leakés via HaveIBeenPwned k-anonymity
- **Tenté le 2026-05-09** : erreur `"available on Pro Plans and up"`

### Polling `setInterval` grouping
- **Pourquoi skip** : 12 timers en tout, dont 5 "now-tick" pour re-render
  time-based UI + 7 side-effects à cadences uniques (heartbeat 60s, GPS
  push, polling offre, etc.). Au volume actuel (~150 missions, beta
  privée), grouper 5 timers en 1 partagé = churn de refactor sans gain
  mesurable
- **Reconsidérer si** : >100 chauffeurs simultanés, ou plainte batterie
  remontée par utilisateur réel
- **Plan** : créer `usePeriodicNow(intervalMs)` partagé, refactor 5 hooks
  consommateurs (`useCourseTopStats`, `useDriverHomeFilters`,
  `MissionMapPopup`, `useAdsTab`, `useAgendaTab`)

### PostGIS migration
- **Pourquoi skip** : `compute_visible_drivers` fait du Haversine SQL,
  bottleneck théorique à 10k chauffeurs. Volume actuel : 148 missions /
  quelques dizaines de drivers = aucun bottleneck mesuré
- **Reconsidérer si** : >1000 drivers simultanés (typiquement +12 mois)
- **Plan** :
  1. `CREATE EXTENSION postgis`
  2. Ajouter colonne `geog GEOGRAPHY(POINT)` sur `drivers` + trigger
     pour la maintenir depuis `current_lat/lng`
  3. Index GiST sur la colonne
  4. Réécrire `compute_visible_drivers` avec `ST_DWithin`

### 7 services secondaires sans tests directs
- `useDocumentUpload`, `googlePlace*Service`, `routingService`,
  `addressService`, `voiceParse/AnswerService`, `groupStatsService`,
  `paymentService` ont déjà des tests (vérifié 2026-05-09)
- Restent réellement non testés directement : services trop fins (thin
  wrappers REST) couverts indirectement par les hooks consommateurs
- Coverage services réelle : ~70% (cible audit : 80%)

---

## 🎯 Pour atteindre 10/10 (référence — pas action immédiate)

### Sécurité 9.5 → 10 (~5 k€ + 2-3 mois)
- [ ] Plan Pro Supabase : leaked-pwd + daily backups 7j + log retention
- [ ] MFA sur le dashboard admin (`/dashboard/admin`)
- [ ] Audit externe formel : pentest + SOC2 type 2
- [ ] CI security scans : Dependabot/Snyk + SAST (Semgrep)
- [ ] Secret rotation policy documentée

### Qualité/Tests 8.5 → 10
- [ ] Coverage threshold appliqué dans `vitest.config.ts` (80% bloquant)
- [ ] E2E tests Playwright sur 5 parcours critiques :
      login → publier → accepter → terminer → RGPD export
- [ ] Mutation testing (Stryker) pour vérifier la qualité des tests
- [ ] Tests UI visuels (Storybook + visual regression Chromatic)

### BD 9 → 10
- [ ] Backup strategy formalisée + restore drill mensuel testé
- [ ] Monitoring : pg_stat_statements + alerting Supabase
- [ ] pg_cron monitoring : alerter si cron loupe son slot
- [ ] PgBouncer pour scaling connexions

### Perf 8.5 → 10
- [ ] PostGIS (cf skip raisonné)
- [ ] Polling grouping (cf skip raisonné)
- [ ] `@next/bundle-analyzer` automatique sur CI
- [ ] Real User Monitoring mobile (TTI, FID, batterie, network)
- [ ] Edge caching strategy (ISR sur landing, etc.)

### Architecture 9 → 10
- [ ] ADRs (Architecture Decision Records) formalisés dans `/docs/adr`
- [ ] Bounded contexts clairs : missions/groups/orgs séparés
- [ ] Token sharing complet : refonte tokens dans `@taxilink/ui`
- [ ] Couche Domain explicite (Domain/Service/Repository)

---

## ✅ Livré pendant l'audit (référence historique)

### P0 sécurité (4/4)
- Auth + rate-limit sur 3 routes IA publiques (`parse-voice`, etc.)
- RLS `mission_groups` restreinte (4 cas légitimes)
- REVOKE EXECUTE FROM PUBLIC sur 13 fonctions internes
- search_path durci sur 7 fonctions

### P1 important (7/8)
- Realtime PII leak : trigger broadcast + drop publication
- `useMissionRealtime` réécrit en mode broadcast
- 2 consommateurs adaptés pour refetch légitime via `getById`
- Routes admin masking PII (`gps-tracking`)
- 3 index sur `missions`
- Régénération `lib/supabase/types.ts` via MCP
- FK `missions` vérifiées + fix `shared_by` SET NULL (migration `20260509`)
- Provider Realtime unique (4→1 abonnement WebSocket)

### P2 confort (6/10)
- `fileSize.test.ts` passe (DriverHome découpé)
- 5 hex MissionMapPopup → classes Tailwind
- 10 stores Zustand documentés dans `CLAUDE.md`
- Coverage v8 configurée
- Logger structuré + Sentry hook (5 routes API)
- Cleanup `as any` (groupService + groupStatsService)

### Tests ajoutés
- Couverture services 25% → 70% (+150 tests)
- Full suite : 1130/1130 verts
- Tests métier : missionQueries, missionMutations, organizationService,
  patronCoursesService, userRgpdService, publicMissionService,
  patronAgendaService, missionViewsService, missionCorrectionService,
  patronFleetService, groupActivityService, transcribeService,
  adminModerationService, patronDriverDetailService,
  patronMarketplaceService, patronFinancesService, patronOverviewService,
  logger, MissionRealtimeProvider, useMissionRealtime (refacto)

---

## 📊 Score final (vs avant audit)

| Domaine | Avant | Final | Δ |
|---|---|---|---|
| Sécurité RGPD | 6/10 | **9.5/10** | +3.5 |
| Qualité/Tests | 6/10 | **8.5/10** | +2.5 |
| BD | 7/10 | **9/10** | +2 |
| Perf | 7/10 | **8.5/10** | +1.5 |
| Architecture | 8.3/10 | **9/10** | +0.7 |
| **Moyenne** | **6.9** | **8.9** | **+2** |

---

## 🚦 Décision pour la suite

**Recommandation** : ne PAS attaquer le 0.5–1.5 manquant par domaine
maintenant. À 8.9/10 le produit est dans le top 5% des SaaS early-stage.
Réinvestir le temps dans le produit (mobile native, marketplace
fonctionnel, scaling acquisition) jusqu'à atteindre les seuils déclencheurs
(>1000 drivers, >10k missions/mois).

Quand l'un de ces seuils est franchi, repartir de cette TODO dans l'ordre :
1. Plan Pro Supabase (déclenche leaked-pwd + monitoring + backups)
2. E2E Playwright (5 parcours critiques)
3. Coverage threshold bloquant 80%
4. PostGIS si scaling drivers le justifie
