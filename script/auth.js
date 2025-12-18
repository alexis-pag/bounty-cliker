// script/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged as _onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBxEuc36jSRacu6SzIhhdjVWvb53UXl5KI",
  authDomain: "bounty-clicker-a2404.firebaseapp.com",
  projectId: "bounty-clicker-a2404",
  storageBucket: "bounty-clicker-a2404.firebasestorage.app",
  messagingSenderId: "1015535363894",
  appId: "1:1015535363894:web:09a0649a01ec20bd3cf597"
};

// Initialisation
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

// Surveille l'état de connexion
export function onUserReady(callback) {
  _onAuthStateChanged(auth, user => {
    if (user) callback(user);
    else window.location.href = "login.html";
  });
}

// FIRESTORE: Récupération et sauvegarde des données
export async function getGameData(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().gameData;
  } else {
    const initialData = { counter: 0, cps: 0, boosts: [], items: {}, lastSaved: Date.now() };
    await setDoc(docRef, { gameData: initialData });
    return initialData;
  }
}

export async function saveGameData(uid, gameData) {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, { gameData: { ...gameData, lastSaved: Date.now() } });
}

// Sauvegarde automatique toutes les 5 secondes
export function autoSave(uid, getCurrentGameData, interval = 5000) {
  setInterval(async () => {
    const data = getCurrentGameData();
    if (data) await saveGameData(uid, data);
  }, interval);
}
