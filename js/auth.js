/**
 * auth.js
 * Comprehensive authentication handling for Bounty Clicker.
 * Manages email/password registration, Google login, and session monitoring.
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

/**
 * Register a new user with email and password.
 * @param {string} email - User email address.
 * @param {string} password - User password.
 * @param {string} username - Chosen display name.
 */
export async function register(email, password, username) {
  if (isAuthPending) return;
  isAuthPending = true;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Trigger email verification immediately
    await sendEmailVerification(user);
    
    // Initialize user profile in Firestore
    await initializeUserData(user.uid, email, username);
    
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
 * Standard email/password login.
 * @param {string} email - User email address.
 * @param {string} password - User password.
 */
export async function login(email, password) {
  if (isAuthPending) return;
  isAuthPending = true;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Security check: Ensure email is verified
    if (!user.emailVerified) {
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
 * Monitors authentication state and handles redirections.
 * @param {function} onUserReady - Callback when user is available and verified.
 * @param {boolean} redirectIfNull - Automatically redirect to login if no session found.
 */
export function checkAuth(onUserReady, redirectIfNull = true) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (user.emailVerified) {
        if (onUserReady) onUserReady(user);
      } else {
        if (redirectIfNull) {
          window.location.replace("login.html");
        } else if (onUserReady) {
          onUserReady(user);
        }
      }
    } else if (redirectIfNull) {
      window.location.replace("login.html");
    } else if (onUserReady) {
      onUserReady(null);
    }
  });
}
