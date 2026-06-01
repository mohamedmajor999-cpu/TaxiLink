# Audit Expérience VTC — TaxiLink V3

**Date :** 2026-05-30
**Périmètre :** le VÉCU du chauffeur, écran par écran, comparé à un VTC haut de gamme (Uber/Bolt Driver). Cet audit porte sur la *sensation produit* (ce que le chauffeur ressent, voit, touche au quotidien), **distinct** des audits moteur/sécurité du 2026-05-29 (chaîne « recevoir une course », GPS/batterie, fuite PII RLS, prix non borné). Quand un constat recoupe ces sujets, il est noté mais non re-traité ici.

---

## 1. Résumé exécutif — à quel point sommes-nous loin d'un VTC pro ?

**Verdict global : pas si loin sur le cœur, mais à la traîne sur la finition et les filets de sécurité.** Les moments les plus critiques du métier — recevoir une offre riche, accepter en sécurité (hold-to-confirm), conduire une course par étapes claires, lancer Google Maps/Waze en un tap — sont **réellement aboutis** et atteignent le niveau Uber/Bolt. L'app n'est pas un prototype : carte d'offre dense, machine d'états horodatée, dark mode soigné, build APK déjà optimisé.

Là où ça « fait amateur », c'est sur tout ce qui rassure quand ça va mal (réseau qui tombe, bug d'affichage, urgence patient), sur l'argent (totaux faux, pas d'historique), et sur des promesses non tenues (écrans cités dans l'aide qui n'existent pas).

### Les 7 écarts qui font le plus « amateur vs pro » au quotidien
*(priorisés par impact × fréquence d'usage)*

1. **Les totaux de gains sont faux** (GAINS-02). Chaque carte de course affiche un prix estimé (« 35 € »), mais la page « Mes statistiques » du profil additionne un champ brut vide pour 83 % des courses → le chauffeur peut voir « 0 € » après une journée pleine. Sur une app d'argent, c'est le pire signal possible. *(Confiné à une page secondaire — voir détail.)*

2. **No-show / annulation inaccessibles depuis l'écran de course** (ACT-03). Le cas le plus fréquent du transport médical — arriver chez un patient absent — ne peut pas être déclaré sur l'écran où le chauffeur passe tout son temps. Il faut fermer, revenir sur l'onglet « Mes courses » et rouvrir un menu.

3. **Pas de son d'alarme à l'arrivée d'une offre quand l'app est ouverte** (OFF-01). Téléphone posé face au volant, en silencieux : une offre de 20 s peut passer totalement inaperçue (juste une vibration courte). Uber/Bolt « hurlent » même en silencieux.

4. **Aucun historique des courses terminées** (GAINS-03). Impossible de revoir la course d'hier (« combien j'ai gagné sur Mme X ? », « quelle adresse mardi ? »). Bloquant pour la compta perso et les litiges CPAM.

5. **Aucun signal quand le réseau tombe + erreurs invisibles** (RES-01 / RES-02). En zone blanche, le chauffeur voit une liste vide et croit qu'il n'y a aucune course, alors que le serveur n'a juste pas répondu. Anxiogène pour un outil dont dépend son revenu.

6. **Les gains ne sont pas en première ligne** (GAINS-01). « Combien j'ai gagné aujourd'hui ? » est l'info n°1 d'un VTC, mais elle est enterrée à 2-3 taps sous Profil, jamais visible à l'ouverture.

7. **Promesses non tenues dans l'aide** (SUP-01 / FIN-06 / DOC-02). La FAQ renvoie vers « Compte bancaire » et « Factures & reçus » qui n'existent pas, le téléphone support est un placeholder (+33 1 23 45 67 89), et le slot « Convention CPAM » plante à l'envoi. Effet « app vitrine » sur des points sensibles.

**À retenir :** la majorité des correctifs critiques consiste à **câbler des briques déjà codées** (effort court/moyen), pas à tout réécrire. Quelques-uns sont même livrables **sans nouveau build** (FAQ, contrainte CPAM en base).

---

## 2. Verdict par pan

| Pan | Score /10 | En une ligne |
|---|---|---|
| Navigation & carte pendant la course | **4** | Le « Y aller » Maps/Waze est solide, mais zéro ETA, zéro distance restante, zéro tracé d'itinéraire ; le service de routage existe mais n'est branché nulle part. |
| Réception d'offre & acceptation | **5,5** | Contenu de l'offre digne d'un VTC pro, mais trou sensoriel majeur (pas de son in-app) sur le scénario le plus fréquent. |
| Course en cours (états, no-show, annulation) | **6** | Socle d'états horodaté excellent, mais no-show/annulation injoignables depuis l'écran de course, pas de chrono d'attente, pas de récap de fin. |
| Gains, tarif & historique | **4,5** | Maillon faible : totaux faux sur une page, aucun historique consultable, gains enterrés sous Profil. |
| Confiance, sécurité & résilience | **5,5** | Bonnes fondations (UI optimiste, motifs d'annulation) mais s'effondre sur l'offline, les erreurs silencieuses, l'absence de SOS et de filet anti-crash. |
| Onboarding, permissions, documents & profil | **6** | Suivi documentaire et RGPD très pro, mais profil véhicule absent, statut de compte invisible, slot CPAM cassé, FAQ trompeuse. |
| Finition, performance & accessibilité | **7** | Cœur métier vraiment premium ; écarts périphériques réels (tunnel auth non thémé, pas de pull-to-refresh, pas de toasts). |

---

## 3. Synthèse des constats

> **Légende état :** BON = déjà au niveau pro · FAIBLE = présent mais incomplet/perfectible · ABSENT = à construire.
> Les priorités ci-dessous **intègrent les corrections de la vérification adverse** (plusieurs « haute/critique » ont été abaissées). Les constats invalidés (`confirmed=false` sur le fond) ne sont pas dans le détail — voir §5.x « Constats écartés/corrigés ».

| ID | Priorité | Pan | Titre | État | Build ? | Effort |
|---|---|---|---|---|---|---|
| **GAINS-02** | Critique → **Élevée** | Gains | Totaux de gains sous-comptés (page « Mes stats » lit un champ brut vide) | FAIBLE | Oui | S |
| **ACT-03** | Critique → **Élevée** | Course | No-show/annulation inaccessibles depuis l'écran de course | FAIBLE | Oui | S |
| **DOC-02** | Critique → **Élevée** | Profil | Slot « Convention CPAM » refusé par la base à l'envoi | FAIBLE | **Non** | T |
| **GAINS-03** | Critique → **Élevée** | Gains | Aucun historique des courses terminées | ABSENT | Oui | M |
| **RES-01** | Critique → **Majeure** | Confiance | Aucune détection réseau / bannière hors-ligne | ABSENT | Oui | M |
| **OFF-01** | Critique → **Élevée** | Offre | Aucun son in-app à l'arrivée d'une offre | ABSENT | Oui | M |
| **NAV-02** | Critique/Haute | Navigation | Aucun ETA pendant la course | ABSENT | Oui | M |
| **NAV-01** | Critique | Navigation | Bouton « Y aller » Maps/Waze adapté à la phase | BON | Non | T |
| **ACT-01** | Critique | Course | Machine à 6 états horodatée serveur | BON | Non | T |
| **ACT-02** | Critique | Course | Gros bouton d'action unique par étape | BON | Non | T |
| **OFF-02** | Haute → **Moyenne** | Offre | Vibration trop courte, non répétée | FAIBLE | Oui | S |
| **OFF-03** | Haute | Offre | Channel direct-offer sans bypassDnd ni son d'alarme dédié | FAIBLE | Oui | S |
| **NAV-03** | Haute → **Moyenne** | Navigation | Distance restante non affichée | ABSENT | Oui | S |
| **NAV-04** | Haute → **Moyenne** | Navigation | Pas de tracé d'itinéraire sur la carte | ABSENT | Oui | M |
| **ACT-04** | Haute → **Moyenne** | Course | Pas de contact si la course n'a pas de téléphone patient | FAIBLE | Oui | S |
| **ACT-05** | Haute → **Moyenne** | Course | Aucun chrono d'attente patient | ABSENT | Oui | M |
| **ACT-07** | Haute → **Moyenne** | Course | Écran course sans temps réel (données périmées possibles) | FAIBLE | Oui | M |
| **GAINS-01** | Haute → **Moyenne** | Gains | Pas de gains en 1 tap (pas d'onglet « Gains ») | FAIBLE | Oui | M |
| **GAINS-05** | Haute → **Moyenne** | Gains | Pas de récap de fin de course | ABSENT | Oui | M |
| **SAFE-01** | Haute | Confiance | Aucun bouton SOS pendant la course | ABSENT | Oui | M |
| **RES-02** | Haute | Confiance | Erreurs de chargement silencieuses (vide = panne) | FAIBLE | Oui | M |
| **RES-03** | Haute | Confiance | Pas d'ErrorBoundary (crash = écran blanc) | ABSENT | Oui | S |
| **RES-07** | Haute | Confiance | Support : téléphone/WhatsApp placeholder, FAQ vers écrans absents | FAIBLE | Non* | T |
| **ONB-01** | Haute | Onboarding | Pas de priming des permissions (popup OS brute) | FAIBLE | Oui | S |
| **PROF-01** | Haute | Profil | Profil véhicule absent (modèle/plaque/type prévus en base) | ABSENT | Oui | M |
| **PROF-02** | Haute → **Moyenne** | Profil | Statut de validation du compte (is_verified) jamais affiché | ABSENT | Oui | S |
| **SUP-01** | Haute | Profil | FAQ → écrans inexistants (bancaire, factures), tél placeholder | FAIBLE | Non* | S |
| **FIN-01** | Haute → **Moyenne** | Finition | Tunnel auth/onboarding non thémé (flash clair en mode nuit) | FAIBLE | Oui | M |
| **FIN-03** | Haute → **Moyenne** | Finition | Pas de pull-to-refresh sur les listes | ABSENT | Oui | S |
| **FIN-06** | Haute → **Moyenne** | Finition | FAQ cite écrans inexistants + upload web-only erroné | FAIBLE | **Non** | T |
| **NAV-05** | Moyenne | Navigation | Pas de contrôles carte (recentrer/zoom/plein écran) sur la course | ABSENT | Oui | M |
| **NAV-06** | Moyenne | Navigation | Caméra « auto-fit » plutôt que vrai suivi de conduite | FAIBLE | Oui | S |
| **NAV-10** | Moyenne | Navigation | Aperçu carte statique dans le modal d'offre | BON | Non | T |
| **OFF-04** | Moyenne | Offre | Geste d'accept incohérent (hold ailleurs, tap dans les modals) | FAIBLE | Oui | S |
| **OFF-05** | Moyenne | Offre | Pas de feedback de succès après accept d'offre directe | FAIBLE | Oui | S |
| **OFF-07** | Moyenne | Offre | 2 offres simultanées : la 2ᵉ écrase la 1ʳᵉ | ABSENT | Oui | M |
| **ACT-06** | Moyenne | Course | Géofencing auto retiré ; commentaires de code trompeurs | FAIBLE | Oui | M |
| **ACT-08** | Moyenne | Course | « Terminer » = simple tap, sans confirmation ni récap | FAIBLE | Oui | M |
| **ACT-09** | Moyenne | Course | Impossible d'annuler une étape posée par erreur | ABSENT | Oui | S |
| **ACT-10** | Moyenne | Course | Capture signature/bon de transport : base prête, aucune UI | FAIBLE | Oui | L |
| **ACT-11** | Basse | Course | StepBar (carte hero) à 4 segments ≠ 6 états réels | FAIBLE | Oui | S |
| **GAINS-04** | Moyenne | Gains | Composant Stats riche (heatmap, export CSV) jamais monté | FAIBLE | Oui | S |
| **GAINS-06** | Moyenne | Gains | État de paiement absent (table payments vide, FAQ promet un suivi) | ABSENT | Non | M |
| **GAINS-07** | Moyenne | Gains | Tarif non décomposé, badge « estimé » jamais affiché | FAIBLE | Oui | M |
| **SAFE-02** | Moyenne | Confiance | Pas de partage de trajet à un proche | ABSENT | Oui | L |
| **RES-04** | Moyenne | Confiance | Pas de toasts (tout en Alert bloquant) | FAIBLE | Oui | M |
| **RES-06** | Moyenne | Confiance | Pas de pull-to-refresh | ABSENT | Oui | S |
| **DOC-03** | Moyenne | Profil | Contrôle technique (ct) absent de l'UI alors qu'il existe en base | FAIBLE | Oui | T |
| **DOC-04** | Moyenne | Profil | Pas de capture photo in-app des documents | FAIBLE | Oui | S |
| **PROF-04** | Moyenne | Profil | Pas de changement de mot de passe in-app (RGPD sinon excellent) | FAIBLE | Oui | S |
| **ONB-02** | Moyenne | Onboarding | Onboarding marketing déconnecté du parcours d'activation réel | FAIBLE | Oui | M |
| **DEPT-01** | Moyenne | Profil | Sélection des départements (BON) | BON | Non | T |
| **REG-01** | Moyenne | Onboarding | Inscription minimale (pas de véhicule ni docs) | FAIBLE | Oui | M |
| **FIN-04** | Moyenne | Finition | Erreurs via Alert natif, pas de système de Toast | FAIBLE | Oui | M |
| **FIN-05** | Moyenne | Finition | Grossissement de police OS non géré | FAIBLE | Oui | M |
| **FIN-08** | Moyenne → **Basse** | Finition | Pas de gestion splash screen (micro-flash clair au démarrage) | ABSENT | Oui | S |
| **FIN-09** | Moyenne | Finition | Pas d'indicateur hors-ligne (doublon RES-01/FIN-09) | ABSENT | Oui | M |
| **FIN-10** | Moyenne | Finition | Pas d'ErrorBoundary global (doublon RES-03) | ABSENT | Oui | S |
| **NAV-07** | Moyenne → **Basse** | Navigation | Pas d'option Apple Plans iOS (aucune distrib iOS aujourd'hui) | ABSENT | Oui | S |
| **NAV-08** | Basse | Navigation | Deep-link n'enchaîne pas pickup→destination | FAIBLE | Oui | S |
| **NAV-09** | Basse | Navigation | Pas de reroute interne (délégué à Maps/Waze — OK) | ABSENT | Oui | L |
| **OFF-06** | Basse | Offre | « Course déjà prise » géré mais sans retour auto (broadcast) | BON | Oui | T |
| **OFF-08** | Basse | Offre | Countdown clair mais sans escalade rouge < 5 s | BON | Oui | S |
| **OFF-09** | Basse | Offre | Aperçu de course riche (BON) | BON | Non | T |
| **OFF-10** | Basse | Offre | « Refuser » broadcast = lien texte minuscule | FAIBLE | Oui | T |
| **OFF-11** | Basse | Offre | « Refuser » broadcast = dismiss local (label trompeur) | FAIBLE | Oui | T |
| **OFF-12** | Basse | Offre | Fallback Realtime + filtres robustes (BON) | BON | Non | T |
| **SAFE-03** | Moyenne → **Basse** | Confiance | Note (rating) jamais affichée (et pas réellement calculée) | ABSENT | Oui | S |
| **SAFE-04** | Basse | Confiance | Badge « vérifié » non exposé | ABSENT | Oui | T |
| **SAFE-05** | Basse | Confiance | Indicateur de fiabilité (click_loss_streak) jamais montré | ABSENT | Oui | S |
| **GAINS-08** | Basse | Gains | Pas d'objectif ni de projection de gains | ABSENT | Oui | L |
| **GAINS-09** | Basse | Gains | Vue par jour des courses planifiées (BON) | BON | Non | T |
| **GAINS-10** | Basse | Gains | Hero « course en cours » riche (BON) | BON | Non | T |
| **RES-05** | Basse | Confiance | Spinners bruts, pas de squelettes | FAIBLE | Oui | M |
| **DOC-01** | Haute → **Basse** | Profil | Suivi documentaire 6 statuts + expiration (BON) | BON | Non | T |
| **PROF-03** | Basse | Profil | Édition profil propre (BON) | BON | Non | T |
| **FIN-07** | Basse | Finition | Tags CPAM/PRIVÉ en pastels clairs hardcodés (dark mode) | FAIBLE | Oui | S |
| **FIN-11** | Basse | Finition | Spinners plein écran au lieu de skeletons | FAIBLE | Oui | M |
| **FIN-12** | Basse | Finition | Empty states soignés (BON) | BON | Non | T |
| **FIN-13** | Basse | Finition | Flow course + carousel hold-to-confirm (BON) | BON | Non | T |
| **FIN-14** | Basse | Finition | Build APK optimisé (BON) | BON | Non | T |
| **FIN-15** | Basse | Finition | Emoji/glyphes texte au lieu d'icônes SVG | FAIBLE | Oui | T |
| **FIN-16** | Basse | Finition | Police système au lieu d'Inter (à trancher) | FAIBLE | Oui | S |
| **GOOD-01** | Basse | Confiance | UI optimiste avec rollback (BON) | BON | Non | T |
| **GOOD-02** | Basse | Confiance | Annulation/no-show à motifs structurés (BON) | BON | Non | T |
| **GOOD-03** | Basse | Confiance | Empty states soignés (BON) | BON | Non | T |

\* *« Non* » = corrigeable sans nouveau build si le contenu est externalisé ; aujourd'hui codé en dur, donc en pratique un petit build (ou un passage en config distante).*

---

## 4. Constats écartés ou corrigés à la vérification

La relecture adverse a confirmé l'**état technique** de tous les constats, mais a **rectifié la priorité ou la formulation** de plusieurs. Aucun constat n'était un faux « ABSENT » à supprimer — mais voici les ajustements importants à connaître pour ne pas sur-réagir :

- **GAINS-02 (totaux faux) → priorité Critique abaissée à Élevée.** Le bug est réel mais **confiné à UNE seule page secondaire** : « Profil → Mes statistiques » (`profil/stats.tsx:49-50,61`) et `earningsService.getDailyStats`. L'onglet « Stats » de l'écran Courses (`StatsTabContent.tsx`) ET la home utilisent déjà `computeDisplayFare` → leurs chiffres sont corrects. Donnée vérifiée en base : 94/113 courses DONE ont `price_eur` NULL (83 %).
- **ACT-03 (no-show injoignable) → Critique abaissée à Élevée.** Ce n'est pas un cul-de-sac total : la fonction reste atteignable en 2-3 taps via le kebab « ··· » de la carte « EN COURS » de l'onglet Mes courses (`NextCourseHero.tsx:154-166`). Friction réelle et fréquente, mais contournement existant.
- **OFF-01 (pas de son) → Critique nuancée en Élevée.** Un chemin dégradé existe : si l'offre directe arrive **app au premier plan**, le push channel `direct-offer` (importance MAX) joue le son système par défaut. Reste manquant : un vrai son d'alarme répétitif, forçant le haut-parleur en silencieux, pour le cas Realtime pur.
- **RES-01 (offline) → Critique abaissée à Majeure.** Aucun flux cœur n'est cassé par cette seule absence ; le préjudice « croire qu'il n'y a pas de courses » vient surtout de **RES-02** (erreurs invisibles). À traiter ensemble.
- **ACT-07 (pas de temps réel) → Haute abaissée à Moyenne.** Le gap défensif est réel, **mais** les scénarios dramatiques (le poster édite/réattribue pendant la course) **ne sont pas atteignables** dans le backend actuel : l'édition/suppression poster est bloquée à `AVAILABLE` (403 sur IN_PROGRESS) et aucun chemin externe ne remet une course IN_PROGRESS en AVAILABLE.
- **NAV-03 / NAV-04 (distance restante, tracé) → Haute abaissée à Moyenne.** L'écran fournit déjà un repère de proximité (carte live + pin auto-fit) et un handoff Maps/Waze en 1 tap. Ce sont des manques de finition, pas des ruptures.
- **OFF-02 (vibration) → Haute abaissée à Moyenne.** Quand le tel est verrouillé/en poche, le push OS prend le relais (pattern long + son default). Défaut UX secondaire.
- **ACT-04 (pas de contact sans tél patient) → Haute abaissée à Moyenne.** Le cas « course sans téléphone » est un edge case ; **le fallback « numéro établissement » n'est pas réalisable** (la table `missions` n'a qu'un champ `phone`). Fix recommandé : un bouton support TaxiLink persistant.
- **ACT-05 (chrono d'attente) → Haute abaissée à Moyenne.** Vrai manque à gagner CPAM, mais couche de confort, non bloquante.
- **GAINS-01 / GAINS-05 → Haute abaissées à Moyenne.** Problèmes de *surfaçage* (les données existent déjà), pas de fonctions absentes.
- **PROF-02 (statut de compte) → Haute abaissée à Moyenne.** Le flag `is_verified` ne **bloque rien** aujourd'hui (les 13 chauffeurs prod roulent en `is_verified=false`). Défaut d'attente/promesse, pas un verrou métier.
- **SAFE-03 (note/rating) → Moyenne abaissée à Basse + correction de fond.** La note **n'est PAS calculée serveur** : `drivers.rating` est un placeholder statique (défaut 5.0, valeur 0 en prod), sans aucune table source d'avis. Afficher la colonne telle quelle serait trompeur. À reclasser en « construire la notation » plutôt que « brancher un affichage ».
- **DOC-01 (suivi documentaire) → Haute abaissée à Basse.** C'est un **point fort déjà livré**. Réserve : la chaîne d'expiration (états « expire bientôt »/alerte amber) est codée mais dormante car l'app mobile n'écrit jamais `expiry_date` (renseigné côté patron uniquement).
- **DOC-02 (slot CPAM) → Critique abaissée à Élevée.** C'est un slot **optionnel** ; les 4 docs obligatoires fonctionnent et l'onboarding n'est pas bloqué. L'échec est néanmoins 100 % reproductible et touche le cœur CPAM.
- **NAV-07 (Apple Plans) → Moyenne abaissée à Basse.** Aucune distribution iOS n'existe (`eas.json` 100 % Android) → impact réel nul aujourd'hui.
- **FIN-01 (auth non thémé) → Haute abaissée à Moyenne** · **FIN-03 (pull-to-refresh) → Haute abaissée à Moyenne** · **FIN-06 (FAQ) → Haute abaissée à Moyenne** · **FIN-08 (splash) → Moyenne abaissée à Basse.** Défauts de finition réels mais cosmétiques/non bloquants.
- **RES-07 / SUP-01 (support) → restent Haute, avec correction :** l'**email** `support@taxilink.fr` est **réel** (canal canonique partout). Seuls le **téléphone** (+33 1 23 45 67 89) et le **WhatsApp** (33123456789) sont des placeholders morts. Donc 1 canal joignable sur 3.

**Doublons identifiés** (même problème vu sous deux pans) : RES-01 ≈ FIN-09 (offline), RES-03 ≈ FIN-10 (ErrorBoundary), RES-04 ≈ FIN-04 (toasts), RES-06 ≈ FIN-03 (pull-to-refresh), RES-05 ≈ FIN-11 (skeletons), SUP-01 ≈ RES-07 ≈ FIN-06 (FAQ/support). À traiter **une seule fois** dans la roadmap.

---

## 5. Détail par priorité

### 5.1 — ÉLEVÉE / MAJEURE (à corriger en premier)

#### GAINS-02 — Les totaux de gains affichent un montant faux *(Gains · FAIBLE · build · S)*
- **Uber/Bolt :** le total Gains = somme exacte des montants affichés sur chaque course ; jamais une course payée comptée à 0 €.
- **TaxiLink aujourd'hui :** la page « Profil → Mes statistiques » additionne le champ brut `price_eur` (`profil/stats.tsx:49-50,61` et `earningsService.ts:41,62`). Or **83 % des courses terminées n'ont pas ce champ rempli** (94 sur 113 en base). Pendant ce temps, toutes les cartes (hero, liste du jour, détail) affichent un prix **estimé** via `computeDisplayFare()`. La clôture (`missionMutations.ts:34-41`) ne sauvegarde jamais le prix.
- **Impact chauffeur :** il voit « 35 € » sur chaque carte, mais le total du jour/mois affiche une fraction (souvent ~0 €). Il croit avoir été floué ou que l'app est cassée. **Perte de confiance immédiate.**
- **Reco :** faire passer `profil/stats.tsx` et `earningsService.getDailyStats` par `computeDisplayFare` (comme le fait déjà l'onglet Stats). Idéalement, **figer** le prix en base au moment de « Terminer » (remplir `price_eur`).
- **Bonne nouvelle :** la surface stats la plus utilisée (onglet « Stats » de l'écran Courses) est **déjà correcte**. Le bug est isolé sur une page secondaire.

#### ACT-03 — Déclarer un patient absent / annuler depuis l'écran de course *(Course · FAIBLE · build · S)*
- **Uber/Bolt :** « Annuler » et « Client absent » accessibles à tout moment via un menu permanent sur l'écran de course.
- **TaxiLink aujourd'hui :** le flux est **bon et complet** (`CourseActionsMenu.tsx`, 5 motifs annulation + 5 no-show, colonne `no_show` en base) mais câblé **uniquement** dans `MyCoursesTab.tsx:97` et `AgendaTabContent.tsx:171` — **jamais dans `active.tsx`**. L'écran de course n'a qu'« Appeler », « J'arrive » et le bouton d'avancement. Un commentaire du code (`missionProgressMutations.ts:85-88`) dit pourtant que l'action devrait être accessible « depuis la carte active ».
- **Impact chauffeur :** cas le plus fréquent du transport médical (patient absent) → sur l'écran où il passe son temps, il ne peut rien faire. Contournement existant mais pénible : fermer, aller sur « Mes courses », rouvrir le kebab.
- **Reco :** ajouter un bouton kebab « ··· » dans le header de `active.tsx` ouvrant le `CourseActionsMenu` déjà existant (réutiliser les handlers `onNoShow`/`onCancel`). `markNoShow` accepte déjà l'état IN_PROGRESS.

#### DOC-02 — Le slot « Convention CPAM » plante à l'envoi *(Profil · FAIBLE · sans build · T)*
- **Uber/Bolt :** tout document proposé dans l'UI est réellement enregistrable.
- **TaxiLink aujourd'hui :** l'UI propose un slot optionnel « Convention CPAM » (`useDocumentsScreen.ts:24-26`), mais la table `driver_documents` a une contrainte qui n'autorise que `carte_pro, assurance, ct, permis, carte_grise` — `convention_cpam` **n'y est pas**. De plus, le fichier est uploadé dans le bucket **avant** l'insertion en base (`useDocumentUpload.ts:97-108`) → en cas d'échec, un fichier orphelin reste, et le chauffeur voit un message d'erreur base brut, incompréhensible.
- **Impact chauffeur :** tout chauffeur qui tente de fournir sa convention CPAM (le document qui débloque les courses CPAM, cœur de cible) reçoit une erreur. Feature visiblement cassée.
- **Reco (livrable sans nouveau build) :** migration ajoutant `convention_cpam` à la contrainte. Bonus : inverser l'ordre (insérer en base avant d'uploader le fichier) et nettoyer le fichier orphelin sur échec.

#### GAINS-03 — Aucun historique des courses terminées *(Gains · ABSENT · build · M)*
- **Uber/Bolt :** historique complet et scrollable, chaque course ouvrable pour le reçu/détail.
- **TaxiLink aujourd'hui :** l'onglet « Mes courses » exclut les courses DONE (`missionQueries.ts:129` filtre `.neq('status','DONE')`, et `useDriverAgendaSync.ts:28-30` les retire en temps réel). La DateStrip remonte de 7 jours mais les jours passés sont **vides**. Les DONE n'existent que comme chiffres agrégés (pas de liste).
- **Impact chauffeur :** impossible de revoir une course d'hier (« combien sur Mme X ? », « adresse de mardi ? »). Bloquant pour la compta perso et les litiges CPAM.
- **Reco :** ajouter un écran « Historique » consommant `getDoneByDriver`, filtrable par période, chaque ligne ouvrant le détail. Bonne nouvelle : le composant `StatsTabContent` (déjà codé, jamais monté — voir GAINS-04) fournit la source DONE + export.

#### OFF-01 — Aucun son d'alarme à l'arrivée d'une offre (app ouverte) *(Offre · ABSENT · build · M)*
- **Uber/Bolt :** son perçant et répétitif (forçant même le haut-parleur en silencieux) dès qu'une demande arrive, app au premier plan.
- **TaxiLink aujourd'hui :** les 3 surfaces d'alerte in-app (`IncomingMissionOfferModal.tsx:37`, `useIncomingMissionAlertModal.ts:45`, `InAppNotificationBanner.tsx:29`) ne font **que vibrer**. Aucun fichier audio n'existe dans `assets/`, et `expo-audio` n'est utilisé que pour la dictée vocale. Le seul son vient du push système.
- **Impact chauffeur :** téléphone posé face au volant en silencieux → une offre de 20 s peut passer totalement inaperçue (juste une vibration courte). C'est le scénario le plus courant en stationnement d'attente.
- **Reco :** embarquer un son d'alerte (.wav court, en boucle pendant le countdown), le jouer via `expo-audio` au mount avec `setAudioModeAsync({ playsInSilentMode: true })`, et le couper à l'accept/refuse/expire. *(Un chemin dégradé existe déjà via le push channel direct-offer si l'offre arrive app au premier plan.)*

#### OFF-03 — Channel d'offre exclusive sans « bypass Ne-Pas-Déranger » ni son d'alarme *(Offre · FAIBLE · build · S)*
- **Uber/Bolt :** la demande est classée « alarme », sonne même tel verrouillé + Ne-Pas-Déranger actif.
- **TaxiLink aujourd'hui :** le channel Android `direct-offer` est bien en importance MAX (`usePushRegistration.ts`), **mais** `bypassDnd:false` (en contradiction avec le commentaire qui dit l'inverse) et `sound:'default'` (pas un son d'alarme dédié). La fonction serveur envoie `priority:'high'` + `sound:'default'` (`dispatch_mission/index.ts:73-76`).
- **Impact chauffeur :** tel verrouillé en pause de nuit avec Ne-Pas-Déranger → l'offre exclusive (20 s) peut rester muette.
- **Reco :** mettre `bypassDnd:true`, embarquer un son d'alarme long (côté channel ET payload push), le déclarer dans le plugin expo-notifications. *(Note : `bypassDnd` exige aussi une permission Android dédiée — vrai petit chantier, pas un simple flip.)*

#### NAV-02 — Aucun ETA (temps d'arrivée) pendant la course *(Navigation · ABSENT · build · M)*
- **Uber/Bolt :** ETA live en permanence (« 5 min », « arrivée 14:32 ») vers le pickup puis vers la dépose, recalculé en roulant.
- **TaxiLink aujourd'hui :** l'écran `active.tsx` n'affiche **aucun temps**. La durée n'existe que dans le détail pré-course et le modal d'offre. Ironie : le `routingService` (durée trafic Google) existe dans `packages/services` mais n'est branché que pour la publication d'annonce, jamais pendant la course.
- **Impact chauffeur :** il ne sait pas dans combien de temps il atteint le patient ni la destination ; ne peut pas prévenir d'un retard ni s'organiser entre deux courses. En transport médical CPAM, prévenir l'heure d'arrivée a une vraie valeur.
- **Reco :** brancher `routingService.computeRouteGoogle(driver → cible)` dans `ActiveMissionMap`, afficher un bandeau « Arrivée ~12 min · 8,3 km » au-dessus de la carte, rafraîchi toutes les ~30-60 s.

#### SAFE-01 — Aucun bouton SOS / urgence pendant la course *(Confiance · ABSENT · build · M)*
- **Uber/Bolt :** bouton bouclier SOS permanent qui appelle le 112/police et partage position + détails course.
- **TaxiLink aujourd'hui :** l'écran de course n'offre que Appeler / SMS / navigation (`active.tsx:206-211`). Aucun raccourci secours (recherche « SOS/urgence/112 » = 0).
- **Impact chauffeur :** en transport médical, il est seul avec un patient parfois fragile/agité. En cas d'incident (malaise, agression), aucun raccourci dans l'app : il doit déverrouiller, sortir du flux, composer un numéro. Manque le filet rassurant que tous les VTC pros offrent.
- **Reco :** bouton SOS discret mais permanent sur l'écran de course. V1 sans backend = appel 112 (`Linking.openURL('tel:112')`) + signalement contextualisé à TaxiLink. Partage de position en option (SAFE-02).

#### RES-02 — Erreurs de chargement silencieuses (vide = panne indistinguable) *(Confiance · FAIBLE · build · M)*
- **Uber/Bolt :** état d'erreur explicite (« Impossible de charger — Réessayer ») avec bouton retry.
- **TaxiLink aujourd'hui :** tous les écrans-liste envoient l'erreur **uniquement** vers Sentry, sans rien dire au chauffeur (`mission/[id].tsx:58`, `StatsTabContent:53`, `AnnoncesTab:41`, l'onglet Disponibles n'attrape même pas l'erreur du tout). Après le catch, l'écran affiche l'état vide « normal ». Sur le détail mission, une coupure réseau affiche « Course introuvable » comme si elle était supprimée.
- **Impact chauffeur :** une coupure réseau au mauvais moment fait croire qu'il n'a **aucune course / aucune annonce / aucune stat**, alors que le serveur n'a pas répondu. Il ne sait pas qu'il faut réessayer. Sur l'onglet Disponibles, c'est une **perte directe de revenu** (il croit qu'il n'y a rien à prendre).
- **Reco :** introduire un état « erreur » distinct du « vide » : un flag dans chaque hook + un `ErrorState` partagé « Chargement impossible — Réessayer » (relance le fetch). À coupler avec RES-01 et le pull-to-refresh.

#### RES-03 — Pas d'ErrorBoundary : un bug d'affichage blanchit toute l'app *(Confiance · ABSENT · build · S)*
- **Uber/Bolt :** l'arbre est encapsulé dans un ErrorBoundary qui montre « Oups, recharge » au lieu d'un crash nu.
- **TaxiLink aujourd'hui :** aucun ErrorBoundary nulle part (`app/_layout.tsx` et `(driver)/_layout.tsx` n'enveloppent rien). Sentry capte les erreurs async mais pas les erreurs de rendu.
- **Impact chauffeur :** une donnée malformée (un `null` inattendu) tue toute l'app sur un écran blanc, **au pire pendant une course** → il doit forcer la fermeture et relancer.
- **Reco :** envelopper la racine dans un `Sentry.ErrorBoundary` (déjà dispo) avec un fallback « Une erreur est survenue — Recharger ». ~15 lignes, gros gain de robustesse perçue.

#### RES-07 / SUP-01 — Support injoignable + FAQ vers des écrans fantômes *(Confiance/Profil · FAIBLE · sans build* · S)*
- **Uber/Bolt :** un canal de contact réel et joignable ; l'aide pointe vers des écrans qui existent.
- **TaxiLink aujourd'hui :** `support.tsx:10-11` code en dur un téléphone placeholder (+33 1 23 45 67 89) et un WhatsApp factice (33123456789). La FAQ renvoie vers « Profil → Compte bancaire / changer IBAN » et « Profil → Factures & reçus » qui **n'existent pas** (l'arbo profil n'a que : infos perso, stats, documents, départements, bloqués, support). **Correction :** l'email `support@taxilink.fr` est en revanche **réel** (canal canonique). Donc 1 canal joignable sur 3.
- **Impact chauffeur :** un chauffeur en difficulté tape le numéro → tombe dans le vide. Il lit qu'il peut gérer son IBAN / télécharger ses reçus, cherche les écrans, ne les trouve pas. Plus grave que les manques esthétiques : c'est le filet de secours humain.
- **Reco :** remplacer téléphone/WhatsApp par de vraies coordonnées (idéalement via variable d'environnement plutôt qu'en dur, et aligner web/v2/v3) ; réécrire la FAQ pour ne décrire que des parcours existants (et corriger la mention « upload web-only » → l'upload mobile fonctionne, voir FIN-06).

#### ONB-01 — Permissions demandées en popup OS brute, sans explication *(Onboarding · FAIBLE · build · S)*
- **Uber/Bolt :** écran « pourquoi on a besoin de votre position/notifs » AVANT le dialogue système → maximise l'acceptation.
- **TaxiLink aujourd'hui :** la localisation est demandée directement par l'OS au passage en ligne (`useDriverOnlineTracking.ts:373`) ; les notifications sont demandées au boot dès que `user.id` existe (`usePushRegistration.ts:91`), sans contexte. Le seul priming bien fait (`BackgroundLocationPrompt.tsx`) a été **débranché** le 2026-05-24 → code mort. En cas de refus, juste une Alert vers les Réglages.
- **Impact chauffeur :** au 1ᵉʳ lancement, popup notifications brute sans savoir pourquoi → taux de refus élevé. Un refus casse l'arrivée des courses (push) ET la notif permanente du service GPS. Plus aucun moyen in-app de re-demander proprement.
- **Reco :** réintroduire un écran de priming court AVANT chaque demande (réutiliser le visuel de `BackgroundLocationPrompt`). Ne pas demander les notifs au boot à froid : différer au 1ᵉʳ passage en ligne. Limiter la re-demande (max 1×/session).

#### PROF-01 — Profil véhicule absent (modèle/plaque/type) *(Profil · ABSENT · build · M)*
- **Uber/Bolt :** le chauffeur déclare et édite son véhicule (marque/modèle, plaque, catégorie) — central pour l'identification côté client.
- **TaxiLink aujourd'hui :** la table `drivers` a `vehicle_model`, `vehicle_type`, `vehicle_plate`, mais **aucun écran mobile ne les lit ou édite**. `personal-info.tsx` ne touche que prénom/nom/téléphone. Pas de champ véhicule à l'inscription non plus.
- **Impact chauffeur :** il ne peut jamais renseigner ni corriger son véhicule (changement de voiture, nouvelle plaque). Manque structurant pour l'identification client future.
- **Reco :** section « Mon véhicule » éditable (modèle, plaque, type via sélecteur des 4 valeurs). *(Note technique : étendre `driverService.updateDriver` qui ne supporte pas encore `vehicle_type`.)* Priorité « haute » à lire comme structurelle, pas bloquante runtime.

---

### 5.2 — MOYENNE

- **GAINS-01 — Pas de gains en 1 tap.** La BottomNav (`BottomNav.tsx:11-16`) n'a pas d'onglet « Gains » ; le solde du jour est à 2-3 taps sous Profil, jamais visible à l'ouverture. *Reco : une chip « 87 € · 4 courses » dans le top bar de la home (donnée déjà calculée par `earningsService.getDailyStats`), ou un 5ᵉ onglet « Gains ».*
- **GAINS-05 — Pas de récap de fin de course.** « Terminer » appelle `complete()` puis `router.back()` immédiat (`active.tsx:117-122`) — aucun écran « +14,50 € · total du jour ». La course disparaît dans le vide. *Reco : un bottom-sheet de fin (montant, durée réelle, total du jour), modèle = `MissionAcceptedCelebration`.*
- **GAINS-04 — Composant Stats riche jamais monté.** `StatsTabContent.tsx` (heatmap 180j + KPI + période + export CSV) est complet mais **importé nulle part**. *Reco : le monter (corrigé pour GAINS-02) comme contenu de `profil/stats.tsx` ou onglet « Gains ». Du travail déjà fait qui dort.*
- **GAINS-07 — Tarif non décomposé.** Un seul chiffre, pas de détail forfait/km/majorations, et le badge « estimé » (`isEstimated`) n'est jamais affiché. *Reco : accordéon de décomposition sous le prix ; au minimum afficher le badge « estimé ».*
- **NAV-03 / NAV-04 — Distance restante & tracé d'itinéraire.** Ni distance restante ni ligne de route sur la carte de course (`ActiveMissionMap.tsx` ne rend que 2 pins). Le service renvoie pourtant la géométrie, jamais dessinée. *Reco : afficher la distance via haversine (déjà dispo dans `src/lib/geo.ts`) à côté de l'ETA ; tracer la polyline avec `ShapeSource`+`LineLayer`.*
- **NAV-05 / NAV-06 — Contrôles carte & suivi.** Pas de bouton recentrer/zoom/plein écran sur l'écran de course ; la caméra fait un `fitBounds` forcé toutes les ~10 s qui « combat » l'utilisateur. *Reco : bouton recentrer + plein écran ; ne recentrer qu'au tap.*
- **OFF-04 — Geste d'accept incohérent.** Hold-to-accept 1,25 s au carousel/détail, mais **simple tap** dans les modals d'alerte. *Reco : unifier (brancher `useHoldAccept` dans le modal d'offre).*
- **OFF-05 — Pas de feedback de succès après accept d'offre directe.** Le modal se ferme sans célébration ni navigation. *Reco : naviguer vers `/mission/[id]` + toast/célébration.*
- **OFF-07 — 2 offres simultanées : la 2ᵉ écrase la 1ʳᵉ.** Un seul state d'offre (`useIncomingMissionOffer.ts:57`) ; pire, après le swap, accepter valide la **mauvaise** offre. Déclencheur étroit (2 missions concurrentes sur le même chauffeur). *Reco : ne pas écraser une offre affichée ; mettre en file.*
- **ACT-04 — Pas de contact si pas de tél patient.** Tout le bloc contact est conditionné à `mission.phone` (`active.tsx:206`). *Reco : bouton support TaxiLink TOUJOURS visible (le fallback « numéro établissement » n'est pas réalisable, la table n'a qu'un champ `phone`).*
- **ACT-05 — Pas de chrono d'attente.** `arrived_at_pickup_at` est posé mais le temps écoulé n'est jamais affiché. *Reco : chrono live à l'étape « arrivé » + bouton « Patient absent » au-delà d'un seuil ; persister la durée pour la facturation.*
- **ACT-06 — Géofencing retiré, commentaires trompeurs.** L'auto-détection d'arrivée a été supprimée (faux positifs) mais les commentaires des mutations parlent encore de « geofence GPS rayon 80m ». *Reco : corriger les commentaires ; à terme, géofence non-bloquante (faire pulser le bouton sans auto-valider).*
- **ACT-07 — Écran course sans temps réel.** Fetch one-shot au montage, pas de souscription ni refetch on focus ; les mutations échouent silencieusement sur mismatch. *Reco : refetch on focus + `useMissionRealtime` + guard sur les statuts. (Scénarios dramatiques non atteignables dans le backend actuel — voir §4.)*
- **ACT-08 — « Terminer » sans confirmation.** Simple tap → clôture immédiate, irréversible, sans récap. *Reco : slide-to-confirm + mini-récap, et ajouter un filtre de statut sur `complete()`.*
- **ACT-09 — Pas d'annulation d'étape.** Un « Patient à bord » tapé par erreur est définitif. *Reco : « Revenir à l'étape précédente » dans le kebab du header.*
- **ACT-10 — Capture signature/bon : base prête, aucune UI.** `pickup_signature_url` existe, le commentaire de `markDropped` promet la saisie, mais aucune UI. *Reco : étape de capture optionnelle (signature + photo) entre « déposé » et « Terminer » ; a minima corriger le commentaire trompeur.*
- **RES-04 / FIN-04 — Pas de toasts.** Tout passe par `Alert.alert` bloquant, y compris les succès anodins (« Course acceptée »). *Reco : `useToasts` + `ToastHost` (le pattern d'animation de `InAppNotificationBanner` sert de base) ; garder Alert pour les vraies décisions.*
- **RES-06 / FIN-03 — Pas de pull-to-refresh.** Aucun `RefreshControl` dans tout le projet ; le rafraîchissement repose sur le realtime (partiellement cassé par ailleurs). *Reco : brancher un `RefreshControl` sur Disponibles (`refresh()` existe déjà dans `useAvailableTab.ts:49`), Mes courses, Annonces, Stats.*
- **RES-01 / FIN-09 — Pas de détection réseau.** Aucun NetInfo, aucune bannière hors-ligne. *Reco : ajouter `expo-network` (ou `@react-native-community/netinfo`) + bannière persistante « Pas de connexion » dans `(driver)/_layout.tsx`, et rescan au retour réseau.*
- **DOC-03 — Contrôle technique absent de l'UI.** Le type `ct` est autorisé en base mais n'est proposé nulle part. *Reco : ajouter `{ type: 'ct', label: 'Contrôle technique' }` — aucune migration nécessaire.*
- **DOC-04 — Pas de capture photo des documents.** Uniquement file picker. *Reco : ajouter « Prendre une photo » (expo-image-picker) réutilisant le pipeline existant.*
- **PROF-02 — Statut de compte invisible.** `is_verified` jamais affiché. *Reco : ligne « Statut du compte » dans le profil. (Ne bloque rien aujourd'hui — défaut d'attente, pas verrou métier.)*
- **PROF-04 — Pas de changement de mot de passe in-app.** Seul chemin = « mot de passe oublié » après déconnexion. La suppression RGPD est, elle, **excellente**. *Reco : entrée « Changer mon mot de passe » (`supabase.auth.updateUser`) ; porter aussi l'export RGPD sur mobile.*
- **ONB-02 / REG-01 — Onboarding déconnecté de l'activation.** L'onboarding promet une « Vérification ADS » reliée à aucun flux ; l'inscription ne collecte ni véhicule ni documents. *Reco : mini-parcours d'activation post-signup (profil → véhicule → documents) avec progression, ou bannière home « Complète ton profil ».*
- **GAINS-06 — État de paiement absent.** La table `payments` existe mais est **vide** et non branchée ; la FAQ promet pourtant des délais de versement. *Reco produit : si les paiements restent hors-app, retirer le code mort et corriger la FAQ ; sinon, alimenter la table et brancher un écran « Paiements ».*
- **FIN-01 — Tunnel auth/onboarding non thémé.** Les 6 écrans `(auth)` n'utilisent jamais le thème → flash blanc éblouissant au lancement en mode nuit. *Reco : brancher `useTheme()` sur login + onboarding.*
- **FIN-05 — Grossissement de police OS non géré.** Aucun `maxFontSizeMultiplier` ; un modal force même `allowFontScaling={false}`. *Reco : `Text.defaultProps.maxFontSizeMultiplier ≈ 1.3` global + tester les cards denses.*
- **FIN-06 — FAQ erronée (doublon SUP-01).** *Reco : corriger les chaînes dans `support.tsx` (retirer Factures/Bancaire inexistants, corriger « upload web-only » → l'upload mobile marche). **Livrable sans nouveau build si externalisé.***

---

### 5.3 — BASSE & POINTS À NE PAS DÉGRADER

**Petits écarts à grouper avec les chantiers ci-dessus :**
- **NAV-08 / NAV-09 / NAV-07** (deep-link mono-point ; pas de reroute interne — OK car délégué à Maps/Waze ; Apple Plans — sans objet tant qu'il n'y a pas d'iOS).
- **OFF-08** (countdown sans escalade rouge < 5 s), **OFF-10/OFF-11** (« Refuser » broadcast = lien texte minuscule + label trompeur → renommer « Plus tard »).
- **ACT-11** (StepBar carte hero à 4 segments ≠ 6 états réels — à aligner avec le chrono ACT-05).
- **SAFE-03** (note jamais affichée — **à reclasser « construire la notation »** : `rating` est un placeholder non calculé), **SAFE-04** (badge « vérifié »), **SAFE-05** (indicateur de fiabilité `click_loss_streak` jamais montré — mécanique « boîte noire »).
- **GAINS-08** (objectifs/projections — phase coaching ultérieure).
- **RES-05 / FIN-11** (skeletons), **FIN-07** (pastels CPAM/PRIVÉ non adaptés au dark mode), **FIN-08** (micro-flash splash), **FIN-15** (emoji 🙈/👁 dans le login au lieu d'icônes SVG), **FIN-16** (police système vs Inter — décision produit à trancher).

**Ce qui est DÉJÀ au niveau VTC pro (à conserver tel quel) :**
- **NAV-01** — Bouton « Y aller » Maps/Waze, cible adaptée à la phase (pickup → destination), respecte la préférence du chauffeur. Socle solide.
- **NAV-10** — Aperçu carte statique (pins pickup vert + dépose noir) dans le modal d'offre. Solution pragmatique (évite le crash de 2 contextes Mapbox).
- **OFF-09 / OFF-12** — Contenu d'offre riche (prix XXL, distance pickup, timeline, patient) ; fallback Realtime + filtres robustes.
- **ACT-01 / ACT-02 / ACT-12** — Machine à 6 états horodatée (source unique de vérité), gros bouton d'action unique par étape, carte Mapbox live + nav externe. *(Nuance ACT-01 : les horodatages côté chauffeur sont en heure appareil, pas serveur — sujet mineur de qualité de donnée.)*
- **GAINS-09 / GAINS-10** — Vue par jour des courses planifiées (header avec total du jour) ; hero « course en cours » avec urgence GPS couleur. Très bons réflexes produit.
- **DOC-01** — Suivi documentaire 6 statuts + ratio « X/Y à jour » + alerte d'expiration + délai de vérification. Point fort. *(Réserve : la chaîne d'expiration est dormante car l'app n'écrit jamais `expiry_date`.)*
- **DEPT-01 / PROF-03** — Sélection des départements claire ; édition profil propre (dirty-state, validation).
- **GOOD-01 / GOOD-02 / GOOD-03** — UI optimiste avec rollback ; annulation/no-show à motifs structurés ; empty states soignés.
- **FIN-12 / FIN-13 / FIN-14** — Empty states ; flow course + carousel hold-to-confirm ; build APK déjà optimisé (minify, shrink, arm64, proguard ciblé).

---

## 6. Roadmap priorisée

### (A) Quick wins SANS nouveau build *(config, base, contenu)*
*Ordre = impact/effort décroissant.*

1. **Ajouter `convention_cpam` à la contrainte de `driver_documents`** (DOC-02) — une migration, débloque immédiatement l'envoi de la convention CPAM.
2. **Corriger le contenu de la FAQ support** (FIN-06 / SUP-01) — retirer les renvois « Compte bancaire » et « Factures & reçus » inexistants, corriger « upload web-only » (l'upload mobile marche). *Livrable sans build uniquement si la FAQ est externalisée ; sinon → bucket (B).*
3. **Remplacer le téléphone/WhatsApp support placeholder** (RES-07) — par de vraies coordonnées joignables. *Idem : sans build seulement si externalisé.*
4. **Décision « paiements »** (GAINS-06) — si hors-app, ajuster la FAQ (déjà couvert en 2) ; la donnée `payments` peut être alimentée côté serveur sans build.

### (B) À inclure dans le PROCHAIN BUILD *(corrections code, regroupées)*

**Lot « Argent & historique »** (fort impact, effort modéré) :
1. Brancher les agrégats de gains sur `computeDisplayFare` + persister le prix à la clôture (**GAINS-02**).
2. Monter `StatsTabContent` + écran/onglet Historique des courses terminées (**GAINS-03**, **GAINS-04**).
3. Chip « gain du jour » dans le top bar home (**GAINS-01**) + bottom-sheet de récap de fin de course (**GAINS-05**).

**Lot « Course en cours »** :
4. Kebab no-show/annulation dans le header de l'écran de course (**ACT-03**) — *priorité 1 absolue, câblage simple*.
5. Bouton SOS (V1 = appel 112 + signalement) (**SAFE-01**).
6. Slide-to-confirm + récap sur « Terminer » (**ACT-08**), annulation d'étape (**ACT-09**), bouton support persistant (**ACT-04**), chrono d'attente (**ACT-05**).

**Lot « Navigation »** :
7. Bandeau ETA + distance restante au-dessus de la carte (**NAV-02**, **NAV-03**) + tracé d'itinéraire (**NAV-04**) + bouton recentrer/plein écran (**NAV-05**).

**Lot « Résilience & confiance »** :
8. ErrorBoundary global (**RES-03**) — *15 lignes, gros gain*.
9. Détection réseau + bannière hors-ligne (**RES-01/FIN-09**) + état d'erreur distinct du vide avec retry (**RES-02**) + pull-to-refresh (**RES-06/FIN-03**).
10. Système de toasts (**RES-04/FIN-04**).

**Lot « Offre »** :
11. Son d'alarme in-app répétitif + `bypassDnd` + son dédié sur le channel (**OFF-01**, **OFF-03**) ; vibration en pattern répété (**OFF-02**).
12. Unifier le geste d'accept + feedback de succès (**OFF-04**, **OFF-05**) ; ne plus écraser une offre affichée (**OFF-07**).

**Lot « Onboarding & profil »** :
13. Priming des permissions (**ONB-01**), section « Mon véhicule » (**PROF-01**), statut de compte (**PROF-02**), CT + capture photo documents (**DOC-03**, **DOC-04**), changement de mot de passe (**PROF-04**).

**Lot « Finition »** :
14. Thémer le tunnel auth/onboarding (**FIN-01**), gestion police OS (**FIN-05**), splash propre (**FIN-08**), pastels dark mode (**FIN-07**), icônes SVG vs emoji (**FIN-15**), skeletons (**RES-05/FIN-11**).

### (C) Décisions produit / chantiers de fond

1. **Construire le système de notation** (SAFE-03) — `rating` n'est qu'un placeholder ; sans flux d'avis client + agrégation, ne rien afficher.
2. **Modèle de paiement** (GAINS-06) — décider si le règlement est suivi dans l'app (alors construire écran « Paiements » + suivi versement) ou hors-app (retirer le code mort).
3. **Transparence de la mécanique de fiabilité** (SAFE-05) — trancher si l'on expose `click_loss_streak` au chauffeur.
4. **Parcours d'activation guidé post-inscription** (ONB-02 / REG-01) — checklist véhicule + documents avec progression.
5. **Capture de preuve CPAM** (ACT-10) — signature + photo du bon de transport (conformité/litiges).
6. **Partage de trajet à un proche** (SAFE-02) — chantier full-stack, faible priorité côté chauffeur.
7. **Décompte tarifaire détaillé** (GAINS-07) et **objectifs/coaching** (GAINS-08) — phases ultérieures.
8. **Décision typographie** (FIN-16) — assumer la police système ou charger Inter.

---

## 7. TOP 5 pour passer d'amateur à pro

1. **Réparer les totaux de gains** (GAINS-02) — qu'une journée pleine n'affiche plus « 0 € » : c'est la confiance n°1 sur une app d'argent.
2. **Mettre le no-show/annulation sur l'écran de course** (ACT-03) — pour que le chauffeur devant une porte fermée puisse agir sans quitter son écran.
3. **Faire « hurler » l'offre** (OFF-01 + OFF-03) — un vrai son d'alarme répétitif, même en silencieux, pour ne plus rater de course téléphone posé.
4. **Rendre les pannes visibles** (RES-01 + RES-02 + RES-03) — bannière hors-ligne, erreurs avec bouton « Réessayer », et filet anti-crash, pour que l'app n'ait jamais l'air « cassée ».
5. **Ouvrir l'historique et le gain du jour** (GAINS-03 + GAINS-01) — un onglet/écran pour revoir ses courses passées et voir son gain du jour dès l'ouverture.

---
*Fin de l'audit. Tous les constats sont issus de la vérification croisée du code v3 ; les priorités intègrent les corrections de la relecture adverse (voir §4).*
