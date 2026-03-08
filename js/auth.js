// script/auth.js
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { app } from "./firebase-config.js";
import { initializeUserData } from "./database.js";

// Initialisation Firebase
export const auth = getAuth(app);

/**
 * Inscription utilisateur
 */
export async function register(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Initialisation Firestore via database.js
    await initializeUserData(user.uid, email);
    
    return { user };
  } catch (error) {
    throw error;
  }
}

/**
 * Connexion utilisateur
 */
export async function login(email, password) {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
}

/**
 * Déconnexion
 */
export async function logout() {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
  }
}

/**
 * Vérifier l'état de connexion et rediriger si nécessaire
 */
export function checkAuth(onUserReady, redirectIfNull = true) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (onUserReady) onUserReady(user);
    } else if (redirectIfNull) {
      window.location.href = "login.html";
    }
  });
}
