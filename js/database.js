import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { app } from "./firebase-config.js";

export const db = getFirestore(app);

/**
 * Initialiser les données d'un nouvel utilisateur
 */
export async function initializeUserData(uid, email, customUsername) {
  const userRef = doc(db, "users", uid);
  const username = customUsername || email.split('@')[0]; // On utilise le pseudo choisi ou le début de l'email
  
  const initialData = {
    profile: {
      email: email,
      username: username,
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
      unlockedUpgrades: [],
      rebirthPrice: 1000000,
      storeItems: [],
      boosts: []
    },
    portfolio: {
      shares: 0,
      averageBuyPrice: 0,
      totalInvested: 0,
      reservedCarrots: 0,
      reservedShares: 0
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
  
  // Initialiser aussi son entrée dans le classement
  await updateLeaderboard(uid, username, 0);
}

/**
 * Mettre à jour le classement
 */
export async function updateLeaderboard(uid, username, score, rebirths = 0) {
  // Vérification de l'URL de production pour éviter le classement local
  const PROD_URL = "https://alexis-pag.github.io/bounty-cliker/";
  if (!window.location.href.startsWith(PROD_URL)) {
    console.warn("Leaderboard update ignored: application is not running on the production URL.");
    return;
  }

  try {
    const leaderRef = doc(db, "leaderboard", uid);
    await setDoc(leaderRef, {
      username: username,
      score: Math.floor(score),
      rebirths: rebirths || 0,
      lastUpdate: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Erreur mise à jour classement:", error);
  }
}

/**
 * Écouter le Top 50 en temps réel
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
  });
}

/**
 * Écouter le Marché Global en temps réel
 */
export function listenToMarket(callback) {
  const marketRef = doc(db, "market", "carrotMarket");
  return onSnapshot(marketRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      // Marché non initialisé
      callback(null);
    }
  });
}

/**
 * Mettre à jour le prix du marché
 */
export async function updateMarketData(currentPrice, history, extraData = {}) {
  const marketRef = doc(db, "market", "carrotMarket");
  await setDoc(marketRef, {
    currentPrice: currentPrice,
    history: history,
    lastUpdate: serverTimestamp(),
    ...extraData
  }, { merge: true });
}

/**
 * Mettre à jour le portfolio joueur
 */
export async function updatePlayerPortfolio(uid, portfolioUpdates, countChange) {
  const userRef = doc(db, "users", uid);
  const updates = {
    portfolio: portfolioUpdates,
    "gameData.count": increment(countChange),
    "modifications.lastUpdated": serverTimestamp()
  };
  await updateDoc(userRef, updates);
}

/**
 * Sauvegarder les données de jeu
 * Utilise setDoc avec merge:true pour créer le doc s'il n'existe pas
 */
export async function saveUserData(uid, data, username = null) {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      gameData: data,
      modifications: {
        lastUpdated: serverTimestamp()
      }
    }, { merge: true });
    
    // Si on a un username, on met à jour le classement en même temps
    if (username) {
      await updateLeaderboard(uid, username, data.count, data.rebirths || 0);
    }
  } catch (error) {
    console.error("Erreur de sauvegarde:", error);
    throw error;
  }
}

/**
 * Charger les données utilisateur
 */
export async function loadUserData(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.warn("Aucune donnée trouvée pour cet utilisateur.");
      return null;
    }
  } catch (error) {
    console.error("Erreur de chargement:", error);
    throw error;
  }
}

/**
 * Mettre à jour le score et les violations après détection d'anti-click
 */
export async function syncCorrectionToFirebase(uid, newCount, violations) {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      "gameData.count": newCount,
      "gameData.violations": violations,
      "modifications.lastUpdated": serverTimestamp()
    });
    console.log("Correction Firebase effectuée :", newCount);
  } catch (error) {
    console.error("Erreur syncCorrectionToFirebase:", error);
  }
}
/**
 * Mettre à jour des données spécifiques
 */
export async function updateUserData(uid, path, value) {
  try {
    const userRef = doc(db, "users", uid);
    const update = {};
    update[path] = value;
    update["modifications.lastUpdated"] = serverTimestamp();
    await setDoc(userRef, update, { merge: true });
  } catch (error) {
    console.error("Erreur de mise à jour:", error);
    throw error;
  }
}
