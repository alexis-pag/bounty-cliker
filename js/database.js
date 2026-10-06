/**
 * database.js
 * Centralized Firebase Firestore operations for Bounty Clicker.
 * Handles user data, leaderboards, and admin systems with robust error handling.
 */

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { app } from "./firebase-config.js";

// Initialize Firestore instance
export const db = getFirestore(app);

/**
 * Initializes data for a new user in Firestore.
 * @param {string} uid - User unique identifier.
 * @param {string|null} email - User email, or null for pseudo-only accounts.
 * @param {string} customUsername - Optional chosen username.
 * @param {string} loginMethod - Account identifier type.
 */
export async function initializeUserData(uid, email, customUsername, loginMethod = "email") {
  if (!uid) throw new Error("Missing required parameters for user initialization.");

  try {
    const userRef = doc(db, "users", uid);
    const username = customUsername || email?.split('@')[0] || "Joueur";
    
    const initialData = {
      profile: {
        email: email || null,
        username: username,
        loginMethod,
        createdAt: serverTimestamp()
      },
      gameData: {
        count: 0,
        multiplier: 1,
        shopMultiplierBonus: 0,
        clickValue: 1,
        cps: 0,
        rebirths: 0,
        prestigePoints: 0,
        rabbitGems: 0,
        rabbitTokens: 0,
        unlockedUpgrades: [],
        unlockedCurrencyUpgrades: [],
        storeItems: [],
        boosts: [],
        autoClickLockoutExpiry: 0,
        rebirthPrice: 1000000,
        claimedRewards: []
      },
      settings: {
        theme: "dark",
        notifications: true
      },
      progress: {
        level: 1,
        achievements: []
      },
      modifications: {
        lastUpdated: serverTimestamp()
      }
    };
    
    await setDoc(userRef, initialData);
    
    // Also initialize their entry in the leaderboard
    await updateLeaderboard(uid, username, 0);
    console.log(`User data initialized for: ${uid}`);
  } catch (error) {
    console.error("Critical: User initialization failed:", error);
    throw error;
  }
}

/**
 * Updates the global leaderboard.
 * @param {string} uid - User unique identifier.
 * @param {string} username - Current username.
 * @param {number} score - Current score/currency.
 * @param {number} rebirths - Total rebirths.
 */
export async function updateLeaderboard(uid, username, score, rebirths = 0) {
  if (!uid) return;
  try {
    const leaderRef = doc(db, "leaderboard", uid);
    await setDoc(leaderRef, {
      username: username || "Anonymous",
      score: Math.floor(score) || 0,
      rebirths: rebirths || 0,
      lastUpdate: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Non-critical: Leaderboard update failed:", error);
  }
}

/**
 * Listens to the Top 50 players in real-time.
 * @param {function} callback - Function called on data update.
 * @returns {function} Unsubscribe function.
 */
export function listenToLeaderboard(callback) {
  const q = query(
    collection(db, "leaderboard"),
    orderBy("score", "desc"),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const players = [];
    snapshot.forEach((doc) => {
      players.push({ id: doc.id, ...doc.data() });
    });
    callback(players);
  }, (error) => {
    console.error("Leaderboard subscription error:", error);
  });
}

/**
 * Saves game progress to Firestore.
 * @param {string} uid - User unique identifier.
 * @param {Object} data - Game state data.
 * @param {string} username - Optional username update.
 */
export async function saveUserData(uid, data, username = null) {
  if (!uid || !data) return;

  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      gameData: data,
      modifications: {
        lastUpdated: serverTimestamp()
      }
    }, { merge: true });
    
    if (username) {
      await updateLeaderboard(uid, username, data.count, data.rebirths || 0);
    }
  } catch (error) {
    console.error("Save operation failed:", error);
    throw error;
  }
}

/**
 * Loads user data from Firestore.
 * @param {string} uid - User unique identifier.
 * @returns {Promise<Object|null>} User data or null.
 */
export async function loadUserData(uid) {
  if (!uid) return null;

  try {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Load operation failed:", error);
    throw error;
  }
}

/**
 * Updates score and violations (anti-cheat).
 */
export async function syncCorrectionToFirebase(uid, newCount, violations) {
  if (!uid) return;

  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      "gameData.count": newCount,
      "gameData.violations": violations,
      "modifications.lastUpdated": serverTimestamp()
    });
  } catch (error) {
    console.error("Anti-cheat sync failed:", error);
  }
}

/**
 * Listens to administrative commands for a user.
 */
export function listenToAdminCommands(uid, callback) {
  if (!uid) return () => {};
  const q = query(
    collection(db, "admin_commands"),
    where("targetUid", "in", [uid, "ALL"])
  );
  
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const cmd = { id: change.doc.id, ...change.doc.data() };
        if (cmd.status === "pending") {
          callback(cmd);
        }
      }
    });
  });
}

/**
 * Marks an admin command as processed.
 */
export async function markAdminCommandProcessed(cmdId) {
  if (!cmdId) return;
  try {
    const cmdRef = doc(db, "admin_commands", cmdId);
    await updateDoc(cmdRef, { status: "processed" });
  } catch (error) {
    console.error("Command processing update failed:", error);
  }
}

/**
 * Generic update for user data fields.
 */
export async function updateUserData(uid, path, value) {
  if (!uid || !path) return;

  try {
    const userRef = doc(db, "users", uid);
    const update = {};
    update[path] = value;
    update["modifications.lastUpdated"] = serverTimestamp();
    await setDoc(userRef, update, { merge: true });
  } catch (error) {
    console.error(`Update failed for path ${path}:`, error);
    throw error;
  }
}

/**
 * ADMINISTRATIVE REWARD SYSTEM
 */

export async function sendAdminReward(adminUid, targetUid, rewardData) {
  if (!adminUid || !targetUid || !rewardData) throw new Error("Missing data for reward delivery.");
  try {
    const rewardsRef = collection(db, "pending_rewards");
    const rewardDoc = {
      adminUid,
      targetUid,
      rewardData,
      status: "active",
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(rewardsRef, rewardDoc);
    await logAdminAction(adminUid, "SEND_REWARD", { target: targetUid, reward: rewardData, rewardId: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Reward delivery failed:", error);
    throw error;
  }
}

export function listenToPendingRewards(uid, callback) {
  if (!uid) return () => {};
  const q = query(
    collection(db, "pending_rewards"),
    where("targetUid", "in", [uid, "ALL"]),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const rewards = [];
    snapshot.forEach((doc) => {
      rewards.push({ id: doc.id, ...doc.data() });
    });
    callback(rewards);
  });
}

export async function claimAdminReward(uid, rewardId) {
  if (!uid || !rewardId) return null;
  try {
    const userRef = doc(db, "users", uid);
    const rewardRef = doc(db, "pending_rewards", rewardId);
    
    const rewardDoc = await getDoc(rewardRef);
    if (!rewardDoc.exists()) throw new Error("Reward document not found.");
    
    const data = rewardDoc.data();
    
    if (data.targetUid === "ALL") {
      await updateDoc(userRef, { "gameData.claimedRewards": arrayUnion(rewardId) });
    } else {
      await updateDoc(rewardRef, { status: "claimed", claimedBy: uid, claimedAt: serverTimestamp() });
    }
    
    return data.rewardData;
  } catch (error) {
    console.error("Reward claim failed:", error);
    throw error;
  }
}

export async function logAdminAction(adminUid, action, details) {
  if (!adminUid || !action) return;
  try {
    const logsRef = collection(db, "admin_logs");
    await addDoc(logsRef, { adminUid, action, details, timestamp: serverTimestamp() });
  } catch (error) {
    console.error("Admin logging failed:", error);
  }
}
