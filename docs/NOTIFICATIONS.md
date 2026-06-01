# Les notifications du chauffeur 🔔

Quand est-ce que le tel du chauffeur fait du bruit ?
Voici les 5 cas.

---

## 1️⃣ Nouvelle course dispo près de toi

**Le tel BIPE même si l'app est fermée** ✅

```
┌─────────────────────────────────┐
│ 🚖 TaxiLink                     │
│                                 │
│   Nouvelle course               │
│   Départ : 12 rue de la Paix    │
│                                 │
└─────────────────────────────────┘
        ↑ écran de verrouillage
```

🎯 **Comment ?** Quelqu'un poste une course dans **ton département** → le serveur envoie un message à Expo → Expo dit à Google/Apple → ton tel bipe.

---

## 2️⃣ Pareil mais en POPUP (si app ouverte)

**Grosse boîte au milieu de l'écran**

```
        ┌──────────────────────┐
        │  Nouvelle course     │
        │                      │
        │  Départ :            │
        │  12 rue de la Paix   │
        │                      │
        │  [Plus tard]  [Voir] │
        └──────────────────────┘
```

🎯 Pareil que le #1, mais **en plus** quand l'app est déjà ouverte.

---

## 3️⃣ Une course RIEN QUE POUR TOI

**Grosse carte avec compte à rebours** ⏱️

```
  ┌────────────────────────────────┐
  │ 🎯 Course pour toi !           │
  │                                │
  │  📍 12 rue de la Paix          │
  │  🏁 Gare de Lyon               │
  │  💰 35€                        │
  │                                │
  │       ⏱️ 18 secondes            │
  │                                │
  │  [ Refuser ]    [ Accepter ]   │
  └────────────────────────────────┘
```

🎯 **Comment ?** Le serveur t'a choisi TOI (le plus proche) → l'app check toutes les 5 secondes s'il y a une offre pour toi.

---

## 4️⃣ Quelqu'un a pris TON annonce

**Point rouge dans l'app** 🔴 (pas de bip)

```
  ┌────────────────────────────┐
  │  ☰  TaxiLink         🔴    │
  │                            │
  │  [Courses]  [Annonces 🔴] │
  │                            │
  │  ✅ Marc a pris ta course  │
  │     Paris → Lyon           │
  └────────────────────────────┘
```

🎯 Quand tu postes une course (parce que tu peux pas la faire), et qu'un pote chauffeur l'accepte.

⚠️ **Pas de bip système pour l'instant** — tu vois le point rouge **seulement si tu ouvres l'app**.

---

## 5️⃣ Ton annonce trouve PAS preneur

**Point orange dans l'app** 🟠 (pas de bip)

```
  ┌────────────────────────────┐
  │  ☰  TaxiLink               │
  │                            │
  │  ⚠️ Annonce stuck           │
  │  Paris → Lyon              │
  │  Personne l'a prise        │
  │  depuis 2 minutes          │
  └────────────────────────────┘
```

🎯 Après **2 minutes** sans preneur → badge dans l'app.

---

## 📊 Tableau récap

| # | Cas                              | Tel bipe ?  |
|---|----------------------------------|-------------|
| 1 | Nouvelle course département      | ✅ OUI       |
| 2 | Popup nouvelle course            | ❌ NON       |
| 3 | Offre rien que pour toi          | ❌ NON       |
| 4 | Ton annonce acceptée             | ❌ NON       |
| 5 | Ton annonce pas prise            | ❌ NON       |

**👉 1 seul cas fait biper le tel app fermée : la nouvelle course.**

---

## 🔧 À améliorer

Les cas 3, 4, 5 mériteraient un vrai bip système.
Le code de `usePostedMissionAcceptNotifier` le note déjà :
*"à ajouter avec expo-notifications dans un round suivant"*.
