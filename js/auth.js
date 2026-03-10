// script/auth.js
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { app } from "./firebase-config.js";
import { initializeUserData, loadUserData } from "./database.js";

// Initialisation Firebase
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Inscription utilisateur
 */
export async function register(email, password, username) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Envoyer l'email de confirmation
    await sendEmailVerification(user);
    
    // Initialisation Firestore via database.js
    await initializeUserData(user.uid, email, username);
    
    // Déconnexion car l'utilisateur doit d'abord confirmer son email
    await signOut(auth);
    
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (!user.emailVerified) {
      await signOut(auth);
      const error = new Error("Email non vérifié. Veuillez vérifier votre boîte de réception.");
      error.code = 'auth/email-not-verified';
      throw error;
    }
    
    return userCredential;
  } catch (error) {
    throw error;
  }
}

/**
 * Connexion avec Google
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Pour Google, on assume l'email vérifié, mais on peut forcer la vérification si besoin
    if (!user.emailVerified) {
       await signOut(auth);
       const error = new Error("Email non vérifié. Veuillez vérifier votre boîte de réception.");
       error.code = 'auth/email-not-verified';
       throw error;
    }
    
    // Vérifier si l'utilisateur existe déjà dans Firestore
    const userData = await loadUserData(user.uid);
    if (!userData) {
      // Si c'est un nouvel utilisateur Google, on l'initialise
      await initializeUserData(user.uid, user.email, user.displayName || user.email.split('@')[0]);
    }
    
    return user;
  } catch (error) {
    console.error("Erreur Google Login:", error);
    throw error;
  }
}

/**
 * Réinitialiser le mot de passe
 */
export async function resetPassword(email) {
  try {
    console.log("Tentative d'envoi d'email de réinitialisation à :", email);
    await sendPasswordResetEmail(auth, email);
    console.log("Appel Firebase sendPasswordResetEmail réussi");
    return true;
  } catch (error) {
    console.error("Erreur Firebase lors de la réinitialisation :", error);
    throw error;
  }
}

/**
 * Renvoyer l'email de vérification
 */
export async function resendVerification(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (!user.emailVerified) {
      await sendEmailVerification(user);
    }
    await signOut(auth);
    return true;
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
      if (user.emailVerified) {
        if (onUserReady) onUserReady(user);
      } else {
        // Si l'email n'est pas vérifié, on ne redirige que si redirectIfNull est vrai
        if (redirectIfNull) {
          window.location.href = "login.html";
        } else if (onUserReady) {
          // On passe quand même l'user à la callback mais on sait qu'il n'est pas vérifié
          onUserReady(user);
        }
      }
    } else if (redirectIfNull) {
      window.location.href = "login.html";
    } else if (onUserReady) {
      onUserReady(null);
    }
  });
}
