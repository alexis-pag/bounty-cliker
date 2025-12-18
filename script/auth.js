// script/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Configuration Firebase (remplace par ta config)
const firebaseConfig = {
  apiKey: "AIzaSyBxEuc36jSRacu6SzIhhdjVWvb53UXl5KI",
  authDomain: "bounty-clicker-a2404.firebaseapp.com",
  projectId: "bounty-clicker-a2404",
  storageBucket: "bounty-clicker-a2404.firebasestorage.app",
  messagingSenderId: "1015535363894",
  appId: "1:1015535363894:web:09a0649a01ec20bd3cf597"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Fonctions pratiques pour l'authentification
export function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

// Redirection si l'utilisateur n'est pas connecté
export function guard() {
  onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "login.html";
  });
}

// Écoute de l'état de connexion pour récupérer les données si nécessaire
export function onUserReady(callback) {
  onAuthStateChanged(auth, async user => {
    if (user) {
      callback(user);
    } else {
      window.location.href = "login.html";
    }
  });
}
