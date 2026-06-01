# TaxiLink — Récap des correctifs du 18 mai 2026

> Résumé pédagogique pour quelqu'un qui n'est pas développeur.

Tu as signalé 7 problèmes ce jour-là. On en a résolu 6, le 7ème (bugs Pixel) attend tes symptômes précis. Voici ce qui a changé, en termes simples.

---

## 1. "L'admin voit les chauffeurs connectés oui puis non"

**Le problème.** Imagine que tes chauffeurs sont des voitures avec un phare qui clignote toutes les 15 secondes pour dire « je suis là ». Ton tableau de bord (l'admin) écoute ces phares. Si le phare met plus de 120 secondes à clignoter, le système considère la voiture éteinte. Sur les Pixel/Samsung récents, Android met l'app en « veille profonde » pour économiser la batterie — et le phare clignote plus lentement que prévu. Résultat : le chauffeur disparaît du dashboard alors qu'il est bien là, puis réapparaît au prochain clignotement.

**Ce qu'on a fait.**

- **Côté serveur** : on est passé de 120s à 180s de tolérance, et le serveur vérifie maintenant toutes les 30s (au lieu de 60s). Plus de marge, moins de clignotement.
- **Côté mobile** : on a ajouté un deuxième « phare » qui clignote toutes les 30s — uniquement pour dire « présent », sans rien d'autre. Comme ça si le GPS est paresseux, on signale quand même la présence.
- **Côté admin** : avant, le dashboard se rafraîchissait toutes les 10s en posant la question « qui est là ? ». Maintenant il est connecté en temps réel — dès qu'un chauffeur arrive ou part, le dashboard le voit dans la seconde.

---

## 2. "Je ne vois pas tous les chauffeurs sur la carte admin"

**Le problème.** L'ancienne version disait : « n'affiche un chauffeur QUE s'il a une position GPS récente ». Mais si un chauffeur vient d'allumer son téléphone et que le GPS n'a pas encore « verrouillé » sa position (ça peut prendre 30s, surtout en intérieur), il était invisible.

**Ce qu'on a fait.** L'admin reçoit maintenant **tous** les chauffeurs en ligne. Ceux avec une position GPS récente apparaissent sur la carte. Ceux sans GPS récent apparaissent dans un compteur séparé « X chauffeurs sans GPS » — tu sais qu'ils sont là, juste que tu ne sais pas où.

---

## 3. "L'app consomme trop de batterie"

**Le problème.** L'app allumait **deux fois** la radio GPS en parallèle : une fois pour la carte foreground (l'écran que voit le chauffeur), une fois pour le suivi en arrière-plan. Comme une voiture qui ferait tourner deux moteurs en même temps. Plus : la précision était toujours réglée au max ("balanced"), même quand le chauffeur attend tranquillement sans course.

**Ce qu'on a fait (4 changements).**

- **Une seule radio GPS à la fois.** Quand le suivi arrière-plan tourne, la carte lit la dernière position connue au lieu de réactiver la radio. Gain estimé : 40-50% de batterie.
- **Précision adaptative.** En attente (idle), on passe de « précis à 100m » à « précis à 500m » (suffisant pour savoir dans quel département est le chauffeur). En course active, on garde la précision. Gain estimé : 70% sur les périodes d'attente.
- **Intervalle plus raisonnable en course.** On envoyait la position toutes les 3 secondes quand le chauffeur allait chercher le client. C'était le niveau Uber pour de la course de luxe, overkill pour TaxiLink. Passé à 8 secondes.
- **iOS** : on autorise maintenant l'iPhone à mettre l'app en pause quand le téléphone ne bouge pas (chauffeur arrêté à un feu, à un rendez-vous). Ça reprend automatiquement au mouvement.

---

## 4. "Les notifications arrivent en retard"

**Le problème.** Quand un chauffeur acceptait une course, l'app envoyait UNE seule fois la notification. Si le réseau du chauffeur était mauvais à cet instant précis, la notif était perdue — le poster ne recevait rien. Et certains téléphones avaient des « tokens » (l'adresse de livraison de la notif) périmés sans qu'on le sache.

**Ce qu'on a fait.**

- **Retry automatique** : l'app essaie 3 fois avec des délais croissants (1s, 3s, 8s). Si le réseau marche dans les 12 secondes, la notif passe.
- **Nettoyage automatique des tokens morts** : quand le serveur Expo dit « ce téléphone n'existe plus », on supprime le token de la base. Plus de gaspillage à essayer d'envoyer dans le vide.

---

## 5. "Le popup d'annonce urgente n'est pas designé"

**Le problème.** Quand une nouvelle course arrivait et que le chauffeur regardait la carte, on lui affichait l'alerte système moche d'Android/iOS (le truc gris avec OK / Annuler). Pas joli, pas branded.

**Ce qu'on a fait.** Nouveau modal `IncomingMissionAlertModal` avec :

- En-tête bleu pour CPAM, jaune TaxiLink pour course privée
- Icône cloche animée
- Bloc « Départ » bien lisible
- **3 boutons** : « Refuser », « Voir détails », et « JE PRENDS » (le plus visible — appelle directement l'API d'acceptation, sans détour par la fiche)
- Vibration courte + animation de pop-in
- Gestion d'erreur : si la course a déjà été prise par quelqu'un d'autre dans la seconde, message clair

---

## 6. "L'APK est trop gros"

**Note** : 115 MB c'est en fait dans la norme (Uber 180 MB, Bolt 110 MB). Mais on peut réduire.

**Ce qu'on a fait.** Activé R8 (le compresseur de code Android, version moderne de ProGuard). Il enlève le code non utilisé au moment du build. Gain estimé : 15-25 MB. **Attention** : si le build crashe au lancement, c'est que R8 a coupé un truc qu'il fallait garder. Dans ce cas il suffira d'enlever une ligne dans `app.json`.

---

## 7. Bugs Pixel 10 Pro — symptômes listés

Suite à ta seconde liste, j'ai traité 4 bugs spécifiques :

### a) Pas de géolocalisation

- Ajout de vérifications explicites : si les services Localisation sont coupés au niveau Android, on affiche une popup avec un bouton « Ouvrir les réglages ». Avant, l'app ne disait rien.
- Même chose si la permission est refusée : popup explicite au lieu d'un échec silencieux.
- Ajout d'un **filet de sécurité** : sur certains Pixel, le mécanisme « surveille la position » d'Android ne déclenche jamais le callback (bug connu de la lib). On poll donc une position toutes les 15s en parallèle, pour ne pas rester bloqué.

### b) Les pins des offres n'apparaissent pas sur la carte

- La carte (Leaflet dans un WebView) recevait les pins avant d'être complètement prête sur Pixel 10 Pro. On a ajouté une **file d'attente** : si les pins arrivent trop tôt, ils sont stockés et envoyés dès que la carte signale qu'elle est prête. Plus de race condition.
- Ajout d'un try/catch pour ne pas crasher le rendu si jamais un pin est mal formé.

### c) Le sheet (panneau des courses) passe sous la nav bar Android

- Le panneau du bas remontait juste au niveau de la nav bar gestuelle. Sur certains téléphones c'était trop bas.
- Fix : on a remonté le panneau de **+10 pixels** partout (mode clair ET mode sombre, tous les téléphones).

### d) Les filtres se chevauchent avec « En ligne » et sortent de l'écran

- Avant : la position des chips était hardcodée à 91 pixels du haut. Sur Pixel 10 Pro la barre de statut est plus grande, donc les chips remontaient sur le bouton « En ligne ».
- Fix : on calcule maintenant la position **dynamiquement** en fonction de la taille réelle de la barre de statut du téléphone.

---

## À retenir

- 6 problèmes sur 7 résolus en code, le 7ème (Pixel) traité après tes symptômes détaillés.
- Côté serveur (admin) : déjà actif en production. Tu peux le voir maintenant.
- Côté mobile : nécessite un rebuild de l'APK (environ 20-30 min en cloud EAS).
- Test recommandé sur **plusieurs téléphones** après le rebuild : un Pixel récent, un Samsung, un appareil plus ancien (pour la mémoire RAM limitée).

> Document généré le 2026-05-18 dans le cadre de la session de débogage TaxiLink Mobile.
