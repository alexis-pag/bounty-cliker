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
    match /users/{userId} {
      // Seul l'utilisateur propriétaire peut lire ou modifier ses propres données
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 6. Utilisation Multi-Site
Pour que vos deux sites utilisent le même système de compte :
1. Utilisez **exactement le même `firebaseConfig`** sur les deux sites.
2. Assurez-vous que les fichiers `auth.js` et `database.js` sont présents sur les deux sites.
3. Les données seront automatiquement partagées puisque Firebase utilise le même `projectId`.
