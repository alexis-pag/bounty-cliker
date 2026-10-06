/**
 * auth.js
 * Comprehensive authentication handling for Bounty Clicker.
 * Manages email/password and Google authentication for Firebase accounts.
 */

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

// Initialize Firebase Auth
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Prevent multiple simultaneous auth requests
let isAuthPending = false;
const USERNAME_AUTH_DOMAIN = 'pseudo.bounty-clicker.invalid';

function usernameToAuthEmail(username) {
  const normalized = String(username || '').trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,20}$/.test(normalized)) {
    const error = new Error('Le pseudo doit contenir de 3 à 20 lettres, chiffres, tirets ou tirets bas.');
    error.code = 'auth/invalid-username';
    throw error;
  }
  return `${normalized}@${USERNAME_AUTH_DOMAIN}`;
}

function isUsernameAuthEmail(email) {
  return String(email || '').toLowerCase().endsWith(`@${USERNAME_AUTH_DOMAIN}`);
}

function resolveAuthEmail(identifier) {
  const value = String(identifier || '').trim();
  return value.includes('@') ? value.toLowerCase() : usernameToAuthEmail(value);
}

/**
 * Register a new user with email or username and password.
 * @param {string} identifier - User email or username.
 * @param {string} password - User password.
 * @param {string} username - Chosen display name or login username.
 * @param {string} method - Identifier type: email or username.
 */
export async function register(identifier, password, username, method = 'email') {
  if (isAuthPending) return;
  isAuthPending = true;

  try {
    const usernameAccount = method === 'username';
    const authEmail = usernameAccount ? usernameToAuthEmail(identifier) : String(identifier || '').trim().toLowerCase();
    const displayName = username || (usernameAccount ? String(identifier).trim() : authEmail.split('@')[0]);
    const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
    const user = userCredential.user;
    
    if (!usernameAccount) await sendEmailVerification(user);
    
    // Initialize user profile in Firestore
    await initializeUserData(user.uid, usernameAccount ? null : authEmail, displayName, method);
    
    // Force logout until email is verified for security
    await signOut(auth);
    
    return { user };
  } catch (error) {
    console.error("Registration Error:", error.code, error.message);
    throw error;
  } finally {
    isAuthPending = false;
  }
}

/**
 * Login using an email address or username.
 * @param {string} identifier - User email address or username.
 * @param {string} password - User password.
 */
export async function login(identifier, password) {
  if (isAuthPending) return;
  isAuthPending = true;

  try {
    const authEmail = resolveAuthEmail(identifier);
    const userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
    const user = userCredential.user;
    
    // Security check: Ensure email is verified
    if (!user.emailVerified && !isUsernameAuthEmail(user.email)) {
      await signOut(auth);
      const error = new Error("Email non vérifié. Veuillez vérifier votre boîte de réception.");
      error.code = 'auth/email-not-verified';
      throw error;
    }
    
    return userCredential;
  } catch (error) {
    console.error("Login Error:", error.code, error.message);
    throw error;
  } finally {
    isAuthPending = false;
  }
}

/**
 * Login using Google OAuth provider.
 */
export async function loginWithGoogle() {
  if (isAuthPending) return;
  isAuthPending = true;

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Google accounts usually have verified emails, but we verify anyway
    if (!user.emailVerified) {
       await signOut(auth);
       const error = new Error("Email Google non vérifié.");
       error.code = 'auth/email-not-verified';
       throw error;
    }
    
    // Sync with Firestore: Create profile if it doesn't exist
    const userData = await loadUserData(user.uid);
    if (!userData) {
      await initializeUserData(user.uid, user.email, user.displayName || user.email.split('@')[0]);
    }
    
    return user;
  } catch (error) {
    console.error("Google Login Error:", error.code, error.message);
    throw error;
  } finally {
    isAuthPending = false;
  }
}

/**
 * Sends a password reset email.
 */
export async function resetPassword(email) {
  if (!email) throw new Error("Email requis pour la réinitialisation.");
  try {
    if (!String(email).includes('@')) {
      throw new Error("La récupération par e-mail n'est pas disponible pour les comptes créés avec un pseudo.");
    }
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Password Reset Error:", error.code, error.message);
    throw error;
  }
}

/**
 * Resends verification email for unverified accounts.
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
    console.error("Verification Resend Error:", error.code, error.message);
    throw error;
  }
}

/**
 * Global logout function.
 * For a guest session, simply clears the local save and returns to the home page.
 */
export async function logout() {
  try {
    await signOut(auth);
    // Use replace to prevent back-button loops
    window.location.replace("login.html");
  } catch (error) {
    console.error("Logout Error:", error);
  }
}

/**
 * Monitors Firebase authentication state and handles redirections.
 * Falls back to a guest session when enabled, so playing never requires an account.
 * @param {function} onUserReady - Callback when user is available and verified.
 * @param {boolean} redirectIfNull - Automatically redirect to login if no session found.
 */
export function checkAuth(onUserReady, redirectIfNull = true) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (user.emailVerified || isUsernameAuthEmail(user.email)) {
        if (onUserReady) onUserReady(user);
      } else {
        if (redirectIfNull) {
          window.location.replace("login.html");
        } else if (onUserReady) {
          onUserReady(user);
        }
      }
      return;
    }

    if (redirectIfNull) {
      window.location.replace("login.html");
    } else if (onUserReady) {
      onUserReady(null);
    }
  });
}
