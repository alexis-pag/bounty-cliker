# Guide d'installation Firebase - Bounty Clicker

## 1. Création du projet Firebase
1. Allez sur la [Console Firebase](https://console.firebase.google.com/).
2. Cliquez sur **Ajouter un projet** et donnez-lui un nom (ex: `Bounty Clicker`).
3. (Optionnel) Désactivez Google Analytics pour ce projet.

## 2. Configuration de l'Authentification
1. Dans le menu de gauche, allez dans **Build** > **Authentication**.
2. Cliquez sur **Get Started**.
3. Dans l'onglet **Sign-in method**, cliquez sur **Email/Password**.
4. Activez l'option **Email/Password** et enregistrez.

## 3. Configuration de Firestore (Base de données)
1. Dans le menu de gauche, allez dans **Build** > **Firestore Database**.
2. Cliquez sur **Create database**.
3. Choisissez un mode (Commencez en **Test mode** pour le développement, puis appliquez les règles de sécurité ci-dessous).
4. Choisissez une localisation proche de vous.
5. **IMPORTANT** : Si Firestore n'est pas activé, l'inscription échouera.

## 4. Configuration de l'Application Web
1. Sur la page d'accueil du projet, cliquez sur l'icône **Web** (`</>`).
2. Enregistrez l'application (ex: `Bounty Clicker Web`).
3. Copiez l'objet `firebaseConfig` fourni par Firebase.
4. Ouvrez le fichier `script/firebase-config.js` de votre projet et remplacez le contenu par votre configuration.

## 5. Règles de sécurité Firestore
Allez dans l'onglet **Rules** de votre base de données Firestore et copiez-collez les règles suivantes :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // --- RÈGLES ADMIN (DÉVELOPPEMENT) ---
    match /admin_commands/{cmdId} { allow read, write: if true; }
    match /admin_logs/{logId} { allow read, write: if true; }
    match /pending_rewards/{rewardId} { allow read, write: if true; }

    // --- RÈGLES UTILISATEURS ---
    // Profils utilisateurs : Seul le propriétaire peut lire/écrire
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Classement : Tout le monde peut lire, seul le propriétaire peut modifier son score
    match /leaderboard/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Marché : Tout le monde peut lire, les utilisateurs connectés peuvent mettre à jour
    match /market/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Ordres : Seul le propriétaire peut voir et gérer ses propres ordres
    match /orders/{orderId} {
      allow read, write: if request.auth != null && (
        (resource == null && request.resource.data.userId == request.auth.uid) || 
        (resource != null && resource.data.userId == request.auth.uid)
      );
    }
    
    // Historique des transactions : Tout le monde peut lire
    match /trades/{tradeId} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## 6. Utilisation Multi-Site
Pour que vos deux sites utilisent le même système de compte :
1. Utilisez **exactement le même `firebaseConfig`** sur les deux sites.
2. Assurez-vous que les fichiers `auth.js` et `database.js` sont présents sur les deux sites.
3. Les données seront automatiquement partagées puisque Firebase utilise le même `projectId`.
