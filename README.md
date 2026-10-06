# 🐰 Bounty Clicker

Jeu incrémental (clicker) avec comptes Firebase, boutique et boosts sur mobile et desktop,
arbre de prestige et multi-monnaies (gemmes / jetons).

## 🔐 Sauvegarde Firebase

Une connexion ou une inscription est nécessaire pour jouer. La progression,
les achats, les boosts et l'état du jeu sont sauvegardés dans Firestore sur le
compte Firebase; aucune sauvegarde de progression n'est écrite dans le navigateur.

À l'inscription, choisissez un compte par e-mail ou par pseudo. Les comptes
créés par pseudo ne peuvent pas recevoir de lien de récupération par e-mail.

## 🚀 Lancer le projet en local

⚠️ Le site doit être servi en **HTTP (`http://localhost`)**, jamais ouvert en
`file://` (double-clic) — sinon Firebase Auth refuse les connexions
(erreur `auth/requests-from-referer-<empty>-are-blocked`).

**Windows — le plus simple :**
double-cliquez sur `lancer-serveur.bat`, puis ouvrez <http://localhost:8000/index.html>

**Autre méthode :**
```bash
python -m http.server 8000
# ou : npx serve
```

## 📁 Structure du projet

```
├── index.html                   → Accueil / redirection
├── login.html / register.html   → Connexion / inscription (Firebase Auth)
├── dashboard.html               → Hub : choix du mode de jeu + stats
├── site.html                    → Jeu desktop avec Boutique et Boosts à droite
├── site-mobile.html             → Jeu mobile avec Boutique et Boosts
├── leaderboard.html             → Classement mondial
│
├── css/
│   ├── css-desktop.css          → Styles desktop (≥769px) + grille du jeu
│   ├── css-mobile.css           → Styles mobile (≤768px)
│   ├── autoclick-warning.css    → Overlay anti auto-click
│
├── js/
│   ├── firebase-config.js       → Configuration Firebase (projet bounty-clicker-a2404)
│   ├── firebase-config.js.example → Modèle de configuration
│   ├── auth.js                  → Inscription / connexion / déconnexion / session invitée
│   ├── database.js              → Firestore (sauvegarde, classement)
│   ├── main.js                  → Moteur de jeu (clics, CPS, rebirth, UI)
│   ├── boutique.js              → Boutique mobile
│   ├── boost.js                 → Boosts mobiles
│   ├── prestige.js              → Arbre de prestige
│   ├── currency-system.js       → Gemmes / jetons / échanges
│   ├── click-detection.js       → Détection d'auto-click
│   ├── autoclick-protection.js  → Pénalités anti auto-click
│
├── assets/
│   ├── images/                  → Images du jeu
│   └── audio/                   → Sons (clic)
│
├── archive/                     → Ancien code & doublons (supprimable — voir archive/README.txt)
├── firestore.rules              → Règles de sécurité Firestore
├── FIREBASE_SETUP.md            → Guide d'installation Firebase
├── lancer-serveur.bat           → Serveur local Windows (double-clic)
└── LICENSE
```

## 🔧 Configuration Firebase

Projet actuel : `bounty-clicker-a2404` (config dans `js/firebase-config.js`).
Guide complet : voir `FIREBASE_SETUP.md`.

## ⚠️ Domaines autorisés

Firebase Console → **Authentication** → **Settings** → **Authorized domains** :
`localhost` est autorisé par défaut ; ajoutez `127.0.0.1` si vous utilisez
VS Code Live Server, et votre domaine de production le moment venu.
