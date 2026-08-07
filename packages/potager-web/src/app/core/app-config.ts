const FIREBASE_PLACEHOLDER_PREFIX = 'A_REMPLACER';

export const FIREBASE_CONFIG = {
  apiKey: 'A_REMPLACER_FIREBASE_API_KEY',
  authDomain: 'a-remplacer.firebaseapp.com',
  projectId: 'a-remplacer',
  appId: 'A_REMPLACER_APP_ID',
} as const;

export const API_BASE_URL = 'http://localhost:3000';

export const AUTH_GATE_ENABLED = !FIREBASE_CONFIG.apiKey.startsWith(FIREBASE_PLACEHOLDER_PREFIX);
