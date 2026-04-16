# TaxiLink Pro — Journal de projet

> Fichier de suivi pour reprendre le développement à tout moment.
> Dernière mise à jour : 15 avril 2026 (session 4)

---

## RÉSUMÉ DU PROJET

Site web professionnel (style Uber/Airbnb) + application mobile PWA pour chauffeurs de taxi et VTC.

- **URL locale** : http://localhost:3000
- **Supabase** : https://qlnmthwouraqenoithor.supabase.co
- **Dossier** : C:\Users\yanni\desktop\applications\MO\

---

## ✅ CE QUI EST FAIT

### 1. Monorepo Turborepo
- Structure complète : `apps/web`, `packages/core`, `packages/ui`
- `turbo.json` configuré
- `package.json` racine avec workspaces npm

### 2. Base de données Supabase (projet : taxilink-pro)
- **Tables créées** :
  - `profiles` — utilisateurs (chauffeurs + clients)
  - `drivers` — infos chauffeur (véhicule, CPAM, note, nb courses)
  - `missions` — courses (disponibles, en cours, terminées)
  - `driver_documents` — documents chauffeur
  - `payments` — historique paiements
- **Row Level Security** activé sur toutes les tables
- **Trigger** : création automatique du profil à l'inscription
- **Seed** : 8 missions de démo insérées en base

### 3. Package @taxilink/core
- Types TypeScript : `Mission`, `Driver`, `AgendaRide`
- Données mock pour le développement

### 4. Package @taxilink/ui
- Design tokens (couleurs, ombres, border-radius)

### 5. Application Web Next.js 14 (apps/web)

#### Design system Tailwind
- Couleurs : primary #FFD23F, secondary #1A1A1A, accent #3B82F6
- Police Inter, animations, composants CSS personnalisés
- Fichier `globals.css` complet

#### Connexion Supabase
- `src/lib/supabase/client.ts` — client navigateur
- `src/lib/supabase/server.ts` — client serveur (SSR)
- `src/lib/supabase/types.ts` — types TypeScript générés

#### Variables d'environnement (apps/web/.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://qlnmthwouraqenoithor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Pages créées

| Route | Fichier | Statut |
|-------|---------|--------|
| `/` | `src/app/page.tsx` | ✅ Landing page complète |
| `/auth/login` | `src/app/auth/login/page.tsx` | ✅ Formulaire connexion Supabase |
| `/auth/register` | `src/app/auth/register/page.tsx` | ✅ Formulaire inscription (driver/client) |
| `/dashboard/chauffeur` | `src/app/dashboard/chauffeur/page.tsx` | ✅ Dashboard chauffeur complet |
| `/dashboard/client` | `src/app/dashboard/client/page.tsx` | ✅ Dashboard client complet |
| `/telecharger` | `src/app/telecharger/page.tsx` | ✅ Page QR code installation PWA |
| `/install` | `src/app/install/page.tsx` | ✅ Page installation (ancienne version) |

#### Composants créés

**Site public (`src/components/site/`)**
- `Navbar.tsx` — navigation responsive avec menu mobile
- `Hero.tsx` — section hero avec mockup app et CTAs
- `Stats.tsx` — bandeau statistiques (2400 chauffeurs, 184k courses...)
- `HowItWorks.tsx` — comment ça marche (chauffeur + client)
- `Features.tsx` — grille des 6 fonctionnalités
- `Testimonials.tsx` — 6 avis utilisateurs
- `DownloadSection.tsx` — section téléchargement avec QR
- `Footer.tsx` — pied de page complet

**Auth (`src/components/auth/`)**
- `LoginForm.tsx` — connexion email/password + redirection selon rôle
- `RegisterForm.tsx` — inscription avec choix rôle (chauffeur/client)
- `ForgotPasswordForm.tsx` — reset password via Supabase (lien reçu par email)

**Dashboard chauffeur (`src/components/dashboard/driver/`)**
- `DriverDashboard.tsx` — shell avec header, 6 tabs desktop, nav mobile 6 colonnes
- `DriverMissions.tsx` — missions temps réel + toasts notification nouvelles missions
- `DriverAgenda.tsx` — agenda semaine avec stats du jour
- `DriverStats.tsx` — statistiques (aujourd'hui / mois / total / par type)
- `DriverProfile.tsx` — modification profil + véhicule + toggle CPAM
- `DriverPayments.tsx` — historique virements, saisie IBAN, stats revenus (Supabase)
- `DriverDocuments.tsx` — upload documents vers Supabase Storage, barre progression, statuts

**Dashboard client (`src/components/dashboard/client/`)**
- `ClientDashboard.tsx` — réservation de taxi + historique des courses

**PWA — écrans chauffeur mobile (`src/components/`)**
- `flux/FluxScreen.tsx` — liste missions disponibles
- `flux/MissionCard.tsx`, `CurrentMissionCard.tsx`, `OnlineToggle.tsx`, `SortFilters.tsx`, `DayStats.tsx`
- `agenda/AgendaScreen.tsx` — agenda mobile
- `historique/HistoriqueScreen.tsx` — historique courses mobile
- `creer/CreerScreen.tsx` — formulaire publier une course (connecté Supabase, champs CPAM)
- `profil/ProfilScreen.tsx` + `ModalOverlay.tsx` — profil mobile
- `navigation/BottomNav.tsx` — nav bas mobile
- `AppShell.tsx` — shell global PWA

**Installation PWA (`src/components/install/`)**
- `DownloadPage.tsx` — page complète avec vrai QR code dynamique + instructions iOS/Android
- `InstallPage.tsx` — version simple

**UI partagés (`src/components/ui/`)**
- `Icon.tsx` — icônes Material Symbols
- `Badge.tsx` — badges types de mission
- `CountdownCircle.tsx` — compte à rebours SVG animé
- `Toast.tsx` — système de notifications toast (slide-in, auto-dismiss 4s)

#### Auth & Sécurité
- `src/middleware.ts` — protège `/dashboard/*`, redirige vers `/auth/login` si non connecté
- `/auth/forgot-password` — page reset password

#### PWA
- `public/manifest.json` — manifest installable
- `public/sw.js` — service worker cache-first
- `public/icons/icon-192.png` — icône PWA 192x192 (logo T jaune sur fond noir)
- `public/icons/icon-512.png` — icône PWA 512x512
- `public/icons/apple-touch-icon.png` — icône iOS 180x180
- Enregistrement automatique du SW dans le layout

#### Supabase Storage
- Bucket `driver-documents` créé (public, 5 MB max, PDF/JPG/PNG)

---

### 6. Maquettes HTML (session 4)

- **`mockup-redesign.html`** — Maquette landing page (style SensorTower / Vercel)
  - Suppression des deux sections "trust bars" (logos entreprises taxi + logos médias)
  - Design épuré, fond blanc, typographie Inter, palette noir/gris/amber
- **`mockup-app.html`** — Maquette application chauffeur (8 écrans navigables)
  - Barre de navigation storyboard (noire, en haut) pour switcher entre écrans
  - **Connexion** : carte centrée 380px, champs email/password, lien "Mot de passe oublié"
  - **Inscription étape 1** : email/password/confirmation + bouton Google, barre progression 2px
  - **Inscription étape 2** : nom/prénom/téléphone/département, grille 2×2
  - **Missions** : bannière mission en cours (bordure gauche amber), liste en tableau (Type | Trajet | Date·Durée | Montant)
  - **Agenda** : semaine en bandeaux de boutons jour (40px), KPIs du jour, timeline en lignes bordées
  - **Groupes** : liste de lignes avec stack d'avatars, compteur membres, badge admin
  - **Profil** : sidebar 240px (avatar + info) + zone principale KPIs + menu paramètres
  - **Partager mission** (modal) : étapes en segments 2px, sélecteur de type, champs adresse avec points de repère, rangée saisie vocale
  - Direction design : Inter, radius 6px max, bordures 1px `#E5E7EB`, hauteur header 52px, boutons 36px, **zéro emoji** (tout en SVG Feather), couleurs restraintes (amber uniquement pour accents)

---

## ❌ CE QUI RESTE À FAIRE

### PRIORITÉ 0 — Appliquer les maquettes au code Next.js (session 4, en attente validation)

- [ ] **Landing page** : appliquer `mockup-redesign.html` aux composants `src/components/site/` (Hero, Features, HowItWorks, etc.)
- [ ] **Auth pages** : appliquer `mockup-app.html` (Connexion + Inscription 2 étapes) à `LoginForm.tsx`, `RegisterStep1.tsx`, `RegisterStep2.tsx`
- [ ] **Dashboard chauffeur** : appliquer design SensorTower (Inter, radius 6px, tableau missions, aucun emoji) à `DriverMissions.tsx`, `DriverAgenda.tsx`, `DriverGroupesScreen.tsx`, `DriverProfilTab.tsx`
- [ ] **PartagerMissionModal** : implémenter le formulaire multi-étapes (BAN+OSRM geocoding, Web Speech API voix, RGPD patient, tarif CPAM préfectoral)
- [ ] **driverStore.load()** : n'est appelé nulle part — connecter dans `DriverDashboard.tsx` au montage

### PRIORITÉ 1 — Tests (à faire dès le prochain lancement)

- [ ] **Tester l'inscription** : créer un compte chauffeur + un compte client sur `/auth/register`
- [ ] **Tester la connexion** : vérifier la redirection auto vers `/dashboard/chauffeur` ou `/dashboard/client`
- [ ] **Tester les missions** : vérifier que les 8 missions de démo s'affichent dans le dashboard chauffeur
- [ ] **Tester l'acceptation** : accepter une mission → vérifier qu'elle passe en "Mission en cours"
- [ ] **Tester la réservation client** : réserver un taxi → vérifier qu'elle apparaît pour les chauffeurs
- [ ] **Tester les toasts** : nouvelle mission insérée en base → toast jaune doit apparaître
- [ ] **Tester le reset password** : aller sur `/auth/forgot-password` → vérifier réception email
- [ ] **Tester l'upload documents** : onglet Documents → uploader un PDF → vérifier dans Supabase Storage
- [ ] **Tester la PWA** : aller sur `/telecharger` → scanner QR → installer sur téléphone

### PRIORITÉ 2 — Déploiement (prochaine étape majeure)

- [ ] **Créer un repo GitHub** : pousser le code sur GitHub
- [ ] **Déploiement Vercel** : connecter le repo GitHub → Vercel → ajouter les variables d'env Supabase
- [ ] **Variables d'env production** : mettre la vraie URL Vercel dans `NEXT_PUBLIC_APP_URL`
- [ ] **Tester la PWA en production** : le QR code utilisera automatiquement l'URL Vercel

### PRIORITÉ 3 — Améliorations futures

- [ ] **SEO / Open Graph** : balises meta pour le partage sur réseaux sociaux
- [ ] **Vraies icônes PWA** : remplacer les icônes générées par un vrai logo graphique
- [ ] **Optimisation images** : utiliser `next/image` pour les photos chauffeurs
- [ ] **App mobile React Native** : `apps/mobile` avec Expo (structure vide, à construire)
- [ ] **Tests unitaires** : Vitest sur les composants clés
- [ ] **API Fastify** : optionnel — Supabase Realtime suffit pour l'instant

---

## COMMENT REPRENDRE

### Lancer le projet en local
```bash
# 1. Ouvrir un terminal (Windows + R → cmd → Entrée)
# 2. Aller dans le dossier web
cd C:\Users\yanni\desktop\applications\MO\apps\web

# 3. Lancer le serveur de développement
npm run dev

# 4. Ouvrir dans le navigateur
# http://localhost:3000
```

### Structure des fichiers importants
```
MO/
├── MO.md                          ← CE FICHIER
├── apps/
│   └── web/
│       ├── .env.local             ← Clés Supabase (ne pas partager !)
│       ├── src/
│       │   ├── middleware.ts      ← Protection routes /dashboard/*
│       │   ├── app/               ← Pages Next.js (routes)
│       │   │   ├── auth/login/
│       │   │   ├── auth/register/
│       │   │   ├── auth/forgot-password/  ← reset password
│       │   │   ├── dashboard/chauffeur/
│       │   │   └── dashboard/client/
│       │   ├── components/
│       │   │   ├── site/          ← Landing page
│       │   │   ├── auth/          ← Login / Register / ForgotPassword
│       │   │   ├── dashboard/driver/ ← 6 onglets chauffeur
│       │   │   ├── dashboard/client/
│       │   │   ├── flux/          ← Écrans PWA mobile
│       │   │   ├── agenda/
│       │   │   ├── historique/
│       │   │   ├── creer/         ← Publier une course (Supabase)
│       │   │   ├── profil/
│       │   │   ├── navigation/
│       │   │   ├── install/
│       │   │   └── ui/            ← Icon, Badge, Toast, CountdownCircle
│       │   ├── lib/supabase/      ← client.ts / server.ts / types.ts
│       │   └── store/             ← Zustand stores
│       └── public/
│           ├── manifest.json      ← PWA manifest
│           ├── sw.js              ← Service Worker
│           └── icons/             ← icon-192.png, icon-512.png, apple-touch-icon.png
└── packages/
    ├── core/                      ← Types + données mock
    └── ui/                        ← Design tokens
```

### Identifiants Supabase
- **URL** : https://qlnmthwouraqenoithor.supabase.co
- **Dashboard** : https://supabase.com/dashboard/project/qlnmthwouraqenoithor
- **Organisation** : Majors

---

## DESIGN SYSTEM (référence rapide)

| Élément | Valeur |
|---------|--------|
| Couleur principale | `#D97706` (amber — accent uniquement) |
| Couleur texte | `#111827` (near-black) |
| Fond | `#FFFFFF` blanc pur |
| Fond doux | `#F9FAFB` |
| Bordure | `#E5E7EB` (1px partout) |
| Texte secondaire | `#6B7280` |
| Texte muted | `#9CA3AF` |
| Statut en ligne | `#10B981` (vert, usage unique) |
| Police | Inter (400/500/600/700) |
| Radius small | 4px |
| Radius standard | 6px |
| Radius medium | 8px |
| Hauteur header | 52px |
| Hauteur tab bar | 40px |
| Hauteur bouton | 36px |
| Icônes | SVG inline Feather-style — **zéro emoji** |

> **Direction design** : SensorTower / Linear / Vercel — sobre, adulte, data-dense. Missions en tableau, pas en cartes. Couleurs restraintes.
