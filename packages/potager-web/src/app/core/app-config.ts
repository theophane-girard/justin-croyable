
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const FIREBASE_PLACEHOLDER_PREFIX = 'A_REMPLACER';
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAJQtpobzZCDWU7B7JmBqI6jvINxjSRp5Q",
  authDomain: "justin-croyable-story.firebaseapp.com",
  projectId: "justin-croyable-story",
  storageBucket: "justin-croyable-story.firebasestorage.app",
  messagingSenderId: "956067265057",
  appId: "1:956067265057:web:20a72394a25f8e0a428160",
  measurementId: "G-TBNFPQVSVV"
};

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const analytics = getAnalytics(app);

export const API_BASE_URL = 'http://localhost:3000';

export const AUTH_GATE_ENABLED = !FIREBASE_CONFIG.apiKey.startsWith(FIREBASE_PLACEHOLDER_PREFIX);
