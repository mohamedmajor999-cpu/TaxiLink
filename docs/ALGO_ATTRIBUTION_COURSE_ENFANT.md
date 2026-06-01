# Comment TaxiLink trouve le bon chauffeur — expliqué à un enfant de 10 ans

> Ce document explique en mots simples l'algorithme d'attribution des courses
> de TaxiLink, validé le 2026-05-07, avant qu'on commence à le coder.
> À relire si tu veux te rappeler comment ça marche, sans avoir à lire du code.

---

## 1. Le problème qu'on essaye de résoudre

Un papi malade doit aller à l'hôpital dans **5 minutes**. Le patron de la
compagnie de taxi reçoit l'appel. Il y a 30 chauffeurs dans son carnet.
**Lequel choisir ?** Et **comment lui dire** sans appeler les 30 un par un ?

C'est le boulot de l'algorithme. Il choisit, il prévient, il vérifie que
quelqu'un a accepté. Tout en moins d'une minute.

---

## 2. L'idée principale : les ronds dans la mare

Quand on jette une pierre dans une mare, ça fait des ronds qui s'agrandissent.
**Plouf.** D'abord un petit rond. Puis un plus grand. Puis encore plus grand.

Notre algorithme fait pareil. Quand le patron poste une course :

```
                Le papi attend ici
                       |
                       v

                       o          <- au début, petit rond
                  (   o   )       <- puis plus grand
              (       o       )   <- puis encore plus grand
```

**Seuls les chauffeurs DANS le rond voient la course.**

Ceux en dehors du rond, leur téléphone ne sonne pas. Ils ne savent même pas
qu'il y a une course. Pas de notification, rien.

---

## 3. La taille du rond dépend du temps qu'on a

C'est le truc le plus malin du système. Si le papi a rendez-vous **dans 5 min**,
ça sert à rien de prévenir un chauffeur à 20 km : il pourra **jamais** arriver
à temps. C'est physique.

Donc on commence avec un rond de la **bonne taille** :

| Le papi est pris dans... | Premier rond |
|---|---|
| moins de 5 minutes | 3 km |
| 5 à 10 minutes | 6 km |
| 10 à 20 minutes | 12 km |
| 20 à 40 minutes | 20 km |
| 40 minutes à 2 heures | 30 km (maximum) |
| Plus de 2 heures | tout le département |
| Plus de 24 heures | la journée entière (pas urgent) |

Plus c'est urgent, plus on commence petit. Plus on a le temps, plus on cherche
loin.

---

## 4. Comment le rond grandit

Le rond ne reste pas figé. Toutes les **20 secondes**, si personne n'a cliqué
sur "Je prends", **le rond grandit d'un cran**.

```
Seconde 0    : rond de 3 km    -> 2 chauffeurs voient
Seconde 20   : rond de 6 km    -> 5 chauffeurs voient
Seconde 40   : rond de 12 km   -> 12 chauffeurs voient
Seconde 60   : rond de 20 km   -> 24 chauffeurs voient
Seconde 80   : rond de 30 km   -> tout le monde du coin voit
```

Quelqu'un finit toujours par accepter, en moins d'une minute en général.

**Quand un chauffeur clique "Je prends"**, c'est terminé. La course lui est
attribuée. Tous les autres chauffeurs voient sur leur téléphone : "Course déjà
prise par un autre chauffeur."

---

## 5. Et si le rond est vide ?

Imagine qu'à minuit, le rond de 3 km autour du papi a **zéro chauffeur**.
Personne ne dort dans son taxi avec le téléphone allumé.

Dans ce cas, **on n'attend pas 20 secondes pour rien**. On saute tout de suite
au rond suivant. Et au suivant si lui aussi est vide. Jusqu'à trouver un rond
avec au moins un chauffeur dedans.

C'est logique : pourquoi faire poireauter le papi si on sait qu'il n'y a
personne près de lui ?

---

## 6. Comment on mesure la distance (en vrai)

On pourrait mesurer "à vol d'oiseau" (en ligne droite sur la carte). C'est
rapide à calculer mais ça ment :

- 3 km à vol d'oiseau sur une autoroute = **4 minutes en voiture**
- 3 km à vol d'oiseau dans le Vieux-Marseille avec les sens interdits =
  **15 minutes en voiture**

Donc on utilise un vrai calculateur d'itinéraire (qui s'appelle **OSRM**).
Il connaît :

- Les rues
- Les sens uniques
- Les feux rouges
- Les ronds-points

Et il dit : "Du point A au point B en voiture, ça prend X minutes."
**C'est cette vraie distance-temps qui compte**, pas la ligne droite.

---

## 7. Le système de points pour ceux qui perdent toujours

Imagine deux chauffeurs **exactement à la même distance** du papi. Lequel a
la course ? Le plus rapide à appuyer sur le bouton "Je prends".

Mais y a un truc injuste : un chauffeur peut **perdre la guerre du clic** plein
de fois de suite. Il essaie, il appuie, mais quelqu'un est toujours plus rapide.
À la fin il est triste et il abandonne TaxiLink.

Donc on lui donne un **petit cadeau de consolation**.

### Comment ça marche

Quand un chauffeur **a essayé mais a perdu** parce qu'un autre a cliqué avant
lui, on lui donne **5 secondes d'avance** pour la prochaine course :

- Course suivante : il voit la course **5 secondes avant** les autres dans
  le même rond. Il a 5 secondes tout seul pour cliquer.
- S'il perd encore : la fois d'après, il a **10 secondes** d'avance.

### Les règles du cadeau de consolation

- **Maximum 10 secondes** d'avance (même s'il a perdu 50 fois). Sinon il
  raflerait toujours tout, ce serait l'inverse de l'injustice.
- **Dès qu'il gagne une course** : le compteur revient à 0. Il n'a plus
  d'avance jusqu'à ce qu'il reperde.
- **Si 7 jours passent sans rien** (ni gagner ni reperdre) : le cadeau s'efface.
  Comme ça un chauffeur qui part en vacances ne revient pas avec un méga-bonus
  injuste pour les autres.

### Ce qui ne compte PAS comme "avoir perdu"

Important : le cadeau est **uniquement** pour ceux qui ont **vraiment essayé**.

| Situation | Cadeau ? |
|---|---|
| Il a vu la notif et un autre a cliqué avant | OUI |
| Il a vu la notif et a cliqué "Refuser" | non (c'est son choix) |
| Il a ignoré la notif (rien fait) | non |
| Il était hors ligne | non (c'est son choix d'être hors ligne) |
| Il a accepté puis annulé | non (c'est même un malus) |

Comme ça, personne ne peut tricher en faisant exprès de "rater" pour avoir
des cadeaux.

---

## 8. Les groupes : qui voit les courses ?

Sur TaxiLink, les chauffeurs sont rangés dans des **groupes** (comme des
groupes WhatsApp). Exemple :

- "Standards Marseille Sud" (12 chauffeurs)
- "VSL Réseau 13" (47 chauffeurs)
- "Partenaires Hôpital Nord" (18 chauffeurs)

Quand le patron poste une course, **il choisit dans QUELS groupes**. Et
**seuls les chauffeurs de ces groupes** peuvent voir la course (s'ils sont
dans le rond, en plus).

**Les ronds élargissent la visibilité À L'INTÉRIEUR des groupes choisis.**
Pas à l'extérieur. Si le patron a posté seulement dans "Standards Marseille
Sud", aucun chauffeur des autres groupes ne voit jamais la course, même
si le rond fait 30 km.

**Si personne dans les groupes choisis ne prend** la course, le système
prévient le patron. Et c'est **lui** qui décide d'ajouter d'autres groupes
ou pas. Le système ne le fait jamais tout seul.

---

## 9. Les blocages entre chauffeurs

Parfois, deux chauffeurs ne s'aiment pas. Ou un patron ne veut plus qu'un
certain employé prenne ses courses. On peut les bloquer.

### Cas 1 : deux chauffeurs entre eux (même niveau)

Si Marc bloque Léa :
- Léa ne voit plus les courses postées par Marc
- Marc ne voit plus les courses postées par Léa
- C'est **symétrique** (les deux sont coupés l'un de l'autre)

### Cas 2 : un patron et son employé

Le patron est le chef. Donc :
- **Le patron PEUT bloquer un de ses employés** (l'employé ne verra plus
  les courses du patron)
- **L'employé NE PEUT PAS bloquer son patron** (sinon il ne verrait plus
  ses propres courses, ce serait absurde)

Dans l'application, le bouton "Bloquer" est **grisé** quand un employé
essaie de bloquer son patron. Il ne peut juste pas.

---

## 10. Ce qu'on NE fait PAS (et pourquoi c'est bien)

Pour qu'on ne soit pas tenté de tout compliquer plus tard, voici ce qu'on
**refuse** d'ajouter :

### Pas de notes par étoiles

Les patients ne notent pas les chauffeurs avec des étoiles. C'est pas Uber.
On regarde seulement si le chauffeur **fait son boulot** : il accepte les
courses, il les finit, il n'annule pas.

### Pas de système de points compliqué à 100 points

On a hésité à faire un truc avec 4 catégories et 100 points qui calculent
plein de trucs. **C'est trop compliqué pour le nombre de chauffeurs qu'on a.**
On commence simple, on rajoute si vraiment besoin un jour.

### Pas de cascade automatique vers d'autres groupes

Si la course n'est pas prise dans les groupes choisis, **le système n'envoie
pas tout seul** dans d'autres groupes. Il prévient le patron, et c'est le
patron qui décide. Le patron garde le contrôle.

### Pas de "chauffeur N°1, puis N°2 chacun son tour"

On a hésité à faire comme Uber : prévenir un seul chauffeur à la fois,
chacun son tour pendant 20 secondes. **Trop lent quand y a peu de chauffeurs.**
On préfère prévenir tous ceux qui sont dans le rond en même temps.

---

## 11. Résumé en une phrase

> **Quand le patron poste une course, on dessine un rond autour du papi.
> Seuls les chauffeurs DANS ce rond et DANS les bons groupes voient la course.
> Si personne ne clique en 20 secondes, le rond grandit. Le premier qui
> clique gagne. Et ceux qui perdent souvent ont quelques secondes d'avance
> la fois d'après pour être consolés.**

C'est tout.

---

## 12. Pour les grands : ce qu'on doit construire

Quatre choses, dans l'ordre :

1. **Phase 1 — Savoir où sont les chauffeurs en temps réel.**
   Quand un chauffeur est en service, son téléphone envoie sa position GPS
   toutes les 30 secondes. Sans ça, on ne peut pas calculer les ronds.

2. **Phase 2 — Faire grandir le rond.**
   Quand une course est postée, un robot vérifie toutes les 20 secondes :
   "Quelqu'un a-t-il accepté ? Si non, j'agrandis le rond." Et il envoie
   les notifications aux chauffeurs nouvellement dans le rond.

3. **Phase 3 — Le cadeau de consolation.**
   Compter qui a perdu la guerre du clic, lui donner X secondes d'avance
   la fois d'après, et faire baisser le compteur quand il faut.

4. **Phase 4 — Les blocages entre chauffeurs.**
   La table dans la base de données qui dit qui a bloqué qui, avec la
   règle spéciale patron/employé.

On commence par la Phase 1 parce que sans elle, **rien d'autre ne peut
fonctionner**.

---

*Document écrit le 2026-05-07, juste avant qu'on commence à coder.*
