import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBxEuc36jSRacu6SzIhhdjVWvb53UXl5KI",
  authDomain: "bounty-clicker-a2404.firebaseapp.com",
  projectId: "bounty-clicker-a2404",
  storageBucket: "bounty-clicker-a2404.firebasestorage.app",
  messagingSenderId: "1015535363894",
  appId: "1:1015535363894:web:09a0649a01ec20bd3cf597"
};

// Singleton initialization
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
