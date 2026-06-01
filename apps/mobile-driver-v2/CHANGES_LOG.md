# CHANGES LOG — apps/mobile-driver-v2

Journal séquentiel des changements UI/comportement demandés par l'utilisateur.
Pour revenir en arrière sur un changement : `revert #N`.

---

## #1 — SideBarDrawer depuis le hamburger (remplace l'Alert)

**Fichiers**
- Ajout : [src/components/navigation/SideBarDrawer.tsx](src/components/navigation/SideBarDrawer.tsx)
- Modifié : [src/components/icons/Icon.tsx](src/components/icons/Icon.tsx) — ajout des icônes `home`, `list`, `users`, `user`, `logout`, `x`
- Modifié : [app/(driver)/index.tsx](app/(driver)/index.tsx) — état `drawerOpen` / `activeTab`, handlers `handleDrawerTabChange` + `handleDrawerSignOut`, montage du drawer en fin de tree

**Avant**
- Le hamburger appelait `Alert.alert('Menu', 'Navigation à venir...')` (handleMenu ligne 114-116)
- Aucun composant drawer

**Détail**
- Drawer Modal avec backdrop noir 45% + panneau coulissant gauche → droite (Animated, 220ms easing.out cubic)
- Header : avatar JD initials sur fond noir, nom + groupe + statut online
- Items : `Carte` (actif par défaut, remplace "Accueil" PWA), `Mes courses` (avec badge optionnel), bouton plein noir `Poster une course`, `Groupes`, `Mon profil`
- Footer : `Se déconnecter` rouge sur fond beige clair, avec confirmation Alert
- Active state : bg `#F7F5EF` (warm-50) + barre jaune `#FFD11A` verticale 4×24px à gauche
- Items "Mes courses", "Groupes", "Mon profil" → Alert "Écran à venir" (pas encore portés en v2)

---

## #2 — Alignement PWA strict du SideBarDrawer

**Fichiers**
- Modifié : [src/components/navigation/SideBarDrawer.tsx](src/components/navigation/SideBarDrawer.tsx)

**Avant** (écarts vs PWA)
- Avatar text : `fontSize: 15, fontWeight: '900'`
- Nom driver : `fontWeight: '800'`
- Status text : `fontWeight: '600'`, `gap: 5`
- Items font-weight : `active ? '700' : '500'` (deux poids)
- Poster une course text : `fontWeight: '800'`
- Se déconnecter text : `fontWeight: '700'`
- Header paddingTop : `12`
- Couleurs noires `#0F0F0F` (au lieu de `#000000` strict ink PWA)

**Détail**
Alignement strict sur la PWA (apps/web/src/components/taxilink/MobileNavDrawer.tsx) :
- Avatar text : 16/800 (text-base font-extrabold)
- Nom : 15/700 (font-bold)
- Status : 12/500 (default), gap 6
- Items : 500 uniforme (font-medium) — seul le bg + couleur change pour l'actif
- Poster une course : 15/700 (font-bold)
- Se déconnecter : 14/600 (font-semibold)
- Header padding : 20/20/16 (px-5 pt-5 pb-4)
- Ink = `#000000` strict

---

## #3 — Fix rendering Pressable style function sur Android RN (drawer)

**Fichiers**
- Modifié : [src/components/navigation/SideBarDrawer.tsx](src/components/navigation/SideBarDrawer.tsx)

**Avant**
- Tous les Pressables des items + Poster une course + Se déconnecter utilisaient `style={({ pressed }) => ({ ...container styling... })}`
- Résultat sur Android : icons + texts s'affichent mais le container Pressable perd ses styles visuels (bg, padding, border, borderRadius) → labels invisibles, "Poster une course" sans fond noir, "Se déconnecter" sans pill beige

**Détail**
Pattern wrapper-View visuel + Pressable interne (touch only, statique) avec `android_ripple` pour le feedback tactile :
- `DrawerNavItem` : View parent porte bg actif `#F7F5EF` + borderRadius + barre jaune absolute en sibling du Pressable (pour éviter le clip par overflow:hidden)
- `Poster une course` : View parent porte bg noir + borderRadius
- `Se déconnecter` : View parent porte bg `#F7F5EF` + borderRadius
- Pressable interne ne fait plus que `flexDirection: row, alignItems, gap, padding` + le tap

---

## #4 — Nom/prénom dans le drawer (au lieu de l'email)

**Fichiers**
- Modifié : [app/(driver)/index.tsx](app/(driver)/index.tsx)

**Avant**
- Drawer affichait `user.user_metadata.first_name + last_name` si présents, sinon fallback `user.email`
- Résultat : "mohamed.major@o..." affiché car `user_metadata` vide

**Détail**
- Fetch profil via `profileService.getProfile(user.id)` dans un `useEffect` au montage
- État `profile: { first_name, last_name } | null`
- Drawer affiche `first_name + last_name` (ou juste `first_name` si pas de nom), fallback `'Chauffeur'`
- `extractInitials` simplifié (plus de fallback email), fallback `··`

---

## #5 — Groupe primaire réel dans le drawer (au lieu de "MAJOR" hardcodé)

**Fichiers**
- Modifié : [app/(driver)/index.tsx](app/(driver)/index.tsx)

**Avant**
- `groupName="MAJOR"` hardcodé en prop du SideBarDrawer → affichait "MAJOR" pour tous les comptes connectés

**Détail**
- Ajout fetch `groupService.getMyGroups(user.id)` parallèle au fetch profil dans le même useEffect
- État `primaryGroup: string | null` = nom du premier groupe du chauffeur (équivalent `useDriverPrimaryGroupName` côté PWA)
- Drawer reçoit `groupName={primaryGroup}` — affiche le vrai nom, ou rien si le chauffeur n'est dans aucun groupe

---

## #6 — Online/Offline wiré à driverService (Étape 3f.1)

**Fichiers**
- Modifié : [app/(driver)/index.tsx](app/(driver)/index.tsx)

**Avant**
- `isOnline` = `useState(false)` local pur, jamais persisté en DB
- `onToggleOnline` = `() => setIsOnline((v) => !v)` — toggle local sans aucun appel Supabase
- Au signOut : pas de flip offline en DB, le chauffeur restait "en ligne" dans les groupes après déconnexion

**Détail**
- Au montage : fetch parallèle avec profil + groupe → récupère `driver.is_online` via `driverService.getDriver(user.id)` pour l'état initial
- `handleToggleOnline` : optimistic UI (`setIsOnline(next)`) + `await driverService.setOnline(user.id, next)`. Rollback local en cas d'erreur + Alert.
- `handleDrawerSignOut` : flip `setOnline(user.id, false)` (best-effort, .catch silencieux) AVANT `authService.signOut()` pour ne pas laisser le statut "en ligne" pendre en base.
- Pas d'utilisation de `@taxilink/stores/driverStore` (pas dans les deps mobile-driver-v2) — logique inline réplicant le store.

---

## #7 — Hold-to-confirm sur Accepter la course (Étape 3f.2)

**Fichiers**
- Ajout : [src/hooks/useHoldAccept.ts](src/hooks/useHoldAccept.ts)
- Modifié : [src/components/missions/MissionMapPopup.tsx](src/components/missions/MissionMapPopup.tsx)

**Avant**
- Bouton Accept = simple `<Pressable onPress={onAccept}>` → tap unique déclenche immédiatement la mutation Supabase
- Risque d'acceptation accidentelle (tap involontaire)

**Détail**
Mirror exact du pattern PWA `HoldAcceptButton` + `useHoldAcceptButton` :
- Hook `useHoldAccept` : 3 états `idle → pressing → confirmed`. Démarre un timer 1250ms au `start()`. À la fin, vibre 50ms (`Vibration.vibrate(50)`), pause 300ms, puis appelle `onConfirm`. Annulation possible avant la fin via `cancel()`.
- Animated.Value `progress` (0→1) animée sur `duration` ms via `Animated.timing` (useNativeDriver: false car on anime width). Reset 150ms si annulé.
- MissionMapPopup Accept : structure overlay
  - Background View (dashed jaune crème) — absolute fill
  - Progress fill `<Animated.View>` (jaune brand opacity 0.55, width interpolée 0%→100%)
  - Contenu (icône + label) absolute fill, label change `'Accepter la course' → 'Maintenez…' → 'Course acceptée'`
  - Pressable absolute fill avec `onPressIn={hold.start}` / `onPressOut={hold.cancel}`
- Désactivé pendant `accepting=true` (call Supabase en cours après confirm)

---

## #8 — Écran détail mission (Étape 3f.3)

**Fichiers**
- Ajout : [app/(driver)/mission/[id].tsx](app/(driver)/mission/%5Bid%5D.tsx)
- Modifié : [app/(driver)/index.tsx](app/(driver)/index.tsx) — `handleShowDetail` push la route au lieu d'Alert

**Avant**
- `handleShowDetail` faisait `Alert.alert('Détail de la course', 'Écran détails à venir...')` → cul-de-sac
- Aucun écran détail dans le router

**Détail**
Nouvelle route expo-router `(driver)/mission/[id]` :
- Header : bouton X retour + titre "Détail de la course"
- Body (ScrollView) :
  - **RouteCard** : départ → destination, badge type, heure ("Dans 2j 11h"), urgent, A/R, prix gros (28pt), distance course
  - **DetailsCard** : patient_name, passagers, transport_type, medical_motif, scheduled_at formatée — chaque ligne label/valeur
  - **NotesCard** + **DescriptionCard** : si présents
- Footer : barre Hold-to-accept noire avec progress fill jaune (réutilise `useHoldAccept`)
- À la confirmation : `missionMutations.accept` puis Alert succès + `router.back()`
- Erreur (course déjà prise, etc.) : Alert + reset accepting

---

## #9 — Fix navigation détail mission

**Fichiers**
- Modifié : [app/(driver)/index.tsx](app/(driver)/index.tsx) — `handleShowDetail` : path corrigé

**Avant**
- `router.push(`/(driver)/mission/${id}`)` → expo-router ne match pas la route car les groupes `(name)` n'apparaissent PAS dans l'URL publique. Le tap "Détail" ne faisait rien.

**Détail**
- `router.push(`/mission/${id}`)` — le fichier `app/(driver)/mission/[id].tsx` est exposé en route `/mission/[id]` (le groupe `(driver)` est silent).

---

## #10 — Fix tap "Détail" qui ne déclenche rien (Android RN style function bug)

**Fichiers**
- Modifié : [src/components/missions/MissionMapPopup.tsx](src/components/missions/MissionMapPopup.tsx)

**Avant**
- Bouton Détail = wrapper View visuel + `<Pressable style={({pressed}) => ({position: 'absolute', inset: 0, ...})}>` invisible par-dessus
- Sur Android RN, le `style` function ne s'applique pas → la Pressable a 0 de taille → le tap n'est jamais reçu → `onShowDetail` jamais appelé → router.push jamais déclenché

**Détail**
- Pattern wrapper-View visuel (border, bg, radius) + Pressable INTERNE en static style avec `flex: 1` + ripple Android
- Texte "Détail" déplacé à l'intérieur du Pressable
- Même fix que #3 (drawer) : Pressable static = fiable, Pressable function = bugué Android RN dans certaines configs

---

## #11 — Enrichissement écran détail mission : highlights + notice RGPD

**Fichiers**
- Modifié : [app/(driver)/mission/[id].tsx](app/(driver)/mission/%5Bid%5D.tsx)
- Modifié : [src/components/icons/Icon.tsx](src/components/icons/Icon.tsx) — ajout icônes `lock`, `calendar`, `clock`, `stethoscope`

**Avant**
- Écran détail = juste RouteCard + DetailsCard (table label/valeur en petit) + Notes/Description
- Date début / distance / durée / motif noyés dans la table → pas mis en évidence
- Aucune notice RGPD avant acceptation

**Détail**
- **MaskedNotice** (affichée en haut si `mission.type === 'CPAM'`) : icône cadenas + texte beige sur card warm-50 — repris fidèlement de la PWA `MissionDetailScreen.tsx` L78-87. Texte : "Coordonnées masquées. Le nom complet, le téléphone et les notes seront visibles uniquement après acceptation de la course (RGPD Art. 9, données de santé)."
- **HighlightsGrid** : 4 tuiles 2x2 bien visibles avec icône Lucide-style + label uppercase + valeur en gros (17pt 900) :
  - 📅 **Début course** : date formatée FR (`mar. 15 mai`) + sous-valeur heure (`14:30`)
  - 🛣 **Distance** : `mission.distance_km` formaté
  - 🕐 **Durée estimée** : `duration_min` ou fallback `static_duration_min`, formaté `45 min` ou `1h 15`
  - 🩺 **Motif** : `medical_motif` mappé en français (HDJ, Consultation, Dialyse, Kiné, Examen) ou "Médical" / "Privé"

---

## #12 — Masquage RGPD complet + actions contact/navigation conditionnelles

**Fichiers**
- Modifié : [app/(driver)/mission/[id].tsx](app/(driver)/mission/%5Bid%5D.tsx)

**Avant**
- Notice RGPD montrée uniquement si `type === 'CPAM'` (mauvais critère)
- Patient_name affiché en clair même si non accepté
- Phone, notes affichés tels quels (alors qu'on a un champ `phone` masquable)
- Aucun bouton de contact (Appeler, SMS) ni navigation (Google Maps, Waze)
- Footer hold-to-accept toujours visible même si la course était déjà acceptée

**Détail**
- Helpers inline `canSeeFullMission(mission, viewerId)` + `maskName(name)` — réplique fidèle de [apps/web/src/lib/missionMask.ts](../../web/src/lib/missionMask.ts) (RGPD Article 9)
- `isMasked = !canSeeFullMission(mission, user.id)` calculé sur le mission brut, puis applique `{ patient_name: initiales, phone: null, notes: null }` au mission affiché
- `MaskedNotice` accepte un prop `cpam` pour ajouter "(RGPD Art. 9, données de santé)" uniquement pour les missions médicales
- **Nouveau bloc `ContactNavActions`** (visible uniquement si `!isMasked`) :
  - Ligne navigation : Google Maps + Waze (deep links via `Linking.openURL`)
  - Ligne contact : Appeler (tel:) + SMS (sms:)
  - URLs Maps/Waze pointent vers les coords du `departure` (pickup point) — driver doit aller chercher le patient
- Footer "Maintenir pour accepter" caché si `mission.status !== 'AVAILABLE'` (déjà acceptée, en cours, terminée)

---

## #13 — Sheet : contour cartes contrasté + footer Accepter/Détail quand sélection

**Fichiers**
- Modifié : [src/components/missions/MissionSheetItem.tsx](src/components/missions/MissionSheetItem.tsx) — bordures
- Modifié : [src/components/missions/DriverHomeAcceptBar.tsx](src/components/missions/DriverHomeAcceptBar.tsx) — hold-to-confirm + structure wrapper-View
- Modifié : [app/(driver)/index.tsx](app/(driver)/index.tsx) — passe le footer au MissionsSheet

**Avant** (cartes)
- Border defaut : `#888780` (warm-500), epaisseur 1.5
- Border sélectionnée : `#5F5E5A` (warm-600), épaisseur 2 → différence subtile, pas évidente

**Avant** (AcceptBar)
- Bouton Accept = solide jaune avec simple `onPress` (tap unique)
- Pas utilisé dans le sheet (footer prop existait mais non passé depuis index)

**Après**
- **Cartes** :
  - Default : `#D3D1C7` (warm-300, plus clair) borderWidth 1.5
  - Selected : `#0F0F0F` (noir franc) borderWidth 2.5 + shadow plus marquée
  - Effet visuel : sélection bien évidente, contour franc noir
- **AcceptBar** :
  - Accept (2/3) : capsule jaune dashed avec hold-to-confirm 1.25s (label dynamique "Accepter la course / Maintenez… / Course acceptée") — réutilise `useHoldAccept`
  - Détail (1/3) : rectangle blanc bordure grise foncée, ouvre l'écran détail
- **Wire footer** : `<DriverHomeAcceptBar />` passé au MissionsSheet uniquement si `selectedMission && !sheetCollapsed` → barre d'action apparaît dynamiquement quand on sélectionne une carte avec le sheet déployé

---

## #14 — AcceptBar du sheet : bouton Accept noir classique sans icône

**Fichiers**
- Modifié : [src/components/missions/DriverHomeAcceptBar.tsx](src/components/missions/DriverHomeAcceptBar.tsx)

**Avant**
- Bouton Accept = capsule jaune crème (`#FFF7CC`) bordure dashed jaune brand + icône megaphone à gauche du texte
- Texte noir sur fond crème
- Progress fill : jaune brand opacity 0.55

**Après**
- Bouton Accept = rectangle noir `#0F0F0F` solide, borderRadius 12, sans bordure
- Texte blanc gras 13/900, sans icône (megaphone retirée)
- Progress fill : barre jaune `#FFD11A` opacity 0.45 sur fond noir → contraste fort visible pendant le hold
- Hold-to-confirm 1.25s conservé (label dynamique "Accepter la course / Maintenez… / Course acceptée")
- Import `Icon` retiré (plus utilisé)

---

## #15 — Popup map : bouton Accept noir classique sans icône, texte plus gros

**Fichiers**
- Modifié : [src/components/missions/MissionMapPopup.tsx](src/components/missions/MissionMapPopup.tsx)

**Avant**
- Bouton Accept du popup = capsule jaune crème (`#FFF7CC`) bordure dashed jaune brand + icône (megaphone ou plus selon état) + texte 12.5/900

**Après** (cohérence avec #14 sur le sheet)
- Rectangle noir solide `#0F0F0F`, borderRadius 12, sans bordure
- Texte blanc gras **15/900** (plus gros que les 12.5 précédents) + letterSpacing -0.3
- Aucune icône
- Progress fill : `#FFD11A` opacity 0.45 sur fond noir → contraste fort pendant le hold
- Hold-to-confirm 1.25s conservé

---

## #16 — Sheet AcceptBar : "Accepter la course" et "Détail" en plus gros (cohérence #15)

**Fichiers**
- Modifié : [src/components/missions/DriverHomeAcceptBar.tsx](src/components/missions/DriverHomeAcceptBar.tsx) — Accept + Détail
- Modifié : [src/components/missions/MissionMapPopup.tsx](src/components/missions/MissionMapPopup.tsx) — Détail (Accept déjà mis à 15 dans #15)

**Avant**
- Sheet AcceptBar : Accept 13/900 / Détail 13/900
- Popup map : Détail 12.5/900

**Après**
- Toutes les variantes Accept et Détail (popup map + footer sheet) : **15/900 letterSpacing -0.3** uniformément → cohérence visuelle entre les deux barres d'action

---

## #17 — Écran "Mes courses" (drawer item Mes courses)

**Fichiers**
- Ajout : [app/(driver)/courses.tsx](app/(driver)/courses.tsx)
- Modifié : [app/(driver)/index.tsx](app/(driver)/index.tsx) — `handleDrawerTabChange` : router.push('/courses') au lieu d'Alert pour `courses`

**Avant**
- Tap "Mes courses" dans le drawer → Alert "Écran à venir"
- Aucun écran de liste des courses du chauffeur

**Détail**
Nouvelle route expo-router `(driver)/courses` :
- Header : bouton X retour + titre "Mes courses" + compteur du nombre de courses
- 2 onglets pill : **À venir** (par défaut) et **Historique**
  - À venir = `missionQueries.getAgenda(user.id)` → toutes missions assignées non terminées (ACCEPTED + IN_PROGRESS) triées par scheduled_at croissant
  - Historique = `missionQueries.getDoneByDriver(user.id)` → missions DONE triées par completed_at décroissant
- Liste FlatList : chaque item = `CourseRow` avec
  - Badge status coloré (Accepté bleu, En cours orange, Terminé vert, Annulé rouge)
  - Date + heure
  - Route départ → destination (avec pastilles point + cercle jaune contour noir, comme MissionSheetItem)
  - Prix gros (18/900) + distance route
- Tap sur une course → `router.push(`/mission/${id}`)` → écran détail existant
- État vide différencié À venir vs Historique
- Loading → spinner jaune brand

---

## #18 — Refonte écran Mes courses : layout PWA + NextCourseHero + StepBar

**Fichiers**
- Modifié : [app/(driver)/courses.tsx](app/(driver)/courses.tsx) — refonte complète
- Ajout : [src/components/courses/NextCourseHero.tsx](src/components/courses/NextCourseHero.tsx)
- Ajout : [src/components/courses/StepBar.tsx](src/components/courses/StepBar.tsx)

**Avant** (#17 initial)
- Écran simple : header X retour + 2 onglets (À venir / Historique) + FlatList rows basiques
- Layout très éloigné de la PWA

**Après** (PWA-faithful)
- **Header haut** : hamburger 40x40 avec dot rouge notif (comme topbar de la carte) + ligne séparatrice
- **Section titre** :
  - Logo carré noir "TL" (44x44) avec texte blanc
  - Titre "Mes courses" 18/800
  - Date FR formatée capitalize sous le titre
  - Pill earnings vert pâle à droite : icône wallet + total € + "aujourd'hui"
- **4 onglets pills** : Aujourd... (actif noir), Agenda, An... (avec badge), Stats
- **Onglet Aujourd'hui** : `NextCourseHero` card si une course en cours/prochaine
  - Statut "Prochaine course" avec dot jaune brand
  - Badge type CPAM/PRIVÉ pill
  - Countdown "Dans 3h31 · 22:30" + prix à droite
  - Trajet inline "Septèmes-les-Vallons → Port-Saint-Louis-du-Rhône · 66.2 km · 53 min"
  - **StepBar** 4 segments + 4 labels (Acceptée / En route / À bord / Déposé) — actif jaune, passés noir, futurs warm-200
  - CTA noir contextuel ("Je pars chercher le patient" → "J'y suis arrivé" → "Patient déposé" → "Course terminée")
  - Bouton tel + bouton "..." menu (stubs pour l'instant)
- **Onglet Agenda** : FlatList des courses non terminées triées par date
- **Onglets Annonces / Stats** : "À venir" placeholder
- Tap sur la Hero card → écran détail mission (`/mission/[id]`)
- Composants `StepBar` et `NextCourseHero` réutilisables, isolés dans `src/components/courses/`

---

## #19 — Fix code 500 Metro : 3 erreurs TS strict

**Fichiers**
- Modifié : [app/(driver)/mission/[id].tsx](app/(driver)/mission/%5Bid%5D.tsx) — retire le rendering de `mission.description` (champ inexistant sur Mission)
- Modifié : [app/(driver)/index.tsx](app/(driver)/index.tsx) — `extractInitials` : nullish coalescing sur `firstName[0]` et `lastName[0]` (TS strict access)
- Modifié : [src/components/courses/NextCourseHero.tsx](src/components/courses/NextCourseHero.tsx) — onPress handlers refactorés en `if/else` (au lieu de `?? Alert.alert(...)` qui pouvait poser problème en TS strict avec void return)

**Avant**
- Metro retournait code 500 (échec bundling) à cause de :
  1. `mission.description` n'existe pas sur le type `Mission` (j'avais ajouté ce rendering par mémoire PWA, mais le champ n'est pas en base)
  2. `firstName[0] + lastName[0]` → TS2532 "Object is possibly undefined" (strict access sur indexation chaîne)
  3. `onAdvanceStep?.() ?? Alert.alert(...)` → pattern void/?? potentiellement bloquant

**Après**
- 0 erreur TS dans `app/` et `src/` du mobile-driver-v2
- Bundle Metro remonte propre, navigation /courses fonctionne

---

## #20 — Fond page Mes courses en blanc

**Fichiers**
- Modifié : [app/(driver)/courses.tsx](app/(driver)/courses.tsx) — `backgroundColor` SafeAreaView et section titre passés de `#FAFAF7` (warm-50 beige) à `#FFFFFF` (blanc pur)

**Avant**
- Fond beige clair `#FAFAF7` sur toute la page

**Après**
- Fond blanc `#FFFFFF` (SafeAreaView + section titre logo/date/earnings)
- Le header haut (hamburger) restait déjà blanc
- Les cards NextCourseHero et SimpleCourseRow conservent leur fond blanc + bordure beige `#F1EFE8` / `#E8E6DF` — visibles via la bordure

---

## #21 — Fond page Détail course en blanc

**Fichiers**
- Modifié : [app/(driver)/mission/[id].tsx](app/(driver)/mission/%5Bid%5D.tsx) — `backgroundColor` SafeAreaView passé de `#FAFAF7` à `#FFFFFF`

**Avant**
- Fond beige clair `#FAFAF7` sur la page de détail mission

**Après**
- Fond blanc `#FFFFFF` (SafeAreaView)
- Header (croix retour + titre) restait déjà blanc
- Footer hold-to-accept restait déjà blanc
- Les cards (HighlightTile, RouteCard, DetailsCard, NotesCard, MaskedNotice) conservent leur fond blanc/beige clair `#F7F5EF` + bordure visible

---

## #22 — Vrais logos Google Maps + Waze sur la page Détail (fond blanc)

**Fichiers**
- Ajout : [src/components/icons/BrandLogos.tsx](src/components/icons/BrandLogos.tsx) — composants `GoogleMapsLogo` (pin teardrop multicolore Rouge/Jaune/Vert/Bleu + dot blanc) et `WazeLogo` (bulle cyan + 2 yeux + sourire)
- Modifié : [app/(driver)/mission/[id].tsx](app/(driver)/mission/%5Bid%5D.tsx) — import des brand logos, nouveau composant `BrandActionButton` (variante prenant un node React au lieu d'un nom d'icône Lucide), remplacement des 2 boutons Google Maps / Waze

**Avant**
- Les 2 boutons "Google Maps" et "Waze" utilisaient l'icône générique `route` (route Lucide) en gris/cyan — pas reconnaissable comme brand officielle

**Après**
- Bouton **Google Maps** : pin teardrop avec les 4 segments officiels (Rouge `#EA4335` haut, Jaune `#FBBC04` droite, Vert `#34A853` bas-droite, Bleu `#4285F4` bas-gauche) + cercle blanc central — sur fond blanc, bordure beige `#E8E6DF`
- Bouton **Waze** : bulle de dialogue cyan officielle `#33CCFF` + 2 yeux noirs + sourire — sur fond blanc, bordure beige `#E8E6DF`
- Logos vectorisés inline en `react-native-svg` (pas de dépendance externe ajoutée)
- Boutons Appeler / SMS conservent leur design `ActionButton` original (icônes Lucide + accent vert/bleu)

---

## #23 — Onglet Stats fidèle PWA (KPIs + heatmap + période + export)

**Fichiers**
- Ajout : [src/lib/historyHeatmap.ts](src/lib/historyHeatmap.ts) — port direct de `apps/web/src/lib/historyHeatmap.ts` (`buildHeatmap` agrège les missions par jour avec intensité quartile 0..4)
- Ajout : [src/components/courses/HistoryKpiTiles.tsx](src/components/courses/HistoryKpiTiles.tsx) — 4 tiles (Revenus / Courses / € par course / Ratio CPAM) en grid 2x2 via flexWrap
- Ajout : [src/components/courses/HistoryHeatmap.tsx](src/components/courses/HistoryHeatmap.tsx) — heatmap GitHub-style, colonnes-semaines (lundi en haut), 5 niveaux d'intensité jaune `#F1EFE8 → #FFD11A`, labels mois en haut, légende Moins/Plus
- Ajout : [src/components/courses/StatsTabContent.tsx](src/components/courses/StatsTabContent.tsx) — orchestrateur : fetch via `missionQueries.getDoneByDriver(user.id, 5000)`, calcul KPI, heatmap 180j (~6 mois), 4 pills période (7j / 30j / 90j / 12 mois), bouton "Télécharger en Excel" stub via `Share.share` natif (CSV en clair, pour vrai .xlsx il faudra ajouter `expo-sharing` + `expo-file-system`)
- Modifié : [app/(driver)/courses.tsx](app/(driver)/courses.tsx)
  - import `StatsTabContent` + `ScrollView`
  - second fetch parallèle `getDoneByDriver(user.id, 200)` → state `recentDone` (alimente la chip "cette semaine")
  - `chipVariant` dérivé de `tab` (today/ads → "aujourd'hui", agenda/stats → "cette semaine")
  - chip header utilise `chipValue` + `chipLabel` dynamiques au lieu de hardcoded `todayEarnings`
  - Onglet Stats remplace le placeholder ComingSoon par `<ScrollView><StatsTabContent /></ScrollView>`

**Avant**
- Onglet Stats affichait `<ComingSoon label="Statistiques détaillées (à venir)" />`
- Chip header earnings hardcodée sur "X € · aujourd'hui" (jour) sur tous les onglets

**Après**
- Onglet Stats affiche fidèlement le layout PWA : 4 tuiles KPI (Revenus / Courses / € par course / Ratio CPAM) → heatmap activité 6 mois (intensité quartile, labels mois, légende) → carte sélecteur période (4 pills) + bouton noir export Excel
- Chip earnings change selon l'onglet actif : "aujourd'hui" pour today/ads, "cette semaine" pour agenda/stats — calcul depuis `recentDone` (DONE des 7 derniers jours)
- Sélecteur "Personnalisé" omis (date pickers natifs RN nécessitent dep supplémentaire)
- Export Excel utilise `Share.share` RN natif avec CSV en clair — fonctionnel mais l'utilisateur doit copier le contenu dans un fichier .csv (à améliorer avec `expo-sharing` + `expo-file-system` pour générer un vrai fichier partagéable)

---

## #24 — Onglet Annonces fidèle PWA (banner + WeekStrip + cartes Waiting/Accepted)

**Fichiers**
- Ajout : [src/components/courses/ads/adsHelpers.ts](src/components/courses/ads/adsHelpers.ts) — port de `apps/web/.../adsHelpers.ts` : types `AdState/AdView/AdDayGroup/DriverProfile/TrackerStep`, `getAdState`, `relativeAgo`, `deriveTrackerStep`, `buildAdDays`, `buildWeekDays`, `agendaDayLabel`, helpers de date (`sameDay`, `addDays`, `startOfDay`, `startOfWeek`)
- Ajout : [src/components/courses/ads/WeekStrip.tsx](src/components/courses/ads/WeekStrip.tsx) — strip semaine 7 jours, chevrons précédent/suivant, jour actif = pilule noire arrondie complète avec compte annonces en jaune
- Ajout : [src/components/courses/ads/AdCardWaiting.tsx](src/components/courses/ads/AdCardWaiting.tsx) — carte annonce EN ATTENTE (fond ambre `#FFFBEB`, badge `#FDE68A`/`#92400E`), bouton Partager WhatsApp vert `#25D366` (`Linking.openURL` whatsapp:// avec fallback wa.me), bouton Annuler rouge avec confirmation Alert (`missionMutations.cancel`)
- Ajout : [src/components/courses/ads/AdCardAccepted.tsx](src/components/courses/ads/AdCardAccepted.tsx) — carte ACCEPTÉE (fond bleu `#EFF6FF`, badge `#BFDBFE`/`#1E40AF`) + sous-bloc TakerBlock (avatar initials + nom + 3 boutons SMS/WhatsApp/Téléphone) + AdTracker (4 dots Acceptée/En route/Client à bord/Terminée + barre de progression verte) + footer Corriger (Alert stub)
- Ajout : [src/components/courses/ads/AdsTabContent.tsx](src/components/courses/ads/AdsTabContent.tsx) — orchestrateur : `useAuth` + fetch `missionQueries.getSharedByUser` (cutoff 30j) + `profileService.getContactsByIds`, banner "X nouveautés sur tes annonces" + bouton "Tout marquer comme lu", WeekStrip, header jour + count, rendu des cartes selon état, EmptyState avec icône megaphone
- Modifié : [app/(driver)/courses.tsx](app/(driver)/courses.tsx) — import `AdsTabContent`, onglet `ads` rend `<ScrollView><AdsTabContent /></ScrollView>` au lieu du `ComingSoon`

**Avant**
- Onglet Annonces affichait `<ComingSoon label="Vos annonces publiées (à venir)" />`

**Après**
- Onglet Annonces affiche fidèlement la PWA :
  - Banner jaune "X nouveautés" + bouton noir pill "✓✓ Tout marquer comme lu" (visible si non-vues > 0)
  - WeekStrip 7 jours avec chevrons, jour actif = pilule noire avec compte annonces jaune
  - Header jour ("Lundi 18 mai" / "Aujourd'hui · 12 mai" / etc.) + count à droite
  - Cartes EN ATTENTE (fond ambre + bouton WhatsApp vert + Annuler rouge)
  - Cartes ACCEPTÉE (fond bleu + TakerBlock 3 contacts + tracker 4 étapes + Corriger)

**Stubs/limitations**
- Pas de realtime (re-fetch nécessite refresh manuel pour l'instant)
- Tracking "non-vues" stubbé : compteur = nombre d'annonces acceptées (sans persistance), bouton "Tout marquer comme lu" met juste le compteur local à 0
- Bouton "Corriger" sur carte acceptée → `Alert("Édition d'annonce — à venir")`
- Badge sur l'onglet "Annonces" lui-même reste à 0 (à wirer en lifting le compteur depuis AdsTabContent vers le parent)
- Pas de cartes spécifiques pour `expired` (réutilise visuel waiting) ni `done` (réutilise visuel accepted) — à différencier ultérieurement

---

## #25 — Onglet Agenda fidèle PWA (WeekStrip + AgendaDayBlock + cartes courses/blocks)

**Fichiers**
- Modifié : [src/components/courses/ads/adsHelpers.ts](src/components/courses/ads/adsHelpers.ts) — `WeekDayCell` gagne `disabled?: boolean` + export `FR_DAY_SHORT_PUB` pour réutilisation par agenda
- Modifié : [src/components/courses/ads/WeekStrip.tsx](src/components/courses/ads/WeekStrip.tsx) — support `disabled` (jours grisés à 40 % opacity, Pressable désactivé, couleur date `#C9C7BF`)
- Ajout : [src/components/courses/agenda/agendaHelpers.ts](src/components/courses/agenda/agendaHelpers.ts) — port `apps/web/.../agendaHelpers.ts` : types `AgendaEvent/AgendaEventStatus/AgendaDayGroup/AgendaWeekDay`, constantes `VISIBLE_DAYS=16` + `MAX_OFFSET=15`, fonctions `toEvent` (mission → AgendaEvent avec status now/completed/scheduled/manual + priceEur via `computeDisplayFare`), `buildAgendaDays` (16 jours à partir d'aujourd'hui), `buildAgendaWeekDays` (7 jours avec disabled hors fenêtre), `weekRangeLabel` ("Semaine du 18 au 24 mai")
- Ajout : [src/components/courses/agenda/AgendaEventCard.tsx](src/components/courses/agenda/AgendaEventCard.tsx) — 2 variantes : block (course manuelle départ=arrivée, fond `#FEF3C7` + badge "INDISPONIBLE" `#B45309`) et course standard (fond paper + badge type CPAM `#1E40AF` / Privé `#6B21A8` / TaxiLink `#047857`), bouton "⋮" Actions optionnel en haut-droite
- Ajout : [src/components/courses/agenda/AgendaDayBlock.tsx](src/components/courses/agenda/AgendaDayBlock.tsx) — header "Lundi 18 mai" + summary "3 courses · 245 €" / "Rien de prévu", liste des cartes, bouton dashed "+ Ajouter une course à ce jour"
- Ajout : [src/components/courses/agenda/AgendaTabContent.tsx](src/components/courses/agenda/AgendaTabContent.tsx) — orchestrateur : fetch via `missionQueries.getAgenda`, range label semaine, WeekStrip avec clamp + disabled, vue 1-jour pilotée par WeekStrip (groupe vide à la volée si jour non couvert), tap carte → `router.push(/mission/[id])`, stubs `Alert` pour "Ajouter" / Menu (modals add/edit/delete pas portés)
- Modifié : [app/(driver)/courses.tsx](app/(driver)/courses.tsx)
  - import `AgendaTabContent`
  - retrait `FlatList` (plus utilisé)
  - onglet `agenda` rend `<ScrollView><AgendaTabContent /></ScrollView>` au lieu de l'ancien FlatList simpliste
  - retrait des composants morts `ComingSoon` et `SimpleCourseRow`

**Avant**
- Onglet Agenda affichait une `FlatList` brute de toutes les missions (pas de tri par jour, pas de WeekStrip, pas de bouton add)

**Après**
- Onglet Agenda affiche fidèlement la PWA :
  - Petit label "Semaine du X au Y mai" (capitalisé)
  - WeekStrip 7 jours navigables, jours hors fenêtre J→J+15 grisés
  - 1 jour visible à la fois (clic case → change la sélection)
  - AgendaDayBlock : header jour + summary à droite + cartes + bouton "+ Ajouter"
  - Cartes course : badge type coloré, range horaire, patient + route abrégée, meta A/R + prix
  - Cartes block : "INDISPONIBLE" jaune pour les courses manuelles départ=arrivée
  - Tap carte → `/mission/[id]`
  - Tap "⋮" → Alert "Détail / Modifier / Supprimer — à venir"

**Stubs**
- Modal AgendaAddModal (création/édition course manuelle) → Alert "à venir"
- Modal ConfirmDeleteCourseDialog → Alert
- Modal ReasonDialog (annulation) → Alert
- Pas de realtime / pas de driverAgendaStore Zustand (fetch direct au mount)

---

## #26 — Écran Mes Groupes fidèle PWA (header + hero + search + liste)

**Fichiers**
- Ajout : [src/components/groupes/GroupesHeader.tsx](src/components/groupes/GroupesHeader.tsx) — logo TL noir + titre "Mes groupes" + sous-titre count/favoris + bouton rond "Rejoindre" (icône) + pill noire "+ Créer"
- Ajout : [src/components/groupes/GroupesHeroCard.tsx](src/components/groupes/GroupesHeroCard.tsx) — carte hero du groupe principal (1er favori ou 1er groupe), bordure noire 2px, badge "★ FAVORI" absolute, avatar 52x52 noir avec initiale jaune + pastille présence verte/grise, 3 stats (Courses dispo / En ligne / Échangées 7j) sur fond beige, bouton plein noir "+ Poster une course" avec icône jaune
- Ajout : [src/components/groupes/GroupCard.tsx](src/components/groupes/GroupCard.tsx) — carte liste : avatar TL + nom + description + ligne membres/online/dispo + chevron, étoile favori + ⋮ menu (Quitter / Supprimer) en absolute top-right
- Ajout : [app/(driver)/groupes.tsx](app/(driver)/groupes.tsx) — nouvelle route `/groupes` : header retour + GroupesHeader + (loading | EmptyState | hero + search + section "MES AUTRES GROUPES" + GroupCards), wire `groupService.getMyGroups` + `leave` + `deleteGroup` réels, favoris en state local (Set d'IDs)
- Modifié : [app/(driver)/index.tsx](app/(driver)/index.tsx) — `handleDrawerTabChange` push `/groupes` au lieu d'`Alert("Écran à venir")` quand tab='groupes'

**Avant**
- Drawer "Groupes" ouvrait `Alert("Écran à venir")`

**Après**
- Drawer "Groupes" navigue vers `/groupes`
- L'écran rend fidèlement le layout PWA : Mes groupes header, hero card du groupe principal (badge FAVORI si étoilé), barre de recherche pill, section "MES AUTRES GROUPES" avec GroupCards
- `groupService.getMyGroups`, `groupService.leave`, `groupService.deleteGroup` wirés réellement (pas de stub Supabase)
- Quitter / Supprimer via Alert avec confirm (pas le `ConfirmWithPasswordModal` PWA — simplifié)

**Stubs / limitations**
- `groupStatsService` n'existe pas dans `@taxilink/services` (uniquement dans apps/web) → `available`, `online`, `exchanged7d` sont à 0 partout (plus de pulse vert dans la pastille)
- `groupActivityService.getGlobalPulse` non porté non plus (pas de bandeau "X courses dispo · Y confrères en ligne" globalement)
- Modals **CreateGroupModal** et **JoinGroupModal** → Alert "à venir" (formulaires complexes, à porter ensuite)
- Tap sur un groupe → Alert "Détail à venir" (pas de route `/group/[id]` créée — à faire avec port du `GroupDetailScreen` PWA)
- Favoris en state local (non persistés entre sessions) — la PWA utilise `useGroupFavorites` localStorage / Supabase, à porter avec AsyncStorage
- Pas de tri (chips activité/récent/nom omis pour MVP)
- Pas de realtime (`subscribeMembers` / `subscribeActivity` non wirés)
- Pas de pastille "nouveau" (`hasNews`) — nécessite `useGroupsLastVisited` + `lastEventAt` summaries

---

## #27 — Écran Poster une course (MVP fidèle PWA, sans voix ni autocomplete)

**Fichiers**
- Ajout : [src/components/courses/poster/usePosterCourse.ts](src/components/courses/poster/usePosterCourse.ts) — hook état formulaire + `submit()` qui appelle `missionService.create` après `validateMission` (validateurs cross-platform de `@taxilink/core`). Charge `groupService.getMyGroups`. Seed automatique `medicalMotif='HDJ'` + `transportType='SEATED'` quand `type==='CPAM'` (parité PWA).
- Ajout : [src/components/courses/poster/PosterPreflight.tsx](src/components/courses/poster/PosterPreflight.tsx) — sas Étape 1/2 : « À qui partager » (Tous + groupes triés flotte d'abord) + « Type de course » (Standard / CPAM), bouton « Continuer » avec arrow-right
- Ajout : [src/components/courses/poster/PosterCourseForm.tsx](src/components/courses/poster/PosterCourseForm.tsx) — Étape 2/2 : titre "Nouvelle course", CTA micro désactivé ("Bientôt"), 2 lignes adresses (départ rond noir, arrivée carré jaune), ligne Quand (Maintenant/Plus tard) avec inputs date/heure conditionnels, lignes Client + Téléphone, bloc CPAM ou Privé selon `type`, Remarques (textarea), Prix (saisie manuelle)
- Ajout : [src/components/courses/poster/PosterCpamBlock.tsx](src/components/courses/poster/PosterCpamBlock.tsx) — bloc beige bordure jaune : Motif HDJ/Consultation, Aller-retour Non/Oui, Patients stepper, checkbox TPMR « +30 € forfait »
- Ajout : [src/components/courses/poster/PosterPriveSupplementsBlock.tsx](src/components/courses/poster/PosterPriveSupplementsBlock.tsx) — 3 colonnes steppers : Passagers / Bagages 4e+ / Encombrants, avec hints arrêté préfectoral
- Ajout : [src/components/courses/poster/PosterFooter.tsx](src/components/courses/poster/PosterFooter.tsx) — PRIX (saisi manuellement) + tag couleur (CPAM HDJ bleu / Privé noir) + DISTANCE (—), bouton « Publier la course » + bouton vert « Publier et partager sur WhatsApp » (ouvre `whatsapp://send?text=...` via Linking)
- Ajout : [src/components/courses/poster/PosterFormPrimitives.tsx](src/components/courses/poster/PosterFormPrimitives.tsx) — `FieldRow`, `FieldLabel`, `FieldInput`, `WhenPill`, `Stepper`
- Ajout : [app/(driver)/poster-course.tsx](app/(driver)/poster-course.tsx) — route stack `/poster-course` : header (menu + pill Retour), sas Preflight tant que `!gatePassed`, puis form + footer, overlay « Annonce publiée ! » 1.2s après submit → `router.replace('/')`
- Modifié : [src/components/icons/Icon.tsx](src/components/icons/Icon.tsx) — ajout `arrow-right`, `check`, `phone`, `mic`, `globe`, `briefcase`, `message-circle`
- Modifié : [app/(driver)/index.tsx](app/(driver)/index.tsx) — `handlePostCourse` route vers `/poster-course` (au lieu d'Alert "à venir") + ferme le drawer

**Avant**
- Le FAB « Poster une course » et l'item drawer du même nom ouvraient `Alert("Écran de publication à venir.")`

**Après**
- FAB + item drawer naviguent vers `/poster-course`
- Sas Étape 1/2 oblige à choisir visibilité (Tous ou ≥1 groupe) + type avant le formulaire
- Formulaire respecte les règles métier PWA via `validateMission` partagé : adresse ≥ 5 caractères, patient_name requis si CPAM, `medical_motif` requis si CPAM, ≥1 group_id si visibility=GROUP, phone format FR
- `missionService.create` (`POST /api/missions`) côté Next.js valide encore côté serveur
- Bouton « Publier et partager sur WhatsApp » ouvre WhatsApp avec un message pré-rempli (départ + arrivée) après création réussie

**Stubs / limitations (à porter en sessions suivantes)**
- Pas de dictée vocale — la CTA micro est affichée en désactivée. Nécessite expo-av + `transcribeService` + `voiceParseService` + `useMissionVoiceFiller` à porter
- Pas d'autocomplete adresse — `AddressLineInput` PWA utilise `googlePlacesSearchService` ; le formulaire mobile saisit en texte libre, donc `departure_lat/lng` et `destination_lat/lng` sont null (pas de pin map sur la course créée)
- Pas de calcul de routage — `routingService` non branché, donc `distance_km`/`duration_min` restent null, l'affichage DISTANCE est «—»
- Pas d'estimation tarif auto — `computeEffectivePrice` non branché ; l'utilisateur saisit le prix à la main (pour CPAM, normalement c'est dérivé du tarif conventionné)
- Pas de toast « Annonce publiée » via `publishedFeedbackStore` (utilise un overlay plein écran simple à la place)
- Pas de préréglages mémorisés (`userPrefsService.savePosterDefaults`) — la checkbox « Mémoriser » de la PWA n'a pas été reportée
- Pas de mode édition d'une mission existante (la PWA utilise `missionEditStore` + `PartagerMissionModal`)
- Pas de range de prix (priceMin/priceMax) — uniquement prix unique
- Pas de date picker natif — saisie `AAAA-MM-JJ` + `HH:MM` en TextInput (à remplacer par `@react-native-community/datetimepicker` ou bottom sheet)

---

## #28 — Mes Groupes connectés DB + écran détail Groupe (live stats)

**Fichiers**
- Ajout : [packages/services/src/groupStatsService.helpers.ts](../../packages/services/src/groupStatsService.helpers.ts) — port direct des helpers PWA : `ONLINE_TTL_MS=120s`, `isFreshlyOnline()`, types `GroupActivitySummary` + `GroupDailyActivity`
- Ajout : [packages/services/src/groupStatsService.ts](../../packages/services/src/groupStatsService.ts) — port du service PWA `groupStatsService` (4 méthodes : `getMembers`, `getMemberStats`, `getActivitySummary`, `getDailyActivity`) avec init paresseux du client supabase via `getSupabaseClient()` (compatible mobile + web)
- Modifié : [packages/services/src/index.ts](../../packages/services/src/index.ts) — export de `groupStatsService` + types
- Modifié : [app/(driver)/groupes.tsx](app/(driver)/groupes.tsx) — fetch parallèle des `groupStatsService.getActivitySummary` pour chaque groupe via `Promise.allSettled` (best-effort), state `summaries: Record<id, GroupActivitySummary>`, hero card + GroupCards reçoivent `available`/`online`/`exchanged7d` depuis ce state. `openGroup` push vers `/group/[id]` au lieu d'Alert
- Ajout : [app/(driver)/group/[id].tsx](app/(driver)/group/%5Bid%5D.tsx) — nouvelle route `/group/[id]` : header retour + bouton inviter, hero centré (avatar 80x80 + nom + description + chip Favori), GroupLiveBanner si `available > 0`, 3 stats grid (Membres / En ligne / Échangées 7j), strip "EN LIGNE MAINTENANT" avec avatars, CTA Poster + Inviter, panel "MES STATS · PRIVÉ" (shared/accepted/percentile), section Membres avec rows `MemberRow` (avatar + nom + role badge admin + meta + boutons SMS/Tel), bouton rouge "Quitter le groupe" en bas

**Connexions DB réelles (pas de stub)**
- `groupService.getMyGroups(userId)` → liste des groupes du chauffeur
- `groupStatsService.getActivitySummary(groupId)` → `available` (missions AVAILABLE futures), `onlineCount` (chauffeurs avec `is_online=true` ET `last_seen_at < 120s`), `exchanged7d` (mission_groups créés sur 7j), `lastEventAt`
- `groupStatsService.getMemberStats(groupId, since)` → liste de `GroupMemberStats` avec nom/téléphone/department/online/role + `sharedCount` et `acceptedCount` agrégés sur 7j
- `groupService.leave(groupId, userId)` → quitte réellement le groupe en DB

**Avant**
- Tap sur un groupe → `Alert("Détail du groupe — à venir.")`
- Compteurs `available` / `online` / `exchanged7d` hardcodés à 0 partout (pas de fetch summary)

**Après**
- Tap sur un groupe → `/group/[id]` ouvre l'écran détail PWA-faithful
- Hero card et list cards affichent les vrais compteurs live (pulse vert sur la pastille du groupe quand `available > 0`)
- Détail affiche : 3 stats live, online strip, mes stats personnelles dans le groupe (position dans le classement), 4 membres visibles + lien "Voir les N", contact direct SMS/Tel sur chaque membre
- Bouton Quitter wire le `groupService.leave` réel et navigue back

**Stubs / limitations**
- Bouton "Inviter un confrère" → `Share.share` natif RN avec un lien `taxilink.app/.../join/<id>` (pas de copy-to-clipboard avec feedback comme la PWA)
- Bouton "Poster une course" du détail → Alert "à venir" (pas encore wiré au formulaire de poster mission depuis un contexte groupe)
- Pas de `groupActivityService` (events feed avec daily mini-bar) — section omise
- Pas de `driverBlockService` côté détail mobile (bloquer un chauffeur depuis ce groupe non porté)
- `BlockDriverModal` non porté — pas d'action bloquer dans `MemberRow`
- Favori chip dans le détail = state local (non persisté) comme dans `groupes.tsx`
- "Voir les N" affiche tous les membres en place mais sans pagination/recherche
- Pas de realtime — un changement DB nécessite refresh manuel

---

## #29 — Preflight Poster fidèle visuel image + persist des préréglages

**Fichiers**
- Modifié : [src/components/courses/poster/PosterPreflight.tsx](src/components/courses/poster/PosterPreflight.tsx) — refonte totale du visuel pour matcher l'image fournie par l'utilisateur
- Modifié : [src/components/courses/poster/usePosterCourse.ts](src/components/courses/poster/usePosterCourse.ts) — branche `userPrefsService.getMissionDefaults` (lecture au mount, après chargement des groupes) + `updateMissionDefaults` (écriture au continuer si remember=true) + state `savedDefaults` + `passGate(remember)` + `matchesSavedDefaults`
- Modifié : [src/components/icons/Icon.tsx](src/components/icons/Icon.tsx) — ajout `building` (Ma flotte), `car` (Standard), `users-plus` (groupe actif avec petit +), `briefcase-medical` (CPAM)

**Avant**
- Cartes Preflight : grid 2 cols avec `minHeight: 100`, padding réduit, titre 15px ; icônes :
  - Tous → `globe` ✓
  - Ma flotte → `briefcase` (valise) au lieu d'un immeuble
  - Major / Taxi13 → `users` simple, identique active/inactive
  - Standard → `map-pin` au lieu d'une voiture
  - CPAM → `stethoscope` au lieu d'une valise médicale
- Checkbox « Mémoriser » : **non rendue** dans le composant
- `passGate` : `setGatePassed(true)` simple, **aucune persistance Supabase** des choix

**Après**
- Titre "À qui partager," noir + "et quel type ?" gris #B5B2A8, 32px font-extrabold leading 36
- Cartes en grid 2 cols, `minHeight: 138`, padding 18, `borderRadius: 20`, structure `space-between` (icône en haut, titre+sub en bas)
- Inactive : `bg #FFFFFF`, border 1.5px `#E8E6DF`, icône gris `#888780`, titre `#0F0F0F` 18px/800, sub `#888780` 11.5px/700 uppercase letter-spacing 0.6
- Active : `bg #0F0F0F`, **pas de border**, icône jaune `#FFD11A`, titre blanc, sub `#FFFFFFB3`
- Mapping icônes : Tous=`globe`, flotte=`building` (immeuble fenêtres), groupe sélectionné=`users-plus` (jaune avec +), groupe non sélectionné=`users`, Standard=`car`, CPAM=`briefcase-medical`
- Checkbox « Mémoriser comme préréglage » carré 22px arrondi 6 + check blanc 14px quand cochée, label `'Mémoriser comme préréglage'` 14px/600 + sub `'Pré-sélectionné à la prochaine création.'` 12px gris
- Bouton « Continuer » : `height 58`, `borderRadius 18`, fond noir + texte blanc 16/800 + flèche jaune `#FFD11A` 20px (au lieu de blanc)
- Pré-cochée si le choix courant `(type, visibility, groupIds)` correspond au snapshot `mission_defaults` déjà sauvegardé
- À l'appui de « Continuer » : si `remember=true`, `userPrefsService.updateMissionDefaults({ type, visibility, groupIds })` push dans `auth.users.raw_user_meta_data.mission_defaults` ; lecture au prochain mount via `getMissionDefaults` (cross-platform, pas de localStorage)

**Connexion DB**
- Lecture : `userPrefsService.getMissionDefaults()` (Supabase `auth.getUser()`) — best-effort, retombe sur défaut UI si échec
- Écriture : `userPrefsService.updateMissionDefaults(snapshot)` — best-effort, log via `reportError` si échec
- Filtrage des `groupIds` invalides : si un groupe pré-réglé n'existe plus dans `myGroups`, il est ignoré au mount

---

## #29 — Member rows : 4 boutons icônes PWA-faithful + Block/Unblock fonctionnel

**Fichiers**
- Modifié : [src/components/icons/Icon.tsx](src/components/icons/Icon.tsx) — ajout icône `message-square` (chat bubble outline Lucide) pour le bouton SMS
- Modifié : [app/(driver)/group/[id].tsx](app/(driver)/group/%5Bid%5D.tsx)
  - import `driverBlockService` depuis `@taxilink/services`
  - state `blockedIds: string[]`, fetch parallèle `getBlockedIds(user.id)` au mount
  - handler `handleToggleBlock(member)` : Alert confirm puis `driverBlockService.block` ou `unblock` + maj locale du Set
  - `MemberRow` refait fidèle PWA : 4 boutons carrés 32×32 alignés à droite
    - SMS : fond blanc + bordure beige, icône `message-square` noire → `Linking.openURL('sms:...')`
    - WhatsApp : fond vert clair `#25D366`, icône `message-circle` blanche → `whatsapp://send?phone=33...` (fallback `https://wa.me/`)
    - Téléphone : fond vert foncé `#16A34A`, icône `phone` blanche → `Linking.openURL('tel:...')`
    - Block/Unblock : fond blanc bordure beige + icône `ban` grise (pas bloqué) ou fond rouge `#EF4444` + icône `shield-off` blanche (bloqué)
  - Subline change : "Bloqué·e" en rouge si bloqué, sinon "En ligne" / "Hors ligne" / activité
  - Boutons SMS/WhatsApp/Tel cachés quand le membre est bloqué (parité PWA)
  - Bouton Block caché pour soi-même

**Avant**
- MemberRow n'avait que 2 boutons (SMS + Tel) et pas de bouton Block
- Pas de fetch driverBlockService → impossible de savoir qui était bloqué
- Aucune façon de bloquer un confrère depuis la page détail groupe

**Après**
- Les 4 actions du screenshot PWA sont présentes et fonctionnelles
- Block/Unblock wire le vrai service `driverBlockService.block` / `unblock` (table `driver_blocks` Supabase)
- Confirmation Alert custom avec texte parité PWA `BlockDriverModal` ("ne verra plus aucune de tes annonces", "tu ne verras plus les siennes", "blocage discret — pas notifié")
- Asymétrie patron↔employé du trigger DB est gérée : si erreur `CANNOT_BLOCK_OWN_PATRON`, message "Vous ne pouvez pas bloquer le patron de votre organisation"

---

## #30 — Hamburger fonctionnel sur la page détail Groupe (remplace la croix)

**Fichiers**
- Ajout : [src/hooks/useDrawerData.ts](src/hooks/useDrawerData.ts) — hook partagé qui agrège profil + groupe primaire + statut online via `profileService.getProfile` + `groupService.getMyGroups` + `driverService.getDriver`, et expose `handleTabChange` (router.push vers /, /courses, /groupes, /profil), `handleSignOut` (Alert + flip offline + `authService.signOut`), `handlePostCourse` (router.push /poster-course), name + initials + groupName + isOnline. Évite la duplication entre les écrans qui montent un drawer.
- Ajout : [src/components/navigation/ScreenHamburgerHeader.tsx](src/components/navigation/ScreenHamburgerHeader.tsx) — composant header réutilisable : bouton hamburger 40×40 à gauche (icône `menu`) qui ouvre un `SideBarDrawer` mounté localement (state `drawerOpen` interne), titre optionnel au centre, `rightSlot` pour des actions secondaires (ex: bouton inviter)
- Modifié : [app/(driver)/group/[id].tsx](app/(driver)/group/%5Bid%5D.tsx)
  - import `ScreenHamburgerHeader`
  - 3 occurrences du `<DetailHeader />` local remplacées par `<ScreenHamburgerHeader activeTab="groupes" rightSlot={...inviteButton}/>`
  - le bouton "Inviter un confrère" devient un node passé en `rightSlot` au lieu d'être codé en dur dans le header
  - suppression de la fonction `DetailHeader` désormais inutile

**Avant**
- En haut à gauche de la page détail groupe : bouton croix `X` qui faisait juste `router.back()`
- Pas de menu accessible depuis cet écran : pour aller à un autre écran (Mes courses / Carte), il fallait revenir en arrière puis ouvrir le drawer depuis l'accueil

**Après**
- Hamburger `≡` à gauche qui ouvre le `SideBarDrawer` complet (Carte / Mes courses / Groupes ★ actif / Mon profil + bouton noir Poster une course + Se déconnecter rouge)
- Navigation directe vers n'importe quel écran de l'app depuis la page détail groupe
- Toutes les données du drawer (nom + groupe + statut online) sont fetchées via `useDrawerData` réutilisable
- Bouton Inviter un confrère reste à droite via le `rightSlot`

**Note** : Pour appliquer le même hamburger sur les autres écrans (`courses.tsx`, `groupes.tsx`, `mission/[id].tsx`), il suffit de remplacer leur header local par `<ScreenHamburgerHeader activeTab="..."/>`. Pas encore fait sur ces écrans (à demander si voulu).

---

## #31 — Hamburger fonctionnel sur la liste Mes Groupes (remplace la croix)

**Fichiers**
- Modifié : [app/(driver)/groupes.tsx](app/(driver)/groupes.tsx) — import `ScreenHamburgerHeader`, le header local custom (`<View>` avec bouton croix `X` qui faisait `router.back()`) est remplacé par `<ScreenHamburgerHeader activeTab="groupes" />`

**Avant**
- L'écran `/groupes` avait une croix `X` en haut à gauche → simple retour arrière, pas de menu accessible

**Après**
- Hamburger `≡` à gauche qui ouvre le `SideBarDrawer` complet (Carte / Mes courses / Groupes ★ actif / Mon profil + bouton noir Poster une course + Se déconnecter)
- Mes Groupes devient une "vraie page" comme Mes courses, avec menu de navigation accessible directement
- Cohérent avec la page détail groupe (#30) qui utilise déjà le même pattern

---

## #32 — Bouton "Rejoindre" pill + JoinGroupModal fonctionnel

**Fichiers**
- Modifié : [src/components/groupes/GroupesHeader.tsx](src/components/groupes/GroupesHeader.tsx) — bouton "Rejoindre" devient une pill blanche bordure beige (40 px de haut) avec label texte "Rejoindre", au lieu d'un bouton rond 40×40 avec uniquement l'icône `megaphone`. Couleurs inversées de "Créer" (blanc/noir vs noir/blanc) pour maintenir la hiérarchie visuelle (action secondaire à gauche, primaire à droite).
- Ajout : [src/components/groupes/JoinGroupModal.tsx](src/components/groupes/JoinGroupModal.tsx) — port du PWA `JoinGroupModal.tsx` en RN : `Modal` transparent fade-in, sheet bottom-aligned avec radius 24 px haut, handle bar visuel, titre "Rejoindre un groupe" + bouton X, paragraphe d'aide, label "IDENTIFIANT DU GROUPE" + `TextInput` monospace (UUID format placeholder), affichage erreur rouge optionnel, bouton brand jaune "Rejoindre le groupe" (disabled si vide ou saving) avec spinner ActivityIndicator
- Modifié : [app/(driver)/groupes.tsx](app/(driver)/groupes.tsx)
  - import `JoinGroupModal`
  - 4 nouveaux states : `showJoin`, `joinId`, `joinSaving`, `joinError`
  - `handleJoin` ne fait plus un Alert mais reset l'erreur + ouvre le modal
  - nouvelle fonction `submitJoin` qui call `groupService.join(id, user.id)` réellement, puis re-fetch `getMyGroups` + `groupStatsService.getActivitySummary` pour le nouveau groupe + ferme le modal. Erreur custom "Groupe introuvable, identifiant invalide ou tu en es déjà membre."
  - `<JoinGroupModal>` rendu en bas du JSX (au-dessus de `</SafeAreaView>`)

**Avant**
- Bouton "Rejoindre" était un cercle 40×40 avec icône megaphone, libellé visible nulle part → peu intuitif
- Tap sur le bouton → `Alert("J'ai un code", 'Rejoindre un groupe via code — à venir.')`, aucune action réelle

**Après**
- Bouton clairement labellé **"Rejoindre"** (pill blanche)
- Tap ouvre une bottom sheet "Rejoindre un groupe" demandant l'UUID du groupe
- Submit → `groupService.join` réel sur la table `group_members` Supabase
- Sur succès : la liste des groupes est re-fetchée, le nouveau groupe apparaît + son summary live (pastille verte si missions dispo)
- Sur erreur : message rouge "Groupe introuvable, identifiant invalide ou tu en es déjà membre."

**Note** : "Créer un groupe" reste en stub Alert pour l'instant — à porter dans une session suivante (formulaire avec nom + description optionnelle).

---

## #33 — CreateGroupModal fonctionnel

**Fichiers**
- Ajout : [src/components/groupes/CreateGroupModal.tsx](src/components/groupes/CreateGroupModal.tsx) — port PWA `CreateGroupModal.tsx` en RN : Modal transparent fade-in, sheet bottom-aligned, handle bar, titre + X, 2 inputs (NOM DU GROUPE * requis + DESCRIPTION optionnelle), affichage erreur rouge optionnel, bouton noir CTA "Créer le groupe" avec icône `check` (disabled si nom vide ou saving) + spinner ActivityIndicator
- Modifié : [app/(driver)/groupes.tsx](app/(driver)/groupes.tsx)
  - import `CreateGroupModal`
  - 5 nouveaux states : `showCreate`, `newName`, `newDesc`, `createSaving`, `createError`
  - `handleCreate` : reset les champs + ouvre le modal (au lieu d'Alert)
  - nouvelle fonction `submitCreate` : `groupService.create(name, desc, user.id)` réel sur la table `groups` Supabase + insertion en tête de liste pour UX immédiate + chargement summary du nouveau groupe
  - `<CreateGroupModal>` rendu en bas du JSX

**Avant**
- Tap sur "+ Créer" → `Alert("Créer un groupe", 'Création de groupe — à venir.')`, aucune action réelle

**Après**
- Tap "+ Créer" → bottom sheet "Créer un groupe" avec champs nom + description
- Submit → `groupService.create` réel : insertion dans `groups` + auto-ajout du créateur comme `admin` dans `group_members` (cf. service)
- Sur succès : nouveau groupe inséré en tête de liste avec son summary live, modal fermé, champs reset
- Sur erreur : message rouge depuis `err.message` (ex: violation contrainte DB)
- Le créateur est admin → il voit le bouton "Quitter" remplacé par "Supprimer" dans le menu ⋮

**Conformité PWA** : layout identique au modal web (titre + X + 2 inputs labellés + CTA noir Check + Créer le groupe), avec adaptation mobile bottom-sheet style + handle bar visuel.

---

## #34 — Mes Groupes : design fidèle screenshot (logo TL + LiveBanner + chips tri)

**Fichiers**
- Modifié : [src/components/icons/Icon.tsx](src/components/icons/Icon.tsx) — ajout icône `link` (chaîne Lucide, 2 segments)
- Modifié : [src/components/groupes/GroupesHeader.tsx](src/components/groupes/GroupesHeader.tsx) — ajout du **logo TL** (carré noir 40×40, texte "TL" jaune `#FFD11A`) avant le titre, titre passé à 20/800, bouton "Rejoindre" redevient un **bouton rond 40×40** avec icône `link` (chaîne) au lieu d'une pill avec libellé texte
- Ajout : [src/components/groupes/GroupesGlobalPulse.tsx](src/components/groupes/GroupesGlobalPulse.tsx) — banner noir (`#0F0F0F`) avec carré jaune translucide `rgba(255,209,26,0.18)` contenant l'icône `zap`, texte principal "X courses à prendre · Y collègues en ligne" (nombres en jaune brand bold) + sous-ligne "Sur tous tes groupes maintenant". Caché si `available + online === 0`
- Ajout : [src/components/groupes/GroupesSortChips.tsx](src/components/groupes/GroupesSortChips.tsx) — 3 chips pill : `Plus actifs` (default) / `Récents` / `A → Z`. Active = pill noire, inactive = pill blanche bordure beige
- Modifié : [app/(driver)/groupes.tsx](app/(driver)/groupes.tsx)
  - imports `GroupesGlobalPulse`, `GroupesSortChips`, type `SortMode`
  - state `sortMode: SortMode` (default `'activity'`)
  - `sortedOtherGroups` : tri appliqué selon mode (activity = available×1000 + online desc, recent = ordre DB, name = alpha fr)
  - `globalPulse` : agrège `availableTotal` + `onlineTotal` sur tous les groupes via `summaries`
  - rendu : `GroupesGlobalPulse` inséré entre header et hero card, `GroupesSortChips` inséré après search bar (avant "MES AUTRES GROUPES")
  - liste utilise `sortedOtherGroups` au lieu de `otherGroups`

**Avant**
- Header sans logo TL, bouton Rejoindre était une pill avec libellé "Rejoindre"
- Pas de banner live agrégé sur tous les groupes
- Pas de tri (liste toujours dans l'ordre DB)

**Après** (fidèle screenshot PWA)
- **Header** : logo TL noir + "Mes groupes 20/800" + sous-titre "3 groupes · 1 favori" + bouton rond avec icône lien `🔗` + pill noire `+ Créer`
- **Live Banner** noir : "11 courses à prendre · 1 collègue en ligne" avec nombres en jaune + sous-ligne grise (visible quand activité non nulle)
- **Hero card** du groupe favori inchangée (badge ★ FAVORI, avatar, 3 stats, CTA "+ Poster une course")
- **Search bar** inchangée
- **3 chips de tri** : `Plus actifs` (actif noir) / `Récents` / `A → Z` — clic met à jour le tri immédiatement
- Section `MES AUTRES GROUPES` avec liste triée

**Conformité PWA** : tous les composants sont des ports directs des fichiers `apps/web/.../GroupesHeader.tsx`, `GroupesGlobalPulse.tsx`, `GroupesSortChips.tsx` avec adaptation RN (Pressable + View au lieu de button, gap au lieu de space-x-, etc.).

---

## #35 — Polish Mes Groupes : LiveBanner toujours visible + search Lucide + menu ⋮ fonctionnel

**Fichiers**
- Modifié : [src/components/icons/Icon.tsx](src/components/icons/Icon.tsx) — ajout 3 icônes : `search` (loupe Lucide), `copy` (clipboard outline), `share-2` (3 nœuds connectés)
- Modifié : [src/components/groupes/GroupesGlobalPulse.tsx](src/components/groupes/GroupesGlobalPulse.tsx) — retrait du `if (availableTotal === 0 && onlineTotal === 0) return null`. La banner est désormais TOUJOURS visible : si tout est à zéro, affiche "Pas d'activité pour le moment" + sous-ligne "Reste connecté pour ne rien rater"
- Modifié : [app/(driver)/groupes.tsx](app/(driver)/groupes.tsx) — search bar : remplacement de l'emoji `🔍` par `<Icon name="search" size={16} color="#888780" strokeWidth={1.8} />`. Padding ajusté (10px gap, 16 horizontal) pour matcher le PWA
- Ajout : [src/components/groupes/GroupCardMenu.tsx](src/components/groupes/GroupCardMenu.tsx) — port PWA `GroupCardMenu.tsx` en bottom sheet RN : titre uppercase du groupe + 4 actions (Copier l'ID + SMS + WhatsApp + Quitter/Supprimer). Modal transparent fade-in, sheet bottom-aligned avec handle bar, items avec icône à gauche + label, séparateur entre actions de partage et action destructive (rouge)
- Modifié : [src/components/groupes/GroupCard.tsx](src/components/groupes/GroupCard.tsx)
  - import `useState`, `Linking`, `Share` (RN), `GroupCardMenu`
  - state `menuOpen` + `copied`
  - `handleCopyId` : `Share.share({ message: group.id })` (pas d'expo-clipboard installé → share natif RN expose "Copier" dans le menu système). Affiche "ID copié !" 2 s
  - `handleShareSms` : `Linking.openURL('sms:?body=...')` avec texte d'invitation contenant nom + UUID
  - `handleShareWhatsApp` : `whatsapp://send?text=...` avec fallback `wa.me`
  - bouton ⋮ ouvre le `GroupCardMenu` au lieu d'un Alert minimal
  - rendu `<GroupCardMenu>` en bas du composant

**Avant**
- LiveBanner caché si activité globale = 0 (rien ne s'affichait au-dessus de la hero card)
- Search bar utilisait l'emoji `🔍` qui rendait mal sur certaines polices Android
- Menu ⋮ ouvrait un Alert basique avec uniquement Quitter/Supprimer + Fermer

**Après**
- LiveBanner toujours visible : avec activité = nombres jaunes ; sans activité = "Pas d'activité pour le moment" + "Reste connecté pour ne rien rater"
- Search bar : icône SVG Lucide propre (consistante avec le reste de l'app)
- Menu ⋮ : bottom sheet avec 4 actions toutes fonctionnelles :
  - **Copier l'ID** → `Share.share` natif RN (l'utilisateur choisit "Copier" dans le menu système). Toast "ID copié !" 2 s
  - **Envoyer par SMS** → `sms:` deep link avec texte d'invitation pré-rempli (nom + UUID)
  - **Partager WhatsApp** → `whatsapp://` avec fallback `wa.me`
  - **Quitter** (membre) ou **Supprimer** (admin) → handlers existants (#26)

**Note** : pour avoir un vrai "Copier dans le presse-papier" sans menu intermédiaire, il faudrait ajouter `expo-clipboard` (1 dep). À voir si tu veux que je l'ajoute.


---

## #36 � D�tail groupe : MES STATS � PRIV� + ACTIVIT� � 7 JOURS au design PWA

**Fichiers**
- Modifi� : [src/components/icons/Icon.tsx](src/components/icons/Icon.tsx) � ajout ic�ne  (Lucide)
- Modifi� : [app/(driver)/group/[id].tsx](app/(driver)/group/[id].tsx)
  - import  depuis 
  - state  + appel  dans le  du fetch initial
  - retrait du bloc inline  (encadr� beige + texte simple)
  - nouveau composant local  � r�plique exacte de  : pastille jaune brand/15 + ic�ne  + label uppercase + phrase � Tu as **partag� X** course et **accept� X** course dans ce groupe � + ligne verte � Top X% du groupe sur l''activit� � uniquement si 
  - nouveau composant local  � r�plique de  (header + barres uniquement, pas de feed �v�nements car  non port� c�t� mobile) : fond beige , label uppercase � ACTIVIT� � 7 JOURS �, gros chiffre 26px, sous-ligne � Courses �chang�es �, 7 mini-barres � droite (largeur 10px, hauteur proportionnelle au max du p�riode, jaune brand  pour la barre du jour, beige  pour les autres)

**Avant**
- Le bloc MES STATS � PRIV� existait mais avec un design ad-hoc (encadr� beige uniforme, pas d''ic�ne, mention � (7j) � dans la phrase, ligne � Top X% sur N membres actifs � toujours visible)
- Aucun bloc ACTIVIT� � 7 JOURS � l''info  n''�tait affich�e que dans la stat row du haut, sans contexte temporel ni mini-graphe

**Apr�s**
- MES STATS � PRIV� rendu identique � la PWA (pastille brand + ic�ne TrendingUp + texte sans � (7j) � + Top X% conditionnel)
- ACTIVIT� � 7 JOURS ajout� juste en-dessous, donne une vraie respiration visuelle au groupe avec le mini-graphe quotidien

**Note** : pas de feed des derniers �v�nements (post / acceptation) � il faudrait porter  dans  au pr�alable. � voir si tu veux que je l''ajoute pour avoir le bloc complet PWA.

---

## #36 — Détail groupe : MES STATS · PRIVÉ + ACTIVITÉ · 7 JOURS au design PWA

**Fichiers**
- Modifié : [src/components/icons/Icon.tsx](src/components/icons/Icon.tsx) — ajout icône `trending-up` (Lucide)
- Modifié : [app/(driver)/group/[id].tsx](app/(driver)/group/[id].tsx)
  - import `GroupDailyActivity` depuis `@taxilink/services`
  - state `daily: GroupDailyActivity[]` + appel `groupStatsService.getDailyActivity(id, 7)` dans le `Promise.all` du fetch initial
  - retrait du bloc inline `MES STATS · PRIVÉ` (encadré beige + texte simple)
  - nouveau composant local `MyStatsPanel` — réplique exacte de `apps/web/.../MyGroupStatsPanel.tsx` : pastille jaune brand/15 + icône `trending-up` + label uppercase + phrase « Tu as **partagé X** course et **accepté X** course dans ce groupe » + ligne verte « Top X% du groupe sur l'activité » uniquement si `percentile <= 30 && (shared+accepted) > 0`
  - nouveau composant local `ActivityFeed` — réplique de `apps/web/.../GroupActivityFeed.tsx` (header + barres uniquement, pas de feed événements car `groupActivityService` non porté côté mobile) : fond beige `#F7F5EF`, label uppercase « ACTIVITÉ · 7 JOURS », gros chiffre 26px, sous-ligne « Courses échangées », 7 mini-barres à droite (largeur 10px, hauteur proportionnelle au max du période, jaune brand `#FFD11A` pour la barre du jour, beige `#D9D7CF` pour les autres)

**Avant**
- Le bloc MES STATS · PRIVÉ existait mais avec un design ad-hoc (encadré beige uniforme, pas d'icône, mention « (7j) » dans la phrase, ligne « Top X% sur N membres actifs » toujours visible)
- Aucun bloc ACTIVITÉ · 7 JOURS — l'info `exchanged7d` n'était affichée que dans la stat row du haut, sans contexte temporel ni mini-graphe

**Après**
- MES STATS · PRIVÉ rendu identique à la PWA (pastille brand + icône TrendingUp + texte sans « (7j) » + Top X% conditionnel)
- ACTIVITÉ · 7 JOURS ajouté juste en-dessous, donne une vraie respiration visuelle au groupe avec le mini-graphe quotidien

**Note** : pas de feed des derniers événements (post / acceptation) — il faudrait porter `groupActivityService.getRecentEvents` dans `packages/services` au préalable. À voir si tu veux que je l'ajoute pour avoir le bloc complet PWA.

---

## #37 — Admin : supprimer le groupe + retirer un membre, avec mot de passe. Block driver = port PWA propre.

**Fichiers**
- Modifié : [packages/services/src/groupService.ts](../../packages/services/src/groupService.ts) — ajout `groupService.removeMember(groupId, driverId)` (delete sur `group_members` filtré par groupe + driver, RLS DB attendue pour valider que c'est bien un admin qui appelle)
- Ajout : [src/components/groupes/BlockDriverModal.tsx](src/components/groupes/BlockDriverModal.tsx) — port direct de `apps/web/.../groupes/BlockDriverModal.tsx` en bottom sheet RN. Header titre + bouton X, liste à puces avec les conséquences du block (X ne verra plus tes annonces, tu ne verras plus les siennes — gras) ou unblock (X reverra tes annonces, tu reverras les siennes — non gras), note en bas (« Le blocage est discret — la personne n'est pas notifiée »), boutons Annuler (white border) + Confirm rouge `#DC2626` pour block / noir `#0F0F0F` pour unblock. ActivityIndicator pendant l'appel `driverBlockService.block/unblock`. Pas de mot de passe — block est entièrement réversible côté profil
- Ajout : [src/components/groupes/PasswordConfirmModal.tsx](src/components/groupes/PasswordConfirmModal.tsx) — modal réutilisable pour confirmer les actions destructives par mot de passe. Bottom sheet RN avec titre + description + champ password (`secureTextEntry`, autoCapitalize=none) + bouton Confirm rouge ou noir selon `destructive`. Vérif via `supabase.auth.signInWithPassword({ email, password })` ; si OK appelle `onConfirmed()` puis ferme, sinon affiche « Mot de passe incorrect ». Réutilisé pour delete-group et kick-member
- Modifié : [app/(driver)/group/[id].tsx](app/(driver)/group/[id].tsx)
  - state `blockTarget`, `kickTarget`, `showDeleteGroup` (les 3 modals)
  - dérivation `isAdmin` via `members.find(m => m.driverId === user.id && m.role === 'admin')` — plus robuste que `group.createdBy` seul (gère le cas multi-admins futur)
  - retrait de l'ancien `handleToggleBlock` à base d'`Alert.alert` → `openBlockModal` qui set `blockTarget` (le `BlockDriverModal` prend le relais)
  - nouveau `openKickModal` + `confirmKick` qui appelle `groupService.removeMember(group.id, kickTarget.driverId)` puis filtre la liste locale
  - nouveau `confirmDeleteGroup` qui appelle `groupService.deleteGroup(group.id)` puis `router.back()`
  - bouton bas devient conditionnel : si admin → pavé rouge plein « Supprimer le groupe » avec icône trash + ouvre `PasswordConfirmModal` ; sinon → bouton border rouge « Quitter le groupe » comme avant (pas de mdp pour leave car réversible)
  - `MemberRow` reçoit 2 nouveaux props : `isAdminViewer` (booléen) + `onKick` ; ajoute un 5ème ContactBtn rouge avec icône trash visible uniquement si `isAdminViewer && !isMe` (admin peut virer n'importe qui sauf lui-même, y compris d'autres admins, comme demandé)
  - les 3 Modals sont rendus en dehors du ScrollView (pattern RN recommandé) : `<BlockDriverModal>` si `blockTarget`, `<PasswordConfirmModal>` pour kick si `kickTarget`, `<PasswordConfirmModal>` pour delete-group si `showDeleteGroup`

**Avant**
- Block / unblock confrère = `Alert.alert` natif basique, peu lisible (1 ligne, pas de hiérarchie visuelle)
- Pas de feature kick (admin ne pouvait pas retirer un membre du groupe)
- Pas de feature delete-group depuis l'écran détail (uniquement depuis le menu ⋮ de la carte dans la liste)
- Aucune confirmation par mdp pour les actions destructives → un tap accidentel suffisait à supprimer

**Après**
- Block / unblock = bottom sheet RN propre, identique au design PWA (bullets, note discrétion, CTA rouge ou noir)
- Admin peut retirer n'importe quel membre via un bouton trash rouge à droite de la row → modal mot de passe → DB update + filtre local
- Admin peut supprimer le groupe entier via un bouton bas rouge plein → modal mot de passe → DB delete cascade + retour vers /groupes
- Toutes les actions destructives (kick + delete) demandent le mot de passe TaxiLink (vérifié via `supabase.auth.signInWithPassword`) avant de s'exécuter → impossible de supprimer par erreur

**Notes / limites connues**
- Pour que le kick fonctionne réellement, la RLS de `group_members` doit autoriser un admin du groupe à `DELETE` les rows d'autres membres. Si la RLS actuelle ne l'autorise pas, l'appel échouera côté serveur (l'erreur sera affichée dans le modal mdp). À vérifier en DB si besoin.
- La PWA n'a pas de feature kick — c'est un ajout mobile uniquement à ce stade. Le pattern adopté ici (mdp obligatoire) est bien plus strict que les actions sensibles habituelles, donc safe par défaut.
- `signInWithPassword` consomme un refresh de session ; effet secondaire visible : la session est renouvelée à chaque vérif, pas de risque de logout intempestif mais ça réinitialise le compteur de TTL de session.
