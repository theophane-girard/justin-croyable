import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

export const FIREBASE_AUTH = 'FIREBASE_AUTH';

export type FirebaseCredentials = {
  readonly projectId: string;
  readonly clientEmail: string;
  readonly privateKey: string;
};

function normalizePrivateKey(rawKey: string): string {
  return rawKey.replace(/\\n/g, '\n');
}

export function createFirebaseAuth(credentials: FirebaseCredentials): Auth {
  const app: App =
    getApps().at(0) ??
    initializeApp({
      credential: cert({
        projectId: credentials.projectId,
        clientEmail: credentials.clientEmail,
        privateKey: normalizePrivateKey(credentials.privateKey),
      }),
    });
  return getAuth(app);
}
